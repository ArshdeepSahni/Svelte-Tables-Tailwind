---
phase: 03-svelte-5-component-zero-config-api
plan: "01"
subsystem: svelte
tags: [types, testing, vitest, accessibility, tdd, red-state]
dependency_graph:
  requires: [packages/core/src/types.ts]
  provides: [packages/svelte/src/lib/types.ts, packages/svelte/src/test/setup.ts, packages/svelte/src/lib/Table.test.ts]
  affects: [packages/svelte/vitest.config.ts]
tech_stack:
  added: [vitest-axe@1.0.0-pre.5]
  patterns: [TDD RED state, vi.mock for core engine, vi.stubGlobal for browser APIs]
key_files:
  created:
    - packages/svelte/src/lib/types.ts
    - packages/svelte/src/test/setup.ts
  modified:
    - packages/svelte/src/lib/Table.test.ts
    - packages/svelte/vitest.config.ts
    - packages/svelte/package.json
decisions:
  - vitest-axe extend-expect imported in setup.ts so toHaveNoViolations matcher is globally available across all test files
  - requestIdleCallback stubbed synchronously so engine inference callback fires immediately in tests (no async wait needed)
  - Test stubs use real assertions (e.g., queryByRole, queryByText) rather than expect.fail() — stubs are self-documenting specs
  - TypeScript errors in Table.test.ts (referencing future props) are intentional RED state and resolve in plans 02-05
metrics:
  duration: 170s
  completed: "2026-03-21"
  tasks_completed: 2
  files_changed: 5
---

# Phase 3 Plan 01: Svelte-Layer Types + Full Test Scaffold Summary

**One-liner:** Svelte-layer type system (SortState, FocusedCell, Row) plus vitest-axe setup and 40-test RED suite covering 12 requirements

---

## What Was Built

Established the Phase 3 testing foundation by creating Svelte-specific TypeScript interfaces and a complete failing test suite that defines the exact contract Table.svelte must fulfill across plans 02-05.

### Task 1: Svelte-layer types, vitest-axe, test setup (commit `1fab647`)

**types.ts** — Exports Svelte-specific types plus re-exports from `@tablecraft/core` for consumer convenience:
- `SortDir`: `'asc' | 'desc' | null`
- `SortState`: `{ key: string | null; dir: SortDir }`
- `FocusedCell`: `{ rowIndex: number; colIndex: number }`
- `Row`: `Record<string, unknown>`
- Re-exports: `ColumnType`, `ColumnDefinition`, `ResolvedColumn`, `ProcessedRow`, `CellDescriptor`, `BadgeVariant`

**setup.ts** — Test environment initialization:
- `import 'vitest-axe/extend-expect'` — makes `toHaveNoViolations()` available globally
- `vi.stubGlobal('requestIdleCallback', ...)` — fires callback synchronously so inference settles immediately
- `vi.stubGlobal('cancelIdleCallback', ...)` — prevents no-op errors

**vitest.config.ts** — `setupFiles: ['./src/test/setup.ts']` wired

**package.json** — `vitest-axe@1.0.0-pre.5` added to `devDependencies`

### Task 2: Full test stub suite, RED state (commit `8e3bf29`)

40 tests across 12 describe blocks, all using real assertions (no `expect.fail()`):

| # | Describe | Requirement | Tests |
|---|----------|-------------|-------|
| 1 | zero-config rendering | SVLT-01 | 4 |
| 2 | column override API | SVLT-02 | 2 |
| 3 | sorting | SVLT-03 | 4 |
| 4 | global search filter | SVLT-04 | 3 |
| 5 | pagination | SVLT-06 | 4 |
| 6 | empty state | SVLT-07 | 3 |
| 7 | loading state | SVLT-08 | 3 |
| 8 | row selection | SVLT-09 | 4 |
| 9 | keyboard navigation | SVLT-11 | 4 |
| 10 | WCAG 2.1 AA | SVLT-12 | 4 |
| 11 | row/cell click events | SVLT-13 | 2 |
| 12 | v1 backward compat | SVLT-15 | 3 |

**Test run result:** 40 tests, 31 failing (RED — correct), 9 passing (Phase 1 stub already satisfies those assertions). Zero config errors.

The `vi.mock('@tablecraft/core')` at top intercepts `createTableEngine` with a deterministic mock: `resolveColumns` returns `text`-typed columns derived from data keys; `processRows` returns pass-through cell descriptors.

---

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Use real assertions over `expect.fail()` | Tests are self-documenting specs — each failure message tells implementers exactly what to build |
| Synchronous requestIdleCallback stub | Tests that expect inference-settled state (column types, labels) work without async delays |
| TypeScript errors in test file are intentional | Props like `loading`, `selectable`, `pageSize` don't exist on Phase 1 stub — they're RED by design; resolve when Table.svelte is implemented |
| vitest-axe pinned to `1.0.0-pre.5` | Exact version from plan; latest stable pre-release with Vitest 4 compatibility |

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Verification Results

| Check | Result |
|-------|--------|
| `types.ts` exists with SortDir, SortState, FocusedCell, Row, core re-exports | PASS |
| `vitest-axe@1.0.0-pre.5` in packages/svelte devDependencies | PASS |
| `setup.ts` imports `vitest-axe/extend-expect` | PASS |
| `setup.ts` stubs `requestIdleCallback` and `cancelIdleCallback` globally | PASS |
| `vitest.config.ts` `setupFiles` points to `./src/test/setup.ts` | PASS |
| `Table.test.ts` contains 40 tests for 12 requirements | PASS |
| Test run completes with no config errors | PASS |
| 31 tests failing (RED state — expected) | PASS |

---

## Self-Check: PASSED

All files exist and commits are verified below.
