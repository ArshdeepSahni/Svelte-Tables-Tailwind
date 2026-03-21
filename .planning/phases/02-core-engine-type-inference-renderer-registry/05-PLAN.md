---
phase: 02-core-engine-type-inference-renderer-registry
plan: 05
type: execute
wave: 4
depends_on:
  - 02-02
  - 02-03
  - 02-04
files_modified:
  - packages/core/src/engine/index.ts
  - packages/core/src/engine/engine.test.ts
  - packages/core/src/compat/v1.ts
  - packages/core/src/compat/v1.test.ts
  - packages/core/src/README.md
  - packages/core/src/index.ts
  - packages/core/package.json
autonomous: true
requirements:
  - CORE-01
  - CORE-08
  - CORE-10
  - CORE-11

must_haves:
  truths:
    - "createTableEngine({ data: rows }) returns an object with inferSchema, resolveColumns, processRows, getConfig methods"
    - "resolveColumns returns text type for all columns immediately (before inference completes)"
    - "processRows maps each row to a ProcessedRow with cells keyed by column key"
    - "adaptV1Props(colname, rowdata) emits console.warn with deprecation URL and returns { data, columns }"
    - "All v1 type mappings are correct: dropdown→status, list→text, input→text, checkbox→boolean, mail→email, tag→url"
    - "packages/core/src/README.md documents state separation (engine stateless, state lives in Svelte $state)"
    - "packages/core/src/index.ts exports createTableEngine, registerRenderer, getRenderer, inferSchema, adaptV1Props, CellDescriptor and all types"
    - "packages/core/package.json has 17 renderer export entries in exports map and DOMPurify peerDependencies"
    - "All engine and compat tests pass"
  artifacts:
    - path: "packages/core/src/engine/index.ts"
      provides: "createTableEngine factory — stateless computation object"
      exports: ["createTableEngine"]
    - path: "packages/core/src/compat/v1.ts"
      provides: "v1 colname/rowdata shim with type mappings and deprecation warning"
      exports: ["adaptV1Props"]
    - path: "packages/core/src/README.md"
      provides: "State separation architecture documentation (CORE-08)"
    - path: "packages/core/src/index.ts"
      provides: "Updated public API entry point — all Phase 2 exports"
    - path: "packages/core/package.json"
      provides: "Updated exports map (17 renderer entries) and peerDependencies"
    - path: "packages/core/src/engine/engine.test.ts"
      provides: "Engine factory tests (CORE-01)"
    - path: "packages/core/src/compat/v1.test.ts"
      provides: "v1 shim tests (CORE-10) — all 5 type-mapping edge cases"
  key_links:
    - from: "packages/core/src/engine/index.ts"
      to: "packages/core/src/inference/index.ts"
      via: "import { inferSchema } from '../inference/index.js' — engine delegates to inference"
    - from: "packages/core/src/engine/index.ts"
      to: "packages/core/src/registry/index.ts"
      via: "import { getRenderer } from '../registry/index.js' — processRows looks up renderers"
    - from: "packages/core/src/index.ts"
      to: "packages/core/src/engine/index.ts"
      via: "export { createTableEngine } from './engine/index.js'"
    - from: "packages/core/src/index.ts"
      to: "packages/core/src/compat/v1.ts"
      via: "export { adaptV1Props } from './compat/v1.js'"
---

<objective>
Wire all Phase 2 work together: the engine factory (CORE-01), v1 compatibility shim (CORE-10), state separation docs (CORE-08), public API barrel (index.ts), and package.json exports map. After this plan, `createTableEngine()` works end-to-end in plain Node.js.

Purpose: Phase 3 (Svelte component) depends on a stable createTableEngine() API. This plan finalizes that API and closes all remaining CORE-* requirements.
Output: engine/index.ts, compat/v1.ts, README.md, updated index.ts, updated package.json.
</objective>

<execution_context>
@/Users/arshdeep.singh/.claude/get-shit-done/workflows/execute-plan.md
@/Users/arshdeep.singh/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/02-core-engine-type-inference-renderer-registry/02-CONTEXT.md
@.planning/phases/02-core-engine-type-inference-renderer-registry/02-RESEARCH.md

<interfaces>
<!-- From previous waves — all imports the engine needs -->
From packages/core/src/types.ts:
```typescript
export interface TableConfig<TRow> { data: TRow[]; columns?: ColumnOverrideShort | ColumnDefinition<TRow>[]; }
export type ColumnOverrideShort = Record<string, ColumnType>;
export interface ColumnDefinition<TRow> { key: keyof TRow & string; label?: string; type?: ColumnType; ... }
export interface ResolvedColumn extends ColumnDefinition { type: ColumnType; label: string; inferenceResult?: InferenceResult; }
export interface ProcessedRow { _original: Record<string, unknown>; cells: Record<string, CellDescriptor>; }
export type ColumnInferenceMap = Record<string, InferenceResult>;
```

From packages/core/src/inference/index.ts:
```typescript
export function inferSchema(data: Record<string, unknown>[]): ColumnInferenceMap;
```

From packages/core/src/registry/index.ts:
```typescript
export function getRenderer(type: string): RendererFn | undefined;
```

From packages/core/src/scheduler.ts:
```typescript
export function scheduleIdleWork(fn: () => void): void;
```

