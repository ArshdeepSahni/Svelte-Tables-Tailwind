/**
 * @tablecraft/svelte — Advanced features: density prop + persistKey prop tests
 *
 * Phase 6 Plan 01 — ADV-04, ADV-08, ADV-09
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/svelte';
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
          label: key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
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

const sampleData: Row[] = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
];

// ---------------------------------------------------------------------------
// 1. Density prop — CSS variable mapping
// ---------------------------------------------------------------------------

describe('density prop (ADV-04)', () => {
  it('density="compact" sets --tc-row-height: 32px on the scroll element', async () => {
    const { container } = render(Table, { props: { data: sampleData, density: 'compact' } });
    await act();
    const scrollEl = container.querySelector('.tc-table-scroll') as HTMLElement | null;
    expect(scrollEl).toBeTruthy();
    expect(scrollEl!.getAttribute('style')).toContain('--tc-row-height: 32px');
  });

  it('density="comfortable" sets --tc-row-height: 48px (default)', async () => {
    const { container } = render(Table, { props: { data: sampleData, density: 'comfortable' } });
    await act();
    const scrollEl = container.querySelector('.tc-table-scroll') as HTMLElement | null;
    expect(scrollEl).toBeTruthy();
    expect(scrollEl!.getAttribute('style')).toContain('--tc-row-height: 48px');
  });

  it('density="spacious" sets --tc-row-height: 64px on the scroll element', async () => {
    const { container } = render(Table, { props: { data: sampleData, density: 'spacious' } });
    await act();
    const scrollEl = container.querySelector('.tc-table-scroll') as HTMLElement | null;
    expect(scrollEl).toBeTruthy();
    expect(scrollEl!.getAttribute('style')).toContain('--tc-row-height: 64px');
  });

  it('renders without density prop (defaults to 48px)', async () => {
    const { container } = render(Table, { props: { data: sampleData } });
    await act();
    const scrollEl = container.querySelector('.tc-table-scroll') as HTMLElement | null;
    expect(scrollEl).toBeTruthy();
    // Default density='comfortable' => 48px
    expect(scrollEl!.getAttribute('style')).toContain('--tc-row-height: 48px');
  });
});

// ---------------------------------------------------------------------------
// 2. persistKey prop — localStorage load on mount
// ---------------------------------------------------------------------------

describe('persistKey prop — load from localStorage (ADV-08, ADV-09)', () => {
  beforeEach(() => {
    // Reset localStorage mock before each test
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('calls localStorage.getItem with persistKey on mount', async () => {
    const mockStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    vi.stubGlobal('localStorage', mockStorage);

    render(Table, { props: { data: sampleData, persistKey: 'test-table-key' } });
    await act();

    expect(mockStorage.getItem).toHaveBeenCalledWith('test-table-key');
  });

  it('restores filterQuery from localStorage when v===1', async () => {
    const saved = JSON.stringify({
      v: 1,
      sortState: { key: null, dir: null },
      filterQuery: 'alice',
      currentPage: 1,
      colWidths: {},
      columnOrder: [],
      hiddenColumns: [],
    });

    const mockStorage = {
      getItem: vi.fn(() => saved),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    vi.stubGlobal('localStorage', mockStorage);

    const { container } = render(Table, { props: { data: sampleData, persistKey: 'test-table-key' } });
    await act();

    // After restore, filterQuery should be 'alice' — only Alice row visible
    const rows = container.querySelectorAll('tbody tr:not([data-skeleton])');
    // Alice row should be visible (contains 'alice'), Bob row filtered out
    const cellTexts = Array.from(rows).map((r) => r.textContent ?? '');
    const hasAlice = cellTexts.some((t) => t.toLowerCase().includes('alice'));
    const hasBob = cellTexts.some((t) => t.toLowerCase().includes('bob'));
    expect(hasAlice).toBe(true);
    expect(hasBob).toBe(false);
  });

  it('ignores localStorage data with version mismatch (v !== 1)', async () => {
    const saved = JSON.stringify({
      v: 2, // wrong version
      sortState: { key: 'name', dir: 'asc' },
      filterQuery: 'alice',
      currentPage: 1,
    });

    const mockStorage = {
      getItem: vi.fn(() => saved),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    vi.stubGlobal('localStorage', mockStorage);

    const { container } = render(Table, { props: { data: sampleData, persistKey: 'test-table-key' } });
    await act();

    // Both rows should be visible (filterQuery NOT restored due to version mismatch)
    const rows = container.querySelectorAll('tbody tr:not([data-skeleton])');
    const cellTexts = Array.from(rows).map((r) => r.textContent ?? '');
    const hasBob = cellTexts.some((t) => t.toLowerCase().includes('bob'));
    expect(hasBob).toBe(true);
  });

  it('writes to localStorage after state change with 300ms debounce', async () => {
    vi.useFakeTimers();

    const mockStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    vi.stubGlobal('localStorage', mockStorage);

    render(Table, { props: { data: sampleData, persistKey: 'save-key' } });
    await act();

    // The save effect fires on mount (debounced)
    // Advance timers past the 300ms debounce
    vi.advanceTimersByTime(400);
    await act();

    expect(mockStorage.setItem).toHaveBeenCalledWith('save-key', expect.stringContaining('"v":1'));
  });

  it('persisted JSON contains all 6 state fields', async () => {
    vi.useFakeTimers();

    const mockStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    vi.stubGlobal('localStorage', mockStorage);

    render(Table, { props: { data: sampleData, persistKey: 'fields-key' } });
    await act();

    vi.advanceTimersByTime(400);
    await act();

    const callArg = mockStorage.setItem.mock.calls[0]?.[1] as string | undefined;
    expect(callArg).toBeDefined();
    const parsed = JSON.parse(callArg!);
    expect(parsed).toHaveProperty('v', 1);
    expect(parsed).toHaveProperty('sortState');
    expect(parsed).toHaveProperty('filterQuery');
    expect(parsed).toHaveProperty('currentPage');
    expect(parsed).toHaveProperty('colWidths');
    expect(parsed).toHaveProperty('columnOrder');
    expect(parsed).toHaveProperty('hiddenColumns');
  });

  it('does not call localStorage when persistKey is not provided', async () => {
    const mockStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    vi.stubGlobal('localStorage', mockStorage);

    render(Table, { props: { data: sampleData } }); // no persistKey
    await act();

    expect(mockStorage.getItem).not.toHaveBeenCalled();
  });
});
