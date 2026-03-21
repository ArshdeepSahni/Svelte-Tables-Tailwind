# Phase 4: Virtual Scrolling + Performance — Research

**Researched:** 2026-03-21
**Domain:** Virtual scrolling (@tanstack/svelte-virtual 3.x), Web Workers, CSS containment, Playwright performance benchmarking
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Virtual Scrolling Architecture**
- Virtualizer: `@tanstack/virtual` 3.x — framework-agnostic, ~4KB gzip. Does NOT require TanStack Table.
- Integration point: Table.svelte owns the row virtualizer. TableBody.svelte receives `virtualItems` instead of raw `visibleRows` slice.
- State ownership: `createVirtualizer({ count: sortedRows.length, getScrollElement: () => scrollEl, estimateSize: () => rowHeight, overscan: 5 })` — called in a `$derived.by()` block. `rowVirtualizer.getVirtualItems()` gives the items to render.
- Total height spacer: `<div style="height: {rowVirtualizer.getTotalSize()}px; position: relative;">` wraps all rendered rows.
- Row positioning: `style="position: absolute; top: 0; left: 0; width: 100%; transform: translateY({item.start}px)"` — BUT for semantic `<table>`, this must be adapted (see Architecture Patterns below).
- Pagination removal: TableFooter hidden when virtual scrolling is active.
- Virtualization threshold: Activate when `sortedRows.length > 200`; configurable via `virtualizeAt` prop (default: 200).

**Scroll Container**
- Element: `div.tc-table-scroll` gains fixed height via `--tc-virtual-height` (default: `600px`).
- When active: `overflow-y: auto` on `tc-table-scroll`. Class `tc-table-scroll--virtual`.
- `<table>` stays semantic. `<tbody>` content wrapped in height spacer div.
- Sticky header: `<thead>` stays `position: sticky; top: 0` — works when scroll is on the container div.
- `scrollEl` ref: `bind:this={scrollEl}` on `div.tc-table-scroll`.

**Row Height Strategy**
- Fixed 48px. `estimateSize: () => rowHeight` where `rowHeight = 48`.
- `height: var(--tc-row-height, 48px)` on rows explicitly.
- No dynamic row heights in Phase 4 (deferred to Phase 6+).

**CSS Containment**
- Rows: `contain: layout style` on `.tc-tr`
- Cells: `contain: layout style paint` on `.tc-td`
- Added to TableBody.svelte `<style>` block.

**Event Delegation**
- `onclick` moves to `<tbody>` container. `event.target.closest('[data-row]')`.
- `data-row={rowIndex}` on each `<tr>`. `data-col` on each `<td>`.
- Keyboard handlers also delegated via `<tbody>`.

**Web Worker Sort**
- Trigger: `sortedRows.length > 10_000` AND sort is active.
- File: `packages/svelte/src/lib/sort.worker.ts`
- SSR guard: `if (typeof Worker !== 'undefined')`.
- Worker created once in `$effect` with cleanup.
- Loading: `sortLoading = true` → `aria-busy="true"` on header.

**Column Virtualization**
- Threshold: `resolvedColumns.length > 20`.
- Second `createVirtualizer` instance for columns.
- Fixed column width 150px default.
- Both TableHeader and TableBody receive same `columnVirtualItems`.

**Playwright Benchmarks (Acceptance Criteria)**
1. Initial render < 200ms (100k rows)
2. 60fps scroll (no frame > 16.67ms)
3. Worker sort < 50ms
4. DOM row count < 60 at any scroll position
5. `getComputedStyle(tr).contain` includes `'layout'`

**Phase 3 Pipeline**
- `sortedRows` feeds the virtualizer (replaces `visibleRows` slice)
- `@tablecraft/core` unchanged — virtualizer, Worker, CSS changes in `@tablecraft/svelte` only

### Claude's Discretion
- Exact Playwright benchmark setup (script vs fixture)
- Whether to use `@tanstack/virtual`'s `windowVirtualizer` or `virtualizer` with scroll element
- Exact `overscan` value (5 recommended as starting point)
- Worker pool management (single worker vs worker per sort)
- Whether to expose `virtualizeAt` prop or auto-detect only

### Deferred Ideas (OUT OF SCOPE)
- Dynamic row heights (ResizeObserver + prefix-sum) — Phase 6 or v3
- Window-level virtualization — Phase 6 consideration
- Incremental rendering / React concurrent-style scheduling — future
- Worker pool for parallel column processing — future
- Canvas rendering for ultra-scale (1M+ rows) — Phase 8 or v3
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PERF-01 | `@tanstack/virtual` row virtualization — ~30 DOM rows regardless of dataset size | `@tanstack/svelte-virtual` 3.13.23 Svelte store API; table translateY positioning pattern |
| PERF-02 | Fixed 48px row height, configurable via `--tc-row-height`, O(1) scroll calculation | `estimateSize: () => 48` in createVirtualizer; getComputedStyle at mount for CSS var |
| PERF-03 | CSS containment — `contain: layout style` on rows, `contain: layout style paint` on cells | MDN verified: layout+style safe for siblings; paint clips overflow on cells (known tradeoff) |
| PERF-04 | Single delegated event listener on container using `data-row`/`data-col` | `event.target.closest('[data-row]')` pattern; replaces per-row onclick handlers |
| PERF-05 | Playwright E2E: 100k rows < 200ms paint, 60fps scroll | Playwright webServer + page.evaluate() + performance.now() + rAF frame counting |
| PERF-06 | Column virtualization when columns > 20 | Second createVirtualizer instance; both header and body receive columnVirtualItems |
| PERF-07 | Web Worker sort for 100k rows < 50ms, non-blocking | Vite `new Worker(new URL(...), {type:'module'})` pattern; SSR guard; $effect lifecycle |
</phase_requirements>

