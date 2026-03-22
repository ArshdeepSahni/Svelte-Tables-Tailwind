<script lang="ts">
  import type { ResolvedColumn } from '@tablecraft/core';
  import type { VirtualItem } from '@tanstack/svelte-virtual';
  import type { SortState } from './types.js';
  import Checkbox from './Checkbox.svelte';

  interface Props {
    columns: ResolvedColumn[];
    sortState: SortState;
    selectable?: boolean;
    allSelected?: boolean;
    someSelected?: boolean;
    sortLoading?: boolean;
    columnVirtualItems?: VirtualItem[];
    totalColumnSize?: number;
    isColumnVirtualizing?: boolean;
    colWidths?: Map<string, number>;
    columnOrder?: string[];
    oncolresize?: (key: string, width: number) => void;
    oncolreorder?: (fromKey: string, toKey: string) => void;
    onsortchange?: (key: string) => void;
    onselectall?: (checked: boolean) => void;
  }

  let {
    columns,
    sortState,
    selectable = false,
    allSelected = false,
    someSelected = false,
    sortLoading = false,
    columnVirtualItems = [],
    totalColumnSize = 0,
    isColumnVirtualizing = false,
    colWidths = new Map<string, number>(),
    columnOrder = [],
    oncolresize,
    oncolreorder,
    onsortchange,
    onselectall,
  }: Props = $props();

  function getAriaSortValue(colKey: string): 'ascending' | 'descending' | 'none' | undefined {
    if (!(columns.find((c) => c.key === colKey)?.sortable ?? true)) return undefined;
    if (sortState.key !== colKey) return 'none';
    if (sortState.dir === 'asc') return 'ascending';
    if (sortState.dir === 'desc') return 'descending';
    return 'none';
  }

  function handleHeaderClick(col: ResolvedColumn) {
    if (col.sortable === false) return;
    onsortchange?.(col.key);
  }

  // Resize state
  let resizingKey = $state<string | null>(null);
  let resizeStartX = $state(0);
  let resizeStartWidth = $state(0);

  function handleResizePointerDown(e: PointerEvent, col: ResolvedColumn, th: HTMLElement) {
    e.stopPropagation(); // prevent sort from triggering
    e.preventDefault();
    resizingKey = col.key;
    resizeStartX = e.clientX;
    resizeStartWidth = colWidths.get(col.key) ?? col.minWidth ?? th.offsetWidth ?? 150;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    document.body.style.cursor = 'col-resize';
    document.documentElement.style.userSelect = 'none';
  }

  function handleResizePointerMove(e: PointerEvent, col: ResolvedColumn) {
    if (resizingKey !== col.key) return;
    const delta = e.clientX - resizeStartX;
    const minW = col.minWidth ?? 60;
    const maxW = col.maxWidth ?? Infinity;
    const newWidth = Math.max(minW, Math.min(maxW, resizeStartWidth + delta));
    oncolresize?.(col.key, newWidth);
  }

  function handleResizePointerUp() {
    resizingKey = null;
    document.body.style.cursor = '';
    document.documentElement.style.userSelect = '';
  }

  // Drag-to-reorder state
  let dragoverKey = $state<string | null>(null);
  let draggingKey = $state<string | null>(null);

  function handleDragStart(e: DragEvent, col: ResolvedColumn, th: HTMLElement) {
    if (isColumnVirtualizing) return;
    // Prevent DnD when user is clicking on the resize handle
    const target = e.target as HTMLElement;
    if (target.classList.contains('tc-resize-handle')) {
      e.preventDefault();
      return;
    }
    draggingKey = col.key;
    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('text/plain', col.key);
    th.style.opacity = '0.5';
  }

  function handleDragEnd(_e: DragEvent, th: HTMLElement) {
    draggingKey = null;
    dragoverKey = null;
    th.style.opacity = '';
  }

  function handleDragOver(e: DragEvent, col: ResolvedColumn) {
    if (isColumnVirtualizing) return;
    e.preventDefault(); // CRITICAL: required for ondrop to fire
    e.dataTransfer!.dropEffect = 'move';
    dragoverKey = col.key;
  }

  function handleDrop(e: DragEvent, col: ResolvedColumn) {
    e.preventDefault();
    dragoverKey = null;
    const fromKey = e.dataTransfer!.getData('text/plain');
    if (fromKey && fromKey !== col.key) {
      oncolreorder?.(fromKey, col.key);
    }
  }

  function handleDragLeave() {
    dragoverKey = null;
  }

  // Compute the sticky left/right offset for a pinned column
  function computePinnedOffset(targetCol: ResolvedColumn, side: 'left' | 'right'): number {
    const pinnedCols = columns.filter((c) => c.pinned === side);
    const idx = pinnedCols.findIndex((c) => c.key === targetCol.key);
    let offset = 0;
    for (let i = 0; i < idx; i++) {
      offset += colWidths.get(pinnedCols[i].key) ?? pinnedCols[i].minWidth ?? 150;
    }
    return offset;
  }

