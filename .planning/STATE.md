---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: milestone
status: planning
last_updated: "2026-03-21T12:37:40.719Z"
progress:
  total_phases: 7
  completed_phases: 0
  total_plans: 4
  completed_plans: 1
---

# Project State

**Project:** svelte-tables-tailwind v2.0.0
**Updated:** 2026-03-21
**Status:** Phase 1 in progress — Plan 01 complete

---

## Current Phase

Phase 1: Foundation — in progress (Plan 01 complete)

---

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-03-20)

**Core value:** Zero-config data display with smart type inference — `<Table data={rows} />` just works, and when you need more, one prop does it.

**Current focus:** Phase 1: Foundation

**Milestone:** v2.0.0 — Industry-Standard Zero-Config Table Library

---

## Current Position

| Field | Value |
|-------|-------|
| Phase | 1 — Foundation |
| Plan | 01 complete (monorepo scaffold) |
| Status | In progress |
| Progress | 0/7 phases complete |

```
Phase progress: [_______] 0/7
Plan progress:  [███░░░░░░░] 25% (1/4 plans)
```

---

## Phase Progress

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 1 | Foundation | In progress | 1/4 |
| 2 | Core Engine + Type Inference + Renderer Registry | Pending | 0/0 |
| 3 | Svelte 5 Component + Zero-Config API | Pending | 0/0 |
| 4 | Virtual Scrolling + Performance | Pending | 0/0 |
| 5 | Web Components Core + Framework Wrappers | Pending | 0/0 |
| 6 | Column Operations + Advanced Features | Pending | 0/0 |
| 7 | Docs Site + Release | Pending | 0/0 |

---

## Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Requirements covered | 64/64 | 64/64 (planning) |
| Phases complete | 7 | 0 |
| Test coverage (inference engine) | >95% | — |
| Test coverage (renderers) | >90% | — |
| Initial render (100k rows) | <200ms | — |
| Scroll performance (100k rows) | 60fps | — |
| Sort time (100k rows, Worker) | <50ms | — |
| Bundle size (core, gzipped) | <50KB | — |

| Plan 01-foundation/01 | 2 min | 3 tasks | 11 files |

---

## Accumulated Context

### Key Decisions Made

| Decision | Rationale |
|----------|-----------|
| pnpm monorepo — 4 packages | `@tablecraft/core`, `@tablecraft/svelte`, `@tablecraft/react`, `@tablecraft/vue` |
| ESLint 9 flat config, svelte/no-at-html-tags: error | Enforces FOUND-07 XSS elimination at lint time; hard error not warn |
| NodeNext + verbatimModuleSyntax in tsconfig.base.json | Correct pnpm workspace ESM interop on Node 20 LTS; prevents type-only import leaks |
| Changesets linked @tablecraft/* packages | Coordinated version releases; access: public for npm publish |
| Lit 3 Web Component in Light DOM | Shadow DOM blocks Tailwind; Light DOM is irreversible architectural choice |
| `@sveltejs/package` for Svelte build | Only correct tool for `.svelte` compilation + exports map |
| `@tanstack/virtual` for row virtualization | Framework-agnostic, ~4KB gzip, does not require TanStack Table |
| Fixed 48px row height for v2 | O(1) scroll position; dynamic height deferred to v3 |
| v1 `colname`/`rowdata` shim retained | Deprecation warnings, not breaking errors; removed in v3 |
| Inference runs in `requestIdleCallback` | Table renders immediately with text fallback; no blocking |
| Single delegated event listener | `data-row`/`data-col` attributes; no per-cell listeners |
| React + Vue wrappers as v2.1 territory | Ship core + Svelte first; do not attempt 4-package simultaneous launch |
| No Shadow DOM | Irreversible; decided in planning |
| DOMPurify for `html` renderer | Explicit opt-in; bundle size tradeoff needs verification in Phase 2 |

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

**Last session:** 2026-03-21T12:37:40.718Z

**Stopped at:** Completed 01-foundation-01-PLAN.md

**Next action:** Execute Phase 1, Plan 02 — package manifests and TypeScript scaffolding.

**Context to restore:** Phase 1 Plan 01 complete. pnpm workspace scaffold is done. packages/core, packages/svelte, packages/react, packages/vue and apps/docs exist as empty stubs. Plan 02 will create package.json + tsconfig.json for each package, establish the @tablecraft/* namespace, and create the core types skeleton.

---

*State initialized: 2026-03-20*
*Last updated: 2026-03-20 — planning complete*
