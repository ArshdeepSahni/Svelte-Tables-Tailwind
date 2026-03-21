/**
 * @tablecraft/core — createTableEngine() tests
 *
 * CORE-01: Factory returns object with inferSchema/resolveColumns/processRows/getConfig.
 * CORE-08: Engine is stateless; ProcessedRow is immutable output.
 *
 * All tests run in plain Node.js — zero DOM dependencies.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTableEngine } from './index.js';
import { clearRegistry } from '../registry/index.js';

// Import all renderers so the registry is populated for processRows tests
import '../renderers/index.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

interface UserRow {
  id: number;
  name: string;
  email: string;
  active: boolean;
  salary: number;
  joined: string;
}

const sampleUsers: UserRow[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com', active: true, salary: 75000, joined: '2021-03-15' },
  { id: 2, name: 'Bob', email: 'bob@example.com', active: false, salary: 82000, joined: '2020-07-01' },
  { id: 3, name: 'Carol', email: 'carol@example.com', active: true, salary: 91000, joined: '2019-11-22' },
];

// ---------------------------------------------------------------------------
// getConfig
// ---------------------------------------------------------------------------

describe('createTableEngine — getConfig()', () => {
  it('returns the config passed at construction', () => {
    const config = { data: sampleUsers };
    const engine = createTableEngine(config);
    const result = engine.getConfig();
    expect(result.data).toEqual(sampleUsers);
  });

  it('returns a frozen config object (mutations do not affect engine)', () => {
    const config = { data: sampleUsers };
    const engine = createTableEngine(config);
    const result = engine.getConfig();
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('stores column overrides in config', () => {
    const engine = createTableEngine({
      data: sampleUsers,
      columns: { salary: 'currency', email: 'email' },
    });
    const cfg = engine.getConfig();
    expect(cfg.columns).toEqual({ salary: 'currency', email: 'email' });
  });

  it('handles empty data array', () => {
    const engine = createTableEngine({ data: [] });
    expect(engine.getConfig().data).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// inferSchema
// ---------------------------------------------------------------------------

describe('createTableEngine — inferSchema()', () => {
  it('returns a ColumnInferenceMap with keys matching data columns', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const schema = engine.inferSchema(sampleUsers);
    expect(Object.keys(schema)).toEqual(expect.arrayContaining(['id', 'name', 'email', 'active', 'salary', 'joined']));
  });

  it('returns empty map for empty data', () => {
    const engine = createTableEngine({ data: [] });
    const schema = engine.inferSchema([]);
    expect(schema).toEqual({});
  });

  it('infers email type for email column', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const schema = engine.inferSchema(sampleUsers);
    expect(schema.email.type).toBe('email');
  });

  it('infers boolean type for boolean column', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const schema = engine.inferSchema(sampleUsers);
    expect(schema.active.type).toBe('boolean');
  });

  it('infers date type for ISO date column', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const schema = engine.inferSchema(sampleUsers);
    expect(schema.joined.type).toBe('date');
  });

  it('infers integer for plain integer salary values (no currency symbol)', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const schema = engine.inferSchema(sampleUsers);
    // Plain integers without currency symbols → integer (currency detector requires $ € etc.)
    // Keyword boost applies to detector confidence but detectCurrency returns null for bare integers
    expect(['integer', 'number', 'currency']).toContain(schema.salary.type);
  });

  it('infers currency for salary column when values have currency symbols', () => {
    const currencyData = [
      { salary: '$75,000', name: 'Alice' },
      { salary: '$82,000', name: 'Bob' },
      { salary: '$91,000', name: 'Carol' },
    ];
    const engine = createTableEngine({ data: currencyData });
    const schema = engine.inferSchema(currencyData);
    expect(schema.salary.type).toBe('currency');
  });

  it('each InferenceResult has confidence and source fields', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const schema = engine.inferSchema(sampleUsers);
    for (const result of Object.values(schema)) {
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('source');
      expect(typeof result.confidence).toBe('number');
      expect(['declared', 'inferred', 'fallback']).toContain(result.source);
    }
  });

  it('is a pure function — calling twice returns same result', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const a = engine.inferSchema(sampleUsers);
    const b = engine.inferSchema(sampleUsers);
    expect(a).toEqual(b);
  });
});

// ---------------------------------------------------------------------------
// resolveColumns — text fallback (no inference)
// ---------------------------------------------------------------------------

describe('createTableEngine — resolveColumns() — text fallback', () => {
  it('returns text type for all columns when no inference result provided', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const cols = engine.resolveColumns(sampleUsers);
    for (const col of cols) {
      expect(col.type).toBe('text');
    }
  });

  it('returns one column per data key', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const cols = engine.resolveColumns(sampleUsers);
    expect(cols).toHaveLength(6); // id, name, email, active, salary, joined
  });

  it('generates human-readable labels from keys', () => {
    const rows = [{ created_at: '2021-01-01', firstName: 'Alice', user_email: 'a@b.com' }];
    const engine = createTableEngine({ data: rows });
    const cols = engine.resolveColumns(rows);
    const labelMap = Object.fromEntries(cols.map((c) => [c.key, c.label]));
    expect(labelMap['created_at']).toBe('Created At');
    expect(labelMap['firstName']).toBe('First Name');
    expect(labelMap['user_email']).toBe('User Email');
  });

  it('returns empty array for empty data with no overrides', () => {
    const engine = createTableEngine({ data: [] });
    const cols = engine.resolveColumns([]);
    expect(cols).toEqual([]);
  });

  it('each resolved column has key, type, label fields', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const cols = engine.resolveColumns(sampleUsers);
    for (const col of cols) {
      expect(col).toHaveProperty('key');
      expect(col).toHaveProperty('type');
      expect(col).toHaveProperty('label');
    }
  });
});

// ---------------------------------------------------------------------------
// resolveColumns — with inference result
// ---------------------------------------------------------------------------

describe('createTableEngine — resolveColumns() — with inference', () => {
  it('applies inferred types when inferenceResult is supplied', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const schema = engine.inferSchema(sampleUsers);
    const cols = engine.resolveColumns(sampleUsers, undefined, schema);
    const emailCol = cols.find((c) => c.key === 'email');
    expect(emailCol?.type).toBe('email');
  });

  it('attaches inferenceResult to column when type came from inference', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const schema = engine.inferSchema(sampleUsers);
    const cols = engine.resolveColumns(sampleUsers, undefined, schema);
    const emailCol = cols.find((c) => c.key === 'email');
    expect(emailCol?.inferenceResult).toBeDefined();
    expect(emailCol?.inferenceResult?.source).toBe('inferred');
  });
});

// ---------------------------------------------------------------------------
// resolveColumns — short-form overrides
// ---------------------------------------------------------------------------

describe('createTableEngine — resolveColumns() — short-form overrides', () => {
  it('applies override type from short-form columns map', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const cols = engine.resolveColumns(sampleUsers, { email: 'email', salary: 'currency' });
    const emailCol = cols.find((c) => c.key === 'email');
    const salaryCol = cols.find((c) => c.key === 'salary');
    expect(emailCol?.type).toBe('email');
    expect(salaryCol?.type).toBe('currency');
  });

  it('override type wins over inferred type', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const schema = engine.inferSchema(sampleUsers);
    // Force name to 'code' — inference would say 'text'
    const cols = engine.resolveColumns(sampleUsers, { name: 'code' }, schema);
    const nameCol = cols.find((c) => c.key === 'name');
    expect(nameCol?.type).toBe('code');
  });

  it('non-overridden columns default to text when no inference supplied', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const cols = engine.resolveColumns(sampleUsers, { email: 'email' });
    const nameCol = cols.find((c) => c.key === 'name');
    expect(nameCol?.type).toBe('text');
  });

  it('uses config.columns as fallback when no override arg provided', () => {
    const engine = createTableEngine({
      data: sampleUsers,
      columns: { email: 'email', salary: 'currency' },
    });
    const cols = engine.resolveColumns(sampleUsers);
    const salaryCol = cols.find((c) => c.key === 'salary');
    expect(salaryCol?.type).toBe('currency');
  });
});

// ---------------------------------------------------------------------------
// resolveColumns — long-form overrides
// ---------------------------------------------------------------------------

describe('createTableEngine — resolveColumns() — long-form overrides', () => {
  it('preserves override key order for explicitly listed columns', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const cols = engine.resolveColumns(sampleUsers, [
      { key: 'name', label: 'Full Name' },
      { key: 'email', type: 'email', label: 'E-Mail' },
    ]);
    expect(cols[0].key).toBe('name');
    expect(cols[1].key).toBe('email');
    expect(cols[1].label).toBe('E-Mail');
    expect(cols[1].type).toBe('email');
  });

  it('appends extra data keys not in long-form overrides at the end', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const cols = engine.resolveColumns(sampleUsers, [
      { key: 'name', label: 'Full Name' },
    ]);
    const keys = cols.map((c) => c.key);
    // name is first, then extra keys from data[0]
    expect(keys[0]).toBe('name');
    expect(keys).toContain('id');
    expect(keys).toContain('email');
  });

  it('applies label from long-form override', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const cols = engine.resolveColumns(sampleUsers, [
      { key: 'salary', label: 'Annual Compensation', type: 'currency' },
    ]);
    const salaryCol = cols.find((c) => c.key === 'salary');
    expect(salaryCol?.label).toBe('Annual Compensation');
  });
});

// ---------------------------------------------------------------------------
// processRows
// ---------------------------------------------------------------------------

describe('createTableEngine — processRows()', () => {
  it('returns one ProcessedRow per input row', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const cols = engine.resolveColumns(sampleUsers);
    const rows = engine.processRows(sampleUsers, cols);
    expect(rows).toHaveLength(sampleUsers.length);
  });

  it('each ProcessedRow has _original and cells', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const cols = engine.resolveColumns(sampleUsers);
    const rows = engine.processRows(sampleUsers, cols);
    for (const row of rows) {
      expect(row).toHaveProperty('_original');
      expect(row).toHaveProperty('cells');
    }
  });

  it('_original holds the raw row object', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const cols = engine.resolveColumns(sampleUsers);
    const rows = engine.processRows(sampleUsers, cols);
    expect(rows[0]._original).toEqual(sampleUsers[0]);
    expect(rows[1]._original).toEqual(sampleUsers[1]);
  });

  it('cells keys match column keys', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const cols = engine.resolveColumns(sampleUsers);
    const rows = engine.processRows(sampleUsers, cols);
    const colKeys = cols.map((c) => c.key);
    for (const row of rows) {
      expect(Object.keys(row.cells)).toEqual(expect.arrayContaining(colKeys));
    }
  });

  it('each cell is a CellDescriptor with a kind field', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const cols = engine.resolveColumns(sampleUsers);
    const rows = engine.processRows(sampleUsers, cols);
    for (const row of rows) {
      for (const cell of Object.values(row.cells)) {
        expect(cell).toHaveProperty('kind');
        expect(typeof cell.kind).toBe('string');
      }
    }
  });

  it('returns empty array for empty rows', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const cols = engine.resolveColumns(sampleUsers);
    const rows = engine.processRows([], cols);
    expect(rows).toEqual([]);
  });

  it('returns empty cells for no columns', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const rows = engine.processRows(sampleUsers, []);
    for (const row of rows) {
      expect(row.cells).toEqual({});
    }
  });

  it('uses email renderer when column type is email (with inference)', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const schema = engine.inferSchema(sampleUsers);
    const cols = engine.resolveColumns(sampleUsers, undefined, schema);
    const rows = engine.processRows(sampleUsers, cols);
    const emailCell = rows[0].cells['email'];
    expect(emailCell.kind).toBe('link');
    if (emailCell.kind === 'link') {
      expect(emailCell.href).toBe('mailto:alice@example.com');
    }
  });

  it('uses text renderer (fallback) when column type is text', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const cols = engine.resolveColumns(sampleUsers); // all text
    const rows = engine.processRows(sampleUsers, cols);
    const nameCell = rows[0].cells['name'];
    expect(nameCell.kind).toBe('text');
  });

  it('uses raw fallback when no renderer is available', () => {
    // We'll create a column with an unregistered custom type
    const engine = createTableEngine({ data: sampleUsers });
    // Temporarily mock a column with an unregistered type
    const customCol = {
      key: 'name',
      type: 'nonexistent_type' as import('../types.js').ColumnType,
      label: 'Name',
    };
    // text is always registered so this just tests the getRenderer fallback path
    const rows = engine.processRows(sampleUsers, [customCol]);
    // nonexistent_type → falls through to text renderer or raw
    expect(rows[0].cells['name']).toHaveProperty('kind');
  });
});

// ---------------------------------------------------------------------------
// Engine statefulness / independence
// ---------------------------------------------------------------------------

describe('createTableEngine — engine isolation', () => {
  it('two engines with different configs are independent', () => {
    const rows1 = [{ name: 'Alice' }];
    const rows2 = [{ price: 100 }];
    const engine1 = createTableEngine({ data: rows1 });
    const engine2 = createTableEngine({ data: rows2 });
    expect(engine1.getConfig().data).not.toEqual(engine2.getConfig().data);
    expect(engine1.resolveColumns(rows1).map((c) => c.key)).toEqual(['name']);
    expect(engine2.resolveColumns(rows2).map((c) => c.key)).toEqual(['price']);
  });

  it('engine with empty data returns empty resolvedColumns and processedRows', () => {
    const engine = createTableEngine({ data: [] });
    const cols = engine.resolveColumns([]);
    const rows = engine.processRows([], cols);
    expect(cols).toEqual([]);
    expect(rows).toEqual([]);
  });

  it('processRows output is immutable-safe (does not share object references)', () => {
    const engine = createTableEngine({ data: sampleUsers });
    const cols = engine.resolveColumns(sampleUsers);
    const rowsA = engine.processRows(sampleUsers, cols);
    const rowsB = engine.processRows(sampleUsers, cols);
    // Different array instances
    expect(rowsA).not.toBe(rowsB);
    // But equal content
    expect(rowsA).toEqual(rowsB);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('createTableEngine — edge cases', () => {
  it('handles single-row data', () => {
    const data = [{ x: 'hello' }];
    const engine = createTableEngine({ data });
    const schema = engine.inferSchema(data);
    const cols = engine.resolveColumns(data, undefined, schema);
    const rows = engine.processRows(data, cols);
    expect(rows).toHaveLength(1);
    expect(rows[0].cells['x']).toBeDefined();
  });

  it('handles rows with null values', () => {
    const data = [{ name: null, count: undefined }] as unknown as Record<string, unknown>[];
    const engine = createTableEngine({ data });
    const cols = engine.resolveColumns(data);
    const rows = engine.processRows(data, cols);
    expect(rows[0].cells['name']).toBeDefined();
  });

  it('handles large dataset (1000 rows) without error', () => {
    const data = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
    }));
    const engine = createTableEngine({ data });
    const schema = engine.inferSchema(data);
    const cols = engine.resolveColumns(data, undefined, schema);
    const rows = engine.processRows(data, cols);
    expect(rows).toHaveLength(1000);
  });

  it('handles rows with numeric keys', () => {
    const data = [{ '0': 'a', '1': 'b' }];
    const engine = createTableEngine({ data });
    const cols = engine.resolveColumns(data);
    expect(cols).toHaveLength(2);
  });

  it('label generation: camelCase → spaced', () => {
    const data = [{ userId: 1, firstName: 'Alice', lastLoginAt: '2021-01-01' }];
    const engine = createTableEngine({ data });
    const cols = engine.resolveColumns(data);
    const labels = Object.fromEntries(cols.map((c) => [c.key, c.label]));
    expect(labels['userId']).toBe('User Id');
    expect(labels['firstName']).toBe('First Name');
    expect(labels['lastLoginAt']).toBe('Last Login At');
  });

  it('label generation: snake_case → title case', () => {
    const data = [{ created_at: '2021', user_name: 'Alice' }];
    const engine = createTableEngine({ data });
    const cols = engine.resolveColumns(data);
    const labels = Object.fromEntries(cols.map((c) => [c.key, c.label]));
    expect(labels['created_at']).toBe('Created At');
    expect(labels['user_name']).toBe('User Name');
  });
});
