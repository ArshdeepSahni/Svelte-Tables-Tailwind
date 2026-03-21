# Phase 4: Virtual Scrolling + Performance - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning
**Mode:** Auto (all decisions selected by Claude with recommended defaults)

<domain>
## Phase Boundary

Replace the current DOM-rendering-all-rows approach with `@tanstack/virtual` row virtualization so the table handles 100,000+ rows at 60fps. Add Web Worker sort for large datasets. Add column virtualization for wide tables. Enforce CSS containment. Prove all performance targets with Playwright benchmarks.

**Fixed scope:** PERF-01 through PERF-07

</domain>

<decisions>
## Implementation Decisions

### Virtual Scrolling Architecture

- **Virtualizer:** `@tanstack/virtual` 3.x — framework-agnostic, ~4KB gzip, already planned. Does NOT require TanStack Table.
- **Integration point:** Table.svelte owns the row virtualizer. TableBody.svelte receives `virtualItems` (array of `{ index, start, size, lane }`) instead of the raw `visibleRows` slice.
- **State ownership:** `const rowVirtualizer = createVirtualizer({ count: sortedRows.length, getScrollElement: () => scrollEl, estimateSize: () => rowHeight, overscan: 5 })` — called in a `$derived.by()` block. `rowVirtualizer.getVirtualItems()` gives the items to render.
- **Total height spacer:** A single `<div style="height: {rowVirtualizer.getTotalSize()}px; position: relative;">` wraps all rendered rows, giving the browser the correct scrollbar.
- **Row positioning:** Each virtual row uses `style="position: absolute; top: 0; left: 0; width: 100%; transform: translateY({item.start}px)"` — this is the standard `@tanstack/virtual` pattern.
- **Pagination removal:** Phase 3 pagination (`currentPage`, `totalPages`, `TableFooter`) stays available but is disabled when virtual scrolling is active (determined by `data.length > pageSize` threshold — when virtual scrolling kicks in, pagination is hidden and full `sortedRows` is used).
- **Virtualization threshold:** Activate virtual scrolling automatically when `sortedRows.length > 200`. Below 200 rows, render all rows normally (no virtual overhead). Threshold configurable via `virtualizeAt` prop (default: 200).

### Scroll Container

- **Element:** The `div.tc-table-scroll` in Table.svelte gains a fixed height via CSS variable `--tc-virtual-height` (default: `600px`).
- **When active:** `overflow-y: auto` applied to `tc-table-scroll` when virtualizing (class `tc-table-scroll--virtual`). When not virtualizing, `overflow-y: visible` (current behavior).
- **`<table>` element:** Stays as a semantic `<table>`. The `<tbody>` content is wrapped in the height spacer div.
- **Sticky header:** `<thead>` stays `position: sticky; top: 0` — this works correctly when the scroll happens on the `tc-table-scroll` container (not the window).
- **Horizontal scroll:** `overflow-x: auto` is preserved. The scroll container handles both axes independently.
- **Scroll element ref:** `bind:this={scrollEl}` on `div.tc-table-scroll` — this reference is passed to `createVirtualizer`.

### Row Height Strategy

- **Fixed height in Phase 4:** All rows have `height: var(--tc-row-height, 48px)` applied explicitly. The virtualizer uses `estimateSize: () => rowHeight` where `rowHeight = 48` (read from CSS variable at init).
- **Why fixed:** O(1) scroll position calculation; dynamic row height (ResizeObserver + prefix-sum) deferred to Phase 6 or v3.
- **No `auto`:** `height: auto` on `<tr>` breaks the virtualizer's position calculations.
- **CSS custom property:** `--tc-row-height` allows the consumer to change row height; the Svelte component reads this at mount via `getComputedStyle`.

### CSS Containment

- **Rows:** `contain: layout style` on `.tc-tr` — prevents layout recalculation from cascading to sibling rows.
- **Cells:** `contain: layout style paint` on `.tc-td` — prevents paint from propagating outside the cell.
- **Why these values:** `strict` containment breaks `position: sticky` on headers; the selected values give 90% of the performance benefit without breaking stickiness.
- **Implementation:** Added to `TableBody.svelte` `<style>` block in addition to existing styles (no removal).

### Event Delegation

