# Requirements: svelte-tables-tailwind v2.0.0

**Defined:** 2026-03-20
**Core Value:** Zero-config data display with smart type inference — `<Table data={rows} />` just works, and when you need more, one prop does it.

---

## v1 Existing (Validated)

What v1.0.6 ships today. These are the baselines, not goals.

- ✓ 14 column renderer types (string, number, input, date, time, mail, phone, dropdown, checkbox, list, image, html, code, tag/url) — v1.0.6
- ✓ `colname` + `rowdata` prop-based API — v1.0.6 (deprecated in v2, shim retained)
- ✓ Click callback on table cells — v1.0.6
- ✓ URL navigation prop — v1.0.6
- ✓ UMD + ESM dual build output — v1.0.6

---

## v1 Requirements (v2.0.0 scope — building toward these)

### FOUNDATION (Phase 1)

- [x] **FOUND-01**: Project restructures as pnpm monorepo with `packages/core`, `packages/svelte`, `packages/react`, `packages/vue` skeleton packages
- [x] **FOUND-02**: Build pipeline migrated from Rollup 2 to Vite 5 + `@sveltejs/package` for the Svelte package
- [x] **FOUND-03**: TypeScript 5 configured across all packages with strict mode and correct `exports` map
- [x] **FOUND-04**: Svelte upgraded from 3.37 to 5.x with runes-based reactivity (`$props`, `$state`, `$derived`, `$effect`)
- [x] **FOUND-05**: All npm dependencies upgraded to latest stable versions safely
- [x] **FOUND-06**: License reconciled to MIT across `package.json` and `LICENSE` file
- [x] **FOUND-07**: XSS vulnerability eliminated — all cell rendering uses typed Svelte components instead of `{@html}` string concatenation
- [x] **FOUND-08**: Tailwind CDN injection removed from component — replaced with CSS custom property design tokens (`--tc-*`)
- [x] **FOUND-09**: Runtime type-switcher dropdown removed from column headers
- [x] **FOUND-10**: Node 20 LTS minimum declared in `engines` field; `@changesets/cli` configured for versioned releases
- [x] **FOUND-11**: Vitest 2.x + Playwright 1.x testing infrastructure configured across the monorepo
- [x] **FOUND-12**: ESLint + Prettier configured with Svelte 5 plugin

### CORE ENGINE (Phase 2)

- [ ] **CORE-01**: Pure-JS `createTableEngine(config)` factory implemented as framework-agnostic core with event emitter interface
- [x] **CORE-02**: Type inference engine samples 200 rows per column, runs 14+ typed detectors in priority order, returns highest-confidence type above threshold
- [x] **CORE-03**: Type detectors implemented: boolean, currency, percentage, number/integer, date, datetime, time, email, phone, image-url, url, status/enum, code, text (fallback)
- [x] **CORE-04**: Field-name keyword heuristics boost type inference confidence (e.g. `avatar`, `email`, `phone`, `status`, `price`, `date` column names)
- [x] **CORE-05**: Type inference runs in `requestIdleCallback` — table renders immediately with text fallback, updates once inference completes
- [x] **CORE-06**: Renderer plugin registry with `registerRenderer(name, rendererFn)` API — built-in renderers use the same API as external plugins
- [ ] **CORE-07**: Tier 1 cell renderers implemented as individually importable tree-shakable modules: `text`, `number`, `integer`, `currency`, `percentage`, `boolean`, `date`, `datetime`, `time`, `email`, `url`, `phone`, `image`, `badge`, `status`, `code`, `html` (with explicit opt-in sanitization)
- [ ] **CORE-08**: State graph separated into isolated reactive stores: `columns`, `sortState`, `filterState`, `visibleRows` — sort/filter changes never trigger cell renderer re-renders
- [x] **CORE-09**: CSS custom property design token system defined (`--tc-color-*`, `--tc-spacing-*`, `--tc-border-*`, `--tc-font-*`) with light and dark mode defaults
- [ ] **CORE-10**: v1 `colname`/`rowdata` compatibility shim implemented with deprecation warnings in console
- [ ] **CORE-11**: `defineColumns<TRow>()` TypeScript helper provides full type safety for column definitions
- [ ] **CORE-12**: Unit test coverage > 95% on inference engine, > 90% on all renderers via Vitest

### SVELTE COMPONENT (Phase 3)

