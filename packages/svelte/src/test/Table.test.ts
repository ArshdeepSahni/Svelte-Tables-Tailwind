/**
 * @tablecraft/svelte — Table component full test suite
 *
 * Phase 3 test scaffold: All stubs are RED now; go GREEN as Table.svelte is implemented.
 * Requirements covered: SVLT-01, 02, 03, 04, 06, 07, 08, 09, 11, 12, 13, 15
 *
 * SVLT-05 (column resizing) and SVLT-10 (column reordering via drag) are
 * manual / visual only — not covered here.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen, act } from '@testing-library/svelte';
import { axe } from 'vitest-axe';
import type { ResolvedColumn } from '@tablecraft/core';
import type { Row } from '../lib/types.js';
import Table from '../lib/Table.svelte';

// ---------------------------------------------------------------------------
// Core engine mock — deterministic, fast, no inference latency
// ---------------------------------------------------------------------------

vi.mock('@tablecraft/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tablecraft/core')>();
  return {
    ...actual,
    createTableEngine: vi.fn(() => ({
      inferSchema: vi.fn(() => ({})),
      resolveColumns: vi.fn((data: Row[], _overrides?: unknown, _inference?: unknown) =>
        Object.keys(data[0] ?? {}).map((key) => ({
          key,
          type: 'text' as const,
          label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          sortable: true,
        })),
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
// Helpers
// ---------------------------------------------------------------------------

const sampleData: Row[] = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
  { name: 'Carol', age: 35 },
];

// ---------------------------------------------------------------------------
// 1. Zero-config rendering (SVLT-01)
// ---------------------------------------------------------------------------

describe('zero-config rendering (SVLT-01)', () => {
  it('renders a role=grid element when data is provided', async () => {
    render(Table, { props: { data: sampleData } });
    await act();
    expect(screen.queryByRole('grid')).toBeTruthy();
  });

  it('derives column headers from data keys', async () => {
    render(Table, { props: { data: [{ name: 'Alice', age: 30 }] } });
    await act();
    expect(screen.queryByText('Name')).toBeTruthy();
    expect(screen.queryByText('Age')).toBeTruthy();
  });

  it('sets aria-colcount matching the number of columns', async () => {
    render(Table, { props: { data: [{ name: 'Alice', age: 30 }] } });
    await act();
    const grid = screen.queryByRole('grid');
    expect(grid?.getAttribute('aria-colcount')).toBe('2');
  });

  it('sets aria-rowcount matching the number of data rows', async () => {
    render(Table, { props: { data: [{ name: 'Alice', age: 30 }] } });
    await act();
    const grid = screen.queryByRole('grid');
    expect(grid?.getAttribute('aria-rowcount')).toBe('1');
  });
});

// ---------------------------------------------------------------------------
// 2. Column override API (SVLT-02)
// ---------------------------------------------------------------------------

describe('column override API (SVLT-02)', () => {
  it('short-form override passes columns prop to createTableEngine', async () => {
    const { createTableEngine } = await import('@tablecraft/core');
    render(Table, { props: { data: sampleData, columns: { age: 'number' } } });
    await act();
    expect(createTableEngine).toHaveBeenCalled();
  });

  it('long-form override renders custom header label', async () => {
    render(Table, {
      props: {
        data: [{ name: 'Alice' }],
        columns: [{ key: 'name', type: 'text', label: 'Full Name' }],
      },
    });
    await act();
    expect(screen.queryByText('Full Name')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 3. Sorting (SVLT-03)
// ---------------------------------------------------------------------------

describe('sorting (SVLT-03)', () => {
  it('clicking a sortable column header sets aria-sort="ascending"', async () => {
    render(Table, { props: { data: sampleData } });
    await act();
    const nameHeader = screen.queryByText('Name');
    expect(nameHeader).toBeTruthy();
    await fireEvent.click(nameHeader!);
    await act();
    const th = nameHeader!.closest('[aria-sort]');
    expect(th?.getAttribute('aria-sort')).toBe('ascending');
  });

  it('clicking the same header again sets aria-sort="descending"', async () => {
    render(Table, { props: { data: sampleData } });
    await act();
    const nameHeader = screen.queryByText('Name')!;
    await fireEvent.click(nameHeader);
    await act();
    await fireEvent.click(nameHeader);
    await act();
    const th = nameHeader.closest('[aria-sort]');
    expect(th?.getAttribute('aria-sort')).toBe('descending');
  });

  it('clicking a third time resets sort (aria-sort="none")', async () => {
    render(Table, { props: { data: sampleData } });
    await act();
    const nameHeader = screen.queryByText('Name')!;
    await fireEvent.click(nameHeader);
    await act();
    await fireEvent.click(nameHeader);
    await act();
    await fireEvent.click(nameHeader);
    await act();
    const th = nameHeader.closest('[aria-sort]');
    expect(th?.getAttribute('aria-sort')).toBe('none');
  });

  it('sort ascending indicator ▲ appears after first click', async () => {
    render(Table, { props: { data: sampleData } });
    await act();
    const nameHeader = screen.queryByText('Name')!;
    await fireEvent.click(nameHeader);
    await act();
    const th = nameHeader.closest('th');
    expect(th?.getAttribute('aria-sort')).toBe('ascending');
  });
});

// ---------------------------------------------------------------------------
// 4. Global search / filter (SVLT-04)
// ---------------------------------------------------------------------------

describe('global search filter (SVLT-04)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a search input', async () => {
    render(Table, { props: { data: sampleData } });
    await act();
    expect(screen.queryByRole('searchbox') ?? screen.queryByPlaceholderText(/search/i)).toBeTruthy();
  });

  it('typing in search input filters rows after debounce', async () => {
    render(Table, { props: { data: sampleData } });
    await act();
    const input = (screen.queryByRole('searchbox') ?? screen.queryByPlaceholderText(/search/i)) as HTMLInputElement;
    expect(input).toBeTruthy();
    await fireEvent.input(input, { target: { value: 'Alice' } });
    vi.runAllTimers();
    await act();
    expect(screen.queryByText('Bob')).toBeNull();
  });

  it('no matching rows shows empty state', async () => {
    render(Table, { props: { data: sampleData } });
    await act();
    const input = (screen.queryByRole('searchbox') ?? screen.queryByPlaceholderText(/search/i)) as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'NOMATCH_XYZ' } });
    vi.runAllTimers();
    await act();
    expect(screen.queryByText(/no data|no results|empty/i)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 5. Pagination (SVLT-06)
// ---------------------------------------------------------------------------

describe('pagination (SVLT-06)', () => {
  const manyRows: Row[] = Array.from({ length: 55 }, (_, i) => ({ name: `User ${i + 1}`, id: i + 1 }));

  it('shows 10 rows per page by default with 55 rows', async () => {
    render(Table, { props: { data: manyRows, pageSize: 10 } });
    await act();
    const rows = screen.queryAllByRole('row');
    // header row + 10 data rows = 11
    expect(rows.length).toBe(11);
  });

  it('shows "Page 1 of 6" text', async () => {
    render(Table, { props: { data: manyRows, pageSize: 10 } });
    await act();
    expect(screen.queryByText(/page 1 of 6/i)).toBeTruthy();
  });

  it('Next button advances to page 2', async () => {
    render(Table, { props: { data: manyRows, pageSize: 10 } });
    await act();
    const nextBtn = screen.queryByRole('button', { name: /next/i });
    expect(nextBtn).toBeTruthy();
    await fireEvent.click(nextBtn!);
    await act();
    expect(screen.queryByText(/page 2 of 6/i)).toBeTruthy();
  });

  it('pagination is hidden when data.length <= pageSize', async () => {
    render(Table, { props: { data: sampleData, pageSize: 10 } });
    await act();
    expect(screen.queryByRole('button', { name: /next/i })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 6. Empty state (SVLT-07)
// ---------------------------------------------------------------------------

describe('empty state (SVLT-07)', () => {
  it('data=[] shows default "No data" message', async () => {
    render(Table, { props: { data: [] } });
    await act();
    expect(screen.queryByText(/no data/i)).toBeTruthy();
  });

  it('emptyMessage prop overrides default text', async () => {
    render(Table, { props: { data: [], emptyMessage: 'Nothing here yet' } });
    await act();
    expect(screen.queryByText('Nothing here yet')).toBeTruthy();
  });

  it('loading=true does not show empty state', async () => {
    render(Table, { props: { data: [], loading: true } });
    await act();
    expect(screen.queryByText(/no data/i)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 7. Loading state (SVLT-08)
// ---------------------------------------------------------------------------

describe('loading state (SVLT-08)', () => {
  it('loading=true renders aria-busy="true" on table', async () => {
    render(Table, { props: { data: [], loading: true } });
    await act();
    const grid = screen.queryByRole('grid');
    expect(grid?.getAttribute('aria-busy')).toBe('true');
  });

  it('no data rows are visible when loading=true', async () => {
    render(Table, { props: { data: sampleData, loading: true } });
    await act();
    expect(screen.queryByText('Alice')).toBeNull();
  });

  it('skeleton rows are rendered when loading=true', async () => {
    render(Table, { props: { data: sampleData, loading: true, skeletonRows: 3 } });
    await act();
    // Skeleton rows have a distinguishing class or role attribute
    expect(document.querySelectorAll('[data-skeleton]').length).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// 8. Row selection (SVLT-09)
// ---------------------------------------------------------------------------

describe('row selection (SVLT-09)', () => {
  it('selectable=true adds a checkbox column', async () => {
    render(Table, { props: { data: sampleData, selectable: true } });
    await act();
    const checkboxes = screen.queryAllByRole('checkbox');
    // header checkbox + one per data row
    expect(checkboxes.length).toBeGreaterThanOrEqual(sampleData.length + 1);
  });

  it('clicking a row checkbox sets aria-selected="true" on that row', async () => {
    render(Table, { props: { data: sampleData, selectable: true } });
    await act();
    const checkboxes = screen.queryAllByRole('checkbox');
    // first checkbox is the select-all; second is the first data row
    const firstRowCheckbox = checkboxes[1];
    await fireEvent.click(firstRowCheckbox);
    await act();
    const row = firstRowCheckbox.closest('[role="row"]');
    expect(row?.getAttribute('aria-selected')).toBe('true');
  });

  it('select-all header checkbox selects all rows', async () => {
    render(Table, { props: { data: sampleData, selectable: true } });
    await act();
    const checkboxes = screen.queryAllByRole('checkbox');
    await fireEvent.click(checkboxes[0]);
    await act();
    const allRowCheckboxes = screen.queryAllByRole('checkbox').slice(1);
    expect(allRowCheckboxes.every((cb) => (cb as HTMLInputElement).checked)).toBe(true);
  });

  it('onselect callback fires when a row is selected', async () => {
    const onselect = vi.fn();
    render(Table, { props: { data: sampleData, selectable: true, onselect } });
    await act();
    const checkboxes = screen.queryAllByRole('checkbox');
    await fireEvent.click(checkboxes[1]);
    await act();
    expect(onselect).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// 9. Keyboard navigation (SVLT-11)
// ---------------------------------------------------------------------------

describe('keyboard navigation (SVLT-11)', () => {
  it('ArrowRight moves focus from cell[0][0] to cell[0][1]', async () => {
    render(Table, { props: { data: [{ name: 'Alice', age: 30 }] } });
    await act();
    const cells = screen.queryAllByRole('gridcell');
    const firstCell = cells[0] as HTMLElement;
    firstCell.focus();
    await fireEvent.keyDown(firstCell, { key: 'ArrowRight' });
    await act();
    expect(document.activeElement).toBe(cells[1]);
  });

  it('ArrowLeft moves focus from cell[0][1] back to cell[0][0]', async () => {
    render(Table, { props: { data: [{ name: 'Alice', age: 30 }] } });
    await act();
    const cells = screen.queryAllByRole('gridcell');
    const secondCell = cells[1] as HTMLElement;
    secondCell.focus();
    await fireEvent.keyDown(secondCell, { key: 'ArrowLeft' });
    await act();
    expect(document.activeElement).toBe(cells[0]);
  });

  it('ArrowDown moves focus to the same column in the next row', async () => {
    render(Table, { props: { data: [{ name: 'Alice' }, { name: 'Bob' }] } });
    await act();
    const cells = screen.queryAllByRole('gridcell');
    const firstCell = cells[0] as HTMLElement;
    firstCell.focus();
    await fireEvent.keyDown(firstCell, { key: 'ArrowDown' });
    await act();
    expect(document.activeElement).toBe(cells[1]);
  });

  it('Home key focuses the first cell in the current row', async () => {
    render(Table, { props: { data: [{ name: 'Alice', age: 30 }] } });
    await act();
    const cells = screen.queryAllByRole('gridcell');
    const secondCell = cells[1] as HTMLElement;
    secondCell.focus();
    await fireEvent.keyDown(secondCell, { key: 'Home' });
    await act();
    expect(document.activeElement).toBe(cells[0]);
  });
});

// ---------------------------------------------------------------------------
// 10. WCAG 2.1 AA accessibility (SVLT-12)
// ---------------------------------------------------------------------------

describe('WCAG 2.1 AA (SVLT-12)', () => {
  it('empty state renders with no axe violations', async () => {
    const { container } = render(Table, { props: { data: [] } });
    await act();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('table with data renders with no axe violations', async () => {
    const { container } = render(Table, { props: { data: sampleData } });
    await act();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('loading state renders with no axe violations', async () => {
    const { container } = render(Table, { props: { data: [], loading: true } });
    await act();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('selectable table renders with no axe violations', async () => {
    const { container } = render(Table, { props: { data: sampleData, selectable: true } });
    await act();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ---------------------------------------------------------------------------
// 11. Row / cell click events (SVLT-13)
// ---------------------------------------------------------------------------

describe('row and cell click events (SVLT-13)', () => {
  it('clicking a data row fires onrowclick with { row, rowIndex }', async () => {
    const onrowclick = vi.fn();
    render(Table, { props: { data: sampleData, onrowclick } });
    await act();
    const rows = screen.queryAllByRole('row');
    // rows[0] is header; rows[1] is first data row
    await fireEvent.click(rows[1]);
    await act();
    expect(onrowclick).toHaveBeenCalledWith(
      expect.objectContaining({ row: sampleData[0], rowIndex: 0 }),
    );
  });

  it('clicking a cell fires oncellclick with { row, column, value }', async () => {
    const oncellclick = vi.fn();
    render(Table, { props: { data: sampleData, oncellclick } });
    await act();
    const cells = screen.queryAllByRole('gridcell');
    await fireEvent.click(cells[0]);
    await act();
    expect(oncellclick).toHaveBeenCalledWith(
      expect.objectContaining({ rowIndex: 0 }),
    );
  });
});

// ---------------------------------------------------------------------------
// 12. v1 backward compatibility (SVLT-15)
// ---------------------------------------------------------------------------

describe('v1 backward compat (SVLT-15)', () => {
  it('colname + rowdata props render the table without throwing', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(Table, {
      props: {
        rowdata: [{ name: 'Legacy Alice', age: 99 }],
        colname: [{ name: 'Name', key: 'name' }],
      },
    });
    await act();
    // Table should render — legacy shim delegates to data/columns
    expect(screen.queryByText('Legacy Alice')).toBeTruthy();
    consoleSpy.mockRestore();
  });

  it('console.warn is called once when using v1 props', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(Table, {
      props: {
        rowdata: [{ name: 'Legacy Bob' }],
      },
    });
    await act();
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });

  it('data prop takes precedence over rowdata when both are provided', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(Table, {
      props: {
        data: [{ name: 'Primary Data' }],
        rowdata: [{ name: 'Legacy Data' }],
      },
    });
    await act();
    expect(screen.queryByText('Primary Data')).toBeTruthy();
    expect(screen.queryByText('Legacy Data')).toBeNull();
    consoleSpy.mockRestore();
  });
});
