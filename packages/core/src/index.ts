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

// Phase 2 Wave 3: Renderer registry
export {
  registerRenderer,
  getRenderer,
  hasRenderer,
  unregisterRenderer,
  clearRegistry,
  getRegisteredTypes,
} from './registry/index.js';

// Phase 2 Wave 3: All 17 Tier 1 renderers (self-register on import)
export * from './renderers/index.js';

// Phase 2 Wave 4: CSS design tokens
export { DEFAULT_TOKENS } from './tokens.js';
export type { TokenName } from './tokens.js';

// Phase 2 Wave 4: Table engine factory
export { createTableEngine } from './engine/index.js';
export type { TableEngine } from './engine/index.js';

// Phase 2 Wave 4: v1 compatibility shim
export { adaptV1Props } from './compat/v1.js';
