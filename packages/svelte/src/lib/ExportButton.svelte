<script lang="ts">
  /**
   * @tablecraft/svelte — ExportButton component
   *
   * Dropdown button in the toolbar for exporting table data.
   * Supports CSV, JSON, and copy-to-clipboard (tab-separated).
   *
   * Features:
   * - CSV: Proper CSV with headers, handles commas/quotes in values
   * - JSON: Pretty-printed JSON array
   * - Clipboard: Tab-separated values (Excel-friendly)
   * - Toast notification on export
   * - Svelte 5 runes ($props, $state, $derived, $effect)
   * - CSS custom properties (--tc-*) only
   */

  import { onDestroy } from 'svelte';

  interface Props {
    data: Record<string, unknown>[];
    columns: { key: string; label: string }[];
    filename?: string;
  }

  let { data = [], columns = [], filename = 'export' }: Props = $props();

  let dropdownOpen = $state(false);
  let toastMessage = $state<string | null>(null);
  let toastTimer: number | undefined;

  function showToast(message: string) {
    toastMessage = message;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toastMessage = null;
    }, 2500);
  }

  function escapeCSV(value: unknown): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function exportAsCSV() {
    if (data.length === 0) {
      showToast('No data to export');
      return;
    }

    // Headers
    const headers = columns.map((col) => escapeCSV(col.label));
    const rows = data.map((row) => columns.map((col) => escapeCSV(row[col.key])).join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, `${filename}.csv`);

    showToast('Downloaded as CSV');
    dropdownOpen = false;
  }

  function exportAsJSON() {
    if (data.length === 0) {
      showToast('No data to export');
      return;
    }

    // Create objects with column keys
    const jsonData = data.map((row) => {
      const obj: Record<string, unknown> = {};
      columns.forEach((col) => {
        obj[col.key] = row[col.key];
      });
      return obj;
    });

    const json = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    downloadFile(blob, `${filename}.json`);

    showToast('Downloaded as JSON');
    dropdownOpen = false;
  }

  function exportToClipboard() {
    if (data.length === 0) {
      showToast('No data to export');
      return;
    }

    // Tab-separated values (Excel-friendly)
    const headers = columns.map((col) => col.label).join('\t');
    const rows = data.map((row) => columns.map((col) => row[col.key] ?? '').join('\t'));

    const tsv = [headers, ...rows].join('\n');

    navigator.clipboard
      .writeText(tsv)
      .then(() => {
        showToast('Copied to clipboard!');
        dropdownOpen = false;
      })
      .catch(() => {
        showToast('Failed to copy to clipboard');
      });
  }

  function downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function toggleDropdown() {
    dropdownOpen = !dropdownOpen;
  }

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const button = document.querySelector('.tc-export-button');
    const menu = document.querySelector('.tc-export-menu');

    if (dropdownOpen && !button?.contains(target) && !menu?.contains(target)) {
      dropdownOpen = false;
    }
  }

  $effect(() => {
    if (!dropdownOpen) return;
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  onDestroy(() => {
    window.clearTimeout(toastTimer);
    document.removeEventListener('click', handleClickOutside);
  });
</script>

<div class="tc-export-container">
  <button
    type="button"
    class="tc-export-button"
    aria-label="Export table data"
    aria-expanded={dropdownOpen}
    onclick={toggleDropdown}
  >
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M3 12h10M8 2v8M4 8l4 4 4-4"/>
    </svg>
    <span>Export</span>
    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" class:tc-dropdown-arrow--open={dropdownOpen}>
      <path d="M1 3l3 3 3-3"/>
    </svg>
  </button>

  {#if dropdownOpen}
    <div class="tc-export-menu" role="menu">
      <button
        type="button"
        class="tc-export-menu-item"
        role="menuitem"
        onclick={exportAsCSV}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 2h12v12H2z"/>
          <path d="M2 6h12M2 10h12M6 2v12M10 2v12" stroke="white" stroke-width="0.5"/>
        </svg>
        <span>Export as CSV</span>
      </button>

      <button
        type="button"
        class="tc-export-menu-item"
        role="menuitem"
        onclick={exportAsJSON}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 3h8v10H4z"/>
          <path d="M6 6h4M6 10h4M6 8h2" stroke="white" stroke-width="1"/>
        </svg>
        <span>Export as JSON</span>
      </button>

      <button
        type="button"
        class="tc-export-menu-item"
        role="menuitem"
        onclick={exportToClipboard}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 2h4v2H4V2z"/>
          <path d="M3 4h10v10H3z"/>
          <path d="M6 8h4M6 11h4" stroke="white" stroke-width="0.5"/>
        </svg>
        <span>Copy to Clipboard</span>
      </button>
    </div>
  {/if}

  {#if toastMessage}
    <div class="tc-export-toast" role="status" aria-live="polite">
      {toastMessage}
    </div>
  {/if}
</div>

<style>
  .tc-export-container {
    position: relative;
    display: inline-block;
  }

  .tc-export-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: var(--tc-toolbar-button-height, 28px);
    padding: 0 10px;
    background: var(--tc-color-bg-button, #f5f5f5);
    color: var(--tc-color-text, #0a0a0a);
    border: 1px solid var(--tc-color-border, #e5e5e5);
    border-radius: var(--tc-toolbar-button-radius, 6px);
    font-size: var(--tc-font-size, 13px);
    font-family: var(--tc-font-family, -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', system-ui, sans-serif);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .tc-export-button:hover {
    background: var(--tc-color-bg-button-hover, #efefef);
    border-color: var(--tc-color-border-focus, #d4d4d4);
  }

  .tc-export-button:active {
    background: var(--tc-color-bg-button-active, #e5e5e5);
    border-color: var(--tc-color-border-active, #c4c4c4);
  }

  .tc-export-button svg {
    display: flex;
    flex-shrink: 0;
  }

  .tc-dropdown-arrow--open {
    transform: rotate(180deg);
    transition: transform 0.15s ease;
  }

  .tc-export-menu {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    background: var(--tc-color-bg, #ffffff);
    border: 1px solid var(--tc-color-border, #e5e5e5);
    border-radius: var(--tc-toolbar-button-radius, 6px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    min-width: 160px;
    overflow: hidden;
    z-index: 1000;
    animation: slideDown 0.15s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .tc-export-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
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

  .tc-export-menu-item:hover {
    background: var(--tc-color-bg-hover, #f9f9f9);
  }

  .tc-export-menu-item:active {
    background: var(--tc-color-bg-active, #f0f0f0);
  }

  .tc-export-menu-item:first-child {
    border-radius: var(--tc-toolbar-button-radius, 6px) var(--tc-toolbar-button-radius, 6px) 0 0;
  }

  .tc-export-menu-item:last-child {
    border-radius: 0 0 var(--tc-toolbar-button-radius, 6px) var(--tc-toolbar-button-radius, 6px);
  }

  .tc-export-menu-item svg {
    flex-shrink: 0;
    opacity: 0.6;
  }

  .tc-export-toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.8);
    color: #ffffff;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    z-index: 1001;
    animation: slideUp 0.2s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
</style>
