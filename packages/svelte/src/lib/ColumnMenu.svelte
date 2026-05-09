<script lang="ts">
  /**
   * @tablecraft/svelte — ColumnMenu component (rewritten)
   *
   * Intelligent, context-aware column menu inspired by Notion's column operations.
   * Features:
   * - Smart context-aware sections based on column type
   * - Type-specific actions (number stats, text grouping, date filtering, etc.)
   * - Sort state indicators with direction hints
   * - Freeze/pin column actions
   * - Hide column with safety check (not last visible)
   * - Smooth animations, keyboard navigation, viewport detection
   *
   * Design: Notion-inspired, quiet luxury aesthetic
   * - White #ffffff bg, near-black #0a0a0a accent, #f0f0f0 borders
   * - 260px menu, 8px padding, 13px font, 10px border-radius
   * - Section headers, dividers, subtle hover states
   *
   * Svelte 5: $props, $state, $derived, $effect only
   * CSS: Custom properties (--tc-*) only
   */

  import { onDestroy } from 'svelte';
  import type { ResolvedColumn, ColumnType } from '@tablecraft/core';

  interface Props {
    column: ResolvedColumn;
    position: { x: number; y: number };
    visible: boolean;
    sortState: { key: string | null; dir: 'asc' | 'desc' | null };
    frozenColumns?: Set<string>;
    groupedBy?: string | null;
    visibleColumnCount?: number;
    // Computed stats (for number columns)
    columnStats?: { min: number; max: number; avg: number; sum: number; count: number };
    // Callbacks
    onsort?: (key: string, dir: 'asc' | 'desc') => void;
    onclearsort?: () => void;
    onhide?: (key: string) => void;
    onfreeze?: (key: string, side: 'left' | 'right' | null) => void;
    ongroupby?: (key: string) => void;
    onclose?: () => void;
    onfilter?: (key: string, query: string) => void;
    // Text operations
    ontrimwhitespace?: (key: string) => void;
    oncasechange?: (key: string, casing: 'upper' | 'lower' | 'title') => void;
    // Number operations
    onstats?: (key: string) => void;
    // Quick filter
    onquickfilter?: (key: string, value: unknown) => void;
    // Data operations
    onduplicate?: (key: string) => void;
    // Column type change
    onchangetype?: (key: string, newType: ColumnType) => void;
  }

  let {
    column,
    position,
    visible,
    sortState,
    frozenColumns = new Set(),
    groupedBy = null,
    visibleColumnCount = 1,
    columnStats,
    onsort,
    onclearsort,
    onhide,
    onfreeze,
    ongroupby,
    onclose,
    onfilter,
    ontrimwhitespace,
    oncasechange,
    onstats,
    onquickfilter,
    onduplicate,
    onchangetype,
  }: Props = $props();

  // State
  let menuEl: HTMLDivElement | undefined = $state();
  let filterValue = $state('');

  // Menu constants
  const MENU_WIDTH = 260;
  const MENU_HEIGHT = 600;
  const VIEWPORT_PADDING = 8;

  // Derived position — adjusted for viewport overflow
  const menuX = $derived.by(() => {
    let x = position.x;
    if (typeof window === 'undefined') return x;
    const vw = window.innerWidth;
    if (x + MENU_WIDTH + VIEWPORT_PADDING > vw) x = vw - MENU_WIDTH - VIEWPORT_PADDING;
    if (x < VIEWPORT_PADDING) x = VIEWPORT_PADDING;
    return x;
  });

  const menuY = $derived.by(() => {
    let y = position.y;
    if (typeof window === 'undefined') return y;
    const vh = window.innerHeight;
    if (y + MENU_HEIGHT + VIEWPORT_PADDING > vh) y = Math.max(VIEWPORT_PADDING, vh - MENU_HEIGHT - VIEWPORT_PADDING);
    if (y < VIEWPORT_PADDING) y = VIEWPORT_PADDING;
    return y;
  });

  // State derived
  const isSorted = $derived(sortState.key === column.key);
  const sortDir = $derived(isSorted ? sortState.dir : null);
  const isSortedAsc = $derived(sortDir === 'asc');
  const isFrozen = $derived(frozenColumns.has(column.key));
  const isGrouped = $derived(groupedBy === column.key);
  const canHide = $derived(visibleColumnCount > 1);

  // Column type detection
  const isNumberType = $derived(
    column.type === 'number' || column.type === 'currency' || column.type === 'percentage'
  );
  const isTextType = $derived(column.type === 'text' || column.type === 'email' || column.type === 'url');
  const isDateType = $derived(
    column.type === 'date' || column.type === 'datetime' || column.type === 'time' || column.type === 'relative-time'
  );
  const isBooleanType = $derived(column.type === 'boolean');
  const isRatingType = $derived(column.type === 'rating');
  const isProgressType = $derived(column.type === 'progress');

  // Sort label helpers
  const sortAscLabel = $derived.by((): string => {
    if (isNumberType) return 'Sort 1→9';
    if (isDateType) return 'Sort Old→New';
    return 'Sort A→Z';
  });

  const sortDescLabel = $derived.by((): string => {
    if (isNumberType) return 'Sort 9→1';
    if (isDateType) return 'Sort New→Old';
    return 'Sort Z→A';
  });

  // Event handlers
  function handleSort(dir: 'asc' | 'desc') {
    onsort?.(column.key, dir);
    onclose?.();
  }

  function handleClearSort() {
    onclearsort?.();
    onclose?.();
  }

  function handleHide() {
    onhide?.(column.key);
    onclose?.();
  }

  function handleToggleFreeze() {
    onfreeze?.(column.key, isFrozen ? null : 'left');
    onclose?.();
  }

  function handleGroupBy() {
    ongroupby?.(column.key);
    onclose?.();
  }

  function handleFilterSubmit() {
    if (filterValue.trim()) {
      onfilter?.(column.key, filterValue);
      onclose?.();
    }
  }

  function handleTrimWhitespace() {
    ontrimwhitespace?.(column.key);
    onclose?.();
  }

  function handleCaseChange(casing: 'upper' | 'lower' | 'title') {
    oncasechange?.(column.key, casing);
    onclose?.();
  }

  function handleStats() {
    onstats?.(column.key);
    onclose?.();
  }

  function handleQuickFilter(value: unknown) {
    onquickfilter?.(column.key, value);
    onclose?.();
  }

  function handleDuplicate() {
    onduplicate?.(column.key);
    onclose?.();
  }

  function handleChangeType(newType: ColumnType) {
    onchangetype?.(column.key, newType);
    onclose?.();
  }

  function handleClickOutside(e: MouseEvent) {
    if (menuEl && !menuEl.contains(e.target as Node)) {
      onclose?.();
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onclose?.();
    }
  }

  // Effects
  $effect(() => {
    if (!visible) return;

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  });

  onDestroy(() => {
    document.removeEventListener('mousedown', handleClickOutside);
    document.removeEventListener('keydown', handleKeyDown);
  });
