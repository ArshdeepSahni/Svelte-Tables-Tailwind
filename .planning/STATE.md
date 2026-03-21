---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: milestone
status: planning
stopped_at: Completed 02-core-engine-type-inference-renderer-registry/05-PLAN.md
last_updated: "2026-03-21T15:52:34.375Z"
progress:
  total_phases: 7
  completed_phases: 1
  total_plans: 10
  completed_plans: 9
---

# Project State

**Project:** svelte-tables-tailwind v2.0.0
**Updated:** 2026-03-21
**Status:** Ready to plan

---

## Current Phase

Phase 2: Core Engine + Type Inference + Renderer Registry — IN PROGRESS (5/6 plans done)

---

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-03-20)

**Core value:** Zero-config data display with smart type inference — `<Table data={rows} />` just works, and when you need more, one prop does it.

**Current focus:** Phase 2: Core Engine + Type Inference + Renderer Registry

**Milestone:** v2.0.0 — Industry-Standard Zero-Config Table Library

---

## Current Position

| Field    | Value                                                |
| -------- | ---------------------------------------------------- |
| Phase    | 2 — Core Engine + Type Inference + Renderer Registry |
| Plan     | 05 complete (createTableEngine factory + v1 shim + 17 renderer exports; 464 tests passing) |
| Status   | Phase 2 in progress (5/6 plans done)                 |
| Progress | 9/10 plans complete across all phases                |

```
Phase progress: [█______] 1/7
Plan progress:  [█████████░] 90% (9/10 plans)
```

---

## Phase Progress

| Phase | Name                                             | Status   | Plans |
| ----- | ------------------------------------------------ | -------- | ----- |
| 1     | Foundation                                       | Complete | 4/4   |
| 2     | Core Engine + Type Inference + Renderer Registry | In Progress | 5/6   |
| 3     | Svelte 5 Component + Zero-Config API             | Pending  | 0/0   |
| 4     | Virtual Scrolling + Performance                  | Pending  | 0/0   |
| 5     | Web Components Core + Framework Wrappers         | Pending  | 0/0   |
| 6     | Column Operations + Advanced Features            | Pending  | 0/0   |
| 7     | Docs Site + Release                              | Pending  | 0/0   |

---

## Performance Metrics

| Metric                           | Target | Current          |
| -------------------------------- | ------ | ---------------- |
| Requirements covered             | 64/64  | 64/64 (planning) |
| Phases complete                  | 7      | 0                |
| Test coverage (inference engine) | >95%   | —                |
| Test coverage (renderers)        | >90%   | —                |
| Initial render (100k rows)       | <200ms | —                |
| Scroll performance (100k rows)   | 60fps  | —                |
| Sort time (100k rows, Worker)    | <50ms  | —                |
| Bundle size (core, gzipped)      | <50KB  | —                |

| Plan 01-foundation/01 | 2 min | 3 tasks | 11 files |
| Plan 01-foundation/02 | 266s | 3 tasks | 20 files |
| Plan 01-foundation/03 | 153s | 2 tasks | 2 files |
| Phase 01-foundation P04 | 436 | 2 tasks | 11 files |
| Phase 02-core-engine-type-inference-renderer-registry P01 | 185s | 2 tasks | 7 files |
| Phase 02-core-engine-type-inference-renderer-registry P03 | 4min | 1 tasks | 4 files |
| Phase 02-core-engine-type-inference-renderer-registry P02 | 452s | 4 tasks | 5 files |
| Phase 02-core-engine-type-inference-renderer-registry P04 | 1060 | 2 tasks | 37 files |
| Phase 02-core-engine-type-inference-renderer-registry P05 | 349 | 7 tasks | 7 files |

## Accumulated Context

### Key Decisions Made