Engine API (from CONTEXT.md — locked decisions):
```typescript
createTableEngine(config) returns {
  inferSchema(data): Promise<ColumnInferenceMap>,  // async via scheduleIdleWork
  resolveColumns(data, overrides?): ResolvedColumn[],  // sync, text fallback immediately
  processRows(rows, columns): ProcessedRow[],  // sync, maps to CellDescriptors
  getConfig(): TableConfig<TRow>,  // immutable copy
}
```

v1 type mappings (from CONTEXT.md — locked):
```
string → text, number → number, date → date, time → time, mail → email,
phone → phone, image → image, html → html, code → code, url → url, tag → url,
dropdown → status, list → text, input → text, checkbox → boolean
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Implement engine/index.ts + compat/v1.ts + README.md</name>
  <files>
    packages/core/src/engine/index.ts
    packages/core/src/engine/engine.test.ts
    packages/core/src/compat/v1.ts
    packages/core/src/compat/v1.test.ts
    packages/core/src/README.md
  </files>
  <read_first>
    - packages/core/src/types.ts — all interface shapes (TableConfig, ResolvedColumn, ProcessedRow, ColumnInferenceMap)
    - packages/core/src/inference/index.ts — inferSchema signature and return type
    - packages/core/src/registry/index.ts — getRenderer signature
    - packages/core/src/scheduler.ts — scheduleIdleWork signature
    - packages/core/src/renderers/text.ts — verify textRenderer is exported and registered as 'text' fallback
    - .planning/phases/02-core-engine-type-inference-renderer-registry/02-CONTEXT.md — Engine API Design section, v1 Compatibility Shim section, State Graph section
    - .planning/phases/02-core-engine-type-inference-renderer-registry/02-RESEARCH.md — v1 Compatibility Shim Edge Cases section, Gotcha #7 (duplicate colname keys)
  </read_first>
  <behavior>
    - createTableEngine is a plain object factory (not a class)
    - Engine is STATELESS — no internal mutable state beyond config snapshot
    - resolveColumns: short form = ColumnOverrideShort, long form = ColumnDefinition[], zero-config = keys from data[0]
    - resolveColumns: always resolves label (key if label omitted), type defaults to 'text' before inference
    - processRows: for each row, calls getRenderer(column.type) — falls back to textRenderer if undefined
    - inferSchema on engine: returns Promise wrapping scheduleIdleWork callback
    - adaptV1Props: always calls console.warn with deprecation URL; empty inputs return {data:[], columns:[]}
    - v1 type mapping: exact table from CONTEXT.md; unknown v1 types fall back to 'text'
    - README.md: plain text architecture note (not a marketing doc)
  </behavior>
  <action>
Create packages/core/src/engine/index.ts:

```typescript
/**
 * @tablecraft/core — Table engine factory
 *
 * CORE-01: createTableEngine(config) returns a plain object with four methods.
 * The engine is STATELESS — it is a pure computation factory.
 * Reactive state (sort, filter, scroll position) lives in Svelte $state() in Phase 3.
 *
 * CORE-08: See packages/core/src/README.md for state separation documentation.
 */

import type {
  TableConfig,
  ColumnDefinition,
  ColumnOverrideShort,
  ColumnInferenceMap,
  ResolvedColumn,
  ProcessedRow,
  ColumnType,
} from '../types.js';
import { inferSchema as runInference } from '../inference/index.js';
import { getRenderer } from '../registry/index.js';
import { scheduleIdleWork } from '../scheduler.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Determine if columns config is short-form { key: type } or long-form ColumnDefinition[].
 */
function isShortForm(
  columns: ColumnOverrideShort | ColumnDefinition[] | undefined,
): columns is ColumnOverrideShort {
  if (!columns) return false;
  return !Array.isArray(columns);
}

/**
 * Build a ResolvedColumn array from data rows and optional column spec.
 * Type defaults to 'text' — inference updates this asynchronously via inferSchema().
 *
 * Zero-config path: derive columns from Object.keys(data[0]).
 * Short form: { avatar: 'image' } — keys from object, types from values.
 * Long form: ColumnDefinition[] — use as-is, fill defaults.
 */
function buildResolvedColumns(
  data: Record<string, unknown>[],
  overrides?: ColumnOverrideShort | ColumnDefinition[],
  inferenceMap?: ColumnInferenceMap,
): ResolvedColumn[] {
  if (data.length === 0 && !overrides) return [];

  if (isShortForm(overrides)) {
    // Short form: { key: type } — the keys define the columns
    return Object.entries(overrides).map(([key, type]) => ({
      key,
      label: key,
      type,
      sortable: true,
      filterable: true,
    } satisfies ResolvedColumn));
  }

  if (Array.isArray(overrides) && overrides.length > 0) {
    // Long form: ColumnDefinition[] — fill defaults
    return overrides.map((col) => {
      const inferred = inferenceMap?.[col.key];
      return {
        ...col,
        label: col.label ?? col.key,
        type: col.type ?? inferred?.type ?? 'text',
        inferenceResult: inferred,
        sortable: col.sortable ?? true,
        filterable: col.filterable ?? true,
      } satisfies ResolvedColumn;
    });
  }

  // Zero-config: derive from data[0] keys (or empty if 0 rows)
  const keys = data.length > 0 ? Object.keys(data[0]) : [];
  return keys.map((key) => {
    const inferred = inferenceMap?.[key];
    return {
      key,
      label: key,
      type: inferred?.type ?? ('text' as ColumnType),
      inferenceResult: inferred,
      sortable: true,
      filterable: true,
    } satisfies ResolvedColumn;
  });
}

