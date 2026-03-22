<script lang="ts">
  /**
   * @tablecraft/svelte — Table component (Phase 3 production rewrite)
   *
   * Full integration with @tablecraft/core engine:
   * - Two-phase inference: immediate text columns + typed via requestIdleCallback
   * - $state() reactive pipeline: filter → sort → paginate → visibleRows
   * - WCAG 2.1 AA: role="grid", aria-colcount, aria-rowcount, aria-sort, aria-selected, aria-busy
   * - v1 colname/rowdata backward compat via adaptV1Props()
   *
   * FOUND-07: No {@html} — all cell rendering delegated to Cell.svelte
   * FOUND-08: CSS custom properties (--tc-*) only — no Tailwind CDN
   * FOUND-09: No type-switcher select — column types inferred or declared
   * FOUND-04: Svelte 5 runes ($props, $state, $derived, $effect) only
   */

  import type { Snippet } from 'svelte';
  import type {
    ColumnDefinition,
    ColumnType,
    ResolvedColumn,
    ProcessedRow,
  } from '@tablecraft/core';
  import { createTableEngine, adaptV1Props } from '@tablecraft/core';
  import type { Row, SortState } from './types.js';
  import type { VirtualItem } from '@tanstack/svelte-virtual';
  import { createVirtualizer } from '@tanstack/svelte-virtual';
  import TableHeader from './TableHeader.svelte';
  import TableBody from './TableBody.svelte';
  import TableFooter from './TableFooter.svelte';
  import SearchInput from './SearchInput.svelte';

  type ColumnOverrideShort = Record<string, ColumnType>;

  interface Props {
    // Primary API
    data?: Row[];
    columns?: ColumnOverrideShort | ColumnDefinition<Row>[];
    caption?: string;

    // Display options
    loading?: boolean;
    skeletonRows?: number;
    selectable?: boolean;
    filterable?: boolean;
    pageSize?: number;
    striped?: boolean;
    bordered?: boolean;
    emptyMessage?: string;

    // Virtual scrolling
    virtualizeAt?: number;  // default 200 — row count threshold to activate virtualizer

    // v1 backward compat (typed as unknown to avoid TS errors for existing consumers)
    colname?: unknown;
    rowdata?: unknown;

    // Bindable
    selectedRows?: Row[];

    // Callback events (Svelte 5 — no createEventDispatcher)
    onselect?: (event: { rows: Row[]; allSelected: boolean }) => void;
    onrowclick?: (event: { row: Row; rowIndex: number }) => void;
    oncellclick?: (event: { row: Row; column: ResolvedColumn; value: unknown }) => void;

    // Snippets (Svelte 5 — not slots)
    empty?: Snippet;
  }

  let {
    data = [],
    columns,
    caption,
    loading = false,
    skeletonRows = 5,
    selectable = false,
    filterable = true,
    pageSize = 50,
    striped = false,
    bordered = false,
    emptyMessage = 'No data',
    virtualizeAt = 200,
    colname,
    rowdata,
    selectedRows = $bindable([]),
    onselect,
    onrowclick,
    oncellclick,
    empty,
  }: Props = $props();

  // ---------------------------------------------------------------------------
  // v1 backward compat: detect colname/rowdata and adapt to v2 format
  // ---------------------------------------------------------------------------

  const effectiveData = $derived.by((): Row[] => {
    if (data && data.length > 0) return data;
    if (rowdata !== undefined || colname !== undefined) {
      console.warn(
        '[tablecraft] colname/rowdata API is deprecated. Use data={rows} and columns={...} instead. ' +
          'See https://tablecraft.dev/migrate/v1 for migration guide.',
      );
      // If rowdata is an array of objects (test-friendly format), use directly
      if (Array.isArray(rowdata) && rowdata.length > 0 && typeof rowdata[0] === 'object' && !Array.isArray(rowdata[0])) {
        return rowdata as Row[];
      }
      // If rowdata is the classic v1 array-of-arrays format
      if (Array.isArray(rowdata) && Array.isArray(colname)) {
        try {
          const adapted = adaptV1Props(
            colname as unknown as Record<string, string>,
            rowdata as unknown[][],
          );
          return adapted.data as Row[];
        } catch {
          return rowdata as Row[];
        }
      }
      if (Array.isArray(rowdata)) {
        return rowdata as Row[];
      }
      return data;
    }
    return data;
  });

  const effectiveColumns = $derived.by(() => {
    if (data && data.length > 0) return columns;
    if (rowdata !== undefined || colname !== undefined) {
      // If we have v1-style colname as Record<string, string>, extract columns
      if (colname && typeof colname === 'object' && !Array.isArray(colname)) {
        try {
          const adapted = adaptV1Props(
            colname as Record<string, string>,
            (rowdata ?? []) as unknown[][],
          );
          return columns ?? (adapted.columns.length > 0 ? (adapted.columns as ColumnDefinition<Row>[]) : undefined);
        } catch {
          return columns;
        }
      }
    }
    return columns;
  });

  // ---------------------------------------------------------------------------
  // Reactive state
  // ---------------------------------------------------------------------------

  let resolvedColumns = $state<ResolvedColumn[]>([]);
  let processedRows = $state<ProcessedRow[]>([]);
  let sortState = $state<SortState>({ key: null, dir: null });
  let filterQuery = $state('');
  let currentPage = $state(1);

  // Virtual scrolling state
  let scrollEl = $state<HTMLDivElement | null>(null);
  let rowHeight = $state(48);
  let virtualItems = $state<VirtualItem[]>([]);
  let totalVirtualSize = $state(0);

  // Column virtualization state
  let columnVirtualItems = $state<VirtualItem[]>([]);
  let totalColumnSize = $state(0);
  const COL_VIRTUALIZE_THRESHOLD = 20;

  // Web Worker sort state
  let sortWorker = $state<Worker | null>(null);
  let sortLoading = $state(false);
  let workerSortedRows = $state<ProcessedRow[]>([]);
  const USE_WORKER_THRESHOLD = 10_000;

  // ---------------------------------------------------------------------------
  // Two-phase inference $effect
  // ---------------------------------------------------------------------------

  $effect(() => {
    // Snapshot raw data to avoid proxy identity issues with selectedRows comparison
    const rawData: Row[] = Array.isArray(effectiveData) ? effectiveData : [];

    const engine = createTableEngine({
      data: rawData,
      columns: effectiveColumns,
    });

    // Phase 1: immediate text columns (no inference — fast path)
    const textCols = engine.resolveColumns(rawData, effectiveColumns ?? undefined);

    // Apply label overrides from long-form columns prop (mock compatibility)
    const applyLabelOverrides = (cols: ResolvedColumn[]): ResolvedColumn[] => {
      if (!Array.isArray(effectiveColumns) || effectiveColumns.length === 0) return cols;
      const overrideMap = new Map<string, string>();
      for (const colDef of effectiveColumns as ColumnDefinition<Row>[]) {
        if (colDef.label) overrideMap.set(colDef.key, colDef.label);
      }
      if (overrideMap.size === 0) return cols;
      return cols.map((col) =>
        overrideMap.has(col.key) ? { ...col, label: overrideMap.get(col.key)! } : col,
      );
    };

    resolvedColumns = applyLabelOverrides(textCols);
    processedRows = engine.processRows(rawData, textCols);

    // Phase 2: async typed columns via requestIdleCallback
    const schedule =
      typeof requestIdleCallback !== 'undefined'
        ? requestIdleCallback
        : (cb: () => void) => setTimeout(cb, 1);
    const cancel =
      typeof cancelIdleCallback !== 'undefined' ? cancelIdleCallback : clearTimeout;

    const idleId = schedule(() => {
      const schema = engine.inferSchema(rawData);
      const typedCols = engine.resolveColumns(rawData, effectiveColumns ?? undefined, schema);
      resolvedColumns = applyLabelOverrides(typedCols);
      processedRows = engine.processRows(rawData, typedCols);
    });

    return () => cancel(idleId as number);
  });

  // ---------------------------------------------------------------------------
  // Derived pipeline: filter → sort → paginate → visibleRows
  // ---------------------------------------------------------------------------

  const filteredRows = $derived.by(() => {
    if (!filterQuery.trim()) return processedRows;
    const q = filterQuery.toLowerCase();
    return processedRows.filter((row) =>
      Object.values(row.cells).some((cell) => {
        const v =
          'value' in cell
            ? String((cell as { value: unknown }).value)
            : 'label' in cell
              ? (cell as { label: string }).label
              : 'formatted' in cell
                ? (cell as { formatted: string }).formatted
                : '';
        return v.toLowerCase().includes(q);
      }),
    );
  });

  const mainThreadSortedRows = $derived.by(() => {
    if (!sortState.key || !sortState.dir) return filteredRows;
    const col = resolvedColumns.find((c) => c.key === sortState.key);
    if (!col) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const av = a._original[sortState.key!];
      const bv = b._original[sortState.key!];
      const dir = sortState.dir === 'asc' ? 1 : -1;
      if (av == null) return dir;
      if (bv == null) return -dir;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  });

  // Final sortedRows: uses Worker result when available, falls back to main-thread
  const sortedRows = $derived(
    workerSortedRows.length > 0 && sortState.key !== null
      ? workerSortedRows
      : mainThreadSortedRows,
  );

  // isVirtualizing: true when row count exceeds threshold
  const isVirtualizing = $derived(sortedRows.length > virtualizeAt);

  // isColumnVirtualizing: true when column count exceeds threshold
  const isColumnVirtualizing = $derived(resolvedColumns.length > COL_VIRTUALIZE_THRESHOLD);

  const totalPages = $derived(Math.max(1, Math.ceil(filteredRows.length / pageSize)));
  const visibleRows = $derived(
    sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
  );

  // ---------------------------------------------------------------------------
  // Virtualizer $effect — creates/destroys store when virtualization is active
  // ---------------------------------------------------------------------------

  $effect(() => {
    if (!scrollEl || !isVirtualizing) {
      virtualItems = [];
      totalVirtualSize = 0;
      return;
    }

    // Read row height from CSS variable at mount time
    const cssRowHeight = parseInt(
      getComputedStyle(scrollEl).getPropertyValue('--tc-row-height') || '48',
      10,
    );
    rowHeight = isNaN(cssRowHeight) ? 48 : cssRowHeight;

    const store = createVirtualizer<HTMLDivElement, HTMLTableRowElement>({
      count: sortedRows.length,
      getScrollElement: () => scrollEl!,
      estimateSize: () => rowHeight,
      overscan: 5,
    });

    const unsub = store.subscribe((v) => {
      virtualItems = v.getVirtualItems();
      totalVirtualSize = v.getTotalSize();
    });

    return unsub;
  });

  // ---------------------------------------------------------------------------
  // Column virtualizer $effect — creates/destroys store when column virtualization is active
  // ---------------------------------------------------------------------------

  $effect(() => {
    if (!scrollEl || !isColumnVirtualizing) {
      columnVirtualItems = [];
      totalColumnSize = 0;
      return;
    }

    const colStore = createVirtualizer<HTMLDivElement, HTMLTableCellElement>({
      count: resolvedColumns.length,
      getScrollElement: () => scrollEl!,
      estimateSize: () => 150,  // 150px default column width
      horizontal: true,          // REQUIRED for column virtualization
      overscan: 3,
    });

    const unsub = colStore.subscribe((v) => {
      columnVirtualItems = v.getVirtualItems();
      totalColumnSize = v.getTotalSize();
    });

    return unsub;
  });

  // ---------------------------------------------------------------------------
  // Web Worker lifecycle — create once, handle messages, clean up on unmount
  // ---------------------------------------------------------------------------

  $effect(() => {
    // SSR guard — Worker is not available in Node/SvelteKit SSR
    if (typeof Worker === 'undefined') return;

    let worker: Worker;
    try {
      worker = new Worker(
        new URL('./sort.worker.ts', import.meta.url),
        { type: 'module' },
      );
    } catch {
      // Worker blocked (CSP or env) — silent fallback to main-thread sort
      return;
    }

    worker.addEventListener('message', (e: MessageEvent<{ sortedIndices: number[] }>) => {
      // Worker returns sorted indices — use them to reorder filteredRows directly.
      // This avoids building a 100k-entry Map over Svelte's reactive proxy (major perf win).
      const { sortedIndices } = e.data;
      const snap = filteredRows; // stable reference, no per-element proxy access
      workerSortedRows = sortedIndices.map((i) => snap[i]).filter(Boolean) as ProcessedRow[];
      sortLoading = false;
    });

    worker.addEventListener('error', () => {
      // Worker error — fall back to main-thread sort
      sortLoading = false;
      workerSortedRows = [];
    });

    sortWorker = worker;

    return () => {
      worker.terminate();
      sortWorker = null;
    };
  });

  // ---------------------------------------------------------------------------
  // Sort dispatch — fires Worker for large datasets when sort is active
  // ---------------------------------------------------------------------------

  $effect(() => {
    // Watch sortState and filteredRows
    const key = sortState.key;
    const dir = sortState.dir;
    const rows = filteredRows;

    // Only use Worker for large datasets when sort is active
    if (!key || !dir || rows.length <= USE_WORKER_THRESHOLD || !sortWorker) {
      // Clear worker result when sort is cleared or dataset is small
      if (!key || !dir) {
        workerSortedRows = [];
        sortLoading = false;
      }
      return;
    }

    sortLoading = true;
    // Post only raw _original data (not ProcessedRow — avoids slow structured clone of cell descriptors)
    sortWorker.postMessage({
      data: rows.map((r) => r._original),
      key,
      dir,
    });
  });

  // ---------------------------------------------------------------------------
  // Reset page on data or filter change
  // ---------------------------------------------------------------------------

  $effect(() => {
    void effectiveData;
    void filterQuery;
    currentPage = 1;
  });

  // ---------------------------------------------------------------------------
  // Sort handler: unsorted → asc → desc → unsorted
  // ---------------------------------------------------------------------------

  function handleSortChange(key: string) {
    if (sortState.key === key) {
      if (sortState.dir === null) sortState = { key, dir: 'asc' };
      else if (sortState.dir === 'asc') sortState = { key, dir: 'desc' };
      else sortState = { key: null, dir: null };
    } else {
      sortState = { key, dir: 'asc' };
    }
  }

  // ---------------------------------------------------------------------------
  // Selection helpers
  // ---------------------------------------------------------------------------

  const allSelected = $derived(
    selectedRows.length > 0 && selectedRows.length === effectiveData.length,
  );
  const someSelected = $derived(
    selectedRows.length > 0 && selectedRows.length < effectiveData.length,
  );

  function handleSelectAll(checked: boolean) {
    // Use _original refs from processedRows for consistent identity with TableBody comparisons
    selectedRows = checked ? processedRows.map((pr) => pr._original as Row) : [];
    onselect?.({ rows: selectedRows, allSelected: checked });
  }

  function handleRowToggle(row: Row, checked: boolean) {
    if (checked) {
      selectedRows = [...selectedRows, row];
    } else {
      selectedRows = selectedRows.filter((r) => r !== row);
    }
    onselect?.({ rows: selectedRows, allSelected: allSelected });
  }
