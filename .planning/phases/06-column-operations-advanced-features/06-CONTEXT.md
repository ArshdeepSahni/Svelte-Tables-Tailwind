# Phase 6: Column Operations + Advanced Features - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning
**Mode:** Auto (all decisions selected by Claude with recommended defaults)

<domain>
## Phase Boundary

Add column resizing, drag-to-reorder, pinning, visibility toggle, row grouping with aggregate footer, column state persistence to `localStorage`, and density control to `@tablecraft/svelte`. All features integrate with the existing Phase 3/4 reactive pipeline in `Table.svelte` — no new packages required except for the aggregate/grouping logic.

**Fixed scope:** ADV-01 through ADV-09

</domain>

<decisions>
## Implementation Decisions

### Column Resizing (ADV-01)

- **Interaction:** Drag handle — a `<div class="tc-resize-handle">` absolutely positioned on the right edge of each `<th>`. Pointer events: `onpointerdown` starts resize, `pointermove` updates width, `pointerup` ends.
- **Width state:** `colWidths: Map<string, number>` as `$state` in `Table.svelte`. Keys are column keys, values are pixel widths.
- **CSS:** `<th>` and `<td>` get `style="width: {colWidths.get(col.key) ?? col.minWidth ?? 150}px"`. The `<table>` gets `table-layout: fixed` when any custom width is set.
- **Constraints:** `minWidth` and `maxWidth` from `ColumnDefinition` clamp the drag. Default min: 60px, default max: none.
- **ResizeObserver:** NOT used for column resize — only pointer events. ResizeObserver is used for the scroll container height (Phase 4 concern).
- **Column width on resize:** `document.body.style.cursor = 'col-resize'` during drag; reset on `pointerup`. `user-select: none` on `<html>` during drag to prevent text selection.
- **handle appearance:** `|` cursor on hover (via CSS `cursor: col-resize`), 4px wide transparent hit area with 2px visible center line.

### Column Reordering (ADV-02)

- **Interaction:** Native HTML drag-and-drop — `draggable="true"` on each `<th>`. `ondragstart`, `ondragover`, `ondrop` handlers on header cells.
- **State:** `columnOrder: string[]` as `$state` in `Table.svelte` — array of column keys in display order. Initialized from `resolvedColumns` on first inference completion. Updated on drop.
- **No DnD library:** Native HTML drag events only — zero additional dependency.
- **Visual during drag:** `dragoverKey: string | null` as `$state` — the column being dragged over gets a CSS class `tc-th--drag-target` with a left border indicator.
- **Integration with column virtualization:** When column virtualization is active (> 20 columns), reordering is disabled (too complex to reconcile with virtual column indices). This is an acceptable limitation documented in the prop API.
- **Conflict with resize:** Headers have both `draggable` and the resize handle. `ondragstart` is only triggered when the cursor is NOT over the resize handle — check via `event.target`.

### Column Pinning (ADV-03)

- **Implementation:** `position: sticky` on `<th>` and `<td>` for pinned columns. `left: {offset}px` for left-pinned, `right: {offset}px` for right-pinned. Offset is the sum of widths of previously pinned columns.
- **Types field:** `ColumnDefinition.pinned: 'left' | 'right'` is already defined in `packages/core/src/types.ts` (Phase 1). Phase 6 implements the CSS behavior.
- **z-index:** Pinned header cells: `z-index: 3` (above body cells). Pinned body cells: `z-index: 1`. Unpinned cells: `z-index: 0`.
- **Background:** Pinned cells must have explicit `background-color: var(--tc-color-bg)` — otherwise sticky cells are transparent and content shows through during scroll.
- **Shadow:** A subtle `box-shadow: 2px 0 4px rgba(0,0,0,0.08)` on the rightmost left-pinned column and the leftmost right-pinned column to visually separate them from scrollable content.
- **Column virtualization:** When column virtualization is active, pinning is disabled. Same reasoning as reordering.

### Sticky Header (ADV-04)

- **Already implemented:** `<thead>` has `position: sticky; top: 0` from Phase 3. Phase 6 confirms this still works correctly with pinned columns (it does — sticky thead + sticky th are different axes).
- **No additional work required for ADV-04 specifically** — it was already delivered in Phase 3.

### Column Visibility Toggle (ADV-05)