// ---------------------------------------------------------------------------
// Engine factory
// ---------------------------------------------------------------------------

export interface TableEngine<TRow extends Record<string, unknown> = Record<string, unknown>> {
  /**
   * Infer column types from data rows.
   * Runs via scheduleIdleWork — async in browser, immediate in Node.js 20+.
   * Returns a promise that resolves with the full ColumnInferenceMap.
   */
  inferSchema(data: TRow[]): Promise<ColumnInferenceMap>;

  /**
   * Resolve column definitions from data and optional user overrides.
   * Safe to call immediately (returns 'text' for all unresolved columns).
   * Call again with the inferenceMap result to get inferred types applied.
   */
  resolveColumns(
    data: TRow[],
    overrides?: ColumnOverrideShort | ColumnDefinition<TRow>[],
    inferenceMap?: ColumnInferenceMap,
  ): ResolvedColumn[];

  /**
   * Map raw rows to typed ProcessedRow objects using the resolved column set.
   * Invokes registered renderers for each cell — zero DOM dependencies.
   */
  processRows(rows: TRow[], columns: ResolvedColumn[]): ProcessedRow[];

  /**
   * Return an immutable snapshot of the current config.
   */
  getConfig(): TableConfig<TRow>;
}

/**
 * Create a stateless table engine from a TableConfig.
 * CORE-01: Framework-agnostic — works in Node.js, SSR, and browser environments.
 *
 * @example
 * const engine = createTableEngine({ data: rows });
 * const columns = engine.resolveColumns(rows); // text fallback immediately
 * engine.inferSchema(rows).then(map => {
 *   const inferred = engine.resolveColumns(rows, undefined, map); // types updated
 * });
 */
