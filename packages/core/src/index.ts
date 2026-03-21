/**
 * @tablecraft/core — Public API
 *
 * Phase 1: Type definitions and helper only.
 * Phase 2: createTableEngine(), registerRenderer(), built-in renderers.
 */

export type {
  ColumnType,
  ColumnOverrideShort,
  ColumnDefinition,
  TableConfig,
  InferenceResult,
  ColumnInferenceMap,
} from './types.js';

export { defineColumns } from './types.js';
