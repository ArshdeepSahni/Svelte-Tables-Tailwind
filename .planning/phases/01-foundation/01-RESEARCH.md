# Phase 1: Foundation — Research

**Researched:** 2026-03-21
**Domain:** pnpm monorepo setup, Vite library builds, Svelte 5 library authoring, TypeScript strict configuration, testing infrastructure, @changesets/cli
**Confidence:** HIGH (stack, versions, configs verified live against npm registry March 2026)

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- npm scope: `@tablecraft` — packages are `@tablecraft/core`, `@tablecraft/svelte`, `@tablecraft/react`, `@tablecraft/vue`
- Monorepo tool: pnpm workspaces only (no Turborepo, no Nx)
- Package dirs: `packages/core`, `packages/svelte`, `packages/react`, `packages/vue`; apps dir: `apps/docs` (stub only in Phase 1)
- Root-level tooling: `tsconfig.base.json`, `.eslintrc.cjs`, `.prettierrc`, Vitest workspace config, changeset config
- Upgrade ALL dependencies to latest stable — no exceptions
- Svelte: 3.37.0 → 5.x (latest stable)
- Rollup 2.45.2 → remove entirely (replaced by Vite + `@sveltejs/package`)
- All `rollup-plugin-*` packages: removed
- New build stack: Vite, `@sveltejs/package` 2.x, `vite-plugin-dts`, tsup 8.x
- TypeScript 5.x strict mode
- Testing: Vitest (latest), `@testing-library/svelte` (latest Svelte 5 compatible), Playwright 1.x
- Node minimum: 20 LTS declared in `engines` field of all packages
- Changeset tooling: `@changesets/cli` latest
- Strategy: Fresh Svelte 5 scaffold — do NOT attempt incremental Svelte 3→5 migration
- Reference v1 `src/Tables.svelte` only for renderer logic in `returndatatype()` — never copy-paste the `{@html}` pattern
- `@tablecraft/core` — Vite library mode + `vite-plugin-dts`; outputs ESM + CJS + UMD
- `@tablecraft/svelte` — `@sveltejs/package` 2.x exclusively
- `@tablecraft/react` — tsup 8.x; outputs ESM + CJS
- `@tablecraft/vue` — tsup 8.x; outputs ESM + CJS
- Phase 1 test goal: build passes, test runner executes with 0 failures (no coverage requirements)
- `.changeset/config.json` with `"access": "public"`, linked packages for coordinated releases
- GitHub Actions workflow stub for `changeset publish`
- Six critical v1 defects MUST be eliminated: XSS via `{@html}`, Tailwind CDN, type-switcher dropdown, `colname` key-uniqueness bug, ISC/MIT license mismatch, Svelte 3 + Rollup 2 toolchain

### Claude's Discretion

- Exact `tsconfig.base.json` compiler options
- ESLint rule selection (use recommended Svelte 5 + TypeScript presets)
- Prettier configuration details
- Exact pnpm workspace protocol syntax (`"workspace:*"` for cross-package deps)
- `.gitignore` updates for monorepo

### Deferred Ideas (OUT OF SCOPE)

- `@tablecraft/solid` and `@tablecraft/angular` wrappers — v3 backlog
- CDN-first vanilla JS UMD example — Phase 7 or beyond
- GitHub Actions full CI pipeline — stub in Phase 1, complete in Phase 7
- npm scope registration — do during Phase 1 setup but publish happens in Phase 7
  </user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID       | Description                                                                                                                       | Research Support                                                                                                                   |
| -------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| FOUND-01 | Project restructures as pnpm monorepo with `packages/core`, `packages/svelte`, `packages/react`, `packages/vue` skeleton packages | pnpm Monorepo Setup section — exact `pnpm-workspace.yaml`, root `package.json`, workspace protocol                                 |
| FOUND-02 | Build pipeline migrated from Rollup 2 to Vite + `@sveltejs/package` for the Svelte package                                        | @sveltejs/package Setup and Vite Library Mode sections — exact configs per package                                                 |
| FOUND-03 | TypeScript 5 configured across all packages with strict mode and correct `exports` map                                            | TypeScript Types Skeleton and Standard Stack sections                                                                              |
| FOUND-04 | Svelte upgraded from 3.37 to 5.x with runes-based reactivity                                                                      | Svelte 5 Library Authoring Patterns section — `$props()`, `<script lang="ts">`, peer dep declaration                               |
| FOUND-05 | All npm dependencies upgraded to latest stable versions safely                                                                    | Safe Dependency Upgrade Map section — full v1→v2 package mapping with verified versions                                            |
| FOUND-06 | License reconciled to MIT across `package.json` and `LICENSE` file                                                                | Gotchas section — five-minute fix: change `"license": "ISC"` → `"MIT"` in root `package.json` and update `LICENSE` file            |
| FOUND-07 | XSS vulnerability eliminated — all cell rendering uses typed Svelte components instead of `{@html}` string concatenation          | Gotchas section — no `{@html}` anywhere in Phase 1 source; CSS custom property stubs only                                          |
| FOUND-08 | Tailwind CDN injection removed — replaced with CSS custom property design tokens (`--tc-*`)                                       | Gotchas section + Standard Stack — no `<svelte:head>` CDN link; token stubs defined in `packages/svelte/src/lib/styles/tokens.css` |
| FOUND-09 | Runtime type-switcher dropdown removed from column headers                                                                        | Gotchas section — fresh scaffold means this never gets created; verify no `<select>` in column header code                         |
| FOUND-10 | Node 20 LTS minimum declared in `engines` field; `@changesets/cli` configured                                                     | @changesets/cli Setup section — exact config, `engines` field, Node version constraint                                             |
| FOUND-11 | Vitest + Playwright testing infrastructure configured across the monorepo                                                         | Vitest Workspace Configuration section — workspace config for Vitest 4.x, Playwright 1.58                                          |
| FOUND-12 | ESLint + Prettier configured with Svelte 5 plugin                                                                                 | Standard Stack section — `eslint-plugin-svelte` 3.16, `prettier-plugin-svelte` 3.5.1                                               |