export function createTableEngine<TRow extends Record<string, unknown> = Record<string, unknown>>(
  config: TableConfig<TRow>,
): TableEngine<TRow> {
  // Snapshot the config at creation time — engine does not mutate
  const frozenConfig: TableConfig<TRow> = { ...config };

  return {
    inferSchema(data: TRow[]): Promise<ColumnInferenceMap> {
      return new Promise<ColumnInferenceMap>((resolve) => {
        scheduleIdleWork(() => {
          resolve(runInference(data as Record<string, unknown>[]));
        });
      });
    },

    resolveColumns(
      data: TRow[],
      overrides?: ColumnOverrideShort | ColumnDefinition<TRow>[],
      inferenceMap?: ColumnInferenceMap,
    ): ResolvedColumn[] {
      return buildResolvedColumns(
        data as Record<string, unknown>[],
        overrides as ColumnOverrideShort | ColumnDefinition[] | undefined,
        inferenceMap,
      );
    },

    processRows(rows: TRow[], columns: ResolvedColumn[]): ProcessedRow[] {
      return rows.map((row) => {
        const original = row as Record<string, unknown>;
        const cells: Record<string, import('../types.js').CellDescriptor> = {};

        for (const col of columns) {
          const value = original[col.key];
          const rendererFn = getRenderer(col.type) ?? getRenderer('text');

          if (rendererFn) {
            cells[col.key] = rendererFn(value, col);
          } else {
            // Registry has no 'text' renderer — absolute fallback
            cells[col.key] = { kind: 'text', value: value === null || value === undefined ? '' : String(value) };
          }
        }

        return { _original: original, cells };
      });
    },

    getConfig(): TableConfig<TRow> {
      return { ...frozenConfig };
    },
  };
}
```

Create packages/core/src/engine/engine.test.ts:

```typescript
/**
 * CORE-01, CORE-08: Engine factory tests
 * Tests createTableEngine() API — stateless, framework-agnostic, zero DOM deps.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { createTableEngine } from './index.js';
import { clearRegistry, registerRenderer } from '../registry/index.js';
import type { ResolvedColumn, CellDescriptor } from '../types.js';

// Make scheduleIdleWork synchronous in tests so inferSchema() resolves immediately
vi.mock('../scheduler.js', () => ({
  scheduleIdleWork: (fn: () => void) => fn(),
}));

// Register text renderer for processRows fallback testing
beforeEach(() => {
  clearRegistry();
  registerRenderer('text', (value) => ({ kind: 'text', value: String(value ?? '') } as CellDescriptor));
  registerRenderer('email', (value) => ({ kind: 'link', href: `mailto:${value}`, label: String(value) } as CellDescriptor));
});

afterEach(() => {
  clearRegistry();
  vi.restoreAllMocks();
});

describe('createTableEngine', () => {
  it('returns an object with inferSchema, resolveColumns, processRows, getConfig', () => {
    const engine = createTableEngine({ data: [] });
    expect(typeof engine.inferSchema).toBe('function');
    expect(typeof engine.resolveColumns).toBe('function');
    expect(typeof engine.processRows).toBe('function');
    expect(typeof engine.getConfig).toBe('function');
  });

  it('getConfig returns a copy of the original config', () => {
    const config = { data: [{ name: 'Alice' }] };
    const engine = createTableEngine(config);
    const returned = engine.getConfig();
    expect(returned).toEqual(config);
    expect(returned).not.toBe(config); // not the same object reference (immutable copy)
  });
});

describe('engine.inferSchema', () => {
  it('returns a Promise', () => {
    const engine = createTableEngine({ data: [] });
    const result = engine.inferSchema([]);
    expect(result).toBeInstanceOf(Promise);
  });

  it('resolves to empty map for empty data', async () => {
    const engine = createTableEngine({ data: [] });
    const map = await engine.inferSchema([]);
    expect(map).toEqual({});
  });

  it('resolves with inferred types for non-empty data', async () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({ email: `user${i}@example.com` }));
    const engine = createTableEngine({ data: rows });
    const map = await engine.inferSchema(rows);
    expect(map['email']?.type).toBe('email');
  });
});

describe('engine.resolveColumns (zero-config)', () => {
  it('returns columns derived from data row keys', () => {
    const engine = createTableEngine({ data: [{ name: 'Alice', age: 30 }] });
    const cols = engine.resolveColumns([{ name: 'Alice', age: 30 }]);
    expect(cols.map((c) => c.key)).toEqual(['name', 'age']);
  });

  it('defaults type to text before inference', () => {
    const engine = createTableEngine({ data: [{ name: 'Alice' }] });
    const cols = engine.resolveColumns([{ name: 'Alice' }]);
    expect(cols[0].type).toBe('text');
  });

  it('returns empty array for empty data without overrides', () => {
    const engine = createTableEngine({ data: [] });
    expect(engine.resolveColumns([])).toHaveLength(0);
  });

  it('uses label equal to key when label is not specified', () => {
    const engine = createTableEngine({ data: [{ myColumn: 'x' }] });
    const cols = engine.resolveColumns([{ myColumn: 'x' }]);
    expect(cols[0].label).toBe('myColumn');
  });
});

describe('engine.resolveColumns (short-form overrides)', () => {
  it('uses types from short-form override', () => {
    const engine = createTableEngine({ data: [{ avatar: 'url', price: 42 }] });
    const cols = engine.resolveColumns(
      [{ avatar: 'url', price: 42 }],
      { avatar: 'image', price: 'currency' },
    );
    const avatarCol = cols.find((c) => c.key === 'avatar');
    const priceCol = cols.find((c) => c.key === 'price');
    expect(avatarCol?.type).toBe('image');
    expect(priceCol?.type).toBe('currency');
  });
});

describe('engine.resolveColumns (with inferenceMap)', () => {
  it('applies inferred types when inference map is provided', async () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({ email: `u${i}@example.com` }));
    const engine = createTableEngine({ data: rows });
    const map = await engine.inferSchema(rows);
    const cols = engine.resolveColumns(rows, undefined, map);
    expect(cols[0].type).toBe('email');
    expect(cols[0].inferenceResult).toBeDefined();
  });
});

describe('engine.processRows', () => {
  it('returns one ProcessedRow per input row', () => {
    const rows = [{ name: 'Alice' }, { name: 'Bob' }];
    const engine = createTableEngine({ data: rows });
    const cols = engine.resolveColumns(rows);
    const processed = engine.processRows(rows, cols);
    expect(processed).toHaveLength(2);
  });

  it('each ProcessedRow has _original and cells', () => {
    const rows = [{ name: 'Alice' }];
    const engine = createTableEngine({ data: rows });
    const cols = engine.resolveColumns(rows);
    const processed = engine.processRows(rows, cols);
    expect(processed[0]._original).toEqual({ name: 'Alice' });
    expect(processed[0].cells).toHaveProperty('name');
  });

  it('cells contain CellDescriptor objects', () => {
    const rows = [{ name: 'Alice' }];
    const engine = createTableEngine({ data: rows });
    const cols = engine.resolveColumns(rows);
    const processed = engine.processRows(rows, cols);
    expect(processed[0].cells['name']).toHaveProperty('kind');
  });

  it('uses registered renderer for column type', () => {
    const rows = [{ email: 'alice@example.com' }];
    const engine = createTableEngine({ data: rows });
    const cols = engine.resolveColumns(rows, { email: 'email' });
    const processed = engine.processRows(rows, cols);
    expect(processed[0].cells['email'].kind).toBe('link');
  });

  it('falls back to text renderer for unknown type', () => {
    const rows = [{ note: 'hello' }];
    const engine = createTableEngine({ data: rows });
    const cols = engine.resolveColumns(rows); // text type by default
    const processed = engine.processRows(rows, cols);
    expect(processed[0].cells['note'].kind).toBe('text');
  });

  it('returns empty array for empty rows', () => {
    const engine = createTableEngine({ data: [] });
    expect(engine.processRows([], [])).toHaveLength(0);
  });
});
```

Create packages/core/src/compat/v1.ts:

```typescript
/**
 * @tablecraft/core — v1 compatibility shim
 *
 * CORE-10: Adapts v1 `colname`/`rowdata` props to v2 data + columns format.
 * Emits console.warn on every call — this is intentional deprecation pressure.
 *
 * v1 API:
 *   colname: { [v1Type]: label }  — e.g. { "string": "Name", "number": "Age" }
 *   rowdata: unknown[][]           — e.g. [["Alice", 30], ["Bob", 25]]
 *
 * v2 API:
 *   data: Record<string, unknown>[]  — e.g. [{ name: "Alice", age: 30 }]
 *   columns: ColumnDefinition[]      — e.g. [{ key: "name", type: "text", label: "Name" }]
 *
 * CRITICAL: JavaScript silently deduplicates object keys. If a v1 consumer passes
 * { "string": "Name", "string": "Email" }, only { "string": "Email" } survives.
 * The shim cannot detect or recover from this. Document this limitation clearly.
 */

import type { ColumnDefinition, ColumnType } from '../types.js';

// ---------------------------------------------------------------------------
// v1 → v2 type mapping table (CORE-10, from CONTEXT.md — locked)
// ---------------------------------------------------------------------------