- **State:** `hiddenColumns: Set<string>` as `$bindable($state())` in `Table.svelte`. Exported via `bind:hiddenColumns`.
- **Filtering:** `resolvedColumns` is filtered: `resolvedColumns.filter(c => !hiddenColumns.has(c.key))` before passing to `TableHeader` and `TableBody`. This happens in a `$derived` before the virtualizer.
- **No built-in toggle UI:** The library exposes `bind:hiddenColumns` but does NOT ship a built-in column picker UI. Consumers build their own using the bound state. This keeps the table focused.
- **`hideable` field in ColumnDefinition:** Already defined in Phase 1. Phase 6 respects it: only columns with `hideable !== false` can be added to `hiddenColumns` programmatically.

### Row Grouping (ADV-06)

- **Activation:** `groupBy` prop (string key or array of keys). `null` / omitted = no grouping.
- **Grouping logic:** Happens in a new `$derived.by` step AFTER filter, BEFORE sort. Groups rows by the `groupBy` column value. Each group becomes a group header row + its data rows.
- **Group header row:** A special `ProcessedGroupRow` type — `{ isGroup: true, key: string, label: string, count: number, rows: ProcessedRow[] }`. The `TableBody` renders these as a `<tr class="tc-group-row">` spanning all columns.
- **Collapse/expand:** `collapsedGroups: Set<string>` as `$state`. Click on group header row toggles collapse. When collapsed, child rows are filtered from `visibleRows`.
- **Auto-detect groupable columns:** Columns with inferred type `status` or `badge` (low-cardinality enum types) get a group icon in the header when `groupBy` matches their key — purely cosmetic.
- **Aggregate footer row per group:** When `groupBy` is active, each group can show a summary row with aggregates for numeric columns. Enabled via `showGroupAggregates={true}` prop.

### Aggregate Footer (ADV-07)

- **Global aggregate footer:** `<tfoot>` row below `<tbody>` with aggregate values for numeric columns. Enabled via `showAggregates={true}` prop.
- **Per-column aggregate:** `ColumnDefinition.aggregate: 'sum' | 'avg' | 'count' | 'min' | 'max' | ((values: unknown[]) => string)`. If not set, the footer cell is empty for that column.
- **Computed from filtered rows:** Aggregates run over `filteredRows` (not `sortedRows` or `visibleRows`) — so the footer reflects what the filter shows, not just what's on screen.
- **Rendering:** `<tfoot><tr><td class="tc-aggregate">` per column, using the `number` renderer for formatting where appropriate.

### Column State Persistence (ADV-08)

- **Activation:** `persistKey` prop (string). When set, the table saves and restores state to/from `localStorage`.
- **Persisted state object:**
  ```ts
  {
    colWidths: Record<string, number>;
    sortState: { key: string | null; dir: 'asc' | 'desc' | null };
    filterQuery: string;
    columnOrder: string[];
    hiddenColumns: string[];
    currentPage: number;
  }
  ```
- **Save:** Debounced `$effect` writes to `localStorage.setItem(persistKey, JSON.stringify(state))` after any state change (150ms debounce to avoid thrashing).
- **Load:** In a `$effect` on mount (guarded by `typeof localStorage !== 'undefined'`). Deserializes and applies to all relevant `$state` variables.
- **Version key:** Include `{ v: 1, ...state }` in the persisted object. If version mismatches, ignore saved state (prevents issues after schema changes).
- **SSR guard:** `typeof localStorage !== 'undefined'` before any read/write.
- **`persistKey` changes:** When the prop changes, the old key is NOT cleared. New key is loaded. Document this behavior.

### Density Control (ADV-09)

- **Prop:** `density: 'compact' | 'comfortable' | 'spacious'` (default: `'comfortable'`).
- **Row heights:**
  - `compact`: `--tc-row-height: 32px`
  - `comfortable`: `--tc-row-height: 48px` (current default)
  - `spacious`: `--tc-row-height: 64px`
- **Implementation:** Add `style="--tc-row-height: {rowHeightMap[density]}px"` on the `<div class="tc-table-wrapper">`. The virtualizer already reads `--tc-row-height` via `getComputedStyle` — density changes automatically update the virtualizer.
- **Impact on virtualizer:** When density changes, the virtualizer must remeasure. Trigger by calling `virtualizer.measure()` in a `$effect` that watches `density`.

### Component File Changes

