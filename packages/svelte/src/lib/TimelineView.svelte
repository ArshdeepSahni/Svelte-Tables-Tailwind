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

  // Find the first date column to use for timeline positioning
  const dateColumn = $derived.by(() => {
    const dateCol = columns.find(
      (col) => col.type === 'date' || col.type === 'datetime' || col.type === 'relative-time'
    );
    return dateCol;
  });

  // Find the first text column for title
  const titleColumn = $derived.by(() => {
    const textCol = columns.find((col) => col.type === 'text');
    return textCol || columns[0];
  });

  // Get detail columns
  const detailColumns = $derived(
    columns
      .filter(
        (col) =>
          col.key !== dateColumn?.key &&
          col.key !== titleColumn?.key &&
          col.type !== 'actions'
      )
      .slice(0, 2)
  );

  // Sort data by date if date column exists
  const sortedData = $derived.by(() => {
    if (!dateColumn) return data;

    const sorted = [...data].sort((a, b) => {
      const aVal = ('original' in a ? a.original : a)[dateColumn.key];
      const bVal = ('original' in b ? b.original : b)[dateColumn.key];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const aDate = new Date(aVal as string).getTime();
      const bDate = new Date(bVal as string).getTime();
      return aDate - bDate;
    });

    return sorted;
  });

  // Group by month if date column exists
  const groupedByMonth = $derived.by(() => {
    if (!dateColumn) {
      return new Map([['Items', sortedData]]);
    }

    const groups = new Map<string, typeof sortedData>();

    for (const row of sortedData) {
      const rowData = 'original' in row ? row.original : (row as Row);
      const dateVal = rowData[dateColumn.key];
      let monthKey = 'Undated';

      if (dateVal) {
        try {
          const date = new Date(dateVal as string);
          monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } catch {
          // Keep monthKey as 'Undated'
        }
      }

      if (!groups.has(monthKey)) {
        groups.set(monthKey, []);
      }
      groups.get(monthKey)!.push(row);
    }

    return groups;
  });

  // Inline editing state
  let editingCell = $state<{ rowData: Row; colKey: string } | null>(null);

  function getCellValue(row: ProcessedRow | Row, key: string): string {
    const rowData = 'original' in row ? row.original : (row as Row);
    const val = rowData[key];
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  }

  function formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
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
</script>

<div class="tc-timeline-view">
  {#if !dateColumn}
    <div class="tc-timeline-empty">No date column found. Timeline requires a date column.</div>
  {:else if sortedData.length === 0}
    <div class="tc-timeline-empty">No data to display</div>
  {:else}
    <div class="tc-timeline-container">
      {#each Array.from(groupedByMonth.entries()) as [monthLabel, items]}
        <div class="tc-timeline-section">
          <div class="tc-timeline-header">
            <h3 class="tc-timeline-month">{monthLabel}</h3>
            <span class="tc-timeline-count">{items.length}</span>
          </div>

          <div class="tc-timeline-items">
            {#each items as row (row)}
              <div class="tc-timeline-item">
                <div class="tc-timeline-dot"></div>
                <div class="tc-timeline-content">
                  <div class="tc-timeline-date">
                    {#if dateColumn}
                      {formatDate(getCellValue(row, dateColumn.key))}
                    {/if}
                  </div>

                  <div
                    class="tc-timeline-title"
                    ondblclick={() => handleFieldDoubleClick(row, titleColumn)}
                    role="button"
                    tabindex="0"
                  >
                    {#if editingCell?.rowData === ('original' in row ? row.original : row) && editingCell?.colKey === titleColumn.key}
                      <CellEditor
                        value={getCellValue(row, titleColumn.key)}
                        column={titleColumn}
                        row={'original' in row ? row.original : (row as Row)}
                        onconfirm={handleCellEditConfirm}
                        oncancel={handleCellEditCancel}
                      />
                    {:else}
                      {getCellValue(row, titleColumn.key)}
                    {/if}
                  </div>

                  {#if detailColumns.length > 0}
                    <div class="tc-timeline-details">
                      {#each detailColumns as col (col.key)}
                        <div class="tc-timeline-detail">
                          <span class="tc-timeline-detail-label">{col.label}</span>
                          {#if editingCell?.rowData === ('original' in row ? row.original : row) && editingCell?.colKey === col.key}
                            <CellEditor
                              value={getCellValue(row, col.key)}
                              column={col}
                              row={'original' in row ? row.original : (row as Row)}
                              onconfirm={handleCellEditConfirm}
                              oncancel={handleCellEditCancel}
                            />
                          {:else}
                            <span
                              class="tc-timeline-detail-value"
                              ondblclick={() => handleFieldDoubleClick(row, col)}
                              role="button"
                              tabindex="0"
                            >
                              {getCellValue(row, col.key)}
                            </span>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .tc-timeline-view {
    padding: 24px;
    background: var(--tc-bg-primary, #ffffff);
    min-height: 400px;
  }

  .tc-timeline-container {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .tc-timeline-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .tc-timeline-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 12px;
    border-bottom: 2px solid var(--tc-border-color, #f0f0f0);
  }

  .tc-timeline-month {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--tc-text-primary, #0a0a0a);
  }

  .tc-timeline-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px 8px;
    background: var(--tc-bg-secondary, #f0f0f0);
    color: var(--tc-text-secondary, #666666);
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .tc-timeline-items {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-left: 24px;
    position: relative;
  }

  .tc-timeline-items::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--tc-border-color, #f0f0f0);
  }

  .tc-timeline-item {
    display: flex;
    gap: 16px;
    position: relative;
  }

  .tc-timeline-dot {
    width: 12px;
    height: 12px;
    background: var(--tc-text-primary, #0a0a0a);
    border: 3px solid var(--tc-bg-primary, #ffffff);
    border-radius: 50%;
    position: absolute;
    left: -30px;
    top: 6px;
    flex-shrink: 0;
  }

  .tc-timeline-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: var(--tc-bg-secondary, #fafafa);
    border: 1px solid var(--tc-border-color, #f0f0f0);
    border-radius: 8px;
    flex: 1;
    transition: border-color 0.2s ease-out, box-shadow 0.2s ease-out;
  }

  .tc-timeline-content:hover {
    border-color: var(--tc-text-primary, #0a0a0a);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  }

  .tc-timeline-date {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--tc-text-secondary, #666666);
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .tc-timeline-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--tc-text-primary, #0a0a0a);
    cursor: pointer;
    word-break: break-word;
  }

  .tc-timeline-details {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .tc-timeline-detail {
    display: flex;
    gap: 8px;
    font-size: 0.8125rem;
    align-items: center;
  }

  .tc-timeline-detail-label {
    font-weight: 500;
    color: var(--tc-text-secondary, #666666);
    min-width: 80px;
    text-transform: uppercase;
    font-size: 0.7rem;
    letter-spacing: 0.2px;
  }

  .tc-timeline-detail-value {
    flex: 1;
    color: var(--tc-text-primary, #0a0a0a);
    cursor: pointer;
    word-break: break-word;
  }

  .tc-timeline-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 400px;
    color: var(--tc-text-secondary, #666666);
    font-size: 0.875rem;
  }
</style>
