---
phase: 03-svelte-5-component-zero-config-api
plan: "04"
subsystem: svelte
tags: [svelte5, tbody, pagination, keyboard-navigation, accessibility, skeleton, empty-state]
dependency_graph:
  requires:
    - packages/svelte/src/lib/Cell.svelte
    - packages/svelte/src/lib/Checkbox.svelte
    - packages/core/src/types.ts
    - packages/svelte/src/lib/types.ts
  provides:
    - packages/svelte/src/lib/TableBody.svelte
    - packages/svelte/src/lib/TableFooter.svelte
  affects:
    - packages/svelte/src/lib/Table.svelte (will import these in plan 05)
tech_stack:
  added: []
  patterns:
    - Svelte 5 Snippet type for custom empty state slot
    - Roving tabindex keyboard navigation pattern (WCAG 2.1 AA)
    - CSS custom properties (--tc-*) shimmer animation for loading skeleton
    - ProcessedRow/CellDescriptor pipeline through Cell.svelte
key_files:
  created:
    - packages/svelte/src/lib/TableBody.svelte
    - packages/svelte/src/lib/TableFooter.svelte
  modified: []
decisions:
  - "aria-selected uses boolean (not String) value — Svelte's Booleanish type requires boolean | null | undefined, not string"
  - "Skeleton {#each} uses unnamed iterator (as _) — TypeScript noUnusedLocals prevents named but unused loop variables"
  - "tbody onkeydown accepted despite a11y warning — roving tabindex grid navigation requires tbody to receive keyboard events per WCAG 2.1 AA; warning is architecturally intentional"
metrics:
  duration: ~4min
  completed: "2026-03-21"
  tasks_completed: 2
  files_changed: 2
---

# Phase 3 Plan 04: TableBody + TableFooter Summary

**One-liner:** TableBody.svelte with Cell-dispatched data rows, loading skeleton shimmer, empty-state Snippet, roving-tabindex keyboard nav, and row selection; TableFooter.svelte with first/prev/next/last pagination controls hidden when single-page

---

## What Was Built

### Task 1: TableBody.svelte (commit `4c55913`)

**`packages/svelte/src/lib/TableBody.svelte`** — the primary rendering surface for table data:

- **Data rows branch**: Iterates `visibleRows: ProcessedRow[]`, renders a `<td>` per column via `<Cell {descriptor} />`, roving tabindex (`tabindex=0` on focused cell, `-1` on all others), `onclick` stops propagation and fires `oncellclick`
- **Loading skeleton branch**: `{#if loading}` renders `skeletonRows` (default 5) placeholder `<tr>` elements with `aria-hidden="true"` and `.tc-skeleton-cell` divs that animate a shimmer via `@keyframes tc-shimmer`
- **Empty state branch**: `{:else if visibleRows.length === 0}` renders a single `<td colspan={...}>` with either the custom `empty` Snippet or the `emptyMessage` string (default: "No data")
- **Row selection**: When `selectable=true`, a `<Checkbox>` cell appears first in each row; `aria-selected={isSelected}` boolean on `<tr>`; `onrowtoggle` callback fires on checkbox change
- **Keyboard navigation**: `onkeydown={handleKeyDown}` on `<tbody>`; handles ArrowRight/Left/Down/Up (with `e.preventDefault()` on vertical arrows to stop scroll), Home, End; focuses target `<td>` via `querySelectorAll` + `.focus()`
- **Props**: `visibleRows`, `columns`, `loading`, `skeletonRows`, `selectable`, `selectedRows`, `emptyMessage`, `striped`, `bordered`, `empty` (Snippet), `onrowclick`, `oncellclick`, `onrowtoggle`
- **Imports**: `Cell` from `./Cell.svelte`, `Checkbox` from `./Checkbox.svelte`, `Snippet` from `'svelte'`

| CSS class | Purpose |
|-----------|---------|
| `.tc-tr:hover` | Row hover background |
| `.tc-tr--selected` | Selected row (blue tint) |
| `.tc-tr--striped` | Alternating row background |
| `.tc-td` | Cell padding, border, height, vertical-align |
| `.tc-td--bordered` | Column divider border-right |
| `.tc-td--empty` | Centered muted empty state |
| `.tc-td:focus-visible` | Keyboard focus ring |
| `.tc-td--checkbox` | Fixed-width checkbox column |
| `.tc-skeleton-cell` | Animated shimmer placeholder |

### Task 2: TableFooter.svelte (commit `d62d20a`)

