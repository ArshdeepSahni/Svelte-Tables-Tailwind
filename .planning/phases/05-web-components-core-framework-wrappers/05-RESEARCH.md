# Phase 5: Web Components Core + Framework Wrappers - Research

**Researched:** 2026-03-22
**Domain:** Lit 3 Custom Elements, @lit/react, Vue 3 SFC wrappers, Vite UMD builds, Playwright inline tests
**Confidence:** HIGH (all critical claims verified via official docs or npm registry)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Web Component Architecture**
- Element name: `<tc-table>` — registered via `customElements.define('tc-table', TcTable)`
- Base class: Lit 3 `LitElement` — for property/attribute reflection, reactive updates, efficient DOM patching
- Light DOM mode (non-negotiable): Override `createRenderRoot()` to return `this`. Shadow DOM is architecturally excluded.
- Render strategy: The Web Component wraps `@tablecraft/core` engine directly. Does NOT re-implement table rendering. Calls `resolveColumns()`, `processRows()`, `inferSchema()` from the core engine.
- No Svelte dependency: `@tablecraft/core` must be the ONLY `@tablecraft/*` dependency.

**Properties vs Attributes API**
- Properties: `element.data: Row[]`, `element.columns`, `element.selectedRows`
- Scalar attributes: `row-height`, `sort-by`, `sort-dir`, `bordered`, `striped`, `loading`, `page-size`, `filterable`, `selectable`, `caption`

**CustomEvents** — all with `bubbles: true, composed: true`: `tc-cell-click`, `tc-row-click`, `tc-sort-change`, `tc-filter-change`, `tc-select-change`

**SSR Guards** — exact patterns decided and locked (see CONTEXT.md)

**React Wrapper** — `@lit/react` 1.x, `createComponent()` adapter, event mapping in `events` option

**Vue Wrapper** — Native Vue 3 SFC wrapper (not a third-party adapter), uses `ref`/`onMounted`/`watch`

**Build Configuration**
- `@tablecraft/core`: Vite 8 library mode, `formats: ['es', 'cjs', 'umd']` for element entry only
- Bundle Lit into UMD build; external Lit for ESM/CJS
- `@tablecraft/react`: tsup 8.x, lit + @lit/react external
- `@tablecraft/vue`: tsup 8.x

**Playwright Smoke Tests** — React, Vue, Vanilla JS, and SvelteKit SSR fixture tests

### Claude's Discretion
- Whether to bundle LitElement's `html` and `css` tagged template literals inline or import from Lit
- Exact Lit property decorator syntax (`@property` vs `static properties = {}`)
- Whether to support a `theme` attribute for switching CSS token presets
- Exact UMD bundle name casing (`TcTable` vs `tablecraft.Table`)
- Internal reactive state management in the Lit element (propertyChangedCallback vs willUpdate)

### Deferred Ideas (OUT OF SCOPE)
- `@tablecraft/solid` wrapper
- `@tablecraft/angular` wrapper
- Declarative Shadow DOM (for SSR streaming)
- `@lit/ssr` integration
- Angular Elements
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WC-01 | `@tablecraft/core` ships `<tc-table>` Lit 3 Custom Element in Light DOM mode (`createRenderRoot() { return this; }`) | Lit shadow DOM docs confirm this override is the correct Light DOM pattern; return type is `HTMLElement \| DocumentFragment` in Lit 3 |
| WC-02 | Web Component properties API for complex data: `element.data = rows`, `element.columns = [...]` | Verified: `static properties = { data: { attribute: false } }` is the correct pattern for complex data that must not be attribute-reflected |
| WC-03 | Web Component attributes API for scalars: `row-height`, `sort-by`, `bordered`, `striped`, `loading` | Verified: `@property({ type: Number, attribute: 'row-height' })` and `@property({ type: Boolean })` patterns confirmed in Lit docs |
| WC-04 | CustomEvents with `bubbles: true, composed: true`: `tc-cell-click`, `tc-row-click`, `tc-sort-change`, `tc-filter-change` | Verified: `this.dispatchEvent(new CustomEvent('tc-cell-click', { detail: {...}, bubbles: true, composed: true }))` is the correct Lit pattern |
| WC-05 | SSR guards on all browser-only APIs | Verified: `import { isServer } from 'lit'` is the correct Lit-native SSR guard; `typeof customElements !== 'undefined'` for registration guard |
| WC-06 | SvelteKit SSR integration test passes in CI | Pattern: minimal SvelteKit fixture in `e2e/fixtures/sveltekit-ssr/`, Playwright starts preview server |
| WC-07 | `@tablecraft/react` wraps `<tc-table>` via `@lit/react` — all CustomEvents forwarded as React props | Verified: `createComponent({ react, tagName, elementClass, events, displayName })` is exact API; `@types/react` 17\|18\|19 all supported |
| WC-08 | `@tablecraft/vue` wraps `<tc-table>` as Vue 3 SFC | CRITICAL FINDING: tsup cannot process `.vue` files. `@tablecraft/vue` must switch build tool from tsup to Vite + `@vitejs/plugin-vue`. |
| WC-09 | Vite 5 + `vite-plugin-dts` builds `@tablecraft/core` to ESM + CJS + UMD | CRITICAL FINDING: Vite multi-entry lib mode does NOT support UMD. UMD requires a separate single-entry build config (`src/element.ts` only). |
| WC-10 | Playwright smoke tests pass for React and Vue wrappers rendering 100 rows correctly | Pattern: `page.setContent()` + `page.addScriptTag()` for inline HTML tests, `page.evaluate()` for property setting |
</phase_requirements>

---

## Summary

Phase 5 builds a Lit 3 Custom Element (`<tc-table>`) in Light DOM mode that wraps the existing `@tablecraft/core` engine, then provides framework-specific wrappers for React (`@lit/react`) and Vue (Vue 3 SFC). The core is technically sound and well-documented. However, two critical build-system mismatches discovered during research require plan adjustments:

**Critical Finding 1 — UMD build architecture:** Vite's library mode explicitly does NOT support UMD format with multiple entry points. The existing `vite.config.ts` already has multiple entries (17 renderers + `src/index.ts`). The UMD build for the Web Component entry (`src/element.ts`) must be a **separate `vite.config.element.ts`** with a single entry point. This is the only path to UMD.

**Critical Finding 2 — tsup cannot process `.vue` SFCs:** The `@tablecraft/vue` package's existing `tsup.config.ts` is incompatible with Vue SFC files. The build must switch to Vite + `@vitejs/plugin-vue` for `.vue` file processing. The output format (ESM + CJS) stays the same.

**Critical Finding 3 — TypeScript tsconfig conflict with Lit decorators:** The monorepo's `tsconfig.base.json` has `useDefineForClassFields: true` and `target: ES2022`. Lit's official docs require `useDefineForClassFields: false` for `@property()` decorators to work correctly with ES2022+ targets. The `packages/core/tsconfig.json` must override this with `experimentalDecorators: true` and `useDefineForClassFields: false`.

**Primary recommendation:** Use `static properties = {}` syntax (no `@property()` decorator) for the Lit element's property declarations — this avoids the `useDefineForClassFields` conflict entirely. The `static` class field approach works correctly regardless of that tsconfig setting.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `lit` | 3.3.2 (latest) | LitElement base class, `html` template tag, `isServer` guard | Google-maintained, ~6KB gzip, full Custom Element lifecycle |
| `@lit/react` | 1.0.8 (latest) | React wrapper via `createComponent()` | Official adapter, handles property/event bridge, TypeScript generics, `@types/react` 17\|18\|19 |
| `vite-plugin-dts` | 4.5.4 (latest) | TypeScript declarations for multi-entry Vite builds | Already in core package; handles multiple entries with `rollupTypes: false` |
| `@vitejs/plugin-vue` | (latest) | Processes `.vue` SFC files in Vite build for `@tablecraft/vue` | Required — tsup cannot compile `.vue` files |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@lit-labs/ssr` | N/A | Full SSR rendering | DEFERRED — out of scope for Phase 5 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `static properties = {}` | `@property()` decorator | Decorator requires `experimentalDecorators: true` + `useDefineForClassFields: false` override; static properties works with existing tsconfig |
| Separate `vite.config.element.ts` for UMD | Single build config | Vite multi-entry does not support UMD — cannot be combined |
| `@vitejs/plugin-vue` for vue package build | tsup | tsup does not support `.vue` SFC files at all |

**Installation (packages/core):**
```bash
pnpm add lit --filter @tablecraft/core
```

**Installation (packages/react):**
```bash
pnpm add @lit/react --filter @tablecraft/react
```

**Installation (packages/vue — build only):**
```bash
pnpm add -D @vitejs/plugin-vue vite vite-plugin-dts --filter @tablecraft/vue
```

**Version verification (confirmed 2026-03-22):**
- `lit`: 3.3.2 (npm view lit version)
- `@lit/react`: 1.0.8 (npm view @lit/react version)
- `vite-plugin-dts`: 4.5.4 (npm view vite-plugin-dts version)
- `tsup`: 8.5.1 (npm view tsup version)
- `vite`: 8.0.1 (npm view vite version)

---

## Architecture Patterns

### Recommended Project Structure
```
packages/core/
├── src/
│   ├── index.ts              # existing — pure computation engine
│   ├── element.ts            # NEW — exports TcTable class + registers CE
│   ├── element/
│   │   └── TcTable.ts        # NEW — LitElement implementation
│   ├── tokens.ts             # existing — DEFAULT_TOKENS used by element
│   └── ...
├── vite.config.ts            # existing — multi-entry ESM+CJS (no UMD)
└── vite.config.element.ts    # NEW — single-entry UMD for CDN usage

packages/react/
├── src/
│   └── index.ts              # replaced — createComponent() wrapper
└── tsup.config.ts            # existing — no changes needed

packages/vue/
├── src/
│   ├── index.ts              # replaced — exports Table component
│   └── Table.vue             # NEW — Vue 3 SFC wrapper
├── vite.config.ts            # NEW — replaces tsup for .vue processing
└── tsup.config.ts            # REMOVED or made noop

e2e/
├── smoke.spec.ts             # existing placeholder
├── react-smoke.spec.ts       # NEW
├── vue-smoke.spec.ts         # NEW
├── vanilla-smoke.spec.ts     # NEW
└── fixtures/
    └── sveltekit-ssr/        # NEW — minimal SvelteKit project
```

### Pattern 1: Lit Element in Light DOM (Non-negotiable)
**What:** Override `createRenderRoot()` to return `this` (the element itself) instead of a Shadow Root. Lit 3 changed `createRenderRoot()` return type to `HTMLElement | DocumentFragment`, making this type-safe.
**When to use:** Always — this is the non-negotiable architectural decision.

```typescript
// Source: https://lit.dev/docs/components/shadow-dom/
import { LitElement, html } from 'lit';
import { createTableEngine } from './engine/index.js';
import type { ResolvedColumn, ProcessedRow, Row } from './types.js';

export class TcTable extends LitElement {
  // CRITICAL: Return `this` — Light DOM only, no Shadow Root
  override createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  // Use static properties (NOT @property() decorator) to avoid useDefineForClassFields conflict
  static override properties = {
    data:     { attribute: false },              // complex object — no attribute reflection
    columns:  { attribute: false },              // complex object — no attribute reflection
    rowHeight: { type: Number, attribute: 'row-height' },
    sortBy:    { type: String, attribute: 'sort-by' },
    sortDir:   { type: String, attribute: 'sort-dir' },
    bordered:  { type: Boolean },
    striped:   { type: Boolean },
    loading:   { type: Boolean },
    pageSize:  { type: Number, attribute: 'page-size' },
    filterable:{ type: Boolean },
    selectable:{ type: Boolean },
    caption:   { type: String },
  };

