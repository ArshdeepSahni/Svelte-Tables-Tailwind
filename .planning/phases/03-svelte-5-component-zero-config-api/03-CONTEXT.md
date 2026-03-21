# Phase 3: Svelte 5 Component + Zero-Config API - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning
**Mode:** Auto (all decisions selected by Claude with recommended defaults)

<domain>
## Phase Boundary

Wire the Phase 2 core engine into a production-grade Svelte 5 component that delivers the `<Table data={rows} />` zero-config API. This is the primary v2.0 delivery package. Delivers: zero-config rendering, one-prop type overrides, column sorting, global+per-column filtering, pagination, empty/loading states, row selection, WCAG 2.1 AA accessibility, keyboard navigation, responsive layout, CSS custom property theming, and v1 backward compatibility.

**Fixed scope:** SVLT-01 through SVLT-15

</domain>

<decisions>
## Implementation Decisions

### Visual Design

- **Style philosophy:** Clean, minimal, professional. No Tailwind dependency on the library itself — consumers can add their own Tailwind. The table uses only CSS custom properties (`--tc-*`) defined in `@tablecraft/core/tokens`.
- **Table layout:** Semantic `<table>` element (NOT flexbox/grid) for Phase 3 — ARIA grid roles map onto `<table>` semantics naturally. Phase 4 switches to non-semantic elements + CSS containment for virtual scrolling.
- **Header:** Sticky header (`position: sticky; top: 0`) inside a scrolling container. Always visible.
- **Rows:** Alternating row background via `:nth-child(even)` using `--tc-color-bg-alt` token. Hover highlight via `--tc-color-bg-hover`.
- **Borders:** Horizontal dividers only by default (`border-bottom` on rows). Optional `bordered` prop adds full cell borders.
- **Responsive:** Table wrapped in `overflow-x: auto` container. No column hiding by default (Phase 6 adds column visibility toggle).
- **Density:** No density prop in Phase 3 — fixed 48px row height via `--tc-row-height`. Density control is Phase 6.
- **Striped:** `striped` prop (boolean, default false) — when true, applies alternating row background.

### Cell Renderer → Svelte Markup Mapping

Each `CellDescriptor` kind maps to specific safe Svelte markup — NEVER `{@html}` on user data:

| CellDescriptor kind | Svelte output |
|---------------------|---------------|
| `text` | `<span>{value}</span>` |
| `number` | `<span class="tc-num">{formatted}</span>` (right-aligned via CSS) |
| `link` | `<a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>{label}</a>` |
| `image` | `<img src={src} alt={alt} class="tc-img" loading="lazy" />` |
| `badge` | `<span class="tc-badge tc-badge--{variant}">{label}</span>` |
| `status` | `<span class="tc-status tc-status--{variant}" role="status">{label}</span>` |
| `boolean` | `<span aria-label={value ? 'Yes' : 'No'}>{value ? '✓' : '✗'}</span>` |
| `code` | `<code class="tc-code">{value}</code>` (monospace, no {@html}) |
| `html` | `{@html sanitized}` — ONLY this CellDescriptor kind may use {@html}, the `sanitized` field has already been DOMPurify-sanitized in the renderer |
| `raw` | `<span>{String(value)}</span>` |

- Cell rendering uses a Svelte `{#if}` chain (not a dynamic component) — statically analyzable, no runtime component resolution overhead.
- All rendering happens in `<Table.svelte>` directly or via `<Cell.svelte>` sub-component — no dynamically registered Svelte components.

### Zero-Config API + Column Override

- **Zero-config invocation:** `<Table data={rows} />` — no other props required
- **Column inference timing:** `createTableEngine({ data })` called in `$effect()`. Inference runs via `scheduleIdleWork` — table renders immediately with derived `text` columns, then updates reactively when inference resolves.
- **Short-form override:** `<Table data={rows} columns={{ avatar: 'image', price: 'currency' }} />`
- **Long-form override:** `<Table data={rows} columns={[{ key: 'avatar', type: 'image', label: 'Profile Photo' }]} />`
- **Header label derivation:** Key name → title case with underscore→space conversion (e.g., `created_at` → `Created At`). Long-form `label` field overrides this.
- **Column order:** Matches insertion order of data object keys (zero-config) or array order (long-form).

