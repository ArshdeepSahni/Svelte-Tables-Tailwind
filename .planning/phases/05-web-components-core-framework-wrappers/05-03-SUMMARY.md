---
phase: 05-web-components-core-framework-wrappers
plan: "03"
subsystem: react/wrapper
tags:
  - web-components
  - react
  - lit
  - typescript
  - framework-wrappers
dependency_graph:
  requires:
    - "05-02: TcTable LitElement implemented in packages/core/src/element.ts, ./element export entry in packages/core/package.json"
  provides:
    - "packages/react/src/index.ts: Real @lit/react createComponent() wrapper — Table component + 5 event detail types"
    - "packages/react/src/index.test.ts: Unit tests confirming wrapper exports and React component shape"
  affects:
    - "packages/react: stub replaced with real wrapper; zero TypeScript errors"
tech_stack:
  added:
    - "@lit/react createComponent() adapter bridging React reconciler to tc-table Custom Element"
    - "5 CustomEvent → React prop mappings (EventName<CustomEvent<T>> typed)"
    - "5 typed CustomEvent detail interfaces exported from react package"
  patterns:
    - "Row type defined locally as Record<string, unknown> (not exported from @tablecraft/core)"
    - "jsdom test environment required for LitElement HTMLElement dependency at import time"
    - "createComponent() returns forwardRef object (typeof 'object') not plain function in React 19"
key_files:
  created:
    - packages/react/src/index.test.ts
  modified:
    - packages/react/src/index.ts
decisions:
  - "Row type defined locally in react package — @tablecraft/core does not export Row; element.ts defines it locally too"
  - "jsdom environment override in test file replaces @vitest-environment node — LitElement needs HTMLElement at module load"
  - "Test asserts typeof Table is function OR object with $$typeof — @lit/react createComponent() returns forwardRef (object) in React 19"
metrics:
  duration: 266s
  completed: "2026-03-22"
  tasks: 2
  files: 2
---

# Phase 5 Plan 03: React Wrapper via @lit/react Summary

**One-liner:** @lit/react createComponent() wrapper for tc-table with all 5 CustomEvents mapped to typed React prop handlers and zero TypeScript errors.

---

## What Was Built

### Task 1: React wrapper (`packages/react/src/index.ts`)

75-line full implementation replacing the Phase 1 stub:

- **createComponent() call:** `tagName: 'tc-table'`, `elementClass: TcTable`, `displayName: 'Table'`
- **5 event mappings:** `onCellClick → 'tc-cell-click'`, `onRowClick → 'tc-row-click'`, `onSortChange → 'tc-sort-change'`, `onFilterChange → 'tc-filter-change'`, `onSelectChange → 'tc-select-change'`
- **5 TypeScript detail interfaces:** `TcCellClickDetail`, `TcRowClickDetail`, `TcSortChangeDetail`, `TcFilterChangeDetail`, `TcSelectChangeDetail` — all exported
- **Row type alias:** `Record<string, unknown>` defined locally (mirrors element.ts; not exported from @tablecraft/core)
- **Type re-exports:** `ColumnOverrideShort`, `ColumnDefinition`, `ResolvedColumn` from `@tablecraft/core`
- **Zero Svelte imports:** No `@tablecraft/svelte` or Svelte dependency anywhere
- **Zero TypeScript errors:** `tsc --noEmit` exits clean

### Task 2: React wrapper unit tests (`packages/react/src/index.test.ts`)

3 tests replacing the Phase 1 stub tests:

- `WC-07: Table component is exported as a React component` — confirms `Table` is defined and is a valid React component (function or forwardRef object with `$$typeof`)
- `WC-07: event detail types are exported` — confirms module loads without runtime error
- `WC-07: Row and ColumnDefinition types are re-exported` — confirms module loads without runtime error

All 3 tests GREEN.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `Row` is not exported from `@tablecraft/core`**
- **Found during:** Task 1 (TypeScript compile error — `Module '@tablecraft/core' has no exported member 'Row'`)
- **Issue:** Plan's action code imported `Row` from `@tablecraft/core`, but the package only exports `Record<string, unknown>` under various named interfaces — `Row` is defined locally in `element.ts`
- **Fix:** Defined `export type Row = Record<string, unknown>` locally in `index.ts`; removed `Row` from `@tablecraft/core` import
- **Files modified:** `packages/react/src/index.ts`
- **Commit:** 863afa7

**2. [Rule 1 - Bug] Test used `// @vitest-environment node` but module requires `HTMLElement`**
- **Found during:** Task 2 test run (`ReferenceError: HTMLElement is not defined`)
- **Issue:** Plan's test template specified `@vitest-environment node`, but importing `@tablecraft/core/element` triggers LitElement class definition which reads `HTMLElement` at module load — unavailable in Node environment
- **Fix:** Changed directive to `// @vitest-environment jsdom` to match `HTMLElement` requirement
- **Files modified:** `packages/react/src/index.test.ts`
- **Commit:** def52f4

**3. [Rule 1 - Bug] `createComponent()` returns `typeof 'object'` not `'function'` in React 19**
- **Found during:** Task 2 test run (`expected 'object' to be 'function'`)
- **Issue:** Plan's test asserted `typeof mod.Table === 'function'`, but `@lit/react` uses `React.forwardRef()` internally — the result is `typeof 'object'` with a `$$typeof` symbol in React 19
- **Fix:** Replaced strict `typeof === 'function'` assertion with `isReactComponent` check: `typeof === 'function' || (typeof === 'object' && '$$typeof' in mod.Table)`
- **Files modified:** `packages/react/src/index.test.ts`
- **Commit:** def52f4

---

## Self-Check: PASSED

Files verified:
- `packages/react/src/index.ts` — FOUND (75 lines, > 60 minimum)
- `packages/react/src/index.test.ts` — FOUND (3 tests GREEN)

Commits verified:
- 863afa7 — Task 1: React wrapper implementation
- def52f4 — Task 2: React wrapper unit tests

Verification commands passed:
- `pnpm --filter @tablecraft/react exec tsc --noEmit` — 0 errors
- `pnpm --filter @tablecraft/react exec vitest --run` — 3/3 tests pass
- `grep "createComponent"` — present in index.ts
- All 5 event names (`tc-cell-click`, `tc-row-click`, `tc-sort-change`, `tc-filter-change`, `tc-select-change`) — present in index.ts
- No Svelte imports — confirmed (grep count = 0)