---

## Summary

Phase 4 integrates `@tanstack/svelte-virtual` 3.x (the Svelte-specific package, not the vanilla `@tanstack/virtual`) into the existing Phase 3 component pipeline. The key integration insight is that `@tanstack/svelte-virtual` returns a **Svelte store** (`Readable<SvelteVirtualizer>`), not a plain object — components subscribe with the `$` prefix. In Svelte 5, Svelte 4 stores remain fully compatible via the `$store` auto-subscription syntax, so no rune conversion is needed for the virtualizer itself.

The critical technical constraint for semantic `<table>` virtualization is the **translateY offset formula**: unlike div-based lists where items can use `position: absolute; top: item.start`, table `<tr>` elements live in normal document flow inside `<tbody>`. The official TanStack React table example uses `transform: translateY(virtualRow.start - index * virtualRow.size)` to compensate for each row's natural document-flow offset. This is the pattern to use.

Web Worker sort uses Vite's standard `new Worker(new URL('./sort.worker.ts', import.meta.url), { type: 'module' })` pattern with a `typeof Worker !== 'undefined'` SSR guard. The Playwright benchmarks need a `webServer` configuration pointing at a dev Vite server that serves a test harness page with 100k rows — `page.evaluate()` with `performance.now()` and `requestAnimationFrame` timestamps gives FPS data without a headless GPU.

**Primary recommendation:** Use `@tanstack/svelte-virtual` (not `@tanstack/virtual`) for the Svelte store integration. Apply the `translateY(start - index * size)` formula for semantic table row positioning. Keep CSS containment as decided (`contain: layout style` on rows, `contain: layout style paint` on cells) — `contain: paint` on cells will clip any overflowing tooltips but there are none in the current Phase 3 component.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tanstack/svelte-virtual` | 3.13.23 | Row and column virtualization, Svelte store API | Official Svelte adapter for TanStack Virtual; returns `Readable` store; supports Svelte 3/4/5 |
| `@tanstack/virtual-core` | 3.13.23 | Peer dep of svelte-virtual; the core Virtualizer class | Provides `VirtualizerOptions`, `VirtualItem` types |

**Note:** Do NOT install `@tanstack/virtual` (the re-export barrel). Install `@tanstack/svelte-virtual` directly. It depends on `@tanstack/virtual-core` internally.

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@playwright/test` | 1.50.1 (already installed) | E2E performance benchmarks | Already in devDependencies at root; use for PERF-05 acceptance tests |
| `vitest` | 4.1.0 (already installed) | Unit tests for Worker sort logic, virtualizer threshold logic | Already in devDependencies; jsdom cannot run Workers so Playwright is needed for Worker tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@tanstack/svelte-virtual` | `svelte-virtual-list` | svelte-virtual-list is Svelte 4 only, no column virtualization, no scroll element control |
| `@tanstack/svelte-virtual` | `@tanstack/virtual` + manual $effect | @tanstack/svelte-virtual IS the right adapter; manual integration is duplicating what it does |
| Web Worker for sort | `requestIdleCallback` sort | Worker is truly non-blocking; rIC still blocks if the sort chunk is large |

**Installation:**
```bash
pnpm --filter @tablecraft/svelte add @tanstack/svelte-virtual
```

**Version verification (2026-03-21):**
- `@tanstack/svelte-virtual`: 3.13.23 (verified via npm registry)
- `@tanstack/virtual-core`: 3.13.23 (same version, installed as transitive dep)

---

## Architecture Patterns

### Recommended Project Structure
```
packages/svelte/src/lib/
├── Table.svelte           # Phase 4: add virtualizer, scrollEl ref, Worker sort, isVirtualizing
├── TableBody.svelte       # Phase 4: change visibleRows→virtualItems, CSS containment, event delegation
├── TableHeader.svelte     # Phase 4: column virtualization + sort loading state (aria-busy)
├── TableFooter.svelte     # Phase 4: hidden when isVirtualizing (no changes to component itself)
├── sort.worker.ts         # Phase 4: NEW — Web Worker sort implementation
└── types.ts               # Phase 4: add VirtualItem type re-export or local type
```

### Pattern 1: @tanstack/svelte-virtual Store Integration

`@tanstack/svelte-virtual` returns a Svelte 4 `Readable` store. In Svelte 5, stores remain compatible — use `$store` auto-subscription.

**Setup in Table.svelte:**
```typescript
// Source: github.com/TanStack/virtual/blob/main/packages/svelte-virtual/src/index.ts
import { createVirtualizer } from '@tanstack/svelte-virtual';

