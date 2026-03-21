---
phase: 03-svelte-5-component-zero-config-api
plan: "03"
subsystem: ui
tags: [svelte5, svelte, accessibility, aria, sorting, checkbox, indeterminate]

requires:
  - phase: 03-svelte-5-component-zero-config-api
    provides: types.ts (SortState, SortDir), @tablecraft/core (ResolvedColumn), test scaffold, vitest-axe
provides:
  - TableHeader.svelte — <thead> with sortable headers, aria-sort, sort indicators, keyboard access
  - Checkbox.svelte — three-state checkbox with indeterminate via bind:this + $effect
affects:
  - 03-04 (Table.svelte assembles TableHeader + Checkbox)
  - 03-05 (selection state feeds allSelected/someSelected to TableHeader)

tech-stack:
  added: []
  patterns:
    - "Svelte 5 indeterminate pattern: bind:this + $effect (no bind:indeterminate)"
    - "One-way prop binding {checked} + oncheckedchange callback (no bind:checked)"
    - "aria-sort computed per column from sortState: ascending/descending/none/undefined"
    - "Sort indicator text (▲/▼) appended inline to column label string"
    - "tabindex=0 on sortable th elements for keyboard access; Enter/Space fire sort"
    - "CSS custom property tokens (--tc-header-bg, --tc-color-primary) with hardcoded fallbacks"

key-files:
  created:
    - packages/svelte/src/lib/TableHeader.svelte
    - packages/svelte/src/lib/Checkbox.svelte
  modified: []

key-decisions:
  - "Svelte 5 has no bind:indeterminate — indeterminate DOM property set via bind:this ref + $effect"
  - "One-way {checked} attribute not bind:checked prevents two-way binding conflict with parent prop"
  - "aria-sort=undefined (not 'none') for non-sortable columns per WCAG spec"
  - "getSortIndicator appends space + unicode arrow to label string (no separate span element)"

patterns-established:
  - "TableHeader: all sort UI lives here — aria-sort, visual indicators, keyboard events"
  - "Checkbox: DOM property mutation via $effect is the canonical Svelte 5 indeterminate pattern"

requirements-completed:
  - SVLT-03
  - SVLT-09
  - SVLT-12

duration: 1min
completed: 2026-03-21
---

# Phase 3 Plan 03: TableHeader and Checkbox Sub-Components Summary

**Sortable <thead> with WCAG aria-sort + three-state indeterminate Checkbox via Svelte 5 bind:this + $effect pattern**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-03-21T17:00:31Z
- **Completed:** 2026-03-21T17:01:30Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- TableHeader.svelte renders `<thead>` with `<th scope="col" role="columnheader">` per column, aria-sort computed from sortState, and ▲/▼ sort indicators appended to column label text
- Checkbox.svelte implements the three-state checkbox using bind:this + $effect to set the indeterminate DOM property — the required Svelte 5 pattern since bind:indeterminate does not exist
- Zero TypeScript errors in either new file; all existing errors are intentional RED test stubs for future props in Table.test.ts (documented in STATE.md)

## Task Commits

Each task was committed atomically:

1. **Task 1: TableHeader.svelte — sortable thead with aria-sort** - `986f3ee` (feat)
2. **Task 2: Checkbox.svelte — three-state checkbox via bind:this + $effect** - `7f01ce3` (feat)

## Files Created/Modified

- `packages/svelte/src/lib/TableHeader.svelte` — `<thead>` with per-column `<th>`, aria-sort, ▲/▼ sort indicators, onclick+onkeydown sort handler, select-all Checkbox cell when selectable
- `packages/svelte/src/lib/Checkbox.svelte` — Three-state checkbox; indeterminate set via bind:this + $effect; one-way {checked}; oncheckedchange callback

## Decisions Made

- `indeterminate` cannot be set as a DOM attribute (browser ignores it); must set the DOM property directly. Svelte 5 provides bind:this for the ref; $effect fires after mount/update to apply `inputEl.indeterminate = indeterminate`.
- `{checked}` (one-way) not `bind:checked` — two-way bind would fight the parent's reactive prop on each update cycle.
- aria-sort returns `undefined` for non-sortable columns (attribute omitted from DOM), not `'none'` — per WCAG spec aria-sort is only valid on columns that support sorting.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- TableHeader.svelte and Checkbox.svelte are complete sub-components ready to be imported by Table.svelte (plan 03-02 already imports Cell.svelte; plans 03-04/03-05 will wire TableHeader + Checkbox into the main component)
- Both components compile with zero errors; aria-sort, sort indicators, indeterminate pattern all verified

---
*Phase: 03-svelte-5-component-zero-config-api*
*Completed: 2026-03-21*