- [ ] **SVLT-01**: `@tablecraft/svelte` package ships `<Table data={rows} />` zero-config API — column headers auto-derived from data keys, types auto-inferred
- [ ] **SVLT-02**: One-prop type override API: `columns={{ avatar: 'image', price: 'currency' }}` (short form) and full column descriptor objects (long form)
- [ ] **SVLT-03**: Column sorting — click header to sort ascending/descending/off, visual sort indicator
- [ ] **SVLT-04**: Global search filter — single text input searches all columns
- [ ] **SVLT-05**: Per-column filtering — filter inputs per column with type-appropriate controls (text, date range, number range, enum select)
- [ ] **SVLT-06**: Pagination — configurable page size, first/prev/next/last controls, total count display
- [ ] **SVLT-07**: Empty state — configurable message and slot when `data` is empty
- [ ] **SVLT-08**: Loading state — skeleton animation when `loading` prop is true
- [ ] **SVLT-09**: Row selection — `selectable` prop enables checkbox column; `selectedRows` bindable store; `select-all` header checkbox
- [ ] **SVLT-10**: Responsive display — horizontal scroll on narrow viewports; column hiding configurable per breakpoint
- [ ] **SVLT-11**: Keyboard navigation — arrow keys between cells, Tab moves focus, Enter/Space activates cell actions
- [ ] **SVLT-12**: WCAG 2.1 AA accessibility — ARIA `grid` role, `rowheader`/`columnheader`/`gridcell` roles, `aria-sort`, `aria-selected`, `aria-busy` for loading
- [ ] **SVLT-13**: Row click event (`on:rowclick`) and cell click event (`on:cellclick`) with row data payload
- [ ] **SVLT-14**: `@sveltejs/package` build produces correct `exports` map with Svelte, ESM, and types entries verified
- [ ] **SVLT-15**: v1 backward compatibility verified — existing `colname`/`rowdata` consumers get deprecation warnings, not errors

### PERFORMANCE (Phase 4)

- [ ] **PERF-01**: `@tanstack/virtual` row virtualization integrated — only ~30 DOM rows rendered regardless of dataset size
- [ ] **PERF-02**: Fixed row height (48px default, configurable via `--tc-row-height` CSS variable) enables O(1) scroll position calculation
- [ ] **PERF-03**: CSS containment applied — `contain: layout style` on rows, `contain: layout style paint` on cells
- [ ] **PERF-04**: Single delegated event listener on container element using `data-row`/`data-col` attributes — no per-cell listeners
- [ ] **PERF-05**: Playwright E2E benchmark passes: 100k rows renders < 200ms initial paint, scrolls at 60fps on mid-range hardware
- [ ] **PERF-06**: Column virtualization activates automatically when column count > 20 — reduces layout thrash for wide tables
- [ ] **PERF-07**: Sort operation for 100k rows completes in Web Worker in < 50ms, does not block main thread

### WEB COMPONENTS + FRAMEWORK WRAPPERS (Phase 5)

- [ ] **WC-01**: `@tablecraft/core` ships `<tc-table>` Lit 3 Custom Element in Light DOM mode (`createRenderRoot() { return this; }`)
- [ ] **WC-02**: Web Component properties API for complex data: `element.data = rows`, `element.columns = [...]`
- [ ] **WC-03**: Web Component attributes API for scalars: `row-height`, `sort-by`, `bordered`, `striped`, `loading`
- [ ] **WC-04**: CustomEvents dispatched with `bubbles: true, composed: true`: `tc-cell-click`, `tc-row-click`, `tc-sort-change`, `tc-filter-change`
- [ ] **WC-05**: SSR guards on all browser-only APIs (`customElements.define`, `ResizeObserver`, `window.scrollY`)
- [ ] **WC-06**: SvelteKit SSR integration test passes in CI
- [ ] **WC-07**: `@tablecraft/react` wraps `<tc-table>` via `@lit/react` — all CustomEvents forwarded as React props (`onCellClick`, `onSort`, etc.)
- [ ] **WC-08**: `@tablecraft/vue` wraps `<tc-table>` as Vue 3 SFC with native custom element support — all events forwarded via `v-on`
- [ ] **WC-09**: Vite 5 + `vite-plugin-dts` builds `@tablecraft/core` to ESM + CJS + UMD
- [ ] **WC-10**: Playwright smoke tests pass for React and Vue wrappers rendering 100 rows correctly

