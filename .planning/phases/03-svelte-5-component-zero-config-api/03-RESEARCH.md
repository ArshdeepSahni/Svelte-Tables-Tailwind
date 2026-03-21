# Phase 3: Svelte 5 Component + Zero-Config API — Research

**Researched:** 2026-03-21
**Domain:** Svelte 5 component authoring, accessibility, @testing-library/svelte, @sveltejs/package
**Confidence:** HIGH (all core patterns verified against live installed packages and official Svelte 5 docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Style philosophy: CSS custom properties (`--tc-*`) only. No Tailwind dependency on the library itself.
- Table layout: Semantic `<table>` element (NOT flexbox/grid). Phase 4 switches for virtual scrolling.
- Header: Sticky (`position: sticky; top: 0`) inside a scrolling container.
- Rows: Alternating via `:nth-child(even)` with `--tc-color-bg-alt`. Hover highlight via `--tc-color-bg-hover`.
- Borders: Horizontal dividers only by default. `bordered` prop adds full cell borders.
- Responsive: `overflow-x: auto` container. No column hiding in Phase 3.
- Density: Fixed 48px row height via `--tc-row-height`. No density prop in Phase 3.
- `striped` boolean prop (default false) for alternating background.
- Cell renderer mapping: each `CellDescriptor` kind maps to specific Svelte markup — NEVER `{@html}` on raw data. Only `{@html descriptor.sanitized}` for the `html` kind.
- Cell rendering uses a `{#if}` chain — no dynamic component resolution.
- Zero-config: `createTableEngine({ data })` called in `$effect()`.
- Inference timing: table renders immediately with text columns, updates reactively after `scheduleIdleWork` resolves.
- Short-form override: `columns={{ avatar: 'image', price: 'currency' }}`.
- Long-form override: full `ColumnDefinition[]` array.
- Sorting: single-column only. Cycles: unsorted → ascending → descending → unsorted.
- Visual indicator: `▲` ascending, `▼` descending. No icon for unsorted.
- `aria-sort` on `<th>` elements.
- Per-column `sortable` boolean (default true). No global sortable prop.
- Global search only (per-column filters are Phase 6). 150ms debounce.
- Filter: right-aligned above table. Hidden via `filterable={false}` (default true).
- Pagination: auto-appears when `data.length > pageSize`. Default pageSize: 50.
- Pagination controls: `|<` First, `<` Prev, `>` Next, `>|` Last. Page text: "Page 2 of 14 (683 rows)".
- Loading: CSS skeleton shimmer on `loading` prop. `aria-busy="true"` on `<table>`.
- Empty state: default "No data" message. `#empty` snippet override.
- Row selection: `selectable` prop. Checkbox-only. Checkbox-first column. `onselect` callback prop. `bind:selectedRows` bindable.
- `indeterminate` set via DOM property in `$effect`.
- WCAG 2.1 AA: `role="grid"`, `<th scope="col">`, `role="gridcell"`, `aria-sort`, `aria-selected`, `aria-colcount`, `aria-rowcount`, `aria-busy`.
- Arrow key navigation between cells in the grid.
- v1 compat: accept `colname`/`rowdata`, call `adaptV1Props()`, `console.warn(...)`.
- `data` prop takes precedence over `rowdata`.
- Component file structure: `Table.svelte`, `Cell.svelte`, `TableHeader.svelte`, `TableBody.svelte`, `TableFooter.svelte`, `Checkbox.svelte`, `SearchInput.svelte`, `types.ts`, `index.ts`.
- Sub-components are internal (not re-exported from `index.ts`).
- All `.svelte` files use `<script lang="ts">`.
- CSS in `<style>` blocks per component. `@sveltejs/package` scopes them.
- Token fallbacks: `var(--tc-color-text, #111827)`.
- `on:select` is Svelte 5 style: `onselect` callback prop, not `on:select` directive.
- WCAG vitest-axe assertions must pass for all rendered states.

### Claude's Discretion

- Exact pixel values for default styles (use `--tc-*` tokens).
- SVG vs Unicode for sort indicators and boolean icons.
- Whether to use Svelte snippets (`{#snippet}`) or sub-components for internal rendering.
- Exact debounce implementation (setTimeout vs a debounce utility).
- CSS class naming convention (BEM vs flat `tc-*` prefix).
- Whether TableHeader/Body/Footer are separate `.svelte` files or `{#snippet}` blocks in Table.svelte.

### Deferred Ideas (OUT OF SCOPE)

- Per-column filter inputs — Phase 6
- Column resizing drag handles — Phase 6
- Column pinning — Phase 6
- Row grouping — Phase 6
- Dense/comfortable/spacious density control — Phase 6
- Row-click to select — Phase 6
- Export CSV — post Phase 7
- Inline editing — v2 requirements
- Sub-rows / expandable rows — v2 requirements
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SVLT-01 | `<Table data={rows} />` zero-config API — auto-derived headers, auto-inferred types | Engine integration pattern via `$effect` + `resolveColumns` two-call strategy |
| SVLT-02 | One-prop type override: short form `{ avatar: 'image' }` and long form `ColumnDefinition[]` | `resolveColumns(data, overrides, inferenceResult)` already handles both; Svelte prop accepts `Record<string, ColumnType> \| ColumnDefinition[]` |
| SVLT-03 | Column sorting — click to cycle unsorted/asc/desc, visual indicator, aria-sort | `$state` sortState, `$derived` for sorted rows, `aria-sort` on `<th>`, onclick handler on header |
| SVLT-04 | Global search filter — single text input, all columns, debounced | `$state` filterQuery, 150ms setTimeout debounce, `$derived` filtered rows fed into sort+paginate pipeline |
| SVLT-05 | Per-column filtering — DEFERRED to Phase 6 (only global search in Phase 3) | N/A |
| SVLT-06 | Pagination — configurable page size, first/prev/next/last, count display | `$state` currentPage, `$derived` visibleRows = paginate(sorted), auto-hide when all fit on one page |
| SVLT-07 | Empty state — configurable message and slot when `data` is empty | `{#if data.length === 0 && !loading}` + `{@render children?.()}` for empty snippet override |
| SVLT-08 | Loading state — skeleton animation on `loading` prop | `aria-busy="true"` on `<table>`, CSS keyframe shimmer on placeholder rows |
| SVLT-09 | Row selection — `selectable` prop, bindable `selectedRows`, select-all checkbox | `$bindable()` rune for selectedRows, `indeterminate` via `bind:this` + `$effect`, `onselect` callback prop |
| SVLT-10 | Responsive — horizontal scroll, no column hiding | `overflow-x: auto` wrapper div; column hiding is Phase 6 |
| SVLT-11 | Keyboard navigation — arrow keys between cells, Tab, Enter/Space | Roving tabindex pattern: `$state` focusedCell `{row, col}`, onkeydown handler updates focusedCell and calls `element.focus()` |
| SVLT-12 | WCAG 2.1 AA — ARIA grid role, headers, sort, selected, busy | Verified pattern: `role="grid"`, `<th scope="col" role="columnheader" aria-sort>`, `<td role="gridcell" aria-selected>`, `aria-colcount`, `aria-rowcount`, `aria-busy` |
| SVLT-13 | Row click and cell click events | `onrowclick` and `oncellclick` callback props with row data payload |
| SVLT-14 | `@sveltejs/package` build produces correct exports map | Already working in Phase 1; dist/ already contains `.svelte` + `.d.ts` files; sub-components placed in `src/lib/` are auto-included |
| SVLT-15 | v1 backward compat — `colname`/`rowdata` → deprecation warning, not error | `adaptV1Props()` from `@tablecraft/core` is implemented; call when `colname` or `rowdata` props detected in Table.svelte |
</phase_requirements>

---

## Key Findings

1. **Engine is stateless by design.** `createTableEngine()` is a pure computation factory. All reactive state (`sortState`, `filterQuery`, `currentPage`, `selectedRows`, `resolvedColumns`, `processedRows`) lives in Svelte `$state()` runes inside the component. The engine is called once to create computation functions; `resolveColumns` and `processRows` are called reactively.

2. **Two-call `resolveColumns` strategy for zero-config inference.** Call `resolveColumns(data)` immediately (returns all-text columns) to render the table without waiting. Then in `$effect`, call `engine.inferSchema(data)` via `requestIdleCallback`, and when it resolves, call `resolveColumns(data, columns, inferenceResult)` to upgrade column types. Assign the result to a `$state` variable; Svelte re-renders only the affected cells.

3. **Svelte 5 has no `createEventDispatcher`.** All component-to-parent communication uses callback props (`onselect`, `onrowclick`, `oncellclick`). These are declared in the `$props()` destructure as optional function props.

4. **`$bindable()` is the correct rune for `bind:selectedRows`.** Declared as `let { selectedRows = $bindable([]) } = $props()`. Parent can use `bind:selectedRows={myArray}` or pass a plain prop value.

5. **`@testing-library/svelte` v5.3.1 is installed and Svelte 5-ready.** Uses `Svelte.flushSync` for event synchronization and `Svelte.tick()` for the `act()` wrapper. All `fireEvent.*` functions are already async and flush Svelte reactivity automatically.

6. **vitest-axe v0.1.0 is on npm** (latest stable). A pre-release `1.0.0-pre.5` exists with fewer dependencies and supports axe-core 4.10.2. Recommend installing `1.0.0-pre.5` as it has fewer bundling issues and is more current.

7. **`position: sticky` on `<thead>` works inside `overflow-x: auto` but sticks to the container's scroll position, not the viewport.** This is the correct behavior for the Phase 3 layout: sticky header visible within the table's scroll region. Requires `top: 0` on `thead` and a height-constrained parent (max-height on the wrapper div) for vertical stickiness to activate.

8. **Slots are legacy in Svelte 5; snippets are the current pattern.** The `#empty` slot override should be implemented as a `children` snippet prop. Use `{@render empty?.()}` where `empty` is a `Snippet` type prop. The old `<svelte:fragment slot="empty">` syntax still works but is deprecated.

9. **`@sveltejs/package` automatically includes all `.svelte` files in `src/lib/` in the dist output.** Sub-components (`Cell.svelte`, `TableHeader.svelte`, etc.) do not need explicit exports in `package.json`; they are compiled alongside `Table.svelte`. Only `Table` needs to be in `index.ts` for the public API.

10. **CSS scoping in `@sveltejs/package` output: Svelte's component-scoped classes ARE preserved.** Each component's `<style>` block generates scoped CSS. The `.svelte` files in dist retain `<style>` blocks; the Svelte compiler at the consumer's build time applies scoping. This means CSS custom properties with `var(--tc-*)` fallbacks work as written.

---

## Svelte 5 State Patterns for Table

### The Data Flow Pipeline

The correct derivation chain for table state is:

```
$state: data (prop, reactive via $props)
$state: sortState = { key: string | null, dir: 'asc' | 'desc' | null }
$state: filterQuery = ''
$state: currentPage = 1
$state: selectedRows: Row[] = []
$state: resolvedColumns: ResolvedColumn[] = []  ← starts as text, upgraded after inference
$state: processedRows: ProcessedRow[] = []       ← derived from resolvedColumns + data

$derived: filteredRows = filter(processedRows, filterQuery)
$derived: sortedRows = sort(filteredRows, sortState, resolvedColumns)
$derived: totalPages = Math.ceil(filteredRows.length / pageSize)
$derived: visibleRows = paginate(sortedRows, currentPage, pageSize)
```

### Why `$state` for processedRows (not `$derived`)

`processedRows` must be `$state` because it gets populated asynchronously: first synchronously with text columns, then again after idle inference. A `$derived` cannot handle two separate assignments from an effect callback.

```typescript
// In Table.svelte <script lang="ts">
let { data = [], columns, ...otherProps }: Props = $props();

// Mutable state upgraded by the two-phase inference pattern
let resolvedColumns = $state<ResolvedColumn[]>([]);
let processedRows = $state<ProcessedRow[]>([]);

// Sorting state
let sortState = $state<{ key: string | null; dir: 'asc' | 'desc' | null }>({
  key: null,
  dir: null,
});

// Filter state
let filterQuery = $state('');

// Pagination state
let currentPage = $state(1);

// Selection state
let { selectedRows = $bindable<Row[]>([]) } = $props();
```

### The Two-Phase Inference Pattern

```typescript
// Source: CONTEXT.md + engine/index.ts API
$effect(() => {
  const engine = createTableEngine({ data, columns });

  // Phase 1: Immediate — render with text columns now
  const textCols = engine.resolveColumns(data, columns ?? undefined);
  resolvedColumns = textCols;
  processedRows = engine.processRows(data, textCols);

  // Phase 2: Async — upgrade after idle inference
  const idleId = requestIdleCallback(() => {
    const schema = engine.inferSchema(data);
    const typedCols = engine.resolveColumns(data, columns ?? undefined, schema);
    resolvedColumns = typedCols;
    processedRows = engine.processRows(data, typedCols);
  });

  return () => cancelIdleCallback(idleId);
});
```

**Key insight:** `$effect` tracks `data` and `columns` as dependencies. When either changes, it re-runs the entire pipeline, cancelling the in-flight idle callback first (via the cleanup return).

**SSR guard:** `requestIdleCallback` is not available in SSR. Wrap with:
```typescript
const schedule = typeof requestIdleCallback !== 'undefined'
  ? requestIdleCallback
  : (cb: () => void) => setTimeout(cb, 1);
```

### `$derived` for Computed Rows

```typescript
// Source: verified against Svelte 5 $derived docs
const filteredRows = $derived.by(() => {
  if (!filterQuery.trim()) return processedRows;
  const q = filterQuery.toLowerCase();
  return processedRows.filter((row) =>
    Object.values(row.cells).some((cell) => {
      const v = 'value' in cell ? String(cell.value) :
                'label' in cell ? cell.label :
                'formatted' in cell ? cell.formatted : '';
      return v.toLowerCase().includes(q);
    })
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

const totalPages = $derived(Math.ceil(filteredRows.length / pageSize));

const visibleRows = $derived(
  sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
);
```

**Pitfall:** `$derived` values are NOT deeply reactive like `$state`. They recalculate when their synchronously-read dependencies change. Always spread (`[...filteredRows].sort(...)`) when sorting to avoid mutating the derived array.

---

## Svelte 5 Event Handling

### Event Syntax (Svelte 5 runes mode)

All DOM event handlers use lowercase `on` prefix as attributes — no `on:` directive syntax:

```svelte
<!-- Correct Svelte 5 syntax -->
<button onclick={handleClick}>Sort</button>
<input oninput={handleInput} />
<tr onkeydown={handleKeyDown}>...</tr>

<!-- Wrong — Svelte 3/4 syntax, not used in runes mode -->
<!-- <button on:click={handleClick}> -->
```

### Custom Events: Callback Props (NOT createEventDispatcher)

`createEventDispatcher` is deprecated in Svelte 5 and not available in runes mode. The replacement is callback props:

```typescript
// In Table.svelte Props interface:
interface Props {
  data: Row[];
  columns?: Record<string, ColumnType> | ColumnDefinition<Row>[];
  onselect?: (event: { rows: Row[]; allSelected: boolean }) => void;
  onrowclick?: (event: { row: Row; rowIndex: number }) => void;
  oncellclick?: (event: { row: Row; column: ResolvedColumn; value: unknown }) => void;
  // ...other props
}

let {
  data = [],
  onselect,
  onrowclick,
  oncellclick,
  ...
}: Props = $props();

// Calling the callback from within the component:
function handleSelectionChange() {
  const allSelected = selectedRows.length === data.length;
  onselect?.({ rows: selectedRows, allSelected });
}
```

Consumer usage (no `on:` prefix needed):
```svelte
<Table data={rows} onselect={handleSelect} />
```

### Debounced Search Input

```typescript
// In SearchInput.svelte
let { onfilter }: { onfilter: (value: string) => void } = $props();
let inputValue = $state('');
let debounceTimer: ReturnType<typeof setTimeout>;

function handleInput(e: Event) {
  inputValue = (e.target as HTMLInputElement).value;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    onfilter(inputValue);
  }, 150);
}
```

**Decision (Claude's Discretion):** Use `setTimeout` directly — no utility needed for a single 150ms debounce. Avoid importing a debounce library for this.

---

## @testing-library/svelte v5 + vitest-axe

### Installed Versions (verified)

| Package | Installed Version | Notes |
|---------|------------------|-------|
| `@testing-library/svelte` | 5.3.1 | Svelte 5 compatible |
| `svelte` | 5.54.0 | Current installed |
| `vitest` | ^4.1.0 (declared) | Root workspace |
| `vitest-axe` | Not installed | Must add |

### Test File Import Pattern

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen, act } from '@testing-library/svelte';
import Table from './Table.svelte';
```

The main import from `@testing-library/svelte` provides everything. The `act()` function is exported from the library and wraps `Svelte.tick()`.

### How State Flushing Works (verified from source)

The library's `fireEvent.*` functions are all async and automatically call `act()` which calls `Svelte.tick()`. For programmatic state changes outside of events, use `act()` directly:

```typescript
it('updates when data changes', async () => {
  const { rerender, getByText } = render(Table, { props: { data: [] } });

  // Rerender with new data
  await act(() => rerender({ data: [{ name: 'Alice' }] }));
  expect(getByText('Alice')).toBeTruthy();
});
```

For testing async inference (requestIdleCallback), mock the browser API:

```typescript
// In test setup or individual tests:
vi.stubGlobal('requestIdleCallback', (cb: () => void) => {
  cb();  // Execute synchronously for test predictability
  return 0;
});
vi.stubGlobal('cancelIdleCallback', () => {});
```

### Mocking @tablecraft/core

```typescript
// At top of test file:
vi.mock('@tablecraft/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tablecraft/core')>();
  return {
    ...actual,
    createTableEngine: vi.fn(() => ({
      inferSchema: vi.fn(() => ({})),
      resolveColumns: vi.fn((data) => Object.keys(data[0] ?? {}).map((key) => ({
        key, type: 'text', label: key,
      }))),
      processRows: vi.fn((rows, cols) => rows.map((row) => ({
        _original: row,
        cells: Object.fromEntries(cols.map((c) => [c.key, { kind: 'text', value: String(row[c.key] ?? '') }])),
      }))),
      getConfig: vi.fn(() => ({})),
    })),
  };
});
```

### vitest-axe Setup

Install `1.0.0-pre.5` (latest, fewer bundling issues, axe-core 4.10.2):

```bash
pnpm add -D vitest-axe@1.0.0-pre.5 --filter @tablecraft/svelte
```

Vitest config setup file:

```typescript
// packages/svelte/src/test/setup.ts
import 'vitest-axe/extend-expect';
```

Add to `vitest.config.ts`:
```typescript
test: {
  setupFiles: ['./src/test/setup.ts'],
}
```

Test pattern:

```typescript
import { axe } from 'vitest-axe';

