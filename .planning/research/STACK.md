# Stack Research: svelte-tables-tailwind v2.0.0

**Project:** Framework-agnostic, zero-config table library
**Researched:** 2026-03-20
**Training cutoff:** August 2025 — verify version numbers before implementation
**Overall confidence:** MEDIUM-HIGH (ecosystem is stable; exact latest patch versions need verification at build time)

---

## Recommended Stack

### Core Framework

| Technology | Recommended Version | Purpose                          | Rationale                                                                                                                                                                                                                                                                     | Confidence |
| ---------- | ------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Svelte     | 5.x (runes)         | Primary component implementation | Runes replaces the `$:` reactive system with `$state`, `$derived`, `$effect` — the new model is explicit, composable, and far better for library authors because reactivity is no longer implicitly tied to the component lifecycle. Svelte 5 ships as stable since Oct 2024. | HIGH       |
| TypeScript | 5.x                 | All packages typed               | Library consumers get autocomplete and prop validation at zero runtime cost. Non-negotiable for a library targeting enterprise use.                                                                                                                                           | HIGH       |
| pnpm       | 9.x                 | Package manager + workspaces     | Fastest install, strictest dependency isolation via symlink-based `node_modules`, native workspace support without extra tooling. Chosen over npm/yarn because monorepo workflow is first-class.                                                                              | HIGH       |

### Monorepo Orchestrator

**Recommendation: pnpm workspaces alone, not Turborepo**

Rationale: Turborepo is valuable when you have 10+ packages with complex cross-package build graphs and CI caching needs. For a 4-package monorepo (`@tablecraft/core`, `@tablecraft/svelte`, `@tablecraft/react`, `@tablecraft/vue`) where builds are fast and independent, Turborepo adds configuration overhead without proportional benefit. If build times grow past 60 seconds in CI, add Turborepo later — it retrofits cleanly.

Use `pnpm workspaces` with a root `pnpm-workspace.yaml` pointing to `packages/*`. Each package maintains its own `package.json` and build script. Cross-package dependencies use `workspace:*` protocol.

Do NOT use Nx. Its generator/plugin model is designed for large enterprise repos and brings a steep configuration surface that conflicts with the "zero config" ethos of this project.

### Build Tooling

| Package             | Version | Role                             | Rationale                                                                                                                                                                                                                                                                                                          | Confidence |
| ------------------- | ------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| `@sveltejs/package` | 2.x     | Svelte package build             | The canonical tool for Svelte library authoring. Built on top of Vite, handles `.svelte` compilation, generates proper `package.json` `exports` maps, copies TypeScript declarations, and enforces the SvelteKit packaging conventions that npm users expect. NOT appropriate for the Web Components core package. | HIGH       |
| `vite`              | 5.x     | Dev server + bundler base        | Powers `@sveltejs/package` and is used directly for the Web Components (`@tablecraft/core`) build. Vite 5 uses Rollup 4 under the hood, resolving the v2 tech debt.                                                                                                                                                | HIGH       |
| `tsup`              | 8.x     | React + Vue wrapper builds       | tsup (built on esbuild) is the right tool for the thin React and Vue wrapper packages. Produces ESM + CJS + `.d.ts` in one command, zero config. esbuild's speed means sub-second rebuilds. Chosen over `unbuild` (more config) and `microbundle` (stagnant, slower, inferior tree-shaking).                       | HIGH       |
| `vite-plugin-dts`   | 4.x     | TypeScript declarations for core | Used inside the Vite build for `@tablecraft/core` (Web Components) to emit `.d.ts` files. `@sveltejs/package` handles this for the Svelte package automatically; `vite-plugin-dts` covers the gap for non-Svelte packages built with Vite directly.                                                                | MEDIUM     |

### Web Components Core

**Recommendation: Lit 3.x**

Rationale over alternatives:

- **Native Custom Elements (no library):** Technically possible and produces the smallest footprint. But reactive property → attribute syncing, observed attributes, shadow DOM lifecycle, and slotting all require substantial boilerplate that the library author must maintain and test. The risk is writing a worse version of Lit.
- **FAST Element (Microsoft):** Mature but carries a heavier API surface and is primarily adopted in Microsoft's own Fluent UI design system. Community adoption outside Microsoft's ecosystem is limited. Template binding syntax differs from standards in ways that create friction.
- **Lit 3.x:** Lit is the industry standard for Web Components in 2025. ~6KB min+gzip, reactive properties via `@property()` decorators, declarative `html` template tag, shadow DOM by default, TypeScript-first. Used by Google, Adobe, Salesforce, GitHub. The V8 team specifically optimizes for Lit's tagged template pattern. Maintained by Google's Polymer team with long-term support implied. Lit 3 dropped IE11 and aligns with TC39 decorators (stage 3).

One important nuance: for the framework-agnostic core, Lit's Shadow DOM **will cause friction** with consumer CSS frameworks (Tailwind utility classes don't pierce shadow boundaries). The recommended pattern is to use Lit's `@customElement` decorator for the custom element registration, but expose a **Light DOM mode** by setting `createRenderRoot() { return this; }` for the default export. This gives consumers full CSS access at the cost of style encapsulation — which is the right tradeoff for a table library that must integrate with arbitrary design systems.

### React Wrapper

| Package      | Version              | Purpose                        | Confidence                                                                                                                                                                                                                                       |
| ------------ | -------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| React        | 18.x / 19.x peer dep | Peer dependency                | React 19 is stable as of late 2024. The wrapper should declare `"react": ">=18.0.0"` as a peer dep to cover both.                                                                                                                                | HIGH |
| `@lit/react` | 1.x                  | Web Components → React adapter | Official Lit package that wraps a custom element as a React component, handles event name mapping (e.g., `onRowClick` → `row-click` event), and provides proper TypeScript prop types. This is the correct pattern — do NOT hand-roll a wrapper. | HIGH |

### Vue Wrapper

| Package                              | Version      | Purpose         | Confidence                                                                                                                                                                                                                                                               |
| ------------------------------------ | ------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| Vue                                  | 3.x peer dep | Peer dependency | Vue 3 handles Web Components natively in templates (no adapter needed for basic usage). However, for proper TypeScript support and event prop mapping, a thin wrapper component is still valuable.                                                                       | HIGH |
| `defineCustomElement` (Vue built-in) | N/A          | Vue → WC bridge | Vue 3 can consume custom elements directly in templates with `compilerOptions.isCustomElement`. The `@tablecraft/vue` package exports a Vue 3 SFC wrapper that adds TypeScript prop definitions on top of the raw custom element. No third-party adapter library needed. | HIGH |

### Virtual Scrolling

| Package             | Version | Purpose               | Confidence                                                                                                                                                                                                                                     |
| ------------------- | ------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| `@tanstack/virtual` | 3.x     | Virtual row rendering | TanStack Virtual is headless (no DOM opinion), framework-agnostic, and works inside Web Components. This is the right choice for 100k+ row support. It does NOT require TanStack Table — the virtualizer is an independent package. ~4KB gzip. | HIGH |

### Type Inference Engine