  constructor() {
    super();
    this.data = [];
    this.columns = undefined;
    this.rowHeight = 48;
    this.sortBy = '';
    this.sortDir = 'asc';
    this.bordered = false;
    this.striped = false;
    this.loading = false;
    this.pageSize = 50;
    this.filterable = false;
    this.selectable = false;
    this.caption = '';
  }
}

// SSR guard for registration
if (typeof customElements !== 'undefined') {
  customElements.define('tc-table', TcTable);
}
```

### Pattern 2: Static Properties vs Decorator Approach
**What:** Two ways to declare reactive properties in Lit. `static properties = {}` avoids the tsconfig conflict.
**When to use:** Use `static properties` to stay compatible with `useDefineForClassFields: true` in the base tsconfig.

```typescript
// RECOMMENDED — static properties, no decorator conflict
static override properties = {
  // Array/Object properties: attribute: false (no HTML attribute)
  data:    { attribute: false },
  columns: { attribute: false },
  // Scalar attributes
  bordered: { type: Boolean },
  pageSize: { type: Number, attribute: 'page-size' },
};
// Must initialize in constructor, NOT as class fields
constructor() {
  super();
  this.data = [];
  this.bordered = false;
  this.pageSize = 50;
}

// ALTERNATIVE — requires experimentalDecorators + useDefineForClassFields: false in tsconfig
import { property } from 'lit/decorators.js';
@property({ attribute: false }) data: Row[] = [];
@property({ type: Boolean }) bordered = false;
@property({ type: Number, attribute: 'page-size' }) pageSize = 50;
```

**KEY INSIGHT about Array property reactivity:** Lit uses reference equality (`!==`) for change detection, NOT deep comparison. Mutating `element.data.push(row)` does NOT trigger a re-render. Callers must assign a new array: `element.data = [...element.data, row]`. Document this prominently.

### Pattern 3: CustomEvent Dispatch
**What:** All events dispatched with `bubbles: true, composed: true`.
**When to use:** Any user interaction or state change in the Lit element.

```typescript
// Source: https://lit.dev/docs/components/events/
private _dispatchCellClick(row: Row, column: ResolvedColumn, value: unknown, rowIndex: number): void {
  this.dispatchEvent(new CustomEvent('tc-cell-click', {
    detail: { row, column, value, rowIndex },
    bubbles: true,
    composed: true,  // pierces shadow DOM boundaries if used inside shadow DOM
  }));
}
```

### Pattern 4: Lifecycle — Which Method to Use
**What:** Lit has multiple lifecycle hooks; use the correct one for each purpose.

| Purpose | Use | Why |
|---------|-----|-----|
| Initialize table engine, set up ResizeObserver | `connectedCallback()` | Fires when added to DOM; pair with `disconnectedCallback()` for cleanup |
| Compute derived state before render (e.g., processRows) | `willUpdate(changedProperties)` | Runs before DOM update, ideal for computation |
| Post-render DOM operations | `updated(changedProperties)` | Runs after DOM refresh |
| Dispatch events after render completes | `await this.updateComplete` then dispatch | Ensures DOM reflects new state |

```typescript
// Source: https://lit.dev/docs/components/lifecycle/
override connectedCallback(): void {
  super.connectedCallback();
  // SSR guard for browser APIs
  if (typeof ResizeObserver !== 'undefined') {
    this._resizeObserver = new ResizeObserver(this._handleResize);
    this._resizeObserver.observe(this);
  }
  // Initialize CSS tokens on root element
  this._applyTokens();
}

override disconnectedCallback(): void {
  super.disconnectedCallback();
  this._resizeObserver?.disconnect();
}

override willUpdate(changedProperties: Map<string, unknown>): void {
  if (changedProperties.has('data') || changedProperties.has('columns')) {
    // Recompute engine output when data/columns change
    this._engine = createTableEngine({ data: this.data, columns: this.columns });
    this._resolvedColumns = this._engine.resolveColumns(this.data);
    this._processedRows = this._engine.processRows(this.data, this._resolvedColumns);
  }
}
```

### Pattern 5: SSR Guards
**What:** Guard all browser-only APIs so `@tablecraft/core` can be imported in SvelteKit SSR.

```typescript
// Source: https://lit.dev/docs/ssr/authoring/
import { isServer } from 'lit';  // Lit 3's built-in SSR environment detector

// Preferred Lit-native approach
if (!isServer) {
  this._resizeObserver = new ResizeObserver(this._handleResize);
}

// Also acceptable for registration guard (more explicit)
if (typeof customElements !== 'undefined') {
  customElements.define('tc-table', TcTable);
}

// For window-dependent APIs
const scrollTop = typeof window !== 'undefined' ? window.scrollY : 0;
```

**Note:** `isServer` is exported from `'lit'` via re-export from `lit-html/is-server.js`. It is a compile-time constant that tree-shakes correctly.

### Pattern 6: @lit/react createComponent()
**What:** The exact `createComponent()` signature from `@lit/react` 1.0.8.

```typescript
// Source: https://github.com/lit/lit/packages/react
import React from 'react';
import { createComponent, type EventName } from '@lit/react';
import { TcTable } from '@tablecraft/core/element.js';

// EventName<T> provides type-safe event callbacks
export const Table = createComponent({
  react: React,
  tagName: 'tc-table',
  elementClass: TcTable,
  displayName: 'Table',
  events: {
    onCellClick:    'tc-cell-click'   as EventName<CustomEvent>,
    onRowClick:     'tc-row-click'    as EventName<CustomEvent>,
    onSortChange:   'tc-sort-change'  as EventName<CustomEvent>,
    onFilterChange: 'tc-filter-change' as EventName<CustomEvent>,
    onSelectChange: 'tc-select-change' as EventName<CustomEvent>,
  },
});
```

**How events work internally:** `@lit/react` calls `addEventListener('tc-cell-click', handler)` on the DOM element when `onCellClick` prop is set. It does NOT use React synthetic events. This means:
- Event objects are native `CustomEvent` instances with `.detail` payload
- React 19 compatibility is confirmed via `@types/react` peer dep supporting `17 || 18 || 19`

### Pattern 7: Vue 3 SFC Wrapper
**What:** A Vue 3 SFC that wraps `<tc-table>` Custom Element, forwarding props and events.

```vue
<!-- packages/vue/src/Table.vue -->
<template>
  <tc-table
    ref="el"
    :row-height="rowHeight"
    :sort-by="sortBy"
    :bordered="bordered || undefined"
    @tc-cell-click="$emit('cellClick', $event)"
    @tc-row-click="$emit('rowClick', $event)"
    @tc-sort-change="$emit('sortChange', $event)"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, watch, type Ref } from 'vue';

