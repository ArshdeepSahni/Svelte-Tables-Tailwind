# Roadmap: svelte-tables-tailwind v2.0.0

**Milestone:** v2.0.0 — Industry-Standard Zero-Config Table Library
**Created:** 2026-03-20
**Granularity:** Fine
**Phases:** 7
**Requirements:** 64 v1 requirements mapped

---

## Phases

- [x] **Phase 1: Foundation** - Monorepo scaffold, dependency upgrades, toolchain modernization, and blocker resolution (completed 2026-03-21)
- [x] **Phase 2: Core Engine + Type Inference + Renderer Registry** - Pure-JS inference engine, renderer plugin registry, and all Tier 1 cell renderers (completed 2026-03-21)
- [x] **Phase 3: Svelte 5 Component + Zero-Config API** - Primary delivery vehicle — `<Table data={rows} />` working end-to-end (completed 2026-03-21)
- [x] **Phase 4: Virtual Scrolling + Performance** - 100k-row virtual scrolling, CSS containment, Web Worker sort, and benchmark validation (completed 2026-03-21)
- [x] **Phase 5: Web Components Core + Framework Wrappers** - Lit 3 Custom Element, React wrapper, Vue wrapper (completed 2026-03-22)
- [ ] **Phase 6: Column Operations + Advanced Features** - Resizing, reordering, pinning, row grouping, aggregate footer, persistence
- [ ] **Phase 7: Docs Site + Release** - SvelteKit docs, live REPL playground, npm publish, v1 deprecation notice

---

## Phase Details

### Phase 1: Foundation

**Goal:** The monorepo compiles, tests run, and every critical v1 defect is eliminated — the codebase is safe and modern enough for v2 feature work to begin.

**Depends on:** Nothing (first phase)

**Requirements:** FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06, FOUND-07, FOUND-08, FOUND-09, FOUND-10, FOUND-11, FOUND-12

**Success Criteria** (what must be TRUE when this phase completes):

1. A developer can clone the repo, run `pnpm install && pnpm build`, and get artifact outputs from all packages with zero errors.
2. `pnpm test` runs Vitest across all packages without failures — the test infrastructure exists and is wired.
3. No `{@html}` string concatenation remains in any component file — every cell renders through a typed Svelte component or safe binding.
4. The v1 Tailwind CDN `<link>` and the runtime type-switcher `<select>` in column headers are gone — no trace in any source file.
5. The `package.json` license field and the `LICENSE` file both read `MIT`, and `engines.node` is set to `>=20`.

**Plans:** 4/4 plans complete

Plans:

- [ ] 01-PLAN.md — Repository skeleton: delete v1 source, create pnpm-workspace.yaml, rewrite root package.json, tsconfig.base.json, eslint.config.js, .prettierrc, .changeset/config.json
- [ ] 02-PLAN.md — Package scaffolds: packages/core (Vite 8 + types), packages/svelte (Svelte 5 runes stub), packages/react (tsup), packages/vue (tsup), apps/docs stub
- [ ] 03-PLAN.md — Build pipeline verification: pnpm install, build all packages, fix errors, pnpm -r typecheck
- [ ] 04-PLAN.md — Testing infrastructure: Vitest workspace, foundation test suite (FOUND-\* spec), Playwright smoke, ESLint + Prettier clean

---

### Phase 2: Core Engine + Type Inference + Renderer Registry

**Goal:** The zero-config type inference engine and the renderer plugin registry exist as tested, framework-agnostic TypeScript — the core intellectual property of the library, fully working before any UI is built.

**Depends on:** Phase 1

**Requirements:** CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06, CORE-07, CORE-08, CORE-09, CORE-10, CORE-11, CORE-12

**Success Criteria** (what must be TRUE when this phase completes):

