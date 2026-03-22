---
phase: 05-web-components-core-framework-wrappers
plan: "05"
subsystem: testing
tags: [playwright, web-components, lit, react, vue, umd, esm, smoke-tests]

requires:
  - phase: 05-01
    provides: vite.config.element.ts + build:element script + @tablecraft/core/element exports map
  - phase: 05-02
    provides: element.ts TcTable LitElement implementation with Light DOM
  - phase: 05-03
    provides: "@tablecraft/react wrapper (tsup + @lit/react)"
  - phase: 05-04
    provides: "@tablecraft/vue Table.vue SFC wrapper (vite + @vitejs/plugin-vue)"

provides:
  - "packages/core/dist/element.umd.js — self-contained UMD bundle for CDN (Lit bundled in)"
  - "packages/core/dist/element.js — ESM element bundle"
  - "packages/react/dist/index.js + index.cjs — React wrapper ESM/CJS builds"
  - "packages/vue/dist/index.js + index.cjs — Vue wrapper ESM/CJS builds"
  - "e2e/wc-smoke.spec.ts — 5 Playwright smoke tests: vanilla data property, tc-cell-click event, React 100 rows, Vue 100 rows, UMD global"
  - "playwright.smoke.config.ts — dedicated config without webServer (smoke tests use page.setContent)"

affects: [phase-06, phase-07, ci-pipeline, e2e-test-suite]

tech-stack:
  added: [playwright-smoke-config]
  patterns:
    - "UMD bundle loaded without type=module (IIFE global pattern) to register custom element"
    - "ESM bundle loaded with type=module for vanilla tests"
    - "page.evaluate() + dynamic import() for CDN-loaded React/Vue in Playwright browser context"
    - "customElements.whenDefined / waitForFunction guard before data property assignment"
    - "Vue render function h() instead of template string in Playwright (no compiler in runtime build)"

key-files:
  created:
    - "playwright.smoke.config.ts — standalone Playwright config for smoke tests, no webServer"
  modified:
    - "e2e/wc-smoke.spec.ts — replaced Wave 0 stubs with 5 real Playwright smoke tests"
    - "packages/core/vite.config.element.ts — fixed fileName function to produce element.umd.js"
    - "packages/vue/vite.config.ts — added @tablecraft/core/element to rolldownOptions.external"

key-decisions:
  - "Vite 8/rolldown names UMD output element.umd.cjs not element.umd.js when using string fileName — fixed by using fileName function: (format) => format === 'umd' ? 'element.umd.js' : 'element.js'"
  - "rolldown does not auto-externalize sub-path specifiers — @tablecraft/core/element must be listed separately in external alongside @tablecraft/core"
  - "page.evaluate() with dynamic import() is more reliable than page.addScriptTag({ content, type: 'module' }) for CDN imports in Playwright"
  - "UMD bundle must be loaded without type=module (no type attribute) — UMD uses IIFE global pattern, not ESM"
  - "Vue smoke test uses h() render function instead of template string — runtime-only Vue build (esm.sh) does not include template compiler"
  - "playwright.smoke.config.ts created as separate config — main playwright.config.ts requires the svelte bench webServer; smoke tests use page.setContent() and need no server"

patterns-established:
  - "Local dist file loading in Playwright: page.addScriptTag({ path: absolutePathToFile }) for UMD/ESM"
  - "CDN imports in Playwright tests: page.evaluate(async () => { const X = await import('https://cdn') })"
  - "Custom element readiness: page.waitForFunction(() => customElements.get('tc-table') !== undefined)"

requirements-completed: [WC-01, WC-02, WC-03, WC-04, WC-05, WC-06, WC-07, WC-08, WC-09, WC-10]

duration: ~25min
completed: "2026-03-22"
---

# Phase 5 Plan 05: Build All Packages and Playwright Smoke Tests Summary

**UMD + ESM + React + Vue builds all pass GREEN, 5 Playwright smoke tests confirm tc-table renders 100 rows in vanilla JS, React 19, and Vue 3 — Phase 5 acceptance gate complete**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-22T10:00:00Z
- **Completed:** 2026-03-22T10:32:54Z
- **Tasks:** 2 executed + 1 checkpoint (auto-approved YOLO)
- **Files modified:** 4

## Accomplishments

- Fixed `vite.config.element.ts` to produce `element.umd.js` (Vite 8 with rolldown changed UMD extension to `.umd.cjs` when using string `fileName`)
- Fixed `packages/vue/vite.config.ts` to externalize `@tablecraft/core/element` sub-path (rolldown does not auto-externalize sub-paths of externalized packages)
- All 4 package builds succeed: `@tablecraft/core` (ESM+CJS+UMD), `@tablecraft/react`, `@tablecraft/vue`
- Replaced Wave 0 stub tests with 5 real Playwright assertions — all 5 pass GREEN in Chromium
- Created `playwright.smoke.config.ts` for running smoke tests without the svelte bench webServer

## Task Commits

1. **Task 1: Run all package builds and verify dist artifacts** — `beecbe1` (feat)
2. **Task 2: Implement full Playwright smoke tests** — `0799d47` (feat)
3. **Checkpoint: Visual browser inspection** — auto-approved (YOLO mode)

## Files Created/Modified

- `packages/core/vite.config.element.ts` — Fixed fileName function to produce `element.umd.js` not `element.umd.cjs`
- `packages/vue/vite.config.ts` — Added `@tablecraft/core/element` to `rolldownOptions.external`
- `e2e/wc-smoke.spec.ts` — 5 real Playwright smoke tests (WC-02, WC-04, WC-07, WC-08, WC-09)
- `playwright.smoke.config.ts` — Standalone Playwright config for smoke tests (no webServer)

