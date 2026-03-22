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
    background: var(--tc-header-bg, #f8fafc);
    font-weight: 600;
    border-top: 2px solid var(--tc-border-color, #e2e8f0);
  }

  .tc-aggregate {
    color: var(--tc-color-text, #0f172a);
    font-size: 0.8125rem;
  }

  .tc-aggregate--label {
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--tc-color-muted, #64748b);
  }
</style>