// Props for complex data MUST be set as DOM properties, not attributes
const props = defineProps<{
  data?: unknown[];
  columns?: unknown;
  rowHeight?: number;
  sortBy?: string;
  bordered?: boolean;
  striped?: boolean;
  loading?: boolean;
  pageSize?: number;
}>();

defineEmits(['cellClick', 'rowClick', 'sortChange', 'filterChange', 'selectChange']);

const el: Ref<HTMLElement | null> = ref(null);

// CRITICAL: data and columns must be set as DOM properties (not attributes)
// Vue 3 auto-detects DOM property presence via `in` operator for registered custom elements
// For unregistered/unknown elements, use .prop modifier or imperative assignment
onMounted(() => {
  if (el.value) {
    (el.value as any).data = props.data ?? [];
    (el.value as any).columns = props.columns;
  }
});

watch(() => props.data, (newData) => {
  if (el.value) (el.value as any).data = newData ?? [];
});

watch(() => props.columns, (newColumns) => {
  if (el.value) (el.value as any).columns = newColumns;
});
</script>
```

**Key insight:** Vue 3 auto-detects DOM properties via `in` operator, but only for registered custom elements. Since `@tablecraft/vue` imports `@tablecraft/core` (which registers `tc-table`), Vue should auto-detect correctly. However, for safety, the imperative `onMounted` approach ensures correct property setting regardless.

**Consumer's required config (documented, NOT bundled):**
```js
// consumer's vite.config.js — must be in library docs
vue({ template: { compilerOptions: { isCustomElement: tag => tag.startsWith('tc-') } } })
```

### Pattern 8: Separate UMD Build Config
**What:** The UMD build cannot be combined with the multi-entry ESM/CJS build. Requires a separate Vite config.

```typescript
// packages/core/vite.config.element.ts — NEW FILE
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/element.ts'),  // SINGLE entry only
      name: 'TcTable',                               // global variable for CDN
      formats: ['umd'],                              // or ['es', 'umd'] for dual
      fileName: (format) => `element.${format}.js`,
    },
    outDir: 'dist',
    emptyOutDir: false,                              // don't wipe ESM/CJS output
    rolldownOptions: {
      // Bundle lit for UMD (CDN users don't manage Lit separately)
      // Leave external empty — all deps bundled into the UMD artifact
      external: [],
    },
  },
});
```

**`packages/core/package.json` element entry:**
```json
{
  "exports": {
    "./element": {
      "import": { "types": "./dist/element.d.ts", "default": "./dist/element.js" },
      "require": { "types": "./dist/element.d.cts", "default": "./dist/element.cjs" }
    }
  }
}
```

### Pattern 9: Vue Package — Switch to Vite Build
**What:** Replace tsup with Vite + `@vitejs/plugin-vue` for `@tablecraft/vue`.

```typescript
// packages/vue/vite.config.ts — NEW
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    vue(),  // processes .vue SFC files
    dts({ include: ['src/**/*.ts', 'src/**/*.vue'], outDir: 'dist', rollupTypes: false }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
    },
    rolldownOptions: {
      external: ['vue', '@tablecraft/core'],
    },
  },
});
```

### Pattern 10: Playwright Inline Tests (no separate dev server)
**What:** Test Web Components, React, and Vue wrappers using `page.setContent()` and `page.evaluate()`.

```typescript
// e2e/vanilla-smoke.spec.ts
import { test, expect } from '@playwright/test';
import { resolve } from 'path';

