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
    onsortchange?: (key: string) => void;
    onselectall?: (checked: boolean) => void;
  }

  let {
    columns,
    sortState,
    selectable = false,
    allSelected = false,
    someSelected = false,
    onsortchange,
    onselectall,
  }: Props = $props();

  function getSortIndicator(colKey: string): string {
    if (sortState.key !== colKey) return '';
    if (sortState.dir === 'asc') return ' ▲';
    if (sortState.dir === 'desc') return ' ▼';
    return '';
  }

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

<thead>
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
        {col.label}{getSortIndicator(col.key)}
      </th>
    {/each}
  </tr>
</thead>

<style>
  .tc-th {
    padding: var(--tc-spacing-3, 0.75rem) var(--tc-spacing-4, 1rem);
    text-align: left;
    font-weight: 600;
    background: var(--tc-header-bg, #f9fafb);
    color: var(--tc-header-color, #374151);
    border-bottom: 1px solid var(--tc-border-color, #e5e7eb);
    white-space: nowrap;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .tc-th--sortable {
    cursor: pointer;
    user-select: none;
  }

  .tc-th--sortable:hover {
    background: var(--tc-header-bg-hover, #f3f4f6);
  }

  .tc-th--sorted {
    color: var(--tc-color-primary, #2563eb);
  }

  .tc-th--checkbox {
    width: 2.5rem;
    padding-left: var(--tc-spacing-3, 0.75rem);
  }

  .tc-th--sortable:focus-visible {
    outline: 2px solid var(--tc-color-primary, #2563eb);
    outline-offset: -2px;
  }
</style>
