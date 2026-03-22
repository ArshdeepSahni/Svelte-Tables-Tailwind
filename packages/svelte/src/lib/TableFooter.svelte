<script lang="ts">
  /**
   * @tablecraft/svelte — TableFooter component
   *
   * Three-zone pagination footer:
   *   LEFT: Context info ("Showing 23 of 683 rows · filtered by 'active'")
   *   CENTER: Page dot indicators (click any dot to jump to that page)
   *   RIGHT: Prev/Next navigation buttons
   *
   * Hidden when totalPages <= 1 and no active filter (single page, all rows shown).
   *
   * FOUND-08: CSS custom properties (--tc-*) used throughout.
   * FOUND-04: Svelte 5 runes ($props, $derived) only.
   */

  interface Props {
    currentPage: number;
    totalPages: number;
    totalRows: number;
    totalAllRows?: number;
    filterQuery?: string;
    onpagechange: (page: number) => void;
  }

  let {
    currentPage,
    totalPages,
    totalRows,
    totalAllRows = totalRows,
    filterQuery = '',
    onpagechange,
  }: Props = $props();

  const isFiltered = $derived(totalRows !== totalAllRows);
  const pageStart = $derived((currentPage - 1) * Math.ceil(totalRows / totalPages) + 1);
  const pageEnd = $derived(Math.min(currentPage * Math.ceil(totalRows / totalPages), totalRows));

  // Page dots: show up to 8 dots; above that show a condensed indicator
  const MAX_DOTS = 8;
  const showDots = $derived(totalPages > 1 && totalPages <= MAX_DOTS);
  const showCompactPage = $derived(totalPages > MAX_DOTS);

  const isVisible = $derived(totalPages > 1 || isFiltered);
</script>

{#if isVisible}
  <div class="tc-footer" role="navigation" aria-label="Table pagination">
    <!-- LEFT: context info -->
    <div class="tc-footer__info">
      {#if isFiltered}
        Showing <strong>{totalRows}</strong> of {totalAllRows} rows{#if filterQuery.trim()} &middot; &ldquo;{filterQuery.trim()}&rdquo;{/if}
      {:else if totalPages > 1}
        {pageStart}&ndash;{pageEnd} of {totalRows}
      {:else}
        {totalRows} {totalRows === 1 ? 'row' : 'rows'}
      {/if}
    </div>

    <!-- CENTER: page dots or compact indicator -->
    <div class="tc-footer__center">
      {#if showDots}
        <div class="tc-page-dots" role="group" aria-label="Page navigation">
          {#each Array.from({ length: totalPages }, (_, i) => i + 1) as page}
            <button
              class="tc-page-dot"
              class:tc-page-dot--active={page === currentPage}
              onclick={() => onpagechange(page)}
              aria-label="Go to page {page}"
              aria-current={page === currentPage ? 'page' : undefined}
            ></button>
          {/each}
        </div>
      {:else if showCompactPage}
        <span class="tc-footer__page-compact">{currentPage} / {totalPages}</span>
      {/if}
    </div>

    <!-- RIGHT: prev/next buttons -->
    <div class="tc-footer__controls">
      <button
        class="tc-btn"
        onclick={() => onpagechange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7.5 2L3.5 6l4 4"/>
        </svg>
      </button>
      <button
        class="tc-btn"
        onclick={() => onpagechange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4.5 2l4 4-4 4"/>
        </svg>
      </button>
    </div>
  </div>
{/if}

<style>
  .tc-footer {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    padding: var(--tc-footer-padding, 8px 12px);
    border-top: var(--tc-border-width, 1px) solid var(--tc-color-border-footer, #f0f0f0);
    background: var(--tc-color-bg-footer, #fafafa);
    min-height: 40px;
  }

  .tc-footer__info {
    font-size: var(--tc-font-size-sm, 11px);
    color: var(--tc-color-text-secondary, #737373);
    font-variant-numeric: tabular-nums;
  }

  .tc-footer__info strong {
    font-weight: var(--tc-font-weight-semibold, 600);
    color: var(--tc-color-text, #0a0a0a);
  }

  .tc-footer__center {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Page dots */
  .tc-page-dots {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .tc-page-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--tc-color-border, #f0f0f0);
    border: none;
    cursor: pointer;
    padding: 0;
    transition: background var(--tc-transition-btn, 0.12s ease), transform 0.12s ease, width 0.12s ease;
    flex-shrink: 0;
  }

  .tc-page-dot:hover {
    background: var(--tc-color-text-muted, #a3a3a3);
  }

  .tc-page-dot--active {
    background: var(--tc-color-accent, #0a0a0a);
    width: 16px;
    border-radius: 3px;
  }

  .tc-footer__page-compact {
    font-size: var(--tc-font-size-sm, 11px);
    color: var(--tc-color-text-secondary, #737373);
    font-variant-numeric: tabular-nums;
  }

  .tc-footer__controls {
    display: flex;
    gap: 4px;
    align-items: center;
    justify-content: flex-end;
  }

  .tc-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: var(--tc-border-width, 1px) solid var(--tc-color-border-btn, #e5e5e5);
    border-radius: var(--tc-border-radius-sm, 6px);
    background: var(--tc-color-bg, #ffffff);
    color: var(--tc-color-text, #0a0a0a);
    cursor: pointer;
    font-size: var(--tc-font-size-sm, 11px);
    font-family: inherit;
    transition: var(--tc-transition-btn, background 0.12s ease, border-color 0.12s ease);
    padding: 0;
  }

  .tc-btn:hover:not(:disabled) {
    background: var(--tc-color-bg-row-hover, #f5f5f5);
    border-color: var(--tc-color-border-btn-hover, #0a0a0a);
  }

  .tc-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .tc-btn:focus-visible {
    outline: 2px solid var(--tc-color-focus-ring, rgba(10,10,10,0.15));
    outline-offset: 2px;
  }
</style>
