---
phase: 06-column-operations-advanced-features
plan: 02
subsystem: ui
tags: [svelte, svelte5, table, column-visibility, aggregates, tfoot]

requires:
  - phase: 06-01
    provides: hiddenColumns $bindable stub, showAggregates prop stub, resolvedColumns pipeline, filteredRows $derived

provides:
  - visibleColumns $derived filtering resolvedColumns through hiddenColumns Set
  - AggregateRow.svelte <tfoot> component with sum/avg/count/min/max/custom computation
  - showAggregates prop wired into both virtual and non-virtual table modes
  - Unit tests for column visibility (ADV-05) and aggregate footer (ADV-07)

affects:
  - 06-03
  - 06-04
  - 06-05

tech-stack:
  added: []
  patterns:
    - "visibleColumns = resolvedColumns.filter(c => !hiddenColumns.has(c.key)) — visibility as pure $derived filter"
    - "AggregateRow receives filteredRows (not visibleRows/sortedRows) so aggregates reflect full filtered dataset"
    - "computeAggregate dispatches on AggregateFunction union type — handles string literals + custom functions"
    - "Test mock spreads ColumnDefinition fields (including aggregate) using ...override to preserve all fields through resolveColumns"

key-files:
  created:
    - packages/svelte/src/lib/AggregateRow.svelte
    - packages/svelte/src/test/adv-visibility-aggregate.test.ts
  modified:
    - packages/svelte/src/lib/Table.svelte

key-decisions:
  - "AggregateRow receives filteredRows not visibleRows — aggregates reflect filtered dataset independent of pagination"
  - "visibleColumns $derived placed after resolvedColumns assignment, before isColumnVirtualizing — correct $derived chain ordering"
  - "isColumnVirtualizing and column virtualizer count both updated to use visibleColumns.length — virtualizer tracks visible columns only"
  - "Test mock resolveColumns spreads ...override to preserve aggregate field — standard test pattern for this codebase"
  - "Consumer responsibility for hideable===false enforcement documented in comment — library ships no toggle UI"

patterns-established:
  - "Column visibility: pure $derived filter on resolvedColumns, no side effects, works with bind:hiddenColumns two-way binding"
  - "Aggregate computation: values extracted from rows._original[col.key], filtered through Number+isFinite for numeric ops"

requirements-completed:
  - ADV-05
  - ADV-07

duration: 4min
completed: 2026-03-22
---

# Phase 6 Plan 02: Column Visibility + Aggregate Footer Summary

**visibleColumns $derived filters resolvedColumns through hiddenColumns Set; AggregateRow.svelte <tfoot> computes sum/avg/count/min/max/custom from filteredRows; 15 new unit tests green alongside existing 56**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-22T11:14:08Z
- **Completed:** 2026-03-22T11:17:36Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Column visibility: `visibleColumns = resolvedColumns.filter(c => !hiddenColumns.has(c.key))` $derived established; all 4 TableHeader/TableBody column references updated to use `visibleColumns`; `aria-colcount` and column virtualizer count updated accordingly
- AggregateRow.svelte created: standalone `<tfoot>` component with `computeAggregate` handling all 5 built-in types (`sum`, `avg`, `count`, `min`, `max`) and custom function; non-numeric values filtered before numeric ops
- showAggregates wired into both virtual and non-virtual table modes; AggregateRow receives `filteredRows` (not `visibleRows`) so aggregates reflect the full filtered dataset regardless of pagination
- 15 unit tests created in `adv-visibility-aggregate.test.ts`; all 71 tests (5 files) green

## Task Commits

Each task was committed atomically:

1. **Task 1: Column visibility — visibleColumns $derived + wire to TableHeader/TableBody** - `b131ee9` (feat)
2. **Task 2: Create AggregateRow.svelte + wire showAggregates + unit tests** - `b627971` (feat)

**Plan metadata:** (final docs commit)

## Files Created/Modified

- `packages/svelte/src/lib/Table.svelte` - Added `visibleColumns` $derived, updated all 4 template column references, added AggregateRow import and conditional rendering in both table modes
- `packages/svelte/src/lib/AggregateRow.svelte` - New `<tfoot>` component with `computeAggregate` for all aggregate types
- `packages/svelte/src/test/adv-visibility-aggregate.test.ts` - 15 unit tests for visibility and aggregate footer

## Decisions Made

- AggregateRow receives `filteredRows` not `visibleRows` — aggregates reflect filtered dataset independent of pagination slice
- `visibleColumns` $derived placed after the `resolvedColumns` $state assignments in the script, correctly in the $derived chain
- Both `isColumnVirtualizing` and the column virtualizer's `count` updated to use `visibleColumns.length` — virtualizer tracks visible columns only
- Test mock's `resolveColumns` updated to spread `...override` fields (including `aggregate`) so test columns with aggregate field are preserved through the mock pipeline
- `hideable===false` enforcement left as consumer responsibility; documented in comment — library does not ship a column toggle UI

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — both tasks executed cleanly with all tests passing on first run.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Column visibility and aggregate footer are complete; bind:hiddenColumns two-way binding works via Svelte reactivity
- hiddenColumns is one of the 6 fields persisted by persistKey (already implemented in 06-01) — no additional work needed
- Ready for 06-03 (column resizing / drag reorder) and subsequent plans

---
*Phase: 06-column-operations-advanced-features*
*Completed: 2026-03-22*
