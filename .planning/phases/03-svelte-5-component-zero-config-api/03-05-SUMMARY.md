---
phase: 03-svelte-5-component-zero-config-api
plan: "05"
subsystem: svelte-component
tags: [svelte5, table, engine-integration, a11y, pagination, sorting, filtering, selection, v1-compat]
dependency_graph:
  requires:
    - 03-01 # Svelte 5 test infrastructure, vitest-axe setup
    - 03-02 # SearchInput.svelte sub-component
    - 03-03 # TableHeader.svelte, Checkbox.svelte sub-components
    - 03-04 # TableBody.svelte, TableFooter.svelte sub-components
    - 02-01 # createTableEngine factory
    - 02-02 # Type inference engine
    - 02-04 # Renderer registry (17 renderers)
    - 01-03 # adaptV1Props v1 compat shim (CORE-10)
  provides:
    - Table.svelte production component
    - defineColumns in public API
  affects:
    - apps/dev (preview app)
    - consumers of @tablecraft/svelte
tech_stack:
  added:
    - Two-phase requestIdleCallback inference pattern
  patterns:
    - $effect for engine integration + idle scheduling
    - $derived.by for filter/sort/paginate pipeline
    - $bindable for two-way selectedRows binding
    - $state for sortState, filterQuery, currentPage
    - Label override post-processing for long-form ColumnDefinition[]
key_files:
  created: []
  modified:
    - packages/svelte/src/lib/Table.svelte
    - packages/svelte/src/lib/TableBody.svelte
    - packages/svelte/src/lib/index.ts
decisions:
  - "Label overrides applied post-resolveColumns for mock compatibility — long-form ColumnDefinition labels applied on top of engine output to allow mocked resolveColumns to ignore overrides while still producing correct labels"
  - "role=row explicit on tr elements — implicit ARIA role insufficient for closest('[role=row]') DOM queries in tests; explicit attribute required"
  - "data-skeleton attribute on skeleton tr rows — test spec expects document.querySelectorAll('[data-skeleton]')"
  - "processedRows stays $state() not $state.raw() — row identity comparison for selectedRows.some(r === row) requires both sides to be the same reactive proxy; $state.raw() would break identity"
  - "handleSelectAll uses processedRows._original — ensures selectedRows contains the same proxy references as TableBody's row variable, making === comparison reliable"
  - "oncellclick includes rowIndex in payload — test spec uses expect.objectContaining({ rowIndex: 0 }); added to TableBody Props interface"
metrics:
  duration: ~33min
  completed_date: "2026-03-21"
  tasks_completed: 2
  files_modified: 3
---

# Phase 3 Plan 5: Table.svelte Assembly Summary

**One-liner:** Full production Table.svelte rewritten with createTableEngine integration, two-phase inference, WCAG 2.1 AA, and complete reactive state pipeline — 40/40 tests GREEN.

## What Was Built

### Task 1: Complete Table.svelte Rewrite

The Phase 1 stub (155-line placeholder) was completely replaced with a 270-line production component integrating all sub-components built in plans 02-04.

**Key features implemented:**

- **Two-phase inference:** `createTableEngine()` called in `$effect()`. Phase 1 calls `resolveColumns()` immediately (text columns). Phase 2 schedules `inferSchema()` + typed `resolveColumns()` via `requestIdleCallback` (falls back to `setTimeout(1)` in non-browser).

- **Reactive pipeline:** `$derived.by()` chain: `processedRows` → `filteredRows` (substring filter, 150ms debounce via SearchInput) → `sortedRows` (multi-type sort: numeric, locale string, null-last) → `visibleRows` (page slice).

- **State:** `sortState`, `filterQuery`, `currentPage` as `$state()`. `selectedRows` as `$bindable([])`.

- **Sort handler:** Cycles unsorted → asc → desc → unsorted per column click. Delegates to TableHeader's `onsortchange` prop.

- **Selection:** `handleSelectAll` stores `processedRows.map(pr => pr._original)` in `selectedRows` to ensure consistent proxy identity with TableBody's `row` variable. `handleRowToggle` filters by reference.

- **v1 backward compat:** Detects `rowdata !== undefined || colname !== undefined` before checking `data.length`. Emits `console.warn`. Handles both object-array format (test-friendly) and classic v1 array-of-arrays. `data` prop takes precedence.

- **WCAG 2.1 AA:** `role="grid"`, `aria-colcount`, `aria-rowcount`, `aria-busy` on `<table>`. Search input with `aria-label`. All sub-components supply their own ARIA (aria-sort in TableHeader, aria-selected in TableBody, aria-label on checkboxes, aria-label on pagination buttons).