## Decisions Made

- **Vite 8 UMD naming**: Rolldown in Vite 8 changed UMD output filename convention — string `fileName: 'element'` produces `element.umd.cjs`, not `element.umd.js`. Fixed by using a function: `(format) => format === 'umd' ? 'element.umd.js' : 'element.js'`
- **Vue vite externals**: `@tablecraft/core/element` is a sub-path specifier distinct from `@tablecraft/core` — rolldown treats it as an unresolved import unless explicitly listed in `external`
- **CDN imports in Playwright**: `page.addScriptTag({ content: '...', type: 'module' })` with CDN `import` statements did not resolve (timeout). `page.evaluate(async () => { const X = await import('cdn') })` is the correct pattern — it runs the dynamic import in the browser's fetch context
- **UMD vs ESM loading**: Vanilla + React/Vue tests use the UMD bundle (no `type: 'module'`) for `page.addScriptTag` to register `tc-table` globally. Vanilla WC-02 uses ESM bundle with `type: 'module'` directly
- **Vue render function**: CDN-loaded Vue (esm.sh runtime build) does not include the template compiler — `h()` render function is required instead of `template: '...'` string in smoke test

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Vite 8 UMD produces element.umd.cjs not element.umd.js**
- **Found during:** Task 1 (running build:element)
- **Issue:** `vite.config.element.ts` used `fileName: 'element'` (string). Vite 8 with rolldown changed UMD extension from `.umd.js` to `.umd.cjs`, so artifact was `dist/element.umd.cjs` not `dist/element.umd.js`. Plan requires `element.umd.js`.
- **Fix:** Changed `fileName` to a function: `(format) => format === 'umd' ? 'element.umd.js' : 'element.js'`
- **Files modified:** `packages/core/vite.config.element.ts`
- **Verification:** `dist/element.umd.js` confirmed present after build
- **Committed in:** `beecbe1` (Task 1 commit)

**2. [Rule 1 - Bug] Vue build failed: @tablecraft/core/element not in external list**
- **Found during:** Task 1 (`pnpm --filter @tablecraft/vue build`)
- **Issue:** `rolldownOptions.external` had `['vue', '@tablecraft/core']` but `Table.vue` imports `@tablecraft/core/element` (a sub-path). Rolldown does not auto-externalize sub-paths of externalized packages, causing build failure.
- **Fix:** Added `'@tablecraft/core/element'` to `external` array
- **Files modified:** `packages/vue/vite.config.ts`
- **Verification:** `pnpm --filter @tablecraft/vue build` exits 0
- **Committed in:** `beecbe1` (Task 1 commit)

**3. [Rule 3 - Blocking] Created playwright.smoke.config.ts to avoid webServer dependency**
- **Found during:** Task 2 (running Playwright tests)
- **Issue:** `playwright.config.ts` requires the svelte bench webServer (port 5174). Smoke tests use `page.setContent()` and need no server. Running `pnpm exec playwright test e2e/wc-smoke.spec.ts` would wait for the bench server to start, adding unnecessary dependency.
- **Fix:** Created `playwright.smoke.config.ts` with `testMatch: 'wc-smoke.spec.ts'`, no `webServer` block
- **Files modified:** `playwright.smoke.config.ts` (created)
- **Verification:** `pnpm exec playwright test --config=playwright.smoke.config.ts` runs without starting bench server
- **Committed in:** `0799d47` (Task 2 commit)

**4. [Rule 1 - Bug] page.addScriptTag(content+module) CDN imports timeout**
- **Found during:** Task 2 (WC-07 and WC-08 tests failing with 15s timeout)
- **Issue:** The plan's approach of `page.addScriptTag({ content: '...', type: 'module' })` with CDN `import` statements did not work — Playwright's inline module script context prevented external CDN imports from loading within the timeout window.
- **Fix:** Replaced with `page.evaluate(async () => { const React = await import('cdn') })` — dynamic import inside `evaluate()` runs in the full browser fetch context
- **Files modified:** `e2e/wc-smoke.spec.ts`
- **Verification:** WC-07 (React) and WC-08 (Vue) both pass GREEN
- **Committed in:** `0799d47` (Task 2 commit)

---

**Total deviations:** 4 auto-fixed (2 Rule 1 build bugs, 1 Rule 3 blocking, 1 Rule 1 test implementation bug)
**Impact on plan:** All auto-fixes required for correct behavior. No scope creep. The naming fix (Rule 1-1) and external list fix (Rule 1-2) are straightforward Vite 8 migration issues. The Playwright pattern fix (Rule 1-4) is the correct CDN import approach.

## Issues Encountered

- Vite 8 + rolldown changed several conventions from Vite 7: UMD filename extension, rolldown vs rollupOptions, sub-path external handling. These were addressed as they appeared during builds.
- CDN tests (React, Vue) require internet connectivity to esm.sh. The smoke tests will fail in network-isolated CI environments — this is a known tradeoff of the CDN-based approach. Alternative: bundle React/Vue locally as fixtures (deferred).

## Next Phase Readiness

- Phase 5 acceptance gate (WC-01 through WC-10) is COMPLETE — all 5 Playwright smoke tests pass
- `packages/core/dist/element.umd.js` ready for CDN distribution
- `@tablecraft/react` and `@tablecraft/vue` built and ready for framework consumers
- Phase 6 (Column Operations + Advanced Features) can proceed

---

*Phase: 05-web-components-core-framework-wrappers*
*Completed: 2026-03-22*