</script>

<div class="tc-table-wrapper" role="region" aria-label={caption ?? 'Data table'}>
  {#if filterable}
    <div class="tc-toolbar">
      <SearchInput onfilter={(val) => { filterQuery = val; }} />
    </div>
  {/if}

  <div
    class="tc-table-scroll"
    class:tc-table-scroll--virtual={isVirtualizing}
    bind:this={scrollEl}
  >
    {#if isVirtualizing}
      <div style="height: {totalVirtualSize}px; position: relative;">
        <table
          class="tc-table"
          class:tc-table--bordered={bordered}
          class:tc-table--striped={striped}
          role="grid"
          aria-colcount={resolvedColumns.length + (selectable ? 1 : 0)}
          aria-rowcount={effectiveData.length}
          aria-busy={loading ? 'true' : 'false'}
          aria-label={caption}
        >
          {#if caption}
            <caption class="tc-caption">{caption}</caption>
          {/if}

          <TableHeader
            columns={resolvedColumns}
            {sortState}
            {selectable}
            {allSelected}
            {someSelected}
            {sortLoading}
            {columnVirtualItems}
            {totalColumnSize}
            {isColumnVirtualizing}
            onsortchange={handleSortChange}
            onselectall={handleSelectAll}
          />

          <TableBody
            {virtualItems}
            {sortedRows}
            columns={resolvedColumns}
            {loading}
            {skeletonRows}
            {selectable}
            {selectedRows}
            {emptyMessage}
            {striped}
            {bordered}
            {empty}
            {columnVirtualItems}
            {totalColumnSize}
            {isColumnVirtualizing}
            {onrowclick}
            {oncellclick}
            onrowtoggle={handleRowToggle}
          />
        </table>
      </div>
    {:else}
      <table
        class="tc-table"
        class:tc-table--bordered={bordered}
        class:tc-table--striped={striped}
        role="grid"
        aria-colcount={resolvedColumns.length + (selectable ? 1 : 0)}
        aria-rowcount={effectiveData.length}
        aria-busy={loading ? 'true' : 'false'}
        aria-label={caption}
      >
        {#if caption}
          <caption class="tc-caption">{caption}</caption>
        {/if}

        <TableHeader
          columns={resolvedColumns}
          {sortState}
          {selectable}
          {allSelected}
          {someSelected}
          {sortLoading}
          {columnVirtualItems}
          {totalColumnSize}
          {isColumnVirtualizing}
          onsortchange={handleSortChange}
          onselectall={handleSelectAll}
        />

        <TableBody
          {visibleRows}
          columns={resolvedColumns}
          {loading}
          {skeletonRows}
          {selectable}
          {selectedRows}
          {emptyMessage}
          {striped}
          {bordered}
          {empty}
          {columnVirtualItems}
          {totalColumnSize}
          {isColumnVirtualizing}
          {onrowclick}
          {oncellclick}
          onrowtoggle={handleRowToggle}
        />
      </table>
    {/if}
  </div>

  {#if !isVirtualizing}
    <TableFooter
      {currentPage}
      {totalPages}
      totalRows={filteredRows.length}
      onpagechange={(page) => { currentPage = page; }}
    />
  {/if}
</div>

<style>
  .tc-table-wrapper {
    font-family: var(--tc-font-family, -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', system-ui, sans-serif);
    font-size: var(--tc-font-size, 0.875rem);
    line-height: 1.5;
    color: var(--tc-color-text, #0f172a);
    background: var(--tc-color-bg, #ffffff);
    border: 1px solid var(--tc-border-color, #e2e8f0);
    border-radius: var(--tc-border-radius, 0.75rem);
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.07), 0 1px 2px -1px rgba(0, 0, 0, 0.07);
    overflow: hidden;
  }

  .tc-toolbar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0.625rem 1rem;
    border-bottom: 1px solid var(--tc-border-color, #e2e8f0);
    background: var(--tc-toolbar-bg, #f8fafc);
  }

  .tc-table-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .tc-table-scroll--virtual {
    height: var(--tc-virtual-height, min(600px, 70vh));
    overflow-y: auto;
  }

  .tc-table {
    width: 100%;
    border-collapse: collapse;
    min-width: max-content;
  }

  .tc-caption {
    text-align: left;
    font-weight: 700;
    font-size: 0.9375rem;
    padding: 0.875rem 1rem 0;
    caption-side: top;
    color: var(--tc-color-text, #0f172a);
    letter-spacing: -0.01em;
  }

  @media (prefers-color-scheme: dark) {
    .tc-table-wrapper {
      --tc-color-text: #f1f5f9;
      --tc-color-bg: #0f172a;
      --tc-border-color: #1e293b;
      --tc-toolbar-bg: #0f172a;
      --tc-header-bg: #0f172a;
      --tc-header-border: #1e293b;
      --tc-color-bg-hover: #1e293b;
      --tc-color-selected-bg: #172554;
      --tc-color-muted: #64748b;
      --tc-skeleton-from: #1e293b;
      --tc-skeleton-to: #334155;
    }
  }
</style>
