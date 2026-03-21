# Research Summary: svelte-tables-tailwind v2.0.0

**Synthesized:** 2026-03-20
**Sources:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md, PROJECT.md
**Overall Confidence:** MEDIUM-HIGH (training data through August 2025; no live web access during research)

---

## Executive Summary

This project is a ground-up rewrite of a Svelte 3 single-file table component into a framework-agnostic, multi-package library targeting the gap between heavy enterprise grids (AG Grid, TanStack Table) and too-simple display components. The core competitive thesis — infer column types from data automatically and render immediately without configuration — is validated as genuinely unique: no existing library offers true zero-config type-aware rendering. Every competitor, from DataTables to TanStack Table, requires developers to declare column schemas before anything renders.

The v1 codebase has five blocking defects that prevent v2 work from starting: an XSS vulnerability via unsanitized `{@html}`, a CDN-injected Tailwind stylesheet that conflicts with host applications, a runtime type-switcher dropdown rendered on every table that is a hard blocker for production use, a column definition API that breaks with two columns of the same type (object key uniqueness constraint), and a Svelte 3 + Rollup 2 toolchain that is incompatible with every v2 target (Svelte 5 runes, TypeScript, monorepo). None of these are refinements — they are rewrite prerequisites.

The recommended architecture is a four-package monorepo (`@tablecraft/core`, `@tablecraft/svelte`, `@tablecraft/react`, `@tablecraft/vue`) where the core is a handcrafted Lit 3 Web Component in Light DOM mode, a pure-JS type inference engine samples 200 rows per column, and `@tanstack/virtual` provides row virtualization. The Svelte package is the primary delivery vehicle for v2.0; React and Vue wrappers should launch as v2.1 after the core is proven. Ship the Svelte wrapper first, not all four packages simultaneously.

---

## Stack (from STACK.md)

