---
phase: 06-column-operations-advanced-features
plan: 01
subsystem: ui
tags: [svelte5, css, typescript, localStorage, playwright, vitest]

# Dependency graph
requires:
  - phase: 05-web-components-core-framework-wrappers
    provides: Table.svelte production component with virtual scrolling and column virtualization
provides:
  - clip-path fix on .tc-table-wrapper enabling position:sticky for pinned columns
  - AggregateFunction type and aggregate field on ColumnDefinition in @tablecraft/core
  - ProcessedGroupRow interface in @tablecraft/svelte types.ts
  - density prop (compact/comfortable/spacious) with --tc-row-height CSS var mapping
  - persistKey prop with debounced localStorage save/load and SSR safety
  - Wave 0 Playwright stubs in e2e/adv.spec.ts for ADV-01/02/03/06
affects:
  - 06-02 (column resize — uses colWidths state, persistKey save pattern)
  - 06-03 (column reorder — uses columnOrder state)
  - 06-04 (column pinning — requires clip-path fix to work correctly)
  - 06-05 (row grouping — uses ProcessedGroupRow type)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - clip-path:inset(0 round Xrem) instead of overflow:hidden for border-radius + sticky children
    - rowHeightMap const maps density string to px value for CSS var injection
    - $effect with clearTimeout return for debounced localStorage writes
    - typeof localStorage !== 'undefined' SSR guard pattern for browser-only APIs
    - test.skip(true, reason) for Wave 0 Playwright stubs that CI must not fail

key-files:
  created:
    - packages/svelte/src/test/adv-density-persist.test.ts
    - e2e/adv.spec.ts
  modified:
    - packages/core/src/types.ts
    - packages/svelte/src/lib/types.ts
    - packages/svelte/src/lib/Table.svelte

key-decisions:
  - "clip-path:inset(0 round 0.75rem) replaces overflow:hidden on .tc-table-wrapper — preserves border-radius visual while allowing position:sticky children (Wave 4 pinning requirement)"
  - "rowHeightMap as const object for density→px mapping — avoids switch statement, TypeScript-safe, single source of truth for all three density values"
  - "persistKey save $effect returns clearTimeout cleanup — Svelte $effect cleanup pattern prevents stale timer firing after component destroy"
  - "test.skip(true, reason) for Wave 0 Playwright stubs — test.todo is not a function in Playwright 1.58; test.skip reports 33 skipped, 0 failed so CI stays green"
  - "hiddenColumns added as $bindable(new Set<string>()) — allows parent to bind and read/write hidden column set bidirectionally"

patterns-established:
  - "Density pattern: const rowHeightMap = { compact: 32, comfortable: 48, spacious: 64 } as const — applied via style attribute on scroll container"
  - "SSR guard: typeof localStorage === 'undefined' check wraps all browser storage access in $effects"
  - "Debounce pattern: setTimeout in $effect with return () => clearTimeout(timer) for cleanup"
  - "Wave 0 stub pattern: test.skip(true, 'Wave N — not yet implemented') for future Playwright tests"

requirements-completed: [ADV-04, ADV-08, ADV-09]

# Metrics
duration: 4min
completed: 2026-03-22
---

# Phase 6 Plan 01: Foundation — CSS Fix, Type Extensions, Density + Persistence Summary

**clip-path sticky fix, AggregateFunction + ProcessedGroupRow types, density CSS var prop, debounced persistKey localStorage save/load with SSR guard, and Wave 0 Playwright stubs — 58 tests green**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-22T11:07:02Z
- **Completed:** 2026-03-22T11:11:15Z
- **Tasks:** 3
- **Files modified:** 5 (3 modified, 2 created)

## Accomplishments
- Fixed critical CSS bug: `overflow: hidden` on `.tc-table-wrapper` replaced with `clip-path: inset(0 round 0.75rem)` — unblocks `position: sticky` for column pinning in Wave 4
- Extended type system: `AggregateFunction` type and `aggregate?` field on `ColumnDefinition` in `@tablecraft/core`; `ProcessedGroupRow` interface in `@tablecraft/svelte` types.ts
- Added `density` prop with `rowHeightMap` mapping to `--tc-row-height` CSS variable (32/48/64px) applied on `.tc-table-scroll`
- Added `persistKey` prop: load `$effect` restores 6 state fields (sortState, filterQuery, currentPage, colWidths, columnOrder, hiddenColumns) from localStorage with v:1 version guard and SSR safety; save `$effect` writes debounced 300ms JSON
- Created `e2e/adv.spec.ts` Wave 0 stubs for ADV-01 (resize), ADV-02 (reorder), ADV-03 (pinning), ADV-06 (grouping) — 33 skipped, 0 failed

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix CSS bug + extend types** - `bb66945` (feat)
2. **Task 2: Add density prop + persistKey prop** - `382f53b` (feat)
3. **Task 3: Create Wave 0 Playwright stub** - `917a0c8` (feat)

## Files Created/Modified
- `packages/core/src/types.ts` — Added `AggregateFunction` type export and `aggregate?` field on `ColumnDefinition`
- `packages/svelte/src/lib/types.ts` — Added `ProcessedGroupRow` interface, re-export of `AggregateFunction`
- `packages/svelte/src/lib/Table.svelte` — Fixed CSS bug; added `density`, `persistKey`, `hiddenColumns`, `showAggregates`, `showGroupAggregates`, `groupBy` props; `rowHeightMap`; Phase 6 state (`colWidths`, `columnOrder`); two persist $effects
- `packages/svelte/src/test/adv-density-persist.test.ts` — 8 unit tests for density CSS var mapping and persistKey localStorage load/save
- `e2e/adv.spec.ts` — Wave 0 Playwright stubs for ADV-01/02/03/06 (33 skipped, 0 failed)

## Decisions Made
- `clip-path:inset(0 round 0.75rem)` replaces `overflow:hidden` — same visual border-radius clipping without blocking sticky children
- `test.skip(true, reason)` used for Wave 0 stubs because `test.todo` is not a function in Playwright 1.58.2
- `hiddenColumns` added as `$bindable(new Set<string>())` to support bidirectional binding for future column hide/show UI

## Deviations from Plan

None — plan executed exactly as written, with one minor adaptation: Playwright 1.58 lacks `test.todo` inside `test.describe`, so `test.skip(true, reason)` was used instead. Same CI behavior (0 failures).

## Issues Encountered
- `test.todo` is not a function inside `test.describe` blocks in Playwright 1.58.2 — adapted to `test.skip(true, 'Wave N — not yet implemented')` which achieves the same result (0 failures, tests marked as skipped)

## Next Phase Readiness
- CSS foundation is correct: clip-path enables sticky positioning for Wave 4 column pinning
- Type system ready: `aggregate?` on `ColumnDefinition` for Wave 2 aggregates; `ProcessedGroupRow` for Wave 5 grouping
- `colWidths` Map and `columnOrder` array state scaffolded for Wave 2/3 use
- `persistKey` save/load fully functional — Wave 3 resize can write to `colWidths` and it will persist automatically
- All 58 tests green; 0 TypeScript errors; Playwright 0 failures

---
*Phase: 06-column-operations-advanced-features*
*Completed: 2026-03-22*
