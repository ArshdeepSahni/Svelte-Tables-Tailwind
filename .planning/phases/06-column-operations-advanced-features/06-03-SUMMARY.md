---
phase: 06-column-operations-advanced-features
plan: "03"
subsystem: svelte-table-resize
tags: [column-resize, pointer-events, drag, table-layout-fixed, e2e]
dependency_graph:
  requires: [06-02]
  provides: [column-resize-adv-01]
  affects: [TableHeader.svelte, Table.svelte, e2e/adv.spec.ts]
tech_stack:
  added: []
  patterns:
    - setPointerCapture for reliable pointer tracking during fast drag
    - new Map(colWidths).set(key, width) for Svelte $state reactivity on Map update
    - $derived(colWidths.size > 0) for conditional table-layout:fixed
    - Absolute-positioned ::after pseudo-element for hover-revealed resize indicator
key_files:
  created: []
  modified:
    - packages/svelte/src/lib/Table.svelte
    - packages/svelte/src/lib/TableHeader.svelte
    - e2e/adv.spec.ts
decisions:
  - handleColResize creates new Map (not mutates) — required for Svelte $state to detect change
  - setPointerCapture on the resize handle div (not the th) prevents pointer loss during fast drag
  - stopPropagation in handleResizePointerDown prevents sort from triggering during resize
  - test.skip(true) used instead of test.todo — Playwright 1.58.2 does not support test.todo inside describe
  - Resize handle added to both virtual and non-virtual column rendering paths
metrics:
  duration: 477s
  completed: "2026-03-22"
  tasks_completed: 2
  files_changed: 3
---

# Phase 06 Plan 03: Column Resize (ADV-01) Summary

Pointer-event-based column resizing with setPointerCapture, live colWidths Map state in Table.svelte, and 6 passing Playwright e2e tests across Chromium/Firefox/WebKit.

---

## What Was Built

Column resizing is implemented in two files:

**Table.svelte** — owns the `colWidths` Map state:
- `handleColResize(key, width)` replaces the Map with `new Map(colWidths).set(key, width)` — new reference required for Svelte reactivity
- `hasCustomWidths = $derived(colWidths.size > 0)` drives conditional `table-layout: fixed`
- Both `<table>` elements (virtual and non-virtual) get `class:tc-table--fixed-layout={hasCustomWidths}`
- Both `<TableHeader>` instances receive `{colWidths}` and `oncolresize={handleColResize}`
- CSS `.tc-table--fixed-layout { table-layout: fixed }` added

**TableHeader.svelte** — owns the drag interaction:
- Props interface extended with `colWidths?: Map<string, number>` and `oncolresize?: (key: string, width: number) => void`
- Resize state: `resizingKey`, `resizeStartX`, `resizeStartWidth` — all `$state()`
- `handleResizePointerDown`: sets pointer capture, records start position, sets cursor/userSelect
- `handleResizePointerMove`: calculates delta, clamps to `[minWidth ?? 60, maxWidth ?? Infinity]`, calls `oncolresize`
- `handleResizePointerUp`/`onpointercancel`: resets resizingKey, cursor, userSelect
- Resize handle `<div class="tc-resize-handle">` added to every `<th>` in both virtual and non-virtual rendering paths
- Width style applied to `<th>`: `style="width: {colWidths.get(col.key) ?? col.minWidth ?? 150}px; min-width: {col.minWidth ?? 60}px;"`
- CSS: `.tc-resize-handle` absolute-positioned 8px wide on right edge; `::after` hover indicator (opacity transitions 0→1)

**e2e/adv.spec.ts** — ADV-01 tests:
- "drag resize handle increases column width" — drags 100px right, asserts new offsetWidth > initial
- "drag resize handle respects minWidth constraint" — drags 500px left, asserts finalWidth >= 60
- All 3 browsers: 6/6 ADV-01 tests pass; 27 stub tests correctly skipped

---

## Tasks Completed

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Add colWidths + handleColResize + table-layout:fixed to Table.svelte | 3b96763 | packages/svelte/src/lib/Table.svelte |
| 2 | Resize handle in TableHeader.svelte + Playwright ADV-01 tests | ea86bc2 | packages/svelte/src/lib/TableHeader.svelte, e2e/adv.spec.ts |

---

## Verification Results

- `pnpm --filter @tablecraft/svelte run test` — 71/71 tests pass
- `pnpm exec playwright test e2e/adv.spec.ts --project=chromium` — 2 pass, 9 skip
- `pnpm exec playwright test e2e/adv.spec.ts` — 6 pass (all browsers), 27 skip
- `grep -n "setPointerCapture"` — line 63 in TableHeader.svelte
- `grep -n "tc-resize-handle"` — lines 137, 191, 274, 285, 298 in TableHeader.svelte
- `grep -n "tc-table--fixed-layout"` — lines 562, 623, 728 in Table.svelte

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] test.todo not a function in Playwright 1.58.2**
- **Found during:** Task 2 — first Playwright test run
- **Issue:** `test.todo('...')` throws `TypeError: _test.test.todo is not a function` inside `test.describe` in Playwright 1.58.2 (pre-existing decision in STATE.md from Plan 06-01)
- **Fix:** Replaced `test.todo(...)` with `test('...', async () => { test.skip(true, '...') })` pattern — consistent with all other stub tests in adv.spec.ts
- **Files modified:** e2e/adv.spec.ts (line 53)
- **Commit:** ea86bc2 (included in Task 2 commit)

**2. [Rule 3 - Blocking] Firefox/WebKit Playwright browser binaries missing**
- **Found during:** Task 2 — Playwright test run failed with browser executable not found
- **Fix:** Ran `pnpm exec playwright install firefox webkit` to download missing binaries
- **Result:** All 6 ADV-01 tests now pass across Chromium, Firefox, and WebKit

---

## Self-Check: PASSED

| Item | Status |
| ---- | ------ |
| packages/svelte/src/lib/TableHeader.svelte | FOUND |
| packages/svelte/src/lib/Table.svelte | FOUND |
| e2e/adv.spec.ts | FOUND |
| Commit 3b96763 | FOUND |
| Commit ea86bc2 | FOUND |
