<script lang="ts">
  import type { Row } from './types.js';
  import type { ProcessedRow, ResolvedColumn } from '@tablecraft/core';
  import CellEditor from './CellEditor.svelte';

  interface Props {
    data: (ProcessedRow | Row)[];
    columns: ResolvedColumn[];
    oncelledit?: (event: { row: Row; column: ResolvedColumn; key: string; oldValue: unknown; newValue: unknown }) => void;
  }

  let { data, columns, oncelledit }: Props = $props();

  // Inline editing state
  let editingCell = $state<{ rowData: Row; rowIndex: number; colKey: string } | null>(null);

  // Find the first status/badge column, or use first text column
  const groupColumn = $derived.by(() => {
    const statusCol = columns.find(
      (col) => col.type === 'status' || col.type === 'badge'
    );
    if (statusCol) return statusCol.key;

    const textCol = columns.find((col) => col.type === 'text');
    return textCol?.key || columns[0]?.key;
  });

  // Group rows by the selected column
  const groupedData = $derived.by(() => {
    if (!groupColumn) return new Map<string, typeof data>();

    const groups = new Map<string, typeof data>();
    for (const row of data) {
      const rowData = 'original' in row ? row.original : (row as Row);
      const value = String(rowData[groupColumn] ?? 'Uncategorized');
      if (!groups.has(value)) groups.set(value, []);
      groups.get(value)!.push(row);
    }
    return groups;
  });

  // Get key columns to display in each card
  const displayColumns = $derived(
    columns
      .filter(
        (col) =>
          col.key !== groupColumn &&
          col.type !== 'actions' &&
          ['text', 'number', 'date', 'email'].includes(col.type)
      )
      .slice(0, 3)
  );

  function getCellValue(row: ProcessedRow | Row, key: string): string {
    const rowData = 'original' in row ? row.original : (row as Row);
    const val = rowData[key];
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  }

  function formatValue(value: string): string {
    return value.length > 50 ? value.slice(0, 50) + '...' : value;
  }

  function handleFieldDoubleClick(row: ProcessedRow | Row, rowIndex: number, col: ResolvedColumn) {
    const rowData = 'original' in row ? row.original : (row as Row);
    editingCell = { rowData, rowIndex, colKey: col.key };
  }

  function handleCellEditConfirm(newValue: unknown) {
    if (!editingCell) return;

    const { rowData, colKey } = editingCell;
    const column = columns.find((c) => c.key === colKey)!;
    const oldValue = rowData[colKey];

    // Update the row data
    rowData[colKey] = newValue;

    // Trigger callback
    oncelledit?.({
      row: rowData,
      column,
      key: colKey,
      oldValue,
      newValue,
    });

    editingCell = null;
  }

  function handleCellEditCancel() {
    editingCell = null;
  }
</script>

<div class="tc-kanban-view">
  {#each Array.from(groupedData.entries()) as [groupLabel, groupRows] (groupLabel)}
    <div class="tc-kanban-lane">
      <div class="tc-kanban-header">
        <h3 class="tc-kanban-title">{groupLabel}</h3>
        <span class="tc-kanban-count">{groupRows.length}</span>
      </div>
      <div class="tc-kanban-cards">
        {#each groupRows as row, rowIdx (row)}
          <div class="tc-kanban-card">
            {#each displayColumns as col (col.key)}
              <div class="tc-kanban-field">
                <div class="tc-kanban-label">{col.label}</div>
                {#if editingCell?.rowData === ('original' in row ? row.original : row) && editingCell?.colKey === col.key}
                  <CellEditor
                    value={getCellValue(row, col.key)}
                    column={col}
                    row={'original' in row ? row.original : (row as Row)}
                    onconfirm={handleCellEditConfirm}
                    oncancel={handleCellEditCancel}
                  />
                {:else}
                  <div
                    class="tc-kanban-value"
                    ondblclick={() => handleFieldDoubleClick(row, rowIdx, col)}
                    role="button"
                    tabindex="0"
                    title="Double-click to edit"
                  >
                    {formatValue(getCellValue(row, col.key))}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  {/each}

  {#if groupedData.size === 0}
    <div class="tc-kanban-empty">No data to display</div>
  {/if}
</div>

<style>
  .tc-kanban-view {
    display: flex;
    gap: 16px;
    padding: 16px;
    overflow-x: auto;
    background: var(--tc-bg-primary, #ffffff);
    min-height: 400px;
  }

  .tc-kanban-lane {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 320px;
    flex-shrink: 0;
  }

  .tc-kanban-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 4px;
  }

  .tc-kanban-title {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--tc-text-primary, #0a0a0a);
  }

  .tc-kanban-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 6px;
    background: var(--tc-bg-secondary, #f0f0f0);
    color: var(--tc-text-secondary, #666666);
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .tc-kanban-cards {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .tc-kanban-card {
    padding: 12px;
    background: var(--tc-bg-primary, #ffffff);
    border: 1px solid var(--tc-border-color, #f0f0f0);
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: box-shadow 0.2s ease-out, border-color 0.2s ease-out;
  }

  .tc-kanban-card:hover {
    border-color: var(--tc-text-primary, #0a0a0a);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  }

  .tc-kanban-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .tc-kanban-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--tc-text-secondary, #666666);
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .tc-kanban-value {
    font-size: 0.875rem;
    color: var(--tc-text-primary, #0a0a0a);
    word-break: break-word;
  }

  .tc-kanban-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 40px;
    color: var(--tc-text-secondary, #666666);
    font-size: 0.875rem;
  }
</style>