const V1_TYPE_MAP: Record<string, ColumnType> = {
  string: 'text',
  number: 'number',
  date: 'date',
  time: 'time',
  mail: 'email',
  phone: 'phone',
  image: 'image',
  html: 'html',
  code: 'code',
  url: 'url',
  tag: 'url',        // v1 alias for url
  dropdown: 'status', // closest v2 equivalent; semantic colors added in v2
  list: 'text',      // comma-join array; editing is Phase 6 scope
  input: 'text',     // editing is Phase 6 scope
  checkbox: 'boolean',
};

function mapV1Type(v1Type: string): ColumnType {
  return V1_TYPE_MAP[v1Type] ?? 'text'; // unknown v1 types fall back to text
}

// ---------------------------------------------------------------------------
// Shim function
// ---------------------------------------------------------------------------

/**
 * Convert v1 `colname`/`rowdata` props to v2 data + columns format.
 *
 * @deprecated Use `<Table data={rows} />` instead.
 * Migration guide: https://tablecraft.dev/migrate/v1
 *
 * @param colname - v1 column spec: { [v1ColumnType]: displayLabel }
 * @param rowdata - v1 row data: array of arrays in column order
 * @returns { data: Record<string, unknown>[], columns: ColumnDefinition[] }
 *
 * KNOWN LIMITATION: If `colname` contains duplicate type keys (e.g., two "string" entries),
 * JavaScript silently drops all but the last value at parse time. The shim cannot detect
 * this loss. Use the v2 API to avoid this class of bug.
 */