### Sorting

- **Activation:** Click any column header to sort. Cycles: unsorted → ascending → descending → unsorted.
- **Visual indicator:** `▲` for ascending, `▼` for descending, no icon for unsorted. Indicator appears inline with header label.
- **ARIA:** `aria-sort="ascending"` / `aria-sort="descending"` / `aria-sort="none"` on `<th>` elements.
- **Sort behavior:** Client-side sort of the full dataset (not paginated slice). Alphabetic for text/badge/status, numeric for number/integer/currency/percentage, chronologic for date/datetime/time. Falls back to alphabetic for unknown types.
- **Sortable prop:** `sortable` boolean on individual `ColumnDefinition` (default: `true`). Set to `false` to disable sort for specific columns. No global `sortable` prop — sort is on by default.
- **Multi-column sort:** NOT in Phase 3. Single-column sort only. (Multi-column sort = Phase 6 advanced features).

### Filtering

- **Global search:** A single `<input type="search">` above the table. Filters all string-representable columns simultaneously. Case-insensitive substring match. Debounced 150ms to avoid keystroke lag.
- **Filter placement:** Above the table, right-aligned. Appears only when `filterable` prop is `true` (default: `true`). Hide via `filterable={false}`.
- **Per-column filters:** NOT in Phase 3 (SVLT-05 deferred to Phase 6 — the requirement exists but per-column filter UI is advanced). Phase 3 delivers global search only.
- **Empty result:** When filter matches nothing, show the empty state (same as no data).

### Pagination

- **Activation:** Appears automatically when `data.length > pageSize`. Hidden when data fits on one page.
- **Default page size:** 50 rows. Configurable via `pageSize` prop (number).
- **Controls:** `|<` First, `<` Prev, `>` Next, `>|` Last buttons. Current page and total pages displayed as text: "Page 2 of 14 (683 rows)".
- **Keyboard:** Tab to pagination controls, Enter/Space activates.
- **Pagination position:** Below table, right-aligned.
- **pageSize options:** No built-in page-size selector in Phase 3 — consumer can control via `pageSize` prop. (Selector = Phase 6).

### Loading State

- **Activation:** `loading` prop (boolean, default: `false`).
- **Visual:** CSS skeleton animation — shows placeholder rows (configurable count via `skeletonRows` prop, default 5) with animated shimmer gradient. Column headers render normally (from `columns` prop if provided, or placeholder "Column 1/2/3").
- **ARIA:** `aria-busy="true"` on the `<table>` element when loading. Screen reader hears "Loading data" from `aria-label` on the skeleton container.
- **No data + loading:** If `loading` is true, show skeleton regardless of whether `data` is empty.

### Empty State

- **Trigger:** `data.length === 0` AND `loading !== true`.
- **Default:** Centered message inside the table body: "No data" (customizable via `emptyMessage` prop).
- **Slot override:** `#empty` slot replaces the entire empty state: `<Table data={[]}><svelte:fragment slot="empty">Custom empty!</svelte:fragment></Table>`
- **Column headers:** Render normally even when empty (so users see what columns exist).

### Row Selection

- **Activation:** `selectable` prop (boolean, default: `false`).
- **UI:** Adds a checkbox column as the FIRST column (before all data columns). No header label for this column.
- **Select-all:** Checkbox in the header of the checkbox column. Three states: unchecked (none selected), checked (all selected), indeterminate (some selected). `indeterminate` set via DOM property in `$effect`.
- **Event:** `on:select` dispatches `CustomEvent<{ rows: Row[]; allSelected: boolean }>` on every selection change.
- **Bindable:** `bind:selectedRows` (bindable `$state` array of selected row objects).
- **Row click to select:** NOT in Phase 3. Checkbox-only selection. (Row-click selection = advanced feature).

### WCAG 2.1 AA Accessibility

