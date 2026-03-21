/**
 * @tablecraft/core — Table engine factory
 *
 * CORE-01: createTableEngine(config) returns a stateless computation object.
 * The engine has ZERO DOM dependencies — it works in Node.js / Vitest with no browser env.
 *
 * State separation principle (CORE-08):
 * - The engine performs pure computation (inference, column resolution, row processing).
 * - Reactive state (sort order, filter state, scroll position, visibleRows) lives
 *   in the Svelte $state() rune in Phase 3 — NOT inside this engine.
 * - ProcessedRow[] is immutable output — never mutated after creation.
 *
 * Usage:
 *   const engine = createTableEngine({ data: rows });
 *   const schema  = engine.inferSchema(rows);            // ColumnInferenceMap
 *   const cols    = engine.resolveColumns(rows);         // ResolvedColumn[]
 *   const pRows   = engine.processRows(rows, cols);      // ProcessedRow[]
 *   const cfg     = engine.getConfig();                  // TableConfig (frozen copy)
 */

import type {
  ColumnDefinition,
  ColumnInferenceMap,
  ColumnOverrideShort,
  ColumnType,
  ProcessedRow,
  ResolvedColumn,
  TableConfig,
} from '../types.js';
import { inferSchema as runInferSchema } from '../inference/index.js';
import { getRenderer } from '../registry/index.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Normalise a columns prop into a flat ColumnDefinition[] regardless of whether
 * the caller passed short form `{ key: 'currency' }` or long form `ColumnDefinition[]`.
 */
function normaliseColumns(
  columns: ColumnOverrideShort | ColumnDefinition[] | undefined
): ColumnDefinition[] {
  if (!columns) return [];
  if (Array.isArray(columns)) return columns;
  // Short form: { avatarUrl: 'image', price: 'currency' }
  return Object.entries(columns).map(([key, type]) => ({ key, type: type as ColumnType }));
}

/**
 * Build a label from a column key:  'created_at' → 'Created At'
 */
function labelFromKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')      // camelCase → camel Case
    .replace(/[_-]+/g, ' ')           // snake_case / kebab-case → space
    .replace(/\s+/g, ' ')             // collapse multiple spaces
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// TableEngine public type
// ---------------------------------------------------------------------------

export interface TableEngine<TRow = Record<string, unknown>> {
  /**
   * Run type inference against the provided rows.
   * Returns a ColumnInferenceMap (key → InferenceResult).
   * Synchronous and side-effect-free.
   */
  inferSchema(data: TRow[]): ColumnInferenceMap;

  /**
   * Resolve the final ordered list of ResolvedColumn objects.
   *
   * Resolution order:
   * 1. Keys from data[0] (or overrides if long-form with explicit order)
   * 2. Override type/label applied on top of inference results
   * 3. Falls back to 'text' immediately — inference results are applied when supplied
   *
   * When overrides are omitted the engine uses the config.columns supplied at
   * construction time.  Pass an explicit override to use ad-hoc column config.
   *
   * CORE-01 requirement: "returns text type for all columns immediately (before
   * inference completes)" — callers may call resolveColumns(data) without passing
   * inference results to get the fast-path text columns, then call again with
   * inferenceResult to get typed columns.
   */
  resolveColumns(
    data: TRow[],
    overrides?: ColumnOverrideShort | ColumnDefinition<TRow>[],
    inferenceResult?: ColumnInferenceMap
  ): ResolvedColumn[];

  /**
   * Process raw data rows into typed ProcessedRow[] using the provided column list.
   * Each cell is rendered through the registered RendererFn for the column type,
   * with a 'text' fallback when no renderer is registered.
   */
  processRows(rows: TRow[], columns: ResolvedColumn[]): ProcessedRow[];

