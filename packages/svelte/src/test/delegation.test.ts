/**
 * delegation.test.ts — Event delegation tests (PERF-04)
 * Single onclick on <tbody> dispatches to onrowclick / oncellclick via data-row/data-col.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import Table from '../lib/Table.svelte';

const data = [
  { id: 1, name: 'Alice', score: 95 },
  { id: 2, name: 'Bob', score: 87 },
  { id: 3, name: 'Carol', score: 72 },
];

describe('Event delegation (PERF-04)', () => {
  it('onrowclick fires when a data row is clicked via tbody delegation', async () => {
    const onrowclick = vi.fn();
    const { container } = render(Table, {
      props: { data, filterable: false, onrowclick },
    });

    await waitFor(() => {
      expect(container.querySelector('tbody tr[data-row]')).not.toBeNull();
    });

    // Click the first data row <tr> (not a td)
    const firstTr = container.querySelector('tbody tr[data-row="0"]') as HTMLElement;
    expect(firstTr).not.toBeNull();
    fireEvent.click(firstTr);

    expect(onrowclick).toHaveBeenCalledOnce();
    expect(onrowclick).toHaveBeenCalledWith(
      expect.objectContaining({ rowIndex: 0 }),
    );
  });

  it('oncellclick fires with correct column and row when a td is clicked', async () => {
    const oncellclick = vi.fn();
    const { container } = render(Table, {
      props: { data, filterable: false, oncellclick },
    });

    await waitFor(() => {
      expect(container.querySelector('tbody td[data-col]')).not.toBeNull();
    });

    // Click the first td in the first row (col 0)
    const firstTd = container.querySelector('tbody tr[data-row="0"] td[data-col="0"]') as HTMLElement;
    expect(firstTd).not.toBeNull();
    fireEvent.click(firstTd);

    expect(oncellclick).toHaveBeenCalledOnce();
    const payload = oncellclick.mock.calls[0][0];
    expect(payload).toMatchObject({
      rowIndex: 0,
    });
    // Column should correspond to col index 0
    expect(payload.column).toBeDefined();
    expect(payload.column.key).toBeDefined();
  });

  it('clicking tbody area with no data-row does not throw or fire callbacks', async () => {
    const onrowclick = vi.fn();
    const { container } = render(Table, {
      props: { data, filterable: false, onrowclick },
    });

    await waitFor(() => {
      expect(container.querySelector('tbody')).not.toBeNull();
    });

    const tbody = container.querySelector('tbody') as HTMLElement;
    // Fire click on tbody itself (no data-row parent)
    fireEvent.click(tbody);
    expect(onrowclick).not.toHaveBeenCalled();
  });
});