- **Table role:** `<table>` with `role="grid"` (allows keyboard nav). `<caption>` element contains the `caption` prop value (if provided) or is visually hidden with accessible text.
- **Header cells:** `<th scope="col">` for all column headers. `role="columnheader"`. `aria-sort` attribute updated on sort state change.
- **Data cells:** `<td role="gridcell">`.
- **Keyboard navigation:**
  - Arrow keys move focus between cells (arrow key nav within the grid).
  - `Tab` moves focus to next interactive element (pagination, filter input).
  - `Enter`/`Space` activates clickable cells (links open, checkboxes toggle).
  - `Home`/`End` jump to first/last cell in current row.
- **Focus management:** Visible focus ring on all interactive elements. `focus-visible` CSS for keyboard-only focus ring (no ring on mouse click).
- **Screen reader:** Column count announced on focus (`aria-colcount`). Row count announced (`aria-rowcount`). Selected rows announced via `aria-selected`.
- **Color independence:** Badge/status variants use both color AND text label — information not conveyed by color alone.

### v1 Backward Compatibility

- Accept `colname` and `rowdata` props (in addition to `data`/`columns`).
- When `colname` or `rowdata` is detected, call `adaptV1Props(colname, rowdata)` from `@tablecraft/core` and use the result as `data`/`columns`.
- `console.warn('[tablecraft] colname/rowdata API is deprecated...')` — same message as the core shim.
- Priority: `data` prop takes precedence over `rowdata`. If both are provided, use `data`.
- Type: Both `colname` and `rowdata` props are typed as `unknown` in the Svelte component to avoid TypeScript errors for v1 consumers.

### Component File Structure

```
packages/svelte/src/lib/
├── Table.svelte          — Main component (REWRITE the Phase 1 stub)
├── Cell.svelte           — Cell renderer dispatcher (CellDescriptor → markup)
├── TableHeader.svelte    — <thead> with sort indicators, aria-sort
├── TableBody.svelte      — <tbody> with rows, empty state, loading skeleton
├── TableFooter.svelte    — Pagination controls
├── Checkbox.svelte       — Selection checkbox with indeterminate state
├── SearchInput.svelte    — Global filter search input (debounced)
├── types.ts              — Component-specific types (not in core)
└── index.ts              — Re-export all public symbols
```

- All sub-components are internal (`src/lib/` but NOT in the public `index.ts` exports — only `Table` is exported).
- Component files use `<script lang="ts">` throughout.

### CSS Architecture

- All styles live in a `<style>` block in `Table.svelte` (or per-component `<style>` blocks).
- `@sveltejs/package` scopes styles — no global CSS pollution.
- Token consumption: `var(--tc-color-text)`, `var(--tc-row-height)` etc. — fall back to sensible defaults via `var(--tc-color-text, #111827)`.
- Optional Tailwind companion: `packages/svelte/src/styles/tailwind.css` maps Tailwind design tokens to `--tc-*` custom properties. Consumers who use Tailwind v4 import this file to sync tokens. NOT auto-injected.
- Dark mode: `:root[data-theme="dark"]` or `@media (prefers-color-scheme: dark)` overrides CSS tokens. Implemented via a `<style>` block that toggles token values.

### Claude's Discretion

- Exact pixel values for default styles (padding, font-size, etc.) — use `--tc-*` tokens
- SVG vs Unicode for sort indicators and boolean icons
- Whether to use Svelte snippets (`{#snippet}`) or sub-components for internal rendering
- Exact debounce implementation (setTimeout vs a debounce utility)
- CSS class naming convention (BEM vs flat `tc-*` prefix)
- Whether TableHeader/Body/Footer are separate .svelte files or `{#snippet}` blocks in Table.svelte

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core Engine (Phase 2 — must integrate with)
- `packages/core/src/engine/index.ts` — `createTableEngine()` API; `resolveColumns()`, `processRows()`, `inferSchema()`
- `packages/core/src/types.ts` — ALL type definitions: `CellDescriptor`, `ColumnType`, `ColumnDefinition`, `ResolvedColumn`, `ProcessedRow`, `TableConfig`
- `packages/core/src/compat/v1.ts` — `adaptV1Props()` for backward compatibility
- `packages/core/src/tokens.ts` — `DEFAULT_TOKENS` — all CSS custom property names

### Svelte Package (Phase 1 stub — REWRITE)
- `packages/svelte/src/lib/Table.svelte` — Phase 1 stub; READ before rewriting to understand existing prop interface
- `packages/svelte/src/lib/index.ts` — current exports barrel
- `packages/svelte/package.json` — build config; `@sveltejs/package` build
- `packages/svelte/svelte.config.js` — Svelte compiler config

