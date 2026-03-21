/**
 * @tablecraft/core — v1 compatibility shim
 *
 * CORE-10: Backwards compatibility for the v1 `colname`/`rowdata` API.
 *
 * The v1 API accepted:
 *   colname: Record<string, string>  — key = v1 type string, value = column label
 *   rowdata:  unknown[][]            — array of row arrays (positional, not keyed)
 *
 * adaptV1Props converts these to the v2 format:
 *   { data: Record<string, unknown>[]; columns: ColumnDefinition[] }
 *
 * v1 → v2 type mappings:
 *   dropdown  → status   (closest semantic equivalent — enum value with color)
 *   list      → text     (comma-join array values; editing is Phase 6 scope)
 *   input     → text     (editing is Phase 6 scope)
 *   checkbox  → boolean  (true/false display)
 *   mail      → email    (mailto: link)
 *   tag       → url      (anchor with external link icon)
 *
 * All other v1 types that are also valid v2 ColumnType values pass through unchanged
 * (e.g., 'text', 'number', 'integer', 'currency', 'date', 'datetime', 'image', 'html').
 *
 * CORE-11: Emits console.warn with deprecation URL on every call.
 * Removed in v3; do NOT add new features to this shim.
 */

import type { ColumnDefinition, ColumnType } from '../types.js';

// ---------------------------------------------------------------------------
// v1 → v2 type mapping table
// ---------------------------------------------------------------------------

/**
 * Maps v1 column type strings to their nearest v2 ColumnType equivalents.
 * Only maps types that do NOT exist in v2 (e.g., 'dropdown' is not a v2 type).
 * Types already valid in v2 (e.g., 'text', 'number') are cast directly.
 */
const V1_TYPE_MAP: Record<string, ColumnType> = {
  dropdown: 'status',   // enum value → colored status indicator
  list:     'text',     // array display → plain text (join on render)
  input:    'text',     // editable field → read-only text (edit in Phase 6)
  checkbox: 'boolean',  // checkbox → boolean check/cross icon
  mail:     'email',    // email link shorthand
  tag:      'url',      // tag/link → url anchor with external icon
};

/** All valid v2 ColumnType values — used to pass through already-valid types */
const VALID_V2_TYPES = new Set<string>([
  'text', 'number', 'integer', 'currency', 'percentage',
  'boolean', 'date', 'datetime', 'time',
  'email', 'url', 'phone',
  'image', 'badge', 'status', 'code', 'html',
]);

/**
 * Resolve a v1 type string to a v2 ColumnType.
 * Priority: explicit mapping → already-valid v2 type → 'text' fallback.
 */
function resolveType(v1Type: string): ColumnType {
  const mapped = V1_TYPE_MAP[v1Type];
  if (mapped !== undefined) return mapped;
  if (VALID_V2_TYPES.has(v1Type)) return v1Type as ColumnType;
  // Unknown v1 type — fall back to 'text'
  return 'text';
}

/**
 * Convert a column label to a safe object key.
 * 'First Name' → 'first_name'
 */
function labelToKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

// ---------------------------------------------------------------------------
// adaptV1Props
// ---------------------------------------------------------------------------

/**
 * Convert v1 `colname`/`rowdata` props to v2 `{ data, columns }` format.
 *
 * @param colname - v1 column descriptor: `{ [v1TypeString]: label }` pairs in order
 * @param rowdata - v1 row data: array of row arrays (values in column order)
 * @returns `{ data: Record<string, unknown>[]; columns: ColumnDefinition[] }`
 *
 * @example
 * ```ts
 * const { data, columns } = adaptV1Props(
 *   { checkbox: 'Active', dropdown: 'Status', mail: 'Email' },
 *   [[true, 'active', 'a@b.com'], [false, 'pending', 'c@d.com']]
 * );
 * // columns → [{ key: 'active', type: 'boolean', label: 'Active' }, ...]
 * // data    → [{ active: true, status: 'active', email: 'a@b.com' }, ...]
 * ```
 */
export function adaptV1Props(
  colname: Record<string, string>,
  rowdata: unknown[][]
): { data: Record<string, unknown>[]; columns: ColumnDefinition[] } {
  // Deprecation warning — always emitted regardless of call context
  console.warn(
    '[tablecraft] colname/rowdata API is deprecated. ' +
    'Use <Table data={rows} /> instead. ' +
    'Migration guide: https://tablecraft.dev/migrate/v1'
  );

  // Build ordered column definitions from colname entries
  const entries = Object.entries(colname);
  const columns: ColumnDefinition[] = entries.map(([v1Type, label]) => ({
    key: labelToKey(label),
    type: resolveType(v1Type),
    label,
  }));

  // Map row arrays to keyed objects using column key order
  const data: Record<string, unknown>[] = rowdata.map((rowArray) => {
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < columns.length; i++) {
      obj[columns[i].key] = i < rowArray.length ? rowArray[i] : undefined;
    }
    return obj;
  });

  return { data, columns };
}
