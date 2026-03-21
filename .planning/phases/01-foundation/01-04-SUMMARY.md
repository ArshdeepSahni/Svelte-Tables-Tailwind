---
phase: 01-foundation
plan: "04"
subsystem: testing-infrastructure
tags:
  - vitest
  - playwright
  - testing-library
  - foundation-tests
  - jsdom
dependency_graph:
  requires:
    - 01-01-SUMMARY (monorepo scaffold)
    - 01-02-SUMMARY (package builds)
    - 01-03-SUMMARY (build verification)
  provides:
    - vitest-workspace-config
    - playwright-e2e-config
    - foundation-test-suite
    - per-package-test-stubs
  affects:
    - all subsequent phases (FOUND-* requirements now machine-verified)
tech_stack:
  added:
    - vitest@4.1.0 projects mode (workspace renamed in v4)
    - "@playwright/test@1.50.1"
    - jsdom@29.0.1 (Vitest jsdom environment)
    - "@testing-library/svelte@5.2.7"
  patterns:
    - Vitest projects mode (replaced workspace in Vitest 4)
    - resolve.conditions browser for Svelte 5 jsdom rendering
    - ESM-safe __dirname via fileURLToPath(import.meta.url)
    - Dynamic import() for module resolution tests in ESM
key_files:
  created:
    - vitest.config.ts
    - packages/core/vitest.config.ts
    - packages/svelte/vitest.config.ts
    - packages/react/vitest.config.ts
    - packages/vue/vitest.config.ts
    - playwright.config.ts
    - e2e/smoke.spec.ts
    - packages/core/src/foundation.test.ts
    - packages/svelte/src/lib/Table.test.ts
    - packages/react/src/index.test.ts
    - packages/vue/src/index.test.ts
  modified:
    - package.json (added @playwright/test, jsdom devDependencies)
    - pnpm-lock.yaml
decisions:
  - Vitest 4 uses test.projects not test.workspace — plan used removed API; auto-fixed
  - resolve.conditions browser required for Svelte 5 @testing-library mount in jsdom
  - ESM-safe __dirname via fileURLToPath avoids CommonJS __dirname in ESM test files
  - jsdom not installed by default — must be added to root devDependencies explicitly
  - Playwright Chromium only installed for Phase 1; Firefox/WebKit deferred to Phase 3
metrics:
  duration: 436s
  completed: "2026-03-21"
  tasks_completed: 2
  files_created: 11
  files_modified: 2
  tests_passing: 44
  playwright_tests_passing: 2
---

# Phase 1 Plan 04: Testing Infrastructure Summary

**One-liner:** Vitest 4 projects workspace + Playwright Chromium + 44-test foundation suite codifying all FOUND-* requirements as permanent machine-verified assertions.

---

## What Was Built

Phase 1 Wave 4 wires up the complete testing infrastructure for the monorepo and creates the foundation test suite that makes Phase 1 success criteria machine-verifiable forever.

### Test Counts

| Package | Test File | Tests | Status |
|---------|-----------|-------|--------|
| @tablecraft/core | foundation.test.ts | 34 | PASS |
| @tablecraft/svelte | Table.test.ts | 6 | PASS |
| @tablecraft/react | index.test.ts | 2 | PASS |
| @tablecraft/vue | index.test.ts | 2 | PASS |
| **Total Vitest** | 4 files | **44** | **PASS** |
| Playwright Chromium | smoke.spec.ts | 2 | PASS |

### foundation.test.ts Coverage

| Test Suite | FOUND-* Requirement | Tests |
|------------|---------------------|-------|
| FOUND-06: MIT License | MIT in root + all 4 package.json files + LICENSE file | 6 |
| FOUND-07: XSS zero {@html} | No {@html} in .svelte or .ts source files | 2 |
| FOUND-08: No CDN Tailwind | No unpkg/cdn.tailwindcss links; no svelte:head injection | 2 |
| FOUND-09: No type-switcher | No `<select>` in Table.svelte | 1 |
| FOUND-10: Node engines + changesets | engines.node in all packages; .changeset/config.json access:public + linked | 5 |
| FOUND-01: Monorepo structure | pnpm-workspace.yaml; all 4 packages; private root; rollup/src removed | 7 |
| FOUND-03: TypeScript types | defineColumns helper resolves and works correctly | 2 |
| **Total** | | **25** |

Plus 9 parametrized `.each` variants over PACKAGE_NAMES = 34 total.

