<script lang="ts">
  /**
   * @tablecraft/svelte — TableFooter component
   *
   * Pagination controls: First / Prev / Next / Last buttons with page info text.
   * Hidden when totalPages <= 1 (single-page tables need no navigation).
   *
   * FOUND-08: CSS custom properties (--tc-*) used throughout.
   * FOUND-04: Svelte 5 runes ($props) only — no createEventDispatcher.
   */

  interface Props {
    currentPage: number;
    totalPages: number;
    totalRows: number;
    onpagechange: (page: number) => void;
  }

  let { currentPage, totalPages, totalRows, onpagechange }: Props = $props();
</script>

{#if totalPages > 1}
  <div class="tc-footer" role="navigation" aria-label="Table pagination">
    <span class="tc-footer__info">
      Page {currentPage} of {totalPages} ({totalRows} rows)
    </span>
    <div class="tc-footer__controls">
      <button
        class="tc-btn"
        onclick={() => onpagechange(1)}
        disabled={currentPage === 1}
        aria-label="First page"
      >|&lt;</button>
      <button
        class="tc-btn"
        onclick={() => onpagechange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >&lt;</button>
      <button
        class="tc-btn"
        onclick={() => onpagechange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >&gt;</button>
      <button
        class="tc-btn"
        onclick={() => onpagechange(totalPages)}
        disabled={currentPage === totalPages}
        aria-label="Last page"
      >&gt;|</button>
    </div>
  </div>
{/if}

<style>
  .tc-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.625rem 1rem;
    border-top: 1px solid var(--tc-border-color, #e2e8f0);
    background: var(--tc-toolbar-bg, #f8fafc);
  }

  .tc-footer__info {
    font-size: 0.8125rem;
    color: var(--tc-color-muted, #64748b);
    font-variant-numeric: tabular-nums;
  }

  .tc-footer__controls {
    display: flex;
    gap: 0.25rem;
    align-items: center;
  }

  .tc-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.3125rem 0.625rem;
    border: 1px solid var(--tc-border-color, #e2e8f0);
    border-radius: 0.375rem;
    background: var(--tc-color-bg, #ffffff);
    color: var(--tc-color-text, #0f172a);
    cursor: pointer;
    font-size: 0.8125rem;
    font-family: inherit;
    transition: background 0.15s ease, border-color 0.15s ease;
    min-width: 2rem;
    height: 2rem;
  }

  .tc-btn:hover:not(:disabled) {
    background: var(--tc-color-bg-hover, #f1f5f9);
    border-color: var(--tc-color-primary, #6366f1);
  }

  .tc-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .tc-btn:focus-visible {
    outline: 2px solid var(--tc-color-primary, #6366f1);
    outline-offset: 2px;
  }
</style>
