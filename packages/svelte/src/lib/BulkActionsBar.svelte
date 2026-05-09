<script lang="ts">
  /**
   * @tablecraft/svelte — BulkActionsBar component
   *
   * Floating action bar that appears at the bottom of the table when rows are selected.
   * Inspired by Notion's bulk actions but with Apple aesthetic.
   *
   * Features:
   * - Fixed position at bottom center of table wrapper
   * - Shows row count + action buttons
   * - Smooth animation in from bottom
   * - Dark near-black background with white text
   * - Svelte 5 runes ($props, $state, $derived, $effect)
   * - CSS custom properties (--tc-*) only
   */

  interface Props {
    selectedCount: number;
    totalCount: number;
    ondelete?: () => void;
    onduplicate?: () => void;
    onexport?: (format: 'csv' | 'json' | 'clipboard') => void;
    onclearselection?: () => void;
    onbulkedit?: () => void;
  }

  let {
    selectedCount = 0,
    totalCount = 0,
    ondelete,
    onduplicate,
    onexport,
    onclearselection,
    onbulkedit,
  }: Props = $props();

  let exportMenuOpen = $state(false);
  let toastMessage = $state<string | null>(null);
  let toastTimer: number | undefined;

  function showToast(message: string) {
    toastMessage = message;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toastMessage = null;
    }, 2000);
  }

  function handleDelete() {
    ondelete?.();
  }

  function handleDuplicate() {
    onduplicate?.();
  }

  function handleExportClick() {
    exportMenuOpen = !exportMenuOpen;
  }

  function handleExport(format: 'csv' | 'json' | 'clipboard') {
    onexport?.(format);
    exportMenuOpen = false;

    if (format === 'clipboard') {
      showToast('Copied to clipboard!');
    } else {
      showToast(`Exported as ${format.toUpperCase()}`);
    }
  }

  function handleClearSelection() {
    onclearselection?.();
  }

  function handleBulkEdit() {
    onbulkedit?.();
  }

  $effect(() => {
    return () => window.clearTimeout(toastTimer);
  });
</script>

