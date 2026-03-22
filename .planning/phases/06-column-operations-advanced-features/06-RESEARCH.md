# Phase 6: Column Operations + Advanced Features — Research

**Researched:** 2026-03-22
**Domain:** Svelte 5 runes, pointer/drag events, CSS sticky positioning, localStorage, row grouping, aggregate computation, @tanstack/svelte-virtual density integration
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Column Resizing (ADV-01)**
- Interaction: Drag handle — `<div class="tc-resize-handle">` absolutely positioned on right edge of each `<th>`. Pointer events: `onpointerdown` starts resize, `pointermove` updates width, `pointerup` ends.
- Width state: `colWidths: Map<string, number>` as `$state` in `Table.svelte`. Keys are column keys, values are pixel widths.
- CSS: `<th>` and `<td>` get `style="width: {colWidths.get(col.key) ?? col.minWidth ?? 150}px"`. The `<table>` gets `table-layout: fixed` when any custom width is set.
- Constraints: `minWidth` and `maxWidth` from `ColumnDefinition` clamp the drag. Default min: 60px, default max: none.
- ResizeObserver: NOT used for column resize — only pointer events. ResizeObserver is used for the scroll container height (Phase 4 concern).
- Cursor: `document.body.style.cursor = 'col-resize'` during drag; reset on `pointerup`. `user-select: none` on `<html>` during drag to prevent text selection.
- Handle appearance: `|` cursor on hover (via CSS `cursor: col-resize`), 4px wide transparent hit area with 2px visible center line.

**Column Reordering (ADV-02)**
- Interaction: Native HTML drag-and-drop — `draggable="true"` on each `<th>`. `ondragstart`, `ondragover`, `ondrop` handlers on header cells.
- State: `columnOrder: string[]` as `$state` in `Table.svelte` — array of column keys in display order. Initialized from `resolvedColumns` on first inference completion. Updated on drop.
- No DnD library: Native HTML drag events only — zero additional dependency.
- Visual during drag: `dragoverKey: string | null` as `$state` — the column being dragged over gets a CSS class `tc-th--drag-target` with a left border indicator.
- Integration with column virtualization: When column virtualization is active (> 20 columns), reordering is disabled.
- Conflict with resize: `ondragstart` is only triggered when the cursor is NOT over the resize handle — check via `event.target`.

**Column Pinning (ADV-03)**
- Implementation: `position: sticky` on `<th>` and `<td>` for pinned columns. `left: {offset}px` for left-pinned, `right: {offset}px` for right-pinned.
- Types field: `ColumnDefinition.pinned: 'left' | 'right'` is already defined in `packages/core/src/types.ts` (Phase 1).
- z-index: Pinned header cells: `z-index: 3`. Pinned body cells: `z-index: 1`. Unpinned cells: `z-index: 0`.
- Background: Pinned cells must have explicit `background-color: var(--tc-color-bg)`.
- Shadow: `box-shadow: 2px 0 4px rgba(0,0,0,0.08)` on rightmost left-pinned column and leftmost right-pinned column.
- Column virtualization: When column virtualization is active, pinning is disabled.

**Sticky Header (ADV-04)**
- Already implemented: `<thead>` has `position: sticky; top: 0` from Phase 3. No additional work required.

**Column Visibility Toggle (ADV-05)**
- State: `hiddenColumns: Set<string>` as `$bindable($state())` in `Table.svelte`. Exported via `bind:hiddenColumns`.
- Filtering: `resolvedColumns.filter(c => !hiddenColumns.has(c.key))` before passing to TableHeader and TableBody.
- No built-in toggle UI: Library exposes `bind:hiddenColumns` only. Consumers build their own picker.
- `hideable` field in ColumnDefinition: Already defined in Phase 1. Phase 6 respects it.

**Row Grouping (ADV-06)**
- Activation: `groupBy` prop (string key or array of keys). `null` / omitted = no grouping.
- Grouping logic: Happens in a new `$derived.by` step AFTER filter, BEFORE sort.
- Group header row: A special `ProcessedGroupRow` type — `{ isGroup: true, key: string, label: string, count: number, rows: ProcessedRow[] }`.
- Collapse/expand: `collapsedGroups: Set<string>` as `$state`. Click on group header row toggles collapse.
- Auto-detect groupable columns: Columns with inferred type `status` or `badge` get a group icon — purely cosmetic.
- Aggregate footer row per group: When `groupBy` is active, each group can show a summary row via `showGroupAggregates={true}` prop.

**Aggregate Footer (ADV-07)**
- Global aggregate footer: `<tfoot>` row below `<tbody>` with aggregate values for numeric columns. Enabled via `showAggregates={true}` prop.
- Per-column aggregate: `ColumnDefinition.aggregate: 'sum' | 'avg' | 'count' | 'min' | 'max' | ((values: unknown[]) => string)`.
- Computed from filtered rows: Aggregates run over `filteredRows`.
- Rendering: `<tfoot><tr><td class="tc-aggregate">` per column.

**Column State Persistence (ADV-08)**
- Activation: `persistKey` prop (string).
- Persisted state object: `{ v: 1, colWidths, sortState, filterQuery, columnOrder, hiddenColumns, currentPage }`.
- Save: Debounced `$effect` writes to `localStorage.setItem(persistKey, JSON.stringify(state))` after state changes (300ms debounce — longer than filter debounce).
- Load: In a `$effect` on mount (guarded by `typeof localStorage !== 'undefined'`).
- Version key: `{ v: 1, ...state }`. Version mismatch → ignore saved state.
- SSR guard: `typeof localStorage !== 'undefined'` before any read/write.
- `persistKey` changes: Old key is NOT cleared. New key is loaded. Document this behavior.

**Density Control (ADV-09)**
- Prop: `density: 'compact' | 'comfortable' | 'spacious'` (default: `'comfortable'`).
- Row heights: compact → 32px, comfortable → 48px, spacious → 64px.
- Implementation: `style="--tc-row-height: {rowHeightMap[density]}px"` on `<div class="tc-table-wrapper">`.
- Impact on virtualizer: Density changes trigger `virtualizer.measure()` via `$effect` watching `density`.