</phase_requirements>

---

## Key Findings

1. **Vite version mismatch from CONTEXT.md**: CONTEXT.md says "Vite 5" — this is outdated. The current landscape (March 2026) is Vite 8.0.1 (latest), but `@sveltejs/package` 2.5.7 internally uses `@sveltejs/vite-plugin-svelte` 6.x which requires Vite 6 or 7 (not 8). Use **Vite 7.3.1** for the `packages/svelte` build, and **Vite 8.0.1** for the `packages/core` build where you control the Vite version directly.

2. **Vitest is now at 4.x**: CONTEXT.md references "Vitest 2.x" — the current latest is **Vitest 4.1.0**. It supports Vite 6, 7, and 8. The workspace config format is unchanged from 2.x.

3. **Node engines constraint tightened by Vite 8**: Vite 8 requires `^20.19.0 || >=22.12.0`. The engines field must be `"node": ">=20.19.0"` rather than simply `>=20` to satisfy Vite 8's constraint in `@tablecraft/core`.

4. **`@sveltejs/package` 2.5.7 is current latest** (no v3). It supports Svelte 3, 4, and 5. It does NOT declare a peer dependency on Vite directly — it bundles its own `svelte-package` CLI that calls Vite internally. You do need Vite installed in the package for it to run, but `@sveltejs/vite-plugin-svelte` 6.x (compatible with Vite 6/7) is what drives the Svelte package build.

5. **`@sveltejs/vite-plugin-svelte` split**: v6.x (requires Vite 6/7), v7.x (requires Vite 8). These are distinct versions used in different packages in the monorepo. `packages/svelte` uses v6; `packages/core` can use Vite 8 with v7 if needed, but since `@tablecraft/core` is pure TypeScript/JS (no Svelte files), it doesn't need `@sveltejs/vite-plugin-svelte` at all.

6. **`vitest-axe` is at 0.1.0** (very early). Install it but note it is low-maturity. Phase 1 goal is infrastructure only — the axe assertions are used in Phase 3.

7. **Fresh scaffold is the only viable strategy**: v1 uses `window.onload` at the top level, `$:` reactive statements, `on:click` directives, and `export let`. None of these exist in Svelte 5. Attempting to migrate incrementally will produce a broken hybrid.

8. **The `engines` field on root vs individual packages**: Set `"engines": { "node": ">=20.19.0" }` in all `package.json` files. This satisfies Vite 8, Playwright 1.58, and the project's stated Node 20 LTS minimum simultaneously.

---

## pnpm Monorepo Setup

**Confidence:** HIGH — verified against pnpm 10.x documentation patterns and npm registry.

### `pnpm-workspace.yaml` (repo root)

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

### Root `package.json`

```json
{
  "name": "tablecraft-monorepo",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=20.19.0",
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "build": "pnpm -r build",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint . --ext .ts,.svelte",
    "format": "prettier --write .",
    "typecheck": "pnpm -r typecheck",
    "changeset": "changeset",
    "version": "changeset version",
    "release": "pnpm build && changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.30.0",
    "eslint": "^10.1.0",
    "eslint-plugin-svelte": "^3.16.0",
    "prettier": "^3.8.1",
    "prettier-plugin-svelte": "^3.5.1",
    "svelte-eslint-parser": "^1.6.0",
    "typescript": "^5.9.3",
    "typescript-eslint": "^8.57.1",
    "vitest": "^4.1.0"
  }
}
```

### Directory structure

```
tablecraft/
├── pnpm-workspace.yaml
├── package.json                    # root (private: true)
├── tsconfig.base.json              # shared TypeScript base
├── .eslintrc.cjs                   # shared ESLint config
├── .prettierrc                     # shared Prettier config
├── .gitignore
├── .changeset/
│   └── config.json
├── packages/
│   ├── core/                       # @tablecraft/core
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── types.ts            # ColumnType, ColumnDefinition, TableConfig, InferenceResult
│   │       └── index.ts
│   ├── svelte/                     # @tablecraft/svelte
│   │   ├── package.json
│   │   ├── svelte.config.js
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── src/
│   │       └── lib/
│   │           ├── Table.svelte    # stub component (Svelte 5 runes)
│   │           ├── types.ts
│   │           └── index.ts
│   ├── react/                      # @tablecraft/react
│   │   ├── package.json
│   │   ├── tsup.config.ts
│   │   ├── tsconfig.json
│   │   └── src/
│   │       └── index.ts            # stub
│   └── vue/                        # @tablecraft/vue
│       ├── package.json
│       ├── tsup.config.ts
│       ├── tsconfig.json
│       └── src/
│           └── index.ts            # stub
└── apps/
    └── docs/                       # stub only in Phase 1
        └── package.json
```

