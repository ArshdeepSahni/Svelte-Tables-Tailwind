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
  let editingCell = $state<{ rowData: Row; colKey: string } | null>(null);

  // Get key columns to display in each card (title + 3 fields)
  const displayColumns = $derived(
    columns
      .filter((col) => col.type !== 'actions' && col.type !== 'image')
      .slice(0, 4)
  );

  const imageColumn = $derived(
    columns.find((col) => col.type === 'image')
  );

  function getCellValue(row: ProcessedRow | Row, key: string): string {
    const rowData = 'original' in row ? row.original : (row as Row);
    const val = rowData[key];
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  }

  function getImageUrl(row: ProcessedRow | Row): string | null {
    if (!imageColumn) return null;
    const val = getCellValue(row, imageColumn.key);
    return val ? val : null;
  }

  function formatValue(value: string): string {
    return value.length > 60 ? value.slice(0, 60) + '...' : value;
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

<div class="tc-gallery-view">
  {#if data.length === 0}
    <div class="tc-gallery-empty">No data to display</div>
  {:else}
    <div class="tc-gallery-grid">
      {#each data as row (row)}
        <div class="tc-gallery-card">
          {#if imageColumn}
            {@const imgUrl = getImageUrl(row)}
            {#if imgUrl}
              <div class="tc-gallery-image">
                <img src={imgUrl} alt="Card" />
              </div>
            {:else}
              <div class="tc-gallery-image-placeholder">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" stroke="currentColor" stroke-width="1.5" />
                  <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                  <path d="M3 15L10 8L21 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
            {/if}
          {/if}
          <div class="tc-gallery-content">
            {#each displayColumns.slice(0, 1) as col (col.key)}
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
                  class="tc-gallery-title"
                  ondblclick={() => handleFieldDoubleClick(row, col)}
                  role="button"
                  tabindex="0"
                  title="Double-click to edit"
                >
                  {formatValue(getCellValue(row, col.key))}
                </div>
              {/if}
            {/each}
            <div class="tc-gallery-fields">
              {#each displayColumns.slice(1, 4) as col (col.key)}
                <div class="tc-gallery-field">
                  <span class="tc-gallery-label">{col.label}</span>
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
                      class="tc-gallery-value"
                      ondblclick={() => handleFieldDoubleClick(row, col)}
                      role="button"
                      tabindex="0"
                      title="Double-click to edit"
                    >
                      {formatValue(getCellValue(row, col.key))}
                    </span>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .tc-gallery-view {
    padding: 16px;
    background: var(--tc-bg-primary, #ffffff);
    min-height: 400px;
  }

  .tc-gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  @media (max-width: 768px) {
    .tc-gallery-grid {
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
    }
  }

  @media (max-width: 480px) {
    .tc-gallery-grid {
      grid-template-columns: 1fr;
    }
  }

  .tc-gallery-card {
    display: flex;
    flex-direction: column;
    background: var(--tc-bg-primary, #ffffff);
    border: 1px solid var(--tc-border-color, #f0f0f0);
    border-radius: 12px;
    overflow: hidden;
    transition: box-shadow 0.2s ease-out, border-color 0.2s ease-out, transform 0.2s ease-out;
    cursor: pointer;
  }

  .tc-gallery-card:hover {
    border-color: var(--tc-text-primary, #0a0a0a);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }

  .tc-gallery-image {
    width: 100%;
    aspect-ratio: 1 / 0.75;
    background: var(--tc-bg-secondary, #f5f5f5);
    overflow: hidden;
  }

  .tc-gallery-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .tc-gallery-image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--tc-bg-secondary, #f5f5f5);
    color: var(--tc-text-secondary, #ccc);
  }

  .tc-gallery-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    flex: 1;
  }

  .tc-gallery-title {
    display: block;
    margin: 0;
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--tc-text-primary, #0a0a0a);
    line-height: 1.3;
  }

  .tc-gallery-fields {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .tc-gallery-field {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .tc-gallery-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--tc-text-secondary, #666666);
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .tc-gallery-value {
    font-size: 0.8125rem;
    color: var(--tc-text-primary, #0a0a0a);
    word-break: break-word;
  }

  .tc-gallery-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 400px;
    color: var(--tc-text-secondary, #666666);
    font-size: 0.875rem;
  }
</style>