it('has no WCAG violations with data', async () => {
  const { container } = render(Table, { props: { data: [{ name: 'Alice' }] } });
  await act(); // flush Svelte effects
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

**Critical:** `vitest-axe` requires `jsdom` environment (NOT `happy-dom`). The existing `vitest.config.ts` already uses `environment: 'jsdom'` — this is correct.

### Testing Keyboard Navigation

```typescript
import { fireEvent } from '@testing-library/svelte';

it('moves focus with arrow keys', async () => {
  const { container } = render(Table, { props: { data: [{ a: '1', b: '2' }] } });
  const cells = container.querySelectorAll('[role="gridcell"]');

  // Focus first cell
  (cells[0] as HTMLElement).focus();

  // Arrow right
  await fireEvent.keyDown(cells[0], { key: 'ArrowRight' });
  expect(document.activeElement).toBe(cells[1]);
});
```

---

## @sveltejs/package Build Patterns

### How It Works (verified against installed dist/)

`@sveltejs/package` (v2.5.7 installed) processes `src/lib/` and outputs to `dist/`:

- `.svelte` files → copied as `.svelte` to `dist/` (preprocessed, but remain as `.svelte` source)
- `.ts` files → transpiled to `.js` + `.d.ts` in `dist/`
- CSS in `<style>` blocks → remains scoped inside `.svelte` files in dist; Svelte compiler at consumer build time applies scoping hashes
- Test files (`.test.ts`) → compiled but should be excluded via `.npmignore` or `package.json` `files` field

**Current output verified:**
```
dist/
  index.js            ← re-exports Table
  index.d.ts
  Table.svelte        ← the full .svelte source (preprocessed)
  Table.svelte.d.ts   ← generated types
```

**Phase 3 expected output** (all sub-components auto-included):
```
dist/
  index.js
  Table.svelte
  Cell.svelte
  TableHeader.svelte
  TableBody.svelte
  TableFooter.svelte
  Checkbox.svelte
  SearchInput.svelte
  types.js + types.d.ts
```

### Sub-component Exports

Sub-components do NOT need explicit entries in `package.json` exports. They are consumed only by `Table.svelte` via relative imports. Only `Table` is public in `index.ts`.

```typescript
// packages/svelte/src/lib/index.ts — Phase 3 update
export { default as Table } from './Table.svelte';
export type { ColumnType, ColumnDefinition, TableConfig } from '@tablecraft/core';
// Sub-components are intentionally NOT re-exported
```

### CSS Scoping in Library Components

Svelte's scoping mechanism generates a hash class (e.g., `svelte-abc123`) per component. In a library, the `.svelte` file in `dist/` still has the `<style>` block. When the consumer's Svelte compiler processes the import, it applies its own scope hash. This means styles are always scoped correctly — no global CSS pollution.

**CSS custom property consumption pattern** (correct approach for Phase 3):
```css
/* In each component's <style> block — scope is automatic */
.tc-th {
  padding: var(--tc-cell-padding-y, 8px) var(--tc-cell-padding-x, 12px);
  height: var(--tc-header-height, 40px);
  background: var(--tc-color-bg, #ffffff);
  color: var(--tc-color-text, #111827);
}
```

Always include fallback values in `var()` calls. Do NOT define `:root` defaults inside component `<style>` blocks — a separate `tokens.css` file should document default values for consumers.

### Test File Exclusion from Published Package

The current `package.json` `files` field includes `src`. This causes `Table.test.ts` (and compiled `Table.test.js`) to appear in `dist/`. Fix: add a `.npmignore` or change `files` to exclude test files. This is a Wave 0 cleanup task.

---

## Keyboard Navigation (grid role)

### ARIA Grid Pattern Requirements (verified against W3C APG)

The grid role requires a **roving tabindex** pattern:
- Only ONE cell in the grid has `tabindex="0"` at any time.
- All other cells have `tabindex="-1"`.
- Arrow keys update which cell has `tabindex="0"` and call `.focus()` on it.

| Key | Behavior |
|-----|----------|
| ArrowRight | Move focus one cell right (stop at last column) |
| ArrowLeft | Move focus one cell left (stop at first column) |
| ArrowDown | Move focus one cell down (stop at last row) |
| ArrowUp | Move focus one cell up (stop at first row) |
| Home | Move focus to first cell in current row |
| End | Move focus to last cell in current row |
| Tab | Move focus OUT of grid to next interactive element |
| Enter/Space | Activate cell action (follow link, toggle checkbox) |

### Svelte 5 State for Focus Tracking

```typescript
// Focused cell position tracked in $state
let focusedCell = $state<{ rowIdx: number; colIdx: number }>({ rowIdx: 0, colIdx: 0 });

function handleGridKeyDown(e: KeyboardEvent, rowIdx: number, colIdx: number) {
  const colCount = resolvedColumns.length + (selectable ? 1 : 0);
  const rowCount = visibleRows.length;

  let nextRow = rowIdx;
  let nextCol = colIdx;

  switch (e.key) {
    case 'ArrowRight': nextCol = Math.min(colIdx + 1, colCount - 1); break;
    case 'ArrowLeft': nextCol = Math.max(colIdx - 1, 0); break;
    case 'ArrowDown': nextRow = Math.min(rowIdx + 1, rowCount - 1); break;
    case 'ArrowUp': nextRow = Math.max(rowIdx - 1, 0); break;
    case 'Home': nextCol = 0; break;
    case 'End': nextCol = colCount - 1; break;
    default: return; // Let other keys bubble
  }

  e.preventDefault();
  focusedCell = { rowIdx: nextRow, colIdx: nextCol };
  // Focus the target cell
  const selector = `[data-row="${nextRow}"][data-col="${nextCol}"]`;
  (document.querySelector(selector) as HTMLElement)?.focus();
}
```

### tabindex Management in Template

```svelte
{#each visibleRows as row, rowIdx}
  <tr role="row">
    {#each resolvedColumns as col, colIdx}
      <td
        role="gridcell"
        tabindex={focusedCell.rowIdx === rowIdx && focusedCell.colIdx === colIdx ? 0 : -1}
        data-row={rowIdx}
        data-col={colIdx}
        onkeydown={(e) => handleGridKeyDown(e, rowIdx, colIdx)}
        onfocus={() => { focusedCell = { rowIdx, colIdx }; }}
      >
        <Cell descriptor={row.cells[col.key]} />
      </td>
    {/each}
  </tr>
{/each}
```

**ARIA counts** (required for WCAG 2.1 AA):
```svelte
<table
  role="grid"
  aria-colcount={resolvedColumns.length + (selectable ? 1 : 0)}
  aria-rowcount={filteredRows.length}
  aria-busy={loading}
>
```

---

## Bindable Props + Row Selection

### `$bindable()` Rune Pattern

```typescript
// In Table.svelte
interface Props {
  selectable?: boolean;
  selectedRows?: Row[];
  onselect?: (detail: { rows: Row[]; allSelected: boolean }) => void;
  // ...
}

let {
  selectable = false,
  selectedRows = $bindable<Row[]>([]),
  onselect,
  ...
}: Props = $props();
```

Parent usage with `bind:`:
```svelte
<Table data={rows} selectable bind:selectedRows={mySelection} />
```

Parent usage without `bind:` (read-only, uses `onselect` callback):
```svelte
<Table data={rows} selectable onselect={({ rows }) => console.log(rows)} />
```

**Key point:** `$bindable()` does NOT require a fallback value, but providing `[]` as fallback makes the component work standalone.

### Selection Logic

```typescript
function toggleRow(row: Row) {
  const idx = selectedRows.indexOf(row._original as Row);
  if (idx >= 0) {
    selectedRows = selectedRows.filter((_, i) => i !== idx);
  } else {
    selectedRows = [...selectedRows, row._original as Row];
  }
  onselect?.({ rows: selectedRows, allSelected: selectedRows.length === data.length });
}

function toggleAll() {
  if (selectedRows.length === data.length) {
    selectedRows = [];
  } else {
    selectedRows = data.slice();
  }
  onselect?.({ rows: selectedRows, allSelected: selectedRows.length === data.length });
}
```

---

## Indeterminate Checkbox

### Pattern: `bind:this` + `$effect`

```svelte
<!-- Checkbox.svelte -->
<script lang="ts">
  interface Props {
    checked?: boolean;
    indeterminate?: boolean;
    onchange?: (checked: boolean) => void;
    label: string;
  }

  let { checked = false, indeterminate = false, onchange, label }: Props = $props();

  let checkboxEl = $state<HTMLInputElement | null>(null);

  $effect(() => {
    if (checkboxEl) {
      checkboxEl.indeterminate = indeterminate;
    }
  });
</script>

<input
  bind:this={checkboxEl}
  type="checkbox"
  {checked}
  aria-label={label}
  onchange={(e) => onchange?.((e.target as HTMLInputElement).checked)}
/>
```

**Why `bind:this` + `$effect` and not `bind:indeterminate`:**
`indeterminate` is a DOM property, not an HTML attribute. Svelte's `bind:` directive works for attributes with corresponding DOM properties (like `value`, `checked`), but `indeterminate` has no HTML attribute form — it must be set programmatically. The `bind:this` + `$effect` pattern is the correct Svelte 5 approach.

**Svelte 5.54 note:** Svelte has a newer `@attach` attachment API, but it is experimental at v5.54 and not yet stable. Use `bind:this` + `$effect` for this purpose.

### Select-all Indeterminate State Derivation

```typescript
// In Table.svelte
const isAllSelected = $derived(
  data.length > 0 && selectedRows.length === data.length
);
const isIndeterminate = $derived(
  selectedRows.length > 0 && selectedRows.length < data.length
);
```

---

## Semantic Table CSS

### Layout Structure

```
div.tc-table-wrapper          — overflow-x: auto; max-height (optional for vertical sticky)
  table.tc-table              — role="grid", border-collapse: collapse, width: 100%
    caption.tc-caption        — visually styled or sr-only
    thead.tc-thead            — position: sticky; top: 0; z-index: 1
      tr
        th.tc-th[scope="col"] — role="columnheader", aria-sort
    tbody.tc-tbody
      tr.tc-tr                — role="row"
        td.tc-td              — role="gridcell", tabindex managed
    tfoot (if pagination)     — optional, or use a separate div below the table
```

### Sticky Header: The `overflow-x: auto` Caveat

**Verified from MDN:** `position: sticky` sticks to its nearest scrolling ancestor. When the wrapper has `overflow-x: auto`, the `<thead>` sticks to the TOP of that container — it does NOT escape to stick to the viewport.

This is the CORRECT and INTENDED behavior for Phase 3. The table scrolls horizontally inside the wrapper; the header sticks at the top of the wrapper.

**For vertical stickiness to activate**, the wrapper needs a constrained height:
```css
.tc-table-wrapper {
  overflow-x: auto;
  /* Optional: constrain height for vertical scroll + sticky header */
  /* max-height: var(--tc-max-height, none); */
}

.tc-thead {
  position: sticky;
  top: 0;
  z-index: 1; /* Header stays above cell content during scroll */
  background: var(--tc-color-bg, #ffffff); /* Must be opaque, not transparent */
}
```

**Pitfall:** Without a background color on `<thead>`, data rows will scroll visually "through" the sticky header and be visible behind it.

### Alternating Rows via `:nth-child(even)`

```css
/* In <style> block — Svelte scoping applies automatically */
.tc-tbody .tc-tr:nth-child(even) {
  background-color: var(--tc-color-bg-alt, #f9fafb);
}
```

**Note on `:nth-child` and Svelte scoping:** Svelte adds a scope attribute (e.g., `svelte-xyz`) to elements. The `nth-child` selector works correctly because it selects based on DOM position, not element class. Svelte's scoping adds the attribute to the selector automatically.

### Skeleton Loading CSS

```css
@keyframes tc-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.tc-skeleton-cell {
  background: linear-gradient(
    90deg,
    var(--tc-color-border, #e5e7eb) 25%,
    var(--tc-color-bg-hover, #f9fafb) 50%,
    var(--tc-color-border, #e5e7eb) 75%
  );
  background-size: 200% 100%;
  animation: tc-shimmer 1.5s infinite;
  border-radius: var(--tc-border-radius, 4px);
  height: 16px;
}
```

### Focus Ring (keyboard-only)

```css
/* Apply focus ring only on keyboard focus, not mouse click */
.tc-td:focus-visible,
.tc-th:focus-visible {
  outline: 2px solid var(--tc-color-accent, #3b82f6);
  outline-offset: -2px;
}

.tc-td:focus:not(:focus-visible) {
  outline: none;
}
```

---

## Validation Architecture

Nyquist validation is enabled (`workflow.nyquist_validation: true` in `.planning/config.json`).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `packages/svelte/vitest.config.ts` (exists) |
| Environment | `jsdom` (correct, required for vitest-axe) |
| Quick run command | `pnpm --filter @tablecraft/svelte test --run` |
| Full suite command | `pnpm --filter @tablecraft/svelte test --run --coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SVLT-01 | `<Table data={rows} />` renders headers from data keys | unit | `pnpm --filter @tablecraft/svelte test --run --reporter=verbose -t "zero-config"` | ❌ Wave 0 |
| SVLT-01 | Columns upgrade from text to inferred types after idle | unit (with stubbed rIC) | same | ❌ Wave 0 |
| SVLT-02 | Short-form `columns={{ avatar: 'image' }}` override | unit | same | ❌ Wave 0 |
| SVLT-02 | Long-form `columns={[{ key: 'avatar', type: 'image' }]}` override | unit | same | ❌ Wave 0 |
| SVLT-03 | Click header sorts ascending, click again descending, click again unsorted | unit | same | ❌ Wave 0 |
| SVLT-03 | `aria-sort` attribute updates on sort state change | unit | same | ❌ Wave 0 |
| SVLT-04 | Filter input filters rows after 150ms debounce | unit | same | ❌ Wave 0 |
| SVLT-06 | Pagination hides when all rows fit; shows when `data.length > pageSize` | unit | same | ❌ Wave 0 |
| SVLT-06 | Next/Prev/First/Last buttons update currentPage and visibleRows | unit | same | ❌ Wave 0 |
| SVLT-07 | Empty state renders when `data=[]` and `loading=false` | unit | same | ❌ Wave 0 |
| SVLT-07 | Empty snippet renders when provided | unit | same | ❌ Wave 0 |
| SVLT-08 | Skeleton rows render when `loading=true` | unit | same | ❌ Wave 0 |
| SVLT-08 | `aria-busy="true"` present on `<table>` when loading | unit | same | ❌ Wave 0 |
| SVLT-09 | Checkbox column appears when `selectable=true` | unit | same | ❌ Wave 0 |
| SVLT-09 | Clicking row checkbox adds to `selectedRows`; `onselect` fires | unit | same | ❌ Wave 0 |
| SVLT-09 | Select-all checkbox is indeterminate when partial; checked when all | unit | same | ❌ Wave 0 |
| SVLT-09 | `bind:selectedRows` reflects selection state in parent | unit | same | ❌ Wave 0 |
| SVLT-11 | ArrowRight moves focus to next cell | unit | same | ❌ Wave 0 |
| SVLT-11 | ArrowDown moves focus to next row | unit | same | ❌ Wave 0 |
| SVLT-11 | Home/End jump to first/last cell in row | unit | same | ❌ Wave 0 |
| SVLT-12 | No WCAG violations — empty state | unit (axe) | same | ❌ Wave 0 |
| SVLT-12 | No WCAG violations — loading state | unit (axe) | same | ❌ Wave 0 |
| SVLT-12 | No WCAG violations — with data | unit (axe) | same | ❌ Wave 0 |
| SVLT-12 | No WCAG violations — with selection | unit (axe) | same | ❌ Wave 0 |
| SVLT-13 | `onrowclick` fires with row data on row click | unit | same | ❌ Wave 0 |
| SVLT-13 | `oncellclick` fires with column info on cell click | unit | same | ❌ Wave 0 |
| SVLT-15 | `colname`/`rowdata` props render table and emit console.warn | unit | same | ❌ Wave 0 |
| SVLT-15 | `data` prop takes precedence over `rowdata` when both provided | unit | same | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm --filter @tablecraft/svelte test --run`
- **Per wave merge:** `pnpm --filter @tablecraft/svelte test --run --coverage`
- **Phase gate:** Full suite green (including vitest-axe) before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `packages/svelte/src/lib/Table.test.ts` — expand from 6 Phase 1 stubs to the full Phase 3 test map above (overwrite the existing stub file)
- [ ] `packages/svelte/src/test/setup.ts` — add `import 'vitest-axe/extend-expect'`
- [ ] Update `packages/svelte/vitest.config.ts` `setupFiles` to include `['./src/test/setup.ts']`
- [ ] Install `vitest-axe@1.0.0-pre.5` as a devDependency in `packages/svelte`
- [ ] Fix test file exclusion from npm publish: add to `files` exclusion or `.npmignore` to prevent `Table.test.js` appearing in `dist/`

---

## Implementation Order

This order minimizes integration risk — each step produces something verifiable before the next layer is added.

**Wave 1: Engine integration + zero-config render** (SVLT-01, SVLT-02, SVLT-14)
1. Write `packages/svelte/src/lib/types.ts` — component-specific prop interfaces
2. Rewrite `Table.svelte` — `$props`, `$state`, two-phase `$effect`, `resolveColumns` + `processRows`, basic `<table>` render without sub-components
3. Write `Cell.svelte` — `CellDescriptor` → Svelte markup `{#if}` chain
4. Verify: `pnpm --filter @tablecraft/svelte test --run`

**Wave 2: Interactivity** (SVLT-03, SVLT-04, SVLT-06)
5. Write `TableHeader.svelte` — sort indicators, `aria-sort`, `onclick` per header
6. Write `SearchInput.svelte` — debounced `oninput`, `onfilter` callback prop
7. Add `$derived` sort + filter + paginate pipeline in `Table.svelte`
8. Write `TableFooter.svelte` — pagination controls, page display text

**Wave 3: States + selection** (SVLT-07, SVLT-08, SVLT-09, SVLT-10)
9. Write `TableBody.svelte` — rows, empty state slot/snippet, loading skeleton
10. Write `Checkbox.svelte` — `$bindable`, `indeterminate` via `bind:this` + `$effect`
11. Add selection logic to `Table.svelte` — checkbox column, `toggleRow`, `toggleAll`, `onselect` callback, `bind:selectedRows`

**Wave 4: Accessibility + keyboard nav** (SVLT-11, SVLT-12, SVLT-13)
12. Add keyboard navigation to `Table.svelte` — `focusedCell` state, roving tabindex, `onkeydown` handler, `data-row`/`data-col` attributes
13. Add full ARIA attributes — `aria-colcount`, `aria-rowcount`, `aria-selected`, `aria-busy`, `role="gridcell"`, `role="columnheader"`
14. Add row/cell click events — `onrowclick`, `oncellclick` callback props

**Wave 5: v1 compat + CSS polish** (SVLT-15, SVLT-10)
15. Add `colname`/`rowdata` props to Table.svelte — detect and call `adaptV1Props()`
16. Finalize CSS — sticky header, alternating rows, skeleton shimmer, focus ring, `--tc-*` tokens
17. Run vitest-axe on all states — fix any ARIA violations

---

## Gotchas and Warnings

### G1: `$state.raw` for Large Row Arrays

For tables with thousands of rows, using `$state([...rows])` creates a deep reactive proxy over every row. This is unnecessary overhead since rows are not mutated individually — the entire array is replaced on data change.

**Fix:** Use `$state.raw` for `processedRows`:
```typescript
let processedRows = $state.raw<ProcessedRow[]>([]);
```
`$state.raw` allows reassignment but blocks property mutation, eliminating proxy overhead for large datasets. This is important for Phase 3 correctness ahead of Phase 4 virtualization.

### G2: `$derived` Values Are Not Deeply Reactive

`filteredRows` is `$derived`. If code tries to mutate `filteredRows[0]`, it will fail silently or throw. Always treat derived arrays as immutable read-only.

### G3: `$effect` Runs After DOM Mount, Not During SSR

`$effect` does not run during SvelteKit SSR. The `requestIdleCallback` inside `$effect` is therefore never called on the server. SSR renders the table with zero processed rows, which is correct — the `<table>` shell renders server-side; JS hydrates and fills data client-side.

**Action required:** Ensure the initial render (before the `$effect` fires) produces a valid, accessible empty table structure. This means the template must not crash when `resolvedColumns` and `processedRows` are empty arrays.

### G4: Sort Stability Concern

JavaScript's `Array.prototype.sort` is stable (guaranteed in V8/SpiderMonkey since 2019). Rely on it — no need to implement a stable sort manually.

### G5: Props Change Detection for v1 Compat

The `colname` and `rowdata` props must be typed as `unknown` in the Props interface to avoid TypeScript errors for v1 consumers passing untyped data. TypeScript assertion happens inside the function before calling `adaptV1Props`.

### G6: CSS `z-index` on Sticky `<thead>` Conflicts with Cell Content

Dropdown menus or tooltips rendered inside table cells will appear UNDER the sticky header if the header has `z-index: 1`. Phase 3 has no dropdowns, so `z-index: 1` is safe. Document this for Phase 6 when column filter dropdowns are added.

### G7: `vitest-axe` `toHaveNoViolations` Requires Async `axe()` Call

```typescript
// WRONG — synchronous (axe is always async)
expect(axe(container)).toHaveNoViolations();

// CORRECT
const results = await axe(container);
expect(results).toHaveNoViolations();
```

### G8: Test Files Polluting dist/

`@sveltejs/package` currently compiles `Table.test.ts` into `dist/Table.test.js`. This is present in the Phase 1 dist output. Add to `packages/svelte/.npmignore`:
```
dist/**/*.test.js
dist/**/*.test.d.ts
```
Or add a `exclude` pattern to the build script. This is a Wave 0 housekeeping task.

### G9: Snippet vs Slot for Empty State

The CONTEXT.md specifies the empty state slot override as:
```svelte
<Table data={[]}><svelte:fragment slot="empty">Custom!</svelte:fragment></Table>
```
This is Svelte 3/4 slot syntax, which is legacy in Svelte 5. The Svelte 5 equivalent is:
```svelte
<Table data={[]}>
  {#snippet empty()}
    Custom!
  {/snippet}
</Table>
```
And in `Table.svelte` receive it as:
```typescript
interface Props {
  empty?: Snippet;
  // ...
}
// Usage in template:
{@render empty?.()}
```
The old `slot="empty"` syntax still works in Svelte 5 (legacy support), but new code should use snippets. **Recommendation:** Implement with snippets; document both syntaxes for consumers migrating from Svelte 4.

### G10: `focusedCell` Initial Value

The initial `focusedCell = { rowIdx: 0, colIdx: 0 }` means the first cell always has `tabindex="0"` even before the user has focused the grid. This is correct per the ARIA grid pattern — the grid must have exactly one focusable cell for Tab navigation to land on.

---

## Sources

### Primary (HIGH confidence)

- Installed package source: `packages/svelte/node_modules/@testing-library/svelte/src/pure.js` — verified act/flushSync behavior
- Installed package: `packages/svelte/node_modules/svelte` v5.54.0 — verified exports (flushSync, tick, mount, onMount)
- `packages/core/src/engine/index.ts` — verified createTableEngine API (inferSchema, resolveColumns, processRows, getConfig)
- `packages/core/src/types.ts` — verified CellDescriptor discriminated union, ResolvedColumn, ProcessedRow
- `packages/svelte/dist/` — verified @sveltejs/package output format
- https://svelte.dev/docs/svelte/$bindable — $bindable rune syntax
- https://svelte.dev/docs/svelte/$state — $state and $state.raw patterns
- https://svelte.dev/docs/svelte/$derived — $derived and $derived.by patterns
- https://svelte.dev/docs/svelte/$effect — $effect vs $derived, cleanup, effect.root
- https://svelte.dev/docs/svelte/$props — callback props pattern replacing createEventDispatcher
- https://svelte.dev/docs/svelte/snippet — Snippet type, {#snippet}, {@render}, implicit children
- https://svelte.dev/docs/svelte/bind#bind:this — bind:this + $effect for DOM property manipulation
- https://svelte.dev/docs/svelte/basic-markup#Events — Svelte 5 event attribute syntax
- https://svelte.dev/docs/svelte/testing — flushSync, official Vitest guidance
- https://www.w3.org/WAI/ARIA/apg/patterns/grid/ — ARIA grid keyboard requirements
- https://www.w3.org/WAI/ARIA/apg/patterns/grid/examples/data-grids/ — roving tabindex implementation pattern
- MDN: CSS position sticky — overflow container behavior verified

### Secondary (MEDIUM confidence)

- https://svelte.dev/docs/kit/packaging — @sveltejs/package CSS handling (partial detail)
- npm registry: `npm view vitest-axe versions` — verified vitest-axe version 0.1.0 stable / 1.0.0-pre.5 pre-release

### Tertiary (LOW confidence)

- None — all claims above verified from primary or secondary sources.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified against installed node_modules
- Architecture (engine integration): HIGH — engine source read directly, API fully verified
- Svelte 5 runes patterns: HIGH — official Svelte 5 docs fetched and read
- Testing patterns: HIGH — @testing-library/svelte source read directly
- Accessibility patterns: HIGH — W3C APG read directly
- CSS sticky behavior: HIGH — MDN read directly

**Research date:** 2026-03-21
**Valid until:** 2026-06-21 (Svelte 5 is stable; patterns are unlikely to change on this timeline)
