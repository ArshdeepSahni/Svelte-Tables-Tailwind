<script lang="ts">
  /**
   * @tablecraft/svelte — AggregateRow component
   *
   * Renders a <tfoot> with one <td class="tc-aggregate"> per visible column.
   * Computes built-in aggregates (sum, avg, count, min, max) or calls a custom function.
   * Operates on filteredRows — reflects the filtered dataset, not just the visible page slice.
   *
   * ADV-07: showAggregates prop wires this into Table.svelte.
   */

  import type { ResolvedColumn, ProcessedRow, AggregateFunction } from '@tablecraft/core';

  interface Props {
    columns: ResolvedColumn[];
    rows: ProcessedRow[];
    selectable?: boolean;
  }

  let { columns, rows, selectable = false }: Props = $props();

  function computeAggregate(fn: AggregateFunction, values: unknown[]): string {
    if (typeof fn === 'function') return fn(values);
    const nums = values.map(Number).filter(isFinite);
    switch (fn) {
      case 'sum':
        return nums.reduce((a, b) => a + b, 0).toLocaleString();
      case 'avg': {
        if (nums.length === 0) return '—';
        const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
        return avg.toLocaleString(undefined, { maximumFractionDigits: 2 });
      }
      case 'count':
        return String(values.length);
      case 'min':
        return nums.length ? Math.min(...nums).toLocaleString() : '—';
      case 'max':
        return nums.length ? Math.max(...nums).toLocaleString() : '—';
      default:
        return '—';
    }
  }
</script>

<tfoot>
  <tr class="tc-aggregate-row">
    {#if selectable}
      <td class="tc-td tc-aggregate tc-aggregate--label">Total</td>
    {/if}
    {#each columns as col (col.key)}
      <td class="tc-td tc-aggregate">
        {#if col.aggregate}
          {@const values = rows.map((r) => r._original[col.key])}
          {computeAggregate(col.aggregate, values)}
        {/if}
      </td>
    {/each}
  </tr>
</tfoot>

<style>
  .tc-aggregate-row {
    background: var(--tc-color-bg-aggregate, #fafafa);
    font-weight: var(--tc-font-weight-semibold, 600);
    border-top: var(--tc-border-width-accent, 2px) solid var(--tc-color-border, #f0f0f0);
  }

  .tc-aggregate {
    color: var(--tc-color-text, #0a0a0a);
    font-size: var(--tc-font-size, 13px);
    padding: var(--tc-cell-padding-y, 8px) var(--tc-cell-padding-x, 12px);
    font-variant-numeric: tabular-nums;
  }

  .tc-aggregate--label {
    font-size: var(--tc-font-size-sm, 11px);
    text-transform: uppercase;
    letter-spacing: var(--tc-letter-spacing-header, 0.04em);
    color: var(--tc-color-text-muted, #a3a3a3);
  }
</style>