**`packages/svelte/src/lib/TableFooter.svelte`** — pagination controls below the table:

- Entirely hidden when `totalPages <= 1` (no `{#if}` wrapper rendered at all)
- `role="navigation"` + `aria-label="Table pagination"` for screen reader landmark
- Info text: `Page {currentPage} of {totalPages} ({totalRows} rows)` in `.tc-footer__info`
- Four buttons with `aria-label` and `disabled` states:
  - `|<` First — `onclick={() => onpagechange(1)}`, disabled when `currentPage === 1`
  - `<` Previous — `onclick={() => onpagechange(currentPage - 1)}`, disabled when `currentPage === 1`
  - `>` Next — `onclick={() => onpagechange(currentPage + 1)}`, disabled when `currentPage === totalPages`
  - `>|` Last — `onclick={() => onpagechange(totalPages)}`, disabled when `currentPage === totalPages`
- Props: `currentPage`, `totalPages`, `totalRows`, `onpagechange` (no createEventDispatcher)

---

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| `aria-selected` uses boolean value (not string) | Svelte's `Booleanish` type for `aria-selected` is `boolean \| null \| undefined`; `String(isSelected)` caused a TS error — fixed to pass `isSelected` directly |
| Skeleton `{#each}` uses unnamed iterator (`as _`) | TypeScript `noUnusedLocals` rejects declared-but-unused `i` variable; renamed to just `_` (Svelte 5 allows anonymous iteration) |
| `tbody` `onkeydown` despite a11y warning | WCAG 2.1 AA grid navigation requires `<tbody>` to receive keyboard events for the roving tabindex pattern; warning is architecturally correct and intentional |

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Unused loop variable `i` in skeleton each block**
- **Found during:** Task 1 — typecheck
- **Issue:** `{#each { length: skeletonRows } as _, i}` — `i` was unused, causing TS error `'i' is declared but its value is never read`
- **Fix:** Changed to `{#each { length: skeletonRows } as _}` (anonymous iterator)
- **Files modified:** `packages/svelte/src/lib/TableBody.svelte`
- **Commit:** included in `4c55913`

**2. [Rule 1 - Bug] `aria-selected` type mismatch**
- **Found during:** Task 1 — typecheck
- **Issue:** `aria-selected={selectable ? String(isSelected) : undefined}` — plan spec used `String(isSelected)` but Svelte's type for `aria-selected` is `Booleanish | null | undefined` which does not accept `string`
- **Fix:** Changed to `aria-selected={selectable ? isSelected : undefined}` — passes the boolean directly
- **Files modified:** `packages/svelte/src/lib/TableBody.svelte`
- **Commit:** included in `4c55913`

---

## Verification Results

| Check | Result |
|-------|--------|
| `pnpm --filter @tablecraft/svelte typecheck` — TableBody.svelte has zero TS errors | PASS |
| `pnpm --filter @tablecraft/svelte typecheck` — TableFooter.svelte has zero TS errors | PASS |
| TableBody.svelte contains `{#if loading}` skeleton branch | PASS |
| TableBody.svelte contains `{:else if visibleRows.length === 0}` empty branch | PASS |
| TableBody.svelte contains `{:else}` data rows with `Cell {descriptor}` | PASS |
| TableBody.svelte contains `onkeydown={handleKeyDown}` on `<tbody>` | PASS |
| `handleKeyDown` handles ArrowRight, ArrowLeft, ArrowDown, ArrowUp, Home, End | PASS |
| TableBody.svelte: `aria-selected` on rows when `selectable` | PASS |
| TableBody.svelte: `Snippet` type imported from `'svelte'` for `empty` prop | PASS |
| TableBody.svelte: no `createEventDispatcher` | PASS |
| TableFooter.svelte contains `{#if totalPages > 1}` guard | PASS |
| TableFooter.svelte: First/Prev/Next/Last buttons with aria-labels | PASS |
| TableFooter.svelte: disabled states correct (currentPage === 1, currentPage === totalPages) | PASS |
| TableFooter.svelte: `role="navigation"` with `aria-label` | PASS |
| TableFooter.svelte: no `createEventDispatcher` | PASS |
| Pre-existing Table.test.ts TS errors unchanged (intentional RED from plan 03-01) | PASS |

---

## Self-Check: PASSED

Files exist and commits verified:
- `packages/svelte/src/lib/TableBody.svelte` — exists, commit `4c55913`
- `packages/svelte/src/lib/TableFooter.svelte` — exists, commit `d62d20a`
