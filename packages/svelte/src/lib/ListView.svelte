<script lang="ts">
  import type { Row } from './types.js';
  import type { ProcessedRow, ResolvedColumn } from '@tablecraft/core';
  import CellEditor from './CellEditor.svelte';

  interface Props {
    data: (ProcessedRow | Row)[];
    columns: ResolvedColumn[];
    oncelledit?: (event: { row: Row; column: ResolvedColumn; key: string; oldValue: unknown; newValue: unknown }) => void;
    onrowclick?: (event: { row: Row; rowIndex: number }) => void;
  }

  let { data, columns, oncelledit, onrowclick }: Props = $props();

  // Find the first text column to use as the primary field
  const primaryColumn = $derived.by(() => {
    const textCol = columns.find((col) => col.type === 'text');
    return textCol || columns[0];
  });

  // Get detail columns (next 2-3 most useful columns)
  const detailColumns = $derived(
    columns
      .filter(
        (col) =>
          col.key !== primaryColumn?.key &&
          col.type !== 'actions' &&
          ['text', 'number', 'date', 'email', 'currency', 'status', 'badge'].includes(col.type)
      )
      .slice(0, 3)
  );

  // Expanded rows state
  let expandedRows = $state(new Set<Row>());

  // Inline editing state
  let editingCell = $state<{ rowData: Row; colKey: string } | null>(null);

  function toggleExpanded(row: ProcessedRow | Row) {
    const rowData = 'original' in row ? row.original : (row as Row);
    if (expandedRows.has(rowData)) {
      expandedRows.delete(rowData);
    } else {
      expandedRows.add(rowData);
    }
    expandedRows = new Set(expandedRows);
  }

  function getCellValue(row: ProcessedRow | Row, key: string): string {
    const rowData = 'original' in row ? row.original : (row as Row);
    const val = rowData[key];
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  }

  function handleFieldDoubleClick(row: ProcessedRow | Row, col: ResolvedColumn) {
    const rowData = 'original' in row ? row.original : (row as Row);
    editingCell = { rowData, colKey: col.key };
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

  function handleRowClick(row: ProcessedRow | Row, rowIndex: number) {
    const rowData = 'original' in row ? row.original : (row as Row);
    onrowclick?.({ row: rowData, rowIndex });
  }
</script>

<div class="tc-list-view">
  {#if data.length === 0}
    <div class="tc-list-empty">No data to display</div>
  {:else}
    <div class="tc-list-items">
      {#each data as row, rowIdx (row)}
        <div class="tc-list-item">
          <div class="tc-list-item-header">
            <button
              class="tc-list-toggle"
              onclick={() => toggleExpanded(row)}
              aria-expanded={expandedRows.has('original' in row ? row.original : row)}
              title={expandedRows.has('original' in row ? row.original : row) ? 'Collapse' : 'Expand'}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M6 3L11 8L6 13"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>

            <div
              class="tc-list-primary"
              ondblclick={() => handleFieldDoubleClick(row, primaryColumn)}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') toggleExpanded(row);
              }}
              role="button"
              tabindex="0"
              onclick={() => handleRowClick(row, rowIdx)}
            >
              {#if editingCell?.rowData === ('original' in row ? row.original : row) && editingCell?.colKey === primaryColumn.key}
                <CellEditor
                  value={getCellValue(row, primaryColumn.key)}
                  column={primaryColumn}
                  row={'original' in row ? row.original : (row as Row)}
                  onconfirm={handleCellEditConfirm}
                  oncancel={handleCellEditCancel}
                />
              {:else}
                <strong class="tc-list-primary-text">
                  {getCellValue(row, primaryColumn.key)}
                </strong>
              {/if}
            </div>
          </div>

          {#if expandedRows.has('original' in row ? row.original : row)}
            <div class="tc-list-item-details">
              {#each detailColumns as col (col.key)}
                <div class="tc-list-detail-row">
                  <div class="tc-list-detail-label">{col.label}</div>
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
                      class="tc-list-detail-value"
                      ondblclick={() => handleFieldDoubleClick(row, col)}
                      role="button"
                      tabindex="0"
                      title="Double-click to edit"
                    >
                      {getCellValue(row, col.key)}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .tc-list-view {
    padding: 16px;
    background: var(--tc-bg-primary, #ffffff);
    min-height: 400px;
  }

  .tc-list-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .tc-list-item {
    border: 1px solid var(--tc-border-color, #f0f0f0);
    border-radius: 8px;
    overflow: hidden;
    background: var(--tc-bg-primary, #ffffff);
    transition: border-color 0.2s ease-out, box-shadow 0.2s ease-out;
  }

  .tc-list-item:hover {
    border-color: var(--tc-text-primary, #0a0a0a);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  }

  .tc-list-item-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    cursor: pointer;
    background: var(--tc-bg-primary, #ffffff);
    transition: background-color 0.1s ease;
  }

  .tc-list-item-header:hover {
    background: var(--tc-bg-hover, #f9f9f9);
  }

  .tc-list-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--tc-text-secondary, #666666);
    cursor: pointer;
    transition: transform 0.2s ease-out, color 0.1s ease;
    flex-shrink: 0;
  }

  .tc-list-toggle:hover {
    color: var(--tc-text-primary, #0a0a0a);
  }

  .tc-list-toggle:focus-visible {
    outline: 2px solid var(--tc-text-primary, #0a0a0a);
    outline-offset: -2px;
  }

  .tc-list-toggle :global(svg) {
    transition: transform 0.2s ease-out;
  }

  .tc-list-toggle[aria-expanded='true'] :global(svg) {
    transform: rotate(90deg);
  }

  .tc-list-primary {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .tc-list-primary-text {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--tc-text-primary, #0a0a0a);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tc-list-item-details {
    padding: 12px 16px;
    border-top: 1px solid var(--tc-border-color, #f0f0f0);
    background: var(--tc-bg-secondary, #fafafa);
    animation: slideDown 0.15s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .tc-list-detail-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 0;
    font-size: 0.875rem;
  }

  .tc-list-detail-label {
    font-weight: 500;
    color: var(--tc-text-secondary, #666666);
    min-width: 120px;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.3px;
  }

  .tc-list-detail-value {
    flex: 1;
    color: var(--tc-text-primary, #0a0a0a);
    word-break: break-word;
  }

  .tc-list-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 400px;
    color: var(--tc-text-secondary, #666666);
    font-size: 0.875rem;
  }
</style>