- **CSS:** `tc-table-wrapper` (border, radius, overflow:hidden), `tc-table-scroll` (overflow-x:auto for SVLT-10), `tc-table` (width:100%, border-collapse:collapse), `tc-caption`. Dark mode via `@media (prefers-color-scheme: dark)` overrides on `--tc-*` tokens.

- **Label override post-processing:** Long-form `ColumnDefinition[]` labels applied on top of engine `resolveColumns()` output. Allows the mocked engine in tests to return auto-generated labels while still displaying the declared label.

### Task 2: Update index.ts

Added `defineColumns` re-export from `@tablecraft/core`. Consumers can now write:

```typescript
import { Table, defineColumns } from '@tablecraft/svelte';
const columns = defineColumns<User>()([
  { key: 'avatar', type: 'image', label: 'Profile Photo' },
]);
```

Sub-components (Cell, TableHeader, TableBody, TableFooter, Checkbox, SearchInput) intentionally NOT exported.

### Auto-fixes Applied (Deviations)

**[Rule 2 - Missing Critical Functionality] TableBody: data-skeleton attribute**

- **Found during:** Task 1 (test run)
- **Issue:** Test expected `document.querySelectorAll('[data-skeleton]').length` to be 3 but skeleton `<tr>` had no `data-skeleton` attribute
- **Fix:** Added `data-skeleton` attribute to skeleton row `<tr>` in TableBody.svelte
- **Files modified:** `packages/svelte/src/lib/TableBody.svelte`

**[Rule 1 - Bug] TableBody: role=row required for test selectors**

- **Found during:** Task 1 (test run)
- **Issue:** Test used `firstRowCheckbox.closest('[role="row"]')` but `<tr>` has only implicit role; attribute selector requires explicit `role="row"`
- **Fix:** Added explicit `role="row"` to data rows and skeleton rows in TableBody.svelte
- **Files modified:** `packages/svelte/src/lib/TableBody.svelte`

**[Rule 2 - Missing Critical Functionality] TableBody: oncellclick missing rowIndex**

- **Found during:** Task 1 (test run)
- **Issue:** Test expected `expect.objectContaining({ rowIndex: 0 })` in oncellclick callback but TableBody only sent `{ row, column, value }`
- **Fix:** Added `rowIndex` to `oncellclick` payload and Props interface
- **Files modified:** `packages/svelte/src/lib/TableBody.svelte`

**[Rule 1 - Bug] Proxy identity mismatch for selectedRows comparisons**

- **Found during:** Task 1 (test run, `state_proxy_equality_mismatch` warnings + failing select-all test)
- **Issue:** `handleSelectAll` used `effectiveData` items which are `$derived.by()` proxies. `isSelected` comparison in TableBody used `processedRow._original`. Mismatch caused `===` to return false.
- **Fix:** Changed `handleSelectAll` to use `processedRows.map(pr => pr._original as Row)` — stores the exact same proxy references as what TableBody accesses via `processedRow._original`
- **Files modified:** `packages/svelte/src/lib/Table.svelte`

## Verification Results

| Check | Result |
|-------|--------|
| `pnpm --filter @tablecraft/svelte test --run` | 40/40 PASS |
| `pnpm --filter @tablecraft/svelte typecheck` | 0 errors, 3 warnings (intentional a11y patterns) |
| `pnpm --filter @tablecraft/svelte build` | Success — dist/ updated |
| `Table.svelte: no {@html}` | Confirmed — only Cell.svelte has the html-kind branch |
| `index.ts: defineColumns exported` | Confirmed |
| `index.ts: sub-components not exported` | Confirmed |
| WCAG vitest-axe (4 states) | All PASS (empty, data, loading, selectable) |

## Typecheck Warnings (Intentional)

Three `svelte-check` warnings from `TableBody.svelte`:
1. `Non-interactive element <tbody> should not be assigned keyboard event listeners` — Intentional: WCAG 2.1 AA grid keyboard navigation requires tbody keydown for roving tabindex pattern. Documented in STATE.md decision: "tbody onkeydown accepted despite a11y warning".
2. `Redundant role 'row'` (x2) — Required for `closest('[role="row"]')` DOM selector in tests. `<tr>` has implicit role but explicit attribute needed for attribute selectors.

## Self-Check

PASSED

- `/packages/svelte/src/lib/Table.svelte` — confirmed written (270 lines)
- `/packages/svelte/src/lib/TableBody.svelte` — confirmed modified (role=row, data-skeleton, oncellclick rowIndex)
- `/packages/svelte/src/lib/index.ts` — confirmed updated (defineColumns export)
- Task 1 commit: c9967f6
- Task 2 commit: 0253610
