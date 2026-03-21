---
phase: 04-virtual-scrolling-performance
plan: 04
subsystem: ui
tags: [svelte5, web-worker, sorting, aria, performance]

# Dependency graph
requires:
  - phase: 04-virtual-scrolling-performance/04-01
    provides: sort.worker.ts with SortMessage/SortResult interfaces and sortComparator
  - phase: 04-virtual-scrolling-performance/04-03
    provides: Table.svelte with event delegation, filteredRows pipeline, virtualizing mode

provides:
  - Worker lifecycle $effect in Table.svelte (SSR-guarded, CSP-safe try/catch, terminates on unmount)
  - Sort dispatch $effect routing large datasets (>10k rows) to Worker, small to main thread
  - workerSortedRows + sortLoading reactive state in Table.svelte
  - sortLoading prop and aria-busy on thead in TableHeader.svelte

affects:
  - 04-virtual-scrolling-performance/04-05
  - 04-virtual-scrolling-performance/04-06

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Worker created once via $effect (not per-sort) with cleanup in return callback
    - $derived cannot have side effects — Worker postMessage lives in $effect watching sortState+filteredRows
    - Identity map (Map<_original, ProcessedRow>) for O(n) re-ordering without re-processing
    - sortedRows $derived composes mainThreadSortedRows and workerSortedRows with clean fallback

key-files:
  created: []
  modified:
    - packages/svelte/src/lib/Table.svelte
    - packages/svelte/src/lib/TableHeader.svelte

key-decisions:
  - "Worker created once in $effect (not per-sort): avoids Worker constructor overhead on every keypress"
  - "Identity map (Map<_original, ProcessedRow>) for Worker response re-ordering: avoids re-running processRows on sorted originals"
  - "Two $effects for Worker: one for lifecycle (create/terminate), one for dispatch (watch sortState+filteredRows)"
  - "typeof Worker === 'undefined' SSR guard in lifecycle $effect (not at module level): new Worker() must be runtime-guarded"

patterns-established:
  - "Worker lifecycle pattern: $effect { if (typeof Worker === 'undefined') return; try { new Worker } catch { return }; ... return () => worker.terminate() }"
  - "Worker sort threshold: USE_WORKER_THRESHOLD = 10_000 rows before Worker is used"
  - "mainThreadSortedRows + workerSortedRows composition: sortedRows $derived picks Worker result when available"

requirements-completed:
  - PERF-07

# Metrics
duration: 2min
completed: 2026-03-22
---

# Phase 04 Plan 04: Web Worker Sort Wiring Summary

**Web Worker sort wired into Table.svelte with SSR guard, 10k-row threshold, identity-map re-ordering, and aria-busy on thead during processing**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-21T19:00:30Z
- **Completed:** 2026-03-22T19:02:30Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Table.svelte wires sort.worker.ts via two-$effect pattern: lifecycle $effect creates Worker once with SSR guard and CSP try/catch, dispatch $effect posts to Worker when sortedRows > 10,000
- Worker response mapped back to ProcessedRow[] via identity map (`Map<_original, ProcessedRow>`) — O(n) re-ordering without re-running processRows
- sortedRows $derived now composes mainThreadSortedRows (small datasets, no-sort) and workerSortedRows (Worker result when available)
- TableHeader.svelte receives sortLoading prop; thead gains `aria-busy={sortLoading ? 'true' : undefined}` for screen-reader sort-in-progress feedback
- Zero TypeScript errors; 46 pre-existing passing tests remain GREEN; 2 pre-existing Wave-5 TODO stubs remain (unrelated to this plan)

## Task Commits

Each task was committed atomically:

1. **Task 1 + Task 2: Wire Worker sort + add sortLoading/aria-busy** - `cd78e52` (feat)

_Note: Tasks 1 and 2 were committed together because Task 1's TypeScript verification required Task 2's prop definition to pass svelte-check._

## Files Created/Modified

- `packages/svelte/src/lib/Table.svelte` - Added sortWorker/sortLoading/workerSortedRows state; renamed sortedRows to mainThreadSortedRows; added new sortedRows $derived; added Worker lifecycle and dispatch $effects; passed sortLoading to both TableHeader usages
- `packages/svelte/src/lib/TableHeader.svelte` - Added sortLoading?: boolean to Props; added sortLoading = false to destructure; changed `<thead>` to `<thead aria-busy={sortLoading ? 'true' : undefined}>`

## Decisions Made

- Worker created once in `$effect` (not per-sort): avoids Worker constructor overhead on every sort key change
- Identity map (`Map<_original, ProcessedRow>`) for Worker response re-ordering: avoids re-running the full processRows pipeline on the sorted originals from the Worker
- Two separate `$effect`s for Worker concerns: lifecycle (create/destroy) and dispatch (trigger sort) — cleaner reactive dependency tracking
- `typeof Worker === 'undefined'` SSR guard placed inside the lifecycle `$effect`, not at module level — Worker instantiation must be runtime-guarded, not the import

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Task 1's typecheck required Task 2 to be complete first (Table.svelte passes `sortLoading` to TableHeader, which didn't have the prop yet). Both tasks were implemented and committed together. No functional impact.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- PERF-07 complete: Worker sort pipeline active for 100k+ row tables
- sortLoading propagated to TableHeader; accessible aria-busy feedback in place
- Worker terminates cleanly on component destroy — no memory leaks
- Ready for Phase 04-05 (benchmark/validation)
- Tables with < 10,000 rows continue using main-thread sort with zero Worker overhead

---
*Phase: 04-virtual-scrolling-performance*
*Completed: 2026-03-22*