- **Current state:** Phase 3 already has row-level `onclick` handlers — but these are on `<tr>` elements (one listener per row = 100k listeners for 100k rows).
- **Phase 4 change:** Move `onclick` to the `<tbody>` container (single delegated listener). Use `event.target.closest('[data-row]')` to identify the row. `data-row={rowIndex}` attribute on each `<tr>`.
- **Result:** 1 event listener total on `<tbody>`, regardless of dataset size.
- **Keyboard nav:** Keyboard handlers also move to `<tbody>` delegation using `data-col` attributes on `<td>`.

### Web Worker Sort

- **Trigger:** Only when `sortedRows.length > 10_000` AND sort is active. Below 10k rows, main-thread sort is fast enough.
- **Implementation:** `packages/svelte/src/lib/sort.worker.ts` — a standalone Web Worker file that accepts `{ data: unknown[], key: string, dir: 'asc' | 'desc' }` and posts back `{ sorted: unknown[] }`.
- **SSR guard:** `if (typeof Worker !== 'undefined')` — falls back to synchronous main-thread sort in SSR environments.
- **Svelte integration:** Worker created once in a `$effect` with cleanup. Sort result updates `sortedRows` via `$state()`.
- **Loading indicator:** While Worker sort is pending, `sortLoading = true` state adds `aria-busy="true"` to the header and a subtle loading indicator.
- **Worker file bundling:** Vite handles `.worker.ts` files automatically with `?worker` suffix or `new Worker(new URL(...))` pattern.

### Column Virtualization

- **Threshold:** Activates automatically when `resolvedColumns.length > 20`.
- **Virtualizer:** Second `@tanstack/virtual` instance for columns — `columnVirtualizer = createVirtualizer({ count: resolvedColumns.length, ... })`.
- **Fixed column width:** Columns use a default width of 150px (configurable via `minWidth`/`maxWidth` in `ColumnDefinition`). Phase 4 uses estimated sizes.
- **Header + body sync:** Both `TableHeader` and `TableBody` receive the same `columnVirtualItems` to ensure column alignment.
- **Below threshold:** All columns rendered normally (current Phase 3 behavior).

### Playwright Performance Benchmarks

These are the acceptance criteria for Phase 4. All must pass in CI:

1. **Initial render < 200ms:** `performance.measure()` from navigation start to first `tbody tr` in DOM — 100k row dataset.
2. **60fps scroll:** Playwright's `page.evaluate()` measuring actual frame timestamps during programmatic scroll — no frame should exceed 16.67ms.
3. **Worker sort < 50ms:** Measure time from sort click to `aria-sort` attribute update on header — 100k row dataset.
4. **DOM row count:** At any scroll position, `document.querySelectorAll('tbody tr').length < 60` — confirms virtual scrolling is active (not rendering all 100k rows).
5. **CSS containment:** `getComputedStyle(tr).contain` includes `'layout'` — confirms containment is applied.

### Integration with Phase 3 State Pipeline

The Phase 3 reactive pipeline in Table.svelte:
```
effectiveData → resolvedColumns → processedRows → filteredRows → sortedRows → visibleRows → TableBody
```

Phase 4 changes:
- `sortedRows` feeds into the virtualizer (not into a `visibleRows` slice)
- The virtualizer's `getVirtualItems()` replaces the `sortedRows.slice(...)` pagination
- `TableFooter` (pagination) hides when virtualizing
- A `scrollEl` ref connects the scroll container to the virtualizer

### `@tablecraft/core` changes

No changes to `@tablecraft/core` in Phase 4 — the virtualizer, Worker, and CSS changes are all in `@tablecraft/svelte`. The core engine's `processRows()` still processes ALL rows; the virtualizer selects which to display.

### Claude's Discretion

- Exact Playwright benchmark setup (script vs fixture)
- Whether to use `@tanstack/virtual`'s `windowVirtualizer` or `virtualizer` with scroll element
- Exact `overscan` value (5 recommended as a starting point)
- Worker pool management (single worker vs worker per sort)
- Whether to expose `virtualizeAt` prop or auto-detect only

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 3 Components (being modified in Phase 4)
- `packages/svelte/src/lib/Table.svelte` — owns reactive pipeline; Phase 4 adds virtualizer + Worker sort here
- `packages/svelte/src/lib/TableBody.svelte` — receives virtual items; CSS containment + event delegation added here
- `packages/svelte/src/lib/TableHeader.svelte` — column virtualization affects this; sort loading state added
- `packages/svelte/src/lib/TableFooter.svelte` — hidden when virtualizing (pagination disabled above threshold)

