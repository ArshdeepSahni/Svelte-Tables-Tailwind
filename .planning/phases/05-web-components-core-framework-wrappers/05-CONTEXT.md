# Phase 5: Web Components Core + Framework Wrappers - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning
**Mode:** Auto (all decisions selected by Claude with recommended defaults)

<domain>
## Phase Boundary

Build the `<tc-table>` Lit 3 Custom Element in Light DOM mode (the framework-agnostic core), the `@tablecraft/react` wrapper via `@lit/react`, and the `@tablecraft/vue` wrapper via native Vue 3 SFC support. After this phase, React and Vue developers can use `<Table data={rows} />` with identical zero-config experience to Svelte users — without any Svelte dependency in their project.

**Fixed scope:** WC-01 through WC-10

</domain>

<decisions>
## Implementation Decisions

### Web Component Architecture

- **Element name:** `<tc-table>` — registered via `customElements.define('tc-table', TcTable)`
- **Base class:** Lit 3 `LitElement` — for property/attribute reflection, reactive updates, and efficient DOM patching. `~6KB` gzip overhead, Google-maintained.
- **Light DOM mode (non-negotiable):** Override `createRenderRoot()` to return `this` (the element itself, not a shadow root). This lets Tailwind classes and host application CSS cascade into the component. Shadow DOM is architecturally excluded — irreversible decision made in Phase 1.
- **Render strategy:** The Web Component does NOT re-implement the table rendering. It wraps the `@tablecraft/core` engine directly. It maintains its own reactive state (sort, filter, page) and calls `resolveColumns()`, `processRows()`, `inferSchema()` from the core engine. It renders the table HTML via `lit-html` templates using the same CellDescriptor → markup mapping as `Cell.svelte`.
- **No Svelte dependency:** `@tablecraft/core` (the package) must be the ONLY `@tablecraft/*` dependency. Svelte is NOT a dependency or peer dependency of `@tablecraft/core`.

### Properties vs Attributes API

**Properties (complex data — set via JS):**
- `element.data: Row[]` — `@property({ type: Array })` — the primary data source
- `element.columns: ColumnOverrideShort | ColumnDefinition[]` — column config
- `element.selectedRows: Row[]` — bindable selection state

**Attributes (scalars — declarative HTML):**
- `row-height="64"` → `rowHeight: number` — `@property({ type: Number, attribute: 'row-height' })`
- `sort-by="name"` → `sortBy: string` — `@property({ type: String, attribute: 'sort-by' })`
- `sort-dir="asc"` → `sortDir: string` — `@property({ type: String, attribute: 'sort-dir' })`
- `bordered` → `bordered: boolean` — `@property({ type: Boolean })`
- `striped` → `striped: boolean` — `@property({ type: Boolean })`
- `loading` → `loading: boolean` — `@property({ type: Boolean })`
- `page-size="50"` → `pageSize: number` — `@property({ type: Number, attribute: 'page-size' })`
- `filterable` → `filterable: boolean` — `@property({ type: Boolean })`
- `selectable` → `selectable: boolean` — `@property({ type: Boolean })`
- `caption="My Table"` → `caption: string` — `@property({ type: String })`

**React attribute limitation workaround:** React pre-19 passes JSX props as HTML attributes (strings), which breaks complex data (`element.data` must be a JS object, not a string). The `@lit/react` wrapper handles this by assigning `element.data = value` as a DOM property via the `properties` option of `createComponent()`.

### CustomEvents

All events dispatched with `bubbles: true, composed: true` (so they pierce any shadow DOM boundaries if the element is used inside another shadow DOM):

| Event name | Detail payload | When |
|------------|---------------|------|
| `tc-cell-click` | `{ row: Row, column: ResolvedColumn, value: unknown, rowIndex: number }` | Cell clicked |
| `tc-row-click` | `{ row: Row, rowIndex: number }` | Row clicked |
| `tc-sort-change` | `{ key: string, dir: 'asc' \| 'desc' \| null }` | Sort state changes |
| `tc-filter-change` | `{ query: string }` | Filter query changes |
| `tc-select-change` | `{ rows: Row[], allSelected: boolean }` | Selection changes |

### SSR Guards

All browser-only APIs are guarded:

```ts
// customElements.define — guard with typeof check
if (typeof customElements !== 'undefined') {
  customElements.define('tc-table', TcTable);
}

// ResizeObserver — guard inside Lit's connectedCallback
connectedCallback() {
  super.connectedCallback();
  if (typeof ResizeObserver !== 'undefined') {
    this._resizeObserver = new ResizeObserver(...);
  }
}

// window.scrollY — guard inline
const scrollTop = typeof window !== 'undefined' ? window.scrollY : 0;
```