test('vanilla Custom Element renders data', async ({ page }) => {
  // Load the built UMD artifact
  await page.addScriptTag({
    path: resolve(__dirname, '../packages/core/dist/element.umd.js'),
  });

  await page.setContent(`<tc-table></tc-table>`);

  // Set data as DOM property (not attribute — it's an array)
  await page.evaluate(() => {
    const el = document.querySelector('tc-table') as any;
    el.data = [{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }];
  });

  // Wait for Lit reactive update
  await page.waitForSelector('tc-table td');
  await expect(page.locator('tc-table td').first()).toBeVisible();
});
```

### renderCell() Method — Mirrors Cell.svelte
**What:** The Lit element's `renderCell(descriptor: CellDescriptor)` must mirror `Cell.svelte` exactly.

```typescript
// Based on packages/svelte/src/lib/Cell.svelte
private renderCell(descriptor: CellDescriptor) {
  switch (descriptor.kind) {
    case 'text':    return html`<span>${descriptor.value}</span>`;
    case 'number':  return html`<span class="tc-num">${descriptor.formatted}</span>`;
    case 'link':    return html`<a class="tc-link" href=${descriptor.href}
                      target=${descriptor.external ? '_blank' : nothing}
                      rel=${descriptor.external ? 'noopener noreferrer' : nothing}>
                      ${descriptor.label}</a>`;
    case 'image':   return html`<img src=${descriptor.src} alt=${descriptor.alt}
                      class="tc-img" loading="lazy" />`;
    case 'badge':   return html`<span class="tc-badge tc-badge--${descriptor.variant}">${descriptor.label}</span>`;
    case 'status':  return html`<span class="tc-status tc-status--${descriptor.variant}"
                      role="status">${descriptor.label}</span>`;
    case 'boolean': return html`<span class="tc-bool ${descriptor.value ? 'tc-bool--true' : 'tc-bool--false'}"
                      aria-label=${descriptor.value ? 'Yes' : 'No'}>${descriptor.value ? '✓' : '✗'}</span>`;
    case 'code':    return html`<code class="tc-code">${descriptor.value}</code>`;
    case 'html':    return html`<span .innerHTML=${descriptor.sanitized}></span>`;
    // 'raw' fallback
    default:        return html`<span>${String((descriptor as any).value)}</span>`;
  }
}
```

**CRITICAL for `html` kind:** Use `.innerHTML` DOM property binding (`.innerHTML=${...}`) NOT `unsafeHTML()`. `unsafeHTML` requires `lit/directives/unsafe-html.js` and the name implies unsafety. Since the HTML is already DOMPurify-sanitized by the core renderer, `.innerHTML=` property binding in Lit-html is the correct approach.

### Anti-Patterns to Avoid

- **Calling `customElements.define()` at module top-level without SSR guard:** Crashes during SvelteKit SSR with `ReferenceError: customElements is not defined`. Always guard with `typeof customElements !== 'undefined'`.
- **Using `@property()` decorator without tsconfig override:** With `useDefineForClassFields: true` (the monorepo base), class field declarations erase Lit's accessor. Use `static properties = {}` instead.
- **Mutating the data array:** `element.data.push(row)` does NOT trigger Lit re-render. Must assign new reference.
- **Using Shadow DOM:** `createRenderRoot()` must return `this`. Any accidental `super.createRenderRoot()` creates a Shadow Root and breaks Tailwind.
- **Multi-entry UMD in Vite:** Throws `"Multiple entry points are not supported when output formats include 'umd'"`. UMD requires its own single-entry build config.
- **Using tsup for `.vue` files:** tsup does not process Vue SFCs. Switch to Vite for `@tablecraft/vue`.
- **Setting `element.data = rows` as an attribute string:** `data` is a complex Array property. React pre-19 could stringify it. `@lit/react` handles this correctly, but vanilla JS consumers must use DOM property API.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| React/Custom Element bridge | Manual `useEffect` + `addEventListener` | `@lit/react` `createComponent()` | Handles property/attribute distinction, event binding, ref forwarding, TypeScript types |
| Lit reactive system | Manual `MutationObserver` on attributes | Lit `static properties` with `attribute:` option | Lit handles attribute→property conversion, change detection, and render scheduling |
| Vue `.vue` file compilation | Manual `@vue/compiler-sfc` invocation | `@vitejs/plugin-vue` in Vite build | Handles template compilation, style extraction, TypeScript transform |
| UMD bundle for CDN | Rollup manual config | Vite library mode (single entry) | `rolldownOptions` + `formats: ['umd']` handles global name, minification |
| Custom Element type registration for TS | Manual `HTMLElementTagNameMap` | Standard pattern via `declare global { interface HTMLElementTagNameMap { 'tc-table': TcTable } }` | Enables typed `document.createElement('tc-table')` |
| SSR environment detection | `process.browser` check | `import { isServer } from 'lit'` | Tree-shakes correctly, officially maintained by Lit team |

**Key insight:** The Lit + `@lit/react` + Vue SFC stack is the industry-standard approach. Every major component library (Adobe Spectrum, Shoelace, Lion) uses these exact patterns. Custom bridges are brittle.

---

## Common Pitfalls

### Pitfall 1: useDefineForClassFields Conflict with Lit Decorators
**What goes wrong:** With `target: ES2022` and `useDefineForClassFields: true` (the monorepo base tsconfig), `@property()` decorated class fields are overwritten at class instantiation time by native class field semantics. Lit's reactive accessors are silently broken — properties appear to work but reactive updates never fire.
**Why it happens:** TypeScript ES2022 class fields use the TC39 "define" semantics which overwrite prototype accessors. Lit installs accessors on the prototype; native class fields shadow them.
**How to avoid:** Use `static properties = {}` (no decorator needed), OR add to `packages/core/tsconfig.json`:
```json
{ "compilerOptions": { "experimentalDecorators": true, "useDefineForClassFields": false } }
```
The `static properties` approach is RECOMMENDED because it doesn't require tsconfig changes and avoids decorator babel/tsc conflicts.
**Warning signs:** Changing a property on the element does nothing; `requestUpdate()` call fixes it.

### Pitfall 2: Vite Multi-Entry + UMD Incompatibility
**What goes wrong:** Adding `'umd'` to `formats` in the existing `vite.config.ts` (which has 19 entry points) throws a build error: "Multiple entry points are not supported when output formats include 'umd' or 'iife'."
**Why it happens:** UMD requires a single global name; the format inherently maps to one file with one export namespace.
**How to avoid:** Create a separate `vite.config.element.ts` with `entry: 'src/element.ts'` (single entry) and `formats: ['umd']`. Run both build configs: `vite build && vite build --config vite.config.element.ts`.
**Warning signs:** Build fails immediately with the above error message.

### Pitfall 3: Vue SFC in tsup Build
**What goes wrong:** Adding a `Table.vue` file to `packages/vue/src/` and running the existing tsup build produces: "Error: Unknown file extension '.vue'".
**Why it happens:** tsup is esbuild-based and does not have Vue SFC transform support.
**How to avoid:** Replace `tsup.config.ts` with a `vite.config.ts` using `@vitejs/plugin-vue` as documented in Pattern 9.
**Warning signs:** Build fails with `Unknown file extension` or tsup doesn't include `.vue` files in output.

### Pitfall 4: Array Mutation Not Triggering Lit Updates
**What goes wrong:** Consumer does `element.data.push(newRow)` — table doesn't update.
**Why it happens:** Lit uses `!==` reference equality. Same array reference = no change detected.
**How to avoid:** Assign a new array: `element.data = [...element.data, newRow]`. Document this in the API docs and JSDoc on the `data` property.
**Warning signs:** Data prop seemingly ignored after initial render.

### Pitfall 5: CustomElements Not Defined in SSR
**What goes wrong:** Importing `@tablecraft/core/element.js` in SvelteKit `+page.server.ts` throws `ReferenceError: customElements is not defined`.
**Why it happens:** `customElements.define()` at module top-level runs immediately on import in Node.js.
**How to avoid:** Wrap in `if (typeof customElements !== 'undefined')` guard. Additionally, LitElement itself depends on `HTMLElement`, but Lit 3 imports safely in Node.js as long as no DOM operations run at module evaluation time (lifecycle methods are safe).
**Warning signs:** SvelteKit SSR build error during `vite build`; test WC-06 fails.

### Pitfall 6: Light DOM CSS Conflicts
**What goes wrong:** CSS defined in the Lit element's `static styles` bleeds into the host page (and vice versa). The `<style>` tag Lit injects goes into `<head>`, affecting everything.
**Why it happens:** No Shadow DOM = no CSS encapsulation.
**How to avoid:** Do NOT define `static styles` in the LitElement. All styling must use `--tc-*` CSS custom properties (already the project standard). Inject tokens via `element.style.setProperty()` in `connectedCallback()`.
**Warning signs:** Unexpected styling changes in host application when `<tc-table>` is present on page.

### Pitfall 7: React Events via @lit/react
**What goes wrong:** Consumer tries to use `element.addEventListener('tc-cell-click', ...)` instead of the `onCellClick` prop — works but bypasses React lifecycle.
**Why it happens:** Developer unfamiliar with `@lit/react` convention.
**How to avoid:** The `onCellClick` prop IS the correct React API. The event detail payload is on `event.detail`, not `event` directly. Document: `onCellClick={(e) => console.log(e.detail.row)}`.
**Warning signs:** Works but React warnings about event handler lifecycle.

---

## Code Examples

### Full TcTable Skeleton
```typescript
// packages/core/src/element/TcTable.ts
// Source: https://lit.dev/docs/components/shadow-dom/ + https://lit.dev/docs/components/lifecycle/
import { LitElement, html, nothing } from 'lit';
import { isServer } from 'lit';
import { createTableEngine } from '../engine/index.js';
import { DEFAULT_TOKENS } from '../tokens.js';
import type { CellDescriptor, ResolvedColumn, ProcessedRow } from '../types.js';

