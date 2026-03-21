<script lang="ts">
  import type { ResolvedColumn } from '@tablecraft/core';
  import type { SortState } from './types.js';
  import Checkbox from './Checkbox.svelte';

  interface Props {
    columns: ResolvedColumn[];
    sortState: SortState;
    selectable?: boolean;
    allSelected?: boolean;
    someSelected?: boolean;
    sortLoading?: boolean;
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
    {#each columns as col (col.key)}
      <th
        scope="col"
        class="tc-th"
        class:tc-th--sortable={col.sortable !== false}
        class:tc-th--sorted={sortState.key === col.key && sortState.dir !== null}
        role="columnheader"
        aria-sort={getAriaSortValue(col.key)}
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
      </th>
    {/each}
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
</style>
