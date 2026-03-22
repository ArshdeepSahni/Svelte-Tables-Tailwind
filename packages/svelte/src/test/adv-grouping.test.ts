/**
 * @tablecraft/svelte — Row grouping tests (ADV-06)
 *
 * Phase 6 Plan 05 — TDD RED phase
 * Tests: groupBy pipeline, collapsedGroups, GroupRow rendering
 */

import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/svelte';
import type { ColumnDefinition, ResolvedColumn } from '@tablecraft/core';
import type { Row } from '../lib/types.js';
import Table from '../lib/Table.svelte';

// ---------------------------------------------------------------------------
// Core engine mock — deterministic, same pattern as other Phase 6 tests
// ---------------------------------------------------------------------------

vi.mock('@tablecraft/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tablecraft/core')>();
  return {
    ...actual,
    createTableEngine: vi.fn(() => ({
      inferSchema: vi.fn(() => ({})),
      resolveColumns: vi.fn(
        (data: Row[], overrides?: ColumnDefinition<Row>[] | Record<string, unknown>, _inference?: unknown) => {
          const baseKeys = Object.keys(data[0] ?? {});
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
// 1. groupBy renders group header rows
// ---------------------------------------------------------------------------

describe('row grouping — groupBy prop (ADV-06)', () => {
  it('renders group header rows with tc-group-row class when groupBy is set', async () => {
    const data: Row[] = [
      { name: 'Alice', status: 'active' },
      { name: 'Bob', status: 'active' },
      { name: 'Carol', status: 'inactive' },
    ];

    const { container } = render(Table, {
      props: { data, groupBy: 'status', filterable: false },
    });
    await act();

    const groupRows = container.querySelectorAll('.tc-group-row');
    // 2 groups: active, inactive
    expect(groupRows.length).toBe(2);
  });

  it('group header shows the group label text', async () => {
    const data: Row[] = [
      { name: 'Alice', status: 'active' },
      { name: 'Bob', status: 'inactive' },
    ];

    const { container } = render(Table, {
      props: { data, groupBy: 'status', filterable: false },
    });
    await act();

    const groupLabels = container.querySelectorAll('.tc-group-label');
    const texts = Array.from(groupLabels).map((el) => el.textContent?.trim());
    expect(texts).toContain('active');
    expect(texts).toContain('inactive');
  });

  it('group header shows count of rows in each group', async () => {
    const data: Row[] = [
      { name: 'Alice', status: 'active' },
      { name: 'Bob', status: 'active' },
      { name: 'Carol', status: 'inactive' },
    ];

    const { container } = render(Table, {
      props: { data, groupBy: 'status', filterable: false },
    });
    await act();

    const groupCounts = container.querySelectorAll('.tc-group-count');
    const texts = Array.from(groupCounts).map((el) => el.textContent?.trim());
    // active group has 2, inactive has 1
    expect(texts).toContain('(2)');
    expect(texts).toContain('(1)');
  });

  it('collapse indicator (▼) is visible on expanded groups', async () => {
    const data: Row[] = [
      { name: 'Alice', status: 'active' },
      { name: 'Bob', status: 'inactive' },
    ];

    const { container } = render(Table, {
      props: { data, groupBy: 'status', filterable: false },
    });
    await act();

    const indicators = container.querySelectorAll('.tc-group-indicator');
    const texts = Array.from(indicators).map((el) => el.textContent?.trim());
    // All groups start expanded — indicator is ▼
    expect(texts.every((t) => t === '▼')).toBe(true);
  });

  it('renders data rows within each group', async () => {
    const data: Row[] = [
      { name: 'Alice', status: 'active' },
      { name: 'Bob', status: 'active' },
      { name: 'Carol', status: 'inactive' },
    ];

    const { container } = render(Table, {
      props: { data, groupBy: 'status', filterable: false },
    });
    await act();

    // All 3 data rows should be visible (in data cells, not group headers)
    const dataCells = Array.from(container.querySelectorAll('td.tc-td'))
      .map((td) => td.textContent?.trim());
    expect(dataCells).toContain('Alice');
    expect(dataCells).toContain('Bob');
    expect(dataCells).toContain('Carol');
  });

  it('does not render group rows when groupBy is null (default)', async () => {
    const data: Row[] = [
      { name: 'Alice', status: 'active' },
      { name: 'Bob', status: 'inactive' },
    ];

    const { container } = render(Table, {
      props: { data, filterable: false },
    });
    await act();

    const groupRows = container.querySelectorAll('.tc-group-row');
    expect(groupRows.length).toBe(0);
  });

  it('group row spans all columns via aria-expanded attribute', async () => {
    const data: Row[] = [
      { name: 'Alice', status: 'active' },
    ];

    const { container } = render(Table, {
      props: { data, groupBy: 'status', filterable: false },
    });
    await act();

    const groupRow = container.querySelector('.tc-group-row');
    expect(groupRow?.getAttribute('aria-expanded')).toBe('true');
  });
});

// ---------------------------------------------------------------------------
// 2. Collapse/expand behavior
// ---------------------------------------------------------------------------

describe('row grouping — collapse/expand (ADV-06)', () => {
  it('clicking group header collapses its data rows', async () => {
    const data: Row[] = [
      { name: 'Alice', status: 'active' },
      { name: 'Bob', status: 'active' },
      { name: 'Carol', status: 'inactive' },
    ];

    const { container } = render(Table, {
      props: { data, groupBy: 'status', filterable: false },
    });
    await act();

    // Find the 'active' group row and click it
    const groupRows = Array.from(container.querySelectorAll('.tc-group-row'));
    const activeRow = groupRows.find((tr) => tr.textContent?.includes('active') && !tr.textContent?.includes('inactive'));
    expect(activeRow).toBeTruthy();

    activeRow!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await act();

    // Alice and Bob should no longer be in data cells
    const dataCells = Array.from(container.querySelectorAll('td.tc-td'))
      .map((td) => td.textContent?.trim());
    expect(dataCells).not.toContain('Alice');
    expect(dataCells).not.toContain('Bob');
    // Carol should still be visible
    expect(dataCells).toContain('Carol');
  });

  it('collapse indicator changes to ▶ when group is collapsed', async () => {
    const data: Row[] = [
      { name: 'Alice', status: 'active' },
    ];

    const { container } = render(Table, {
      props: { data, groupBy: 'status', filterable: false },
    });
    await act();

    const groupRow = container.querySelector('.tc-group-row');
    groupRow!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await act();

    const indicator = container.querySelector('.tc-group-indicator');
    expect(indicator?.textContent?.trim()).toBe('▶');
  });

  it('clicking collapsed group again expands its rows', async () => {
    const data: Row[] = [
      { name: 'Alice', status: 'active' },
      { name: 'Bob', status: 'active' },
    ];

    const { container } = render(Table, {
      props: { data, groupBy: 'status', filterable: false },
    });
    await act();

    const groupRow = container.querySelector('.tc-group-row');
    // Collapse
    groupRow!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await act();
    // Expand
    groupRow!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await act();

    const dataCells = Array.from(container.querySelectorAll('td.tc-td'))
      .map((td) => td.textContent?.trim());
    expect(dataCells).toContain('Alice');
    expect(dataCells).toContain('Bob');
  });

  it('aria-expanded is false when group is collapsed', async () => {
    const data: Row[] = [
      { name: 'Alice', status: 'active' },
    ];

    const { container } = render(Table, {
      props: { data, groupBy: 'status', filterable: false },
    });
    await act();

    const groupRow = container.querySelector('.tc-group-row');
    groupRow!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await act();

    expect(groupRow?.getAttribute('aria-expanded')).toBe('false');
  });
});