</script>

<thead aria-busy={sortLoading ? 'true' : undefined}>
  <tr>
    {#if selectable}
      <th scope="col" class="tc-th tc-th--checkbox" role="columnheader">
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected && !allSelected}
          oncheckedchange={(checked) => onselectall?.(checked)}
          aria-label="Select all rows"
        />
      </th>
    {/if}
    {#if isColumnVirtualizing && columnVirtualItems.length > 0}
      <!-- Left spacer th -->
      {#if columnVirtualItems[0]?.start > 0}
        <th style="width: {columnVirtualItems[0].start}px; padding: 0;" aria-hidden="true"></th>
      {/if}
      <!-- Virtual columns -->
      {#each columnVirtualItems as colItem}
        {@const col = columns[colItem.index]}
        {#if col}
          <th
            scope="col"
            class="tc-th"
            class:tc-th--sortable={col.sortable !== false}
            class:tc-th--sorted={sortState.key === col.key && sortState.dir !== null}
            role="columnheader"
            aria-sort={getAriaSortValue(col.key)}
            style="width: {colWidths.get(col.key) ?? colItem.size}px; min-width: {col.minWidth ?? 60}px;"
            onclick={() => handleHeaderClick(col)}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleHeaderClick(col);
              }
            }}
            tabindex={col.sortable !== false ? 0 : undefined}
          >
            <span class="tc-th-content">
              {col.label}
              {#if col.sortable !== false}
                <span class="tc-sort-icon" aria-hidden="true">
                  {#if sortState.key === col.key && sortState.dir === 'asc'}
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><path d="M4 1L7 6H1L4 1Z"/></svg>
                  {:else if sortState.key === col.key && sortState.dir === 'desc'}
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><path d="M4 7L1 2H7L4 7Z"/></svg>
                  {:else}
                    <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor" opacity="0.4"><path d="M4 0L7 4H1L4 0Z"/><path d="M4 10L1 6H7L4 10Z"/></svg>
                  {/if}
                </span>
              {/if}
            </span>
            <div
              class="tc-resize-handle"
              role="separator"
              aria-label="Resize {col.label} column"
              onpointerdown={(e) => handleResizePointerDown(e, col, e.currentTarget.closest('th')!)}
              onpointermove={(e) => handleResizePointerMove(e, col)}
              onpointerup={handleResizePointerUp}
              onpointercancel={handleResizePointerUp}
            ></div>
          </th>
        {/if}
      {/each}
      <!-- Right spacer th -->
      {#if columnVirtualItems.at(-1)}
        {@const lastItem = columnVirtualItems.at(-1)!}
        {@const rightSpace = totalColumnSize - lastItem.end}
        {#if rightSpace > 0}
          <th style="width: {rightSpace}px; padding: 0;" aria-hidden="true"></th>
        {/if}
      {/if}
    {:else}
      <!-- Normal (non-virtual) column rendering -->
      {#each columns as col (col.key)}
        <th
          scope="col"
          class="tc-th"
          class:tc-th--sortable={col.sortable !== false}
          class:tc-th--sorted={sortState.key === col.key && sortState.dir !== null}
          class:tc-th--drag-target={dragoverKey === col.key && draggingKey !== col.key}
          class:tc-th--pinned-left={col.pinned === 'left' && !isColumnVirtualizing}
          class:tc-th--pinned-right={col.pinned === 'right' && !isColumnVirtualizing}
          role="columnheader"
          aria-sort={getAriaSortValue(col.key)}
          draggable={!isColumnVirtualizing}
          style="{colWidths.get(col.key) ? `width: ${colWidths.get(col.key)}px; min-width: ${col.minWidth ?? 60}px;` : `width: ${col.minWidth ?? 150}px; min-width: ${col.minWidth ?? 60}px;`}{col.pinned === 'left' && !isColumnVirtualizing ? ` left: ${computePinnedOffset(col, 'left')}px;` : ''}{col.pinned === 'right' && !isColumnVirtualizing ? ` right: ${computePinnedOffset(col, 'right')}px;` : ''}"
          onclick={() => handleHeaderClick(col)}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleHeaderClick(col);
            }
          }}
          ondragstart={(e) => handleDragStart(e, col, e.currentTarget)}
          ondragend={(e) => handleDragEnd(e, e.currentTarget)}
          ondragover={(e) => handleDragOver(e, col)}
          ondrop={(e) => handleDrop(e, col)}
          ondragleave={handleDragLeave}
          tabindex={col.sortable !== false ? 0 : undefined}
        >
          <span class="tc-th-content">
            {col.label}
            {#if col.sortable !== false}
              <span class="tc-sort-icon" aria-hidden="true">
                {#if sortState.key === col.key && sortState.dir === 'asc'}
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><path d="M4 1L7 6H1L4 1Z"/></svg>
                {:else if sortState.key === col.key && sortState.dir === 'desc'}
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><path d="M4 7L1 2H7L4 7Z"/></svg>
                {:else}
                  <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor" opacity="0.4"><path d="M4 0L7 4H1L4 0Z"/><path d="M4 10L1 6H7L4 10Z"/></svg>
                {/if}
              </span>
            {/if}
          </span>
          <div
            class="tc-resize-handle"
            role="separator"
            aria-label="Resize {col.label} column"
            onpointerdown={(e) => handleResizePointerDown(e, col, e.currentTarget.closest('th')!)}
            onpointermove={(e) => handleResizePointerMove(e, col)}
            onpointerup={handleResizePointerUp}
            onpointercancel={handleResizePointerUp}
          ></div>
        </th>
      {/each}
    {/if}
  </tr>
</thead>

<style>
  .tc-th {
    padding: 0.5rem 1rem;
    text-align: left;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: var(--tc-header-bg, #f8fafc);
    color: var(--tc-header-color, #64748b);
    border-bottom: 1px solid var(--tc-header-border, #e2e8f0);
    white-space: nowrap;
    position: sticky;
    top: 0;
    z-index: 1;
    transition: background 0.15s ease;
  }

  .tc-th-content {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
  }

  .tc-sort-icon {
    display: inline-flex;
    flex-direction: column;
    gap: 1px;
    opacity: 0.35;
    transition: opacity 0.15s ease;
  }

  .tc-th--sorted .tc-sort-icon {
    opacity: 1;
    color: var(--tc-color-primary, #6366f1);
  }

  .tc-th--sorted {
    color: var(--tc-color-primary, #6366f1);
  }

  .tc-sort-icon svg {
    display: block;
  }

  .tc-th--sortable {
    cursor: pointer;
    user-select: none;
  }

  .tc-th--sortable:hover {
    background: var(--tc-header-bg-hover, #f1f5f9);
    color: var(--tc-color-text, #0f172a);
  }

  .tc-th--sortable:hover .tc-sort-icon {
    opacity: 0.7;
  }

  .tc-th--checkbox {
    width: 2.75rem;
    padding-left: 1rem;
  }

  .tc-th--sortable:focus-visible {
    outline: 2px solid var(--tc-color-primary, #6366f1);
    outline-offset: -2px;
  }

  .tc-resize-handle {
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
    width: 8px;
    cursor: col-resize;
    background: transparent;
    z-index: 1;
  }

  .tc-resize-handle::after {
    content: '';
    position: absolute;
    right: 3px;
    top: 20%;
    height: 60%;
    width: 2px;
    background: var(--tc-border-color, #e2e8f0);
    border-radius: 1px;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .tc-th:hover .tc-resize-handle::after {
    opacity: 1;
  }

  .tc-th--drag-target {
    border-left: 3px solid var(--tc-color-primary, #6366f1);
  }

  .tc-th--pinned-left,
  .tc-th--pinned-right {
    position: sticky;
    z-index: 3;
    background: var(--tc-header-bg, #f8fafc);
  }

  .tc-th--pinned-left {
    left: 0; /* overridden by inline style for computed offset */
  }

  .tc-th--pinned-right {
    right: 0; /* overridden by inline style for computed offset */
  }

  /* Separator shadow: rightmost left-pinned column */
  .tc-th--pinned-left:not(:has(~ .tc-th--pinned-left)) {
    box-shadow: 2px 0 4px rgba(0, 0, 0, 0.08);
  }

  /* Separator shadow: leftmost right-pinned column */
  .tc-th--pinned-right:first-of-type {
    box-shadow: -2px 0 4px rgba(0, 0, 0, 0.08);
  }
</style>
