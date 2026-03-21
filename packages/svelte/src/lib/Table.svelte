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

  const sortedRows = $derived.by(() => {
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

  const totalPages = $derived(Math.max(1, Math.ceil(filteredRows.length / pageSize)));
  const visibleRows = $derived(
    sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
  );

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
    <SearchInput onfilter={(val) => { filterQuery = val; }} />
  {/if}

  <div class="tc-table-scroll">
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
        {onrowclick}
        {oncellclick}
        onrowtoggle={handleRowToggle}
      />
    </table>
  </div>

  <TableFooter
    {currentPage}
    {totalPages}
    totalRows={filteredRows.length}
    onpagechange={(page) => { currentPage = page; }}
  />
</div>

<style>
  .tc-table-wrapper {
    font-family: var(--tc-font-family, inherit);
    font-size: var(--tc-font-size, 0.875rem);
    color: var(--tc-color-text, #111827);
    border: 1px solid var(--tc-border-color, #e5e7eb);
    border-radius: var(--tc-border-radius, 0.5rem);
    overflow: hidden;
  }

  .tc-table-scroll {
    overflow-x: auto;
  }

  .tc-table {
    width: 100%;
    border-collapse: collapse;
    min-width: max-content;
  }

  .tc-caption {
    text-align: left;
    font-weight: 600;
    padding: var(--tc-spacing-3, 0.75rem) var(--tc-spacing-4, 1rem);
    caption-side: top;
    color: var(--tc-header-color, #374151);
  }

  @media (prefers-color-scheme: dark) {
    .tc-table-wrapper {
      --tc-color-text: #f9fafb;
      --tc-border-color: #374151;
      --tc-header-bg: #1f2937;
      --tc-color-bg-hover: #374151;
    }
  }
</style>
