/**
 * @tablecraft/svelte — Advanced features: column visibility + aggregate footer tests
 *
 * Phase 6 Plan 02 — ADV-05, ADV-07
 */

import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/svelte';
import type { ColumnDefinition, ResolvedColumn } from '@tablecraft/core';
import type { Row } from '../lib/types.js';
import Table from '../lib/Table.svelte';

// ---------------------------------------------------------------------------
// Core engine mock — deterministic, preserves aggregate field from overrides
// ---------------------------------------------------------------------------

vi.mock('@tablecraft/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tablecraft/core')>();
  return {
    ...actual,
    createTableEngine: vi.fn(() => ({
      inferSchema: vi.fn(() => ({})),
      resolveColumns: vi.fn(
        (data: Row[], overrides?: ColumnDefinition<Row>[] | Record<string, unknown>, _inference?: unknown) => {
          // Build base columns from data[0] keys
          const baseKeys = Object.keys(data[0] ?? {});
          // If long-form overrides provided, use them (preserving all fields including aggregate)
          if (Array.isArray(overrides) && overrides.length > 0) {
            const overrideMap = new Map(overrides.map((c) => [c.key, c]));
            const overrideKeys = overrides.map((c) => c.key as string);
            const extra = baseKeys.filter((k) => !overrideMap.has(k));
            return [...overrideKeys, ...extra].map((key) => {
              const override = overrideMap.get(key) ?? {};
              return {
                key,
                type: 'text' as const,
                label: key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
                sortable: true,
                ...override,
              } as ResolvedColumn;
            });
          }
          // Short-form or no overrides: derive from data[0]
          return baseKeys.map((key) => ({
            key,
            type: 'text' as const,
            label: key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
            sortable: true,
          }));
        },
      ),
      processRows: vi.fn((rows: Row[], cols: ResolvedColumn[]) =>
        rows.map((row) => ({
          _original: row,
          cells: Object.fromEntries(
            cols.map((c) => [c.key, { kind: 'text', value: String(row[c.key] ?? '') }]),
          ),
        })),
      ),
      getConfig: vi.fn(() => ({})),
    })),
  };
});

// ---------------------------------------------------------------------------
// 1. Column visibility (ADV-05)
// ---------------------------------------------------------------------------

