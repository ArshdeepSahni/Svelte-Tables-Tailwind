---
phase: 04-virtual-scrolling-performance
plan: 03
subsystem: ui
tags: [svelte, event-delegation, css-containment, performance, vitest]

# Dependency graph
requires:
  - phase: 04-02
    provides: Virtual path with data-row/data-col attributes on tr/td, dual-mode TableBody

provides:
  - Single delegated onclick handler on tbody (PERF-04)
  - CSS containment on .tc-tr (layout style) and .tc-td (layout style paint) (PERF-03)
  - data-row on all tr elements in both normal and virtual paths
  - data-col on all td elements in both normal and virtual paths
  - 3 passing PERF-04 delegation unit tests

affects:
  - 04-04
  - 04-05

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Event delegation via closest('[data-row]')/closest('[data-col]') on tbody
    - CSS containment (contain: layout style) on tr to isolate row layout
    - CSS containment (contain: layout style paint) on td to isolate cell paint

key-files:
  created: []
  modified:
    - packages/svelte/src/lib/TableBody.svelte
    - packages/svelte/src/test/delegation.test.ts

key-decisions:
  - "Delegation reads visibleRows[rowIndex] in normal mode and sortedRows[rowIndex] in virtual mode — rowIndex from data-row is the index into those arrays"
  - "CSS containment was already present from Wave 2 prep; no changes needed to style block"
  - "No e.stopPropagation() on td needed since per-td onclick handlers no longer exist"

patterns-established:
  - "handleBodyClick pattern: closest('[data-row]') then closest('[data-col]') to route to onrowclick or oncellclick"
  - "data-row attribute on tr is the source of truth for row identity in delegation"

requirements-completed:
  - PERF-03
  - PERF-04

# Metrics
duration: 2min
completed: 2026-03-22
---

# Phase 4 Plan 03: Event Delegation + CSS Containment Summary

**Single tbody onclick delegation via data-row/data-col attributes eliminates per-row/per-cell listeners; CSS containment with contain: layout style paint applied to .tc-tr and .tc-td**

## Performance

- **Duration:** 96s (~2 min)
- **Started:** 2026-03-21T18:56:26Z
- **Completed:** 2026-03-21T18:58:02Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Removed all `onclick` from individual `<tr>` and `<td>` elements in both normal and virtual paths
- Added `handleBodyClick` using `closest('[data-row]')` / `closest('[data-col]')` delegation on `<tbody>`
- Added `data-row={rowIndex}` to normal path `<tr>` elements (virtual path already had it from Wave 2)
- Added `data-col={colIndex}` to normal path `<td>` elements (virtual path already had it from Wave 2)
- CSS containment (`contain: layout style` on `.tc-tr`, `contain: layout style paint` on `.tc-td`) was already present from Wave 2 prep — confirmed correct
- Replaced 3 Wave 0 delegation.test.ts stubs with passing PERF-04 tests (46/48 total pass; 2 PERF-06 Wave 5 stubs expected to fail)

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement event delegation on TableBody.svelte + add CSS containment** - `2fa3f8f` (feat)
2. **Task 2: Replace delegation.test.ts stubs with passing tests** - `3b44b0d` (test)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified

- `packages/svelte/src/lib/TableBody.svelte` - Added handleBodyClick, removed per-tr/td onclick, added data-row to normal path tr, added data-col to normal path td
- `packages/svelte/src/test/delegation.test.ts` - Replaced 3 Wave 0 stubs with 3 passing PERF-04 delegation tests

## Decisions Made

- `handleBodyClick` uses `visibleRows[rowIndex]` in normal mode and `sortedRows[rowIndex]` in virtual mode; `rowIndex` from `data-row` attribute is the direct index into these arrays
- No `e.stopPropagation()` needed on td since per-td handlers were removed
- CSS containment was already correct from Wave 2; no style block changes required

## Deviations from Plan

None — plan executed exactly as written. CSS containment was already present from Wave 2 as noted in the plan's `<action>` section ("Already present" observation confirmed).

## Issues Encountered

None. Typecheck: 0 errors, 4 warnings (pre-existing accessibility warnings — tbody keyboard/mouse interaction is architecturally intentional per WCAG roving tabindex pattern, documented in STATE.md).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- PERF-03 (CSS containment) and PERF-04 (event delegation) both complete
- TableBody now has O(1) event listener count regardless of row count
- Wave 4 (04-04) can proceed: Web Worker sort integration
- 2 PERF-06 stubs in virtual.test.ts remain pending Wave 5 (04-05)

---
*Phase: 04-virtual-scrolling-performance*
*Completed: 2026-03-22*