export function adaptV1Props(
  colname: Record<string, string>,
  rowdata: unknown[][],
): { data: Record<string, unknown>[]; columns: ColumnDefinition[] } {
  // Emit deprecation warning every time — intentional; must drive migration
  console.warn(
    '[tablecraft] colname/rowdata API is deprecated. ' +
    'Use <Table data={rows} /> instead. ' +
    'Migration guide: https://tablecraft.dev/migrate/v1\n' +
    '[tablecraft] WARNING: If you have duplicate type keys in colname ' +
    '(e.g., two "string" entries), JavaScript silently drops all but the last. ' +
    'Use the v2 API to avoid silent data loss.',
  );

  // Edge case: empty inputs
  if (Object.keys(colname).length === 0 || rowdata.length === 0) {
    return { data: [], columns: [] };
  }

  // Build columns from [v1Type, label] pairs in insertion order
  const entries = Object.entries(colname); // [v1Type, label][]
  const columns: ColumnDefinition[] = entries.map(([v1Type, label]) => ({
    key: label.toLowerCase().replace(/\s+/g, '_'),
    label,
    type: mapV1Type(v1Type),
  }));

  // Map rowdata (array of arrays) to array of objects
  const data = rowdata.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col.key] = row[i] ?? null;
    });
    return obj;
  });

  return { data, columns };
}
```

Create packages/core/src/compat/v1.test.ts:

```typescript
/**
 * CORE-10: v1 shim tests — all type mappings, deprecation warning, edge cases.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { adaptV1Props } from './v1.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('adaptV1Props — deprecation warning', () => {
  it('always emits console.warn with migration URL', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    adaptV1Props({ string: 'Name' }, [['Alice']]);
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain('deprecated');
    expect(warn.mock.calls[0][0]).toContain('tablecraft.dev/migrate/v1');
  });

  it('warns on every call, not just the first', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    adaptV1Props({ string: 'Name' }, [['Alice']]);
    adaptV1Props({ string: 'Name' }, [['Bob']]);
    expect(warn).toHaveBeenCalledTimes(2);
  });
});

describe('adaptV1Props — type mappings (CORE-10)', () => {
  function getFirstColumnType(v1Type: string) {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = adaptV1Props({ [v1Type]: 'Column' }, [['value']]);
    return result.columns[0]?.type;
  }

  it('string → text', () => { expect(getFirstColumnType('string')).toBe('text'); });
  it('number → number', () => { expect(getFirstColumnType('number')).toBe('number'); });
  it('date → date', () => { expect(getFirstColumnType('date')).toBe('date'); });
  it('time → time', () => { expect(getFirstColumnType('time')).toBe('time'); });
  it('mail → email', () => { expect(getFirstColumnType('mail')).toBe('email'); });
  it('phone → phone', () => { expect(getFirstColumnType('phone')).toBe('phone'); });
  it('image → image', () => { expect(getFirstColumnType('image')).toBe('image'); });
  it('html → html', () => { expect(getFirstColumnType('html')).toBe('html'); });
  it('code → code', () => { expect(getFirstColumnType('code')).toBe('code'); });
  it('url → url', () => { expect(getFirstColumnType('url')).toBe('url'); });
  it('tag → url (v1 alias)', () => { expect(getFirstColumnType('tag')).toBe('url'); });
  it('dropdown → status (closest v2 equivalent)', () => { expect(getFirstColumnType('dropdown')).toBe('status'); });
  it('list → text (editing is Phase 6)', () => { expect(getFirstColumnType('list')).toBe('text'); });
  it('input → text (editing is Phase 6)', () => { expect(getFirstColumnType('input')).toBe('text'); });
  it('checkbox → boolean', () => { expect(getFirstColumnType('checkbox')).toBe('boolean'); });
  it('unknown v1 type → text fallback', () => { expect(getFirstColumnType('unknown_type')).toBe('text'); });
});

describe('adaptV1Props — data mapping', () => {
  it('maps rowdata array-of-arrays to array-of-objects', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { data } = adaptV1Props(
      { string: 'Name', number: 'Age' },
      [['Alice', 30], ['Bob', 25]],
    );
    expect(data).toHaveLength(2);
    expect(data[0]).toEqual({ name: 'Alice', age: 30 });
    expect(data[1]).toEqual({ name: 'Bob', age: 25 });
  });

  it('converts label to snake_case key', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { columns } = adaptV1Props({ string: 'First Name' }, [['Alice']]);
    expect(columns[0].key).toBe('first_name');
  });

  it('preserves original label', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { columns } = adaptV1Props({ string: 'First Name' }, [['Alice']]);
    expect(columns[0].label).toBe('First Name');
  });

  it('returns empty for empty colname', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = adaptV1Props({}, [['Alice']]);
    expect(result).toEqual({ data: [], columns: [] });
  });

  it('returns empty for empty rowdata', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = adaptV1Props({ string: 'Name' }, []);
    expect(result).toEqual({ data: [], columns: [] });
  });

  it('handles rows with fewer cells than columns (fills null)', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { data } = adaptV1Props(
      { string: 'Name', number: 'Age' },
      [['Alice']], // Only 1 cell for 2 columns
    );
    expect(data[0]['age']).toBeNull();
  });
});
```

Create packages/core/src/README.md:

```markdown
# @tablecraft/core — Architecture Notes

## State Separation (CORE-08)

The core engine is **stateless**. `createTableEngine()` returns a pure computation
object — it has no internal mutable state.

### What the Engine Does

```
createTableEngine({ data: rows })
  │
  ├── inferSchema(data)        → Promise<ColumnInferenceMap>   (async, via scheduleIdleWork)
  ├── resolveColumns(data, ...) → ResolvedColumn[]              (sync, safe to call immediately)
  ├── processRows(rows, cols)   → ProcessedRow[]                (sync, applies renderers)
  └── getConfig()               → TableConfig (immutable copy)  (sync)
```

### Where State Lives (Phase 3+)

Reactive state is owned by the **Svelte component layer** (`packages/svelte`), not by the engine:

| State | Owner | Type |
|-------|-------|------|
| `columns` | `Table.svelte` | `$state(ResolvedColumn[])` |
| `sortState` | `Table.svelte` | `$state({ key, dir } \| null)` |
| `filterState` | `Table.svelte` | `$state(Record<string, string>)` |
| `visibleRows` | `Table.svelte` | `$derived(ProcessedRow[])` |

### Why This Matters

- Changing sort state does NOT re-run inference or re-create column definitions
- Changing filter state does NOT re-render cells that are still visible
- The engine can be used in **any framework** (React, Vue, vanilla JS) — the state layer adapts

### Inference Timing (CORE-05)

```
User calls <Table data={rows} />
  │
  ├─── resolveColumns() → text fallback for all columns → table renders immediately
  │
  └─── inferSchema() via scheduleIdleWork()
         │
         └─── (browser idle / Node setImmediate) → ColumnInferenceMap
                │
                └─── resolveColumns(data, undefined, map) → real types
                       │
                       └─── Svelte $derived updates → cells re-render with correct types
```

## Renderer Registry (CORE-06)

Built-in renderers and custom plugins use the **same API**:

```typescript
import { registerRenderer } from '@tablecraft/core/registry';
registerRenderer('sparkline', (value, column) => ({ kind: 'text', value: String(value) }));
```

Built-ins register themselves on module import. Custom renderers override built-ins
by calling `registerRenderer` with the same type name (emits a `console.warn`).

## Tree-Shaking (CORE-07)

Importing `@tablecraft/core/renderers/currency` loads **only** the currency renderer.
Importing `@tablecraft/core` loads **all 17** Tier 1 renderers (via renderers/index.ts).

No renderer file imports from another renderer file — verified by automated tests.
```
  </action>
  <verify>
    <automated>cd /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind && pnpm --filter @tablecraft/core test --reporter=verbose 2>&1 | grep -E "(engine|compat|PASS|FAIL|Tests)" | tail -20</automated>
  </verify>
  <acceptance_criteria>
    - packages/core/src/engine/index.ts exists with createTableEngine export
    - packages/core/src/compat/v1.ts exists with adaptV1Props export
    - packages/core/src/README.md exists (grep "State Separation" returns match)
    - pnpm --filter @tablecraft/core test exits 0
    - All engine.test.ts tests pass (createTableEngine returns correct methods)
    - All v1.test.ts tests pass (all 14 v1 type mappings verified + edge cases)
    - pnpm --filter @tablecraft/core typecheck exits 0
  </acceptance_criteria>
  <done>engine/index.ts, compat/v1.ts, README.md created. All engine + compat tests pass. TypeScript strict mode satisfied.</done>
</task>

<task type="auto">
  <name>Task 2: Update index.ts + package.json exports map</name>
  <files>
    packages/core/src/index.ts
    packages/core/package.json
  </files>
  <read_first>
    - packages/core/src/index.ts — READ THE FULL FILE before editing; append new exports, do not remove Phase 1 exports
    - packages/core/package.json — READ THE FULL FILE before editing; add renderer entries to exports map and add peerDependencies
    - .planning/phases/02-core-engine-type-inference-renderer-registry/02-RESEARCH.md — Package.json Exports Map Pattern section (exact format for 17 renderer entries)
  </read_first>
  <action>
STEP 1 — Update packages/core/src/index.ts. Read existing file first. Replace entire file content with:

```typescript
/**
 * @tablecraft/core — Public API
 *
 * Phase 1: Type definitions and defineColumns helper.
 * Phase 2: createTableEngine(), renderer registry, all 17 built-in renderers, v1 shim.
 *
 * Tree-shaking: importing this file loads all 17 renderers.
 * For selective loading: import '@tablecraft/core/renderers/currency' directly.
 */

