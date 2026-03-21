---
phase: 05-web-components-core-framework-wrappers
plan: "04"
subsystem: vue-wrapper
tags: [vue3, sfc, custom-elements, web-components, typescript]
dependency_graph:
  requires: [05-02]
  provides: [Table.vue Vue 3 SFC wrapper, @tablecraft/vue package entry]
  affects: [packages/vue]
tech_stack:
  added: [vue-shim.d.ts, @vitejs/plugin-vue in vitest config]
  patterns: [ref + onMounted imperative DOM assignment, addEventListener event forwarding, watch for reactive prop sync]
key_files:
  created:
    - packages/vue/src/Table.vue
    - packages/vue/src/vue-shim.d.ts
  modified:
    - packages/vue/src/index.ts
    - packages/vue/src/index.test.ts
    - packages/vue/tsconfig.json
    - packages/vue/vitest.config.ts
decisions:
  - "Row typed locally as Record<string, unknown> — not a named export from @tablecraft/core"
  - "vue-shim.d.ts added for plain tsc support — declare module '*.vue' with DefineComponent"
  - "@vitejs/plugin-vue added to vitest.config.ts to enable .vue transform during test runs"
  - "tsconfig.json includes src/**/*.vue and src/**/*.d.ts for shim resolution"
metrics:
  duration: 158s
  completed: "2026-03-22"
  tasks: 2
  files: 6
requirements: [WC-08]
---

# Phase 05 Plan 04: Vue 3 SFC Wrapper Summary

**One-liner:** Vue 3 SFC wrapper for tc-table using ref+onMounted imperative property assignment and addEventListener event forwarding for all 5 tc-* CustomEvents.

---

## Tasks Completed

| Task | Description | Commit | Status |
|------|-------------|--------|--------|
| 1 | Create Table.vue Vue 3 SFC wrapper | bfb4c6c | Done |
| 2 | Update index.ts, test, vitest config, shim | ebbf95e | Done |

---

## What Was Built

### packages/vue/src/Table.vue
A Vue 3 SFC with `<script setup lang="ts">` that wraps the `<tc-table>` Custom Element using the imperative ref+watch pattern:
- `tcTableRef = ref<TcTableElement | null>(null)` — template ref pointing to the DOM element
- `onMounted`: assigns `el.data = props.data` and `el.columns = props.columns` as DOM properties (not HTML attributes) — required because Custom Elements cannot receive arrays/objects via attributes
- `watch(() => props.data, ...)` with `deep: false` — shallow watch; caller must pass a new array reference for Lit change detection to fire
- `watch(() => props.columns, ...)` — reactive column override sync
- `onUnmounted`: removes all event listeners (no memory leaks)
- All 5 tc-* CustomEvents forwarded: `tc-cell-click`, `tc-row-click`, `tc-sort-change`, `tc-filter-change`, `tc-select-change`
- Boolean attributes use `|| undefined` pattern — `false` becomes `undefined` (attribute omitted) not `"false"` (truthy in HTML)
- Side-effect import `@tablecraft/core/element` registers the `<tc-table>` Custom Element in the registry

### packages/vue/src/index.ts
Replaced the Phase 1 stub:
- `export { default as Table } from './Table.vue'` — named export
- Re-exports `ColumnOverrideShort`, `ColumnDefinition`, `ResolvedColumn` from core for TypeScript consumers

### packages/vue/src/vue-shim.d.ts (new — deviation fix)
Standard Vue 3 + plain tsc shim: `declare module '*.vue'` with `DefineComponent` default export. Required because the project uses plain `tsc --noEmit` not `vue-tsc`.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `Row` type not exported from `@tablecraft/core`**
- **Found during:** Task 1 (pre-write analysis)
- **Issue:** Plan imports `Row` from `@tablecraft/core` but that type does not exist as a named export — `element.ts` defines it as a local `type Row = Record<string, unknown>`. Importing the non-existent named type would cause a TypeScript error.
- **Fix:** Defined `type Row = Record<string, unknown>` locally in `Table.vue` with a comment explaining the omission.
- **Files modified:** `packages/vue/src/Table.vue`
- **Commit:** bfb4c6c

**2. [Rule 3 - Blocking] `tsc --noEmit` failed: Cannot find module './Table.vue'**
- **Found during:** Task 2 verification
- **Issue:** The tsconfig only included `src/**/*.ts` — plain `tsc` cannot resolve `.vue` imports without a module shim declaration.
- **Fix:** Created `packages/vue/src/vue-shim.d.ts` (`declare module '*.vue'`) and updated `tsconfig.json` to include `src/**/*.vue` and `src/**/*.d.ts`.
- **Files modified:** `packages/vue/src/vue-shim.d.ts` (created), `packages/vue/tsconfig.json`
- **Commit:** ebbf95e

**3. [Rule 3 - Blocking] vitest failed: Install `@vitejs/plugin-vue` to handle .vue files**
- **Found during:** Task 2 verification (unit test run)
- **Issue:** `vitest.config.ts` had no plugins — vitest could not transform `Table.vue` when tests imported `./index.js` → `./Table.vue`.
- **Fix:** Added `@vitejs/plugin-vue` (already in devDependencies) to `vitest.config.ts` with the same `isCustomElement` compiler option as `vite.config.ts`.
- **Files modified:** `packages/vue/vitest.config.ts`
- **Commit:** ebbf95e

**4. [Rule 1 - Bug] Old `index.test.ts` referenced removed `TABLECRAFT_VUE_VERSION` export**
- **Found during:** Task 2 (TypeScript typecheck)
- **Issue:** The Phase 1 stub test expected `TABLECRAFT_VUE_VERSION` which was removed from `index.ts` when real exports were added.
- **Fix:** Replaced test with `WC-08` tests: module resolves without throwing, `Table` is defined.
- **Files modified:** `packages/vue/src/index.test.ts`
- **Commit:** ebbf95e

---

## Verification Results

| Check | Result |
|-------|--------|
| `ls packages/vue/src/Table.vue` | FOUND |
| `grep "onMounted" packages/vue/src/Table.vue` | PASS |
| All 5 tc-* events in Table.vue | PASS |
| `grep "el.data = " packages/vue/src/Table.vue` | PASS |
| `pnpm --filter @tablecraft/vue exec tsc --noEmit` | 0 errors |
| `grep "export.*Table" packages/vue/src/index.ts` | PASS |
| Vue unit tests | 2/2 GREEN |

## Self-Check: PASSED

All files exist. Commits bfb4c6c and ebbf95e verified in git log.