### Planning
- `.planning/PROJECT.md` — constraints: < 50KB gzipped, 100k+ rows, 60fps
- `.planning/REQUIREMENTS.md` — PERF-01 through PERF-07 scope
- `.planning/ROADMAP.md` — Phase 4 success criteria (5 Playwright-verifiable benchmarks)

### Research
- `.planning/research/ARCHITECTURE.md` — Virtual scrolling strategy; `@tanstack/virtual` integration; CSS containment; event delegation
- `.planning/research/PITFALLS.md` — Performance pitfalls: re-render cascade, event listener accumulation, `contain: strict` breaking sticky

### Prior Phase Context
- `.planning/phases/03-svelte-5-component-zero-config-api/03-CONTEXT.md` — State pipeline decisions (carry-forward); `processedRows`, `sortedRows`, `visibleRows` definitions
- `.planning/phases/02-core-engine-type-inference-renderer-registry/02-CONTEXT.md` — Engine stateless architecture (carry-forward)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Table.svelte`: `sortedRows` $derived is the virtualizer's input data source; `tc-table-scroll` div is the scroll element. Lines ~236-240 contain the current `visibleRows` slice and `currentPage` logic that Phase 4 replaces.
- `TableBody.svelte`: `visibleRows` prop becomes `virtualItems` in Phase 4; the `{#each visibleRows}` block becomes `{#each virtualItems}`. The `data-skeleton` attribute pattern can be reused.
- Phase 3 CSS containment: `contain: layout style` on `.tc-tr` and `contain: layout style paint` on `.tc-td` — these are new additions in Phase 4, not carried from Phase 3.

### Established Patterns
- **`$state()` + `$derived.by()`** — maintain the same reactive pipeline pattern from Phase 3
- **Svelte 5 `$effect()` with cleanup** — `return () => cleanup()` pattern already used in Table.svelte for engine init; same pattern for Worker lifecycle
- **`bind:this`** — already used in Checkbox.svelte for DOM refs; same pattern for `scrollEl`
- **`data-*` attributes** — `data-skeleton`, `data-row`, `data-col` — already established in Phase 3

### Integration Points
- `Table.svelte` line ~300: `<div class="tc-table-scroll">` — add `bind:this={scrollEl}` + `class:tc-table-scroll--virtual={isVirtualizing}`
- `Table.svelte` line ~237: `const totalPages = $derived(...)` + `const visibleRows = $derived(...)` — replace with virtualizer when `isVirtualizing`
- `TableBody.svelte` line ~118: `{#each visibleRows as processedRow, rowIndex}` — replace with `{#each virtualItems as item}` when virtualizing
- `packages/svelte/package.json` — add `@tanstack/virtual` to dependencies

</code_context>

<specifics>
## Specific Ideas

- The virtualizer container pattern: `<div style="height: {total}px; position: relative;">` with `<tr style="position: absolute; top: 0; width: 100%; transform: translateY({item.start}px)">` — this is the exact @tanstack/virtual recommended pattern for table virtualization
- Worker sort fallback: if Worker initialization fails (e.g., CSP blocks it), silently fall back to main-thread sort — never throw to the user
- The Playwright benchmark should generate test data programmatically with `Array.from({ length: 100_000 }, (_, i) => ({ id: i, name: ..., ... }))` — not load from a fixture file

</specifics>

<deferred>
## Deferred Ideas

- Dynamic row heights (ResizeObserver + prefix-sum) — Phase 6 or v3
- Window-level virtualization (not scroll-element-level) — Phase 6 consideration
- Incremental rendering / React concurrent-style scheduling — future
- Worker pool for parallel column processing — future
- Canvas rendering for ultra-scale (1M+ rows) — Phase 8 or v3

</deferred>

---

*Phase: 04-virtual-scrolling-performance*
*Context gathered: 2026-03-21*
