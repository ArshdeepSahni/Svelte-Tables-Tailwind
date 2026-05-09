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

  import { untrack } from 'svelte';
  import type { Snippet } from 'svelte';
  import type {
    ColumnDefinition,
    ColumnType,
    ResolvedColumn,
    ProcessedRow,
  } from '@tablecraft/core';
  import { createTableEngine, adaptV1Props } from '@tablecraft/core';
  import { parseNaturalLanguage, applyNLFilter, generateColumnSummary } from './nl-filter.js';
  import type { NLFilterSpec, ColumnMeta, ColumnSummary } from './nl-filter.js';
  import { connectStream } from './stream.svelte.js';
  import type { StreamSource, StreamState, StreamStatus } from './stream.svelte.js';
  import type { Row, SortState, ProcessedGroupRow } from './types.js';
  import type { VirtualItem } from '@tanstack/svelte-virtual';
  import { createVirtualizer } from '@tanstack/svelte-virtual';
  import TableHeader from './TableHeader.svelte';
  import TableBody from './TableBody.svelte';
  import TableFooter from './TableFooter.svelte';
  import SearchInput from './SearchInput.svelte';
  import AggregateRow from './AggregateRow.svelte';
  import ColumnMenu from './ColumnMenu.svelte';
  import BulkActionsBar from './BulkActionsBar.svelte';
  import ExportButton from './ExportButton.svelte';
  import CellEditor from './CellEditor.svelte';
  import CommandPalette from './CommandPalette.svelte';
  import ViewSwitcher from './ViewSwitcher.svelte';
  import KanbanView from './KanbanView.svelte';
  import GalleryView from './GalleryView.svelte';
  import ListView from './ListView.svelte';
  import TimelineView from './TimelineView.svelte';
  import { createHistoryManager, bindHistoryShortcuts } from './history.svelte.js';
  import { evaluateConditionalFormats } from './conditional-format.js';
  import type { ConditionalFormatRule, ConditionalFormatPreset, FormatStyle } from './conditional-format.js';

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

    // Real-time streaming (Phase 9)
    stream?: StreamSource;

    // Advanced features (Phase 6)
    density?: 'compact' | 'comfortable' | 'spacious';
    persistKey?: string;
    showAggregates?: boolean;
    showGroupAggregates?: boolean;
    groupBy?: string | null;

    // Editing (Phase 12)
    editable?: boolean;
    exportable?: boolean;

    // Conditional formatting (Phase 12)
    conditionalFormats?: ConditionalFormatRule[];
    formatPresets?: ConditionalFormatPreset[];

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
    oncelledit?: (event: { row: Row; column: ResolvedColumn; key: string; oldValue: unknown; newValue: unknown }) => void;

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
    editable = false,
    exportable = false,
    conditionalFormats = [],
    formatPresets = [],
    stream,
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
    oncelledit,
    empty,
  }: Props = $props();

  // View mode for switching between table, kanban, gallery, list, and timeline views
  let viewMode = $state<'table' | 'kanban' | 'gallery' | 'list' | 'timeline'>('table');

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

  // Phase 12: Command palette
  let commandPaletteVisible = $state(false);

  // Phase 12: Inline editing state
  let editingCell = $state<{ rowIndex: number; colKey: string } | null>(null);

  // Phase 12: History manager (undo/redo)
  const history = createHistoryManager(50);

  // Edit version counter — bump to force re-derivation after cell edits
  let editVersion = $state(0);

  // Phase 9: Stream state
  let streamState = $state<StreamState | null>(null);

  $effect(() => {
    // Track only the `stream` prop as a dependency
    const src = stream;
    if (src) {
      // Use untrack to avoid reading streamState as a dependency
      untrack(() => {
        streamState?.disconnect();
        streamState = connectStream(src, data);
      });
    } else {
      untrack(() => {
        streamState?.disconnect();
        streamState = null;
      });
    }
    return () => {
      untrack(() => {
        streamState?.disconnect();
      });
    };
  });

  // Merge stream rows into effective data
  const streamAwareData = $derived<Row[]>(
    streamState && streamState.status !== 'idle' && streamState.status !== 'closed'
      ? streamState.rows
      : (Array.isArray(effectiveData) ? effectiveData : []),
  );

  // ---------------------------------------------------------------------------
  // Column/row inference — pure $derived.by(), no $effect cascade
  // ---------------------------------------------------------------------------

  function applyLabelOverrides(cols: ResolvedColumn[]): ResolvedColumn[] {
    if (!Array.isArray(effectiveColumns) || effectiveColumns.length === 0) return cols;
    const overrideMap = new Map<string, string>();
    for (const colDef of effectiveColumns as ColumnDefinition<Row>[]) {
      if (colDef.label) overrideMap.set(colDef.key, colDef.label);
    }
    if (overrideMap.size === 0) return cols;
    return cols.map((col) =>
      overrideMap.has(col.key) ? { ...col, label: overrideMap.get(col.key)! } : col,
    );
  }

  const inferredState = $derived.by(() => {
    const rawData: Row[] = streamAwareData;
    // Read editVersion to force re-derivation when a cell is edited in place
    void editVersion;
    const engine = createTableEngine({
      data: rawData,
      columns: effectiveColumns,
    });
    // Full inference in a single pass — no async two-phase to avoid effect cascades
    const schema = engine.inferSchema(rawData);
    const typedCols = engine.resolveColumns(rawData, effectiveColumns ?? undefined, schema);
    const finalCols = applyLabelOverrides(typedCols);
    const rows = engine.processRows(rawData, typedCols);
    return { columns: finalCols, rows };
  });

  // Sync inferredState into $state — single effect, no cascade since inferredState is $derived
  $effect(() => {
    const { columns: cols, rows } = inferredState;
    untrack(() => {
      resolvedColumns = cols;
      processedRows = rows;
    });
  });

  // Initialize columnOrder from resolvedColumns on first inference completion
  $effect(() => {
    if (resolvedColumns.length > 0) {
      untrack(() => {
        if (columnOrder.length === 0) {
          columnOrder = resolvedColumns.map((c) => c.key);
        }
      });
    }
  });

  // ---------------------------------------------------------------------------
  // Simple freetext search — matches any cell value across all columns
  // ---------------------------------------------------------------------------

  function getCellSearchText(cell: unknown): string {
    if (!cell || typeof cell !== 'object') return '';
    const c = cell as Record<string, unknown>;
    if ('value' in c) return String(c.value ?? '');
    if ('label' in c) return String(c.label ?? '');
    if ('formatted' in c) return String(c.formatted ?? '');
    if ('src' in c) return String((c as Record<string, unknown>).alt ?? '');
    return '';
  }

  // ---------------------------------------------------------------------------
  // Phase 8: Natural Language filter parsing
  // ---------------------------------------------------------------------------

  // Build column metadata for the NL parser from resolved columns
  const columnMeta = $derived<ColumnMeta[]>(
    resolvedColumns.map(c => ({ key: c.key, type: c.type })),
  );

  // Parse the filter query using the NL parser
  const nlFilterSpec = $derived<NLFilterSpec>(
    parseNaturalLanguage(filterQuery, columnMeta),
  );

  // Column summaries (generated once on data load, memoized)
  const columnSummaries = $derived.by(() => {
    if (streamAwareData.length > 0 && resolvedColumns.length > 0) {
      return resolvedColumns.map(col => {
        const values = streamAwareData.map(r => r[col.key]);
        return generateColumnSummary(col.key, col.type, values);
      });
    }
    return [];
  });

  // ---------------------------------------------------------------------------
  // Derived pipeline: filter → sort → paginate → visibleRows
  // ---------------------------------------------------------------------------

  const filteredRows = $derived.by(() => {
    if (!filterQuery.trim()) return processedRows;

    // If NL parser extracted structured conditions, use them
    if (nlFilterSpec.parsed) {
      const originals = processedRows.map(r => r._original);
      const filtered = applyNLFilter(originals, nlFilterSpec);
      const filteredSet = new Set(filtered);
      return processedRows.filter(r => filteredSet.has(r._original));
    }

    // Fallback: simple text search across all cells
    const q = filterQuery.toLowerCase().trim();
    return processedRows.filter((row) =>
      Object.values(row.cells).some((cell) =>
        getCellSearchText(cell).toLowerCase().includes(q),
      ),
    );
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
      untrack(() => {
        if (virtualItems.length > 0) virtualItems = [];
        if (totalVirtualSize !== 0) totalVirtualSize = 0;
      });
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
      untrack(() => {
        if (columnVirtualItems.length > 0) columnVirtualItems = [];
        if (totalColumnSize !== 0) totalColumnSize = 0;
      });
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
        untrack(() => {
          if (workerSortedRows.length > 0) workerSortedRows = [];
          if (sortLoading !== false) sortLoading = false;
        });
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
    untrack(() => {
      if (currentPage !== 1) currentPage = 1;
    });
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

  // ---------------------------------------------------------------------------
  // Column Menu state (Phase 12)
  // ---------------------------------------------------------------------------

  let columnMenuVisible = $state(false);
  let columnMenuPosition = $state({ x: 0, y: 0 });
  let columnMenuColumn = $state<ResolvedColumn | null>(null);

  function handleColumnMenu(col: ResolvedColumn, x: number, y: number) {
    columnMenuColumn = col;
    columnMenuPosition = { x, y };
    columnMenuVisible = true;
  }

  function handleColumnMenuClose() {
    columnMenuVisible = false;
    columnMenuColumn = null;
  }

  function handleColumnMenuSort(key: string, dir: 'asc' | 'desc') {
    sortState = { key, dir };
    handleColumnMenuClose();
  }

  function handleColumnMenuHide(key: string) {
    hiddenColumns = new Set([...hiddenColumns, key]);
    handleColumnMenuClose();
  }

  function handleColumnMenuFreeze(key: string, side: 'left' | 'right' | null) {
    // Update the column's pinned state by modifying resolvedColumns
    resolvedColumns = resolvedColumns.map(c =>
      c.key === key ? { ...c, pinned: side ?? undefined } : c,
    );
    handleColumnMenuClose();
  }

  function handleColumnMenuGroupBy(key: string) {
    // groupBy is a prop, but we can toggle it internally for column menu
    // This creates a local override — the parent can still control via prop
    groupBy = groupBy === key ? null : key;
    handleColumnMenuClose();
  }

  function handleColumnTrimWhitespace(key: string) {
    for (const row of effectiveData) {
      if (typeof row[key] === 'string') {
        row[key] = (row[key] as string).trim();
      }
    }
    // Trigger re-inference to update derived state
    processedRows = [...processedRows];
  }

  function handleColumnCase(key: string, casing: 'upper' | 'lower' | 'title') {
    for (const row of effectiveData) {
      if (typeof row[key] === 'string') {
        const val = row[key] as string;
        row[key] =
          casing === 'upper'
            ? val.toUpperCase()
            : casing === 'lower'
              ? val.toLowerCase()
              : val.replace(/\b\w/g, c => c.toUpperCase());
      }
    }
    processedRows = [...processedRows];
  }

  function handleColumnStats(key: string) {
    // Show a subtle notification or log (actual display would be in ColumnMenu)
    console.log(`Stats for column ${key}`);
  }

  function handleQuickFilter(key: string, value: unknown) {
    // Apply quick filter based on type
    if (typeof value === 'string') {
      // Date/time quick filters: today, week, month, overdue
      filterQuery = `${key}:${value}`;
    } else if (typeof value === 'boolean') {
      // Boolean filter
      filterQuery = `${key}:${value}`;
    } else if (typeof value === 'number') {
      // Rating/progress filters
      filterQuery = `${key}:${value}`;
    }
    handleColumnMenuClose();
  }

  function handleColumnDuplicate(key: string) {
    // Create a new column identical to the specified one
    const colToDuplicate = resolvedColumns.find(c => c.key === key);
    if (!colToDuplicate) return;

    // Generate a new key
    let newKey = `${key}_copy`;
    let counter = 1;
    while (resolvedColumns.some(c => c.key === newKey)) {
      newKey = `${key}_copy_${counter}`;
      counter++;
    }

    // Copy data from source column to new column
    for (const row of effectiveData) {
      row[newKey] = row[key];
    }

    // Add new column to the column order
    columnOrder = [...columnOrder, newKey];
    processedRows = [...processedRows];
    handleColumnMenuClose();
  }

  // Calculate stats for numeric columns
  function calculateColumnStats(key: string): { min: number; max: number; avg: number; sum: number; count: number } | undefined {
    const col = resolvedColumns.find(c => c.key === key);
    if (!col || (col.type !== 'number' && col.type !== 'currency' && col.type !== 'percentage')) {
      return undefined;
    }

    const numbers: number[] = [];
    for (const row of effectiveData) {
      const val = row[key];
      if (typeof val === 'number' && !isNaN(val)) {
        numbers.push(val);
      }
    }

    if (numbers.length === 0) {
      return undefined;
    }

    const sum = numbers.reduce((a, b) => a + b, 0);
    const avg = sum / numbers.length;
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);

    return { min, max, avg, sum, count: numbers.length };
  }

  // ---------------------------------------------------------------------------
  // Export helpers (Phase 12)
  // ---------------------------------------------------------------------------

  function handleExport(format: 'csv' | 'json' | 'clipboard') {
    const exportData = (selectedRows.length > 0 ? selectedRows : effectiveData) as Record<string, unknown>[];
    const cols = orderedColumns.map(c => ({ key: c.key, label: c.label }));

    if (format === 'csv') {
      const header = cols.map(c => `"${c.label}"`).join(',');
      const rows = exportData.map(row =>
        cols.map(c => {
          const val = row[c.key];
          const str = val == null ? '' : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        }).join(',')
      );
      const csv = [header, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${caption ?? 'export'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'json') {
      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${caption ?? 'export'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'clipboard') {
      const header = cols.map(c => c.label).join('\t');
      const rows = exportData.map(row =>
        cols.map(c => String(row[c.key] ?? '')).join('\t')
      );
      const tsv = [header, ...rows].join('\n');
      navigator.clipboard.writeText(tsv);
    }
  }

  function handleBulkDelete() {
    // Remove selected rows from data — fire oncelledit for each
    // Consumer should handle actual deletion via oncelledit callback
    const toDelete = new Set(selectedRows);
    selectedRows = [];
    onselect?.({ rows: [], allSelected: false });
  }

  // ---------------------------------------------------------------------------
  // Phase 12: Command Palette keyboard shortcut
  // ---------------------------------------------------------------------------

  function handleGlobalKeyDown(e: KeyboardEvent) {
    const isMac = typeof navigator !== 'undefined' && navigator.platform?.toUpperCase().indexOf('MAC') >= 0;
    const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

    // Cmd+K → open command palette
    if (isCtrlOrCmd && e.key === 'k') {
      e.preventDefault();
      commandPaletteVisible = !commandPaletteVisible;
      return;
    }

    // Cmd+Z → undo
    if (isCtrlOrCmd && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      history.undo();
      return;
    }

    // Cmd+Shift+Z → redo
    if (isCtrlOrCmd && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      history.redo();
      return;
    }
  }

  // ---------------------------------------------------------------------------
  // Phase 12: Inline editing
  // ---------------------------------------------------------------------------

  function handleCellDoubleClick(row: Row, column: ResolvedColumn, rowIndex: number) {
    if (!editable) return;
    editingCell = { rowIndex, colKey: column.key };
  }

  function handleCellEditConfirm(row: Row, column: ResolvedColumn, newValue: unknown) {
    const oldValue = row[column.key];
    if (oldValue === newValue) {
      editingCell = null;
      return;
    }

    // Record in history
    history.push({
      type: 'cell-edit',
      description: `Changed '${String(oldValue ?? '')}' to '${String(newValue ?? '')}' in ${column.label}`,
      undo: () => {
        row[column.key] = oldValue;
        // Patch processedRows cell in-place for immediate UI update
        patchProcessedCell(row, column.key, oldValue);
      },
      redo: () => {
        row[column.key] = newValue;
        patchProcessedCell(row, column.key, newValue);
      },
    });

    // Apply the edit — mutates the original data object in place
    row[column.key] = newValue;

    // Patch the processedRow cell immediately so the UI updates synchronously
    // (The $effect that syncs inferredState → processedRows runs AFTER DOM update,
    // which is too late — Cell.svelte would read the OLD descriptor)
    patchProcessedCell(row, column.key, newValue);

    editingCell = null;
    oncelledit?.({ row, column, key: column.key, oldValue, newValue });
  }

  /** Patch a single cell value in processedRows and force reactivity via new array ref */
  function patchProcessedCell(row: Row, key: string, value: unknown) {
    const pr = processedRows.find((r) => r._original === row);
    if (pr && pr.cells[key]) {
      pr.cells[key] = { ...pr.cells[key], value: String(value ?? '') };
    }
    // Force Svelte $state reactivity by creating a new array reference
    processedRows = [...processedRows];
  }

  function handleCellEditCancel() {
    editingCell = null;
  }

  // ---------------------------------------------------------------------------
  // Phase 12: Conditional formatting evaluation
  // ---------------------------------------------------------------------------

  // Pre-compute column value arrays for conditional formatting
  const columnValues = $derived.by(() => {
    if (conditionalFormats.length === 0 && formatPresets.length === 0) return new Map<string, unknown[]>();
    const map = new Map<string, unknown[]>();
    for (const col of resolvedColumns) {
      map.set(col.key, streamAwareData.map(r => r[col.key]));
    }
    return map;
  });

  function getCellFormatStyle(row: Row, colKey: string): FormatStyle | null {
    if (conditionalFormats.length === 0 && formatPresets.length === 0) return null;
    const allValues = columnValues.get(colKey) ?? [];
    return evaluateConditionalFormats(conditionalFormats, formatPresets, row, colKey, allValues);
  }

  function handleClearSort() {
    sortState = { key: null, dir: null };
  }
</script>

<svelte:window onkeydown={handleGlobalKeyDown} />
<div class="tc-table-wrapper" role="region" aria-label={caption ?? 'Data table'}>
  {#if filterable}
    <div class="tc-toolbar">
      <ViewSwitcher
        mode={viewMode}
        onchange={(m) => { viewMode = m; }}
      />
      <SearchInput
        placeholder="Search... try 'active users' or 'salary above 100k'"
        onfilter={(val) => { filterQuery = val; }}
      />
      {#if exportable}
        <ExportButton
          data={selectedRows.length > 0 ? selectedRows : effectiveData}
          columns={orderedColumns.map(c => ({ key: c.key, label: c.label }))}
          filename={caption ?? 'export'}
        />
      {/if}
      {#if nlFilterSpec.parsed && nlFilterSpec.interpretation}
        <div class="tc-nl-hint">
          <span class="tc-nl-hint-icon">&#9889;</span>
          <span class="tc-nl-hint-text">Interpreted as: {nlFilterSpec.interpretation}</span>
        </div>
      {/if}
      {#if streamState && streamState.status !== 'idle'}
        <div class="tc-stream-indicator" class:tc-stream-live={streamState.status === 'connected'} class:tc-stream-error={streamState.status === 'error'}>
          <span class="tc-stream-dot"></span>
          <span class="tc-stream-label">
            {#if streamState.status === 'connecting'}Connecting...
            {:else if streamState.status === 'connected'}Live
            {:else if streamState.status === 'error'}Error
            {:else if streamState.status === 'closed'}Disconnected
            {/if}
          </span>
          {#if streamState.status === 'connected' && streamState.throughput > 0}
            <span class="tc-stream-throughput">{streamState.throughput}/s</span>
          {/if}
          {#if streamState.status === 'connected'}
            <span class="tc-stream-count">{streamState.messageCount} msgs</span>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  {#if columnMenuVisible && columnMenuColumn}
    <ColumnMenu
      column={columnMenuColumn}
      position={columnMenuPosition}
      visible={columnMenuVisible}
      {sortState}
      frozenColumns={new Set(
        resolvedColumns.filter(c => c.pinned).map(c => c.key)
      )}
      groupedBy={groupBy}
      visibleColumnCount={resolvedColumns.length - hiddenColumns.size}
      columnStats={calculateColumnStats(columnMenuColumn.key)}
      onsort={handleColumnMenuSort}
      onclearsort={() => {
        sortState = { key: null, dir: null };
        handleColumnMenuClose();
      }}
      onhide={handleColumnMenuHide}
      onfreeze={handleColumnMenuFreeze}
      ongroupby={handleColumnMenuGroupBy}
      onfilter={handleQuickFilter}
      ontrimwhitespace={handleColumnTrimWhitespace}
      oncasechange={handleColumnCase}
      onstats={handleColumnStats}
      onquickfilter={handleQuickFilter}
      onduplicate={handleColumnDuplicate}
      onclose={handleColumnMenuClose}
    />
  {/if}

  {#if viewMode === 'table'}
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
            oncolumnmenu={handleColumnMenu}
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
            {editable}
            {editingCell}
            oncelldblclick={(e) => handleCellDoubleClick(e.row, e.column, e.rowIndex)}
            oncelleditconfirm={(e) => handleCellEditConfirm(e.row, e.column, e.newValue)}
            oncelleditcancel={handleCellEditCancel}
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
          oncolumnmenu={handleColumnMenu}
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
          {editable}
          {editingCell}
          oncelldblclick={(e) => handleCellDoubleClick(e.row, e.column, e.rowIndex)}
          oncelleditconfirm={(e) => handleCellEditConfirm(e.row, e.column, e.newValue)}
          oncelleditcancel={handleCellEditCancel}
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
  {:else if viewMode === 'kanban'}
    <KanbanView data={effectiveData} columns={orderedColumns} oncelledit={oncelledit} />
  {:else if viewMode === 'gallery'}
    <GalleryView data={effectiveData} columns={orderedColumns} oncelledit={oncelledit} />
  {:else if viewMode === 'list'}
    <ListView data={effectiveData} columns={orderedColumns} oncelledit={oncelledit} />
  {:else if viewMode === 'timeline'}
    <TimelineView data={effectiveData} columns={orderedColumns} oncelledit={oncelledit} />
  {/if}

  {#if !isVirtualizing && viewMode === 'table'}
    <TableFooter
      {currentPage}
      {totalPages}
      totalRows={filteredRows.length}
      totalAllRows={processedRows.length}
      {filterQuery}
      onpagechange={(page) => { currentPage = page; }}
    />
  {/if}

  {#if selectable && selectedRows.length > 0}
    <BulkActionsBar
      selectedCount={selectedRows.length}
      totalCount={effectiveData.length}
      ondelete={handleBulkDelete}
      onexport={handleExport}
      onclearselection={() => { selectedRows = []; onselect?.({ rows: [], allSelected: false }); }}
    />
  {/if}

  {#if commandPaletteVisible}
    <CommandPalette
      visible={commandPaletteVisible}
      columns={orderedColumns}
      onclose={() => { commandPaletteVisible = false; }}
      onsort={(key, dir) => { sortState = { key, dir }; commandPaletteVisible = false; }}
      onfilter={(q) => { filterQuery = q; commandPaletteVisible = false; }}
      ongroupby={(key) => { groupBy = key; commandPaletteVisible = false; }}
      ondensity={(d) => { density = d; commandPaletteVisible = false; }}
      onexport={(fmt) => { handleExport(fmt); commandPaletteVisible = false; }}
      onhidecolumn={(key) => { hiddenColumns = new Set([...hiddenColumns, key]); commandPaletteVisible = false; }}
      onshowallcolumns={() => { hiddenColumns = new Set(); commandPaletteVisible = false; }}
      onselectall={() => { handleSelectAll(true); commandPaletteVisible = false; }}
      ondeselectall={() => { handleSelectAll(false); commandPaletteVisible = false; }}
      onclearfilters={() => { filterQuery = ''; commandPaletteVisible = false; }}
      onclearsort={() => { sortState = { key: null, dir: null }; commandPaletteVisible = false; }}
    />
  {/if}

  {#if history.canUndo || history.canRedo}
    <div class="tc-history-indicator">
      <button class="tc-history-btn" disabled={!history.canUndo} onclick={() => history.undo()} title="Undo (⌘Z)">
        ↩
      </button>
      <button class="tc-history-btn" disabled={!history.canRedo} onclick={() => history.redo()} title="Redo (⌘⇧Z)">
        ↪
      </button>
    </div>
  {/if}
</div>

<style>
  .tc-table-wrapper {
    position: relative;
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
    justify-content: flex-start;
    padding: var(--tc-toolbar-padding, 12px 16px);
    border-bottom: var(--tc-border-width, 1px) solid var(--tc-color-border, #f0f0f0);
    background: var(--tc-color-bg-toolbar, #fafafa);
    flex-wrap: wrap;
    gap: 16px;
  }

  .tc-nl-hint {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--tc-color-text-muted, #a3a3a3);
    font-family: var(--tc-font-family-mono, ui-monospace, monospace);
    padding: 2px 8px;
    background: var(--tc-color-bg, #ffffff);
    border-radius: 4px;
    border: 1px solid var(--tc-color-border, #f0f0f0);
    animation: tc-hint-fade 0.2s ease-out;
  }

  .tc-nl-hint-icon {
    font-size: 10px;
    color: var(--tc-color-accent, #0a0a0a);
  }

  @keyframes tc-hint-fade {
    from { opacity: 0; transform: translateY(-2px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Phase 9: Stream indicator */
  .tc-stream-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-family: var(--tc-font-family-mono, ui-monospace, monospace);
    padding: 2px 10px;
    border-radius: 9999px;
    border: 1px solid var(--tc-color-border, #f0f0f0);
    background: var(--tc-color-bg, #ffffff);
    color: var(--tc-color-text-muted, #a3a3a3);
    margin-left: auto;
  }
  .tc-stream-indicator.tc-stream-live {
    border-color: rgba(34, 197, 94, 0.3);
    background: rgba(34, 197, 94, 0.05);
    color: #16a34a;
  }
  .tc-stream-indicator.tc-stream-error {
    border-color: rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.05);
    color: #dc2626;
  }
  .tc-stream-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }
  .tc-stream-live .tc-stream-dot {
    animation: tc-stream-pulse 1.5s ease-in-out infinite;
  }
  .tc-stream-label {
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .tc-stream-throughput {
    opacity: 0.7;
    font-size: 10px;
  }
  .tc-stream-count {
    opacity: 0.5;
    font-size: 10px;
  }
  @keyframes tc-stream-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
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

  /* Phase 12: Undo/redo indicator */
  .tc-history-indicator {
    position: absolute;
    bottom: 8px;
    right: 8px;
    display: flex;
    gap: 2px;
    z-index: 10;
  }

  .tc-history-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--tc-color-border, #f0f0f0);
    border-radius: 6px;
    background: var(--tc-color-bg, #ffffff);
    color: var(--tc-color-text, #0a0a0a);
    cursor: pointer;
    font-size: 14px;
    transition: all 0.15s ease;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  }

  .tc-history-btn:hover:not(:disabled) {
    background: var(--tc-color-bg-hover, #fafafa);
    border-color: var(--tc-color-text-muted, #a3a3a3);
  }

  .tc-history-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }

  /* Micro-interaction: smooth row hover */
  :global(.tc-table-wrapper .tc-tr) {
    transition: background-color 0.12s ease;
  }

  :global(.tc-table-wrapper .tc-tr:hover) {
    background-color: var(--tc-color-bg-hover, #fafafa) !important;
  }

  /* Micro-interaction: sort column glow */
  :global(.tc-table-wrapper .tc-th[aria-sort="ascending"]),
  :global(.tc-table-wrapper .tc-th[aria-sort="descending"]) {
    background-color: var(--tc-color-bg-sorted, rgba(10, 10, 10, 0.02));
  }
</style>