| Decision                                                   | Rationale                                                                                                       |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| pnpm monorepo — 4 packages                                 | `@tablecraft/core`, `@tablecraft/svelte`, `@tablecraft/react`, `@tablecraft/vue`                                |
| ESLint 9 flat config, svelte/no-at-html-tags: error        | Enforces FOUND-07 XSS elimination at lint time; hard error not warn                                             |
| NodeNext + verbatimModuleSyntax in tsconfig.base.json      | Correct pnpm workspace ESM interop on Node 20 LTS; prevents type-only import leaks                              |
| Changesets linked @tablecraft/\* packages                  | Coordinated version releases; access: public for npm publish                                                    |
| Lit 3 Web Component in Light DOM                           | Shadow DOM blocks Tailwind; Light DOM is irreversible architectural choice                                      |
| `@sveltejs/package` for Svelte build                       | Only correct tool for `.svelte` compilation + exports map                                                       |
| `@tanstack/virtual` for row virtualization                 | Framework-agnostic, ~4KB gzip, does not require TanStack Table                                                  |
| Fixed 48px row height for v2                               | O(1) scroll position; dynamic height deferred to v3                                                             |
| v1 `colname`/`rowdata` shim retained                       | Deprecation warnings, not breaking errors; removed in v3                                                        |
| Inference runs in `requestIdleCallback`                    | Table renders immediately with text fallback; no blocking                                                       |
| Single delegated event listener                            | `data-row`/`data-col` attributes; no per-cell listeners                                                         |
| React + Vue wrappers as v2.1 territory                     | Ship core + Svelte first; do not attempt 4-package simultaneous launch                                          |
| No Shadow DOM                                              | Irreversible; decided in planning                                                                               |
| DOMPurify for `html` renderer                              | Explicit opt-in; bundle size tradeoff needs verification in Phase 2                                             |
| packages/svelte tsconfig uses Bundler moduleResolution     | Required for @sveltejs/package and Vite compatibility; overrides NodeNext from base tsconfig                    |
| CSS custom properties (--tc-\*) replace Tailwind CDN       | Table.svelte uses design tokens with hardcoded fallbacks; satisfies FOUND-08 and allows theme customization     |
| columns $derived uses IIFE branch (short/long/zero-config) | noUnusedLocals required columns to be read; IIFE correctly implements Phase 3 column key ordering ahead of time |
| Vitest 4 uses test.projects not test.workspace             | Plan used removed API; auto-fixed — Vitest 4 renamed workspace to projects                                      |
| resolve.conditions browser in svelte vitest config         | Svelte 5 default export is index-server.js; browser condition selects index-client.js for jsdom mount           |
| jsdom must be explicitly installed for Vitest jsdom env    | Not bundled with Vitest; must be added to root devDependencies                                                  |
| Dropped --tc-border-width to reach 18 tokens               | Plan must_haves said 18; action content had 19; border-width defaults to 1px browser default, safely omitted   |
| vite.config.ts rollupOptions → rolldownOptions             | Vite 8 deprecates rollupOptions; rolldownOptions is required for Vite 8+ multi-entry builds                     |
| Registry uses module-level Map singleton (not a class)     | Simple, shared across all renderer module imports without instantiation; no constructor overhead                 |
| Registry duplicate registration warns + overwrites         | Enables intentional built-in renderer replacement without forking core; warn alerts accidental duplicates       |
| `_at` suffix regex for date keyword boost (not substring)  | `'at'` as substring matched 'avatar' producing false image+date dual boost; `/_at$/` matches `created_at` only |
| detectStatus explicit numeric guard before cardinality     | Prevents overlap with integer columns that happen to have few unique values (e.g., 1/2/3 flags)                 |
| toFiniteNumber duplicated per numeric renderer (not shared) | No shared helper import — each renderer is independently tree-shakable without pulling in a utils module       |
| status variant normalization strips whitespace+underscores+hyphens | 'in-progress' normalized to 'inprogress' matches Set lookup; preserves original label for display        |
| html renderer injectedPurify persists for module lifetime  | Once configure() is called, injection is permanent for the module session; vi.resetModules needed for deep isolation |
| resolveColumns immediate text fallback (no inference arg)  | Returns text for all columns immediately; same function handles typed path when inferenceResult is passed |
| labelFromKey auto-generates Title Case column labels        | camelCase/snake_case/kebab-case → Title Case (created_at → Created At); consumers skip explicit label config |
| Engine holds no inferenceResult — Svelte layer owns state  | CORE-08: engine is pure stateless computation; reactive state lives in Svelte $state() in Phase 3 |
| 17 renderer export entries in package.json (import-only)   | ESM tree-shaking sub-paths; no require form needed for individual renderer entries |
| dompurify added as optional peerDependency >=3.0.0         | DOMPurify inclusion strategy resolved: peer dep, not bundled; html renderer opt-in pattern confirmed |

### Active Todos

- [ ] Verify `@tablecraft` npm scope availability before Phase 7 publish work
- [ ] Phase 2: research DOMPurify inclusion strategy (peer dep vs bundled)
- [ ] Phase 4: research `@tanstack/virtual` Web Components integration specifics
- [ ] Phase 4: research Web Worker sort compatibility with SSR adapters
- [ ] Phase 5: research `@lit/react` + React 19 compatibility status
- [ ] Phase 5: research Vue 3 `compilerOptions.isCustomElement` current behavior with typed wrappers
- [ ] Phase 3: empirical test of Svelte 5 rune reactivity at 100k row scale

### Blockers

None currently. Phase 1 has no dependencies.

### Critical Pitfalls to Watch

- XSS via `{@html}` — must be fully eliminated in Phase 1 (FOUND-07)
- Runtime type-switcher dropdown — remove in Phase 1 (FOUND-09)
- Tailwind CDN in `<svelte:head>` — remove in Phase 1 (FOUND-08)
- Shadow DOM — never use; Light DOM is the decision
- Rollup 2 → Vite: scaffold fresh, do not upgrade incrementally
- Svelte 3 → 5: scaffold fresh, reference v1 only for renderer logic
- React wrapper: assign `element.data = rows` via ref post-mount, not JSX attribute
- API accretion in Phase 6: every new prop must pass the design document gate

---

## Session Continuity

**Last session:** 2026-03-21T15:52:34.373Z

**Stopped at:** Completed 02-core-engine-type-inference-renderer-registry/05-PLAN.md

**Next action:** Continue Phase 2 — Plan 06 (final plan to complete Phase 2).

**Context to restore:** Phase 2 Plans 01–05 complete. types.ts: CellDescriptor (10 variants), RendererFn, ResolvedColumn, ProcessedRow, BadgeVariant. tokens.ts: 18 --tc-* tokens. scheduler.ts: scheduleIdleWork. Inference engine: detectors.ts (15 detectors), inference/index.ts (inferSchema, sampleRows, runDetectors). registry/index.ts: Map singleton. renderers/: all 17 Tier 1 renderers self-registered. engine/index.ts: createTableEngine factory (inferSchema/resolveColumns/processRows/getConfig). compat/v1.ts: adaptV1Props with all 6 type mappings + deprecation warn. index.ts: full public API barrel. package.json: 17 renderer export entries + DOMPurify optional peerDep. 464 core tests pass (25 files). TypeScript strict mode: zero errors. CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06, CORE-07, CORE-08, CORE-09, CORE-10, CORE-11, CORE-12 all marked complete.

---

_State initialized: 2026-03-20_
_Last updated: 2026-03-20 — planning complete_
