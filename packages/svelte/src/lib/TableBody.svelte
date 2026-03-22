<script lang="ts">
  /**
   * @tablecraft/svelte — TableBody component
   *
   * Renders <tbody> with data rows via Cell.svelte, empty state, loading skeleton,
   * row selection checkboxes, and keyboard arrow navigation (roving tabindex pattern).
   *
   * Supports two mutually-exclusive render modes:
   *   - Virtual mode: receives virtualItems + sortedRows; renders with translateY positioning
   *   - Normal mode: receives visibleRows; renders all rows in document flow
   *
   * FOUND-07: No {@html} — all cell rendering delegated to Cell.svelte.
   * FOUND-08: CSS custom properties (--tc-*) used throughout.
   * FOUND-04: Svelte 5 runes ($props, $state, $derived) only.
   */

  import type { ProcessedRow, ResolvedColumn } from '@tablecraft/core';
  import type { VirtualItem } from '@tanstack/svelte-virtual';
  import type { Row, FocusedCell } from './types.js';
  import type { Snippet } from 'svelte';
  import Cell from './Cell.svelte';
  import Checkbox from './Checkbox.svelte';

  interface Props {
    // Normal mode (non-virtual)
    visibleRows?: ProcessedRow[];
    // Virtual mode
    virtualItems?: VirtualItem[];
    sortedRows?: ProcessedRow[];  // full sorted dataset (virtual indexes into this)
    // Shared
    columns: ResolvedColumn[];
    loading?: boolean;
    skeletonRows?: number;
    selectable?: boolean;
    selectedRows?: Row[];
    emptyMessage?: string;
    striped?: boolean;
    bordered?: boolean;
    empty?: Snippet;
    // Column virtualization
    columnVirtualItems?: VirtualItem[];
    totalColumnSize?: number;
    isColumnVirtualizing?: boolean;
    colWidths?: Map<string, number>;
    onrowclick?: (event: { row: Row; rowIndex: number }) => void;
    oncellclick?: (event: { row: Row; column: ResolvedColumn; value: unknown; rowIndex: number }) => void;
    onrowtoggle?: (row: Row, selected: boolean) => void;
  }

  let {
    visibleRows = [],
    virtualItems = [],
    sortedRows = [],
    columns,
    loading = false,
    skeletonRows = 5,
    selectable = false,
    selectedRows = [],
    emptyMessage = 'No data',
    striped = false,
    bordered = false,
    empty,
    columnVirtualItems = [],
    totalColumnSize = 0,
    isColumnVirtualizing = false,
    colWidths,
    onrowclick,
    oncellclick,
    onrowtoggle,
  }: Props = $props();

  let focusedCell = $state<FocusedCell>({ rowIndex: 0, colIndex: 0 });
  let colOffset = $derived(selectable ? 1 : 0);

  // Virtual mode is active when virtualItems has entries and sortedRows is provided
  const isVirtualMode = $derived(virtualItems.length > 0 && sortedRows.length > 0);

  // Compute the sticky left/right offset for a pinned td
  function computeTdPinnedOffset(targetCol: ResolvedColumn, cols: ResolvedColumn[], side: 'left' | 'right'): number {
    const pinnedCols = cols.filter((c) => c.pinned === side);
    const idx = pinnedCols.findIndex((c) => c.key === targetCol.key);
    let offset = 0;
    for (let i = 0; i < idx; i++) {
      offset += colWidths?.get(pinnedCols[i].key) ?? pinnedCols[i].minWidth ?? 150;
    }
    return offset;
  }

  function handleBodyClick(e: MouseEvent) {
    const tr = (e.target as Element).closest('[data-row]');
    if (!tr) return;
    const rowIndex = Number(tr.getAttribute('data-row'));

    const td = (e.target as Element).closest('[data-col]');

    if (isVirtualMode) {
      const processedRow = sortedRows[rowIndex];
      if (!processedRow) return;
      const row = processedRow._original as Row;
      if (td) {
        const colIndex = Number(td.getAttribute('data-col'));
        const col = columns[colIndex];
        if (col) oncellclick?.({ row, column: col, value: row[col.key], rowIndex });
      } else {
        onrowclick?.({ row, rowIndex });
      }
    } else {
      const processedRow = visibleRows[rowIndex];
      if (!processedRow) return;
      const row = processedRow._original as Row;
      if (td) {
        const colIndex = Number(td.getAttribute('data-col'));
        const col = columns[colIndex];
        if (col) oncellclick?.({ row, column: col, value: row[col.key], rowIndex });
      } else {
        onrowclick?.({ row, rowIndex });
      }
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    const maxRow = isVirtualMode ? sortedRows.length - 1 : visibleRows.length - 1;
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

<tbody onkeydown={handleKeyDown} onclick={handleBodyClick}>
  {#if loading}
    {#each { length: skeletonRows } as _}
      <tr class="tc-tr tc-tr--skeleton" role="row" data-skeleton aria-hidden="true">
        {#if selectable}
          <td class="tc-td tc-td--checkbox"><div class="tc-skeleton-cell"></div></td>
        {/if}
        {#each columns as _col}
          <td class="tc-td"><div class="tc-skeleton-cell"></div></td>
        {/each}
      </tr>
    {/each}
  {:else if isVirtualMode ? sortedRows.length === 0 : visibleRows.length === 0}
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
    {#if isVirtualMode}
      {#each virtualItems as item, index}
        {@const processedRow = sortedRows[item.index]}
        {@const row = processedRow?._original}
        {@const isSelected = row ? selectedRows.some((r) => r === row) : false}
        <tr
          class="tc-tr"
          class:tc-tr--selected={isSelected}
          role="row"
          aria-selected={selectable ? isSelected : undefined}
          data-row={item.index}
          style="height: {item.size}px; transform: translateY({item.start - index * item.size}px);"
        >
          {#if selectable && row}
            <td class="tc-td tc-td--checkbox" role="gridcell">
              <Checkbox
                checked={isSelected}
                oncheckedchange={(checked) => onrowtoggle?.(row as Row, checked)}
                aria-label={`Select row ${item.index + 1}`}
              />
            </td>
          {/if}
          {#if row}
            {#if isColumnVirtualizing && columnVirtualItems.length > 0}
              <!-- Left cell spacer -->
              {#if columnVirtualItems[0]?.start > 0}
                <td style="width: {columnVirtualItems[0].start}px; padding: 0;" aria-hidden="true"></td>
              {/if}
              <!-- Virtual column cells -->
              {#each columnVirtualItems as colItem}
                {@const col = columns[colItem.index]}
                {#if col}
                  {@const descriptor = processedRow.cells[col.key] ?? { kind: 'text', value: '' }}
                  <td
                    class="tc-td"
                    class:tc-td--bordered={bordered}
                    role="gridcell"
                    data-col={colItem.index}
                    style="width: {colItem.size}px; min-width: {colItem.size}px;"
                    tabindex={focusedCell.rowIndex === item.index && focusedCell.colIndex === colItem.index ? 0 : -1}
                  >
                    <Cell {descriptor} />
                  </td>
                {/if}
              {/each}
              <!-- Right cell spacer -->
              {#if columnVirtualItems.at(-1)}
                {@const lastItem = columnVirtualItems.at(-1)!}
                {@const rightSpace = totalColumnSize - lastItem.end}
                {#if rightSpace > 0}
                  <td style="width: {rightSpace}px; padding: 0;" aria-hidden="true"></td>
                {/if}
              {/if}
            {:else}
              {#each columns as col, colIndex (col.key)}
                {@const descriptor = processedRow.cells[col.key] ?? { kind: 'text', value: '' }}
                <td
                  class="tc-td"
                  class:tc-td--bordered={bordered}
                  role="gridcell"
                  data-col={colIndex}
                  tabindex={focusedCell.rowIndex === item.index && focusedCell.colIndex === colIndex ? 0 : -1}
                >
                  <Cell {descriptor} />
                </td>
              {/each}
            {/if}
          {/if}
        </tr>
      {/each}
    {:else}
      {#each visibleRows as processedRow, rowIndex (rowIndex)}
        {@const row = processedRow._original}
        {@const isSelected = selectedRows.some((r) => r === row)}
        <tr
          class="tc-tr"
          class:tc-tr--striped={striped && rowIndex % 2 === 1}
          class:tc-tr--selected={isSelected}
          role="row"
          aria-selected={selectable ? isSelected : undefined}
          data-row={rowIndex}
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
          {#if isColumnVirtualizing && columnVirtualItems.length > 0}
            <!-- Left cell spacer -->
            {#if columnVirtualItems[0]?.start > 0}
              <td style="width: {columnVirtualItems[0].start}px; padding: 0;" aria-hidden="true"></td>
            {/if}
            <!-- Virtual column cells -->
            {#each columnVirtualItems as colItem}
              {@const col = columns[colItem.index]}
              {#if col}
                {@const descriptor = processedRow.cells[col.key] ?? { kind: 'text', value: '' }}
                <td
                  class="tc-td"
                  class:tc-td--bordered={bordered}
                  role="gridcell"
                  data-col={colItem.index}
                  style="width: {colItem.size}px; min-width: {colItem.size}px;"
                  tabindex={focusedCell.rowIndex === rowIndex && focusedCell.colIndex === colItem.index ? 0 : -1}
                >
                  <Cell {descriptor} />
                </td>
              {/if}
            {/each}
            <!-- Right cell spacer -->
            {#if columnVirtualItems.at(-1)}
              {@const lastItem = columnVirtualItems.at(-1)!}
              {@const rightSpace = totalColumnSize - lastItem.end}
              {#if rightSpace > 0}
                <td style="width: {rightSpace}px; padding: 0;" aria-hidden="true"></td>
              {/if}
            {/if}
          {:else}
            {#each columns as col, colIndex (col.key)}
              {@const descriptor = processedRow.cells[col.key] ?? { kind: 'text', value: '' }}
              <td
                class="tc-td"
                class:tc-td--bordered={bordered}
                class:tc-td--pinned-left={col.pinned === 'left' && !isColumnVirtualizing}
                class:tc-td--pinned-right={col.pinned === 'right' && !isColumnVirtualizing}
                role="gridcell"
                data-col={colIndex}
                style={col.pinned && !isColumnVirtualizing ? (col.pinned === 'left' ? `left: ${computeTdPinnedOffset(col, columns, 'left')}px;` : `right: ${computeTdPinnedOffset(col, columns, 'right')}px;`) : undefined}
                tabindex={focusedCell.rowIndex === rowIndex && focusedCell.colIndex === colIndex ? 0 : -1}
              >
                <Cell {descriptor} />
              </td>
            {/each}
          {/if}
        </tr>
      {/each}
    {/if}
  {/if}
</tbody>

<style>
  .tc-tr {
    transition: background 0.1s ease;
    contain: layout style;
  }

  .tc-tr:hover {
    background: var(--tc-color-bg-hover, #f8fafc);
  }

  .tc-tr--selected {
    background: var(--tc-color-selected-bg, #eef2ff) !important;
    box-shadow: inset 3px 0 0 var(--tc-color-primary, #6366f1);
  }

  .tc-tr--striped {
    background: var(--tc-color-bg-alt, #f8fafc);
  }

  .tc-td {
    padding: 0.6875rem 1rem;
    border-bottom: 1px solid var(--tc-border-color, #e2e8f0);
    height: var(--tc-row-height, 3rem);
    vertical-align: middle;
    color: var(--tc-color-text, #0f172a);
    contain: layout style paint;
  }

  .tc-td--bordered {
    border-right: 1px solid var(--tc-border-color, #e2e8f0);
  }

  .tc-td--empty {
    text-align: center;
    color: var(--tc-color-muted, #94a3b8);
    padding: 3rem 1rem;
    font-size: 0.9375rem;
  }

  .tc-td:focus-visible {
    outline: 2px solid var(--tc-color-primary, #6366f1);
    outline-offset: -2px;
    border-radius: 2px;
  }

  .tc-td--checkbox {
    width: 2.75rem;
    padding-left: 1rem;
  }

  .tc-tr:last-child .tc-td {
    border-bottom: none;
  }

  .tc-td--pinned-left,
  .tc-td--pinned-right {
    position: sticky;
    z-index: 1;
    background: var(--tc-color-bg, #ffffff);
  }

  .tc-td--pinned-left {
    left: 0; /* overridden by inline style for computed offset */
  }

  .tc-td--pinned-right {
    right: 0; /* overridden by inline style for computed offset */
  }

  .tc-td--pinned-left:not(:has(~ .tc-td--pinned-left)) {
    box-shadow: 2px 0 4px rgba(0, 0, 0, 0.08);
  }

  .tc-skeleton-cell {
    height: 0.875rem;
    border-radius: 0.375rem;
    background: linear-gradient(
      90deg,
      #e2e8f0 0%,
      #f1f5f9 40%,
      #e2e8f0 80%
    );
    background-size: 300% 100%;
    animation: tc-shimmer 2.5s ease-in-out infinite;
  }

  @keyframes tc-shimmer {
    0% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
</style>