export class TcTable extends LitElement {
  // Light DOM — non-negotiable
  override createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  static override properties = {
    data:       { attribute: false },
    columns:    { attribute: false },
    rowHeight:  { type: Number, attribute: 'row-height' },
    sortBy:     { type: String, attribute: 'sort-by' },
    sortDir:    { type: String, attribute: 'sort-dir' },
    bordered:   { type: Boolean },
    striped:    { type: Boolean },
    loading:    { type: Boolean },
    pageSize:   { type: Number, attribute: 'page-size' },
    filterable: { type: Boolean },
    selectable: { type: Boolean },
    caption:    { type: String },
  };

  // Internal derived state (NOT declared as properties — computed, not reactive inputs)
  private _resolvedColumns: ResolvedColumn[] = [];
  private _processedRows: ProcessedRow[] = [];
  private _resizeObserver?: ResizeObserver;

  constructor() {
    super();
    this.data = [];
    this.columns = undefined;
    this.rowHeight = 48;
    this.sortBy = '';
    this.sortDir = 'asc';
    this.bordered = false;
    this.striped = false;
    this.loading = false;
    this.pageSize = 50;
    this.filterable = false;
    this.selectable = false;
    this.caption = '';
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Inject CSS tokens as inline custom properties on the host element
    for (const [token, value] of Object.entries(DEFAULT_TOKENS)) {
      this.style.setProperty(token, value);
    }
    // SSR guard for browser-only APIs
    if (!isServer && typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => this.requestUpdate());
      this._resizeObserver.observe(this);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._resizeObserver?.disconnect();
  }

  override willUpdate(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('data') || changedProperties.has('columns')) {
      const engine = createTableEngine({ data: this.data ?? [], columns: this.columns });
      this._resolvedColumns = engine.resolveColumns(this.data ?? []);
      this._processedRows = engine.processRows(this.data ?? [], this._resolvedColumns);
    }
  }

  override render() {
    if (this.loading) {
      return html`<div class="tc-loading" aria-busy="true">Loading...</div>`;
    }
    return html`
      <table role="grid" class="tc-table ${this.bordered ? 'tc-table--bordered' : ''} ${this.striped ? 'tc-table--striped' : ''}">
        ${this.caption ? html`<caption>${this.caption}</caption>` : nothing}
        <thead>
          <tr>${this._resolvedColumns.map(col => html`
            <th role="columnheader" data-col=${col.key}
                @click=${() => this._handleSort(col.key)}>
              ${col.label}
            </th>`)}
          </tr>
        </thead>
        <tbody>
          ${this._processedRows.map((row, rowIndex) => html`
            <tr data-row=${rowIndex} @click=${() => this._handleRowClick(row._original, rowIndex)}>
              ${this._resolvedColumns.map(col => html`
                <td role="gridcell" data-col=${col.key}
                    @click=${(e: Event) => { e.stopPropagation(); this._handleCellClick(row._original, col, row.cells[col.key], rowIndex); }}>
                  ${this._renderCell(row.cells[col.key])}
                </td>`)}
            </tr>`)}
        </tbody>
      </table>`;
  }

  private _renderCell(descriptor: CellDescriptor) {
    // Mirrors Cell.svelte exactly
    switch (descriptor.kind) {
      case 'text':    return html`<span>${descriptor.value}</span>`;
      case 'number':  return html`<span class="tc-num">${descriptor.formatted}</span>`;
      case 'link':    return html`<a class="tc-link" href=${descriptor.href}
                        target=${descriptor.external ? '_blank' : nothing}
                        rel=${descriptor.external ? 'noopener noreferrer' : nothing}>${descriptor.label}</a>`;
      case 'image':   return html`<img class="tc-img" src=${descriptor.src} alt=${descriptor.alt} loading="lazy" />`;
      case 'badge':   return html`<span class="tc-badge tc-badge--${descriptor.variant}">${descriptor.label}</span>`;
      case 'status':  return html`<span class="tc-status tc-status--${descriptor.variant}" role="status">${descriptor.label}</span>`;
      case 'boolean': return html`<span class=${`tc-bool ${descriptor.value ? 'tc-bool--true' : 'tc-bool--false'}`}
                        aria-label=${descriptor.value ? 'Yes' : 'No'}>${descriptor.value ? '✓' : '✗'}</span>`;
      case 'code':    return html`<code class="tc-code">${descriptor.value}</code>`;
      case 'html':    return html`<span .innerHTML=${descriptor.sanitized}></span>`;
      default:        return html`<span>${String((descriptor as { value: unknown }).value)}</span>`;
    }
  }

  private _handleSort(key: string): void {
    this.dispatchEvent(new CustomEvent('tc-sort-change', {
      detail: { key, dir: this.sortDir === 'asc' ? 'desc' : 'asc' },
      bubbles: true, composed: true,
    }));
  }

  private _handleRowClick(row: Record<string, unknown>, rowIndex: number): void {
    this.dispatchEvent(new CustomEvent('tc-row-click', {
      detail: { row, rowIndex }, bubbles: true, composed: true,
    }));
  }

  private _handleCellClick(row: Record<string, unknown>, column: ResolvedColumn, descriptor: CellDescriptor, rowIndex: number): void {
    this.dispatchEvent(new CustomEvent('tc-cell-click', {
      detail: { row, column, value: (descriptor as any).value, rowIndex },
      bubbles: true, composed: true,
    }));
  }
}