No external library. The auto-type inference (`string` → detect if it's a date, URL, email, number, etc.) is implemented as a pure TypeScript module in `@tablecraft/core`. Heuristics are fast enough that no external dependency is justified. A regexp-based classifier runs once per column on the first N rows (configurable, default: 50) and memoizes results.

---

## Monorepo Structure

```
tablecraft/                          # root (not published)
├── pnpm-workspace.yaml
├── package.json                     # root scripts: "build", "test", "lint"
├── tsconfig.base.json               # shared TS config
├── .eslintrc.json                   # shared lint config
│
├── packages/
│   ├── core/                        # @tablecraft/core
│   │   ├── package.json
│   │   ├── vite.config.ts           # builds to ESM + UMD via Vite
│   │   ├── src/
│   │   │   ├── elements/            # Lit custom elements
│   │   │   │   ├── TableElement.ts
│   │   │   │   └── CellElement.ts
│   │   │   ├── renderers/           # 14+ cell type renderers (tree-shakable)
│   │   │   │   ├── StringRenderer.ts
│   │   │   │   ├── NumberRenderer.ts
│   │   │   │   ├── DateRenderer.ts
│   │   │   │   └── ...
│   │   │   ├── inference/           # Type inference engine
│   │   │   │   └── infer.ts
│   │   │   ├── virtual/             # Virtual scrolling integration
│   │   │   │   └── virtualizer.ts
│   │   │   └── index.ts             # package entry
│   │   └── dist/
│   │
│   ├── svelte/                      # @tablecraft/svelte
│   │   ├── package.json
│   │   ├── svelte.config.js
│   │   ├── vite.config.ts           # @sveltejs/package handles this
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── Table.svelte     # Svelte 5 runes component
│   │   │   │   ├── types.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   └── dist/
│   │
│   ├── react/                       # @tablecraft/react
│   │   ├── package.json
│   │   ├── tsup.config.ts
│   │   ├── src/
│   │   │   ├── Table.tsx            # @lit/react wrapper
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   └── dist/
│   │
│   └── vue/                         # @tablecraft/vue
│       ├── package.json
│       ├── tsup.config.ts
│       ├── src/
│       │   ├── Table.vue            # Vue 3 SFC wrapper
│       │   ├── types.ts
│       │   └── index.ts
│       └── dist/
│
├── apps/
│   ├── docs/                        # Documentation site (SvelteKit)
│   └── playground/                  # Live playground (SvelteKit or standalone)
│
└── .planning/
```

### Package Names on npm

| Package | npm name             | Description                                 |
| ------- | -------------------- | ------------------------------------------- |
| Core    | `@tablecraft/core`   | Web Components core + type inference engine |
| Svelte  | `@tablecraft/svelte` | Svelte 5 component                          |
| React   | `@tablecraft/react`  | React 18/19 wrapper                         |
| Vue     | `@tablecraft/vue`    | Vue 3 wrapper                               |

**Rationale for `@tablecraft` scope:** The existing `svelte-tables-tailwind` name is tied to Svelte and Tailwind, which conflicts with the framework-agnostic v2 identity. A scoped package under `@tablecraft` communicates the new positioning cleanly. Verify npm scope availability before committing.

### `pnpm-workspace.yaml`

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

### Cross-package dependency example (`@tablecraft/svelte/package.json`)

```json
{
  "dependencies": {
    "@tablecraft/core": "workspace:*"
  }
}
```

---

## Build Tooling

### Per-Package Build Strategy

#### `@tablecraft/core` — Vite + vite-plugin-dts

Vite in library mode is the correct choice here. It produces ESM, CJS, and UMD outputs from a single config. The UMD build is critical for CDN/vanilla-JS consumers (`<script src="...">` usage).

```typescript
// packages/core/vite.config.ts (illustrative)
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'TablecraftCore',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: ['lit'], // Lit is a peer dep, not bundled
      output: {
        globals: { lit: 'Lit' },
      },
    },
  },
  plugins: [dts({ insertTypesEntry: true })],
});
```

Tree-shakable renderers: each renderer in `packages/core/src/renderers/` is a standalone export. The main `index.ts` does NOT re-export all renderers by default — consumers import only what they use. A `TablecraftFull` convenience export bundles all 14+ renderers for users who want the full suite.

#### `@tablecraft/svelte` — @sveltejs/package

```javascript
// packages/svelte/svelte.config.js
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
};
```

`@sveltejs/package` reads from `src/lib/` and publishes to `dist/`. It automatically generates the `exports` map in `package.json`. This is the only correct tool for Svelte library packaging — alternatives (tsup, esbuild directly) do not handle `.svelte` file compilation correctly without significant additional configuration.

#### `@tablecraft/react` and `@tablecraft/vue` — tsup

```typescript
// packages/react/tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  external: ['react', '@tablecraft/core'],
  treeshake: true,
  clean: true,
});
```

tsup over alternatives:

- **vs `unbuild`:** unbuild is excellent but requires more configuration for the `exports` map and is better suited for Node.js libraries than browser component wrappers.
- **vs `microbundle`:** microbundle has not seen major releases recently and lacks the esbuild speed. tsup is the 2025 community default for "just ship it" library builds.
- **vs `vite-plugin-dts` alone:** Not a build tool, only generates declarations.

### Output Formats per Package

| Package              | ESM | CJS | UMD | `.d.ts` | Source Maps |
| -------------------- | --- | --- | --- | ------- | ----------- |
| `@tablecraft/core`   | yes | yes | yes | yes     | yes         |
| `@tablecraft/svelte` | yes | no  | no  | yes     | yes         |
| `@tablecraft/react`  | yes | yes | no  | yes     | yes         |
| `@tablecraft/vue`    | yes | yes | no  | yes     | yes         |

CJS is included for React/Vue because many React projects (Next.js pages router, CRA) still consume CJS. The Svelte package drops CJS because SvelteKit and Svelte library consumers always use ESM.

### `package.json` exports map (example for `@tablecraft/core`)

```json
{
  "name": "@tablecraft/core",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.es.js",
      "require": "./dist/index.cjs.js",
      "types": "./dist/index.d.ts"
    },
    "./renderers/*": {
      "import": "./dist/renderers/*.js",
      "types": "./dist/renderers/*.d.ts"
    }
  },
  "files": ["dist"],
  "sideEffects": false
}
```

`"sideEffects": false` is mandatory for tree-shaking to work in Webpack and Rollup consumers.

---

## CSS Strategy

**Recommendation: CSS custom properties (design tokens) as the default, with opt-in Tailwind v4 utility classes via a separate import.**

### Rationale

The Tailwind-via-CDN approach in v1 is the single biggest adoption blocker for a library:

1. It injects a full Tailwind stylesheet into `<head>` — breaking consumers who use a different Tailwind version or no Tailwind at all.
2. Shadow DOM (if used) blocks Tailwind classes from reaching component internals.
3. It makes the library non-self-contained: Internet connectivity required at runtime.

### Strategy: CSS Custom Properties as the Default Layer

The core component ships with a minimal stylesheet (~4KB gzip max) using CSS custom properties for all visual tokens:

```css
/* @tablecraft/core/src/styles/tokens.css */
:host,
.tc-table {
  --tc-color-bg: #ffffff;
  --tc-color-border: #e5e7eb;
  --tc-color-header-bg: #f9fafb;
  --tc-color-text: #111827;
  --tc-color-text-muted: #6b7280;
  --tc-color-accent: #3b82f6;
  --tc-border-radius: 0.375rem;
  --tc-font-size-sm: 0.875rem;
  --tc-spacing-cell: 0.75rem 1rem;
}
```

Consumers theme the table by overriding these tokens in their own CSS — zero framework coupling.

### Tailwind v4 Compatibility

Tailwind v4 (released Jan 2025) is a ground-up rewrite: CSS-first configuration, no `tailwind.config.js`, uses `@import "tailwindcss"` at the CSS layer. For v2, ship a companion import that overrides the custom property tokens using Tailwind v4's design token system:

```css
/* @tablecraft/svelte/styles/tailwind-theme.css */
@import '@tablecraft/core/styles/tokens.css';
/* Override tokens with Tailwind v4 values */
.tc-table {
  --tc-color-bg: theme(colors.white);
  --tc-color-border: theme(colors.gray.200);
}
```

This is published as an optional import — consumers who use Tailwind can pull it in; those who don't are unaffected.

### What NOT to Do

- Do NOT import Tailwind in the component itself (v1's anti-pattern)
- Do NOT use Tailwind utility classes directly on internal elements — they will break for any consumer not running Tailwind
- Do NOT use CSS-in-JS (styled-components, Emotion) — adds runtime weight, incompatible with Web Components shadow DOM
- Do NOT use CSS Modules for the core Web Components package — custom elements don't support CSS Modules natively

### Summary Decision

| Layer                        | CSS Approach                                          | Why                                            |
| ---------------------------- | ----------------------------------------------------- | ---------------------------------------------- |
| `@tablecraft/core` (default) | CSS custom properties only                            | Zero-dep, universally themeable                |
| `@tablecraft/svelte`         | Scoped `<style>` + custom properties                  | Svelte's built-in CSS scoping handles the rest |
| Tailwind users               | Optional companion CSS import                         | Opt-in, Tailwind v4 compatible                 |
| Dark mode                    | `prefers-color-scheme` media query on token overrides | No JS required                                 |

---

## Testing Stack

**Recommendation: Vitest + @testing-library/svelte + Playwright**

### Unit and Component Testing

| Tool                          | Version | Purpose                     | Confidence                                                                                                                                                                  |
| ----------------------------- | ------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `vitest`                      | 2.x     | Test runner                 | Vite-native, zero config with Vite projects, ESM-first, compatible with jsdom and happy-dom environments. Replaces Jest entirely for this stack.                            | HIGH   |
| `@testing-library/svelte`     | 5.x     | Svelte component testing    | The idiomatic way to test Svelte components — renders to a real DOM environment, provides `getByRole`, `getByText`, etc. Version 5 supports Svelte 5 runes.                 | HIGH   |
| `@testing-library/user-event` | 14.x    | User interaction simulation | Click, type, keyboard navigation — simulates real user behavior rather than `fireEvent`.                                                                                    | HIGH   |
| `jsdom`                       | 25.x    | DOM environment for Vitest  | Required for component rendering tests. `happy-dom` is an alternative (faster) but has less spec compliance — jsdom is safer for a library with accessibility requirements. | HIGH   |
| `vitest-axe`                  | 1.x     | Accessibility assertions    | Wraps axe-core for `expect(element).toHaveNoViolations()` assertions in Vitest. Critical for WCAG 2.1 AA requirement.                                                       | MEDIUM |

### End-to-End Testing

| Tool               | Version | Purpose                | Confidence                                                                                                                                                                                                                            |
| ------------------ | ------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| `playwright`       | 1.x     | Cross-browser E2E      | Tests the library in real browser environments (Chromium, Firefox, WebKit). Required for verifying Web Components behavior — jsdom does not implement Shadow DOM correctly. Also used for visual regression testing of the docs site. | HIGH |
| `@playwright/test` | 1.x     | Playwright test runner | Included with Playwright.                                                                                                                                                                                                             | HIGH |

### Web Components Specific Testing

Custom elements require a real browser environment. The Playwright tests cover:

- Custom element registration and upgrade lifecycle
- Shadow DOM vs Light DOM rendering modes
- Framework integration smoke tests (React + Vue wrappers rendering correctly)
- Virtual scroll with 100k synthetic rows (performance assertion: frame budget < 16ms)

### Test Configuration

```typescript
// vitest.config.ts (root)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    workspace: [
      'packages/core/vitest.config.ts',
      'packages/svelte/vitest.config.ts',
      'packages/react/vitest.config.ts',
      'packages/vue/vitest.config.ts',
    ],
  },
});
```

Each package has its own `vitest.config.ts` that extends the root config and adds framework-specific transforms (e.g., `@sveltejs/vite-plugin-svelte` for the Svelte package).

### Coverage Target

| Area                  | Target           | Tool                            |
| --------------------- | ---------------- | ------------------------------- |
| Type inference engine | >95% line        | v8 coverage via Vitest          |
| Cell renderers        | >90% line        | v8 coverage                     |
| Svelte component      | >80% branch      | v8 coverage                     |
| React/Vue wrappers    | smoke tests only | Integration tests               |
| Accessibility         | WCAG 2.1 AA      | vitest-axe on all render states |

---

## What NOT To Use

### Build Tools

| Tool               | Why Not                                                                                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rollup 2 (current) | EOL, plugin ecosystem has moved to Rollup 4. Replaced by Vite (which uses Rollup 4 internally).                                                                        |
| `microbundle`      | Last meaningful release was 2022-era. Does not support Lit decorators or modern TS decorator syntax. tsup is the 2025 community replacement.                           |
| `unbuild`          | Solid tool but optimized for Node.js universal libraries. Requires more manual configuration than tsup for browser-first component packages with complex exports maps. |
| Webpack            | No role in library authoring. Consumers use Webpack; libraries produce raw ESM.                                                                                        |
| esbuild directly   | esbuild alone does not emit TypeScript declarations. You'd re-implement what tsup already provides.                                                                    |

### Monorepo Tools

| Tool      | Why Not                                                                                                                                                                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Turborepo | Valuable at 10+ packages. For 4 packages with fast builds, it adds YAML pipeline config complexity with no meaningful benefit. Revisit if monorepo grows past 8 packages or CI build times exceed 3 minutes.                                            |
| Nx        | Designed for large enterprise repos. Generates boilerplate via generators, introduces `project.json` per package, and has strong opinions that conflict with `@sveltejs/package`'s own conventions. The plugin surface is enormous and not needed here. |
| Lerna     | Was the monorepo standard pre-2022. Now maintained by Nrwl (Nx team) and largely superseded by pnpm workspaces for simpler repos.                                                                                                                       |

### Web Components

| Tool             | Why Not                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stencil.js       | Ionic's tool; generates its own runtime layer, outputs framework-specific wrappers automatically. Sounds ideal but: (a) the generated React/Vue output is boilerplate not custom, (b) it owns your build pipeline completely, (c) integrating with `@sveltejs/package` for the Svelte package is non-trivial since Stencil is its own compiler. Too much framework lock-in for a library that has a first-class Svelte implementation. |
| FAST Element     | Microsoft-internal adoption focus. Less community tooling, documentation gaps for non-Fluent-UI use cases. Lit is the clear community choice.                                                                                                                                                                                                                                                                                          |
| Polymer          | Deprecated by Google in favor of Lit. Do not use.                                                                                                                                                                                                                                                                                                                                                                                      |
| Angular Elements | Wraps Angular components as custom elements. Requires Angular as a dependency — would add 50KB+ to the core bundle. Nonstarter.                                                                                                                                                                                                                                                                                                        |

### CSS

| Approach                               | Why Not                                                                                                                                   |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Tailwind CDN (v1 approach)             | Injects global styles, requires internet, incompatible with Shadow DOM. The single biggest anti-pattern in the v1 codebase.               |
| CSS-in-JS (styled-components, Emotion) | Adds runtime overhead, incompatible with Web Components shadow DOM, wrong abstraction for a table library.                                |
| CSS Modules                            | Not supported inside Custom Elements natively. Works in Svelte (scoped styles) and React, but cannot be the strategy for the shared core. |
| Inline styles via `style` attribute    | Overrides are harder for consumers, no cascade, poor performance for large tables.                                                        |

### Testing

| Tool             | Why Not                                                                                                                                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Jest             | Requires significant configuration for ESM, Svelte 5, and TypeScript in 2025. Vitest is a superset with zero config in Vite projects.                                                                                       |
| Cypress          | E2E only; Playwright has better component testing support, faster execution, and better Web Components handling. Cypress is still viable but Playwright has surpassed it as the community default for new projects in 2025. |
| @web/test-runner | The Modern Web team's runner; designed specifically for Web Components. Valid alternative to Playwright for the core package but introduces another test stack. Consolidating on Playwright avoids this.                    |

### Framework Adapters

| Tool               | Why Not                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------ |
| react-shadow-root  | Niche, low maintenance. Use `@lit/react` which is official and maintained by the Lit team. |
| vue-custom-element | Pre-Vue 3 solution. Vue 3 handles custom elements natively.                                |

---

## Migration Path

### Current State (v1.0.6)

- Single `src/Tables.svelte` (~230 lines, Svelte 3 syntax)
- Rollup 2.45 build producing ESM + UMD
- No TypeScript, no tests, no monorepo
- Tailwind via CDN (anti-pattern)
- Props: `colname` (object), `rowdata` (array of arrays)
- npm package: `svelte-tables-tailwind`

### Phase 0: Repository Initialization (do not touch existing src/)

1. Initialize pnpm workspaces at the repo root
2. Create `packages/` and `apps/` directories
3. Move existing `src/` into `packages/svelte-legacy/` as a read-reference (do not publish this package; it's the reference implementation during migration)
4. Create new `packages/core/`, `packages/svelte/`, `packages/react/`, `packages/vue/` with skeleton `package.json` files
5. Set up root `tsconfig.base.json`, `.eslintrc.json`, root `package.json` with workspace scripts
6. Configure `changesets` for versioned releases (`@changesets/cli`) — this is the standard multi-package publish workflow in pnpm monorepos

### Phase 1: Core Package Bootstrap

1. Install Lit 3, `@tanstack/virtual`, TypeScript 5 in `@tablecraft/core`
2. Port the 14+ renderer logic from `returndatatype()` to individual TypeScript modules in `packages/core/src/renderers/`
3. Build the type inference engine (`packages/core/src/inference/infer.ts`)
4. Register as a Lit custom element (`tc-table`)
5. Wire Vite library mode build, verify ESM + CJS + UMD output and `.d.ts` generation
6. Write Vitest unit tests for all renderers and inference engine before writing the Svelte component

### Phase 2: Svelte 5 Package

1. Create `@tablecraft/svelte` using `@sveltejs/package`
2. Write `Table.svelte` using Svelte 5 runes (`$props()`, `$state()`, `$derived()`)
3. The Svelte component wraps `@tablecraft/core` — it does NOT re-implement rendering; it provides a Svelte-idiomatic prop API that forwards to the core
4. v1 API compatibility layer: accept `colname`/`rowdata` props and transform them to the new `data`/`columns` API internally, with a deprecation console warning

### Phase 3: React and Vue Wrappers

1. `@tablecraft/react`: Use `@lit/react` to wrap `tc-table`. Expose `<Table data={rows} columns={cols} onRowClick={handler} />` prop API.
2. `@tablecraft/vue`: Write a Vue 3 SFC that uses `tc-table` internally. Vue handles custom elements natively so this is primarily a TypeScript prop definition wrapper.
3. Add tsup build configs for both.
4. Write smoke tests with Playwright (React app + Vue app rendering the table with 100 rows).

### Phase 4: CSS Migration

1. Remove the Tailwind CDN `<svelte:head>` block entirely (the core XSS and DX issue)
2. Write `packages/core/src/styles/tokens.css` with all design tokens as CSS custom properties
3. The Svelte component uses Svelte scoped `<style>` that references the custom property tokens
4. Ship a `@tablecraft/core/styles/tailwind.css` import for Tailwind v4 consumers
5. Verify the table renders acceptably with zero CSS (structure must be readable without any styling)

### Version and API Strategy

| v1 Prop                     | v2 Equivalent                                                       | Migration                                               |
| --------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------- |
| `colname` (object)          | `columns` (object or array)                                         | Accept both; `colname` triggers deprecation warning     |
| `rowdata` (array of arrays) | `data` (array of objects preferred; array of arrays still accepted) | Auto-detect shape; array-of-arrays maps to column order |
| `url` (string)              | `rowHref` (function or string)                                      | `url` accepted with deprecation                         |
| `click` (function)          | `onRowClick` / `onCellClick`                                        | `click` accepted with deprecation                       |

The v1 → v2 migration guide documents these mappings. The goal: existing v1 consumers get a working table after upgrading, with deprecation warnings guiding them to the new API.

### npm Package Naming

The existing `svelte-tables-tailwind` package on npm should receive one final v1.x patch with a deprecation notice pointing users to `@tablecraft/svelte`. The `@tablecraft/*` scope requires registering the scope on npm before publishing.

### Toolchain Upgrade Summary

| v1 Tool                        | v2 Replacement                          | Why                                  |
| ------------------------------ | --------------------------------------- | ------------------------------------ |
| Svelte 3.37                    | Svelte 5 (runes)                        | EOL, missing runes, missing TS       |
| Rollup 2.45                    | Vite 5 (Rollup 4 internally)            | Modern plugin API, much faster dev   |
| `rollup-plugin-svelte` 7       | `@sveltejs/vite-plugin-svelte`          | Official Svelte 5 plugin             |
| `rollup-plugin-node-resolve` 5 | Built into Vite                         | No explicit config needed            |
| `rollup-plugin-css-only`       | Svelte scoped styles + CSS custom props | No CSS extraction needed             |
| `@rollup/plugin-commonjs` 18   | Not needed (ESM-first)                  | Consumers use ESM                    |
| npm                            | pnpm                                    | Workspace support, speed, strictness |
| No tests                       | Vitest + Testing Library + Playwright   | Full coverage                        |
| No TypeScript                  | TypeScript 5                            | All packages typed                   |
| Tailwind CDN                   | CSS custom properties                   | Self-contained, framework-agnostic   |

---

## Sources

**Note:** WebSearch and WebFetch were unavailable during this research session. All findings are based on training data (cutoff August 2025). The following are the authoritative sources that should be verified before implementation — version numbers in particular should be checked at the time of dependency installation.

| Topic                     | Authoritative Source                                          | What to Verify                                    |
| ------------------------- | ------------------------------------------------------------- | ------------------------------------------------- |
| Svelte 5 runes            | https://svelte.dev/docs/runes                                 | API stability, any breaking changes post-Aug 2025 |
| `@sveltejs/package`       | https://svelte.dev/docs/kit/packaging                         | Current version, exports map behavior             |
| Lit 3                     | https://lit.dev/docs/components/overview/                     | Bundle size, decorator support status             |
| `@lit/react`              | https://lit.dev/docs/frameworks/react/                        | Current version, React 19 compatibility           |
| pnpm workspaces           | https://pnpm.io/workspaces                                    | Workspace protocol behavior                       |
| tsup                      | https://tsup.egoist.dev                                       | Current version, esbuild version bundled          |
| `@tanstack/virtual`       | https://tanstack.com/virtual/latest                           | Current API, Web Components usage                 |
| Tailwind v4               | https://tailwindcss.com/blog/tailwindcss-v4                   | Token API, `@import` behavior                     |
| Vitest                    | https://vitest.dev                                            | Current version, workspace config                 |
| `@testing-library/svelte` | https://testing-library.com/docs/svelte-testing-library/intro | Svelte 5 runes support                            |
| Playwright                | https://playwright.dev                                        | Web Components support, version                   |
| `@changesets/cli`         | https://github.com/changesets/changesets                      | pnpm workspace integration                        |
| Turborepo                 | https://turbo.build/repo                                      | Would need re-evaluation at 8+ packages           |

**Confidence summary:**

- Stack choices: HIGH — these tools have been stable and dominant since mid-2024
- Exact version numbers: MEDIUM — verify at installation time; patch versions change frequently
- Web Components light DOM pattern: MEDIUM — functional but less documented; verify Lit 3 `createRenderRoot` API
- `@lit/react` React 19 compatibility: MEDIUM — React 19 was new at training cutoff; verify current status
- Tailwind v4 token integration: MEDIUM — Tailwind v4 was newly released at training cutoff; verify current CSS token API