  /**
   * Return a frozen copy of the TableConfig passed at construction time.
   * Mutations to the returned object do not affect engine behaviour.
   */
  getConfig(): TableConfig<TRow>;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a stateless TableEngine computation object.
 *
 * @param config - Initial table configuration (data + optional column overrides)
 * @returns TableEngine — a plain object with inferSchema / resolveColumns / processRows / getConfig
 */
export function createTableEngine<TRow extends Record<string, unknown>>(
  config: TableConfig<TRow>
): TableEngine<TRow> {
  // Freeze a shallow copy so callers cannot mutate the stored config.
  const frozenConfig: TableConfig<TRow> = Object.freeze({ ...config });

  // ---------------------------------------------------------------------------
  // inferSchema
  // ---------------------------------------------------------------------------
  function inferSchema(data: TRow[]): ColumnInferenceMap {
    return runInferSchema(data);
  }

  // ---------------------------------------------------------------------------
  // resolveColumns
  // ---------------------------------------------------------------------------
  function resolveColumns(
    data: TRow[],
    overrides?: ColumnOverrideShort | ColumnDefinition<TRow>[],
    inferenceResult?: ColumnInferenceMap
  ): ResolvedColumn[] {
    // Use explicit overrides; fall back to config.columns; fall back to undefined.
    const effectiveOverrides = overrides ?? frozenConfig.columns;
    const normalisedOverrides = normaliseColumns(
      effectiveOverrides as ColumnOverrideShort | ColumnDefinition[] | undefined
    );

    // Build override lookup: key → ColumnDefinition
    const overrideMap = new Map<string, ColumnDefinition>(
      normalisedOverrides.map((col) => [col.key, col])
    );

    // Determine column key ordering:
    // - Long-form overrides with explicit key order take priority (if all keys known)
    // - Otherwise derive keys from data[0]
    let columnKeys: string[];

    if (Array.isArray(effectiveOverrides) && effectiveOverrides.length > 0) {
      // Long-form: respect override key order; include any extra data keys appended at end
      const overrideKeys = (effectiveOverrides as ColumnDefinition[]).map((c) => c.key as string);
      const dataKeys = data.length > 0 ? Object.keys(data[0]) : [];
      const extra = dataKeys.filter((k) => !overrideMap.has(k));
      columnKeys = [...overrideKeys, ...extra];
    } else {
      // Short-form or no override: derive from data[0]
      columnKeys = data.length > 0 ? Object.keys(data[0]) : Array.from(overrideMap.keys());
    }

    return columnKeys.map((key): ResolvedColumn => {
      const override = overrideMap.get(key);
      const inferred = inferenceResult?.[key];

      // Declared type in override always wins; then inferred; then 'text' fallback
      const type: ColumnType =
        override?.type ?? inferred?.type ?? 'text';

      // Label: override label → override key label → inferred? (no label in inference) → key label
      const label: string = override?.label ?? labelFromKey(key);

      const resolved: ResolvedColumn = {
        // Spread override fields (sortable, filterable, hideable, minWidth, maxWidth, pinned)
        ...(override ?? {}),
        key,
        type,
        label,
      };

      if (inferred && !override?.type) {
        resolved.inferenceResult = inferred;
      }

      return resolved;
    });
  }

  // ---------------------------------------------------------------------------
  // processRows
  // ---------------------------------------------------------------------------
  function processRows(rows: TRow[], columns: ResolvedColumn[]): ProcessedRow[] {
    // Get text renderer as guaranteed fallback (must be registered by renderers/text.ts)
    const textFallback = getRenderer('text');

    return rows.map((row): ProcessedRow => {
      const cells: Record<string, import('../types.js').CellDescriptor> = {};

      for (const col of columns) {
        const value = (row as Record<string, unknown>)[col.key];
        const renderer = getRenderer(col.type) ?? textFallback;

        if (renderer) {
          cells[col.key] = renderer(value, col);
        } else {
          // Emergency fallback if even 'text' renderer isn't registered
          cells[col.key] = { kind: 'raw', value };
        }
      }

      return {
        _original: row as Record<string, unknown>,
        cells,
      };
    });
  }

  // ---------------------------------------------------------------------------
  // getConfig
  // ---------------------------------------------------------------------------
  function getConfig(): TableConfig<TRow> {
    return frozenConfig;
  }

  // ---------------------------------------------------------------------------
  // Return the engine object
  // ---------------------------------------------------------------------------
  return {
    inferSchema,
    resolveColumns,
    processRows,
    getConfig,
  };
}