### Planning
- `.planning/PROJECT.md` — Vision, constraints, core value
- `.planning/REQUIREMENTS.md` — SVLT-01 through SVLT-15 (Phase 3 scope)
- `.planning/ROADMAP.md` — Phase 3 goal and 5 success criteria
- `.planning/phases/02-core-engine-type-inference-renderer-registry/02-CONTEXT.md` — CellDescriptor design decisions (carry-forward)
- `.planning/phases/01-foundation/01-CONTEXT.md` — Package naming, TypeScript patterns (carry-forward)

### Research
- `.planning/research/FEATURES.md` — Feature classification; minimum viable API design
- `.planning/research/ARCHITECTURE.md` — Headless core + framework adapter pattern; state separation
- `.planning/research/PITFALLS.md` — Re-render cascade prevention; TypeScript generics complexity; SSR guards

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/svelte/src/lib/Table.svelte`: Phase 1 stub already has correct prop interface (`data`, `columns`, `caption`), Svelte 5 runes (`$props`, `$derived`), and `columnKeys` derivation logic. REWRITE the body, but the prop interface is the right starting point.
- `packages/core/src/engine/index.ts`: `createTableEngine(config)` is the integration point — call this in a `$effect` or at component init. `resolveColumns()` returns `ResolvedColumn[]` immediately (text fallback), updates when inference completes.
- `packages/core/src/tokens.ts`: `DEFAULT_TOKENS` object — consume these in CSS custom property declarations.
- `packages/core/src/compat/v1.ts`: `adaptV1Props()` — call when `colname` or `rowdata` props are detected.

### Established Patterns
- **TypeScript strict mode**: All `.svelte` files use `<script lang="ts">`. Props typed explicitly.
- **Svelte 5 runes**: `$props()`, `$state()`, `$derived()`, `$effect()` — no `export let`, no `$:`, no `on:` directives (use `onclick={handler}` attribute syntax).
- **No `{@html}` on raw user data**: Enforced by ESLint. Only `{@html descriptor.sanitized}` for the `html` CellDescriptor kind is allowed.
- **CSS custom properties**: All styling via `var(--tc-*)` — no hardcoded color values.
- **Test pattern**: `@testing-library/svelte` v5 for component tests. Already configured in workspace.

### Integration Points
- `packages/svelte/src/lib/Table.svelte` imports from `@tablecraft/core` via the workspace symlink
- `packages/svelte/src/lib/index.ts` exports `Table` as the sole public symbol
- `packages/svelte/src/lib/Table.test.ts` — existing test stub (6 tests from Phase 1) — expand in Phase 3
- The `@sveltejs/package` build compiles `.svelte` files and generates `dist/` with exports map

</code_context>

<specifics>
## Specific Ideas

- The zero-config `<Table data={rows} />` API is the product's thesis — it must work perfectly with no configuration at all. The inference runs in the background; the table shows immediately with text-formatted columns.
- `requestIdleCallback` scheduling means the user sees the table render instantly (all text), then the typed renderers snap in. This two-phase render is intentional and should feel smooth — a subtle transition, not a flash.
- The `on:select` event follows the Svelte 5 event style: `<Table data={rows} onselect={handler} />` using the `onselect` attribute (not `on:select`).
- WCAG 2.1 AA is non-negotiable — vitest-axe assertions must pass for all rendered states (empty, loading, with data, with selection).

</specifics>

<deferred>
## Deferred Ideas

- Per-column filter inputs (column-specific filter controls) — Phase 6 (ADV-01+)
- Column resizing drag handles — Phase 6
- Column pinning — Phase 6
- Row grouping — Phase 6
- Dense/comfortable/spacious density control — Phase 6
- Row-click to select (row selection without checkbox) — Phase 6
- Export CSV — v2 requirements (post Phase 7)
- Inline editing — v2 requirements
- Sub-rows / expandable rows — v2 requirements

</deferred>

---

*Phase: 03-svelte-5-component-zero-config-api*
*Context gathered: 2026-03-21*