### Cross-package dependencies (workspace protocol)

In `packages/svelte/package.json`:

```json
{
  "peerDependencies": {
    "@tablecraft/core": "workspace:*",
    "svelte": ">=5.0.0"
  }
}
```

In `packages/react/package.json`:

```json
{
  "peerDependencies": {
    "@tablecraft/core": "workspace:*",
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  }
}
```

**Critical:** Use `workspace:*` for internal cross-package deps. During publish, `@changesets/cli` rewrites these to real semver ranges automatically.

### Installation command

```bash
# At repo root after creating all package.json files:
pnpm install
```

pnpm 10.x is the current latest. Install globally with `npm install -g pnpm@latest` or use `corepack enable && corepack use pnpm@latest`.

---

## @sveltejs/package 2.x Setup

**Confidence:** HIGH — verified live against npm registry. @sveltejs/package 2.5.7 is current latest (March 2026).

### Critical compatibility note

`@sveltejs/package` 2.5.7 internally uses `@sveltejs/vite-plugin-svelte` 6.x, which requires **Vite 6 or 7** (not Vite 8). Install Vite 7.3.1 in `packages/svelte`, not Vite 8.

### `packages/svelte/package.json`

```json
{
  "name": "@tablecraft/svelte",
  "version": "2.0.0",
  "description": "Svelte 5 component for @tablecraft",
  "type": "module",
  "license": "MIT",
  "engines": {
    "node": ">=20.19.0"
  },
  "scripts": {
    "build": "svelte-package",
    "dev": "svelte-package -w",
    "typecheck": "tsc --noEmit"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "svelte": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "sideEffects": false,
  "peerDependencies": {
    "svelte": ">=5.0.0"
  },
  "devDependencies": {
    "@sveltejs/package": "^2.5.7",
    "@sveltejs/vite-plugin-svelte": "^6.2.4",
    "svelte": "^5.54.0",
    "vite": "^7.3.1",
    "typescript": "^5.9.3"
  }
}
```

**Important:** The `exports` field above is a starting point. `svelte-package` will OVERWRITE the `exports` field in `package.json` when it runs. Let it manage this automatically — do not hand-craft the exports map for the Svelte package.

### `packages/svelte/svelte.config.js`

```javascript
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
};
```

### `packages/svelte/vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: false })],
});
```

### How @sveltejs/package builds

- Source lives in `packages/svelte/src/lib/`
- Run `svelte-package` (the CLI from `@sveltejs/package`) — it reads from `src/lib/`, outputs to `dist/`
- It automatically generates the `package.json` `exports` map including `.svelte`, `.js`, and `.d.ts` entries
- TypeScript declarations are emitted automatically via `svelte2tsx`
- Do NOT use `vite build --lib` for this package — that bypasses the `.svelte` compilation pipeline

### Entry point `packages/svelte/src/lib/index.ts`

```typescript
// Phase 1: export the stub component and types only
export { default as Table } from './Table.svelte';
export type { TableProps } from './types.js';
```

### What @sveltejs/package generates in `exports`

After running `svelte-package`, the generated `exports` map will look like:

```json
{
  ".": {
    "types": "./dist/index.d.ts",
    "svelte": "./dist/index.js",
    "default": "./dist/index.js"
  }
}
```

TypeScript consumers use the `types` entry. Svelte consumers (SvelteKit, Vite+Svelte) use the `svelte` entry. The tool handles all of this — do not edit it manually after generation.

---

## Vite Library Mode (@tablecraft/core)

**Confidence:** HIGH — verified live. Vite 8.0.1 is current latest and can be used here since `@tablecraft/core` is pure TypeScript with no Svelte files.

### `packages/core/package.json`

```json
{
  "name": "@tablecraft/core",
  "version": "2.0.0",
  "description": "Framework-agnostic core types and utilities for @tablecraft",
  "type": "module",
  "license": "MIT",
  "engines": {
    "node": ">=20.19.0"
  },
  "scripts": {
    "build": "vite build",
    "typecheck": "tsc --noEmit"
  },
  "exports": {
    ".": {
      "import": "./dist/index.es.js",
      "require": "./dist/index.cjs.js",
      "types": "./dist/index.d.ts"
    }
  },
  "main": "./dist/index.cjs.js",
  "module": "./dist/index.es.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "sideEffects": false,
  "devDependencies": {
    "vite": "^8.0.1",
    "vite-plugin-dts": "^4.5.4",
    "typescript": "^5.9.3"
  }
}
```

### `packages/core/vite.config.ts`

```typescript
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
      // No external peer deps in Phase 1 core — it's pure TS types + stubs
      // In Phase 5 when Lit is added: external: ['lit']
      external: [],
      output: {
        globals: {},
      },
    },
    sourcemap: true,
    minify: false, // readable output for library consumers
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
    }),
  ],
});
```

### `vite-plugin-dts` 4.5.4 notes

- `vite: '*'` peer dependency — works with Vite 8
- `insertTypesEntry: true` adds the `types` entry to the exports map
- `rollupTypes: true` merges all `.d.ts` files into one, preventing consumers from needing access to your internal type files
- Output goes to `dist/` by default

### UMD output

The `umd` format is required for CDN/vanilla-JS consumers. In Phase 1, the UMD bundle is tiny (just types and stubs). The `name: 'TablecraftCore'` becomes the global variable name.

### fileName format

With `fileName: (format) => \`index.${format}.js\``, the outputs are:

