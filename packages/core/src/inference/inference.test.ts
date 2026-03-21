/**
 * CORE-02: Inference pipeline tests (sampling, priority chain, null handling)
 * Wave 0 stubs — activate by uncommenting imports once inference/index.ts exists.
 */
import { describe, it } from 'vitest';

// Uncomment when inference/index.ts is implemented:
// import { inferSchema, sampleRows, runDetectors } from './index.js';

describe('sampleRows', () => {
  it.todo('returns all rows when data.length <= 200');
  it.todo('returns exactly 200 rows for a 400-row input (step=2)');
  it.todo('returns <= 200 rows for any input size greater than 200');
  it.todo('samples systematically — first element is always data[0]');
  it.todo('preserves distribution — evenly spaced indices');
  it.todo('returns empty array for empty input');
  it.todo('handles 1-row input correctly');
  it.todo('handles exactly 200 rows — returns all without sampling');
  it.todo('handles 201 rows — step is 2, returns 101 samples');
});

describe('inferSchema', () => {
  it.todo('returns empty ColumnInferenceMap for 0 rows without throwing');
  it.todo('returns map with all keys present in the first row for 1-row input');
  it.todo('returns correct types for 200+ rows');
  it.todo('infers "boolean" for column with all true/false values');
  it.todo('infers "currency" for column with "$"-prefixed string values');
  it.todo('infers "integer" for column with whole number values');
  it.todo('infers "number" for column with decimal values');
  it.todo('infers "email" for column with email address values');
  it.todo('infers "date" for column with ISO date string values');
  it.todo('infers "datetime" for column with ISO datetime string values');
  it.todo('infers "url" for column with https:// URL values');
  it.todo('infers "image" for column with .jpg URL values');
  it.todo('infers "status" for low-cardinality string column (3 unique values)');
  it.todo('falls back to "text" with confidence 0.5 when no detector scores >= 0.8');
  it.todo('returns { type: "text", confidence: 0.5, source: "fallback" } for all-null column');
  it.todo('returns text/0.5 for column with > 50% null values');
  it.todo('returns text/0.5 for column with > 50% undefined values');
  it.todo('returns text/0.5 for column with > 50% empty string values');
  it.todo('handles undefined values without throwing');
  it.todo('handles null values without throwing');
  it.todo('source is "inferred" for type-detected columns');
  it.todo('source is "fallback" for text fallback columns');
  it.todo('confidence is clamped to 1.0 when keyword boost pushes above 1.0');
  it.todo('all returned InferenceResult objects have type, confidence, source fields');
});

describe('inferSchema field-name keyword boosting', () => {
  it.todo('"avatar" column with URL-like values infers as "image" (keyword boost crosses 0.8 threshold)');
  it.todo('"price" column with numeric values infers as "currency" (keyword boost)');
  it.todo('"created_at" column with date strings infers as "date" (keyword boost)');
  it.todo('"status" column with few unique string values infers as "status" (keyword boost)');
  it.todo('"email" column with email-format strings gets email boost of 0.15');
  it.todo('"rate" column with 0.0–1.0 values infers as "percentage" (keyword boost)');
  it.todo('column with no matching keyword uses base detector confidence only');
  it.todo('boost is additive to base confidence, not multiplicative');
});

describe('runDetectors', () => {
  it.todo('runs detectors in priority order and returns first result >= 0.8');
  it.todo('applies keyword boost before threshold comparison');
  it.todo('returns text/fallback when all detectors return below threshold');
  it.todo('clamps confidence to max 1.0 after boost');
  it.todo('skips detectors that return null');
});