describe('column visibility — hiddenColumns (ADV-05)', () => {
  it('hides the "name" column header when hiddenColumns contains "name"', async () => {
    const data: Row[] = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ];
    const hiddenColumns = new Set<string>(['name']);

    const { container } = render(Table, {
      props: { data, hiddenColumns, filterable: false },
    });
    await act();

    // No th with text "Name" should be in the DOM
    const headers = Array.from(container.querySelectorAll('th')).map((th) => th.textContent?.trim());
    expect(headers.some((h) => h === 'Name')).toBe(false);
    // "Age" header should still be present
    expect(headers.some((h) => h === 'Age')).toBe(true);
  });

  it('hides body cells for the hidden column', async () => {
    const data: Row[] = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ];
    const hiddenColumns = new Set<string>(['name']);

    const { container } = render(Table, {
      props: { data, hiddenColumns, filterable: false },
    });
    await act();

    // No td should contain Alice or Bob (name column values)
    const cells = Array.from(container.querySelectorAll('td')).map((td) => td.textContent?.trim());
    // The name values should not appear in any td
    expect(cells.some((c) => c === 'Alice')).toBe(false);
    expect(cells.some((c) => c === 'Bob')).toBe(false);
    // Age values should still appear
    expect(cells.some((c) => c === '30')).toBe(true);
    expect(cells.some((c) => c === '25')).toBe(true);
  });

  it('shows all columns when hiddenColumns is empty', async () => {
    const data: Row[] = [
      { name: 'Alice', age: 30 },
    ];

    const { container } = render(Table, {
      props: { data, filterable: false },
    });
    await act();

    const headers = Array.from(container.querySelectorAll('th')).map((th) => th.textContent?.trim());
    expect(headers.some((h) => h === 'Name')).toBe(true);
    expect(headers.some((h) => h === 'Age')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2. Aggregate footer — sum (ADV-07)
// ---------------------------------------------------------------------------

describe('aggregate footer — sum (ADV-07)', () => {
  it('renders a tfoot when showAggregates=true', async () => {
    const data: Row[] = [
      { price: 10 },
      { price: 20 },
    ];
    const columns: ColumnDefinition<Row>[] = [
      { key: 'price', label: 'Price', aggregate: 'sum' },
    ];

    const { container } = render(Table, {
      props: { data, columns, showAggregates: true, filterable: false },
    });
    await act();

    const tfoot = container.querySelector('tfoot');
    expect(tfoot).not.toBeNull();
  });

  it('aggregate sum shows correct total (10 + 20 = 30)', async () => {
    const data: Row[] = [
      { price: 10 },
      { price: 20 },
    ];
    const columns: ColumnDefinition<Row>[] = [
      { key: 'price', label: 'Price', aggregate: 'sum' },
    ];

    const { container } = render(Table, {
      props: { data, columns, showAggregates: true, filterable: false },
    });
    await act();

    const tfoot = container.querySelector('tfoot');
    expect(tfoot?.textContent).toContain('30');
  });

  it('does not render tfoot when showAggregates=false (default)', async () => {
    const data: Row[] = [
      { price: 10 },
      { price: 20 },
    ];
    const columns: ColumnDefinition<Row>[] = [
      { key: 'price', label: 'Price', aggregate: 'sum' },
    ];

    const { container } = render(Table, {
      props: { data, columns, filterable: false },
    });
    await act();

    const tfoot = container.querySelector('tfoot');
    expect(tfoot).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. Aggregate footer — count (ADV-07)
// ---------------------------------------------------------------------------

describe('aggregate footer — count (ADV-07)', () => {
  it('aggregate count returns the row count as a string', async () => {
    const data: Row[] = [
      { name: 'Alice' },
      { name: 'Bob' },
      { name: 'Carol' },
    ];
    const columns: ColumnDefinition<Row>[] = [
      { key: 'name', label: 'Name', aggregate: 'count' },
    ];

    const { container } = render(Table, {
      props: { data, columns, showAggregates: true, filterable: false },
    });
    await act();

    const tfoot = container.querySelector('tfoot');
    expect(tfoot?.textContent?.trim()).toBe('3');
  });
});

// ---------------------------------------------------------------------------
// 4. Aggregate footer — custom function (ADV-07)
// ---------------------------------------------------------------------------

describe('aggregate footer — custom function (ADV-07)', () => {
  it('custom aggregate function receives values array and returns its return value', async () => {
    const data: Row[] = [
      { score: 100 },
      { score: 200 },
    ];
    const columns: ColumnDefinition<Row>[] = [
      { key: 'score', label: 'Score', aggregate: (_vals: unknown[]) => 'CUSTOM' },
    ];

    const { container } = render(Table, {
      props: { data, columns, showAggregates: true, filterable: false },
    });
    await act();

    const tfoot = container.querySelector('tfoot');
    expect(tfoot?.textContent?.trim()).toBe('CUSTOM');
  });

  it('custom aggregate function receives all filteredRows values', async () => {
    const received: unknown[] = [];
    const data: Row[] = [
      { score: 10 },
      { score: 20 },
      { score: 30 },
    ];
    const columns: ColumnDefinition<Row>[] = [
      {
        key: 'score',
        label: 'Score',
        aggregate: (vals: unknown[]) => {
          received.push(...vals);
          return String(vals.length);
        },
      },
    ];

    const { container } = render(Table, {
      props: { data, columns, showAggregates: true, filterable: false },
    });
    await act();

    const tfoot = container.querySelector('tfoot');
    // All 3 rows should be passed to the aggregate function
    expect(tfoot?.textContent?.trim()).toBe('3');
    expect(received).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// 5. Aggregate footer — avg, min, max (ADV-07)
// ---------------------------------------------------------------------------

describe('aggregate footer — avg / min / max (ADV-07)', () => {
  it('aggregate avg computes mean with up to 2 decimal places', async () => {
    const data: Row[] = [
      { val: 10 },
      { val: 20 },
      { val: 30 },
    ];
    const columns: ColumnDefinition<Row>[] = [
      { key: 'val', label: 'Val', aggregate: 'avg' },
    ];

    const { container } = render(Table, {
      props: { data, columns, showAggregates: true, filterable: false },
    });
    await act();

    const tfoot = container.querySelector('tfoot');
    // avg of 10, 20, 30 = 20
    expect(tfoot?.textContent?.trim()).toBe('20');
  });

  it('aggregate min returns the minimum numeric value', async () => {
    const data: Row[] = [
      { val: 5 },
      { val: 3 },
      { val: 8 },
    ];
    const columns: ColumnDefinition<Row>[] = [
      { key: 'val', label: 'Val', aggregate: 'min' },
    ];

    const { container } = render(Table, {
      props: { data, columns, showAggregates: true, filterable: false },
    });
    await act();

    const tfoot = container.querySelector('tfoot');
    expect(tfoot?.textContent?.trim()).toBe('3');
  });

  it('aggregate max returns the maximum numeric value', async () => {
    const data: Row[] = [
      { val: 5 },
      { val: 3 },
      { val: 8 },
    ];
    const columns: ColumnDefinition<Row>[] = [
      { key: 'val', label: 'Val', aggregate: 'max' },
    ];

    const { container } = render(Table, {
      props: { data, columns, showAggregates: true, filterable: false },
    });
    await act();

    const tfoot = container.querySelector('tfoot');
    expect(tfoot?.textContent?.trim()).toBe('8');
  });
});

// ---------------------------------------------------------------------------
// 6. Empty td for columns without aggregate
// ---------------------------------------------------------------------------

describe('aggregate footer — columns without aggregate are empty tds (ADV-07)', () => {
  it('renders empty td for columns with no aggregate field', async () => {
    const data: Row[] = [
      { name: 'Alice', score: 100 },
      { name: 'Bob', score: 200 },
    ];
    const columns: ColumnDefinition<Row>[] = [
      { key: 'name', label: 'Name' },  // no aggregate
      { key: 'score', label: 'Score', aggregate: 'sum' },
    ];

    const { container } = render(Table, {
      props: { data, columns, showAggregates: true, filterable: false },
    });
    await act();

    const tfoot = container.querySelector('tfoot');
    const tds = tfoot?.querySelectorAll('td');
    expect(tds).toHaveLength(2);
    // First td (name — no aggregate) should be empty
    expect(tds?.[0]?.textContent?.trim()).toBe('');
    // Second td (score — sum) should be '300'
    expect(tds?.[1]?.textContent?.trim()).toBe('300');
  });
});