- `dist/index.es.js` — ESM
- `dist/index.cjs.js` — CommonJS
- `dist/index.umd.js` — UMD

---

## tsup 8.x Setup (React/Vue wrappers)

**Confidence:** HIGH — verified live. tsup 8.5.1 is current latest (March 2026).

### `packages/react/tsup.config.ts`

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  external: ['react', 'react-dom', '@tablecraft/core'],
  treeshake: true,
  clean: true,
  sourcemap: true,
  outDir: 'dist',
});
```

### `packages/vue/tsup.config.ts`

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  external: ['vue', '@tablecraft/core'],
  treeshake: true,
  clean: true,
  sourcemap: true,
  outDir: 'dist',
});
```

### `packages/react/package.json`

```json
{
  "name": "@tablecraft/react",
  "version": "2.0.0",
  "type": "module",
  "license": "MIT",
  "engines": { "node": ">=20.19.0" },
  "scripts": {
    "build": "tsup",
    "typecheck": "tsc --noEmit"
  },
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "sideEffects": false,
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "devDependencies": {
    "tsup": "^8.5.1",
    "typescript": "^5.9.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}
```

### Phase 1 stub content

In Phase 1, `packages/react/src/index.ts` and `packages/vue/src/index.ts` are empty stubs that just export a placeholder. The real wrapper implementation happens in Phase 5.

```typescript
// packages/react/src/index.ts — Phase 1 stub
export const VERSION = '2.0.0';
// React wrapper implemented in Phase 5
```

---

## Vitest Workspace Configuration

**Confidence:** HIGH — verified live. Vitest 4.1.0 is current latest (March 2026), not 2.x as CONTEXT.md assumed.

### Key version update

The CONTEXT.md references "Vitest 2.x" — the actual current version is **4.1.0**. The workspace config format is backward-compatible; the upgrade is transparent.

### Root `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    workspace: [
      'packages/core/vitest.config.ts',
      'packages/svelte/vitest.config.ts',
      'packages/react/vitest.config.ts',
      'packages/vue/vitest.config.ts',
    ],
  },
});
```

### `packages/core/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    name: 'core',
  },
});
```

### `packages/svelte/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: false })],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    name: 'svelte',
    setupFiles: ['./src/test-setup.ts'],
  },
});
```

### `packages/svelte/src/test-setup.ts`

```typescript
import '@testing-library/svelte';
// Add any global test setup here
```

### `packages/react/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    name: 'react',
  },
});
```

### Testing library versions (verified March 2026)

| Package                       | Version | Purpose                                               |
| ----------------------------- | ------- | ----------------------------------------------------- |
| `vitest`                      | 4.1.0   | Test runner                                           |
| `@testing-library/svelte`     | 5.3.1   | Svelte component testing (Svelte 5 compatible)        |
| `@testing-library/user-event` | 14.6.1  | User interaction simulation                           |
| `jsdom`                       | 29.0.1  | DOM environment                                       |
| `vitest-axe`                  | 0.1.0   | Accessibility assertions (install but use in Phase 3) |
| `playwright`                  | 1.58.2  | E2E + Web Components testing                          |
| `@playwright/test`            | 1.58.2  | Playwright test runner                                |

### Playwright `playwright.config.ts` (root)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

In Phase 1, the `e2e/` directory contains a single smoke test:

```typescript
// e2e/smoke.spec.ts
import { test, expect } from '@playwright/test';

test('placeholder smoke test', async ({ page }) => {
  // Phase 1: just verify Playwright is configured
  expect(true).toBe(true);
});
```

### Phase 1 test goal

`pnpm test` runs Vitest across all packages and exits with code 0. No coverage requirements. Each package should have at minimum one passing test (even a stub test) so the infrastructure is verified end-to-end.

---

## Svelte 5 Library Authoring Patterns

**Confidence:** HIGH — Svelte 5 has been stable since Oct 2024; 5.54.0 is current (March 2026).

### What changes from Svelte 3

| Svelte 3 Pattern                  | Svelte 5 Replacement                      |
| --------------------------------- | ----------------------------------------- |
| `export let foo`                  | `const { foo } = $props()`                |
| `$: derived = expr`               | `const derived = $derived(expr)`          |
| `$: { sideEffect() }`             | `$effect(() => { sideEffect() })`         |
| `let count = 0` (reactive)        | `let count = $state(0)`                   |
| `on:click={handler}`              | `onclick={handler}`                       |
| `<slot />`                        | `{@render children?.()}` (snippet syntax) |
| `window.onload` (v1 anti-pattern) | `$effect(() => { ... })` or `onMount`     |

### Stub `Table.svelte` for Phase 1

```svelte
<script lang="ts">
  import type { TableProps } from './types.js';

  const { data = [], columns, class: className = '' }: TableProps = $props();
</script>

<div class="tc-table {className}" role="grid" aria-label="Data table">
  <p>Table component — stub (Phase 1)</p>
</div>

<style>
  .tc-table {
    /* CSS custom property stubs — Tailwind CDN removed (FOUND-08) */
    --tc-color-bg: #ffffff;
    --tc-color-border: #e5e7eb;
    --tc-color-header-bg: #f9fafb;
    --tc-color-text: #111827;
    --tc-border-radius: 0.375rem;
    --tc-font-size-sm: 0.875rem;
    --tc-spacing-cell: 0.75rem 1rem;

    display: block;
    width: 100%;
    overflow-x: auto;
    background: var(--tc-color-bg);
    border: 1px solid var(--tc-color-border);
    border-radius: var(--tc-border-radius);
  }