All changes go into `packages/svelte/src/lib/`:
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 3 Components (all being modified)
- `packages/svelte/src/lib/Table.svelte` — existing reactive pipeline; all new state integrates here
- `packages/svelte/src/lib/TableHeader.svelte` — column headers; resize handles + drag-to-reorder added here
- `packages/svelte/src/lib/TableBody.svelte` — rows; group rows + pinned cells added here
- `packages/svelte/src/lib/TableFooter.svelte` — pagination; density hint optional
- `packages/core/src/types.ts` — `ColumnDefinition` already has `pinned`, `hideable`, `minWidth`, `maxWidth`; Phase 6 adds `aggregate` field

### Phase 4 Virtual Scrolling (interactions to be aware of)
- `.planning/phases/04-virtual-scrolling-performance/04-CONTEXT.md` — column virtualization disables reordering and pinning; density changes trigger `virtualizer.measure()`

### Planning
- `.planning/PROJECT.md` — constraint: API accretion gate — every new prop must pass the design document gate
- `.planning/REQUIREMENTS.md` — ADV-01 through ADV-09 scope
- `.planning/ROADMAP.md` — Phase 6 goal and 5 success criteria

### Research
- `.planning/research/PITFALLS.md` — API accretion pitfall (Pitfall 5); every prop addition must pass the design gate

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Table.svelte` `$state()` pattern — all new state follows the same `let x = $state()` pattern already established
- `Table.svelte` `$derived.by()` pipeline — `effectiveData → processedRows → filteredRows → sortedRows → visibleRows`. Phase 6 adds `groupedRows` between `filteredRows` and `sortedRows`.
- `TableHeader.svelte` column header loop — `{#each columns as col (col.key)}` — resize handles and drag attrs added inside this loop
- `packages/core/src/types.ts` `ColumnDefinition` — already has `pinned?: 'left' | 'right'`, `hideable?: boolean`, `minWidth?: number`, `maxWidth?: number` — Phase 6 adds `aggregate?: 'sum' | 'avg' | 'count' | 'min' | 'max' | ((values: unknown[]) => string)`
- Phase 4 virtualizer integration — `colWidths` changes must call `rowVirtualizer.measure()` to recalculate; density changes must also call `measure()`

### Established Patterns
- All new props in `Table.svelte` follow the `Interface Props { ... }` pattern with `$props()` destructuring
- New state always uses `$state()` runes (no `let` without `$state`)
- `$derived.by()` for complex computed values; `$derived` for simple expressions
- `$effect()` for side effects with cleanup (resize listeners, localStorage, pointerup cleanup)
- `bind:` prefix for two-way bindable props (`bind:selectedRows`, `bind:hiddenColumns`)

### Integration Points
- `Table.svelte line ~240`: `const visibleRows = $derived(...)` — `groupedRows` step inserts between `filteredRows` and `sortedRows`
- `Table.svelte line ~300`: scroll container — density `style` attribute added here
- `TableHeader.svelte line ~60`: `{#each columns}` loop — resize handle `<div>` added inside each `<th>`
- `packages/core/src/types.ts` — add `aggregate` field to `ColumnDefinition` interface; add `AggregateFunction` type

</code_context>

<specifics>
## Specific Ideas

- Drag reorder visual: while dragging, the `dragoverKey` column gets `border-left: 3px solid var(--tc-color-primary)` — a clean, minimal indicator
- Resize handle: `position: absolute; right: 0; top: 0; height: 100%; width: 8px; cursor: col-resize; background: transparent` — invisible but wide for easy grabbing; shows a visible `::after` pseudo-element (2px line) on hover
- Persist debounce: 300ms (longer than the 150ms filter debounce to avoid localStorage writes on every resize pixel)
- GroupRow collapse indicator: `▶` when collapsed, `▼` when expanded — simple Unicode, no icon library

</specifics>

<deferred>
## Deferred Ideas

- Column-level search/filter inputs below headers (Phase 7 or v3)
- Multi-column sort (Phase 7 or v3)
- Frozen row (not column) pinning — completely different feature
- Right-click context menu for column operations — fires events, let app handle
- Sub-row / expandable rows — v2 requirements backlog
- Inline cell editing — v2 requirements backlog
- Export CSV/JSON — Phase 7

</deferred>

---

*Phase: 06-column-operations-advanced-features*
*Context gathered: 2026-03-22*