// SSR guard
if (typeof customElements !== 'undefined') {
  customElements.define('tc-table', TcTable);
}

declare global {
  interface HTMLElementTagNameMap { 'tc-table': TcTable; }
}
```

### @tablecraft/react Implementation
```typescript
// packages/react/src/index.ts
import React from 'react';
import { createComponent, type EventName } from '@lit/react';
import { TcTable } from '@tablecraft/core/element.js';

export const Table = createComponent({
  react: React,
  tagName: 'tc-table',
  elementClass: TcTable,
  displayName: 'Table',
  events: {
    onCellClick:    'tc-cell-click'    as EventName<CustomEvent>,
    onRowClick:     'tc-row-click'     as EventName<CustomEvent>,
    onSortChange:   'tc-sort-change'   as EventName<CustomEvent>,
    onFilterChange: 'tc-filter-change' as EventName<CustomEvent>,
    onSelectChange: 'tc-select-change' as EventName<CustomEvent>,
  },
});

// Re-export types consumers need
export type { ColumnType, ColumnDefinition, TableConfig, CellDescriptor } from '@tablecraft/core';
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `rollupOptions` in Vite | `rolldownOptions` in Vite 8 | Vite 8.0 (2025) | Breaking: `rollupOptions` will break in Vite 9 — the project already uses `rolldownOptions` correctly |
| Lit 2 `renderRoot` returns `Element` | Lit 3 `createRenderRoot()` returns `HTMLElement \| DocumentFragment` | Lit 3.0 (Oct 2023) | Type-safe Light DOM override now works without casting |
| `@property()` legacy decorator (babel 2018-09) | Standard TC39 decorator with `accessor` keyword | Lit 3.0 | Legacy `experimentalDecorators` still works; standard decorators use `accessor myProp = 'val'` |
| IE11 support in Lit | IE11 dropped | Lit 3.0 | ES2021+ output only; safe for this project's Node 20 target |
| Vue CLI for Vue libraries | Vite + `@vitejs/plugin-vue` | Vue 3 era (2021+) | Vue CLI is maintenance-only; Vite is the standard |
| `React.createRef` + manual event wiring | `@lit/react` `createComponent()` | 2022+ | Official, type-safe; avoids React's Custom Element attribute limitation |

**Deprecated/outdated:**
- `@lit/react` `events` option using `React.SyntheticEvent`: NOT how it works — it uses native `addEventListener`, so events are native `CustomEvent` objects with `.detail`.
- `rollupOptions` in Vite 8: Deprecated in Vite 8, will break in Vite 9.
- `declareShadowRoot()` / Shadow DOM for this project: Architecturally excluded.
- Babel `@babel/plugin-proposal-decorators` version `"2018-09"`: Removed in Lit 3.

---

## Open Questions

1. **`packages/vue` build script update**
   - What we know: `tsup` in `packages/vue` cannot process `.vue` files. Build must switch to Vite.
   - What's unclear: The existing `package.json` has `"build": "tsup"` and no `vite` devDependency. The plan must add `vite` and `@vitejs/plugin-vue` as devDependencies and update the `build` script.
   - Recommendation: Plan task should explicitly update `packages/vue/package.json` and remove/replace `tsup.config.ts`.

2. **CSS injection in Light DOM — Style tag location**
   - What we know: Lit automatically injects a `<style>` tag for `static styles`. In Light DOM, this goes into `<head>` and is NOT scoped.
   - What's unclear: If `static styles` is used at all (even empty), Lit may still inject an empty style tag. The safest approach is to NOT define `static styles` and rely entirely on CSS custom properties via `element.style.setProperty()`.
   - Recommendation: Do not use `static styles`. Apply all tokens via `this.style.setProperty('--tc-*', value)` in `connectedCallback()`.

3. **SvelteKit SSR fixture complexity**
   - What we know: A minimal SvelteKit project is needed in `e2e/fixtures/sveltekit-ssr/`.
   - What's unclear: Does the Playwright config need a second `webServer` entry for the SvelteKit preview server? Or can the SSR test import `@tablecraft/core` in Node.js directly without a browser?
   - Recommendation: The SSR test doesn't need a browser at all — it can be a simple Vitest test that does `import '@tablecraft/core/element.js'` in a Node.js environment and asserts no `ReferenceError` is thrown. This is simpler than a full SvelteKit fixture and still proves WC-05/WC-06.