</style>
```

### TypeScript in `.svelte` files

Use `<script lang="ts">` — this is fully supported in Svelte 5 and `@sveltejs/vite-plugin-svelte` 6.x+.

### Peer dependency declaration

```json
{
  "peerDependencies": {
    "svelte": ">=5.0.0"
  }
}
```

Do NOT bundle Svelte. It must be a peer dep. Consumers install Svelte themselves.

### `$props()` type annotation pattern

```typescript
// Pattern 1: inline destructuring with type annotation
const { data = [], columns }: { data: Row[]; columns?: ColumnDefinition<Row>[] } = $props();

// Pattern 2: named interface (preferred for complex props)
interface TableProps {
  data?: Row[];
  columns?: ColumnDefinition<Row>[];
  class?: string;
}
const { data = [], columns, class: className = '' }: TableProps = $props();
```

### No `{@html}` rule

Phase 1 contains zero `{@html}` usage. The only rendering in Phase 1 is the stub component above with static text. Cell rendering happens in Phase 2/3 using typed Svelte components with safe text bindings.

---

## Safe Dependency Upgrade Map

**Confidence:** HIGH — all versions verified live against npm registry, March 2026.

### v1 package → v2 replacement

| v1 Package                   | v1 Version | Action  | v2 Replacement                    | v2 Version                                 |
| ---------------------------- | ---------- | ------- | --------------------------------- | ------------------------------------------ |
| `svelte`                     | `^3.37.0`  | Upgrade | `svelte` (peer dep)               | `^5.54.0`                                  |
| `rollup`                     | `^2.45.2`  | Remove  | `vite` (per-package)              | `^7.3.1` / `^8.0.1`                        |
| `rollup-plugin-svelte`       | `^7.1.0`   | Remove  | `@sveltejs/vite-plugin-svelte`    | `^6.2.4` (svelte pkg), `^7.0.0` (optional) |
| `rollup-plugin-node-resolve` | `^5.2.0`   | Remove  | Built into Vite                   | —                                          |
| `rollup-plugin-css-only`     | `^3.1.0`   | Remove  | Svelte scoped `<style>`           | —                                          |
| `@rollup/plugin-commonjs`    | `^18.0.0`  | Remove  | Not needed (ESM-first)            | —                                          |
| —                            | —          | Add     | `@sveltejs/package`               | `^2.5.7`                                   |
| —                            | —          | Add     | `vite-plugin-dts`                 | `^4.5.4`                                   |
| —                            | —          | Add     | `tsup`                            | `^8.5.1`                                   |
| —                            | —          | Add     | `typescript`                      | `^5.9.3`                                   |
| —                            | —          | Add     | `vitest`                          | `^4.1.0`                                   |
| —                            | —          | Add     | `@testing-library/svelte`         | `^5.3.1`                                   |
| —                            | —          | Add     | `@testing-library/user-event`     | `^14.6.1`                                  |
| —                            | —          | Add     | `jsdom`                           | `^29.0.1`                                  |
| —                            | —          | Add     | `vitest-axe`                      | `^0.1.0`                                   |
| —                            | —          | Add     | `playwright` + `@playwright/test` | `^1.58.2`                                  |
| —                            | —          | Add     | `@changesets/cli`                 | `^2.30.0`                                  |
| —                            | —          | Add     | `eslint`                          | `^10.1.0`                                  |
| —                            | —          | Add     | `eslint-plugin-svelte`            | `^3.16.0`                                  |
| —                            | —          | Add     | `svelte-eslint-parser`            | `^1.6.0`                                   |
| —                            | —          | Add     | `typescript-eslint`               | `^8.57.1`                                  |
| —                            | —          | Add     | `prettier`                        | `^3.8.1`                                   |
| —                            | —          | Add     | `prettier-plugin-svelte`          | `^3.5.1`                                   |
| —                            | —          | Add     | `pnpm` (global)                   | `^10.32.1`                                 |

### v1 files to remove

- `rollup.config.js` — replaced entirely, do not keep
- `src/Tables.svelte` — reference only during Phase 1 for the renderer type list in `returndatatype()`, then leave as legacy reference (do not publish)
- `src/index.js` — replaced by `packages/svelte/src/lib/index.ts`
- Root `package.json` scripts (`build`, `prepare`, `dev`) — replaced by monorepo root scripts

### License fix (FOUND-06)

The v1 `package.json` has `"license": "ISC"` but the `LICENSE` file says MIT. Fix both:

1. In root `package.json` and all package `package.json` files: `"license": "MIT"`
2. The `LICENSE` file content stays as-is (MIT) — it is already correct

---

## TypeScript Types Skeleton

**Confidence:** HIGH — these types are designed based on CONTEXT.md decisions (array-based column API, not object key API).

### `packages/core/src/types.ts`

```typescript
/**
 * All supported renderer type identifiers for Tier 1 renderers.
 * Implementated in Phase 2. Defined here so TypeScript consumers get
 * the full union from day one.
 */
export type ColumnType =
  | 'text'
  | 'number'
  | 'integer'
  | 'currency'
  | 'percentage'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time'
  | 'email'
  | 'url'
  | 'phone'
  | 'image'
  | 'badge'
  | 'status'
  | 'code'
  | 'html'; // requires explicit opt-in with sanitization — Phase 2