// scrollEl is bound via bind:this on the scroll container div
let scrollEl = $state<HTMLDivElement | null>(null);

// Virtualizer store — re-creates when sortedRows length or scrollEl changes
const rowVirtualizerStore = $derived.by(() => {
  if (!scrollEl || !isVirtualizing) return null;
  return createVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: sortedRows.length,
    getScrollElement: () => scrollEl,
    estimateSize: () => rowHeight,   // rowHeight = 48 (read from CSS var at mount)
    overscan: 5,
  });
});

// Reactive virtual items — $store syntax subscribes to the Svelte store
// In Svelte 5, $store auto-subscription is still valid syntax
const virtualItems = $derived(rowVirtualizerStore ? $rowVirtualizerStore.getVirtualItems() : []);
const totalSize = $derived(rowVirtualizerStore ? $rowVirtualizerStore.getTotalSize() : 0);
```

**Important:** `$derived.by()` cannot directly subscribe to a Svelte store with `$`. Store subscription in `$derived` requires either passing the store to a child that uses `$store`, or using a `$effect` to mirror store state into `$state`. Recommended pattern: pass the store directly to TableBody and let the store auto-subscription happen there.

**Alternative pattern (simpler):** Use a `$state` variable updated via `$effect`:
```typescript
let virtualItems = $state<VirtualItem[]>([]);
let totalSize = $state(0);

$effect(() => {
  if (!scrollEl || !isVirtualizing) return;
  const virtualizer = createVirtualizer({ ... });
  const unsub = virtualizer.subscribe((v) => {
    virtualItems = v.getVirtualItems();
    totalSize = v.getTotalSize();
  });
  return unsub;
});
```

### Pattern 2: Semantic Table Row Positioning

Standard virtualizer docs show `position: absolute; top: item.start` for div-based lists. For semantic `<table>`, `<tr>` elements are in normal document flow — `position: absolute` removes them from table layout entirely. The official TanStack table example uses **translateY with flow-offset compensation**:

```typescript
// Source: github.com/TanStack/virtual/blob/main/examples/react/table/src/main.tsx
// Adapted for Svelte:
{#each virtualItems as item, index}
  {@const row = sortedRows[item.index]}
  <tr
    data-row={item.index}
    style="height: {item.size}px; transform: translateY({item.start - index * item.size}px);"
  >
    {#each columns as col, colIndex (col.key)}
      <td data-col={colIndex} class="tc-td">...</td>
    {/each}
  </tr>
{/each}
```

**Why `item.start - index * item.size`:** Each `<tr>` already occupies `index * item.size` pixels from the top of its natural flow position. The virtualizer's `item.start` is the absolute offset from the container top. The translateY must compensate for the natural offset, so the actual translation is `item.start - (natural position) = item.start - index * item.size`.

**Spacer div pattern:** The `<tbody>` must be wrapped in a div that establishes the total scrollable height:
```html
<!-- In Table.svelte, wrapping the table inside the scroll container -->
<div class="tc-table-scroll tc-table-scroll--virtual" bind:this={scrollEl}>
  <div style="height: {totalSize}px; position: relative;">
    <table class="tc-table">
      <TableHeader ... />
      <TableBody virtualItems={virtualItems} ... />
    </table>
  </div>
</div>
```

**Note on `<thead>` sticky:** `position: sticky; top: 0` on `<th>` (inside `<thead>`) works correctly when scroll happens on `.tc-table-scroll`. The `<thead>` is a sibling of `<tbody>` — `contain: layout` on `<tr>` elements inside `<tbody>` does NOT affect sibling `<thead>` elements. Confirmed: MDN states containment only affects the element's own descendants.

### Pattern 3: Web Worker Sort (Vite)

**Worker file** (`sort.worker.ts`):
```typescript
// packages/svelte/src/lib/sort.worker.ts
// Source: https://vite.dev/guide/features.html#web-workers

export interface SortMessage {
  data: Record<string, unknown>[];
  key: string;
  dir: 'asc' | 'desc';
}

export interface SortResult {
  sorted: Record<string, unknown>[];
}

self.addEventListener('message', (e: MessageEvent<SortMessage>) => {
  const { data, key, dir } = e.data;
  const sorted = [...data].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    const d = dir === 'asc' ? 1 : -1;
    if (av == null) return d;
    if (bv == null) return -d;
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * d;
    return String(av).localeCompare(String(bv)) * d;
  });
  self.postMessage({ sorted } satisfies SortResult);
});
```

**Table.svelte Worker integration:**
```typescript
// Source: https://vite.dev/guide/features.html#web-workers
// SSR guard required — Worker not available in SvelteKit SSR
let sortWorker: Worker | null = null;
let sortLoading = $state(false);

