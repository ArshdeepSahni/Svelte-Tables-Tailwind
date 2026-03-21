---
phase: 05-web-components-core-framework-wrappers
plan: 01
subsystem: build-tooling
tags: [lit, web-components, vite, vue, react, umd, playwright, vitest]

# Dependency graph
requires:
  - phase: 04-virtual-scrolling-performance
    provides: packages/core built with ESM+CJS, pnpm monorepo established

provides:
  - lit 3 installed as runtime dep of @tablecraft/core
  - "@lit/react installed as runtime dep of @tablecraft/react"
  - "@vitejs/plugin-vue installed in @tablecraft/vue replacing tsup"
  - packages/core/vite.config.element.ts — separate UMD+ES build for tc-table element
  - packages/vue/vite.config.ts — Vite build replacing tsup for Vue SFC processing
  - packages/core exports map includes ./element subpath
  - Wave 0 RED test stubs for element unit tests and e2e smoke tests

affects:
  - 05-02 (creates element.ts that element.test.ts stubs test)
  - 05-03 (React wrapper builds on @lit/react dep added here)
  - 05-04 (Vue wrapper builds on @vitejs/plugin-vue + vite.config.ts added here)
  - 05-05 (UMD build uses vite.config.element.ts created here)

# Tech tracking
tech-stack:
  added:
    - lit ^3.3.2 (runtime dep, @tablecraft/core)
    - "@lit/react ^1.0.8 (runtime dep, @tablecraft/react)"
    - "@vitejs/plugin-vue ^6.0.5 (devDep, @tablecraft/vue)"
    - vite ^8.0.1 (devDep, @tablecraft/vue)
    - vite-plugin-dts ^4.5.4 (devDep, @tablecraft/vue)
  patterns:
    - Separate vite.config.element.ts for UMD single-entry build (required because Vite/Rolldown blocks UMD with multiple entries)
    - isCustomElement: (tag) => tag.startsWith('tc-') in Vue config suppresses unknown element warnings
    - emptyOutDir: false in element config preserves ESM+CJS output from main build
    - Wave 0 TDD — stub test files written before any implementation exists

key-files:
  created:
    - packages/core/vite.config.element.ts
    - packages/vue/vite.config.ts
    - packages/core/src/element.test.ts
    - e2e/wc-smoke.spec.ts
  modified:
    - packages/core/package.json (lit dep, ./element export, build:element + build:all scripts)
    - packages/react/package.json (@lit/react dep)
    - packages/vue/package.json (@vitejs/plugin-vue dep, vite build scripts)
    - pnpm-lock.yaml

key-decisions:
  - "lit is a runtime (not dev) dependency — LitElement class is part of the published @tablecraft/core package"
  - "UMD build requires separate vite.config.element.ts (Rolldown/Rollup cannot build UMD with multiple entries)"
  - "packages/vue build switches from tsup to Vite because tsup cannot process .vue SFC files"
  - "@vitejs/plugin-vue compilerOptions.isCustomElement suppresses tc-* unknown element warnings in Vue templates"
  - "emptyOutDir: false in element config is critical — prevents wiping ESM+CJS output from main vite build"
  - "Wave 0 test stubs are genuine RED (not no-ops) — they import element.js which does not exist yet"

patterns-established:
  - "Dual vite config pattern: vite.config.ts (multi-entry ESM+CJS) + vite.config.element.ts (single-entry UMD+ES)"
  - "Wave 0 stubbing: write failing test files before implementation to enforce TDD discipline in subsequent plans"

requirements-completed: [WC-01, WC-05, WC-07, WC-08, WC-09, WC-10]

# Metrics
duration: 2min
completed: 2026-03-22
---

# Phase 5 Plan 01: Web Components Dependency Setup + Build Architecture Summary

**Lit 3 + @lit/react installed, separate UMD vite.config.element.ts wired, Vue build switched from tsup to Vite, ./element subpath export declared, Wave 0 RED test stubs placed for Plans 02-05 to make green.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-22T00:15:52Z
- **Completed:** 2026-03-22T00:18:05Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Installed lit 3.3.2 as runtime dep of @tablecraft/core and @lit/react 1.0.8 as runtime dep of @tablecraft/react — both needed before any web component code can be written
- Created packages/core/vite.config.element.ts with formats: ['umd', 'es'] and emptyOutDir: false — separating UMD from the multi-entry ESM+CJS build is the architectural prerequisite for Plan 05's CDN-ready output
- Switched @tablecraft/vue build from tsup to Vite + @vitejs/plugin-vue (tsup cannot process .vue SFC files) and placed Wave 0 RED stubs (element.test.ts, wc-smoke.spec.ts) that future plans must make green

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies + add ./element export** - `84489ee` (chore)
2. **Task 2: Create vite.config.element.ts + packages/vue/vite.config.ts** - `94cbea0` (chore)
3. **Task 3: Wave 0 RED test stubs** - `2e636d6` (test)

## Files Created/Modified
- `packages/core/package.json` - Added lit runtime dep, ./element export entry, build:element + build:all scripts
- `packages/react/package.json` - Added @lit/react runtime dep
- `packages/vue/package.json` - Added @vitejs/plugin-vue + vite devDeps, switched build scripts from tsup to vite
- `pnpm-lock.yaml` - Updated with new dependency resolutions
- `packages/core/vite.config.element.ts` - Separate single-entry UMD+ES build config for tc-table element
- `packages/vue/vite.config.ts` - Vite build config with @vitejs/plugin-vue replacing tsup
- `packages/core/src/element.test.ts` - Wave 0 unit test stubs covering WC-05, WC-02, WC-03 (RED until Plan 02)
- `e2e/wc-smoke.spec.ts` - Wave 0 Playwright stubs for vanilla/React/Vue smoke tests (RED until Plan 05)

## Decisions Made
- lit is a runtime (not dev) dependency — the LitElement class ships as part of the published @tablecraft/core package
- Separate vite.config.element.ts is required (not optional) — Vite/Rolldown blocks UMD format with multiple entry points; the existing multi-entry config cannot be extended
- `emptyOutDir: false` in vite.config.element.ts is critical — prevents wiping ESM+CJS output produced by the main build when build:element is run after build
- `isCustomElement: (tag) => tag.startsWith('tc-')` in Vue config suppresses Vue's "unknown element" warnings for tc-table in wrapper templates

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
Pre-existing peer dependency warnings about `@types/node` version mismatch and `@sveltejs/vite-plugin-svelte` requiring Vite ^6 (project uses Vite 8). These are out-of-scope warnings from previous phases — not caused by this plan's changes and not blocking any build.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 02 (TcTable LitElement class): all prerequisites in place — lit installed, element.test.ts stubs ready to make green, vite.config.element.ts wired for the UMD build
- Plan 03 (React wrapper): @lit/react installed, ./element subpath export declared for TypeScript resolution
- Plan 04 (Vue wrapper): @vitejs/plugin-vue installed, vite.config.ts created, isCustomElement configured
- Plan 05 (UMD build + e2e): vite.config.element.ts + wc-smoke.spec.ts both in place

---
*Phase: 05-web-components-core-framework-wrappers*
*Completed: 2026-03-22*
