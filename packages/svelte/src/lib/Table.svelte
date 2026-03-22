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
  import type { Row, SortState, ProcessedGroupRow } from './types.js';
  import type { VirtualItem } from '@tanstack/svelte-virtual';
  import { createVirtualizer } from '@tanstack/svelte-virtual';
  import TableHeader from './TableHeader.svelte';
  import TableBody from './TableBody.svelte';
  import TableFooter from './TableFooter.svelte';
  import SearchInput from './SearchInput.svelte';
  import AggregateRow from './AggregateRow.svelte';

  type ColumnOverrideShort = Record<string, ColumnType>;

  const rowHeightMap = { compact: 32, comfortable: 48, spacious: 64 } as const;

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

    // Sort transition: row opacity fade on sort change (default true)
    sortTransition?: boolean;

    // Advanced features (Phase 6)
    density?: 'compact' | 'comfortable' | 'spacious';
    persistKey?: string;
    showAggregates?: boolean;
    showGroupAggregates?: boolean;
    groupBy?: string | null;

    // v1 backward compat (typed as unknown to avoid TS errors for existing consumers)
    colname?: unknown;
    rowdata?: unknown;

    // Bindable
    selectedRows?: Row[];
    hiddenColumns?: Set<string>;

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
    sortTransition = true,
    density = 'comfortable' as 'compact' | 'comfortable' | 'spacious',
    persistKey,
    showAggregates = false,
    showGroupAggregates = false,
    groupBy = null as string | null,
    colname,
    rowdata,
    selectedRows = $bindable([]),
    hiddenColumns = $bindable(new Set<string>()),
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

  // Phase 6 state
  let colWidths = $state(new Map<string, number>());
  let columnOrder = $state<string[]>([]);
  let collapsedGroups = $state(new Set<string>());

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

  // Initialize columnOrder from resolvedColumns on first inference completion
  $effect(() => {
    if (columnOrder.length === 0 && resolvedColumns.length > 0) {
      columnOrder = resolvedColumns.map((c) => c.key);
    }
  });

  // ---------------------------------------------------------------------------
  // Tokenized search query parser
  // Supports: `status:active salary:>80000 name:alice` plus free text
  // ---------------------------------------------------------------------------

  interface SearchToken {
    field: string;
    op: ':' | ':>' | ':<' | ':>=' | ':<=' | ':!=';
    value: string;
  }

  interface ParsedQuery {
    tokens: SearchToken[];
    freeText: string;
  }

  function parseSearchQuery(query: string): ParsedQuery {
    const tokens: SearchToken[] = [];
    const freeTextParts: string[] = [];

    // Match field:op:value patterns. Supports operators: :>=, :<=, :>, :<, :!=, :
    const tokenRegex = /(\w+)(:>=|:<=|:>|:<|:!=|:)("([^"]*)"|\S+)/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;
    const usedRanges: [number, number][] = [];

    while ((match = tokenRegex.exec(query)) !== null) {
      usedRanges.push([match.index, match.index + match[0].length]);
      tokens.push({
        field: match[1].toLowerCase(),
        op: match[2] as SearchToken['op'],
        value: match[4] ?? match[3], // use unquoted group if quoted, else raw value
      });
    }

    // Everything outside token ranges is free text
    let pos = 0;
    for (const [start, end] of usedRanges) {
      if (start > pos) freeTextParts.push(query.slice(pos, start));
      pos = end;
    }
    if (pos < query.length) freeTextParts.push(query.slice(pos));
    const freeText = freeTextParts.join(' ').trim();

    return { tokens, freeText };
  }

  function getCellText(cell: unknown): string {
    if (!cell || typeof cell !== 'object') return '';
    const c = cell as Record<string, unknown>;
    if ('value' in c) return String(c.value ?? '');
    if ('label' in c) return String(c.label ?? '');
    if ('formatted' in c) return String(c.formatted ?? '');
    return '';
  }

  function matchToken(row: ProcessedRow, token: SearchToken): boolean {
    // Find the column by field name (case-insensitive key match)
    const colKey = Object.keys(row.cells).find(
      (k) => k.toLowerCase() === token.field,
    );
    if (!colKey) return false;

    const rawValue = row._original[colKey];
    const cellText = getCellText(row.cells[colKey]).toLowerCase();
    const tokenVal = token.value.toLowerCase();

    if (token.op === ':') {
      // Case-insensitive prefix match
      return cellText.includes(tokenVal);
    }

    // Numeric operators
    const numericRaw = typeof rawValue === 'number' ? rawValue : parseFloat(String(rawValue ?? ''));
    const numericToken = parseFloat(tokenVal);
    if (!isNaN(numericRaw) && !isNaN(numericToken)) {
      if (token.op === ':>') return numericRaw > numericToken;
      if (token.op === ':<') return numericRaw < numericToken;
      if (token.op === ':>=') return numericRaw >= numericToken;
      if (token.op === ':<=') return numericRaw <= numericToken;
      if (token.op === ':!=') return numericRaw !== numericToken;
    }

    // String fallback for non-numeric operators
    if (token.op === ':!=') return !cellText.includes(tokenVal);
    return cellText.includes(tokenVal);
  }

  // ---------------------------------------------------------------------------
  // Derived pipeline: filter → sort → paginate → visibleRows
  // ---------------------------------------------------------------------------

  const filteredRows = $derived.by(() => {
    if (!filterQuery.trim()) return processedRows;

    const parsed = parseSearchQuery(filterQuery);

    return processedRows.filter((row) => {
      // All structured tokens must match
      for (const token of parsed.tokens) {
        if (!matchToken(row, token)) return false;
      }

      // Free text: match any column (existing behavior)
      if (parsed.freeText) {
        const q = parsed.freeText.toLowerCase();
        const freeTextMatch = Object.values(row.cells).some((cell) => {
          return getCellText(cell).toLowerCase().includes(q);
        });
        if (!freeTextMatch) return false;
      }

      return true;
    });
  });

  // Group rows by groupBy column — inserts group headers before sort
  const groupedRows = $derived.by((): (ProcessedRow | ProcessedGroupRow)[] => {
    if (!groupBy) return filteredRows;
    // Group into buckets
    const buckets = new Map<string, ProcessedRow[]>();
    for (const row of filteredRows) {
      const val = String(row._original[groupBy] ?? '');
      if (!buckets.has(val)) buckets.set(val, []);
      buckets.get(val)!.push(row);
    }
    // Build flat output: group header + (non-collapsed) data rows
    const result: (ProcessedRow | ProcessedGroupRow)[] = [];
    for (const [label, rows] of buckets) {
      const groupRow: ProcessedGroupRow = { isGroup: true, key: groupBy, label, count: rows.length, rows };
      result.push(groupRow);
      if (!collapsedGroups.has(label)) {
        result.push(...rows);
      }
    }
    return result;
  });

  const mainThreadSortedRows = $derived.by(() => {
    const rows = groupedRows; // was: filteredRows
    if (!sortState.key || !sortState.dir) return rows;
    const col = resolvedColumns.find((c) => c.key === sortState.key);
    if (!col) return rows;

    // When groupBy is active, sort within groups only (preserve group structure)
    if (groupBy) {
      const result: typeof rows = [];
      let i = 0;
      while (i < rows.length) {
        const item = rows[i];
        if ('isGroup' in item && item.isGroup) {
          result.push(item); // keep group header
          // Collect following data rows for this group
          const groupDataRows: ProcessedRow[] = [];
          i++;
          while (i < rows.length && !('isGroup' in rows[i] && (rows[i] as ProcessedGroupRow).isGroup)) {
            groupDataRows.push(rows[i] as ProcessedRow);
            i++;
          }
          // Sort this group's rows
          groupDataRows.sort((a, b) => {
            const av = a._original[sortState.key!];
            const bv = b._original[sortState.key!];
            const dir = sortState.dir === 'asc' ? 1 : -1;
            if (av == null) return dir;
            if (bv == null) return -dir;
            if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
            return String(av).localeCompare(String(bv)) * dir;
          });
          result.push(...groupDataRows);
        } else {
          result.push(item);
          i++;
        }
      }
      return result;
    }

    // Normal (non-grouped) sort — same as before but using groupedRows (= filteredRows when no groupBy)
    return [...(rows as ProcessedRow[])].sort((a, b) => {
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
  // When groupBy is active, always use mainThreadSortedRows (Worker receives flat arrays, not mixed group structure)
  const sortedRows = $derived(
    !groupBy && workerSortedRows.length > 0 && sortState.key !== null
      ? (workerSortedRows as (ProcessedRow | ProcessedGroupRow)[])
      : mainThreadSortedRows,
  );

  // isVirtualizing: true when row count exceeds threshold
  const isVirtualizing = $derived(sortedRows.length > virtualizeAt);

  // Column visibility: filter out hidden columns
  // Consumer responsibility: a column with hideable===false should not be added to hiddenColumns.
  // The library does not ship a toggle UI — visibility is a data-pipeline filter only.
  const visibleColumns = $derived(
    resolvedColumns.filter((c) => !hiddenColumns.has(c.key))
  );

  // Apply column order: sort visibleColumns by their position in columnOrder array
  const orderedColumns = $derived.by(() => {
    if (columnOrder.length === 0) return visibleColumns;
    return [...visibleColumns].sort((a, b) => {
      const ai = columnOrder.indexOf(a.key);
      const bi = columnOrder.indexOf(b.key);
      // Columns not in columnOrder go to the end
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  });

  // isColumnVirtualizing: true when visible column count exceeds threshold
  const isColumnVirtualizing = $derived(visibleColumns.length > COL_VIRTUALIZE_THRESHOLD);

  const totalPages = $derived(Math.max(1, Math.ceil(filteredRows.length / pageSize)));
  const visibleRows = $derived<(ProcessedRow | ProcessedGroupRow)[]>(
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
      count: visibleColumns.length,
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

    // Only use Worker for large datasets when sort is active and no grouping
    // Worker receives flat _original arrays, not the mixed group structure
    if (!key || !dir || rows.length <= USE_WORKER_THRESHOLD || !sortWorker || groupBy) {
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
  // persistKey: load state from localStorage on mount (SSR + version guarded)
  // ---------------------------------------------------------------------------

  $effect(() => {
    if (!persistKey || typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(persistKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as Record<string, unknown>;
      if (saved.v !== 1) return; // version mismatch — ignore
      if (saved.sortState && typeof saved.sortState === 'object') {
        const ss = saved.sortState as { key: string | null; dir: 'asc' | 'desc' | null };
        sortState = { key: ss.key ?? null, dir: ss.dir ?? null };
      }
      if (typeof saved.filterQuery === 'string') filterQuery = saved.filterQuery;
      if (typeof saved.currentPage === 'number') currentPage = saved.currentPage;
      if (saved.colWidths && typeof saved.colWidths === 'object') {
        colWidths = new Map(Object.entries(saved.colWidths as Record<string, number>));
      }
      if (Array.isArray(saved.columnOrder)) columnOrder = saved.columnOrder as string[];
      if (Array.isArray(saved.hiddenColumns)) hiddenColumns = new Set(saved.hiddenColumns as string[]);
    } catch { /* invalid JSON — ignore */ }
  });

  // ---------------------------------------------------------------------------
  // persistKey: save state to localStorage (debounced 300ms) on any state change
  // ---------------------------------------------------------------------------

  $effect(() => {
    if (!persistKey || typeof localStorage === 'undefined') return;
    // Read all state that should be persisted (tracking dependencies)
    const snapshot = {
      v: 1,
      sortState: { key: sortState.key, dir: sortState.dir },
      filterQuery,
      currentPage,
      colWidths: Object.fromEntries(colWidths),
      columnOrder: [...columnOrder],
      hiddenColumns: Array.from(hiddenColumns),
    };
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(persistKey!, JSON.stringify(snapshot));
      } catch { /* quota exceeded or SSR — ignore */ }
    }, 300);
    return () => clearTimeout(timer);
  });

  // ---------------------------------------------------------------------------
  // Sort handler: unsorted → asc → desc → unsorted
  // Uses View Transitions API (Chrome 111+, Safari 18+) for smooth reorder animation.
  // Falls back to instant update when API is unavailable.
  // ---------------------------------------------------------------------------

  let sortTransitioning = $state(false);

  function applySort(key: string) {
    if (sortState.key === key) {
      if (sortState.dir === null) sortState = { key, dir: 'asc' };
      else if (sortState.dir === 'asc') sortState = { key, dir: 'desc' };
      else sortState = { key: null, dir: null };
    } else {
      sortState = { key, dir: 'asc' };
    }
  }

  async function handleSortChange(key: string) {
    if (sortTransition && typeof document !== 'undefined' && 'startViewTransition' in document) {
      sortTransitioning = true;
      try {
        // @ts-expect-error — startViewTransition is newer than TS lib types
        const transition = document.startViewTransition(() => {
          applySort(key);
        });
        await transition.ready;
      } finally {
        sortTransitioning = false;
      }
    } else {
      applySort(key);
    }
  }

  function handleGroupToggle(label: string) {
    const next = new Set(collapsedGroups);
    if (next.has(label)) next.delete(label);
    else next.add(label);
    collapsedGroups = next;
  }

  function handleColResize(key: string, width: number) {
    colWidths = new Map(colWidths).set(key, width);
  }

  function handleColReorder(fromKey: string, toKey: string) {
    if (fromKey === toKey) return;
    const newOrder = [...columnOrder];
    const fromIdx = newOrder.indexOf(fromKey);
    const toIdx = newOrder.indexOf(toKey);
    if (fromIdx === -1 || toIdx === -1) return;
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, fromKey);
    columnOrder = newOrder;
  }

  const hasCustomWidths = $derived(colWidths.size > 0);

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
      <SearchInput
        placeholder="Search..."
        onfilter={(val) => { filterQuery = val; }}
      />
    </div>
  {/if}

  <div
    class="tc-table-scroll"
    class:tc-table-scroll--virtual={isVirtualizing}
    bind:this={scrollEl}
    style="--tc-row-height: {rowHeightMap[density]}px"
  >
    {#if isVirtualizing}
      <div style="height: {totalVirtualSize}px; position: relative;">
        <table
          class="tc-table"
          class:tc-table--bordered={bordered}
          class:tc-table--striped={striped}
          class:tc-table--fixed-layout={hasCustomWidths}
          role="grid"
          aria-colcount={visibleColumns.length + (selectable ? 1 : 0)}
          aria-rowcount={effectiveData.length}
          aria-busy={loading ? 'true' : 'false'}
          aria-label={caption}
        >
          {#if caption}
            <caption class="tc-caption">{caption}</caption>
          {/if}

          <TableHeader
            columns={orderedColumns}
            {sortState}
            {selectable}
            {allSelected}
            {someSelected}
            {sortLoading}
            {columnVirtualItems}
            {totalColumnSize}
            {isColumnVirtualizing}
            {colWidths}
            {columnOrder}
            oncolresize={handleColResize}
            oncolreorder={handleColReorder}
            onsortchange={handleSortChange}
            onselectall={handleSelectAll}
          />

          <TableBody
            {virtualItems}
            {sortedRows}
            columns={orderedColumns}
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
            {colWidths}
            {collapsedGroups}
            ongroupToggle={handleGroupToggle}
            {onrowclick}
            {oncellclick}
            onrowtoggle={handleRowToggle}
          />

          {#if showAggregates}
            <AggregateRow
              columns={orderedColumns}
              rows={filteredRows}
              {selectable}
            />
          {/if}
        </table>
      </div>
    {:else}
      <table
        class="tc-table"
        class:tc-table--bordered={bordered}
        class:tc-table--striped={striped}
        class:tc-table--fixed-layout={hasCustomWidths}
        role="grid"
        aria-colcount={visibleColumns.length + (selectable ? 1 : 0)}
        aria-rowcount={effectiveData.length}
        aria-busy={loading ? 'true' : 'false'}
        aria-label={caption}
      >
        {#if caption}
          <caption class="tc-caption">{caption}</caption>
        {/if}

        <TableHeader
          columns={orderedColumns}
          {sortState}
          {selectable}
          {allSelected}
          {someSelected}
          {sortLoading}
          {columnVirtualItems}
          {totalColumnSize}
          {isColumnVirtualizing}
          {colWidths}
          {columnOrder}
          oncolresize={handleColResize}
          oncolreorder={handleColReorder}
          onsortchange={handleSortChange}
          onselectall={handleSelectAll}
        />

        <TableBody
          {visibleRows}
          columns={orderedColumns}
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
          {colWidths}
          {collapsedGroups}
          ongroupToggle={handleGroupToggle}
          {onrowclick}
          {oncellclick}
          onrowtoggle={handleRowToggle}
        />

        {#if showAggregates}
          <AggregateRow
            columns={orderedColumns}
            rows={filteredRows}
            {selectable}
          />
        {/if}
      </table>
    {/if}
  </div>

  {#if !isVirtualizing}
    <TableFooter
      {currentPage}
      {totalPages}
      totalRows={filteredRows.length}
      totalAllRows={processedRows.length}
      {filterQuery}
      onpagechange={(page) => { currentPage = page; }}
    />
  {/if}
</div>

<style>
  .tc-table-wrapper {
    font-family: var(--tc-font-family, -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', system-ui, sans-serif);
    font-size: var(--tc-font-size, 13px);
    line-height: var(--tc-line-height, 1.5);
    color: var(--tc-color-text, #0a0a0a);
    background: var(--tc-color-bg, #ffffff);
    border: var(--tc-border-width, 1px) solid var(--tc-color-border, #f0f0f0);
    border-radius: var(--tc-border-radius, 12px);
    box-shadow: var(--tc-shadow-wrapper, 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02));
    overflow: hidden;
  }

  .tc-toolbar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: var(--tc-toolbar-padding, 8px 12px);
    border-bottom: var(--tc-border-width, 1px) solid var(--tc-color-border, #f0f0f0);
    background: var(--tc-color-bg-toolbar, #fafafa);
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

  .tc-table--fixed-layout {
    table-layout: fixed;
  }

  .tc-caption {
    text-align: left;
    font-weight: var(--tc-font-weight-semibold, 600);
    font-size: 0.9375rem;
    padding: 12px 16px 0;
    caption-side: top;
    color: var(--tc-color-text, #0a0a0a);
    letter-spacing: -0.01em;
  }

  /*
   * View Transitions for sort/filter — browser captures before/after
   * screenshots and cross-fades them. Zero JS animation code needed.
   * Each row gets view-transition-name: row-{index} in TableBody.
   */
  :global(::view-transition-old(root)),
  :global(::view-transition-new(root)) {
    animation-duration: 0.18s;
    animation-timing-function: ease;
  }
</style>