$effect(() => {
  // SSR guard
  if (typeof Worker === 'undefined') return;

  sortWorker = new Worker(
    new URL('./sort.worker.ts', import.meta.url),
    { type: 'module' }
  );

  sortWorker.addEventListener('message', (e: MessageEvent<SortResult>) => {
    workerSortedRows = e.data.sorted as ProcessedRow[];
    sortLoading = false;
  });

  return () => {
    sortWorker?.terminate();
    sortWorker = null;
  };
});
```

**Trigger condition** (inside sortedRows derived):
```typescript
const USE_WORKER_THRESHOLD = 10_000;
const useWorker = sortState.key !== null && filteredRows.length > USE_WORKER_THRESHOLD;

// If using worker, post message and return current state (worker updates workerSortedRows)
if (useWorker && sortWorker) {
  sortLoading = true;
  sortWorker.postMessage({ data: filteredRows.map(r => r._original), key: sortState.key, dir: sortState.dir });
  return workerSortedRows.length > 0 ? workerSortedRows : filteredRows; // return stale while loading
}
```

**Note:** `$derived` cannot have side effects (posting to Worker). The Worker trigger must be in a `$effect` that watches `sortState` and `filteredRows`, not in a `$derived`.

### Pattern 4: Column Virtualization

```typescript
// Second virtualizer instance for columns — same API
const colVirtualizerStore = $derived.by(() => {
  if (!scrollEl || resolvedColumns.length <= 20) return null;
  return createVirtualizer<HTMLDivElement, HTMLTableCellElement>({
    count: resolvedColumns.length,
    getScrollElement: () => scrollEl,
    estimateSize: () => 150,  // default column width in px
    horizontal: true,         // REQUIRED for column virtualization
    overscan: 3,
  });
});
```

Both `TableHeader` and `TableBody` receive the same `columnVirtualItems` array. Column index in cells references `resolvedColumns[item.index]` instead of iterating all columns.

### Pattern 5: Event Delegation

Replace per-`<tr>` onclick with single `<tbody>` onclick:

```svelte
<!-- TableBody.svelte -->
<tbody
  onkeydown={handleKeyDown}
  onclick={handleBodyClick}
>

<!-- Each <tr> gets data-row attribute instead of onclick -->
<tr data-row={item.index} ...>
  <!-- Each <td> gets data-col attribute -->
  <td data-col={colIndex} ...>
