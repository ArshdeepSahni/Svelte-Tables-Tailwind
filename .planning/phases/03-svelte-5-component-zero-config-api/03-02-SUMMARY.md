---
phase: 03-svelte-5-component-zero-config-api
plan: "02"
subsystem: ui
tags: [svelte, svelte5, cell-renderer, search, xss-safety, css-custom-properties, debounce]

# Dependency graph
requires:
  - phase: 03-01
    provides: Svelte package setup, test infrastructure, Table.svelte stub, types.ts
  - phase: 02-core-engine-type-inference-renderer-registry
    provides: CellDescriptor union type, BadgeVariant, @tablecraft/core package

provides:
  - Cell.svelte: CellDescriptor -> safe Svelte markup dispatcher (10 kinds via {#if} chain)
  - SearchInput.svelte: debounced global filter input with onfilter callback prop

affects:
  - 03-03-PLAN (Table.svelte full implementation imports Cell.svelte)
  - 03-05-PLAN (Table.svelte wires SearchInput.svelte for global filtering)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "{#if} chain for CellDescriptor dispatch — statically analyzable, no dynamic component"
    - "window.setTimeout/clearTimeout to resolve Node.js Timeout vs DOM number type ambiguity"
    - "onDestroy cleanup for setTimeout timers to prevent memory leaks"
    - "Svelte 5 $props() and $state() for component state — no createEventDispatcher"

key-files:
  created:
    - packages/svelte/src/lib/Cell.svelte
    - packages/svelte/src/lib/SearchInput.svelte
  modified: []

key-decisions:
  - "window.clearTimeout/window.setTimeout instead of bare clearTimeout/setTimeout — resolves Node Timeout vs DOM number type conflict in strict TypeScript"
  - "debounceTimer typed as number | undefined (DOM type) not ReturnType<typeof setTimeout> (Node type) — cleaner in browser-context Svelte files"
  - "eslint-disable-next-line comment on {@html} line to allow single documented exception to svelte/no-at-html-tags: error rule"

patterns-established:
  - "Cell.svelte {#if} chain: text/number/link/image/badge/status/boolean/code/html/raw order — readable and exhaustive"
  - "Only descriptor.sanitized ever passes through {@html} — all other CellDescriptor kinds use text bindings"
  - "CSS custom property fallback pattern: var(--tc-color-success, #16a34a) — hardcoded fallback for standalone use"

requirements-completed:
  - SVLT-01
  - SVLT-04
  - SVLT-07

# Metrics
duration: 2min
completed: 2026-03-21
---

# Phase 3 Plan 02: Cell.svelte and SearchInput.svelte Summary

**Cell.svelte XSS-safety firewall with 10-kind {#if} dispatcher and SearchInput.svelte with 150ms-debounced onfilter callback prop, both zero TypeScript errors**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-21T17:00:30Z
- **Completed:** 2026-03-21T17:02:31Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Cell.svelte created: handles all 10 CellDescriptor kinds (text/number/link/image/badge/status/boolean/code/html/raw) via a single {#if} chain — no dynamic component resolution
- FOUND-07 XSS firewall: only `{@html descriptor.sanitized}` is used — inside the `html` kind branch only; all other kinds use text bindings
- SearchInput.svelte created: 150ms debounce via window.setTimeout, onfilter callback prop (no createEventDispatcher), onDestroy cleanup, aria-label on input
- Both files compile with zero TypeScript errors; `pnpm --filter @tablecraft/svelte typecheck` shows no errors in Cell.svelte or SearchInput.svelte

## Task Commits

Each task was committed atomically:

1. **Task 1: Cell.svelte — CellDescriptor to safe markup dispatcher** - `ca97e7d` (feat)
2. **Task 2: SearchInput.svelte — debounced global filter input** - `0487de3` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `packages/svelte/src/lib/Cell.svelte` — CellDescriptor dispatcher: 10 kinds handled, {#if} chain, badge/status variant CSS classes (default/success/warning/danger/info), CSS custom property tokens with fallbacks
- `packages/svelte/src/lib/SearchInput.svelte` — 150ms debounced input, onfilter callback prop, Svelte 5 $props()/$state(), onDestroy cleanup, focus-visible ring

## Decisions Made

- `window.setTimeout`/`window.clearTimeout` used instead of bare `setTimeout`/`clearTimeout` — TypeScript strict mode identifies a type conflict between Node.js `Timeout` (returned by Node setTimeout) and DOM `number` (returned by browser setTimeout). Using `window.*` explicitly targets the browser API, resolves the type conflict cleanly.
- `debounceTimer` typed as `number | undefined` rather than `ReturnType<typeof setTimeout>` — consistent with the DOM type and avoids Node.js type leaking into browser component code.
- ESLint `<!-- eslint-disable-next-line svelte/no-at-html-tags -->` comment added to the `{@html descriptor.sanitized}` line — the eslint config has `svelte/no-at-html-tags: error` globally; this single architecturally documented exception is the correct approach per plan instructions.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type error on clearTimeout/setTimeout in SearchInput.svelte**
- **Found during:** Task 2 (SearchInput.svelte creation)
- **Issue:** `let debounceTimer: ReturnType<typeof setTimeout>` produces two TypeScript errors — `clearTimeout` has no overload matching `Timeout | undefined` because Node's `Timeout` type and DOM's `number` type conflict in strict mode
- **Fix:** Changed `debounceTimer` type to `number | undefined` and used `window.clearTimeout`/`window.setTimeout` to target DOM APIs explicitly
- **Files modified:** packages/svelte/src/lib/SearchInput.svelte
- **Verification:** `pnpm --filter @tablecraft/svelte typecheck` shows zero errors for SearchInput.svelte
- **Committed in:** `0487de3` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug: TypeScript type error)
**Impact on plan:** Auto-fix necessary for correctness in strict TypeScript. No scope creep.

## Issues Encountered

None beyond the auto-fixed deviation above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Cell.svelte and SearchInput.svelte are ready for import by Table.svelte (plan 03-03 / 03-05)
- Both components have zero TypeScript errors and are correctly typed against @tablecraft/core's CellDescriptor union
- The {#if} chain in Cell.svelte is exhaustive — the {:else} catch-all handles the `raw` kind via String(descriptor.value)
- SearchInput.svelte's onfilter prop matches the expected interface Table.svelte will wire to its filter state

---
*Phase: 03-svelte-5-component-zero-config-api*
*Completed: 2026-03-21*
