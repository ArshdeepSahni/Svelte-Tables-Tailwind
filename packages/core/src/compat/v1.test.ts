/**
 * @tablecraft/core — v1 compatibility shim tests
 *
 * CORE-10: adaptV1Props converts v1 colname/rowdata → v2 { data, columns }.
 * CORE-11: Always emits console.warn with deprecation URL.
 *
 * Test coverage:
 * - All v1 type mappings (dropdown, list, input, checkbox, mail, tag)
 * - Pass-through of already-valid v2 types (text, number, currency, etc.)
 * - Key generation from label strings
 * - Row array → keyed object mapping
 * - Empty colname / empty rowdata edge cases
 * - console.warn always emitted
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { adaptV1Props } from './v1.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Capture console.warn calls during a test block */
function captureWarn() {
  const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  return spy;
}

// ---------------------------------------------------------------------------
// console.warn deprecation
// ---------------------------------------------------------------------------

describe('adaptV1Props — deprecation warning', () => {
  it('emits console.warn on every call', () => {
    const spy = captureWarn();
    adaptV1Props({ text: 'Name' }, [['Alice']]);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('includes the deprecation URL in the warning', () => {
    const spy = captureWarn();
    adaptV1Props({ text: 'Name' }, [['Alice']]);
    const msg = spy.mock.calls[0][0] as string;
    expect(msg).toContain('https://tablecraft.dev/migrate/v1');
    spy.mockRestore();
  });

  it('includes "colname/rowdata API is deprecated" in the warning', () => {
    const spy = captureWarn();
    adaptV1Props({ text: 'Name' }, [['Alice']]);
    const msg = spy.mock.calls[0][0] as string;
    expect(msg).toContain('colname/rowdata API is deprecated');
    spy.mockRestore();
  });

  it('emits warn even for empty inputs', () => {
    const spy = captureWarn();
    adaptV1Props({}, []);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('emits warn on each separate call', () => {
    const spy = captureWarn();
    adaptV1Props({ text: 'Name' }, [['Alice']]);
    adaptV1Props({ text: 'Name' }, [['Bob']]);
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// v1 → v2 type mappings
// ---------------------------------------------------------------------------

describe('adaptV1Props — v1 type mappings', () => {
  let spy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => { spy = captureWarn(); });
  afterEach(() => { spy.mockRestore(); });

  it('maps dropdown → status', () => {
    const { columns } = adaptV1Props({ dropdown: 'Status' }, []);
    expect(columns[0].type).toBe('status');
  });

  it('maps list → text', () => {
    const { columns } = adaptV1Props({ list: 'Tags' }, []);
    expect(columns[0].type).toBe('text');
  });

  it('maps input → text', () => {
    const { columns } = adaptV1Props({ input: 'Notes' }, []);
    expect(columns[0].type).toBe('text');
  });

  it('maps checkbox → boolean', () => {
    const { columns } = adaptV1Props({ checkbox: 'Active' }, []);
    expect(columns[0].type).toBe('boolean');
  });

  it('maps mail → email', () => {
    const { columns } = adaptV1Props({ mail: 'Email' }, []);
    expect(columns[0].type).toBe('email');
  });

  it('maps tag → url', () => {
    const { columns } = adaptV1Props({ tag: 'Profile URL' }, []);
    expect(columns[0].type).toBe('url');
  });

  it('passes through already-valid v2 type: text', () => {
    const { columns } = adaptV1Props({ text: 'Name' }, []);
    expect(columns[0].type).toBe('text');
  });

  it('passes through already-valid v2 type: number', () => {
    const { columns } = adaptV1Props({ number: 'Score' }, []);
    expect(columns[0].type).toBe('number');
  });

  it('passes through already-valid v2 type: currency', () => {
    const { columns } = adaptV1Props({ currency: 'Price' }, []);
    expect(columns[0].type).toBe('currency');
  });

  it('passes through already-valid v2 type: date', () => {
    const { columns } = adaptV1Props({ date: 'Created' }, []);
    expect(columns[0].type).toBe('date');
  });

  it('passes through already-valid v2 type: image', () => {
    const { columns } = adaptV1Props({ image: 'Avatar' }, []);
    expect(columns[0].type).toBe('image');
  });

  it('passes through already-valid v2 type: html', () => {
    const { columns } = adaptV1Props({ html: 'Description' }, []);
    expect(columns[0].type).toBe('html');
  });

  it('falls back to text for completely unknown v1 type', () => {
    const { columns } = adaptV1Props({ totally_unknown_v1_type: 'Mystery' }, []);
    expect(columns[0].type).toBe('text');
  });
});

// ---------------------------------------------------------------------------
// Column definition output
// ---------------------------------------------------------------------------

describe('adaptV1Props — columns output', () => {
  let spy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => { spy = captureWarn(); });
  afterEach(() => { spy.mockRestore(); });

  it('returns one column per colname entry', () => {
    const { columns } = adaptV1Props(
      { text: 'Name', mail: 'Email', number: 'Score' },
      []
    );
    expect(columns).toHaveLength(3);
  });

  it('preserves column order from colname entries', () => {
    const { columns } = adaptV1Props(
      { text: 'Name', checkbox: 'Active', dropdown: 'Status' },
      []
    );
    expect(columns[0].key).toBe('name');
    expect(columns[1].key).toBe('active');
    expect(columns[2].key).toBe('status');
  });

  it('stores the original label in column.label', () => {
    const { columns } = adaptV1Props({ text: 'Full Name' }, []);
    expect(columns[0].label).toBe('Full Name');
  });

  it('converts label to snake_case key: single word', () => {
    const { columns } = adaptV1Props({ text: 'Name' }, []);
    expect(columns[0].key).toBe('name');
  });

  it('converts label to snake_case key: multi-word with spaces', () => {
    const { columns } = adaptV1Props({ text: 'First Name' }, []);
    expect(columns[0].key).toBe('first_name');
  });

  it('converts label to snake_case key: strips special chars', () => {
    const { columns } = adaptV1Props({ text: 'E-Mail Address' }, []);
    // 'E-Mail Address' → 'email_address' (hyphen stripped, spaces → _)
    expect(columns[0].key).toBe('email_address');
  });

  it('returns empty columns array for empty colname', () => {
    const { columns } = adaptV1Props({}, []);
    expect(columns).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Data (rows) output
// ---------------------------------------------------------------------------

describe('adaptV1Props — data output', () => {
  let spy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => { spy = captureWarn(); });
  afterEach(() => { spy.mockRestore(); });

  it('returns one data object per rowdata entry', () => {
    const { data } = adaptV1Props(
      { text: 'Name' },
      [['Alice'], ['Bob'], ['Carol']]
    );
    expect(data).toHaveLength(3);
  });

  it('maps positional row values to column keys', () => {
    const { data } = adaptV1Props(
      { text: 'Name', number: 'Age', mail: 'Email' },
      [['Alice', 30, 'alice@example.com']]
    );
    expect(data[0]['name']).toBe('Alice');
    expect(data[0]['age']).toBe(30);
    expect(data[0]['email']).toBe('alice@example.com');
  });

  it('handles multiple rows correctly', () => {
    const { data } = adaptV1Props(
      { text: 'Name', checkbox: 'Active' },
      [
        ['Alice', true],
        ['Bob', false],
      ]
    );
    expect(data[0]).toEqual({ name: 'Alice', active: true });
    expect(data[1]).toEqual({ name: 'Bob', active: false });
  });

  it('returns empty data array for empty rowdata', () => {
    const { data } = adaptV1Props({ text: 'Name' }, []);
    expect(data).toEqual([]);
  });

  it('sets undefined for missing columns in short row', () => {
    const { data } = adaptV1Props(
      { text: 'Name', number: 'Age', mail: 'Email' },
      [['Alice']] // only 1 value for 3 columns
    );
    expect(data[0]['name']).toBe('Alice');
    expect(data[0]['age']).toBeUndefined();
    expect(data[0]['email']).toBeUndefined();
  });

  it('handles null and undefined values in row arrays', () => {
    const { data } = adaptV1Props(
      { text: 'Name', number: 'Score' },
      [[null, undefined]] as unknown[][]
    );
    expect(data[0]['name']).toBeNull();
    expect(data[0]['score']).toBeUndefined();
  });

  it('handles boolean values (checkbox column)', () => {
    const { data } = adaptV1Props(
      { checkbox: 'Active' },
      [[true], [false], [true]]
    );
    expect(data[0]['active']).toBe(true);
    expect(data[1]['active']).toBe(false);
  });

  it('handles numeric values', () => {
    const { data } = adaptV1Props(
      { number: 'Price' },
      [[99.99], [0], [-5]]
    );
    expect(data[0]['price']).toBe(99.99);
    expect(data[1]['price']).toBe(0);
    expect(data[2]['price']).toBe(-5);
  });
});

// ---------------------------------------------------------------------------
// Full round-trip: mixed types
// ---------------------------------------------------------------------------

describe('adaptV1Props — full round-trip', () => {
  let spy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => { spy = captureWarn(); });
  afterEach(() => { spy.mockRestore(); });

  it('round-trip with all common v1 types', () => {
    const { data, columns } = adaptV1Props(
      {
        text:     'Name',
        mail:     'Email',
        checkbox: 'Active',
        dropdown: 'Status',
        number:   'Score',
        date:     'Created',
      },
      [
        ['Alice', 'alice@example.com', true, 'active', 95, '2021-01-01'],
        ['Bob',   'bob@example.com',  false, 'pending', 72, '2020-06-15'],
      ]
    );

    // Column type mappings
    expect(columns.find((c) => c.key === 'name')?.type).toBe('text');
    expect(columns.find((c) => c.key === 'email')?.type).toBe('email');
    expect(columns.find((c) => c.key === 'active')?.type).toBe('boolean');
    expect(columns.find((c) => c.key === 'status')?.type).toBe('status');
    expect(columns.find((c) => c.key === 'score')?.type).toBe('number');
    expect(columns.find((c) => c.key === 'created')?.type).toBe('date');

    // Data rows
    expect(data[0]['name']).toBe('Alice');
    expect(data[0]['email']).toBe('alice@example.com');
    expect(data[0]['active']).toBe(true);
    expect(data[0]['status']).toBe('active');
    expect(data[0]['score']).toBe(95);
    expect(data[0]['created']).toBe('2021-01-01');

    expect(data[1]['name']).toBe('Bob');
    expect(data[1]['active']).toBe(false);
  });

  it('round-trip with tag and list types', () => {
    const { columns } = adaptV1Props(
      { tag: 'Profile URL', list: 'Skills' },
      []
    );
    expect(columns[0].type).toBe('url');
    expect(columns[1].type).toBe('text');
  });
});