```

```typescript
function handleBodyClick(e: MouseEvent) {
  const tr = (e.target as Element).closest('[data-row]');
  if (!tr) return;
  const rowIndex = Number(tr.getAttribute('data-row'));
  const td = (e.target as Element).closest('[data-col]');
  if (td) {
    const colIndex = Number(td.getAttribute('data-col'));
    const col = columns[colIndex];
    const row = visibleRows[rowIndex]?._original;
    if (row && col) oncellclick?.({ row: row as Row, column: col, value: row[col.key], rowIndex });
  } else {
    const row = visibleRows[rowIndex]?._original;
    if (row) onrowclick?.({ row: row as Row, rowIndex });
  }
}
```

### Anti-Patterns to Avoid

- **`position: absolute` on `<tr>` directly:** Removes the row from table layout. Table cells lose column alignment. Use translateY on in-flow rows.
- **`contain: strict` on rows:** `strict` = `size layout paint style`. `size` containment means the element's size is computed independently of its children — breaks table cell height fitting. Also creates containing block issues.
- **Creating virtualizer in `$derived` without store subscription awareness:** `createVirtualizer` returns a store; calling it in `$derived` creates a new store each render cycle without subscribing. Use `$effect` for lifecycle management.
- **Posting large arrays to Worker via `postMessage` without transfer:** For 100k rows, structured clone of the full `ProcessedRow[]` array (which includes cell descriptors) would be slow. Post only `_original` data objects, not processed rows.
- **`new Worker()` at module level (outside effect):** Will throw in SSR. Always inside `$effect` with `typeof Worker !== 'undefined'` guard.
- **Missing `horizontal: true` for column virtualizer:** Without it, column offsets are calculated vertically. Always set `horizontal: true` for column virtualization.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll position → visible item range | Custom binary search on scroll event | `@tanstack/svelte-virtual` | ResizeObserver integration, overscan, iOS momentum scroll, keyboard scroll, programmatic scroll — all handled |
| Virtual item offset calculation | Manual `scrollTop / rowHeight` math | `virtualizer.getVirtualItems()` | Handles fractional pixels, non-uniform sizes, padding, lane layouts |
| Worker lifecycle in Svelte | Manual Worker creation/cleanup | `$effect(() => { ...; return () => worker.terminate() })` pattern | Svelte 5 effect cleanup handles component unmount correctly |
| Column width measurement | `getBoundingClientRect` on every cell | `estimateSize: () => 150` (fixed Phase 4) | ResizeObserver-based measurement deferred to Phase 6 |
| FPS measurement in Playwright | Custom RAF loop | `page.evaluate(() => new Promise(resolve => { ... rAF counting ... }))` | Built into browser, no external dependency |

**Key insight:** Virtual scrolling has a deceptively large surface area (iOS overscroll, keyboard navigation, programmatic scroll-to-index, ResizeObserver, RTL support, multi-lane layouts). `@tanstack/svelte-virtual` handles all of it for ~4KB gzip.

---

## Common Pitfalls

### Pitfall 1: `contain: layout` on `<tr>` is NOT the source of sticky header breakage

**What goes wrong:** Developers assume `contain: layout` on `<tbody> <tr>` will break `<thead> <th position: sticky>`.
**Why it happens:** MDN says `contain: layout` creates a new containing block. Misread as "this breaks all sticky positioning."
**Reality:** Containment only affects the element's own descendants. `<thead>` is a sibling of `<tbody>`, not a descendant of `<tr>`. Sticky on `<th>` is NOT broken by `contain: layout` on `<tr>` siblings.
**What actually breaks sticky:** `contain: strict` (includes `size`) on an ancestor of the sticky element. Or `overflow: hidden/auto` on an ancestor between the sticky element and the scroll container.
**Prevention:** Use `contain: layout style` on `<tr>` — safe. Avoid `contain: strict` on anything.
**Warning signs:** If sticky header stops scrolling with the viewport, check ancestor `overflow` first.

### Pitfall 2: `contain: paint` on `<td>` clips overflow content

**What goes wrong:** `contain: paint` means descendants don't render outside the element's border-box. Any tooltip, dropdown, or popover attached to a cell that visually overflows the cell will be clipped.
**Why it happens:** `paint` containment intentionally clips. It's a performance primitive, not a layout hint.
**Phase 4 status:** Phase 3 has no cell-level tooltips or dropdowns, so this is safe. Phase 6 (column operations) must revisit `contain: paint` on cells.
**Prevention:** Document the constraint. When Phase 6 adds cell actions/dropdowns, remove `contain: paint` from `.tc-td` or use a portal pattern.
**Warning signs:** Cell content appears cut off at cell boundaries.

### Pitfall 3: Creating the virtualizer in `$derived` doesn't work

**What goes wrong:** `createVirtualizer(...)` is called inside `$derived.by()`. It returns a Svelte store. The store is created fresh on each derivation but never subscribed to inside the derived block, so the component never re-renders when the virtualizer updates (e.g., on scroll).
**Why it happens:** `$derived` is for synchronous value computation, not for store subscriptions.
**How to avoid:** Either (a) create the virtualizer in `$effect` and mirror state to `$state()` variables, or (b) pass the store to a child component where `$store` auto-subscription works.
**Warning signs:** Virtual items don't update on scroll; `console.log($rowVirtualizerStore.getVirtualItems())` always returns the same items.

### Pitfall 4: Web Worker throws in SSR

**What goes wrong:** `new Worker(...)` throws `Worker is not defined` in Node.js/SvelteKit SSR environment.
**Why it happens:** `Worker` is a browser-only global.
**How to avoid:** Always guard: `if (typeof Worker === 'undefined') { /* main-thread fallback */ return; }` at the top of the `$effect` that creates the Worker.
**Warning signs:** SSR build fails with `ReferenceError: Worker is not defined`.

### Pitfall 5: Posting the full `ProcessedRow[]` array to the Worker

**What goes wrong:** `ProcessedRow` includes processed `cells` map with typed descriptors — serialization is slow and large for 100k rows.
**How to avoid:** Post only `_original` data (raw row objects): `{ data: filteredRows.map(r => r._original), key, dir }`. The Worker sorts raw data; Table.svelte re-processes the sorted raw data via `engine.processRows()`.
**Warning signs:** Worker message takes > 200ms just to transfer; sort is slow even for simple columns.

### Pitfall 6: `@tablecraft/svelte` build process — Workers and `@sveltejs/package`

**What goes wrong:** `@sveltejs/package` (the `svelte-package` build tool) copies `src/lib/` to `dist/`. A `.worker.ts` file in `src/lib/` will be copied as-is to `dist/` but is NOT compiled as a Worker by `svelte-package`. Consumers loading the npm package won't have the Worker compiled.
**Why it matters:** The Worker needs to be bundled separately. Vite's Worker bundling only applies during Vite dev/build, not `svelte-package`.
**Resolution:** For Phase 4 (development use only), the Worker compiles correctly via `vite build` in the dev/test context. For the published package, the Worker must be pre-compiled to a separate chunk. This requires configuring `vite.config.ts` in packages/svelte with a `build.rolldownOptions` worker entry, OR using the `?worker&inline` Vite pattern to inline the Worker as a base64 blob in the emitted JS — inline Worker works in any bundler context.
**Recommendation:** Use `?worker&inline` suffix for the production package: `import SortWorker from './sort.worker.ts?worker&inline'` — Vite inlines the Worker as a blob URL, no separate file needed, works without `new URL()` patterns.

---

## Code Examples

Verified patterns from official sources:

### createVirtualizer with Svelte Store

```typescript
// Source: github.com/TanStack/virtual/blob/main/packages/svelte-virtual/src/index.ts
// @tanstack/svelte-virtual returns Readable<SvelteVirtualizer>
import { createVirtualizer } from '@tanstack/svelte-virtual';
import type { SvelteVirtualizer } from '@tanstack/svelte-virtual';