SvelteKit SSR test: a SvelteKit project importing `@tablecraft/core` in `+page.server.ts` must not throw `window is not defined` or `customElements is not defined`.

### React Wrapper (@tablecraft/react)

- **Adapter:** `@lit/react` 1.x — the official Google-maintained adapter
- **Import pattern:** `import { createComponent } from '@lit/react'`
- **Usage:**
  ```tsx
  import { Table } from '@tablecraft/react';
  <Table data={rows} onCellClick={handler} onSortChange={handler} />
  ```
- **Event mapping:** `@lit/react` `createComponent()` accepts an `events` option that maps CustomEvent names to React prop names:
  ```ts
  events: {
    onCellClick: 'tc-cell-click',
    onRowClick: 'tc-row-click',
    onSortChange: 'tc-sort-change',
    onFilterChange: 'tc-filter-change',
    onSelectChange: 'tc-select-change',
  }
  ```
- **Properties:** `@lit/react` automatically handles the property/attribute distinction for Lit components — complex values are set as DOM properties.
- **TypeScript:** Full TypeScript types for all props via `createComponent`'s generic parameter.
- **Peer dependencies:** `react >= 18`, `react-dom >= 18`

### Vue Wrapper (@tablecraft/vue)

- **Approach:** Native Vue 3 SFC wrapper (not a third-party adapter)
- **SFC structure:** A `.vue` file that uses `ref`, `onMounted`, `watch` to manage the Custom Element imperatively
- **Usage:**
  ```vue
  <template>
    <TcTable :data="rows" @tc-cell-click="handler" />
  </template>
  ```
- **Vue custom element support:** Vue 3 supports Custom Elements natively. Add to `vite.config.ts` in the Vue consumer project: `compilerOptions: { isCustomElement: (tag) => tag.startsWith('tc-') }`. The Vue wrapper handles this internally for library consumers.
- **Event forwarding:** Vue SFC listens to `tc-*` CustomEvents via `onMounted` + native `addEventListener` and re-emits as Vue events, OR uses Vue's native custom element support via `@tc-cell-click` syntax.
- **Data prop:** Vue's template system passes `:data="rows"` as a DOM property (not attribute) for objects — this works correctly for Custom Elements in Vue 3.
- **Peer dependencies:** `vue >= 3.3`

### Build Configuration