### ESLint Result

`pnpm lint` exits 0. Zero errors. One node warning about `eslint.config.js` module type (not an error — root package.json doesn't need `"type": "module"` as it's private).

### Prettier Result

`pnpm format:check` exits 0. All 39 previously unformatted files (planning docs, package.json files, source files) formatted via `pnpm format`. All matched files now use Prettier code style.

### Playwright Result

`pnpm exec playwright test --project=chromium` exits 0. 2 smoke tests pass on Chromium. Firefox/WebKit browsers not installed yet (deferred to Phase 3 when real UI exists).

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Vitest 4 removed `test.workspace` — renamed to `test.projects`**
- **Found during:** Task 1 verification (startup error on first `pnpm test`)
- **Issue:** Plan specified `test.workspace` array syntax. Vitest 4.1.0 removed this option entirely, requiring migration to `test.projects`.
- **Fix:** Changed `workspace:` to `projects:` in `vitest.config.ts`
- **Files modified:** `vitest.config.ts`
- **Commit:** d4222a0

**2. [Rule 3 - Blocking] `jsdom` not installed by default**
- **Found during:** Task 2 first test run (3 unhandled errors: `Cannot find package 'jsdom'`)
- **Issue:** Vitest requires `jsdom` to be installed as a peer — it doesn't bundle it. The root devDependencies were missing this package.
- **Fix:** `pnpm add -D jsdom -w` added `jsdom@29.0.1` to root devDependencies
- **Files modified:** `package.json`, `pnpm-lock.yaml`
- **Commit:** d4222a0

**3. [Rule 1 - Bug] Svelte 5 resolves to server build in jsdom environment**
- **Found during:** Task 2 test run (6 failures: `lifecycle_function_unavailable: mount(...) is not available on the server`)
- **Issue:** When Vite resolves `svelte` without the `browser` condition, it uses `src/index-server.js` (the default export). This causes `mount()` — used by @testing-library/svelte — to throw because server-side rendering doesn't support DOM mounting.
- **Fix:** Added `resolve: { conditions: ['browser'] }` to `packages/svelte/vitest.config.ts`, pointing Vite to `src/index-client.js` for test runs.
- **Files modified:** `packages/svelte/vitest.config.ts`
- **Commit:** d4222a0

**4. [Rule 1 - Bug] Plan used `__dirname` and `require()` in ESM foundation.test.ts**
- **Found during:** Test file authoring (pre-emptive fix)
- **Issue:** The plan's template used `__dirname` (CommonJS global) and `require()` for dynamic import. Since packages/core uses `"type": "module"`, these are not available in ESM.
- **Fix:** Used `fileURLToPath(import.meta.url)` + `dirname()` for `__dirname` equivalent; used `await import()` instead of `require()`.
- **Files modified:** `packages/core/src/foundation.test.ts`
- **Commit:** d4222a0

---

## Final Phase 1 Verification

All 5 success criteria from ROADMAP.md satisfied:

| Criterion | Command | Result |
|-----------|---------|--------|
| 1: pnpm install && pnpm build | `pnpm install && pnpm -r build` | PASS |
| 2: pnpm test passes | `pnpm test` (44 tests) | PASS |
| 3: No {@html} in source | foundation.test.ts FOUND-07 | PASS |
| 4: No CDN Tailwind, no type-switcher select | foundation.test.ts FOUND-08/09 | PASS |
| 5: MIT license + engines.node >=20 | foundation.test.ts FOUND-06/10 | PASS |

Toolchain defect checks:
- `rollup.config.js`: GONE (v1 build tool removed)
- `src/` directory: GONE (v1 source removed)

Phase 1 complete. All FOUND-* requirements are now permanently machine-verified by the foundation test suite.

---

## Self-Check: PASSED

Files verified to exist:
- vitest.config.ts: FOUND
- playwright.config.ts: FOUND
- e2e/smoke.spec.ts: FOUND
- packages/core/vitest.config.ts: FOUND
- packages/svelte/vitest.config.ts: FOUND
- packages/react/vitest.config.ts: FOUND
- packages/vue/vitest.config.ts: FOUND
- packages/core/src/foundation.test.ts: FOUND
- packages/svelte/src/lib/Table.test.ts: FOUND
- packages/react/src/index.test.ts: FOUND
- packages/vue/src/index.test.ts: FOUND

Commits verified:
- 6ceceec: Task 1 (configs)
- d4222a0: Task 2 (test files + fixes)