{#if selectedCount > 0}
  <div class="tc-bulk-actions-bar">
    <div class="tc-bulk-actions-content">
      <span class="tc-bulk-actions-label">
        {selectedCount} of {totalCount} {selectedCount === 1 ? 'row' : 'rows'} selected
      </span>

      <div class="tc-bulk-actions-buttons">
        <!-- Bulk Edit Button -->
        <button
          type="button"
          class="tc-bulk-action-btn"
          aria-label="Bulk edit selected rows"
          title="Bulk Edit"
          onclick={handleBulkEdit}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" stroke="none">
            <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/>
            <path d="M6 5h4M6 8h4M6 11h3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          </svg>
          <span>Edit</span>
        </button>

        <!-- Duplicate Button -->
        <button
          type="button"
          class="tc-bulk-action-btn"
          aria-label="Duplicate selected rows"
          title="Duplicate"
          onclick={handleDuplicate}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" stroke="none">
            <path d="M3 2h7a1 1 0 011 1v7a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/>
            <path d="M5 8h7a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V9a1 1 0 011-1z" opacity="0.6"/>
          </svg>
          <span>Duplicate</span>
        </button>

        <!-- Export Dropdown -->
        <div class="tc-bulk-action-dropdown">
          <button
            type="button"
            class="tc-bulk-action-btn"
            aria-label="Export selected rows"
            title="Export"
            onclick={handleExportClick}
            aria-expanded={exportMenuOpen}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3 12h10M8 2v8M4 8l4 4 4-4"/>
            </svg>
            <span>Export</span>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" class:tc-dropdown-arrow-open={exportMenuOpen}>
              <path d="M1 3l3 3 3-3"/>
            </svg>
          </button>

          {#if exportMenuOpen}
            <div class="tc-bulk-action-menu">
              <button
                type="button"
                class="tc-bulk-action-menu-item"
                onclick={() => handleExport('csv')}
              >
                Export as CSV
              </button>
              <button
                type="button"
                class="tc-bulk-action-menu-item"
                onclick={() => handleExport('json')}
              >
                Export as JSON
              </button>
              <button
                type="button"
                class="tc-bulk-action-menu-item"
                onclick={() => handleExport('clipboard')}
              >
                Copy to Clipboard
              </button>
            </div>
          {/if}
        </div>

        <!-- Delete Button -->
        <button
          type="button"
          class="tc-bulk-action-btn tc-bulk-action-btn--danger"
          aria-label="Delete selected rows"
          title="Delete"
          onclick={handleDelete}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 4h12M6 4V2a1 1 0 011-1h2a1 1 0 011 1v2M3 4h10v9a1 1 0 01-1 1H4a1 1 0 01-1-1V4z"/>
            <path d="M6 8v4M10 8v4" stroke="currentColor" stroke-width="1.5" fill="none"/>
          </svg>
          <span>Delete</span>
        </button>

        <!-- Deselect All Button -->
        <button
          type="button"
          class="tc-bulk-action-btn tc-bulk-action-btn--secondary"
          aria-label="Deselect all"
          title="Deselect"
          onclick={handleClearSelection}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 3L3 13M3 3l10 10"/>
          </svg>
        </button>
      </div>
    </div>

    {#if toastMessage}
      <div class="tc-bulk-actions-toast" role="status" aria-live="polite">
        {toastMessage}
      </div>
    {/if}
  </div>
{/if}

<style>
  .tc-bulk-actions-bar {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    animation: slideUp 0.25s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  .tc-bulk-actions-content {
    display: flex;
    align-items: center;
    gap: var(--tc-bulk-actions-gap, 16px);
    background: var(--tc-bulk-actions-bg, #0a0a0a);
    color: var(--tc-bulk-actions-text, #ffffff);
    padding: var(--tc-bulk-actions-padding, 8px 16px);
    border-radius: var(--tc-bulk-actions-border-radius, 12px);
    box-shadow: var(--tc-bulk-actions-shadow, 0 8px 30px rgba(0, 0, 0, 0.15));
    font-size: var(--tc-font-size, 13px);
    font-family: var(--tc-font-family, -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', system-ui, sans-serif);
  }

  .tc-bulk-actions-label {
    font-weight: 500;
    color: var(--tc-bulk-actions-text, #ffffff);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .tc-bulk-actions-buttons {
    display: flex;
    align-items: center;
    gap: var(--tc-bulk-actions-button-gap, 8px);
  }

  .tc-bulk-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: var(--tc-bulk-action-button-height, 28px);
    padding: 0 10px;
    background: rgba(255, 255, 255, 0.1);
    color: var(--tc-bulk-actions-text, #ffffff);
    border: none;
    border-radius: var(--tc-bulk-action-button-radius, 6px);
    font-size: var(--tc-font-size, 13px);
    font-family: inherit;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .tc-bulk-action-btn:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .tc-bulk-action-btn:active {
    background: rgba(255, 255, 255, 0.2);
  }

  .tc-bulk-action-btn svg {
    width: 14px;
    height: 14px;
    display: flex;
    flex-shrink: 0;
  }

  .tc-bulk-action-btn--danger {
    background: rgba(239, 68, 68, 0.15);
    color: #fca5a5;
  }

  .tc-bulk-action-btn--danger:hover {
    background: rgba(239, 68, 68, 0.25);
  }

  .tc-bulk-action-btn--danger:active {
    background: rgba(239, 68, 68, 0.35);
  }

  .tc-bulk-action-btn--secondary {
    padding: 0 8px;
  }

  .tc-bulk-action-dropdown {
    position: relative;
    display: inline-block;
  }

  .tc-dropdown-arrow-open {
    transform: rotate(180deg);
  }

  .tc-bulk-action-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 4px;
    background: var(--tc-color-bg, #ffffff);
    border: 1px solid var(--tc-color-border, #f0f0f0);
    border-radius: var(--tc-bulk-action-button-radius, 6px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 140px;
    overflow: hidden;
    z-index: 1001;
  }

  .tc-bulk-action-menu-item {
    display: block;
    width: 100%;
    padding: 8px 12px;
    background: transparent;
    color: var(--tc-color-text, #0a0a0a);
    border: none;
    font-size: var(--tc-font-size, 13px);
    font-family: inherit;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.1s ease;
  }

  .tc-bulk-action-menu-item:hover {
    background: var(--tc-color-bg-hover, #f5f5f5);
  }

  .tc-bulk-action-menu-item:active {
    background: var(--tc-color-bg-active, #efefef);
  }

  .tc-bulk-actions-toast {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 8px;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.8);
    color: #ffffff;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    animation: fadeIn 0.15s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