1. A developer can call `createTableEngine({ data: rows })` in a plain Node.js script and get back inferred column types for all 14+ detector categories — no Svelte, no DOM required.
2. Passing a column named `avatar` to the engine boosts its inference score toward `image` even when the field values alone are ambiguous — field-name heuristics demonstrably improve accuracy in the test suite.
3. A developer can call `registerRenderer('sparkline', myFn)` and the custom renderer is invoked in place of the built-in fallback — the plugin API works end-to-end without touching core files.
4. Importing only the `currency` renderer does not include the `code` or `image` renderers in the output bundle — tree-shaking works per individual renderer module.
5. Vitest reports > 95% line coverage on the inference engine and > 90% on all Tier 1 renderers.

**Plans:** 6/6 plans complete

Plans:
- [ ] 02-01-PLAN.md — Types + Infrastructure: extend types.ts (CellDescriptor, ResolvedColumn, RendererFn, ProcessedRow), create tokens.ts (18 --tc-* tokens), scheduler.ts (requestIdleCallback/setImmediate), update vite.config.ts (rolldownOptions, multi-entry), vitest.config.ts (coverage thresholds), Wave 0 test stubs
- [ ] 02-02-PLAN.md — Inference Engine: 15 detector functions (detectors.ts), inferSchema pipeline with systematic sampling (inference/index.ts), full detector and pipeline tests
- [ ] 02-03-PLAN.md — Renderer Registry: Map-based registry with register/get/has/unregister/clear API (registry/index.ts), full registry tests
- [ ] 02-04-PLAN.md — All 17 Tier 1 Renderers: individually tree-shakable renderer files (renderers/*.ts), renderers/index.ts barrel, 17 test files with null/undefined/edge-case coverage
- [ ] 02-05-PLAN.md — Engine Factory + v1 Shim: createTableEngine() factory (engine/index.ts), adaptV1Props() shim (compat/v1.ts), state separation README.md, updated index.ts + package.json exports map
- [ ] 02-06-PLAN.md — Coverage + Build Verification: run coverage (inference >= 95%, renderers >= 90%), run multi-entry build, verify 17 dist/renderers/ files, tree-shaking assertion

---

### Phase 3: Svelte 5 Component + Zero-Config API

**Goal:** A Svelte 5 developer can drop `<Table data={rows} />` into any SvelteKit project and get a fully functional, accessible, sortable, filterable, paginated table with zero configuration.

**Depends on:** Phase 2

**Requirements:** SVLT-01, SVLT-02, SVLT-03, SVLT-04, SVLT-05, SVLT-06, SVLT-07, SVLT-08, SVLT-09, SVLT-10, SVLT-11, SVLT-12, SVLT-13, SVLT-14, SVLT-15

**Success Criteria** (what must be TRUE when this phase completes):

1. `<Table data={rows} />` with no other props renders a complete table — column headers derived from data keys, cell types inferred, table visible immediately with text fallback before inference completes.
2. `<Table data={rows} columns={{ avatar: 'image', price: 'currency' }} />` overrides only the specified columns, leaving all others inferred — the one-prop override API works without touching anything else.
3. A developer using the v1 `colname`/`rowdata` props sees a browser console deprecation warning but the table still renders correctly — no breaking change for existing users.
4. A screen reader using NVDA or VoiceOver can navigate the table with arrow keys, hears column header role and sort direction via `aria-sort`, and hears `aria-busy` during loading — WCAG 2.1 AA is satisfied.
5. `@sveltejs/package` produces a dist folder with correct `exports` map entries for `.svelte`, `.js`, and `.d.ts` — TypeScript consumers get full type inference on the `columns` prop.

**Plans:** 6/6 plans complete

Plans:
- [x] 03-01-PLAN.md — Test scaffold: Svelte-layer types.ts, vitest-axe install, full failing test stubs for all 12 test-covered requirements
- [x] 03-02-PLAN.md — Sub-components: Cell.svelte (CellDescriptor → safe markup dispatcher), SearchInput.svelte (debounced filter)
- [x] 03-03-PLAN.md — Sub-components: TableHeader.svelte (sortable thead + aria-sort), Checkbox.svelte (three-state with indeterminate via bind:this)
- [x] 03-04-PLAN.md — Sub-components: TableBody.svelte (rows/empty/loading/keyboard nav), TableFooter.svelte (pagination controls)
- [x] 03-05-PLAN.md — Table.svelte complete rewrite + index.ts update (wires all sub-components, two-phase inference, v1 compat)
- [x] 03-06-PLAN.md — Build verification + exports map confirmed + responsive visual checkpoint

---

### Phase 4: Virtual Scrolling + Performance

**Goal:** The table handles 100,000 rows without jank — initial render is under 200ms, scrolling holds 60fps, and sort does not block the main thread.

**Depends on:** Phase 3

**Requirements:** PERF-01, PERF-02, PERF-03, PERF-04, PERF-05, PERF-06, PERF-07

**Success Criteria** (what must be TRUE when this phase completes):

1. A Playwright benchmark loading 100,000 rows passes: initial paint under 200ms, no layout jank during fast scroll on a mid-range hardware profile (CPU 4x throttle in DevTools equivalent).
2. The browser DevTools Performance panel shows a constant ~30 DOM row nodes in the table body regardless of dataset size — virtual scrolling is active and DOM recycling is confirmed.
3. Sorting a 100,000-row dataset triggers no main-thread freeze — the sort operation completes in a Web Worker and results appear in under 50ms.
4. A table with 25 columns activates column virtualization automatically — only visible columns are rendered, confirmed by inspecting the DOM.
5. DevTools computed styles on a table row show `contain: layout style` and on a table cell show `contain: layout style paint` — CSS containment is applied.

**Plans:** 6/6 plans complete

Plans:
- [ ] 04-01-PLAN.md — Infrastructure + Wave 0 tests: install @tanstack/svelte-virtual, add playwright webServer, create bench page (100k rows), sort.worker.ts, and failing test stubs for all PERF-* requirements
- [ ] 04-02-PLAN.md — Row virtualization: wire @tanstack/svelte-virtual into Table.svelte ($effect lifecycle), virtual render path in TableBody.svelte (translateY positioning), height spacer div, isVirtualizing derived
- [ ] 04-03-PLAN.md — Event delegation + CSS containment: move onclick from tr/td to single tbody handler (data-row/data-col), add contain: layout style to .tc-tr and contain: layout style paint to .tc-td
- [ ] 04-04-PLAN.md — Web Worker sort: wire sort.worker.ts into Table.svelte ($effect lifecycle, SSR guard, 10k threshold), sortLoading state, aria-busy on TableHeader thead
- [ ] 04-05-PLAN.md — Column virtualization: second createVirtualizer instance (horizontal: true, threshold >20 cols), spacer th/td pattern in TableHeader and TableBody, green PERF-06 unit tests
- [ ] 04-06-PLAN.md — Playwright benchmarks + phase verification: implement all 5 benchmarks in e2e/performance.spec.ts, run full suite (48 unit tests + 6 Playwright), clean build gate + human visual checkpoint

---

### Phase 5: Web Components Core + Framework Wrappers

**Goal:** React and Vue developers can install a wrapper package and use the table with the same zero-config experience as Svelte users, without any Svelte dependency in their project.

**Depends on:** Phase 4

**Requirements:** WC-01, WC-02, WC-03, WC-04, WC-05, WC-06, WC-07, WC-08, WC-09, WC-10

**Success Criteria** (what must be TRUE when this phase completes):

1. A React developer can write `<TcTable data={rows} onCellClick={handler} />` in a React 18+ project and see a rendered table — the `@lit/react` wrapper forwards all CustomEvents as React props without manual `addEventListener` calls.
2. A Vue 3 developer can write `<TcTable :data="rows" @tc-cell-click="handler" />` and see a rendered table — the Vue SFC wrapper handles native custom element event forwarding transparently.
3. A SvelteKit project with SSR enabled builds without `window is not defined` or `customElements is not defined` errors — all browser-only APIs are guarded.
4. Setting `document.querySelector('tc-table').data = rows` in the browser console of a plain HTML file (no framework) updates the rendered table — the Web Component property API works in vanilla JS.
5. Playwright smoke tests pass for both the React wrapper and the Vue wrapper rendering 100 rows — tables are visible, headers are present, cells contain expected values.

**Plans:** 5/5 plans complete

Plans:
- [ ] 05-01-PLAN.md — Infrastructure + Wave 0 stubs: install lit in @tablecraft/core, install @lit/react in @tablecraft/react, switch @tablecraft/vue to Vite + @vitejs/plugin-vue, create vite.config.element.ts (UMD), create element.test.ts and wc-smoke.spec.ts Wave 0 stubs
- [ ] 05-02-PLAN.md — Lit Element implementation: packages/core/src/element.ts (TcTable LitElement, Light DOM, static properties, renderCell mirroring Cell.svelte, all 5 CustomEvents, SSR guards), make element.test.ts stubs pass GREEN
- [ ] 05-03-PLAN.md — React wrapper: packages/react/src/index.ts (createComponent() with @lit/react, all 5 event mappings, TypeScript types)
- [ ] 05-04-PLAN.md — Vue wrapper: packages/vue/src/Table.vue (Vue 3 SFC, imperative ref+watch for data, addEventListener event forwarding), packages/vue/src/index.ts export
- [ ] 05-05-PLAN.md — Build verification + Playwright smoke tests: run all builds (UMD + ESM+CJS for all 4 packages), implement full wc-smoke.spec.ts (vanilla/React/Vue 100-row tests), human visual checkpoint

---

### Phase 6: Column Operations + Advanced Features

**Goal:** A developer building a data-dense admin interface can resize, reorder, pin, and group columns, persist that layout, and add aggregate footers — all without leaving the table's prop API.

**Depends on:** Phase 5

**Requirements:** ADV-01, ADV-02, ADV-03, ADV-04, ADV-05, ADV-06, ADV-07, ADV-08, ADV-09

**Success Criteria** (what must be TRUE when this phase completes):

1. A developer can drag a column divider handle to resize the column — the width updates live, respects `minWidth`/`maxWidth` constraints, and the change does not trigger a full table re-render.
2. A developer can drag a column header to a new position and drop it — the column order updates and the new order is reflected in the DOM without a page reload.
3. Setting `pinned: 'left'` on a column definition causes that column to remain fixed during horizontal scroll — confirmed by scrolling a wide table in a narrow viewport.
4. After a page reload, a table with `persistKey="admin-users"` restores the previous column widths, sort state, and visibility state from localStorage automatically.
5. Adding `density="compact"` reduces row height and padding visibly, and `density="spacious"` increases them — the three density modes are visually distinct.

**Plans:** TBD

---

### Phase 7: Docs Site + Release

**Goal:** Any developer finding the library can go from discovery to a working table in their project in under 5 minutes, and existing v1 users know exactly how to migrate.

**Depends on:** Phase 6

**Requirements:** DOCS-01, DOCS-02, DOCS-03, DOCS-04, DOCS-05, DOCS-06, DOCS-07, DOCS-08

**Success Criteria** (what must be TRUE when this phase completes):

1. A developer can paste any JSON array into the live REPL playground on the docs site and immediately see the inferred column types highlighted alongside a rendered table — the playground works without any local setup.
2. `npm install @tablecraft/svelte` succeeds and the Getting Started example from the docs README renders a table in a fresh SvelteKit project — the published package is functional.
3. A developer running `npm install svelte-tables-tailwind` (the v1 package) sees a deprecation notice in the install output or console pointing to `@tablecraft/svelte` — the migration path is explicit.
4. The docs site search returns relevant results for queries like "currency renderer", "sort", and "custom renderer" — search is functional and indexed.
5. The GitHub Actions publish workflow runs `changeset publish` on merge to main, bumps versions, generates a changelog entry, and publishes all packages to npm without manual steps.

**Plans:** TBD

---

## Milestone Summary

| Phase | Name                                             | Goal                                                | Requirements         | Status  |
| ----- | ------------------------------------------------ | --------------------------------------------------- | -------------------- | ------- |
| 1     | 4/4                                              | Complete    | 2026-03-21 | Pending |
| 2     | 6/6 | Complete    | 2026-03-21 | Pending |
| 3     | 6/6 | Complete    | 2026-03-21 | Pending |
| 4     | 6/6 | Complete    | 2026-03-21 | Pending |
| 5     | 4/5 | Complete    | 2026-03-22 | Pending |
| 6     | Column Operations + Advanced Features            | Resize, reorder, pin, group, persist, density       | ADV-01–09 (9 reqs)   | Pending |
| 7     | Docs Site + Release                              | Live playground, npm publish, v1 deprecation        | DOCS-01–08 (8 reqs)  | Pending |

**Total: 64 requirements mapped across 7 phases — 100% coverage**

---

## Coverage Map

| Requirement | Phase |
| ----------- | ----- |
| FOUND-01    | 1     |
| FOUND-02    | 1     |
| FOUND-03    | 1     |
| FOUND-04    | 1     |
| FOUND-05    | 1     |
| FOUND-06    | 1     |
| FOUND-07    | 1     |
| FOUND-08    | 1     |
| FOUND-09    | 1     |
| FOUND-10    | 1     |
| FOUND-11    | 1     |
| FOUND-12    | 1     |
| CORE-01     | 2     |
| CORE-02     | 2     |
| CORE-03     | 2     |
| CORE-04     | 2     |
| CORE-05     | 2     |
| CORE-06     | 2     |
| CORE-07     | 2     |
| CORE-08     | 2     |
| CORE-09     | 2     |
| CORE-10     | 2     |
| CORE-11     | 2     |
| CORE-12     | 2     |
| SVLT-01     | 3     |
| SVLT-02     | 3     |
| SVLT-03     | 3     |
| SVLT-04     | 3     |
| SVLT-05     | 3     |
| SVLT-06     | 3     |
| SVLT-07     | 3     |
| SVLT-08     | 3     |
| SVLT-09     | 3     |
| SVLT-10     | 3     |
| SVLT-11     | 3     |
| SVLT-12     | 3     |
| SVLT-13     | 3     |
| SVLT-14     | 3     |
| SVLT-15     | 3     |
| PERF-01     | 4     |
| PERF-02     | 4     |
| PERF-03     | 4     |
| PERF-04     | 4     |
| PERF-05     | 4     |
| PERF-06     | 4     |
| PERF-07     | 4     |
| WC-01       | 5     |
| WC-02       | 5     |
| WC-03       | 5     |
| WC-04       | 5     |
| WC-05       | 5     |
| WC-06       | 5     |
| WC-07       | 5     |
| WC-08       | 5     |
| WC-09       | 5     |
| WC-10       | 5     |
| ADV-01      | 6     |
| ADV-02      | 6     |
| ADV-03      | 6     |
| ADV-04      | 6     |
| ADV-05      | 6     |
| ADV-06      | 6     |
| ADV-07      | 6     |
| ADV-08      | 6     |
| ADV-09      | 6     |
| DOCS-01     | 7     |
| DOCS-02     | 7     |
| DOCS-03     | 7     |
| DOCS-04     | 7     |
| DOCS-05     | 7     |
| DOCS-06     | 7     |
| DOCS-07     | 7     |
| DOCS-08     | 7     |

### Phase 8: AI-Augmented Intelligence

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 7
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 8 to break down)

### Phase 9: Real-Time Data Streams

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 8
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 9 to break down)

### Phase 10: Developer Ecosystem

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 9
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 10 to break down)

---

_Created: 2026-03-20_
_Last updated: 2026-03-22 — Phase 5 plans created (5 plans, 4 waves)_