// In Table.svelte script:
let scrollEl = $state<HTMLDivElement | null>(null);
let rowHeight = 48; // read from getComputedStyle at mount

// The virtualizer is a Svelte store
let rowVirtStore = $state<ReturnType<typeof createVirtualizer> | null>(null);
let virtualItems = $state<ReturnType<ReturnType<typeof createVirtualizer>['getVirtualItems']>>([]);
let totalVirtualSize = $state(0);

$effect(() => {
  if (!scrollEl || !isVirtualizing) {
    rowVirtStore = null;
    return;
  }
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

  return unsub; // Svelte $effect cleanup
});
```

### Semantic Table Row Positioning

```svelte
<!-- Source: github.com/TanStack/virtual/blob/main/examples/react/table/src/main.tsx (adapted for Svelte) -->
<!-- In Table.svelte template: -->
<div class="tc-table-scroll" class:tc-table-scroll--virtual={isVirtualizing} bind:this={scrollEl}>
  {#if isVirtualizing}
    <div style="height: {totalVirtualSize}px; position: relative;">
      <table class="tc-table" role="grid" ...>
        <TableHeader {columns} ... />
        <TableBody {virtualItems} {sortedRows} {columns} ... />
      </table>
    </div>
  {:else}
    <table class="tc-table" role="grid" ...>
      <TableHeader {columns} ... />
      <TableBody visibleRows={visibleRows} {columns} ... />
    </table>
  {/if}
</div>
```

```svelte
<!-- In TableBody.svelte — virtual rendering path: -->
{#each virtualItems as item, index}
  {@const processedRow = sortedRows[item.index]}
  {@const row = processedRow._original}
  <tr
    class="tc-tr"
    data-row={item.index}
    role="row"
    style="height: {item.size}px; transform: translateY({item.start - index * item.size}px);"
  >
    {#each columns as col, colIndex}
      <td class="tc-td" data-col={colIndex} role="gridcell">
        <Cell descriptor={processedRow.cells[col.key] ?? { kind: 'text', value: '' }} />
      </td>
    {/each}
  </tr>
{/each}
```

### Web Worker Sort (Vite Module Worker)

```typescript
// packages/svelte/src/lib/sort.worker.ts
interface SortMessage {
  data: Record<string, unknown>[];
  key: string;
  dir: 'asc' | 'desc';
}

self.addEventListener('message', (e: MessageEvent<SortMessage>) => {
  const { data, key, dir } = e.data;
  const sorted = [...data].sort((a, b) => {
    const av = a[key], bv = b[key];
    const d = dir === 'asc' ? 1 : -1;
    if (av == null) return d;
    if (bv == null) return -d;
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * d;
    return String(av).localeCompare(String(bv)) * d;
  });
  self.postMessage({ sorted });
});
```

```typescript
// In Table.svelte — Worker creation in $effect
// Source: https://vite.dev/guide/features.html#web-workers
$effect(() => {
  if (typeof Worker === 'undefined') return; // SSR guard
  const worker = new Worker(
    new URL('./sort.worker.ts', import.meta.url),
    { type: 'module' }
  );
  worker.addEventListener('message', (e: MessageEvent<{sorted: Record<string, unknown>[];}>) => {
    // re-wrap sorted originals into ProcessedRow via engine
    workerSortedRows = engine.processRows(e.data.sorted, resolvedColumns);
    sortLoading = false;
  });
  sortWorker = worker;
  return () => { worker.terminate(); sortWorker = null; };
});
```

### Playwright Performance Benchmark

```typescript
// e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance benchmarks (PERF-05)', () => {
  const ROWS = 100_000;

  test('initial render < 200ms with 100k rows', async ({ page }) => {
    await page.goto('/bench');
    // Wait for first tbody tr to appear
    const start = Date.now();
    await page.waitForSelector('tbody tr');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(200);
  });

  test('DOM row count < 60 at any scroll position (virtual scrolling active)', async ({ page }) => {
    await page.goto('/bench');
    await page.waitForSelector('tbody tr');
    const count = await page.$$eval('tbody tr', rows => rows.length);
    expect(count).toBeLessThan(60);
  });

  test('scroll maintains 60fps (no frame > 16.67ms)', async ({ page }) => {
    await page.goto('/bench');
    await page.waitForSelector('tbody tr');

    const maxFrameTime = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        const scrollEl = document.querySelector('.tc-table-scroll') as HTMLElement;
        let maxFrame = 0;
        let lastTime = performance.now();
        let frames = 0;

        function onFrame(time: number) {
          const frameTime = time - lastTime;
          if (frameTime > maxFrame) maxFrame = frameTime;
          lastTime = time;
          frames++;
          scrollEl.scrollTop += 200;
          if (frames < 30) requestAnimationFrame(onFrame);
          else resolve(maxFrame);
        }
        requestAnimationFrame(onFrame);
      });
    });

    expect(maxFrameTime).toBeLessThan(16.67);
  });

  test('CSS containment applied to rows', async ({ page }) => {
    await page.goto('/bench');
    await page.waitForSelector('tbody tr');
    const contain = await page.$eval('tbody tr', (tr) =>
      getComputedStyle(tr).contain
    );
    expect(contain).toContain('layout');
  });
});
```

**Playwright webServer config** (playwright.config.ts addition needed):
```typescript
// playwright.config.ts — add webServer for benchmark tests
webServer: {
  command: 'pnpm --filter @tablecraft/svelte dev',
  url: 'http://localhost:5173',
  reuseExistingServer: !process.env.CI,
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `react-window` / `react-virtualized` for React, no Svelte equivalent | `@tanstack/svelte-virtual` 3.x with first-class Svelte adapter | TanStack Virtual 3.0 (2023) | Framework-agnostic core, Svelte store wrapper |
| `scrollTop / itemHeight` manual calculation | `virtualizer.getVirtualItems()` with ResizeObserver internals | TanStack Virtual 3.x | Handles all edge cases including item measurement |
| One Worker per sort operation | Single reusable Worker with `terminate()` on unmount | Best practice | Avoids Worker startup overhead on repeated sorts |
| Inline `onclick` on each `<tr>` (100k listeners) | Delegated `onclick` on `<tbody>` with `closest('[data-row]')` | Modern DOM best practice | O(1) listeners vs O(n) |
| `position: absolute; top: item.start` (breaks table layout) | `transform: translateY(item.start - index * item.size)` | TanStack Virtual table example | Preserves semantic `<table>` layout model |

**Deprecated/outdated:**
- `react-virtual` (v2): Replaced by `@tanstack/react-virtual` 3.x — API changed significantly
- `scrollTop` polling on `setInterval`: Replaced by scroll event + ResizeObserver in virtualizer core
- `?worker` import suffix only: Still supported but `new URL()` pattern is the recommended primary approach per Vite docs (better type inference, works in more bundlers)

---

## Open Questions

1. **`$derived` vs `$effect` for virtualizer creation**
   - What we know: `createVirtualizer` returns a Svelte store; calling it in `$derived` creates a new store but doesn't subscribe to scroll events
   - What's unclear: Whether there's a cleaner Svelte 5 rune-native pattern than the `$effect` + `$state` mirror
   - Recommendation: Use `$effect` with store subscription and `$state` variables — proven pattern, no ambiguity

2. **Worker sort and $derived pipeline interaction**
   - What we know: `$derived` is for pure synchronous computation; Worker sort is async; the Worker result needs to update `sortedRows`
   - What's unclear: Whether the Worker result path (`workerSortedRows`) conflicts cleanly with the `$derived(filteredRows)` pipeline
   - Recommendation: Add `let workerSortedRows = $state<ProcessedRow[]>([])` as a parallel state; the `sortedRows` `$derived` checks `useWorkerSort` flag and returns `workerSortedRows` when the Worker result is ready, otherwise falls back to main-thread sort

3. **Playwright bench page — where does the test fixture page live?**
   - What we know: The current `playwright.config.ts` points `testDir: './e2e'` with no `webServer`. The smoke test is pure JS (no page nav).
   - What's unclear: Whether to add a `apps/bench/` Vite app or a route in a new SvelteKit app
   - Recommendation: Simplest approach — add a `packages/svelte/src/test/bench.html` + `bench.ts` entry point served by the existing Vite dev server in the svelte package. The `playwright.config.ts` `webServer` points to `pnpm --filter @tablecraft/svelte dev`.

4. **Worker inline vs external for published npm package**
   - What we know: `svelte-package` does not compile Workers; external Worker files need separate bundling
   - What's unclear: Whether consumers of `@tablecraft/svelte` will encounter "Worker file not found" errors
   - Recommendation: Use `?worker&inline` in the import to bake the Worker as a base64 blob URL into the main JS bundle. No separate file, works in any bundler. The `?worker&inline` syntax is a Vite-specific feature that's stripped/evaluated at build time.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 (unit) + Playwright 1.50.1 (E2E benchmarks) |
| Config file | `packages/svelte/vitest.config.ts` (unit) + `playwright.config.ts` at root (E2E) |
| Quick run command | `pnpm --filter @tablecraft/svelte test` |
| Full suite command | `pnpm test && pnpm exec playwright test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERF-01 | DOM row count < 60 at any scroll position | Playwright E2E | `pnpm exec playwright test e2e/performance.spec.ts` | ❌ Wave 0 |
| PERF-02 | Row height 48px fixed, virtualizer uses it correctly | Unit (Vitest) | `pnpm --filter @tablecraft/svelte test src/test/virtual.test.ts` | ❌ Wave 0 |
| PERF-03 | `getComputedStyle(tr).contain` includes 'layout' | Playwright E2E | `pnpm exec playwright test e2e/performance.spec.ts` | ❌ Wave 0 |
| PERF-04 | Single onclick listener on tbody, not on each tr | Unit (Vitest) | `pnpm --filter @tablecraft/svelte test src/test/delegation.test.ts` | ❌ Wave 0 |
| PERF-05 | Initial render < 200ms, scroll at 60fps | Playwright E2E | `pnpm exec playwright test e2e/performance.spec.ts` | ❌ Wave 0 |
| PERF-06 | Column count > 20 activates column virtualizer | Unit (Vitest) | `pnpm --filter @tablecraft/svelte test src/test/virtual.test.ts` | ❌ Wave 0 |
| PERF-07 | Worker sort < 50ms for 100k rows | Playwright E2E | `pnpm exec playwright test e2e/performance.spec.ts` | ❌ Wave 0 |

**Note on Worker testing:** jsdom (Vitest environment) does NOT support Web Workers. Worker-related tests must run via Playwright in a real browser. The Worker sort logic itself (the sort algorithm in `sort.worker.ts`) can be unit-tested by importing the sort function separately — extract the sort comparator into a standalone function that the Worker file imports.

### Sampling Rate
- **Per task commit:** `pnpm --filter @tablecraft/svelte test` (Vitest unit, < 10s)
- **Per wave merge:** `pnpm test && pnpm exec playwright test e2e/performance.spec.ts`
- **Phase gate:** All 5 Playwright performance benchmarks green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `e2e/performance.spec.ts` — covers PERF-01, PERF-03, PERF-05, PERF-07
- [ ] `packages/svelte/src/test/virtual.test.ts` — covers PERF-02, PERF-06
- [ ] `packages/svelte/src/test/delegation.test.ts` — covers PERF-04
- [ ] `packages/svelte/src/lib/sort.worker.ts` — the Worker itself (new file)
- [ ] Bench page: `packages/svelte/index.html` and `packages/svelte/src/bench.ts` — required for Playwright tests to have a page to load
- [ ] `playwright.config.ts` update: add `webServer` config pointing to svelte package dev server
- [ ] `packages/svelte/package.json` update: add `@tanstack/svelte-virtual` to dependencies

---

## Sources

### Primary (HIGH confidence)
- `github.com/TanStack/virtual` packages/svelte-virtual/src/index.ts — createVirtualizer returns Readable store; store-based API verified
- `github.com/TanStack/virtual` packages/svelte-virtual/package.json — package name `@tanstack/svelte-virtual`, version 3.13.23, Svelte peer dep `^3.48.0 || ^4.0.0 || ^5.0.0`
- `registry.npmjs.org/@tanstack/svelte-virtual/latest` — version 3.13.23 confirmed (2026-03-21)
- `github.com/TanStack/virtual` examples/react/table — translateY positioning formula `item.start - index * item.size` for semantic table
- `github.com/TanStack/virtual` packages/virtual-core/src/index.ts — VirtualItem fields: `key`, `index`, `start`, `end`, `size`, `lane`
- `vite.dev/guide/features.html#web-workers` — `new Worker(new URL(...), { type: 'module' })` pattern; `?worker&inline` for bundled workers
- `developer.mozilla.org/en-US/docs/Web/CSS/contain` — `contain: layout` does NOT break sticky on sibling elements; `contain: paint` clips overflow content
- `playwright.dev/docs/test-configuration` — `webServer` config: `command`, `url`, `reuseExistingServer`
- `playwright.dev/docs/api/class-page` — `page.evaluate()` for `performance.now()` and rAF frame timing

### Secondary (MEDIUM confidence)
- MDN CSS Using CSS Containment — `contain: layout` on `<tr>` does not affect `<thead> <th>` sticky positioning (sibling containment boundary)
- Playwright performance evaluation pattern — `page.evaluate(() => new Promise(resolve => { rAF counting }))` for FPS measurement

### Tertiary (LOW confidence)
- Worker sort < 50ms claim for 100k rows: Based on typical JS sort benchmarks (native V8 sort); actual measurement needed in CI (Playwright PERF-07 benchmark is the proof)
- `?worker&inline` for published npm package: Recommended based on Vite docs; actual consumer bundler compatibility with inline workers needs validation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — npm registry confirmed `@tanstack/svelte-virtual` 3.13.23; Svelte 5 store compatibility verified
- Architecture: HIGH — translateY formula from official TanStack example; Vite Worker pattern from official Vite docs; CSS containment from MDN spec
- Pitfalls: HIGH (CSS containment behavior from MDN) / MEDIUM (Worker inline pattern for npm package)

**Research date:** 2026-03-21
**Valid until:** 2026-04-20 (stable library, ~30 days)
