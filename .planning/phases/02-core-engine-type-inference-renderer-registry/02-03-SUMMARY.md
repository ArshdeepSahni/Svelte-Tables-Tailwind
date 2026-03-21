---
phase: 02-core-engine-type-inference-renderer-registry
plan: 03
subsystem: registry
tags: [typescript, vitest, map, plugin-system, renderer, core]

# Dependency graph
requires:
  - phase: 02-core-engine-type-inference-renderer-registry/01
    provides: RendererFn, ResolvedColumn, CellDescriptor types in packages/core/src/types.ts
provides:
  - Global Map<string, RendererFn> registry singleton at packages/core/src/registry/index.ts
  - registerRenderer, getRenderer, hasRenderer, unregisterRenderer, clearRegistry, getRegisteredTypes API
  - 20+ registry tests in registry.test.ts with afterEach clearRegistry() isolation
affects:
  - 02-core-engine-type-inference-renderer-registry/04 (renderers — each calls registerRenderer on module init)
  - 02-core-engine-type-inference-renderer-registry/05 (engine — calls getRenderer(column.type) to resolve renderers)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Module-level Map singleton (not a class) for global shared state without instantiation
    - Warn-and-overwrite on duplicate registration (not throw) for intentional built-in override support
    - clearRegistry() exported for test isolation — called in afterEach() to prevent cross-test pollution
    - afterEach + vi.restoreAllMocks() pattern for console.warn spy cleanup

key-files:
  created:
    - packages/core/src/registry/index.ts
    - packages/core/src/registry/registry.test.ts
  modified:
    - packages/core/src/types.ts
    - packages/core/package.json

key-decisions:
  - "Module-level Map singleton (not a class) — simple, no instantiation needed, shared across all renderer module imports"
  - "Duplicate registration warns + overwrites rather than throws — enables intentional built-in renderer replacement without forking"
  - "clearRegistry() exported as safety valve for test isolation — Wave 4 renderer auto-registration side effects require this"
  - "getRegisteredTypes() returns Array.from(registry.keys()) — new array each call so callers cannot mutate internal state"
  - "Added test/test:watch scripts to core package.json so pnpm --filter @tablecraft/core test works as specified in success criteria"

patterns-established:
  - "Registry pattern: module-level singleton Map with warn-on-overwrite semantics"
  - "Test isolation: afterEach(() => { clearRegistry(); vi.restoreAllMocks(); })"
  - "Plugin override: consumer calls registerRenderer('currency', myFn) to replace built-in without touching core files"

requirements-completed:
  - CORE-06

# Metrics
duration: 4min
completed: 2026-03-21
---

# Phase 2 Plan 03: Renderer Plugin Registry Summary

**Module-level Map<string, RendererFn> singleton with warn-and-overwrite duplicate handling — same API for built-ins and external plugins, clearRegistry() for test isolation**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-21T20:40:00Z
- **Completed:** 2026-03-21T20:44:00Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 4

## Accomplishments
- Created `packages/core/src/registry/index.ts` with 6 exported functions: registerRenderer, getRenderer, hasRenderer, unregisterRenderer, clearRegistry, getRegisteredTypes
- Created `packages/core/src/registry/registry.test.ts` with 20+ tests covering all API functions, duplicate registration warning, custom renderer invocation, and built-in override pattern
- All 66 core package tests pass (4 test files, 0 failures); TypeScript strict mode: zero errors
- Added `test`/`test:watch` scripts to core package.json enabling `pnpm --filter @tablecraft/core test`

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement registry/index.ts + registry.test.ts (TDD)** - `f30b4a5` (feat)

## Files Created/Modified
- `packages/core/src/registry/index.ts` — Map singleton registry with 6 exported functions
- `packages/core/src/registry/registry.test.ts` — Full registry test suite (20+ tests)
- `packages/core/src/types.ts` — Fixed pre-existing FOUND-07 false positive in JSDoc comment
- `packages/core/package.json` — Added test/test:watch scripts

## Decisions Made
- Module-level Map singleton (not a class) keeps the implementation simple — no instantiation, shared across all imports automatically
- Warn-and-overwrite on duplicate registration enables consumers to replace built-ins via the same API without needing a separate override mechanism
- clearRegistry() exported explicitly (not a test-only file) so Wave 4 renderer auto-registration side effects can be cleaned up in test afterEach hooks
- getRegisteredTypes() returns a new array each call via Array.from() to prevent external mutation of internal registry state

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed FOUND-07 false positive in types.ts JSDoc comment**
- **Found during:** Task 1 (baseline test run before implementing registry)
- **Issue:** JSDoc comment in types.ts line 110 contained the literal string `{@html}` which the FOUND-07 test scans for in all .ts files, causing a pre-existing test failure
- **Fix:** Rewrote the comment to use "the at-html directive" instead of the literal Svelte syntax `{@html}`
- **Files modified:** `packages/core/src/types.ts`
- **Verification:** FOUND-07 test passes; types.ts still clearly documents the XSS-free rendering approach
- **Committed in:** f30b4a5 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug, pre-existing false positive in FOUND-07 test)
**Impact on plan:** Fix necessary for test suite to reach GREEN state. No scope creep.

## Issues Encountered
- Pre-existing FOUND-07 test failure due to literal `{@html}` in types.ts JSDoc comment (not actual at-html usage). Fixed as Rule 1 auto-fix before writing registry code.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Registry is fully functional and tested — Wave 4 renderers can call `registerRenderer('currency', fn)` at module init
- clearRegistry() is available for test isolation in Wave 4 renderer test files
- engine (Wave 5) can call `getRenderer(column.type)` to resolve cell renderers
- All core tests (scheduler, tokens, foundation, inference, registry) pass as a suite

---
*Phase: 02-core-engine-type-inference-renderer-registry*
*Completed: 2026-03-21*

## Self-Check: PASSED
- packages/core/src/registry/index.ts: FOUND
- packages/core/src/registry/registry.test.ts: FOUND
- .planning/phases/02-core-engine-type-inference-renderer-registry/02-03-SUMMARY.md: FOUND
- Commit f30b4a5: FOUND