4. **`@lit/react` and React Server Components**
   - What we know: `@lit/react` `createComponent()` returns a standard React component.
   - What's unclear: React 19 Server Components require `'use client'` directive for browser-only code. The `@tablecraft/react` package may need `'use client'` at the top of `index.ts`.
   - Recommendation: Add `'use client'` directive to `packages/react/src/index.ts` as a precaution for React 19 RSC compatibility. This is a LOW confidence recommendation — verify with React 19 RSC docs.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 (unit); Playwright 1.50.1 (E2E) |
| Config file | `vitest.config.ts` (root); `playwright.config.ts` (root) |
| Quick run command | `pnpm test --filter @tablecraft/core` |
| Full suite command | `pnpm test && pnpm exec playwright test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WC-01 | `createRenderRoot()` returns `this`, no shadow root | unit | `vitest run packages/core/src/element/TcTable.test.ts` | Wave 0 |
| WC-02 | `element.data = rows` triggers re-render | unit | `vitest run packages/core/src/element/TcTable.test.ts` | Wave 0 |
| WC-03 | `row-height="64"` attribute reflected as `rowHeight: 64` | unit | `vitest run packages/core/src/element/TcTable.test.ts` | Wave 0 |
| WC-04 | `tc-cell-click` fires with correct detail on click | unit | `vitest run packages/core/src/element/TcTable.test.ts` | Wave 0 |
| WC-05 | `import '@tablecraft/core/element.js'` in Node.js — no ReferenceError | unit | `vitest run packages/core/src/element/ssr.test.ts` | Wave 0 |
| WC-06 | SvelteKit import in Node.js does not throw | unit | `vitest run packages/core/src/element/ssr.test.ts` | Wave 0 (simplifies CONTEXT.md's SvelteKit fixture) |
| WC-07 | `<Table data={rows} onCellClick={fn} />` renders in React 19 | E2E | `playwright test e2e/react-smoke.spec.ts` | Wave 0 |
| WC-08 | `<Table :data="rows" @cell-click="fn" />` renders in Vue 3 | E2E | `playwright test e2e/vue-smoke.spec.ts` | Wave 0 |
| WC-09 | `@tablecraft/core` dist has ESM + CJS + UMD artifacts | unit | `vitest run packages/core/src/build.test.ts` | Wave 0 |
| WC-10 | React and Vue smoke tests render 100 rows, headers visible | E2E | `playwright test e2e/react-smoke.spec.ts e2e/vue-smoke.spec.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test` (Vitest unit tests only, < 30 seconds)
- **Per wave merge:** `pnpm test && pnpm exec playwright test --project=chromium`
- **Phase gate:** Full suite (all browsers) green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `packages/core/src/element/TcTable.test.ts` — covers WC-01 through WC-04 (Lit unit tests via `@web/test-runner` or Vitest + jsdom)
- [ ] `packages/core/src/element/ssr.test.ts` — covers WC-05, WC-06 (Node.js import safety)
- [ ] `e2e/react-smoke.spec.ts` — covers WC-07, WC-10
- [ ] `e2e/vue-smoke.spec.ts` — covers WC-08, WC-10
- [ ] `e2e/vanilla-smoke.spec.ts` — covers WC-02 (property API via browser)
- [ ] `packages/core/vite.config.element.ts` — UMD build config (WC-09)
- [ ] `packages/vue/vite.config.ts` — replaces tsup for `.vue` processing (WC-08)

**Note on WC-01–WC-04 unit tests:** Lit element tests in jsdom require `@web/test-runner` or the `happy-dom` environment (jsdom lacks full Custom Element support). Vitest supports `environment: 'happy-dom'` which has Custom Element support. Recommend using `happy-dom` for the Lit unit tests.

---

## Sources

### Primary (HIGH confidence)
- https://lit.dev/docs/components/shadow-dom/ — `createRenderRoot()` Light DOM override, verified exact syntax
- https://lit.dev/docs/components/properties/ — `static properties` syntax, Boolean/Array types, `hasChanged` reference equality
- https://lit.dev/docs/components/lifecycle/ — `connectedCallback`, `willUpdate`, `updated` usage guide
- https://lit.dev/docs/components/events/ — CustomEvent dispatch with `bubbles: true, composed: true`
- https://lit.dev/docs/ssr/authoring/ — `isServer` import, SSR guard patterns
- https://github.com/lit/lit/packages/react — `createComponent()` exact TypeScript signature, `EventName<T>` type
- https://vuejs.org/guide/extras/web-components — Vue 3 Custom Element support, property detection via `in` operator, `isCustomElement` config
- https://vite.dev/guide/build — Multi-entry lib mode, UMD restriction on multiple entries, `rolldownOptions` (Vite 8)
- npm registry — lit@3.3.2, @lit/react@1.0.8, vite-plugin-dts@4.5.4, vite@8.0.1, tsup@8.5.1 (verified 2026-03-22)

### Secondary (MEDIUM confidence)
- https://playwright.dev/docs/api/class-page — `page.addScriptTag()`, `page.setContent()`, `page.evaluate()` for inline tests
- https://lit.dev/blog/2023-10-10-lit-3.0/ — Lit 3 changelog: `createRenderRoot()` return type change, standard decorator support, IE11 drop

### Tertiary (LOW confidence)
- React 19 RSC `'use client'` requirement for `@tablecraft/react` — not verified against React 19 RSC docs; flagged as open question

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all package versions verified via npm registry; APIs verified via official Lit/Vue/Playwright docs
- Architecture: HIGH — critical build constraints (UMD multi-entry, tsup+Vue) verified via official Vite docs and package source
- Pitfalls: HIGH — `useDefineForClassFields` conflict, UMD multi-entry, tsup+Vue all confirmed via official documentation
- SSR guards: HIGH — `isServer` from `lit` confirmed via GitHub source code inspection

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable libraries; Lit and Vite release infrequently)