### COLUMN OPERATIONS + ADVANCED FEATURES (Phase 6)

- [ ] **ADV-01**: Column resizing — drag handle on column divider; `minWidth` and `maxWidth` constrainable; ResizeObserver updates layout
- [ ] **ADV-02**: Column reordering — drag-and-drop column headers using native HTML drag events (no DnD library dependency)
- [ ] **ADV-03**: Column pinning — `pinned: 'left' | 'right'` on column definition; pinned columns stay fixed during horizontal scroll
- [ ] **ADV-04**: Sticky header — column headers fixed at top during vertical scroll (always on when virtualisation is active)
- [ ] **ADV-05**: Column visibility toggle — `hideable` prop enables column show/hide UI; hidden columns excluded from rendering
- [ ] **ADV-06**: Row grouping — auto-detect groupable columns (status/enum types); grouped rows with expand/collapse
- [ ] **ADV-07**: Aggregate footer row — sum, avg, count, min, max for numeric columns; configurable per column
- [ ] **ADV-08**: Column state persistence — opt-in `persistKey` prop saves sort, filter, column widths, visibility to localStorage
- [ ] **ADV-09**: Density control — `density: 'compact' | 'comfortable' | 'spacious'` prop adjusts row height and padding

### DOCS SITE + RELEASE (Phase 7)

- [ ] **DOCS-01**: SvelteKit docs site in `apps/docs/` deployed publicly with search
- [ ] **DOCS-02**: Live REPL playground — paste any JSON array, see inferred column types highlighted, see rendered table live
- [ ] **DOCS-03**: Per-renderer documentation with real-world data examples (not toy demos)
- [ ] **DOCS-04**: Migration guide from v1 (`colname`/`rowdata` → v2 API) with before/after examples
- [ ] **DOCS-05**: npm `@tablecraft` scope registered, all packages published with correct semver
- [ ] **DOCS-06**: `@changesets/cli` publish workflow automated (bumps versions, generates changelog, publishes to npm)
- [ ] **DOCS-07**: v1 `svelte-tables-tailwind` patch published with deprecation notice pointing to `@tablecraft/svelte`
- [ ] **DOCS-08**: README covering the top 5 questions that would otherwise become GitHub issues

---

## v2 Requirements (deferred — post v2.0 scope)

### Tier 2 Renderers

- **REND2-01**: `avatar-with-name` — image + text in the same cell (combined renderer)
- **REND2-02**: `progress` — bar showing 0-100% from numeric data
- **REND2-03**: `relative-time` — "3 days ago" auto-formatting from date values
- **REND2-04**: `sparkline` — mini chart from array of numbers in a single cell
- **REND2-05**: `actions` — slot-based action buttons per row (edit, delete, view)

### Advanced Data Operations

- **DATA-01**: CSV export (no external dependency — native Blob/URL)
- **DATA-02**: Inline editing with two-way binding — `editable` per column, `on:change` event
- **DATA-03**: Sub-row / expandable rows — parent row expands to reveal nested data
- **DATA-04**: Server-side data via `onFetch(params)` callback hook for external pagination/sort/filter

### Extended Framework Support

- **FW-01**: Solid.js wrapper package (`@tablecraft/solid`)
- **FW-02**: Angular wrapper package (`@tablecraft/angular`)
- **FW-03**: CDN-first vanilla JS UMD example with no bundler required

---

## Out of Scope

| Feature                                 | Reason                                                         |
| --------------------------------------- | -------------------------------------------------------------- |
| Formula engine (Excel-like)             | Handsontable-tier complexity; out of category for this library |
| Server-side data model in v2 core       | Client-side only for v2; `onFetch` hook in v3                  |
| XLSX export (SheetJS)                   | SheetJS licensing risk (AGPL); ship CSV only                   |
| Right-click context menus               | Conflicts with browser defaults; fire events, let app handle   |
| Real-time collaboration                 | Different product category entirely                            |
| Mobile-native (iOS/Android)             | Web-first for v2                                               |
| Backend/ORM integrations                | Library stays UI-layer only                                    |
| Shadow DOM for Web Components           | Fundamentally incompatible with Tailwind host integration      |
| Dynamic row heights in virtual scroller | Prefix-sum + ResizeObserver complexity; defer to v3            |
| Built-in charting                       | Out of scope — use a chart library                             |

