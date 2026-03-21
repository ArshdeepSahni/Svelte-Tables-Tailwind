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
    padding: var(--tc-spacing-3, 0.75rem) var(--tc-spacing-4, 1rem);
    border-top: 1px solid var(--tc-border-color, #e5e7eb);
  }

  .tc-footer__info {
    font-size: 0.875rem;
    color: var(--tc-color-muted, #6b7280);
  }

  .tc-footer__controls {
    display: flex;
    gap: var(--tc-spacing-1, 0.25rem);
  }

  .tc-btn {
    padding: var(--tc-spacing-1, 0.25rem) var(--tc-spacing-2, 0.5rem);
    border: 1px solid var(--tc-border-color, #e5e7eb);
    border-radius: var(--tc-border-radius, 0.375rem);
    background: transparent;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .tc-btn:hover:not(:disabled) {
    background: var(--tc-color-bg-hover, #f3f4f6);
  }

  .tc-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .tc-btn:focus-visible {
    outline: 2px solid var(--tc-color-primary, #2563eb);
    outline-offset: 2px;
  }
</style>