// ---------------------------------------------------------------------------
// Phase 1 exports (unchanged)
// ---------------------------------------------------------------------------

export type {
  ColumnType,
  ColumnOverrideShort,
  ColumnDefinition,
  TableConfig,
  InferenceResult,
  ColumnInferenceMap,
} from './types.js';

export { defineColumns } from './types.js';

// ---------------------------------------------------------------------------
// Phase 2 type exports
// ---------------------------------------------------------------------------

export type {
  CellDescriptor,
  RendererFn,
  ResolvedColumn,
  ProcessedRow,
  BadgeVariant,
} from './types.js';

// ---------------------------------------------------------------------------
// Phase 2 engine factory
// ---------------------------------------------------------------------------

export { createTableEngine } from './engine/index.js';
export type { TableEngine } from './engine/index.js';

// ---------------------------------------------------------------------------
// Phase 2 renderer registry
// ---------------------------------------------------------------------------

export {
  registerRenderer,
  getRenderer,
  hasRenderer,
  unregisterRenderer,
  clearRegistry,
  getRegisteredTypes,
} from './registry/index.js';

// ---------------------------------------------------------------------------
// Phase 2 inference (exported for consumers who want to run inference directly)
// ---------------------------------------------------------------------------

export { inferSchema, sampleRows } from './inference/index.js';

// ---------------------------------------------------------------------------
// Phase 2 design tokens
// ---------------------------------------------------------------------------

export { DEFAULT_TOKENS } from './tokens.js';
export type { TokenName } from './tokens.js';

// ---------------------------------------------------------------------------
// Phase 2 v1 compatibility shim
// ---------------------------------------------------------------------------

export { adaptV1Props } from './compat/v1.js';

// ---------------------------------------------------------------------------
// Phase 2 all 17 Tier 1 renderers (side-effect: registers all on import)
// ---------------------------------------------------------------------------

export {
  textRenderer,
  numberRenderer,
  integerRenderer,
  currencyRenderer,
  percentageRenderer,
  booleanRenderer,
  dateRenderer,
  datetimeRenderer,
  timeRenderer,
  emailRenderer,
  urlRenderer,
  phoneRenderer,
  imageRenderer,
  badgeRenderer,
  statusRenderer,
  codeRenderer,
  htmlRenderer,
  configureHtmlRenderer,
} from './renderers/index.js';

// ---------------------------------------------------------------------------
// Phase 2 scheduler (exported for consumers who want to use it directly)
// ---------------------------------------------------------------------------