---

## Traceability

| Requirement | Phase   | Status   |
| ----------- | ------- | -------- |
| FOUND-01    | Phase 1 | Complete |
| FOUND-02    | Phase 1 | Complete |
| FOUND-03    | Phase 1 | Complete |
| FOUND-04    | Phase 1 | Complete |
| FOUND-05    | Phase 1 | Complete |
| FOUND-06    | Phase 1 | Complete |
| FOUND-07    | Phase 1 | Complete |
| FOUND-08    | Phase 1 | Complete |
| FOUND-09    | Phase 1 | Complete |
| FOUND-10    | Phase 1 | Complete |
| FOUND-11    | Phase 1 | Complete |
| FOUND-12    | Phase 1 | Complete |
| CORE-01     | Phase 2 | Pending  |
| CORE-02     | Phase 2 | Complete |
| CORE-03     | Phase 2 | Complete |
| CORE-04     | Phase 2 | Complete |
| CORE-05     | Phase 2 | Complete |
| CORE-06     | Phase 2 | Complete |
| CORE-07     | Phase 2 | Pending  |
| CORE-08     | Phase 2 | Pending  |
| CORE-09     | Phase 2 | Complete |
| CORE-10     | Phase 2 | Pending  |
| CORE-11     | Phase 2 | Pending  |
| CORE-12     | Phase 2 | Pending  |
| SVLT-01     | Phase 3 | Pending  |
| SVLT-02     | Phase 3 | Pending  |
| SVLT-03     | Phase 3 | Pending  |
| SVLT-04     | Phase 3 | Pending  |
| SVLT-05     | Phase 3 | Pending  |
| SVLT-06     | Phase 3 | Pending  |
| SVLT-07     | Phase 3 | Pending  |
| SVLT-08     | Phase 3 | Pending  |
| SVLT-09     | Phase 3 | Pending  |
| SVLT-10     | Phase 3 | Pending  |
| SVLT-11     | Phase 3 | Pending  |
| SVLT-12     | Phase 3 | Pending  |
| SVLT-13     | Phase 3 | Pending  |
| SVLT-14     | Phase 3 | Pending  |
| SVLT-15     | Phase 3 | Pending  |
| PERF-01     | Phase 4 | Pending  |
| PERF-02     | Phase 4 | Pending  |
| PERF-03     | Phase 4 | Pending  |
| PERF-04     | Phase 4 | Pending  |
| PERF-05     | Phase 4 | Pending  |
| PERF-06     | Phase 4 | Pending  |
| PERF-07     | Phase 4 | Pending  |
| WC-01       | Phase 5 | Pending  |
| WC-02       | Phase 5 | Pending  |
| WC-03       | Phase 5 | Pending  |
| WC-04       | Phase 5 | Pending  |
| WC-05       | Phase 5 | Pending  |
| WC-06       | Phase 5 | Pending  |
| WC-07       | Phase 5 | Pending  |
| WC-08       | Phase 5 | Pending  |
| WC-09       | Phase 5 | Pending  |
| WC-10       | Phase 5 | Pending  |
| ADV-01      | Phase 6 | Pending  |
| ADV-02      | Phase 6 | Pending  |
| ADV-03      | Phase 6 | Pending  |
| ADV-04      | Phase 6 | Pending  |
| ADV-05      | Phase 6 | Pending  |
| ADV-06      | Phase 6 | Pending  |
| ADV-07      | Phase 6 | Pending  |
| ADV-08      | Phase 6 | Pending  |
| ADV-09      | Phase 6 | Pending  |
| DOCS-01     | Phase 7 | Pending  |
| DOCS-02     | Phase 7 | Pending  |
| DOCS-03     | Phase 7 | Pending  |
| DOCS-04     | Phase 7 | Pending  |
| DOCS-05     | Phase 7 | Pending  |
| DOCS-06     | Phase 7 | Pending  |
| DOCS-07     | Phase 7 | Pending  |
| DOCS-08     | Phase 7 | Pending  |

**Coverage:**

- v1 requirements: 64 total
- Mapped to phases: 64
- Unmapped: 0

---

_Requirements defined: 2026-03-20_
_Last updated: 2026-03-20 — traceability expanded to individual requirement rows after roadmap creation_