**Component File Changes**
- `Table.svelte` — new props: `groupBy`, `persistKey`, `density`, `showAggregates`, `showGroupAggregates`; new state: `colWidths`, `columnOrder`, `hiddenColumns`, `collapsedGroups`; updated pipeline
- `TableHeader.svelte` — resize handles, drag-to-reorder, pinning CSS, visibility state
- `TableBody.svelte` — group rows, aggregate footer, pinned cell CSS
- `TableFooter.svelte` — density hint displayed in page info (optional, Claude's discretion)
- New: `AggregateRow.svelte` — the `<tfoot>` aggregate row component
- New: `GroupRow.svelte` — the group header row with collapse/expand

### Claude's Discretion
- Exact debounce implementation for resize events and localStorage writes
- Whether to use Svelte `snippets` or sub-components for GroupRow and AggregateRow
- Exact CSS for the drag indicator (left border vs translucent overlay)
- Whether `colWidths` defaults use the column's `minWidth` or a fixed 150px fallback
- Exact `localStorage` version scheme (could use semver or just an integer)
- Whether to emit a custom event when column state changes (for consumers who want to sync to a server)

### Deferred Ideas (OUT OF SCOPE)
- Column-level search/filter inputs below headers (Phase 7 or v3)
- Multi-column sort (Phase 7 or v3)
- Frozen row (not column) pinning
- Right-click context menu for column operations
- Sub-row / expandable rows — v2 requirements backlog
- Inline cell editing — v2 requirements backlog
- Export CSV/JSON — Phase 7
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADV-01 | Column resizing — drag handle on column divider; `minWidth` and `maxWidth` constrainable | Pointer events pattern verified; `table-layout: fixed` switch; `setPointerCapture` prevents pointer escape |
| ADV-02 | Column reordering — drag-and-drop column headers using native HTML drag events | Svelte 5 `ondragstart`/`ondragover`/`ondrop` syntax verified; target check pattern for resize conflict |
| ADV-03 | Column pinning — `pinned: 'left' | 'right'`; pinned columns stay fixed during horizontal scroll | `position: sticky` offset computation; z-index layering; background fill requirement; overflow-x container interaction verified |
| ADV-04 | Sticky header — already delivered in Phase 3; confirm still works with pinned columns | Confirmed: sticky on `<thead> <th>` and sticky on `<td>` operate on different axes — both work |
| ADV-05 | Column visibility toggle — `hideable` prop; hidden columns excluded from rendering | `$bindable` pattern established; filter in derived pipeline before virtualizer |
| ADV-06 | Row grouping — auto-detect groupable columns; grouped rows with expand/collapse | `$derived.by()` grouping step; discriminated union row type; virtualizer handles homogeneous count |
| ADV-07 | Aggregate footer row — sum, avg, count, min, max for numeric columns; configurable per column | `ColumnDefinition.aggregate` field addition to types.ts; `<tfoot>` rendering pattern |
| ADV-08 | Column state persistence — `persistKey` prop saves state to localStorage | `$effect` debounce pattern; SSR guard; JSON serialization of Set via Array.from |
| ADV-09 | Density control — `density` prop adjusts row height and padding | CSS custom property on wrapper; `virtualizer.measure()` call in `$effect` watching density |
</phase_requirements>

---

## Summary

Phase 6 builds nine interacting features on top of the Phase 3/4 pipeline without adding any new npm dependencies. Every feature integrates into the existing `$state` / `$derived.by` / `$effect` pattern established in `Table.svelte`. The most technically nuanced areas are column resizing (pointer capture to survive pointer-leave events), column pinning (sticky offset computation and z-index layering inside an `overflow-x: auto` container), and the `groupedRows` step that inserts a discriminated-union row type into the virtual scrolling pipeline.

The existing `@tanstack/svelte-virtual` store-in-`$effect` integration is the correct foundation for density changes: when `density` prop changes, the new `--tc-row-height` CSS var is set on the wrapper, and calling `virtualizer.measure()` (available on the virtualizer store's internal instance) causes it to re-read `estimateSize` and recalculate all item offsets. The virtualizer does not need to be destroyed and recreated.

The localStorage persistence pattern requires careful treatment of `Set<string>` (which is not JSON-serializable): convert to `Array.from(hiddenColumns)` on save and `new Set(parsed.hiddenColumns)` on load. Column `colWidths: Map<string, number>` similarly must be serialized to `Object.fromEntries(colWidths)` and deserialized with `new Map(Object.entries(parsed.colWidths))`.

**Primary recommendation:** Implement all nine features in a single wave sequence ordered by dependency: ADV-09 (density — touches `$state` shape) → ADV-05 (visibility — adds pipeline filter step) → ADV-01 (column resize — `colWidths` state + CSS) → ADV-02 (reorder — `columnOrder` state) → ADV-03 (pinning — CSS offsets computed from `colWidths`) → ADV-08 (persistence — reads all the above state) → ADV-06 (grouping — inserts pipeline step) → ADV-07 (aggregate — adds `<tfoot>`) → ADV-04 (sticky header confirmation — no code change, just regression test).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tanstack/svelte-virtual` | 3.13.23 (already installed) | Row virtualization; `measure()` API for density changes | Already integrated in Phase 4; no new install needed |
| Svelte 5 | 5.54.1 (peer dep) | `$state`, `$derived`, `$effect`, `$bindable` runes | All existing state uses this pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native Pointer Events API | Browser built-in | Column resize drag — `onpointerdown`, `pointermove`, `pointerup`, `setPointerCapture` | Phase 4's event delegation pattern extended |
| Native HTML Drag API | Browser built-in | Column reordering — `draggable`, `ondragstart`, `ondragover`, `ondrop` | No DnD library; locked decision |
| `localStorage` | Browser built-in | Column state persistence (ADV-08) | SSR-guarded; no wrapper library needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native pointer events for resize | `dnd-kit` or `react-dnd` | Library adds weight and React dependency; pointer events are sufficient for a drag-handle |
| Native HTML drag for reorder | `Sortable.js` or `svelte-dnd-action` | Locked decision: zero additional dependency; native drag events handle the use case adequately |
| Inline debounce with `setTimeout` | `lodash.debounce` | Lodash adds ~4KB; `setTimeout` with cleanup in `$effect` is 6 lines |

**Installation:** No new packages required. All Phase 6 features use existing dependencies and browser APIs.

---

## Architecture Patterns

### Recommended Project Structure
```
packages/svelte/src/lib/
├── Table.svelte           # NEW props + state + updated pipeline (groupedRows step)
├── TableHeader.svelte     # Resize handles + drag attrs + pinned CSS
├── TableBody.svelte       # Group rows + pinned cell CSS + aggregate tfoot
├── TableFooter.svelte     # Optional density label (Claude's discretion)
├── AggregateRow.svelte    # NEW — <tfoot> aggregate row component
├── GroupRow.svelte        # NEW — group header row with collapse/expand toggle
├── Cell.svelte            # Unchanged
├── Checkbox.svelte        # Unchanged
├── SearchInput.svelte     # Unchanged
├── sort.worker.ts         # Unchanged
└── types.ts               # Unchanged (types added to packages/core/src/types.ts)
```

### Pattern 1: Column Resize with Pointer Capture

Pointer capture is critical — without it, `pointermove` events stop firing when the pointer leaves the `<th>` element during a fast drag.

```typescript
// TableHeader.svelte
// Source: MDN PointerEvents API
let resizing: { key: string; startX: number; startWidth: number } | null = null;

function onResizePointerDown(e: PointerEvent, col: ResolvedColumn) {
  e.preventDefault();
  e.stopPropagation(); // prevent ondragstart from firing on the th
  const currentWidth = colWidths.get(col.key) ?? col.minWidth ?? 150;
  resizing = { key: col.key, startX: e.clientX, startWidth: currentWidth };
  // Capture pointer to this element — events keep firing even if pointer leaves
  (e.target as Element).setPointerCapture(e.pointerId);
  document.body.style.cursor = 'col-resize';
  document.documentElement.style.userSelect = 'none';
}

function onResizePointerMove(e: PointerEvent) {
  if (!resizing) return;
  const col = columns.find(c => c.key === resizing!.key);
  const delta = e.clientX - resizing.startX;
  const minW = col?.minWidth ?? 60;
  const maxW = col?.maxWidth ?? Infinity;
  const newWidth = Math.min(maxW, Math.max(minW, resizing.startWidth + delta));
  // colWidths is Map<string, number> $state in Table.svelte — passed as prop
  oncolwidthchange?.(resizing.key, newWidth);
}

function onResizePointerUp(e: PointerEvent) {
  if (!resizing) return;
  (e.target as Element).releasePointerCapture(e.pointerId);
  resizing = null;
  document.body.style.cursor = '';
  document.documentElement.style.userSelect = '';
}
```

**In the `<th>` template:**
```svelte
<th
  style="width: {colWidths.get(col.key) ?? col.minWidth ?? 150}px; position: relative;"
  draggable={!isColumnVirtualizing}
  ondragstart={(e) => {
    // Only start drag if NOT clicking the resize handle
    if ((e.target as Element).closest('.tc-resize-handle')) {
      e.preventDefault();
      return;
    }
    handleDragStart(e, col);
  }}
>
  <!-- Header content -->
  <div
    class="tc-resize-handle"
    onpointerdown={(e) => onResizePointerDown(e, col)}
    onpointermove={onResizePointerMove}
    onpointerup={onResizePointerUp}
  ></div>
</th>
```

**Table-layout switching (in Table.svelte template):**
```svelte
<table
  class="tc-table"
  style={colWidths.size > 0 ? 'table-layout: fixed;' : ''}
>
```

### Pattern 2: Native HTML Drag Reordering (Svelte 5)

Svelte 5 event syntax: `ondragstart` not `on:dragstart`. All drag handlers are inline or named functions — no `createEventDispatcher`.

```typescript
// TableHeader.svelte state
let dragKey = $state<string | null>(null);
let dragoverKey = $state<string | null>(null);

function handleDragStart(e: DragEvent, col: ResolvedColumn) {
  dragKey = col.key;
  e.dataTransfer!.effectAllowed = 'move';
  e.dataTransfer!.setData('text/plain', col.key);
}

function handleDragOver(e: DragEvent, col: ResolvedColumn) {
  e.preventDefault(); // REQUIRED for drop to fire
  e.dataTransfer!.dropEffect = 'move';
  dragoverKey = col.key;
}

function handleDrop(e: DragEvent, targetCol: ResolvedColumn) {
  e.preventDefault();
  if (!dragKey || dragKey === targetCol.key) {
    dragKey = null;
    dragoverKey = null;
    return;
  }
  oncolumnreorder?.(dragKey, targetCol.key);
  dragKey = null;
  dragoverKey = null;
}

function handleDragEnd() {
  dragKey = null;
  dragoverKey = null;
}
```

**In the `<th>` template:**
```svelte
<th
  draggable={!isColumnVirtualizing}
  ondragstart={(e) => {
    if ((e.target as Element).closest('.tc-resize-handle')) {
      e.preventDefault();
      return;
    }
    handleDragStart(e, col);
  }}
  ondragover={(e) => handleDragOver(e, col)}
  ondrop={(e) => handleDrop(e, col)}
  ondragend={handleDragEnd}
  class:tc-th--drag-target={dragoverKey === col.key && dragoverKey !== dragKey}
>
```

**`columnOrder` management in Table.svelte:**
```typescript
// Initialize from resolvedColumns once inference completes
let columnOrder = $state<string[]>([]);
$effect(() => {
  if (resolvedColumns.length > 0 && columnOrder.length === 0) {
    columnOrder = resolvedColumns.map(c => c.key);
  }
});

// Reorder handler
function handleColumnReorder(fromKey: string, toKey: string) {
  const next = [...columnOrder];
  const fromIdx = next.indexOf(fromKey);
  const toIdx = next.indexOf(toKey);
  if (fromIdx === -1 || toIdx === -1) return;
  next.splice(fromIdx, 1);
  next.splice(toIdx, 0, fromKey);
  columnOrder = next;
}

// Apply order to resolvedColumns — the ordered columns list
const orderedColumns = $derived.by(() => {
  if (columnOrder.length === 0) return resolvedColumns;
  const keyToCol = new Map(resolvedColumns.map(c => [c.key, c]));
  return columnOrder.flatMap(k => keyToCol.has(k) ? [keyToCol.get(k)!] : []);
});
```

### Pattern 3: Column Pinning — Sticky Offset Computation

The offset for each pinned column must be computed at render time from `colWidths`.

```typescript
// Computed in Table.svelte as $derived
const pinnedLeftCols = $derived(
  orderedColumns.filter(c => c.pinned === 'left' && !hiddenColumns.has(c.key))
);
const pinnedRightCols = $derived(
  orderedColumns.filter(c => c.pinned === 'right' && !hiddenColumns.has(c.key))
);

// Returns left offset for a left-pinned column key
function getPinnedLeftOffset(key: string): number {
  let offset = 0;
  for (const col of pinnedLeftCols) {
    if (col.key === key) return offset;
    offset += colWidths.get(col.key) ?? col.minWidth ?? 150;
  }
  return 0;
}

// Returns right offset for a right-pinned column key
function getPinnedRightOffset(key: string): number {
  let offset = 0;
  for (let i = pinnedRightCols.length - 1; i >= 0; i--) {
    if (pinnedRightCols[i].key === key) return offset;
    offset += colWidths.get(pinnedRightCols[i].key) ?? pinnedRightCols[i].minWidth ?? 150;
  }
  return 0;
}
```

**CSS for pinned cells (inline style on `<th>` and `<td>`):**
```svelte
{@const isPinnedLeft = col.pinned === 'left'}
{@const isPinnedRight = col.pinned === 'right'}
{@const isLastLeft = isPinnedLeft && pinnedLeftCols.at(-1)?.key === col.key}
{@const isFirstRight = isPinnedRight && pinnedRightCols[0]?.key === col.key}

<th
  style="
    {isPinnedLeft ? `position: sticky; left: ${getPinnedLeftOffset(col.key)}px; z-index: 3;` : ''}
    {isPinnedRight ? `position: sticky; right: ${getPinnedRightOffset(col.key)}px; z-index: 3;` : ''}
    background-color: var(--tc-color-bg, #fff);
    {isLastLeft ? 'box-shadow: 2px 0 4px rgba(0,0,0,0.08);' : ''}
    {isFirstRight ? 'box-shadow: -2px 0 4px rgba(0,0,0,0.08);' : ''}
  "
>
```

**Critical: the `overflow-x: auto` container does NOT break `position: sticky`** on `<th>` or `<td>` as long as no ancestor between the sticky element and the scroll container has `overflow: hidden`. The existing `.tc-table-wrapper` has `overflow: hidden` — this WILL break pinning. The `border-radius` + `overflow: hidden` on `.tc-table-wrapper` is the issue. Solution: remove `overflow: hidden` from `.tc-table-wrapper` and achieve the border-radius clip via a different method (e.g., `clip-path` on the wrapper, or keeping overflow on a non-ancestor element). See Pitfall 3 below.

### Pattern 4: Row Grouping — Pipeline Insertion

The grouping step inserts between `filteredRows` and the sort step.

```typescript
// In Table.svelte — new discriminated union type for the pipeline
type DisplayRow =
  | { isGroup: true; key: string; label: string; count: number }
  | { isGroup: false; row: ProcessedRow };

// Grouping step — inserts AFTER filteredRows, BEFORE sort
const groupedRows = $derived.by(() => {
  if (!groupBy) return filteredRows; // no grouping: pass through as ProcessedRow[]
  const groups = new Map<string, ProcessedRow[]>();
  for (const row of filteredRows) {
    const value = String(row._original[groupBy] ?? '(empty)');
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value)!.push(row);
  }
  // Flatten to interleaved DisplayRow array for the virtualizer
  const result: DisplayRow[] = [];
  for (const [label, rows] of groups) {
    result.push({ isGroup: true, key: label, label, count: rows.length });
    if (!collapsedGroups.has(label)) {
      for (const row of rows) {
        result.push({ isGroup: false, row });
      }
    }
  }
  return result;
});
```

**Virtualizer count:** When grouping is active, feed `groupedRows.length` to the virtualizer's `count`. Group header rows are the same height as data rows (48px by default) — no variable-height complexity. The REQUIREMENTS.md marks dynamic row heights as deferred to v3, confirming homogeneous heights are acceptable.

**Sort and groupBy interaction:** Sorting applies within each group's rows (the `rows` array inside each group), not across groups. The existing Worker sort is bypassed when grouping is active — sort happens on the sub-arrays directly in the grouping step.

### Pattern 5: Aggregate Footer Computation

```typescript
// In Table.svelte
const aggregates = $derived.by(() => {
  if (!showAggregates) return {};
  const result: Record<string, string> = {};
  for (const col of visibleCols) {
    if (!col.aggregate) continue;
    const values = filteredRows.map(r => r._original[col.key]);
    if (typeof col.aggregate === 'function') {
      result[col.key] = col.aggregate(values);
    } else {
      const nums = values.filter((v): v is number => typeof v === 'number');
      switch (col.aggregate) {
        case 'sum': result[col.key] = String(nums.reduce((a, b) => a + b, 0)); break;
        case 'avg': result[col.key] = nums.length > 0 ? String(nums.reduce((a,b)=>a+b,0)/nums.length) : ''; break;
        case 'count': result[col.key] = String(filteredRows.length); break;
        case 'min': result[col.key] = nums.length > 0 ? String(Math.min(...nums)) : ''; break;
        case 'max': result[col.key] = nums.length > 0 ? String(Math.max(...nums)) : ''; break;
      }
    }
  }
  return result;
});
```

### Pattern 6: localStorage Persistence with Debounce

`Set` and `Map` are not JSON-serializable — must convert on both save and load.

```typescript
// Save — debounced $effect
$effect(() => {
  if (!persistKey || typeof localStorage === 'undefined') return;
  // Touch all reactive state to track dependencies
  const snapshot = {
    v: 1,
    colWidths: Object.fromEntries(colWidths),
    sortState: { key: sortState.key, dir: sortState.dir },
    filterQuery,
    columnOrder,
    hiddenColumns: Array.from(hiddenColumns),
    currentPage,
  };
  const timer = setTimeout(() => {
    try {
      localStorage.setItem(persistKey, JSON.stringify(snapshot));
    } catch {
      // localStorage full or blocked — silently ignore
    }
  }, 300);
  return () => clearTimeout(timer); // $effect cleanup cancels pending write
});

// Load — runs once on mount when persistKey is first set
$effect(() => {
  if (!persistKey || typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(persistKey);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed.v !== 1) return; // version mismatch — ignore
    if (parsed.colWidths) colWidths = new Map(Object.entries(parsed.colWidths));
    if (parsed.sortState) sortState = parsed.sortState;
    if (typeof parsed.filterQuery === 'string') filterQuery = parsed.filterQuery;
    if (Array.isArray(parsed.columnOrder)) columnOrder = parsed.columnOrder;
    if (Array.isArray(parsed.hiddenColumns)) hiddenColumns = new Set(parsed.hiddenColumns);
    if (typeof parsed.currentPage === 'number') currentPage = parsed.currentPage;
  } catch {
    // Corrupt data — silently ignore
  }
});
```

**CRITICAL:** The load `$effect` and save `$effect` must not create a feedback loop. Because Svelte 5 `$effect` runs after the DOM updates, the load effect will run once (on mount), set state, then the save effect will immediately try to write back the just-loaded state. This is acceptable because the debounce timer means the write is deferred 300ms — by which time the load effect is done and nothing changed.

### Pattern 7: Density + Virtualizer Integration

The virtualizer's `estimateSize` callback captures `rowHeight` at creation time. When density changes, the virtualizer must be told to re-measure all items.

```typescript
// In Table.svelte
const rowHeightMap: Record<string, number> = {
  compact: 32,
  comfortable: 48,
  spacious: 64,
};

// $effect watches density changes and calls measure() on the active virtualizer
// The virtualizer store reference is held in the $effect that creates it
let virtualizerRef = $state<{ measure: () => void } | null>(null);

$effect(() => {
  // density is tracked as a dependency
  const _ = density;
  if (virtualizerRef) {
    virtualizerRef.measure();
  }
});
```

**How to access the virtualizer instance:** The `$effect` that creates the virtualizer via `createVirtualizer` subscribes to the store. The store value exposes a `measure()` method. Capture the internal virtualizer options object:

```typescript
$effect(() => {
  if (!scrollEl || !isVirtualizing) { virtualItems = []; totalVirtualSize = 0; return; }

  const currentRowHeight = rowHeightMap[density] ?? 48;
  rowHeight = currentRowHeight;

  const store = createVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: sortedRows.length,
    getScrollElement: () => scrollEl!,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  const unsub = store.subscribe((v) => {
    virtualItems = v.getVirtualItems();
    totalVirtualSize = v.getTotalSize();
    virtualizerRef = { measure: () => v.measure() };
  });

  return unsub;
});
```

When `density` changes as a prop to `Table.svelte`, the `$effect` that watches `density` fires and calls `virtualizerRef.measure()`. The virtualizer re-calls `estimateSize` for all items using the updated `rowHeight` variable.

### Anti-Patterns to Avoid

- **`overflow: hidden` on a sticky-element ancestor:** The `.tc-table-wrapper` currently has `overflow: hidden` (for border-radius). This will clip sticky pinned columns. Must be addressed before ADV-03 works.
- **Setting `draggable="true"` and `onpointerdown` on the same element without `stopPropagation`:** The resize handle's `onpointerdown` must call `e.stopPropagation()` to prevent the parent `<th>`'s drag from starting.
- **Using `$derived` for the virtualizer:** Already documented in Phase 4 RESEARCH.md. Always use `$effect` + `$state` mirror.
- **Serializing `Map` and `Set` directly to JSON:** `JSON.stringify(new Map())` returns `"{}"` — empty object. Must use `Object.fromEntries(map)` and `Array.from(set)`.
- **Forgetting the `e.preventDefault()` in `ondragover`:** Without `preventDefault()` in `ondragover`, the `ondrop` event never fires — this is a browser security requirement for drag-and-drop.
- **Inserting grouping step AFTER sort:** Sorting must happen within each group's rows separately, or grouping must happen before sort. Sorting the full interleaved group+row array breaks group membership boundaries.
- **Calling `virtualizer.measure()` synchronously before the DOM reflects the new density CSS var:** The CSS var is set on the wrapper via a Svelte reactive `style` attribute. Svelte flushes DOM updates before running effects, so by the time the density `$effect` runs, the CSS var is already applied. Safe to call `measure()` immediately.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pointer capture during resize | Manual `document.addEventListener('pointermove')` + cleanup | `element.setPointerCapture(e.pointerId)` | Capture routes all events to the capturer even outside the element; release on `pointerup` is automatic on pointer loss |
| Drag reorder library | `svelte-dnd-action`, `Sortable.js` | Native HTML drag API | Locked decision; native API covers column reorder adequately; zero dependency |
| Column sticky offset math | Storing offsets separately | Compute from `colWidths` + pinned column order at render time | Offsets must stay in sync with widths; computing derived values is cleaner than dual state |
| Aggregate computation | External math library | Inline reduce/Math.min/Math.max | The 5 aggregates (sum/avg/count/min/max) are ~20 lines total; no library needed |
| localStorage debounce | `lodash.throttle` or `lodash.debounce` | `setTimeout` + `$effect` cleanup | 6 lines; no dependency |
| JSON serialization of Set/Map | Custom serializer | `Array.from(set)` / `Object.fromEntries(map)` | Native, no library needed |

**Key insight:** Every "use a library" suggestion for this phase adds weight to the component without covering a sufficiently complex problem domain. The native browser APIs (pointer events, drag events, localStorage, sticky positioning) are well-supported and sufficient.

---

## Common Pitfalls

### Pitfall 1: `overflow: hidden` on `.tc-table-wrapper` breaks column pinning

**What goes wrong:** `position: sticky` on a `<th>` or `<td>` stops working — the element scrolls with content instead of sticking.
**Why it happens:** A sticky element's "sticky container" is its nearest ancestor with `overflow` set to anything other than `visible`. The `.tc-table-wrapper` has `overflow: hidden` (required for `border-radius` clipping). This makes the wrapper the sticky container, but the wrapper doesn't scroll — the inner `.tc-table-scroll` does. Sticky elements stuck to a non-scrolling container appear to not stick.
**How to avoid:** Remove `overflow: hidden` from `.tc-table-wrapper`. Use `clip-path: inset(0 round 0.75rem)` instead to achieve the rounded-corner clip without creating a sticky container boundary. Alternatively, move the `border-radius` to a pseudo-element.
**Warning signs:** Sticky `<th>` elements scroll off-screen with table content instead of staying at the top of the scroll container. Debuggable with DevTools: check "Sticky positioned" in the computed styles panel.

### Pitfall 2: `draggable="true"` fires on resize handle interaction

**What goes wrong:** When the user clicks the resize handle and starts dragging, the browser also fires `ondragstart` on the `<th>` (because the `<th>` has `draggable="true"`). This starts a column reorder drag simultaneously with the resize pointer drag, causing erratic behavior.
**Why it happens:** `draggable="true"` makes the entire element draggable. The resize handle is a child `<div>` inside the `<th>`.
**How to avoid:** In `ondragstart` on the `<th>`, check if `event.target` is (or is inside) the resize handle: `if ((e.target as Element).closest('.tc-resize-handle')) { e.preventDefault(); return; }`. Also call `e.stopPropagation()` in the resize handle's `onpointerdown` handler.
**Warning signs:** Dragging the resize handle also moves the column position; a drag ghost image appears during resize.

### Pitfall 3: `Set<string>` and `Map<string, number>` are not JSON-serializable

**What goes wrong:** `JSON.stringify(new Set(['a','b']))` returns `"{}"`. `JSON.stringify(new Map([['a',1]]))` returns `"{}"`. Reading persisted state back produces empty state.
**Why it happens:** `JSON.stringify` only serializes enumerable own properties. `Set` and `Map` store their entries internally, not as enumerable own properties.
**How to avoid:** Always convert before stringify: `hiddenColumns: Array.from(hiddenColumns)`, `colWidths: Object.fromEntries(colWidths)`. After parse: `hiddenColumns = new Set(parsed.hiddenColumns)`, `colWidths = new Map(Object.entries(parsed.colWidths))`.
**Warning signs:** Column widths reset to defaults on page reload despite `persistKey` being set; hidden columns reappear on reload.

### Pitfall 4: `ondragover` without `preventDefault()` silently breaks `drop`

**What goes wrong:** The `ondrop` handler never fires.
**Why it happens:** By default, the browser does not allow dropping. `ondragover` must call `e.preventDefault()` to signal that the target accepts a drop. Without this, the `drop` event is never dispatched.
**How to avoid:** Always include `e.preventDefault()` AND `e.dataTransfer!.dropEffect = 'move'` in `ondragover`.
**Warning signs:** Drop handler never called; column order never changes despite drag appearing to work visually.

### Pitfall 5: `contain: paint` on `.tc-td` clips the resize handle pseudo-element

**What goes wrong:** The resize handle `::after` pseudo-element (the 2px visible line) is clipped at the cell boundary and not visible.
**Why it happens:** Phase 4 applied `contain: layout style paint` on `.tc-td`. `paint` containment clips all rendering at the border-box of the element. The resize handle is on `<th>`, not `<td>`, so this specific issue doesn't apply to the handle itself. BUT: if any tooltip or overflow visual is added to cells, it will be clipped.
**How to avoid:** The resize handle lives on `<th>` elements which currently do NOT have `contain: paint`. Keep resize handle on `<th>`, not `<td>`. No change needed to Phase 4's `contain: layout style paint` on `.tc-td`.
**Warning signs:** Resize handle visible on header but visual indicator clips when over cell content in body.

### Pitfall 6: `groupedRows` length vs `filteredRows` length for pagination and aggregate footer

**What goes wrong:** Pagination `totalPages = Math.ceil(filteredRows.length / pageSize)` counts data rows only. When grouping is active, `groupedRows` includes group header rows which inflate the count and break virtualizer sizing.
**Why it happens:** The pipeline counts are used for two purposes: pagination (data-only count) and virtualizer (display-row count including group headers).
**How to avoid:** Keep `filteredRows` (pure data rows) for pagination math and aggregate computation. Pass `groupedRows` (mixed display rows) to the virtualizer and TableBody. Only when grouping is active use `groupedRows.length` as the virtualizer count.
**Warning signs:** Pagination shows wrong page count; aggregate footer shows 0 or wrong values when grouping is active.

### Pitfall 7: Density `$effect` dependency tracking — reading CSS var from DOM

**What goes wrong:** The `density` `$effect` that calls `virtualizer.measure()` needs the new CSS var to already be applied. If trying to call `getComputedStyle(scrollEl).getPropertyValue('--tc-row-height')` inside the effect to read the updated height, the read may happen before the browser applies the style change.
**Why it happens:** CSS custom property inheritance requires a browser style recalculation pass.
**How to avoid:** Don't read the CSS var in the density effect. Instead maintain a `rowHeightMap` object in JS and read `rowHeight = rowHeightMap[density]` directly. No need to round-trip through the DOM.
**Warning signs:** Virtualizer item sizes don't update when density changes; scroll position jumps after density switch.

---

## Code Examples

Verified patterns from the existing codebase and browser specs:

### Existing `$effect` cleanup pattern (from Table.svelte)

```typescript
// Source: packages/svelte/src/lib/Table.svelte (Phase 4 implementation)
$effect(() => {
  if (!scrollEl || !isVirtualizing) { virtualItems = []; totalVirtualSize = 0; return; }
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
  return unsub; // cleanup: unsubscribes from virtualizer store
});
```

### Existing virtualizer store subscription in `$effect` (from Table.svelte)

The Phase 4 implementation already uses `store.subscribe((v) => { virtualItems = v.getVirtualItems(); })`. To access `measure()`, the subscriber receives the virtualizer instance `v` which exposes `v.measure()`.

### `$bindable` pattern (established in Phase 3/4)

```typescript
// From Table.svelte Props interface
let {
  selectedRows = $bindable([]),
  // Phase 6 adds:
  hiddenColumns = $bindable(new Set<string>()),
}: Props = $props();
```

### Sticky `<th>` with dynamic offset

```svelte
<!-- Source: MDN CSS position sticky + Phase 6 offset computation -->
<th
  scope="col"
  class="tc-th"
  class:tc-th--pinned-left={col.pinned === 'left'}
  class:tc-th--pinned-right={col.pinned === 'right'}
  style="
    width: {colWidths.get(col.key) ?? col.minWidth ?? 150}px;
    {col.pinned === 'left' ? `position: sticky; left: ${getPinnedLeftOffset(col.key)}px; z-index: 3;` : ''}
    {col.pinned === 'right' ? `position: sticky; right: ${getPinnedRightOffset(col.key)}px; z-index: 3;` : ''}
    background-color: var(--tc-color-bg, #fff);
  "
>
```

### localStorage debounce with `$effect` cleanup

```typescript
// Source: Pattern derived from MDN localStorage + Svelte $effect cleanup docs
$effect(() => {
  if (!persistKey || typeof localStorage === 'undefined') return;
  const snapshot = {
    v: 1,
    colWidths: Object.fromEntries(colWidths),
    sortState: { key: sortState.key, dir: sortState.dir },
    filterQuery,
    columnOrder: [...columnOrder],
    hiddenColumns: Array.from(hiddenColumns),
    currentPage,
  };
  const timer = setTimeout(() => {
    try { localStorage.setItem(persistKey, JSON.stringify(snapshot)); } catch { /* quota exceeded */ }
  }, 300);
  return () => clearTimeout(timer);
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Mouse events (`mousedown`/`mousemove`/`mouseup`) for drag | Pointer events (`pointerdown`/`pointermove`/`pointerup`) with `setPointerCapture` | Pointer Events spec (2014); widely adopted ~2018 | Touch + mouse unified; pointer capture prevents pointer-leave breakage |
| `on:dragstart` (Svelte 3/4 directive syntax) | `ondragstart={handler}` (Svelte 5 rune syntax) | Svelte 5.0 (Oct 2024) | All event handlers are now properties; `createEventDispatcher` removed |
| `position: absolute; top: 0` for virtual rows | `transform: translateY(item.start - index * item.size)` | TanStack Virtual 3.x table example | Works with semantic `<table>` layout model |
| Storing column config in component local state only | `localStorage` persistence via `persistKey` prop | Industry standard since ~2019 | Users don't lose table config on page refresh |

**Deprecated/outdated:**
- `on:dragstart` Svelte 4 syntax: Still works in Svelte 5 for backward compat, but `ondragstart` is the new canonical form.
- `mousedown`/`mousemove` for resize: Does not work on touch; does not survive pointer-leave during fast drag. Pointer events are the correct replacement.
- `window.localStorage` without SSR guard: Throws `localStorage is not defined` in Node/SvelteKit SSR. Always check `typeof localStorage !== 'undefined'`.

---

## Open Questions

1. **`overflow: hidden` removal from `.tc-table-wrapper` — what replaces it?**
   - What we know: `border-radius: 0.75rem` with `overflow: hidden` is the current approach; `overflow: hidden` breaks column pinning
   - What's unclear: Whether `clip-path: inset(0 round 0.75rem)` creates a stacking context that also interferes with sticky (it does NOT — clip-path does not establish overflow context)
   - Recommendation: Use `clip-path: inset(0 round 0.75rem)` on `.tc-table-wrapper` and remove `overflow: hidden`. Verify with Playwright that border-radius clip still applies.

2. **`colWidths` changes and the column virtualizer**
   - What we know: Column virtualizer uses `estimateSize: () => 150` (fixed default). If `colWidths` changes, column widths visually change but the virtualizer still calculates offsets assuming 150px.
   - What's unclear: Whether column virtualization + column resize is a supported combination
   - Recommendation: The CONTEXT.md decision states column virtualization (>20 cols) disables column reordering AND pinning. Per the same logic, column resize should also be disabled when column virtualization is active (or the colWidth should be fed back into the column virtualizer's `estimateSize`). The simpler approach: disable resize when `isColumnVirtualizing` is true. Document this limitation.

3. **`ProcessedGroupRow` type — where does it live?**
   - What we know: `ProcessedRow` is defined in `packages/core/src/types.ts`; the `ProcessedGroupRow` type is only needed in `@tablecraft/svelte`
   - What's unclear: Whether to add it to `packages/core/src/types.ts` or keep it in `packages/svelte/src/lib/types.ts`
   - Recommendation: Add to `packages/svelte/src/lib/types.ts` — it is a display concern, not a core engine concern. The core engine does not know about grouping.

4. **Group row and the virtualizer row height**
   - What we know: The virtualizer uses a fixed `estimateSize: () => rowHeight`. Group header rows are rendered at the same height to keep the virtualizer's fixed-height assumption.
   - What's unclear: Whether group header rows need to be taller (to show group name + count + toggle icon clearly)
   - Recommendation: Start with the same height as data rows. The group row has enough space at 48px for the label and collapse icon. If the UX review finds it cramped at compact density (32px), add a `minHeight` override just for `.tc-group-row`. The virtualizer doesn't need to account for it since the total height difference is small.

---

## Validation Architecture

> `workflow.nyquist_validation` is `true` in `.planning/config.json` — this section is required.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 (unit + jsdom) + Playwright 1.50.1 (E2E) |
| Config file | `packages/svelte/vitest.config.ts` (unit) + `playwright.config.ts` at root |
| Quick run command | `pnpm --filter @tablecraft/svelte test` |
| Full suite command | `pnpm --filter @tablecraft/svelte test && pnpm exec playwright test e2e/column-ops.spec.ts` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADV-01 | Column resize: dragging handle changes `<th>` width; clamped by minWidth/maxWidth | Playwright E2E | `pnpm exec playwright test e2e/column-ops.spec.ts -g "ADV-01"` | ❌ Wave 0 |
| ADV-02 | Column reorder: drag header changes column order in DOM | Playwright E2E | `pnpm exec playwright test e2e/column-ops.spec.ts -g "ADV-02"` | ❌ Wave 0 |
| ADV-03 | Column pinning: `getComputedStyle(th).position === 'sticky'`; left offset correct | Playwright E2E | `pnpm exec playwright test e2e/column-ops.spec.ts -g "ADV-03"` | ❌ Wave 0 |
| ADV-04 | Sticky header: `<thead>` stays at top during scroll (regression — already works) | Playwright E2E | `pnpm exec playwright test e2e/column-ops.spec.ts -g "ADV-04"` | ❌ Wave 0 |
| ADV-05 | Column visibility: adding key to `hiddenColumns` removes `<th>` from DOM | Vitest unit | `pnpm --filter @tablecraft/svelte test src/test/column-ops.test.ts` | ❌ Wave 0 |
| ADV-06 | Row grouping: group header rows appear; collapse toggle hides child rows | Playwright E2E | `pnpm exec playwright test e2e/column-ops.spec.ts -g "ADV-06"` | ❌ Wave 0 |
| ADV-07 | Aggregate footer: `<tfoot>` present; sum value matches expected calculation | Vitest unit | `pnpm --filter @tablecraft/svelte test src/test/column-ops.test.ts` | ❌ Wave 0 |
| ADV-08 | Persistence: state survives page reload; version mismatch clears state | Playwright E2E | `pnpm exec playwright test e2e/column-ops.spec.ts -g "ADV-08"` | ❌ Wave 0 |
| ADV-09 | Density: `density='compact'` sets `--tc-row-height: 32px` on wrapper | Vitest unit | `pnpm --filter @tablecraft/svelte test src/test/column-ops.test.ts` | ❌ Wave 0 |

**Testing notes:**
- ADV-01 (resize): Use Playwright `page.mouse.move` + `page.mouse.down` + `page.mouse.move` + `page.mouse.up` to simulate pointer drag on the resize handle. Or use `page.dispatchEvent` with a `PointerEvent`.
- ADV-02 (reorder): Use Playwright `page.dragAndDrop(source, target)` — this API fires the full drag event sequence including `dragstart`, `dragover`, `drop`.
- ADV-03 (pinning): Assert `getComputedStyle(th).position === 'sticky'` and `getComputedStyle(th).left === '{expected}px'` via `page.$eval`.
- ADV-05 (visibility): Can be tested in jsdom via `@testing-library/svelte` — set `hiddenColumns` prop and assert `<th>` for that column is not in the DOM.
- ADV-07 (aggregates): Can be tested in jsdom — provide data with known numeric values and assert `<tfoot>` cell text.
- ADV-08 (persistence): Playwright localStorage can be set/read via `page.evaluate(() => localStorage.setItem(...))`. Reload the page and assert state is restored.
- ADV-09 (density): jsdom-compatible — mount with `density='compact'` and check `style` attribute on wrapper.

### Sampling Rate
- **Per task commit:** `pnpm --filter @tablecraft/svelte test` (Vitest unit tests, < 10s)
- **Per wave merge:** `pnpm --filter @tablecraft/svelte test && pnpm exec playwright test e2e/column-ops.spec.ts`
- **Phase gate:** All Playwright column-ops tests green + no regression on `e2e/performance.spec.ts` before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `e2e/column-ops.spec.ts` — covers ADV-01, ADV-02, ADV-03, ADV-04, ADV-06, ADV-08
- [ ] `packages/svelte/src/test/column-ops.test.ts` — covers ADV-05, ADV-07, ADV-09
- [ ] `packages/core/src/types.ts` — add `aggregate` field to `ColumnDefinition` (Wave 0 type change)
- [ ] `packages/svelte/src/lib/types.ts` — add `ProcessedGroupRow` type (Wave 0 type change)

---

## Sources

### Primary (HIGH confidence)
- `packages/svelte/src/lib/Table.svelte` (existing) — established `$state`/`$derived`/`$effect` patterns; virtualizer `$effect` + `store.subscribe` + cleanup pattern; existing `colname`/`rowdata` compat shim
- `packages/svelte/src/lib/TableHeader.svelte` (existing) — existing `{#each columns as col (col.key)}` loop; `onkeydown`/`onclick` Svelte 5 syntax; current sticky `<th>` CSS (`position: sticky; top: 0; z-index: 1`)
- `packages/svelte/src/lib/TableBody.svelte` (existing) — event delegation pattern; virtual/non-virtual dual render modes; `focusedCell` roving tabindex
- `packages/core/src/types.ts` (existing) — `ColumnDefinition` already has `pinned`, `hideable`, `minWidth`, `maxWidth`; `ResolvedColumn` extends it
- `packages/svelte/package.json` — `@tanstack/svelte-virtual: 3.13.23` already installed; no new dependencies needed
- `.planning/phases/04-virtual-scrolling-performance/04-RESEARCH.md` — virtualizer creation pattern; `$effect` cleanup; `measure()` method on virtualizer instance; `contain: paint` on `<td>` clips overflow content
- MDN Web API — Pointer Events: `setPointerCapture`, `releasePointerCapture` — available in all modern browsers; pointer capture ensures `pointermove` fires even after pointer leaves element
- MDN Web API — HTML Drag and Drop: `dragstart`, `dragover` (must `preventDefault()`), `drop`, `dragend` events; `dataTransfer.setData`/`getData`
- MDN CSS — `position: sticky`: requires no `overflow: hidden/auto` ancestor between sticky element and scroll container; z-index layering behavior
- MDN JavaScript — `JSON.stringify`: `Set` and `Map` serialize to `"{}"` without custom replacer

### Secondary (MEDIUM confidence)
- MDN CSS Containment — `contain: paint` on `.tc-td` clips descendants at border-box (confirmed from Phase 4 research); resize handle on `<th>` is unaffected
- Svelte 5 documentation — `$bindable()` rune for two-way bindable props; `$effect` cleanup function pattern (return a function from `$effect` to run on re-run and unmount)
- CSS `clip-path: inset()` as alternative to `overflow: hidden` for border-radius clipping — does not establish a sticky-breaking overflow context

### Tertiary (LOW confidence)
- `clip-path: inset(0 round 0.75rem)` browser support on all three Playwright targets (Chromium, Firefox, WebKit): Based on caniuse data (> 97% support as of 2025); should be verified in Playwright tests across all three browsers
- Virtualizer `measure()` API available on the subscriber value `v`: Confirmed by examining the @tanstack/svelte-virtual source in Phase 4 research; `v.measure()` is a method on `SvelteVirtualizer`. Verify during implementation — if `measure()` is not available directly on `v`, it may need to be accessed via `v.options.getScrollElement()` or via the internal `_unstable_resetElement()` API.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all dependencies already installed and proven in Phase 4
- Architecture: HIGH — all patterns derived from existing Phase 3/4 codebase conventions; pointer/drag APIs verified against MDN specs
- Pitfalls: HIGH (`overflow: hidden` sticky interaction is a well-documented CSS behavior; `Set`/`Map` JSON issue is spec-level fact) / MEDIUM (virtualizer `measure()` API access — should be verified at implementation)

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable libraries, no new package version dependency; 30-day window)
