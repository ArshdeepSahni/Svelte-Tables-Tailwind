/**
 * @tablecraft/core — Public API
 *
 * Phase 1: Type definitions and helper.
 * Phase 2 (Wave 2): Type inference engine (inferSchema, sampleRows, runDetectors).
 * Phase 2 (Wave 3+): createTableEngine(), registerRenderer(), built-in renderers.
 */

export type {
  ColumnType,
  ColumnOverrideShort,
  ColumnDefinition,
  TableConfig,
  InferenceResult,
  ColumnInferenceMap,
  CellDescriptor,
  RendererFn,
  ResolvedColumn,
  ProcessedRow,
  BadgeVariant,
} from './types.js';

export { defineColumns } from './types.js';

// Phase 2 Wave 2: Inference engine
export { inferSchema, sampleRows, runDetectors } from './inference/index.js';
export type { DetectorFn, DetectorResult } from './inference/detectors.js';
export { DETECTORS, getBoostMap } from './inference/detectors.js';