- **`@tablecraft/core` (Web Component):**
  - Build tool: Vite 8 library mode (existing `vite.config.ts` — add `formats: ['es', 'cjs', 'umd']`)
  - Entry: `src/index.ts` (existing) + new `src/element.ts` (exports only the LitElement class + registration)
  - UMD name: `TcTable` (for CDN usage: `<script src="...umd.js"></script>`)
  - External: `lit` (consumers install it) — OR bundle Lit 3 (~6KB) for the UMD build to be self-contained
  - Decision: **Bundle Lit into the UMD build** (consumers using CDN don't want to manage Lit separately); **external for ESM/CJS** (bundler-using consumers tree-shake it)

- **`@tablecraft/react`:** tsup 8.x (existing config) — add `lit` and `@lit/react` as external
- **`@tablecraft/vue`:** tsup 8.x (existing config)

### Playwright Smoke Tests

Two Playwright tests confirm the wrappers work end-to-end:

1. **React smoke test:** `e2e/react-smoke.spec.ts` — loads a minimal React 19 app in a Playwright page, renders `<Table data={rows} />`, confirms headers and cells visible.
2. **Vue smoke test:** `e2e/vue-smoke.spec.ts` — loads a minimal Vue 3 app in a Playwright page, renders `<TcTable :data="rows" />`, confirms table visible.
3. **Vanilla JS test:** `e2e/vanilla-smoke.spec.ts` — loads a plain HTML file, sets `document.querySelector('tc-table').data = rows`, confirms table renders (verifies the Web Component property API works independently of any framework).

### SvelteKit SSR Integration Test

- A minimal SvelteKit project in `e2e/fixtures/sveltekit-ssr/` that imports `@tablecraft/core` in a `+page.server.ts` load function.
- Playwright test starts the SvelteKit preview server and confirms the page loads without `window is not defined` errors.

### Claude's Discretion

- Whether to bundle the LitElement's `html` and `css` tagged template literals inline or import from Lit
- Exact Lit property decorator syntax (`@property` vs `static properties = {}`)
- Whether to support a `theme` attribute for switching CSS token presets
- Exact UMD bundle name casing (`TcTable` vs `tablecraft.Table`)
- Internal reactive state management in the Lit element (propertyChangedCallback vs willUpdate)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Stubs (being replaced)
- `packages/react/src/index.ts` — current stub; Phase 5 replaces with real `@lit/react` wrapper
- `packages/vue/src/index.ts` — current stub; Phase 5 replaces with Vue 3 SFC wrapper
- `packages/core/src/index.ts` — public API; Phase 5 adds `element.ts` export for the Custom Element
- `packages/core/vite.config.ts` — build config; Phase 5 updates for UMD output + element entry

### Core Engine (consumed by the Web Component)
- `packages/core/src/engine/index.ts` — `createTableEngine()`, `resolveColumns()`, `processRows()`
- `packages/core/src/types.ts` — `Row`, `ResolvedColumn`, `ProcessedRow`, `CellDescriptor` — ALL used by the Lit element
- `packages/core/src/tokens.ts` — `DEFAULT_TOKENS` — CSS custom properties applied in the element's connected callback

### Phase 1 Context (architecture decisions, all carry-forward)
- `.planning/phases/01-foundation/01-CONTEXT.md` — package naming, monorepo structure
- `.planning/research/PITFALLS.md` — Shadow DOM conflict with Tailwind (pitfall 15); Custom Element attribute/property reflection (pitfall 14); React CustomEvent handling (pitfall 17); SSR incompatibility (pitfall 16)
- `.planning/research/SUMMARY.md` — Phase 5 recommended architecture and open questions

### Planning
- `.planning/PROJECT.md` — constraints (< 50KB gzipped, framework-agnostic)
- `.planning/REQUIREMENTS.md` — WC-01 through WC-10 scope
- `.planning/ROADMAP.md` — Phase 5 goal and 5 success criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/core/src/engine/index.ts` — `createTableEngine()` is the integration point; the Lit element calls this in `connectedCallback` or on `data` property change
- `packages/core/src/renderers/` — all 17 renderers return `CellDescriptor` objects; the Lit element must render these to `lit-html` templates (same logic as `Cell.svelte` but in `html` tagged template syntax)
- `packages/core/src/tokens.ts` — `DEFAULT_TOKENS` — inject into the element's root via `element.style.setProperty('--tc-*', value)` for each token
- `packages/svelte/src/lib/Cell.svelte` — reference for `CellDescriptor → safe markup` mapping; must replicate this in the Lit element's `renderCell()` method

### Established Patterns
- **No Shadow DOM** — `createRenderRoot() { return this; }` — this is the most critical pattern. Must be in every code review.
- **TypeScript strict mode** — all `.ts` files use strict; Lit decorators require `experimentalDecorators: true` in tsconfig
- **ESM-first** — `.js` extension in all imports (NodeNext resolution)
- **CSS custom properties** — `var(--tc-*)` everywhere; no hardcoded colors

### Integration Points
- `packages/core/package.json` — add `@lit/core` + `lit` to dependencies; add UMD entry
- `packages/react/package.json` — add `@lit/react` to dependencies; add `react` + `react-dom` to peerDependencies
- `packages/vue/package.json` — add `vue` to peerDependencies
- `playwright.config.ts` — already has `webServer` for the bench page; add smoke test fixtures

</code_context>

<specifics>
## Specific Ideas

- The Lit element's `renderCell(descriptor: CellDescriptor)` method mirrors `Cell.svelte` exactly — same CellDescriptor kind dispatch, same CSS class names (`.tc-badge`, `.tc-status`, etc.) — so the Web Component and the Svelte component look identical out of the box
- The UMD build enables CDN usage: `<script src="https://cdn.jsdelivr.net/npm/@tablecraft/core/dist/index.umd.js"></script>` then `<tc-table></tc-table>` in plain HTML
- The React smoke test should use a real React 19 app (not a mocked environment) to validate the `@lit/react` integration under actual React reconciler behavior

</specifics>

<deferred>
## Deferred Ideas

- `@tablecraft/solid` wrapper — Phase 10 ecosystem
- `@tablecraft/angular` wrapper — Phase 10 ecosystem
- Declarative Shadow DOM (for SSR streaming) — future research
- `@lit/ssr` integration — future consideration
- Angular Elements — out of scope for v2

</deferred>

---

*Phase: 05-web-components-core-framework-wrappers*
*Context gathered: 2026-03-22*