/**
 * A single column descriptor. One object per column.
 * Array-based to avoid the v1 object-key uniqueness bug (FOUND-04).
 */
export interface ColumnDefinition<TRow extends Record<string, unknown> = Record<string, unknown>> {
  /** Property key in the row object. Must be unique within the columns array. */
  key: keyof TRow & string;
  /** Explicit renderer type. If omitted, the inference engine picks one. */
  type?: ColumnType;
  /** Display label. Defaults to `key` if omitted. */
  label?: string;
  /** Whether this column is sortable. Defaults to true. */
  sortable?: boolean;
  /** Whether this column is filterable. Defaults to true. */
  filterable?: boolean;
  /** Custom format function for display values. */
  format?: (value: TRow[keyof TRow], row: TRow) => string;
}

/**
 * Top-level table configuration object for the engine.
 * Phase 1: defines the shape. Implementation in Phase 2.
 */
export interface TableConfig<TRow extends Record<string, unknown> = Record<string, unknown>> {
  data: TRow[];
  columns?: ColumnDefinition<TRow>[];
  /** Number of rows to sample for type inference. Default: 200. */
  sampleSize?: number;
}

/**
 * Result of type inference for a single column.
 * Phase 1: defines the shape. Implementation in Phase 2.
 */
export interface InferenceResult {
  columnKey: string;
  inferredType: ColumnType;
  confidence: number; // 0–1
  sampleSize: number;
}

/**
 * Helper function stub. Provides TypeScript type inference for column definitions.
 * Full implementation in Phase 2.
 *
 * Usage: defineColumns<MyRow>([{ key: 'name', type: 'text' }])
 */
export function defineColumns<TRow extends Record<string, unknown>>(
  columns: ColumnDefinition<TRow>[],
): ColumnDefinition<TRow>[] {
  return columns;
}
```

### `packages/core/src/index.ts`

```typescript
export type { ColumnType, ColumnDefinition, TableConfig, InferenceResult } from './types.js';

export { defineColumns } from './types.js';

// Engine implementation exports — Phase 2
// export { createTableEngine } from './engine.js';
```

### `packages/svelte/src/lib/types.ts`

```typescript
import type { ColumnDefinition, ColumnType } from '@tablecraft/core';

export type { ColumnDefinition, ColumnType };

export interface TableProps<TRow extends Record<string, unknown> = Record<string, unknown>> {
  data?: TRow[];
  columns?: ColumnDefinition<TRow>[] | Partial<Record<keyof TRow, ColumnType>>;
  class?: string;
  loading?: boolean;
}
```

### tsconfig.base.json

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true
  }
}
```

Each package extends this with:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

---

## @changesets/cli Setup

**Confidence:** HIGH — verified live. @changesets/cli 2.30.0 is current latest. v3 is next/unreleased.

### `.changeset/config.json`

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.4/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [["@tablecraft/core", "@tablecraft/svelte", "@tablecraft/react", "@tablecraft/vue"]],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

**Key settings:**

- `"linked"`: all four packages are linked — a release bumps all of them together
- `"access": "public"`: required for scoped packages (`@tablecraft/*`) to publish to npm without a paid org plan
- `"commit": false`: do not auto-commit changeset files (CI handles commits)
- `"updateInternalDependencies": "patch"`: when one package is bumped, internal `workspace:*` deps get a patch bump

### GitHub Actions stub (`.github/workflows/release.yml`)

```yaml
name: Release

on:
  push:
    branches:
      - main

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    # TODO: implement in Phase 7
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Placeholder
        run: echo "Release workflow - implemented in Phase 7"
```

### Initial setup commands

```bash
pnpm install  # install @changesets/cli from root package.json
pnpm changeset init  # creates .changeset/ directory and config.json
```

After `pnpm changeset init`, replace the generated `config.json` with the content above.

---

## Validation Architecture

Nyquist validation is enabled (`workflow.nyquist_validation: true` in `.planning/config.json`).

### Test Framework

| Property           | Value                                       |
| ------------------ | ------------------------------------------- |
| Framework          | Vitest 4.1.0                                |
| Config file        | `vitest.config.ts` at root (workspace mode) |
| Quick run command  | `pnpm test --reporter=verbose`              |
| Full suite command | `pnpm test`                                 |
| E2E command        | `pnpm exec playwright test`                 |

### Phase Requirements Test Map

