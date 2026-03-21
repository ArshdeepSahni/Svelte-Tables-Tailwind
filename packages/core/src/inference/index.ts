/**
 * @tablecraft/core — Type inference pipeline
 *
 * CORE-02: inferSchema(data) samples up to 200 rows systematically,
 * runs the detector chain per column, applies keyword boosting,
 * and returns a ColumnInferenceMap.
 *
 * Zero DOM dependencies — works in Node.js/Vitest with no browser environment.
 */

import type { ColumnInferenceMap, ColumnType, InferenceResult } from '../types.js';
import { DETECTORS, getBoostMap } from './detectors.js';

/** Confidence threshold — detectors must score >= 0.8 to claim a type */
const CONFIDENCE_THRESHOLD = 0.8;

// ---------------------------------------------------------------------------
// CORE-02: Systematic sampling
// ---------------------------------------------------------------------------

/**
 * Sample up to `maxSamples` rows from `data` using systematic (evenly-spaced) selection.
 * Systematic sampling preserves distribution for sorted or grouped data.
 *
 * - data.length <= maxSamples → returns data as-is (no sampling needed)
 * - data.length > maxSamples → step = Math.ceil(data.length / maxSamples),
 *   picks data[0], data[step], data[2*step], ... up to maxSamples rows
 *
 * Verified: 500 rows → step=3 → 167 samples. 200 rows → all 200.
 */
export function sampleRows<TRow>(data: TRow[], maxSamples = 200): TRow[] {
  if (data.length === 0) return [];
  if (data.length <= maxSamples) return data;

  const step = Math.ceil(data.length / maxSamples);
  const result: TRow[] = [];
  for (let i = 0; i < data.length && result.length < maxSamples; i += step) {
    result.push(data[i]);
  }
  return result;
}

// ---------------------------------------------------------------------------
// CORE-02: Detector chain runner
// ---------------------------------------------------------------------------

/**
 * Run the detector chain for a single column's sampled values.
 *
 * Algorithm:
 * 1. Check null/empty ratio — if > 50% null/undefined/empty, return text fallback immediately
 * 2. Compute keyword boost map from columnKey
 * 3. Iterate DETECTORS in priority order
 * 4. For each detector: apply boost, clamp to 1.0, check >= CONFIDENCE_THRESHOLD
 * 5. First detector that passes threshold wins; return its result
 * 6. If no detector passes (impossible since detectText always returns 0.5), return text fallback
 *
 * @param samples - Raw values for the column (may include null/undefined/'')
 * @param columnKey - The column key (used for keyword boosting)
 * @returns InferenceResult with type, confidence, source='inferred'|'fallback'
 */
export function runDetectors(
  samples: unknown[],
  columnKey: string
): InferenceResult {
  // Null/empty guard: if > 50% of samples are null/undefined/empty, return text fallback
  const nullCount = samples.filter(
    (v) => v === null || v === undefined || v === ''
  ).length;
  if (samples.length > 0 && nullCount / samples.length > 0.5) {
    return { type: 'text', confidence: 0.5, source: 'fallback' };
  }

  // Compute keyword boost for this column key
  const boost = getBoostMap(columnKey);

  // Run detector chain in priority order
  for (const detect of DETECTORS) {
    const result = detect(samples, columnKey);
    if (result === null) continue;

    const boostedConfidence = result.confidence + (boost[result.type as ColumnType] ?? 0);
    const clampedConfidence = Math.min(1.0, boostedConfidence);

    if (clampedConfidence >= CONFIDENCE_THRESHOLD) {
      return {
        type: result.type,
        confidence: clampedConfidence,
        source: 'inferred',
      };
    }
  }

  // Fallback (detectText always fires at 0.5, but this guards the edge case)
  return { type: 'text', confidence: 0.5, source: 'fallback' };
}

// ---------------------------------------------------------------------------
// CORE-02: Main entry point
// ---------------------------------------------------------------------------

/**
 * Infer a ColumnInferenceMap from the provided data rows.
 *
 * - Returns an empty map for 0-row input (no throw)
 * - Samples up to 200 rows using systematic sampling
 * - Infers types for all keys present in the first row
 * - Returns InferenceResult per column key with confidence + source
 *
 * This function is synchronous and has no side effects.
 * Callers that want async/idle scheduling should use scheduleIdleWork() from scheduler.ts.
 *
 * @param data - Array of data rows (any shape — columns extracted from data[0])
 * @returns ColumnInferenceMap — key → InferenceResult
 */
export function inferSchema<TRow extends Record<string, unknown>>(
  data: TRow[]
): ColumnInferenceMap {
  // Edge case: no rows → empty map (MUST not throw)
  if (data.length === 0) return {};

  // Discover column keys from the first row
  const columnKeys = Object.keys(data[0]);

  // Take systematic sample (up to 200 rows)
  const sample = sampleRows(data);

  // Build the result map
  const result: ColumnInferenceMap = {};

  for (const key of columnKeys) {
    // Extract values for this column from the sample
    const columnValues: unknown[] = sample.map((row) => (row as Record<string, unknown>)[key]);

    // Run the detector chain
    result[key] = runDetectors(columnValues, key);
  }

  return result;
}