export { scheduleIdleWork } from './scheduler.js';
```

STEP 2 — Update packages/core/package.json. Read the existing file first, then write the complete updated file:

```json
{
  "name": "@tablecraft/core",
  "version": "0.0.1",
  "description": "Framework-agnostic core engine for @tablecraft — type inference, renderer registry, state management",
  "license": "MIT",
  "author": "Arshdeep Singh <arsh22sahni@gmail.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/ArshdeepSahni/Svelte-Tables-Tailwind",
    "directory": "packages/core"
  },
  "engines": {
    "node": ">=20.19.0 || >=22.12.0"
  },
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    },
    "./renderers/text": {
      "import": { "types": "./dist/renderers/text.d.ts", "default": "./dist/renderers/text.js" },
      "require": { "types": "./dist/renderers/text.d.cts", "default": "./dist/renderers/text.cjs" }
    },
    "./renderers/number": {
      "import": { "types": "./dist/renderers/number.d.ts", "default": "./dist/renderers/number.js" },
      "require": { "types": "./dist/renderers/number.d.cts", "default": "./dist/renderers/number.cjs" }
    },
    "./renderers/integer": {
      "import": { "types": "./dist/renderers/integer.d.ts", "default": "./dist/renderers/integer.js" },
      "require": { "types": "./dist/renderers/integer.d.cts", "default": "./dist/renderers/integer.cjs" }
    },
    "./renderers/currency": {
      "import": { "types": "./dist/renderers/currency.d.ts", "default": "./dist/renderers/currency.js" },
      "require": { "types": "./dist/renderers/currency.d.cts", "default": "./dist/renderers/currency.cjs" }
    },
    "./renderers/percentage": {
      "import": { "types": "./dist/renderers/percentage.d.ts", "default": "./dist/renderers/percentage.js" },
      "require": { "types": "./dist/renderers/percentage.d.cts", "default": "./dist/renderers/percentage.cjs" }
    },
    "./renderers/boolean": {
      "import": { "types": "./dist/renderers/boolean.d.ts", "default": "./dist/renderers/boolean.js" },
      "require": { "types": "./dist/renderers/boolean.d.cts", "default": "./dist/renderers/boolean.cjs" }
    },
    "./renderers/date": {
      "import": { "types": "./dist/renderers/date.d.ts", "default": "./dist/renderers/date.js" },
      "require": { "types": "./dist/renderers/date.d.cts", "default": "./dist/renderers/date.cjs" }
    },
    "./renderers/datetime": {
      "import": { "types": "./dist/renderers/datetime.d.ts", "default": "./dist/renderers/datetime.js" },
      "require": { "types": "./dist/renderers/datetime.d.cts", "default": "./dist/renderers/datetime.cjs" }
    },
    "./renderers/time": {
      "import": { "types": "./dist/renderers/time.d.ts", "default": "./dist/renderers/time.js" },
      "require": { "types": "./dist/renderers/time.d.cts", "default": "./dist/renderers/time.cjs" }
    },
    "./renderers/email": {
      "import": { "types": "./dist/renderers/email.d.ts", "default": "./dist/renderers/email.js" },
      "require": { "types": "./dist/renderers/email.d.cts", "default": "./dist/renderers/email.cjs" }
    },
    "./renderers/url": {
      "import": { "types": "./dist/renderers/url.d.ts", "default": "./dist/renderers/url.js" },
      "require": { "types": "./dist/renderers/url.d.cts", "default": "./dist/renderers/url.cjs" }
    },
    "./renderers/phone": {
      "import": { "types": "./dist/renderers/phone.d.ts", "default": "./dist/renderers/phone.js" },
      "require": { "types": "./dist/renderers/phone.d.cts", "default": "./dist/renderers/phone.cjs" }
    },
    "./renderers/image": {
      "import": { "types": "./dist/renderers/image.d.ts", "default": "./dist/renderers/image.js" },
      "require": { "types": "./dist/renderers/image.d.cts", "default": "./dist/renderers/image.cjs" }
    },
    "./renderers/badge": {
      "import": { "types": "./dist/renderers/badge.d.ts", "default": "./dist/renderers/badge.js" },
      "require": { "types": "./dist/renderers/badge.d.cts", "default": "./dist/renderers/badge.cjs" }
    },
    "./renderers/status": {
      "import": { "types": "./dist/renderers/status.d.ts", "default": "./dist/renderers/status.js" },
      "require": { "types": "./dist/renderers/status.d.cts", "default": "./dist/renderers/status.cjs" }
    },
    "./renderers/code": {
      "import": { "types": "./dist/renderers/code.d.ts", "default": "./dist/renderers/code.js" },
      "require": { "types": "./dist/renderers/code.d.cts", "default": "./dist/renderers/code.cjs" }
    },
    "./renderers/html": {
      "import": { "types": "./dist/renderers/html.d.ts", "default": "./dist/renderers/html.js" },
      "require": { "types": "./dist/renderers/html.d.cts", "default": "./dist/renderers/html.cjs" }
    }
  },
  "files": [
    "dist",
    "src"
  ],
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "dompurify": ">=3.0.0"
  },
  "peerDependenciesMeta": {
    "dompurify": {
      "optional": true
    }
  },
  "devDependencies": {
    "typescript": "^5.8.3",
    "vite": "^8.0.1",
    "vite-plugin-dts": "^4.5.4",
    "vitest": "^4.1.0"
  },
  "keywords": [
    "tablecraft",
    "table",
    "data-grid",
    "typescript",
    "framework-agnostic"
  ]
}
```
  </action>
  <verify>
    <automated>cd /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind && pnpm --filter @tablecraft/core test 2>&1 | tail -5 && pnpm --filter @tablecraft/core typecheck 2>&1 | tail -5</automated>
  </verify>
  <acceptance_criteria>
    - grep "createTableEngine" packages/core/src/index.ts returns a match
    - grep "adaptV1Props" packages/core/src/index.ts returns a match
    - grep "clearRegistry" packages/core/src/index.ts returns a match
    - grep "renderers/currency" packages/core/package.json returns a match
    - grep -c "renderers/" packages/core/package.json returns >= 17 (17 renderer export entries)
    - grep "dompurify" packages/core/package.json returns a match (peerDependencies)
    - pnpm --filter @tablecraft/core test exits 0
    - pnpm --filter @tablecraft/core typecheck exits 0
  </acceptance_criteria>
  <done>index.ts exports all Phase 2 public symbols. package.json has 17 renderer export entries and DOMPurify as optional peer dependency. All tests still pass.</done>
</task>

</tasks>

<verification>
After both tasks complete:
1. `pnpm --filter @tablecraft/core test` — all tests pass (engine + compat + all previous)
2. `pnpm --filter @tablecraft/core typecheck` — zero errors
3. `grep "createTableEngine" packages/core/src/index.ts` — match
4. `grep "adaptV1Props" packages/core/src/index.ts` — match
5. `grep -c "renderers/" packages/core/package.json` — >= 17
6. Verify v1 shim test for 'dropdown' → 'status' mapping passes
7. Verify engine.resolveColumns returns text before inference, correct type after inferenceMap provided
</verification>

<success_criteria>
- createTableEngine({ data: rows }) returns object with 4 methods
- engine.inferSchema([]) resolves to {} (Promise-based)
- engine.resolveColumns(rows) returns text type before inference
- adaptV1Props({ dropdown: 'Status' }, [['active']]).columns[0].type === 'status'
- console.warn fired with migration URL on every adaptV1Props call
- All 14 v1 type mappings correct (including tag→url, list→text edge cases)
- packages/core/src/index.ts exports all public symbols from Phase 2
- packages/core/package.json has 17 renderer entries in exports and dompurify in peerDependencies
</success_criteria>

<output>
After completion, create `.planning/phases/02-core-engine-type-inference-renderer-registry/02-05-SUMMARY.md`
</output>