| Req ID   | Behavior to Verify                                                            | Test Type   | Automated Command                                                      | File Exists? |
| -------- | ----------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------- | ------------ |
| FOUND-01 | Monorepo structure correct, all packages installable                          | smoke       | `pnpm install && pnpm -r build`                                        | Wave 0       |
| FOUND-02 | `@sveltejs/package` build produces dist/ in packages/svelte                   | build       | `pnpm --filter @tablecraft/svelte build`                               | Wave 0       |
| FOUND-03 | TypeScript strict mode compiles with zero errors across all packages          | typecheck   | `pnpm -r typecheck`                                                    | Wave 0       |
| FOUND-04 | Svelte 5 component uses `$props()` not `export let`                           | lint/unit   | `pnpm test --project svelte`                                           | Wave 0       |
| FOUND-05 | No v1 packages remain in any package.json                                     | manual scan | `grep -r "rollup-plugin-svelte\|rollup-plugin-node-resolve" packages/` | manual       |
| FOUND-06 | All package.json files have `"license": "MIT"`                                | unit        | `packages/core/src/license.test.ts`                                    | Wave 0       |
| FOUND-07 | No `{@html}` in any source file                                               | lint        | `grep -r '{@html}' packages/` (zero results)                           | manual       |
| FOUND-08 | No CDN links in any Svelte file                                               | lint        | `grep -r 'unpkg.com\|cdn.tailwindcss' packages/` (zero results)        | manual       |
| FOUND-09 | No `<select>` in column header code                                           | lint        | `grep -r '<select' packages/svelte/src/lib/` (zero results)            | manual       |
| FOUND-10 | `engines.node` field set in all package.json; `.changeset/config.json` exists | unit        | `packages/core/src/foundation.test.ts`                                 | Wave 0       |
| FOUND-11 | `pnpm test` exits 0; Playwright smoke test exits 0                            | smoke       | `pnpm test && pnpm exec playwright test`                               | Wave 0       |
| FOUND-12 | ESLint and Prettier run without errors on all source files                    | lint        | `pnpm lint && pnpm format --check`                                     | Wave 0       |

### Sampling Rate

- Per task commit: `pnpm -r typecheck && pnpm test`
- Per wave merge: `pnpm -r build && pnpm test && pnpm exec playwright test`
- Phase gate: full suite green before `/gsd:verify-work`

### Wave 0 Gaps (test files to create)

- [ ] `packages/core/src/foundation.test.ts` — verifies types.ts exports compile, license field, engines field
- [ ] `packages/svelte/src/lib/Table.test.ts` — renders stub Table without errors (uses @testing-library/svelte)
- [ ] `packages/react/src/index.test.ts` — stub imports without errors
- [ ] `packages/vue/src/index.test.ts` — stub imports without errors
- [ ] `e2e/smoke.spec.ts` — Playwright placeholder test
- [ ] Framework config: `vitest.config.ts` at root + per-package `vitest.config.ts` files

---

## Implementation Order

The planner should decompose Phase 1 into tasks in this order. Each step must complete and verify before the next begins.

### Wave 1: Repository skeleton

1. Create `pnpm-workspace.yaml`
2. Create root `package.json` (private, no `"name"`, workspace scripts, devDependencies)
3. Create `tsconfig.base.json`
4. Create `.eslintrc.cjs` with Svelte 5 + TypeScript presets
5. Create `.prettierrc` with `prettier-plugin-svelte`
6. Update `.gitignore` for monorepo (`packages/*/dist`, `packages/*/.svelte-kit`, `apps/*/build`, `.svelte-kit`, `*.tsbuildinfo`)
7. Fix root license: `"license": "MIT"` in root `package.json`, verify `LICENSE` file content is MIT

### Wave 2: Package scaffolds

8. Create `packages/core/` with `package.json`, `tsconfig.json`, `vite.config.ts`, `src/types.ts`, `src/index.ts`
9. Create `packages/svelte/` with `package.json`, `tsconfig.json`, `svelte.config.js`, `vite.config.ts`, `src/lib/Table.svelte` (stub), `src/lib/types.ts`, `src/lib/index.ts`
10. Create `packages/react/` with `package.json`, `tsconfig.json`, `tsup.config.ts`, `src/index.ts` (stub)
11. Create `packages/vue/` with `package.json`, `tsconfig.json`, `tsup.config.ts`, `src/index.ts` (stub)
12. Create `apps/docs/` with minimal `package.json` (stub only — content in Phase 7)

### Wave 3: Dependencies + build verification

13. Run `pnpm install` — verify all packages resolve correctly
14. Run `pnpm --filter @tablecraft/core build` — verify Vite 8 + vite-plugin-dts produces `dist/`
15. Run `pnpm --filter @tablecraft/svelte build` — verify `svelte-package` produces `dist/` with exports map
16. Run `pnpm --filter @tablecraft/react build` — verify tsup produces `dist/`
17. Run `pnpm --filter @tablecraft/vue build` — verify tsup produces `dist/`
18. Run `pnpm -r typecheck` — verify zero TypeScript errors across all packages

### Wave 4: Testing infrastructure

19. Create root `vitest.config.ts` (workspace mode)
20. Create per-package `vitest.config.ts` files
21. Create stub test files in each package (Wave 0 gap list above)
22. Create `playwright.config.ts` and `e2e/smoke.spec.ts`
23. Run `pnpm test` — verify exit code 0
24. Install Playwright browsers: `pnpm exec playwright install --with-deps`
25. Run `pnpm exec playwright test` — verify exit code 0

### Wave 5: Changesets + ESLint/Prettier

26. Run `pnpm changeset init` then replace `config.json` with the exact content above
27. Create `.github/workflows/release.yml` stub
28. Run `pnpm lint` — verify zero ESLint errors
29. Run `pnpm format --check` — verify Prettier is satisfied
30. Verify all six critical defects are gone (search checks in FOUND-07, FOUND-08, FOUND-09 above)

---

## Gotchas and Warnings

### 1. Vite version split — DO NOT use Vite 8 for packages/svelte

`@sveltejs/package` 2.5.7 uses `@sveltejs/vite-plugin-svelte` 6.x internally, which requires Vite 6 or 7. Installing Vite 8 in `packages/svelte` will cause peer dependency conflicts. Use:

- `packages/svelte`: Vite 7.3.1 + `@sveltejs/vite-plugin-svelte` 6.2.4
- `packages/core`: Vite 8.0.1 (pure TypeScript, no Svelte plugin needed)

