/**
 * @tablecraft/core — Type definitions
 *
 * Tier 1 renderer types (14 from v1 + 3 new in v2).
 * Implemented as individual tree-shakable modules in Phase 2.
 * FOUND-07: No at-html string concatenation. All rendering uses typed components.
 * FOUND-09: No type-switcher select. Types are inferred or declared via columns prop.
 */

/** All supported column renderer types — union of all Tier 1 renderer names */
export type ColumnType =
  | 'text'        // fallback — plain string display
  | 'number'      // numeric with locale formatting
  | 'integer'     // integer, no decimal
  | 'currency'    // locale currency with symbol
  | 'percentage'  // 0-1 or 0-100 value shown as N%
  | 'boolean'     // true/false → checkmark/cross icon
  | 'date'        // ISO date → locale date string
  | 'datetime'    // ISO datetime → locale datetime string
  | 'time'        // time string → locale time display
  | 'email'       // mailto: anchor
  | 'url'         // anchor with external link icon
  | 'phone'       // tel: anchor
  | 'image'       // <img> with alt text
  | 'badge'       // colored pill/tag
  | 'status'      // enum value → colored status indicator
  | 'code'        // monospace code block (no at-html — uses <code> element)
  | 'html';       // EXPLICIT OPT-IN ONLY: sanitized HTML (DOMPurify in Phase 2)

/** Short-form column override: { columnKey: ColumnType } */
export type ColumnOverrideShort = Record<string, ColumnType>;

/**
 * Full column descriptor — used in the columns prop for detailed configuration.
 * Phase 1 defines the shape; Phase 2 implements the inference engine against it.
 */
export interface ColumnDefinition<TRow = Record<string, unknown>> {
  /** The key in TRow this column maps to */
  key: keyof TRow & string;
  /** Display label in column header — defaults to key if omitted */
  label?: string;
  /** Renderer type — overrides inference when specified */
  type?: ColumnType;
  /** Whether this column is sortable (default: true) */
  sortable?: boolean;
  /** Whether this column is filterable (default: true) */
  filterable?: boolean;
  /** Whether the column can be hidden by the user */
  hideable?: boolean;
  /** Minimum column width in px */
  minWidth?: number;
  /** Maximum column width in px */
  maxWidth?: number;
  /** Pin this column to the left or right edge */
  pinned?: 'left' | 'right';
}

/**
 * Top-level config passed to createTableEngine() in Phase 2.
 * Phase 1 defines the shape only — implementation in Phase 2.
 */
export interface TableConfig<TRow = Record<string, unknown>> {
  /** Source data rows */
  data: TRow[];
  /**
   * Column definitions or short-form overrides.
   * Short form: { avatar: 'image', price: 'currency' }
   * Long form: [{ key: 'avatar', type: 'image', label: 'Photo' }]
   */
  columns?: ColumnOverrideShort | ColumnDefinition<TRow>[];
}

/**
 * Result from the type inference engine (Phase 2).
 * Phase 1 defines the shape so downstream packages can type their props correctly.
 */
export interface InferenceResult {
  /** The inferred or declared column type */
  type: ColumnType;
  /** Inference confidence 0-1 (1.0 = explicitly declared, <1.0 = inferred) */
  confidence: number;
  /** The source of this result */
  source: 'declared' | 'inferred' | 'fallback';
}

/**
 * Per-column inference output map: columnKey → InferenceResult
 */
export type ColumnInferenceMap = Record<string, InferenceResult>;

/**
 * TypeScript helper — provides full generic type safety for column definitions.
 * Usage: const columns = defineColumns<User>()([{ key: 'name', type: 'text' }])
 * Implementation: identity function — generic constraint is the value at callsite.
 * Phase 2 adds the inference engine; this helper type-checks consumer code.
 */
export function defineColumns<TRow = Record<string, unknown>>() {
  return (columns: ColumnDefinition<TRow>[]): ColumnDefinition<TRow>[] => columns;
}