</script>

{#if visible}
  <div
    class="tc-column-menu"
    style="--menu-x: {menuX}px; --menu-y: {menuY}px;"
    bind:this={menuEl}
    role="menu"
  >
    <!-- UNIVERSAL: Sort Section -->
    <div class="tc-menu-group">
      <div class="tc-menu-section-header">Sort</div>

      {#if isSorted}
        <button
          class="tc-menu-item tc-active"
          onclick={() => handleSort(isSortedAsc ? 'desc' : 'asc')}
          role="menuitem"
        >
          <span class="tc-menu-icon">{isSortedAsc ? '↓' : '↑'}</span>
          <span class="tc-menu-label">{isSortedAsc ? sortDescLabel : sortAscLabel}</span>
          <span class="tc-menu-checkmark">✓</span>
        </button>

        <button class="tc-menu-item" onclick={handleClearSort} role="menuitem">
          <span class="tc-menu-icon">×</span>
          <span class="tc-menu-label">Remove sort</span>
        </button>
      {:else}
        <button class="tc-menu-item" onclick={() => handleSort('asc')} role="menuitem">
          <span class="tc-menu-icon">↑</span>
          <span class="tc-menu-label">{sortAscLabel}</span>
        </button>

        <button class="tc-menu-item" onclick={() => handleSort('desc')} role="menuitem">
          <span class="tc-menu-icon">↓</span>
          <span class="tc-menu-label">{sortDescLabel}</span>
        </button>
      {/if}
    </div>

    <!-- UNIVERSAL: Filter Section -->
    <div class="tc-menu-group">
      <div class="tc-menu-section-header">Filter</div>
      <div class="tc-menu-filter-input">
        <input
          type="text"
          class="tc-filter-input"
          placeholder="Type to filter..."
          value={filterValue}
          oninput={(e) => (filterValue = (e.target as HTMLInputElement).value)}
          onkeydown={(e) => {
            if (e.key === 'Enter') handleFilterSubmit();
          }}
        />
        <button
          class="tc-filter-button"
          onclick={handleFilterSubmit}
          title="Apply filter"
          type="button"
          disabled={!filterValue.trim()}
        >
          ⏎
        </button>
      </div>
    </div>

    <!-- TYPE-SPECIFIC: Number/Currency Columns -->
    {#if isNumberType}
      <div class="tc-menu-group">
        <div class="tc-menu-section-header">Quick Stats</div>
        <div class="tc-menu-stats">
          <div class="tc-stat-item">
            <span class="tc-stat-label">Min</span>
            <span class="tc-stat-value">{columnStats?.min !== undefined ? columnStats.min.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</span>
          </div>
          <div class="tc-stat-item">
            <span class="tc-stat-label">Max</span>
            <span class="tc-stat-value">{columnStats?.max !== undefined ? columnStats.max.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</span>
          </div>
          <div class="tc-stat-item">
            <span class="tc-stat-label">Avg</span>
            <span class="tc-stat-value">{columnStats?.avg !== undefined ? columnStats.avg.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</span>
          </div>
        </div>
      </div>

      <div class="tc-menu-group">
        <div class="tc-menu-section-header">Calculate</div>
        {#each ['Sum', 'Average', 'Min', 'Max', 'Count'] as fn}
          <button class="tc-menu-item" role="menuitem">
            <span class="tc-menu-icon">Σ</span>
            <span class="tc-menu-label">{fn}</span>
          </button>
        {/each}
      </div>

      <div class="tc-menu-group">
        <div class="tc-menu-section-header">Format</div>
        {#each ['Number', 'Currency', 'Percentage', 'Compact'] as fmt}
          <button class="tc-menu-item" role="menuitem">
            <span class="tc-menu-icon">#</span>
            <span class="tc-menu-label">Format as {fmt}</span>
          </button>
        {/each}
      </div>

      <div class="tc-menu-group">
        <div class="tc-menu-section-header">Visualize</div>
        {#each ['Color scale', 'Data bars', 'Icon set'] as viz}
          <button class="tc-menu-item" role="menuitem">
            <span class="tc-menu-icon">≡</span>
            <span class="tc-menu-label">{viz}</span>
          </button>
        {/each}
      </div>
    {/if}

    <!-- TYPE-SPECIFIC: Text Columns -->
    {#if isTextType}
      <div class="tc-menu-group">
        <div class="tc-menu-section-header">Operations</div>

        <button
          class="tc-menu-item {isGrouped ? 'tc-active' : ''}"
          onclick={handleGroupBy}
          role="menuitem"
        >
          <span class="tc-menu-icon">⊞</span>
          <span class="tc-menu-label">Group by this column</span>
          {#if isGrouped}
            <span class="tc-menu-checkmark">✓</span>
          {/if}
        </button>

        <button class="tc-menu-item" onclick={handleTrimWhitespace} role="menuitem">
          <span class="tc-menu-icon">✂</span>
          <span class="tc-menu-label">Trim whitespace</span>
        </button>
      </div>

      <div class="tc-menu-group">
        <div class="tc-menu-section-header">Case</div>
        <button class="tc-menu-item" onclick={() => handleCaseChange('upper')} role="menuitem">
          <span class="tc-menu-icon">Ⓐ</span>
          <span class="tc-menu-label">Uppercase</span>
        </button>
        <button class="tc-menu-item" onclick={() => handleCaseChange('lower')} role="menuitem">
          <span class="tc-menu-icon">ⓐ</span>
          <span class="tc-menu-label">Lowercase</span>
        </button>
        <button class="tc-menu-item" onclick={() => handleCaseChange('title')} role="menuitem">
          <span class="tc-menu-icon">Ⓣ</span>
          <span class="tc-menu-label">Title Case</span>
        </button>
      </div>
    {/if}

    <!-- TYPE-SPECIFIC: Date Columns -->
    {#if isDateType}
      <div class="tc-menu-group">
        <div class="tc-menu-section-header">Quick Filter</div>
        <button class="tc-menu-item" onclick={() => handleQuickFilter('today')} role="menuitem">
          <span class="tc-menu-icon">📅</span>
          <span class="tc-menu-label">Today</span>
        </button>
        <button class="tc-menu-item" onclick={() => handleQuickFilter('week')} role="menuitem">
          <span class="tc-menu-icon">📅</span>
          <span class="tc-menu-label">This week</span>
        </button>
        <button class="tc-menu-item" onclick={() => handleQuickFilter('month')} role="menuitem">
          <span class="tc-menu-icon">📅</span>
          <span class="tc-menu-label">This month</span>
        </button>
        <button class="tc-menu-item" onclick={() => handleQuickFilter('overdue')} role="menuitem">
          <span class="tc-menu-icon">📅</span>
          <span class="tc-menu-label">Overdue</span>
        </button>
      </div>

      <div class="tc-menu-group">
        <div class="tc-menu-section-header">Group by</div>
        {#each ['Day', 'Week', 'Month', 'Quarter', 'Year'] as period}
          <button class="tc-menu-item" role="menuitem">
            <span class="tc-menu-icon">≡</span>
            <span class="tc-menu-label">by {period}</span>
          </button>
        {/each}
      </div>

      <div class="tc-menu-group">
        <div class="tc-menu-section-header">Format as</div>
        {#each ['Relative', 'Short', 'Full'] as fmt}
          <button class="tc-menu-item" role="menuitem">
            <span class="tc-menu-icon">📅</span>
            <span class="tc-menu-label">{fmt === 'Relative' ? '2 days ago' : fmt === 'Short' ? 'Mar 28' : 'March 28, 2026'}</span>
          </button>
        {/each}
      </div>
    {/if}

    <!-- TYPE-SPECIFIC: Boolean Columns -->
    {#if isBooleanType}
      <div class="tc-menu-group">
        <div class="tc-menu-section-header">Filter</div>
        <button class="tc-menu-item" onclick={() => handleQuickFilter(true)} role="menuitem">
          <span class="tc-menu-icon">✓</span>
          <span class="tc-menu-label">Show true only</span>
        </button>
        <button class="tc-menu-item" onclick={() => handleQuickFilter(false)} role="menuitem">
          <span class="tc-menu-icon">×</span>
          <span class="tc-menu-label">Show false only</span>
        </button>
      </div>

      <div class="tc-menu-group">
        <div class="tc-menu-section-header">Display</div>
        <button class="tc-menu-item" role="menuitem">
          <span class="tc-menu-icon">↻</span>
          <span class="tc-menu-label">Rename values...</span>
        </button>
        <button class="tc-menu-item" role="menuitem">
          <span class="tc-menu-icon">◆</span>
          <span class="tc-menu-label">Convert to status</span>
        </button>
      </div>
    {/if}

    <!-- TYPE-SPECIFIC: Rating Columns -->
    {#if isRatingType}
      <div class="tc-menu-group">
        <div class="tc-menu-section-header">Filter</div>
        <button class="tc-menu-item" onclick={() => handleQuickFilter(3)} role="menuitem">
          <span class="tc-menu-icon">★</span>
          <span class="tc-menu-label">3 stars & above</span>
        </button>
        <button class="tc-menu-item" onclick={() => handleQuickFilter(4)} role="menuitem">
          <span class="tc-menu-icon">★</span>
          <span class="tc-menu-label">4 stars & above</span>
        </button>
      </div>

      <div class="tc-menu-group">
        <div class="tc-menu-section-header">Display as</div>
        {#each ['Stars', 'Hearts', 'Thumbs'] as style}
          <button class="tc-menu-item" role="menuitem">
            <span class="tc-menu-icon">◆</span>
            <span class="tc-menu-label">{style}</span>
          </button>
        {/each}
      </div>
    {/if}

    <!-- TYPE-SPECIFIC: Progress Columns -->
    {#if isProgressType}
      <div class="tc-menu-group">
        <div class="tc-menu-section-header">Filter</div>
        <button class="tc-menu-item" onclick={() => handleQuickFilter(1)} role="menuitem">
          <span class="tc-menu-icon">◯</span>
          <span class="tc-menu-label">Complete (100%)</span>
        </button>
        <button class="tc-menu-item" onclick={() => handleQuickFilter('progress')} role="menuitem">
          <span class="tc-menu-icon">◯</span>
          <span class="tc-menu-label">In Progress</span>
        </button>
        <button class="tc-menu-item" onclick={() => handleQuickFilter(0)} role="menuitem">
          <span class="tc-menu-icon">◯</span>
          <span class="tc-menu-label">Not Started</span>
        </button>
      </div>

      <div class="tc-menu-group">
        <div class="tc-menu-section-header">Display</div>
        <button class="tc-menu-item" role="menuitem">
          <span class="tc-menu-icon">≡</span>
          <span class="tc-menu-label">Color by progress</span>
        </button>
      </div>
    {/if}

    <!-- UNIVERSAL: Column Management (bottom section) -->
    <div class="tc-menu-group tc-menu-bottom">
      <div class="tc-menu-section-header">Column</div>

      <button class="tc-menu-item" onclick={handleToggleFreeze} role="menuitem">
        <span class="tc-menu-icon">{isFrozen ? '❄' : '📌'}</span>
        <span class="tc-menu-label">{isFrozen ? 'Unfreeze' : 'Freeze left'}</span>
      </button>

      <!-- Change Type Submenu -->
      <details class="tc-menu-submenu">
        <summary class="tc-menu-item tc-menu-summary">
          <span class="tc-menu-icon">∴</span>
          <span class="tc-menu-label">Change type</span>
          <span class="tc-menu-icon" style="margin-left: auto; font-size: 10px;">▶</span>
        </summary>
        <div class="tc-menu-submenu-content">
          {#each ['text', 'number', 'integer', 'currency', 'percentage', 'boolean', 'date', 'datetime', 'time', 'email', 'url', 'phone', 'image', 'badge', 'status', 'code', 'html', 'rating', 'progress', 'relative-time', 'color', 'sparkline', 'actions'] as type}
            <button
              class="tc-menu-item {column.type === type ? 'tc-active' : ''}"
              onclick={() => handleChangeType(type as ColumnType)}
              role="menuitem"
            >
              <span class="tc-menu-label" style="padding-left: 12px;">{type}</span>
              {#if column.type === type}
                <span class="tc-menu-checkmark">✓</span>
              {/if}
            </button>
          {/each}
        </div>
      </details>

      <button
        class="tc-menu-item {canHide ? '' : 'tc-disabled'}"
        onclick={canHide ? handleHide : undefined}
        role="menuitem"
        disabled={!canHide}
        title={canHide ? 'Hide this column' : 'Cannot hide last visible column'}
      >
        <span class="tc-menu-icon">👁</span>
        <span class="tc-menu-label">Hide column</span>
      </button>
    </div>
  </div>
{/if}

<style>
  /* Main menu container */
  .tc-column-menu {
    position: fixed;
    left: var(--menu-x, 0);
    top: var(--menu-y, 0);
    z-index: 1000;
    width: 260px;
    max-height: 600px;
    overflow-y: auto;
    background: var(--tc-color-bg-menu, #ffffff);
    border: 1px solid var(--tc-color-border, #f0f0f0);
    border-radius: 10px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06);
    padding: 8px 0;
    animation: tc-menu-fade-in 0.15s ease-out;
    outline: none;
    font-family: system-ui, -apple-system, sans-serif;
  }

  @keyframes tc-menu-fade-in {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Scrollbar styling */
  .tc-column-menu::-webkit-scrollbar {
    width: 6px;
  }

  .tc-column-menu::-webkit-scrollbar-track {
    background: transparent;
  }

  .tc-column-menu::-webkit-scrollbar-thumb {
    background: var(--tc-color-border, #f0f0f0);
    border-radius: 3px;
  }

  .tc-column-menu::-webkit-scrollbar-thumb:hover {
    background: var(--tc-color-text-muted, #999);
  }

  /* Menu groups */
  .tc-menu-group {
    padding: 8px 0;
    border-bottom: 1px solid var(--tc-color-border, #f0f0f0);
  }

  .tc-menu-group:last-child {
    border-bottom: none;
  }

  .tc-menu-bottom {
    margin-top: auto;
  }

  /* Section headers */
  .tc-menu-section-header {
    padding: 6px 14px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--tc-color-text-muted, #999);
    display: block;
    margin-bottom: 4px;
  }

  /* Menu items */
  .tc-menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    height: 32px;
    padding: 0 14px;
    background: none;
    border: none;
    color: var(--tc-color-text, #0a0a0a);
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.1s ease;
    position: relative;
  }

  .tc-menu-item:hover:not(:disabled) {
    background-color: var(--tc-color-bg-hover, #f8f8f8);
  }

  .tc-menu-item:active:not(:disabled) {
    background-color: var(--tc-color-bg-active, #f0f0f0);
  }

  .tc-menu-item.tc-active {
    background-color: var(--tc-color-bg-active, #f0f0f0);
    font-weight: 500;
  }

  .tc-menu-item:disabled,
  .tc-menu-item.tc-disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .tc-menu-item:focus-visible {
    outline: 2px solid var(--tc-color-text, #0a0a0a);
    outline-offset: -2px;
  }

  /* Menu item icon */
  .tc-menu-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    font-size: 14px;
    flex-shrink: 0;
    color: var(--tc-color-text-muted, #999);
  }

  /* Menu item label */
  .tc-menu-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
  }

  /* Checkmark indicator */
  .tc-menu-checkmark {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    font-size: 12px;
    flex-shrink: 0;
    color: var(--tc-color-text, #0a0a0a);
  }

  /* Filter input section */
  .tc-menu-filter-input {
    padding: 8px 14px;
    height: auto;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .tc-filter-input {
    flex: 1;
    height: 28px;
    padding: 0 8px;
    border: 1px solid var(--tc-color-border, #e5e5e5);
    border-radius: 6px;
    background: var(--tc-color-bg-input, #ffffff);
    color: var(--tc-color-text, #0a0a0a);
    font-size: 12px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.1s ease;
  }

  .tc-filter-input::placeholder {
    color: var(--tc-color-text-muted, #999);
  }

  .tc-filter-input:focus {
    border-color: var(--tc-color-text, #0a0a0a);
  }

  .tc-filter-button {
    height: 28px;
    width: 28px;
    padding: 0;
    border: 1px solid var(--tc-color-border, #e5e5e5);
    border-radius: 6px;
    background: var(--tc-color-bg-input, #ffffff);
    color: var(--tc-color-text-muted, #999);
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.1s ease;
  }

  .tc-filter-button:hover:not(:disabled) {
    background: var(--tc-color-bg-hover, #f8f8f8);
    border-color: var(--tc-color-text, #0a0a0a);
    color: var(--tc-color-text, #0a0a0a);
  }

  .tc-filter-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* Stats display */
  .tc-menu-stats {
    padding: 8px 14px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .tc-stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 6px;
    background: var(--tc-color-bg-hover, #f8f8f8);
    border-radius: 6px;
  }

  .tc-stat-label {
    font-size: 10px;
    color: var(--tc-color-text-muted, #999);
    font-weight: 500;
    text-transform: uppercase;
  }

  .tc-stat-value {
    font-size: 12px;
    font-weight: 600;
    color: var(--tc-color-text, #0a0a0a);
  }

  /* Submenu styling */
  .tc-menu-submenu {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .tc-menu-submenu summary {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    height: 32px;
    padding: 0 14px;
    background: none;
    border: none;
    color: var(--tc-color-text, #0a0a0a);
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.1s ease;
    position: relative;
  }

  .tc-menu-submenu summary:hover {
    background-color: var(--tc-color-bg-hover, #f8f8f8);
  }

  .tc-menu-submenu summary:focus-visible {
    outline: 2px solid var(--tc-color-text, #0a0a0a);
    outline-offset: -2px;
  }

  .tc-menu-summary::marker {
    display: none;
  }

  .tc-menu-submenu[open] .tc-menu-summary {
    background-color: var(--tc-color-bg-active, #f0f0f0);
  }

  .tc-menu-submenu[open] .tc-menu-summary span:last-child {
    transform: rotate(90deg);
  }

  .tc-menu-submenu-content {
    display: flex;
    flex-direction: column;
    max-height: 300px;
    overflow-y: auto;
    background: var(--tc-color-bg-hover, #f8f8f8);
  }

  .tc-menu-submenu-content .tc-menu-item {
    padding-left: 14px;
    border-left: 3px solid transparent;
    margin: 0;
  }

  .tc-menu-submenu-content .tc-menu-item:hover {
    background-color: var(--tc-color-bg-active, #f0f0f0);
    border-left-color: var(--tc-color-text, #0a0a0a);
  }
</style>