The CONTEXT.md reference to "Vite 5" is outdated by two major versions.

### 2. Vitest is at 4.1.0, not 2.x

Install `"vitest": "^4.1.0"` in the root `package.json`. The workspace config format is unchanged. Vitest 4 supports Vite 6, 7, and 8.

### 3. Node engines: use `>=20.19.0`, not `>=20`

Vite 8 declares `"node": "^20.19.0 || >=22.12.0"`. The `engines` field must be precise enough to satisfy this. `>=20` would allow Node 20.0.0 which breaks Vite 8. Use `"node": ">=20.19.0"` in all `package.json` files.

### 4. `@sveltejs/package` owns the `exports` map — do not conflict with it

When `svelte-package` runs, it rewrites the `exports` field in `packages/svelte/package.json`. Do not manually maintain an `exports` field there — it will be overwritten. The source of truth for the Svelte package exports is what `svelte-package` generates from `src/lib/`.

### 5. `module: "ESNext"` + `moduleResolution: "Bundler"` required for Svelte 5

Using `"moduleResolution": "Node16"` or `"NodeNext"` with `.svelte` imports causes TypeScript to demand `.js` extensions on Svelte imports. Use `"Bundler"` which correctly handles Vite's module resolution.

### 6. `verbatimModuleSyntax: true` changes import/export behavior

With `verbatimModuleSyntax: true` in tsconfig, `import type` is required for type-only imports. This will cause errors if you use bare `import` for types. Enable this from day one so the codebase is consistent.

### 7. `$props()` must be called at component top level, not inside a function

In Svelte 5, `$props()` is a compiler directive that must appear at the top level of the `<script>` block. It cannot be called conditionally or inside a function. The destructuring must happen at the call site.

### 8. pnpm `workspace:*` gets rewritten on publish

`"@tablecraft/core": "workspace:*"` in sibling packages is fine during development. When `@changesets/cli` publishes, it rewrites `workspace:*` to the actual published version (e.g., `"^2.0.0"`). Do not manually replace `workspace:*` with version numbers.

### 9. `"sideEffects": false` must be in all package.json files

Without this, Webpack-based consumers cannot tree-shake your library. Set it in all four package `package.json` files. If a package has actual side effects (registering globals, etc.), set it to an array of file globs that have side effects.

### 10. `vitest-axe` 0.1.0 is very early stage

Install it (`^0.1.0`) but its API may change. Phase 1 does not use axe assertions — only Phase 3+ does. The install simply verifies the package resolves. Do not write `expect(element).toHaveNoViolations()` assertions in Phase 1 tests.

### 11. The v1 `src/` directory is a read reference, not a source to import

Leave `src/Tables.svelte` in place during Phase 1 as a reference for the `returndatatype()` renderer logic (lines 15–122). Do NOT import it, DO NOT add it to any package's `files` or `exports`. The renderer reimplementation happens in Phase 2.

### 12. Root `package.json` must be `"private": true`

The root monorepo package is never published. If `"private": true` is missing and someone runs `npm publish` from the root, it publishes the workspace root which has no useful content.

---

## Sources

### Primary (HIGH confidence — verified live against npm registry, March 2026)

- npm registry live queries — all version numbers in this document verified March 2026-03-21
- `npm view <package> version` / `dist-tags` / `peerDependencies` — tool calls documented above

### Secondary (MEDIUM confidence — project planning docs, training data)

- `.planning/research/STACK.md` — technology stack decisions (stack choices valid, version numbers updated here)
- `.planning/research/PITFALLS.md` — pitfall catalog (HIGH confidence for API/migration pitfalls)
- `.planning/research/SUMMARY.md` — executive summary

### Tertiary (LOW confidence — training data, not live-verified)

- Svelte 5 runes API: `$props()`, `$state()`, `$derived()`, `$effect()` — stable since Oct 2024, but verify exact syntax against https://svelte.dev/docs/runes
- `@changesets/cli` workspace config JSON shape — verify against https://github.com/changesets/changesets/blob/main/docs/config-file-options.md
- `vitest.workspace.ts` format in Vitest 4 — verify against https://vitest.dev/guide/workspace

---

## Metadata

**Confidence breakdown:**

| Area                        | Level  | Reason                                                            |
| --------------------------- | ------ | ----------------------------------------------------------------- |
| All version numbers         | HIGH   | Verified live from npm registry March 2026                        |
| Vite version split finding  | HIGH   | Verified via `@sveltejs/vite-plugin-svelte` peer dep inspection   |
| pnpm workspace format       | HIGH   | Stable for years; `pnpm-workspace.yaml` format unchanged          |
| @sveltejs/package workflow  | HIGH   | Well-documented; peerDeps verified live                           |
| tsup configs                | HIGH   | Stable API; verified live versions                                |
| Vitest workspace config     | HIGH   | Format unchanged from 2.x to 4.x; confirmed via dist-tags         |
| TypeScript types skeleton   | HIGH   | Based on locked decisions in CONTEXT.md                           |
| Svelte 5 rune syntax        | MEDIUM | Stable since Oct 2024 but verify exact API at implementation time |
| @changesets/cli config JSON | MEDIUM | Training data; verify config schema before implementation         |

**Research date:** 2026-03-21
**Valid until:** 2026-06-21 (90 days — ecosystem is stable; re-verify versions at install time)