**Monorepo:** pnpm workspaces (no Turborepo — 4 packages don't justify it; revisit at 8+ packages or 3+ minute CI times)

**Package naming:** `@tablecraft/*` scope on npm — the existing `svelte-tables-tailwind` name contradicts the framework-agnostic identity. Verify npm scope availability before publishing.

**Per-package build tools:**

- `@tablecraft/core` — Vite 5 library mode + `vite-plugin-dts` (produces ESM + CJS + UMD; UMD required for CDN/vanilla-JS consumers)
- `@tablecraft/svelte` — `@sveltejs/package` 2.x exclusively (handles `.svelte` compilation, exports map, TypeScript declarations; no alternative is correct)
- `@tablecraft/react` and `@tablecraft/vue` — `tsup` 8.x (esbuild speed, zero config, ESM + CJS + `.d.ts` in one command)

**Web Components core:** Lit 3.x in Light DOM mode (`createRenderRoot() { return this; }`). Light DOM is non-negotiable — Shadow DOM blocks Tailwind utility classes and contradicts the library's CSS integration value proposition. Accept the loss of style encapsulation.

**Framework adapters:** `@lit/react` 1.x for the React wrapper (official, maintained); Vue 3 SFC wrapper using native Vue custom element support (no third-party adapter needed).

**Virtual scrolling:** `@tanstack/virtual` 3.x — framework-agnostic, works inside Web Components, ~4KB gzip. Does NOT require TanStack Table.

**Type inference:** Pure TypeScript in `@tablecraft/core/src/inference/`. Samples 200 rows per column using systematic (not random) sampling. No external dependency justified.

**CSS strategy:** CSS custom properties as default design tokens, with an optional companion import (`@tablecraft/svelte/styles/tailwind.css`) for Tailwind v4 consumers. Zero global CSS injection from the library. Dark mode via `prefers-color-scheme` on token overrides.

**Testing:** Vitest 2.x (unit + component) + `@testing-library/svelte` 5.x + Playwright 1.x (E2E + Web Components testing). Custom Elements require a real browser — jsdom does not implement Shadow DOM correctly, so Playwright is mandatory for Web Components behavior tests. `vitest-axe` for WCAG 2.1 AA assertions.

**What to avoid:**

- Turborepo, Nx, Lerna (overkill for 4 packages)
- Stencil.js (owns build pipeline, conflicts with `@sveltejs/package`)
- tsup/esbuild directly for the Svelte package (cannot compile `.svelte` files correctly)
- Jest (ESM configuration pain; Vitest is a strict superset)
- Shadow DOM for the Web Components core

---

## Table Stakes Features (from FEATURES.md)

Features users leave without. Every item below is missing or broken in v1.

| Feature                                   | v1 Status | Notes                             |
| ----------------------------------------- | --------- | --------------------------------- |
| Column sorting                            | MISSING   | Most basic table interaction      |
| Column filtering / search                 | MISSING   | Required for any table > 20 rows  |
| Pagination                                | MISSING   | Required without virtualisation   |
| Auto-derive column headers from data keys | MISSING   | Core zero-config requirement      |
| TypeScript types                          | MISSING   | Enterprise teams require this     |
| Accessibility (ARIA, keyboard nav)        | MISSING   | Legal requirement in many markets |
| CSS customisation                         | BROKEN    | CDN Tailwind blocks all overrides |
| Empty state display                       | MISSING   | UX expectation                    |
| Loading state (async)                     | MISSING   | Every real app loads async        |
| Row selection (checkbox)                  | MISSING   | Admin UI expectation              |
| Column resizing                           | MISSING   | Data-dense table expectation      |
| Responsive display                        | MISSING   | Mobile overflow is unacceptable   |
| Zero-config initialization                | PARTIAL   | v1 requires `colname` object      |
| Row click / cell click events             | PRESENT   | Carry forward to v2               |

**Key competitive insight from the API complexity survey:** The v2 target of `<Table data={rows} />` (1 line) achieving 60% of use cases is achievable and genuinely unique. The closest competitor (Tabulator) requires 5-8 lines for a basic working table. TanStack Table requires 80-120 lines minimum.

---

## Differentiators (from FEATURES.md)

| Feature                                               | Priority         | Competitive Gap                                          |
| ----------------------------------------------------- | ---------------- | -------------------------------------------------------- |
| Auto type inference from data                         | P0 — core thesis | No competitor does this                                  |
| Zero boilerplate: `<Table data={rows} />`             | P0 — core thesis | No competitor with real rendering                        |
| 1-prop override API (`columns={{ avatar: 'image' }}`) | P0 — core thesis | No competitor has this pattern                           |
| 14+ opinionated cell renderers (auto-applied)         | P1               | All competitors require manual assignment                |
| Virtual scrolling with zero config                    | P1               | All competitors require explicit virtualisation config   |
| Smart default formatters (numbers/dates/URLs)         | P1               | Competitors render raw values                            |
| Framework-agnostic Web Components core                | P1               | Only AG Grid and Grid.js are truly framework-agnostic    |
| Plugin renderer extension API                         | P1               | Required for OSS extensibility                           |
| Theme system (CSS custom properties)                  | P1               | AG Grid has themes; TanStack (headless) leaves it to you |
| Inline editing with zero config                       | P2 — post v2.0   | Handsontable (paywalled); AG Grid requires editor config |
| Column pinning                                        | P2 — post v2.0   | Present in AG Grid, TanStack, Tabulator                  |
| Export (CSV, JSON)                                    | P2 — post v2.0   | Zero dep; low complexity                                 |
| Sub-row / expandable rows                             | P2 — post v2.0   | Common in enterprise grids                               |

**Renderer catalog for v2:** Tier 1 must ship in v2 — `text`, `number`, `integer`, `currency`, `percentage`, `boolean`, `date`, `datetime`, `time`, `email`, `url`, `phone`, `image`, `badge`/`tag`, `status`, `code`, `html` (with XSS opt-in). Tier 2 (avatar, list, progress, relative-time, actions) targets v2 optional or v3.

**Anti-features to explicitly not build:**

- Formula engine (Handsontable-tier complexity; aggregate footer functions cover 90% of need)
- Server-side data model as v2 core (explicit PROJECT.md out-of-scope; provide `onFetch` callback hook)
- Built-in XLSX export (SheetJS licensing risk; ship CSV only)
- Right-click context menus (interferes with browser defaults; fire events, let app handle it)
- Runtime column type-switcher dropdown (v1 anti-feature — remove on day one)

---

## Architecture Decisions (from ARCHITECTURE.md)

**Core pattern — headless engine + framework adapters:**
The pure-JS `createTableEngine(config)` factory returns a table instance with accessor methods and an event emitter interface. Framework adapters (Svelte 5 runes, React useState, Vue ref) wrap engine state in their reactive primitives. The engine never touches the DOM. This is the TanStack Table insight applied to the Web Components context.

**Build order within the core:**

1. Type inference engine first (pure TS, testable without any UI)
2. Renderer registry (plugin API before built-in renderers)
3. Virtual scrolling via `@tanstack/virtual`
4. Web Components wrapper (Lit)
5. Framework adapters

**Virtual scrolling strategy:**

- Fixed row height (48px, configurable via CSS variable) for v2 — covers 90% of cases, O(1) row index lookup
- Dynamic row heights deferred to v3 (requires prefix-sum array + ResizeObserver two-phase render)
- Column virtualization: only when column count > 20; default is render all columns
- Use flexbox rows with explicit column widths (not semantic `<table>` — browser recalculates column widths on any change, incompatible with virtualisation)
- CSS containment on rows (`contain: layout style`) and cells (`contain: layout style paint`) — single highest-impact CSS performance optimization for large tables

**Type inference algorithm:**

- Sample 200 rows (systematic, not random — preserves distribution for sorted data)
- Run detectors in priority order: boolean → currency/percentage → number → date → time → email → phone → image URL → URL → status/enum → JSON → code → text fallback
- Confidence scores; threshold-based selection; field name keyword boosting
- Run inference in `requestIdleCallback` so the table renders immediately with "text" fallback, then updates once inference completes
- Sample size of 200 achieves statistical reliability in < 1ms per column

**State separation (prevents reactive cascade pitfall):**

- `columns` (definitions — changes rarely)
- `sortState` (changes on header click)
- `filterState` (changes on filter input)
- `visibleRows` (derived from rows + sortState + filterState + scrollPosition)
  Cell renderers re-render only when cell value changes or column type changes — never on sort order change.

**Plugin system — renderer registry:**
Each renderer is an individually importable module. Built-in renderers use the same `registerRenderer()` API as external plugins — no special-cased internal path. This is the OSS extensibility requirement and the tree-shaking requirement solved simultaneously.

**Event handling:**
Single delegated event listener on the container element reads `data-row` and `data-col` attributes. Never attach listeners per cell. Works correctly with virtual scrolling's DOM recycling.

**Web Components property vs attribute contract:**

- Attributes: scalars only (`row-height="48"`, `sort-by="name"`)
- Properties: complex objects (`element.data = rows`, `element.columns = [...]`)
- Events: `CustomEvent` with `bubbles: true, composed: true`
- Light DOM (no Shadow DOM): full Tailwind class access, no encapsulation boundary

---

## Critical Pitfalls to Avoid (from PITFALLS.md)

### CRITICAL — Phase 1 blockers (nothing else can start until resolved)

**XSS via `{@html}` with unsanitized cell values** (Pitfall 9)
Every cell in v1 renders via `{@html returndatatype(key, value)}` with raw string concatenation. This is a rewrite-level security vulnerability. In v2, each renderer type is a Svelte component using text bindings; the `html` renderer type requires explicit opt-in and DOMPurify sanitization.

**Runtime type-switcher dropdown in every column header** (Pitfall 4)
V1 renders a `<select>` in every header that exposes internal renderer types to end users. This is the single biggest adoption blocker for production use. Remove entirely on day one; gate behind explicit `devMode` prop only if needed at all.

**Tailwind CDN in `<svelte:head>`** (Pitfall 10)
Injects a full Tailwind bundle globally, conflicts with host app's Tailwind version, adds a blocking network request, fails in SSR. Replace with CSS custom property tokens.

**`colname` object key = column type uniqueness constraint** (Pitfall 1)
V1's `{ "string": "Name", "number": "Age" }` API breaks the moment a table has two columns of the same type. Every real-world table has multiple text columns. V2 API must be `columns: Array<{key, type, label}>` from day one.

**Svelte 3 → 5 migration** (Pitfall 25)
Not a drop-in upgrade. `export let` → `$props()`, `$:` → `$derived()`/`$effect()`, `on:event` → `onevent`, `window.onload` (line 13 of Tables.svelte) crashes immediately. Strategy: scaffold v2 fresh with Svelte 5; reference v1 only for renderer logic. Do not attempt incremental migration.

**Rollup 2 → Vite + `@sveltejs/package`** (Pitfall 26)
Current plugins (`rollup-plugin-node-resolve` v5, `rollup-plugin-svelte` v7, `rollup-plugin-css-only`) are all replaced. Do not upgrade incrementally — scaffold fresh build config, verify output parity, then remove old config.

### HIGH — Must address before or during their phase

**ISC/MIT license mismatch** (Pitfall 24): `package.json` says ISC, LICENSE file says MIT. Enterprise automated scanners block the library. Fix takes 5 minutes; do it in Phase 1.

**Missing `exports` map** (Pitfall 29): Without a correct `exports` field, deep imports fail, TypeScript can't find types, and tree-shaking doesn't work. `@sveltejs/package` generates this automatically — use it.

**All renderers bundled unconditionally** (Pitfall 11): Current if-else chain in `returndatatype()` cannot be tree-shaken. V2 must be individually importable renderer modules. Each renderer is a standalone file.

**Shadow DOM blocking Tailwind** (Pitfall 15): Do not use Shadow DOM. Light DOM is the architectural decision for this library. This is irreversible post-launch.

**SSR incompatibility** (Pitfall 16): `customElements.define()`, `ResizeObserver`, `window.scrollY` must be guarded with `typeof window !== 'undefined'` checks. Test SvelteKit SSR in CI from the start.

**Custom Element attribute/property reflection** (Pitfall 14): React pre-19 passes JSX props as HTML attributes (strings), breaking complex data input. The React wrapper must assign `element.data = rows` via `ref` after mount, not via JSX attribute spreading.

**Extension API requiring core file modification** (Pitfall 22): The v1 if-else chain requires touching core code for every new renderer. V2 renderer registry with `registerRenderer()` eliminates this bottleneck entirely.

**v1 API migration cliff** (Pitfall 21): Ship a compatibility shim that accepts `colname`/`rowdata` and transforms to v2 format with deprecation warnings. Remove in v3, not v2.

### MEDIUM — Design discipline required throughout

**Re-render cascade from reactive column definitions** (Pitfall 7): Separate state graph (`columns`, `sortState`, `filterState`, `visibleRows`) prevents a sort click from re-rendering all cell renderers.

**TypeScript generics complexity** (Pitfall 18): Constrain to `TRow extends Record<string, unknown>`. Use `defineColumns<TRow>()` helper. Avoid complex conditional types that break IntelliSense.

**Zero-config inference false promise** (Pitfall 19): Dirty data (nulls, mixed types, ZIP codes that look like numbers) will mis-infer. Err toward `text` when ambiguous. Document inference as best-effort heuristic. Provide debug mode.

**React Custom Event handling** (Pitfall 17): React's `onClick` does not map to `cell-click` CustomEvent. The React wrapper must attach native `addEventListener` for all Custom Events and forward as React props.

**Monorepo complexity at launch** (Pitfall 23): Launch with `@tablecraft/core` + `@tablecraft/svelte` as v2.0. Ship React and Vue wrappers as v2.1 after core is proven. Do not attempt 4-package simultaneous launch.

---

## Recommended Phase Order

Synthesized from all four research files. Every phase has a clear dependency on the previous phase.

### Phase 1 — Foundation (Blocker resolution + monorepo scaffold)

**Rationale:** Six CRITICAL pitfalls block everything. Nothing in Phase 2+ is buildable until these are resolved. This is not feature work — it is making the codebase safe and modern.

**Delivers:**

- pnpm monorepo with `packages/core`, `packages/svelte`, `packages/react`, `packages/vue` skeleton
- Svelte 5 + TypeScript 5 + Vite 5 + `@sveltejs/package` build pipeline working
- Root `tsconfig.base.json`, `.eslintrc`, Vitest workspace config
- `@changesets/cli` for versioned releases
- `exports` map on all packages, `engines` field, license reconciled (MIT)
- Svelte peer dependency declared (not bundled)
- XSS patterns removed, Tailwind CDN removed, type-switcher removed
- TypeScript `ColumnType` union and `defineColumns<TRow>()` helper defined
- v1 `colname`/`rowdata` compatibility shim designed (implementation in Phase 2)
- Node 20 LTS minimum specified

**Pitfalls resolved:** 1, 4, 9, 10, 12, 21, 24, 25, 26, 27, 28, 29

**Research flag:** Standard patterns — no phase-specific research needed.

---

### Phase 2 — Core Engine + Type Inference + Renderer Registry

**Rationale:** The type inference engine and renderer registry are the architectural foundation of the entire differentiator. They must be built before any UI component, because the UI is a thin layer over these systems.

**Delivers:**

- Pure-JS `createTableEngine(config)` factory with event emitter interface
- Type inference engine: 14 detector types, systematic sampling, field-name heuristics, confidence scoring
- Renderer plugin registry: `registerRenderer()` API, built-in renderers as individually importable files
- All Tier 1 renderers implemented: text, number, integer, currency, percentage, boolean, date, datetime, time, email, url, phone, image, badge/status, code, html (with DOMPurify opt-in)
- `$derived` state graph: `columns`, `sortState`, `filterState`, `visibleRows` — separate reactive stores
- v1 `colname`/`rowdata` compatibility shim implemented
- CSS custom property token system (`--tc-*` variables)
- Vitest unit tests: > 95% coverage on inference engine, > 90% on renderers
- API design document locking prop naming conventions (prevents AG Grid trap)

**Pitfalls resolved:** 3, 7, 11, 13, 19, 22

**Research flag:** Needs phase-specific research on inference engine edge cases (dirty data patterns, mixed-type columns, null handling strategies).

---

### Phase 3 — Svelte 5 Component + Zero-Config API

**Rationale:** With the core engine and renderers complete, the Svelte component is a thin reactive layer. This is the primary v2 delivery vehicle.

**Delivers:**

- `@tablecraft/svelte` — Svelte 5 runes component (`$props()`, `$state()`, `$derived()`, `$effect()`)
- Zero-config API: `<Table data={rows} />` — inference runs in `requestIdleCallback`; renders with text fallback immediately
- One-prop override API: `columns={{ avatar: 'image' }}` and full column descriptor objects
- Column sorting, filtering (global + per-column), pagination
- Empty state, loading state, responsive display
- Row selection (checkbox), basic keyboard navigation
- CSS custom property integration + optional Tailwind v4 companion import
- `@sveltejs/package` build, correct exports map verified
- `@testing-library/svelte` component tests (> 80% branch coverage)
- v1 backward compatibility verified with deprecation warnings

**Pitfalls resolved:** 2, 5 (ongoing), 8 (event delegation)

**Research flag:** Standard patterns — Svelte 5 runes are well-documented.

---

### Phase 4 — Virtual Scrolling + Performance

**Rationale:** Virtual scrolling is a table stakes requirement at the 100k row target. It must be built as a designed architectural layer, not a retrofit — the rendering pipeline from Phase 2 already accounts for it via `visibleRows` derived state.

**Delivers:**

- `@tanstack/virtual` integration for row virtualization
- Fixed row height (48px default, CSS variable configurable)
- Flexbox row layout with explicit column widths
- CSS containment (`contain: layout style` on rows, `contain: layout style paint` on cells)
- Event delegation at container level with `data-row`/`data-col` attributes
- Playwright E2E performance test: 100k rows, < 200ms initial render, 60fps scroll
- Column virtualization for > 20 columns
- Sort in worker thread for 100k rows (< 50ms target)

**Pitfalls resolved:** 6, 8

**Research flag:** Needs phase-specific research on `@tanstack/virtual` Web Components integration details and worker thread sort compatibility with the engine state model.

---

### Phase 5 — Web Components Core + Framework Wrappers

**Rationale:** The Web Components package enables React and Vue consumers. The framework wrappers are thin — they delegate to the same core engine. This is v2.1 territory; do not block v2.0 launch on this.

**Delivers:**

- `@tablecraft/core` — Lit 3 Web Component in Light DOM mode
- `customElements.define('tc-table', ...)` with browser guard
- Properties API for complex data (`element.data`, `element.columns`)
- Attributes API for scalars (`row-height`, `sort-by`, `bordered`)
- `CustomEvent` dispatch with `bubbles: true, composed: true`
- SSR guards on all browser-only code; SvelteKit SSR CI test
- `@tablecraft/react` — `@lit/react` wrapper; native `addEventListener` for CustomEvents mapped to React props (`onCellClick`, `onSort`)
- `@tablecraft/vue` — Vue 3 SFC wrapper using native custom element support
- tsup builds for React and Vue; Playwright smoke tests (100 rows, both wrappers)
- Vite + `vite-plugin-dts` build for core (ESM + CJS + UMD)

**Pitfalls resolved:** 14, 15, 16, 17

**Research flag:** Needs phase-specific research on `@lit/react` React 19 compatibility (was new at training cutoff) and Vue 3's `compilerOptions.isCustomElement` current behavior.

---

### Phase 6 — Column Operations + Advanced Features

**Rationale:** Column resizing, reordering, pinning, and row grouping are differentiators that make the library competitive with AG Grid for medium-complexity use cases. These are v2 targets per FEATURES.md.

**Delivers:**

- Column resizing (drag handle, resize observer)
- Column reordering (drag-and-drop via native drag events, not a DnD library)
- Column pinning (left/right)
- Sticky header
- Row grouping with auto-detect (group by columns with enum/status type)
- Aggregate footer row (sum, avg, count for numeric columns)
- Column state persistence to localStorage (opt-in)
- Configurable density (compact/comfortable/spacious)

**Pitfalls to watch:** API accretion (Pitfall 5) — every prop addition must pass the design document gate.

**Research flag:** Needs phase-specific research on drag-to-reorder implementation patterns in Svelte 5 (Svelte's drag API changed between versions).

---

### Phase 7 — Docs Site + Playground + Release

**Rationale:** Documentation is a feature. The live playground (paste your data, see inference) is the primary conversion mechanism for the zero-config thesis.

**Delivers:**

- SvelteKit docs site in `apps/docs/`
- Live REPL playground: paste JSON data, see inferred column types + rendered table
- Per-renderer documentation with real-world data examples (not just happy-path demos)
- Migration guide from v1 (`colname`/`rowdata` → v2 API)
- README covering top 5 questions before users file issues
- Final v1 `svelte-tables-tailwind` patch with deprecation notice → `@tablecraft/svelte`
- npm `@tablecraft` scope registration
- `@changesets/cli` publish workflow

**Pitfalls resolved:** 20

**Research flag:** Standard patterns.

---

## Open Questions

These are unresolved decisions that need phase-specific research before implementation.

| Question                                                             | Phase   | Why Unresolved                                                                    |
| -------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------- |
| `@lit/react` + React 19 compatibility                                | Phase 5 | React 19 was new at training cutoff; `@lit/react` compatibility unclear           |
| `@tanstack/virtual` Web Components integration                       | Phase 4 | Less documented for non-framework contexts than React/Vue                         |
| Svelte 5 rune reactivity performance with 100k row datasets          | Phase 3 | Svelte 5 runes fine-grained reactivity at large scale needs empirical testing     |
| `@tablecraft` npm scope availability                                 | Phase 1 | Must be checked before any publish work                                           |
| Tailwind v4 `theme()` function API stability                         | Phase 3 | Tailwind v4 was newly released at training cutoff                                 |
| Vue 3 `compilerOptions.isCustomElement` behavior with typed wrappers | Phase 5 | Less tested than React Web Components integration                                 |
| DOMPurify inclusion strategy for `html` renderer                     | Phase 2 | Bundle size tradeoff: inline vs peer dependency                                   |
| Worker thread sort API for Svelte 5 SSR environments                 | Phase 4 | Web Workers have SSR guards; interaction with Svelte's adapter needs verification |

---

## Confidence Assessment

| Area                     | Confidence                                                               | Notes                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Stack choices            | HIGH                                                                     | Tools (Lit, pnpm, Vite, tsup, Vitest, Playwright) are stable and dominant since mid-2024                |
| Feature classification   | HIGH                                                                     | Based on extensive analysis of 12+ competing libraries                                                  |
| Architecture patterns    | MEDIUM-HIGH                                                              | TanStack and AG Grid patterns are well-documented; Web Components light DOM specifics need verification |
| Type inference algorithm | HIGH                                                                     | Pattern-matching heuristics are well-understood; edge cases with dirty data need empirical testing      |
| Pitfall identification   | HIGH for API/migration pitfalls; MEDIUM for SSR/Web Components specifics | SSR and React 19 compatibility need live verification                                                   |
| Exact version numbers    | MEDIUM                                                                   | Verify at installation time — patch versions change frequently                                          |
| Tailwind v4 integration  | MEDIUM                                                                   | v4 was newly released at training cutoff                                                                |
| React 19 + `@lit/react`  | MEDIUM                                                                   | React 19 was new at training cutoff                                                                     |

---

## Sources

**STACK.md:** Svelte docs, Lit docs, pnpm docs, TanStack Virtual docs, tsup docs, Tailwind v4 release, Vitest docs, Playwright docs, `@changesets/cli` docs (all training data, August 2025 cutoff)

**FEATURES.md:** AG Grid, TanStack Table, Handsontable, Tabulator, DataTables, Grid.js, vue-good-table, Glide Data Grid, shadcn/ui, svelte-headless-table documentation and source (all training data)

**ARCHITECTURE.md:** TanStack Table v8 architecture docs, AG Grid architecture docs, Shoelace/Web Awesome component library, Adobe Spectrum Web Components, Glide Data Grid README (all training data)

**PITFALLS.md:** Project codebase audit (v1 `Tables.svelte` and `CONCERNS.md`), TanStack Table migration guides, Svelte 5 runes documentation, Web Components specification, Custom Elements v1 spec (training data + project file analysis)
