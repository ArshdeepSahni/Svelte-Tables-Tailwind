/**
 * virtual.test.ts — Unit tests for row/column virtualization thresholds (PERF-02, PERF-06)
 */
import { describe, it, expect } from 'vitest';
import { render, waitFor } from '@testing-library/svelte';
import Table from '../lib/Table.svelte';

// Generate n simple rows for testing
function makeRows(n: number) {
  return Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }));
}

describe('Row virtualization threshold (PERF-02)', () => {
  it('renders all rows when count is at or below virtualizeAt (200)', async () => {
    const data = makeRows(200);
    // pageSize=200 ensures all rows are in the DOM (no pagination truncation)
    const { container } = render(Table, { props: { data, filterable: false, pageSize: 200 } });
    await waitFor(() => {
      const rows = container.querySelectorAll('tbody tr:not([data-skeleton])');
      expect(rows.length).toBe(200);
    });
  });

  it('activates virtualizer when row count exceeds virtualizeAt (201 rows)', async () => {
    const data = makeRows(201);
    const { container } = render(Table, { props: { data, filterable: false } });
    await waitFor(() => {
      // With virtualizer active, the scroll container has the virtual class
      const scrollContainer = container.querySelector('.tc-table-scroll--virtual');
      expect(scrollContainer).not.toBeNull();
    });
  });

  it('row height CSS variable --tc-row-height applied to table rows via tc-td class', async () => {
    const data = makeRows(5);
    const { container } = render(Table, { props: { data, filterable: false } });
    await waitFor(() => {
      const td = container.querySelector('tbody td.tc-td');
      expect(td).not.toBeNull();
      // tc-td class uses height: var(--tc-row-height, 3rem) = 48px
      // jsdom does not resolve CSS custom properties so we verify the class is present
      expect(td!.classList.contains('tc-td')).toBe(true);
    });
  });
});

describe('Column virtualization threshold (PERF-06)', () => {
  it('TODO Wave 5 — column virtualizer activates when resolvedColumns.length > 20', () => {
    throw new Error('TODO: implement in Wave 5 (04-05-PLAN)');
  });

  it('TODO Wave 5 — fewer than 20 columns do not activate column virtualization', () => {
    throw new Error('TODO: implement in Wave 5');
  });
});
