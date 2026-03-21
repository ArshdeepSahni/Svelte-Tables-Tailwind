<script lang="ts">
  /**
   * @tablecraft/svelte — TableBody component
   *
   * Renders <tbody> with data rows via Cell.svelte, empty state, loading skeleton,
   * row selection checkboxes, and keyboard arrow navigation (roving tabindex pattern).
   *
   * FOUND-07: No {@html} — all cell rendering delegated to Cell.svelte.
   * FOUND-08: CSS custom properties (--tc-*) used throughout.
   * FOUND-04: Svelte 5 runes ($props, $state, $derived) only.
   */

  import type { ProcessedRow, ResolvedColumn } from '@tablecraft/core';
  import type { Row, FocusedCell } from './types.js';
  import type { Snippet } from 'svelte';
  import Cell from './Cell.svelte';
  import Checkbox from './Checkbox.svelte';

  interface Props {
    visibleRows: ProcessedRow[];
    columns: ResolvedColumn[];
    loading?: boolean;
    skeletonRows?: number;
    selectable?: boolean;
    selectedRows?: Row[];
    emptyMessage?: string;
    striped?: boolean;
    bordered?: boolean;
    empty?: Snippet;
    onrowclick?: (event: { row: Row; rowIndex: number }) => void;
    oncellclick?: (event: { row: Row; column: ResolvedColumn; value: unknown }) => void;
    onrowtoggle?: (row: Row, selected: boolean) => void;
  }

  let {
    visibleRows,
    columns,
    loading = false,
    skeletonRows = 5,
    selectable = false,
    selectedRows = [],
    emptyMessage = 'No data',
    striped = false,
    bordered = false,
    empty,
    onrowclick,
    oncellclick,
    onrowtoggle,
  }: Props = $props();

  let focusedCell = $state<FocusedCell>({ rowIndex: 0, colIndex: 0 });
  let colOffset = $derived(selectable ? 1 : 0);

  function handleKeyDown(e: KeyboardEvent) {
    const maxRow = visibleRows.length - 1;
    const maxCol = columns.length - 1;
    let { rowIndex, colIndex } = focusedCell;

    switch (e.key) {
      case 'ArrowRight':
        colIndex = Math.min(colIndex + 1, maxCol);
        break;
      case 'ArrowLeft':
        colIndex = Math.max(colIndex - 1, 0);
        break;
      case 'ArrowDown':
        rowIndex = Math.min(rowIndex + 1, maxRow);
        e.preventDefault();
        break;
      case 'ArrowUp':
        rowIndex = Math.max(rowIndex - 1, 0);
        e.preventDefault();
        break;
      case 'Home':
        colIndex = 0;
        break;
      case 'End':
        colIndex = maxCol;
        break;
      default:
        return;
    }
    focusedCell = { rowIndex, colIndex };
    const tbody = e.currentTarget as HTMLElement;
    const targetRow = tbody.querySelectorAll('tr')[rowIndex];
    const targetCells = targetRow?.querySelectorAll('td');
    const targetCell = targetCells?.[colIndex + colOffset] as HTMLElement | undefined;
    targetCell?.focus();
  }
</script>

<tbody onkeydown={handleKeyDown}>
  {#if loading}
    {#each { length: skeletonRows } as _}
      <tr class="tc-tr tc-tr--skeleton" aria-hidden="true">
        {#if selectable}
          <td class="tc-td tc-td--checkbox"><div class="tc-skeleton-cell"></div></td>
        {/if}
        {#each columns as _col}
          <td class="tc-td"><div class="tc-skeleton-cell"></div></td>
        {/each}
      </tr>
    {/each}
  {:else if visibleRows.length === 0}
    <tr class="tc-tr tc-tr--empty">
      <td
        class="tc-td tc-td--empty"
        colspan={columns.length + (selectable ? 1 : 0)}
      >
        {#if empty}
          {@render empty()}
        {:else}
          {emptyMessage}
        {/if}
      </td>
    </tr>
  {:else}
    {#each visibleRows as processedRow, rowIndex (rowIndex)}
      {@const row = processedRow._original}
      {@const isSelected = selectedRows.some((r) => r === row)}
      <tr
        class="tc-tr"
        class:tc-tr--striped={striped && rowIndex % 2 === 1}
        class:tc-tr--selected={isSelected}
        aria-selected={selectable ? isSelected : undefined}
        onclick={() => onrowclick?.({ row, rowIndex })}
      >
        {#if selectable}
          <td class="tc-td tc-td--checkbox" role="gridcell">
            <Checkbox
              checked={isSelected}
              oncheckedchange={(checked) => onrowtoggle?.(row, checked)}
              aria-label={`Select row ${rowIndex + 1}`}
            />
          </td>
        {/if}
        {#each columns as col, colIndex (col.key)}
          {@const descriptor = processedRow.cells[col.key] ?? { kind: 'text', value: '' }}
          <td
            class="tc-td"
            class:tc-td--bordered={bordered}
            role="gridcell"
            tabindex={focusedCell.rowIndex === rowIndex && focusedCell.colIndex === colIndex ? 0 : -1}
            onclick={(e) => {
              e.stopPropagation();
              oncellclick?.({ row, column: col, value: row[col.key] });
            }}
          >
            <Cell {descriptor} />
          </td>
        {/each}
      </tr>
    {/each}
  {/if}
</tbody>

<style>
  .tc-tr:hover {
    background: var(--tc-color-bg-hover, #f9fafb);
  }

  .tc-tr--selected {
    background: var(--tc-color-selected-bg, #eff6ff);
  }

  .tc-tr--striped {
    background: var(--tc-color-bg-alt, #f9fafb);
  }

  .tc-td {
    padding: var(--tc-spacing-3, 0.75rem) var(--tc-spacing-4, 1rem);
    border-bottom: 1px solid var(--tc-border-color, #e5e7eb);
    height: var(--tc-row-height, 3rem);
    vertical-align: middle;
  }

  .tc-td--bordered {
    border-right: 1px solid var(--tc-border-color, #e5e7eb);
  }

  .tc-td--empty {
    text-align: center;
    color: var(--tc-color-muted, #6b7280);
    padding: var(--tc-spacing-8, 2rem);
  }

  .tc-td:focus-visible {
    outline: 2px solid var(--tc-color-primary, #2563eb);
    outline-offset: -2px;
  }

  .tc-td--checkbox {
    width: 2.5rem;
    padding-left: var(--tc-spacing-3, 0.75rem);
  }

  .tc-tr:last-child .tc-td {
    border-bottom: none;
  }

  .tc-skeleton-cell {
    height: 1rem;
    border-radius: 0.25rem;
    background: linear-gradient(
      90deg,
      var(--tc-skeleton-from, #e5e7eb) 25%,
      var(--tc-skeleton-to, #f3f4f6) 50%,
      var(--tc-skeleton-from, #e5e7eb) 75%
    );
    background-size: 200% 100%;
    animation: tc-shimmer 1.5s infinite;
  }

  @keyframes tc-shimmer {
    from {
      background-position: 200% 0;
    }
    to {
      background-position: -200% 0;
    }
  }
</style>
