---
phase: 01-foundation
plan: 02
type: execute
wave: 2
depends_on:
  - 01-PLAN
files_modified:
  - packages/core/package.json
  - packages/core/tsconfig.json
  - packages/core/vite.config.ts
  - packages/core/src/types.ts
  - packages/core/src/index.ts
  - packages/svelte/package.json
  - packages/svelte/tsconfig.json
  - packages/svelte/svelte.config.js
  - packages/svelte/vite.config.ts
  - packages/svelte/src/lib/Table.svelte
  - packages/svelte/src/lib/index.ts
  - packages/react/package.json
  - packages/react/tsconfig.json
  - packages/react/tsup.config.ts
  - packages/react/src/index.ts
  - packages/vue/package.json
  - packages/vue/tsconfig.json
  - packages/vue/tsup.config.ts
  - packages/vue/src/index.ts
  - apps/docs/package.json
autonomous: true
requirements:
  - FOUND-02
  - FOUND-03
  - FOUND-04
  - FOUND-05

must_haves:
  truths:
    - 'packages/core/src/types.ts exports ColumnType, ColumnDefinition, TableConfig, InferenceResult and defineColumns'
    - 'packages/svelte/src/lib/Table.svelte uses Svelte 5 runes ($props) and has no {@html} anywhere'
    - 'packages/svelte/svelte.config.js uses @sveltejs/package as the kit adapter'
    - 'packages/react/tsup.config.ts and packages/vue/tsup.config.ts produce ESM + CJS'
    - 'Every package.json in packages/* has engines.node, license: MIT, and correct @tablecraft/* name'
    - 'packages/core/vite.config.ts uses Vite 8 library mode with vite-plugin-dts'
    - 'No package.json in packages/* has any rollup dependency'
  artifacts:
    - path: 'packages/core/src/types.ts'
      provides: 'Canonical TypeScript type definitions — ColumnType union, ColumnDefinition, TableConfig'
      exports: ['ColumnType', 'ColumnDefinition', 'TableConfig', 'InferenceResult', 'defineColumns']
    - path: 'packages/svelte/src/lib/Table.svelte'
      provides: 'Svelte 5 runes-based stub component — ZERO {@html}, no CDN Tailwind, no type-switcher select'
      min_lines: 20
    - path: 'packages/core/vite.config.ts'
      provides: 'Vite 8 library mode build with vite-plugin-dts'
      contains: 'vite-plugin-dts'
    - path: 'packages/svelte/svelte.config.js'
      provides: '@sveltejs/package build configuration'
      contains: '@sveltejs/package'
    - path: 'packages/react/tsup.config.ts'
      provides: 'tsup ESM+CJS build for React wrapper'
      contains: 'tsup'
    - path: 'packages/vue/tsup.config.ts'
      provides: 'tsup ESM+CJS build for Vue wrapper'
      contains: 'tsup'
  key_links:
    - from: 'packages/svelte/src/lib/index.ts'
      to: 'packages/svelte/src/lib/Table.svelte'
      via: 'named export'
      pattern: 'export.*Table'
    - from: 'packages/core/src/index.ts'
      to: 'packages/core/src/types.ts'
      via: 're-export'
      pattern: 'export.*types'
    - from: 'packages/react/package.json'
      to: '@tablecraft/core'
      via: 'workspace:* peer dependency'
      pattern: "workspace:\\*"
    - from: 'packages/vue/package.json'
      to: '@tablecraft/core'
      via: 'workspace:* peer dependency'
      pattern: "workspace:\\*"
---

<objective>
Create all four package scaffolds plus apps/docs stub. Each package gets its package.json, tsconfig.json, build config, and minimal source files.

Purpose: Wave 2 creates the package contracts that Wave 3 (build verification) and Wave 4 (testing) depend on. The TypeScript types in packages/core/src/types.ts are the most critical artifact — they define the entire v2 API surface. The Svelte 5 Table.svelte stub demonstrates zero-defect authoring: no {@html}, no CDN Tailwind, no type-switcher select, purely runes-based reactivity.

Output:

- packages/core/: Vite 8 library mode package with TypeScript type definitions
- packages/svelte/: @sveltejs/package-built Svelte 5 component stub
- packages/react/: tsup-built React wrapper stub
- packages/vue/: tsup-built Vue wrapper stub
- apps/docs/: package.json stub only (SvelteKit implemented in Phase 7)
  </objective>

<execution_context>
@/Users/arshdeep.singh/.claude/get-shit-done/workflows/execute-plan.md
@/Users/arshdeep.singh/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/01-foundation/01-CONTEXT.md
@.planning/phases/01-foundation/01-01-SUMMARY.md

<!-- Key types the executor needs from prior plan context -->
<interfaces>
<!-- From tsconfig.base.json (created in plan 01): -->
<!-- "module": "NodeNext", "moduleResolution": "NodeNext", "strict": true, "target": "ES2022" -->
<!-- All package tsconfigs must extend ../../tsconfig.base.json -->

<!-- From .planning/REQUIREMENTS.md FOUND-04: -->
<!-- Svelte 5 runes: $props(), $state(), $derived(), $effect() — NOT export let, NOT $:, NOT on:click -->

<!-- From CONTEXT.md locked decisions: -->
<!-- @tablecraft/core — Vite 8 library mode + vite-plugin-dts; outputs ESM + CJS + UMD -->
<!-- @tablecraft/svelte — @sveltejs/package 2.x exclusively; do NOT use Vite directly -->
<!-- @tablecraft/react — tsup 8.x; outputs ESM + CJS -->
<!-- @tablecraft/vue — tsup 8.x; outputs ESM + CJS -->
<!-- Node engines: ">=20.19.0 || >=22.12.0" — use this EXACT string in every package.json -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Scaffold packages/core with Vite 8 library build and TypeScript types</name>

<read_first> - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/tsconfig.base.json (extends target — must exist from plan 01) - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/.planning/phases/01-foundation/01-CONTEXT.md (TypeScript types list: ColumnType, ColumnDefinition, TableConfig, InferenceResult, defineColumns) - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/src/Tables.svelte (REFERENCE ONLY — the 14 renderer types in returndatatype() at lines 15-122 inform the ColumnType union; do NOT copy {@html} patterns)
</read_first>

  <files>
    packages/core/package.json
    packages/core/tsconfig.json
    packages/core/vite.config.ts
    packages/core/src/types.ts
    packages/core/src/index.ts
  </files>

  <action>
Create all five files for packages/core. Do them in order (package.json first so tsconfig can reference it).

--- FILE: packages/core/package.json ---

```json
{
  "name": "@tablecraft/core",
  "version": "0.0.1",
  "description": "Framework-agnostic core engine for @tablecraft — type inference, renderer registry, state management",
  "license": "MIT",
  "author": "Arshdeep Singh <arsh22sahni@gmail.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/ArshdeepSahni/Svelte-Tables-Tailwind",
    "directory": "packages/core"
  },
  "engines": {
    "node": ">=20.19.0 || >=22.12.0"
  },
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  },
  "files": ["dist", "src"],
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.8.3",
    "vite": "^8.0.1",
    "vite-plugin-dts": "^4.5.4",
    "vitest": "^4.1.0"
  },
  "keywords": ["tablecraft", "table", "data-grid", "typescript", "framework-agnostic"]
}
```

--- FILE: packages/core/tsconfig.json ---

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "composite": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "src/**/*.test.ts"]
}
```

--- FILE: packages/core/vite.config.ts ---

```typescript
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TablecraftCore',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        if (format === 'es') return 'index.js';
        if (format === 'cjs') return 'index.cjs';
        return 'index.umd.js';
      },
    },
    rollupOptions: {
      // No external deps in core stub yet — add in Phase 2
      external: [],
    },
    sourcemap: true,
    minify: false,
  },
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      outDir: 'dist',
      rollupTypes: true,
    }),
  ],
});
```

--- FILE: packages/core/src/types.ts ---

```typescript
/**
 * @tablecraft/core — Type definitions
 *
 * Tier 1 renderer types (14 from v1 + 3 new in v2).
 * Implemented as individual tree-shakable modules in Phase 2.
 * FOUND-07: No {@html} string concatenation. All rendering uses typed components.
 * FOUND-09: No type-switcher <select>. Types are inferred or declared via columns prop.
 */

/** All supported column renderer types — union of all Tier 1 renderer names */
export type ColumnType =
  | 'text' // fallback — plain string display
  | 'number' // numeric with locale formatting
  | 'integer' // integer, no decimal
  | 'currency' // locale currency with symbol
  | 'percentage' // 0-1 or 0-100 value shown as N%
  | 'boolean' // true/false → checkmark/cross icon
  | 'date' // ISO date → locale date string
  | 'datetime' // ISO datetime → locale datetime string
  | 'time' // time string → locale time display
  | 'email' // mailto: anchor
  | 'url' // anchor with external link icon
  | 'phone' // tel: anchor
  | 'image' // <img> with alt text
  | 'badge' // colored pill/tag
  | 'status' // enum value → colored status indicator
  | 'code' // monospace code block (no {@html} — uses <code> element)
  | 'html'; // EXPLICIT OPT-IN ONLY: sanitized HTML (DOMPurify in Phase 2)

/** Short-form column override: { columnKey: ColumnType } */
export type ColumnOverrideShort = Record<string, ColumnType>;

/**
 * Full column descriptor — used in the columns prop for detailed configuration.
 * Phase 1 defines the shape; Phase 2 implements the inference engine against it.
 */
export interface ColumnDefinition<TRow = Record<string, unknown>> {
  /** The key in TRow this column maps to */
  key: keyof TRow & string;
  /** Display label in column header — defaults to key if omitted */
  label?: string;
  /** Renderer type — overrides inference when specified */
  type?: ColumnType;
  /** Whether this column is sortable (default: true) */
  sortable?: boolean;
  /** Whether this column is filterable (default: true) */
  filterable?: boolean;
  /** Whether the column can be hidden by the user */
  hideable?: boolean;
  /** Minimum column width in px */
  minWidth?: number;
  /** Maximum column width in px */
  maxWidth?: number;
  /** Pin this column to the left or right edge */
  pinned?: 'left' | 'right';
}

/**
 * Top-level config passed to createTableEngine() in Phase 2.
 * Phase 1 defines the shape only — implementation in Phase 2.
 */
export interface TableConfig<TRow = Record<string, unknown>> {
  /** Source data rows */
  data: TRow[];
  /**
   * Column definitions or short-form overrides.
   * Short form: { avatar: 'image', price: 'currency' }
   * Long form: [{ key: 'avatar', type: 'image', label: 'Photo' }]
   */
  columns?: ColumnOverrideShort | ColumnDefinition<TRow>[];
}

/**
 * Result from the type inference engine (Phase 2).
 * Phase 1 defines the shape so downstream packages can type their props correctly.
 */
export interface InferenceResult {
  /** The inferred or declared column type */
  type: ColumnType;
  /** Inference confidence 0-1 (1.0 = explicitly declared, <1.0 = inferred) */
  confidence: number;
  /** The source of this result */
  source: 'declared' | 'inferred' | 'fallback';
}

/**
 * Per-column inference output map: columnKey → InferenceResult
 */
export type ColumnInferenceMap = Record<string, InferenceResult>;

/**
 * TypeScript helper — provides full generic type safety for column definitions.
 * Usage: const columns = defineColumns<User>()([{ key: 'name', type: 'text' }])
 * Implementation: identity function — generic constraint is the value at callsite.
 * Phase 2 adds the inference engine; this helper type-checks consumer code.
 */
export function defineColumns<TRow = Record<string, unknown>>() {
  return (columns: ColumnDefinition<TRow>[]): ColumnDefinition<TRow>[] => columns;
}
```

--- FILE: packages/core/src/index.ts ---

```typescript
/**
 * @tablecraft/core — Public API
 *
 * Phase 1: Type definitions and helper only.
 * Phase 2: createTableEngine(), registerRenderer(), built-in renderers.
 */

export type {
  ColumnType,
  ColumnOverrideShort,
  ColumnDefinition,
  TableConfig,
  InferenceResult,
  ColumnInferenceMap,
} from './types.js';

export { defineColumns } from './types.js';
```

  </action>

  <verify>
    <automated>cd /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind && test -f packages/core/src/types.ts && grep -q "ColumnType" packages/core/src/types.ts && grep -q "defineColumns" packages/core/src/index.ts && grep -q "vite-plugin-dts" packages/core/vite.config.ts && echo "PASS" || echo "FAIL"</automated>
  </verify>

<acceptance_criteria> - `test -f packages/core/package.json` exits 0 - `grep '"name": "@tablecraft/core"' packages/core/package.json` finds the line - `grep '"license": "MIT"' packages/core/package.json` finds the line - `grep '"node": ">=20.19.0' packages/core/package.json` finds the line - `grep '"type": "module"' packages/core/package.json` finds the line - `grep '"vite": "\^8' packages/core/package.json` finds the line - `grep '"vite-plugin-dts"' packages/core/package.json` finds the line - `test -f packages/core/tsconfig.json` exits 0 - `grep 'tsconfig.base.json' packages/core/tsconfig.json` finds the extends line - `test -f packages/core/vite.config.ts` exits 0 - `grep "vite-plugin-dts" packages/core/vite.config.ts` finds the import - `grep "formats.*es.*cjs.*umd" packages/core/vite.config.ts` finds the formats array - `test -f packages/core/src/types.ts` exits 0 - `grep "export type ColumnType" packages/core/src/types.ts` finds the export - `grep "export interface ColumnDefinition" packages/core/src/types.ts` finds the interface - `grep "export interface TableConfig" packages/core/src/types.ts` finds the interface - `grep "export function defineColumns" packages/core/src/types.ts` finds the helper - `grep "{@html}" packages/core/src/types.ts | wc -l` outputs 0 - `test -f packages/core/src/index.ts` exits 0 - `grep "defineColumns" packages/core/src/index.ts` finds the export
</acceptance_criteria>

<done>packages/core has package.json (@tablecraft/core, MIT, engines set, Vite 8 + vite-plugin-dts in devDeps), tsconfig.json extending base, vite.config.ts producing ES+CJS+UMD, src/types.ts with all 5 required type exports, src/index.ts re-exporting all types. Zero {@html} in any core source file.</done>
</task>

<task type="auto">
  <name>Task 2: Scaffold packages/svelte with @sveltejs/package and Svelte 5 runes stub</name>

<read_first> - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/packages/core/src/types.ts (ColumnType, ColumnDefinition, TableConfig — import from @tablecraft/core in Table.svelte) - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/.planning/phases/01-foundation/01-CONTEXT.md (Svelte 5 runes decision: $props, $state, $derived, $effect; @sveltejs/package exclusively for build; no CDN Tailwind; no type-switcher) - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/src/Tables.svelte (REFERENCE ONLY: understand what the old component did. Do NOT copy {@html}, do NOT copy the <select> type-switcher, do NOT copy <svelte:head> CDN link)
</read_first>

  <files>
    packages/svelte/package.json
    packages/svelte/tsconfig.json
    packages/svelte/svelte.config.js
    packages/svelte/vite.config.ts
    packages/svelte/src/lib/Table.svelte
    packages/svelte/src/lib/index.ts
  </files>

  <action>
Create all six files for packages/svelte. Critical: Table.svelte MUST use Svelte 5 runes ($props), must NOT have {@html}, must NOT have <svelte:head> CDN link, must NOT have a <select> type-switcher.

--- FILE: packages/svelte/package.json ---

```json
{
  "name": "@tablecraft/svelte",
  "version": "0.0.1",
  "description": "Svelte 5 table component — zero-config data display for SvelteKit and Svelte projects",
  "license": "MIT",
  "author": "Arshdeep Singh <arsh22sahni@gmail.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/ArshdeepSahni/Svelte-Tables-Tailwind",
    "directory": "packages/svelte"
  },
  "engines": {
    "node": ">=20.19.0 || >=22.12.0"
  },
  "type": "module",
  "svelte": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "svelte": "./dist/index.js",
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      }
    }
  },
  "files": ["dist", "src"],
  "scripts": {
    "build": "svelte-package -i src/lib",
    "dev": "svelte-package -i src/lib --watch",
    "typecheck": "svelte-check --tsconfig ./tsconfig.json"
  },
  "peerDependencies": {
    "svelte": "^5.0.0"
  },
  "dependencies": {
    "@tablecraft/core": "workspace:*"
  },
  "devDependencies": {
    "@sveltejs/package": "^2.5.7",
    "@sveltejs/vite-plugin-svelte": "^6.0.0",
    "svelte": "^5.0.0",
    "svelte-check": "^4.1.5",
    "typescript": "^5.8.3",
    "vite": "^7.3.1",
    "vitest": "^4.1.0",
    "@testing-library/svelte": "^5.2.7"
  },
  "keywords": ["tablecraft", "svelte", "svelte5", "table", "data-grid"]
}
```

--- FILE: packages/svelte/tsconfig.json ---

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "moduleResolution": "Bundler",
    "module": "ESNext",
    "verbatimModuleSyntax": true,
    "allowImportingTsExtensions": true,
    "noEmit": true
  },
  "include": ["src/**/*.ts", "src/**/*.svelte"],
  "exclude": ["node_modules", "dist"]
}
```

Note: packages/svelte uses "moduleResolution": "Bundler" (not NodeNext) because @sveltejs/package and Vite handle resolution. The base tsconfig.base.json uses NodeNext but svelte overrides to Bundler here — this is correct per @sveltejs/package requirements.

--- FILE: packages/svelte/svelte.config.js ---

```javascript
import adapter from '@sveltejs/package';

/** @type {import('@sveltejs/package').Config} */
const config = {
  // @sveltejs/package — library packaging, not an app adapter
  // This file is used by svelte-package CLI, not SvelteKit
};

export default config;
```

Wait — svelte.config.js for a library package (not a SvelteKit app) is simpler. @sveltejs/package does NOT use svelte.config.js in the same way as SvelteKit. The svelte-package CLI reads svelte.config.js for the `svelte` compiler options only. Use this minimal version:

--- FILE: packages/svelte/svelte.config.js (CORRECT VERSION) ---

```javascript
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/package').Config} */
const config = {
  preprocess: vitePreprocess(),
};

export default config;
```

--- FILE: packages/svelte/vite.config.ts ---
Note: @sveltejs/package uses its own build internally via svelte-package CLI. This vite.config.ts is for running Vitest tests against the Svelte package — NOT for building. The build command is `svelte-package -i src/lib`.

```typescript
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: false })],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
});
```

--- FILE: packages/svelte/src/lib/Table.svelte ---
CRITICAL REQUIREMENTS for this file:

- MUST use Svelte 5 runes: `let { data, columns } = $props()`
- MUST NOT contain `{@html}` anywhere
- MUST NOT contain `<svelte:head>` or any CDN link
- MUST NOT contain `<select>` for type switching
- MUST NOT use `export let` (Svelte 3 syntax)
- MUST NOT use `$:` reactive declarations (Svelte 3 syntax)
- MUST NOT use `on:click` (Svelte 3 syntax — use onclick in Svelte 5)

```svelte
<script lang="ts">
  /**
   * @tablecraft/svelte — Table component stub
   *
   * Phase 1 scaffold: Svelte 5 runes, zero defects.
   * Full implementation in Phase 3.
   *
   * FOUND-07: No {@html} — all cell values rendered via text binding
   * FOUND-08: No CDN Tailwind — CSS custom properties (--tc-*) used instead
   * FOUND-09: No type-switcher <select> — column types are inferred/declared, never runtime-switched
   * FOUND-04: Svelte 5 runes ($props, $state, $derived) — not Svelte 3 export let / $:
   */

  import type { TableConfig, ColumnDefinition, ColumnType } from '@tablecraft/core';

  type Row = Record<string, unknown>;

  interface Props {
    /** Source data rows */
    data: Row[];
    /**
     * Column definitions or short-form type overrides.
     * Short: { avatar: 'image', price: 'currency' }
     * Long: [{ key: 'avatar', type: 'image', label: 'Photo' }]
     * Omit for zero-config auto-inference (Phase 2).
     */
    columns?: Record<string, ColumnType> | ColumnDefinition<Row>[];
    /** Accessible label for the table */
    caption?: string;
  }

  let { data = [], columns, caption }: Props = $props();

  /** Derive column keys from first row when no column config provided */
  const columnKeys = $derived(
    data.length > 0 ? Object.keys(data[0] as Record<string, unknown>) : [],
  );

  /** Get display label for a column key — Phase 3 will use ColumnDefinition.label */
  function getLabel(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /** Render a cell value safely — Phase 2 replaces with typed renderer components */
  function renderCell(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
</script>

<!--
  @tablecraft/svelte Phase 1 stub.
  Uses CSS custom properties (--tc-*) instead of Tailwind CDN (FOUND-08).
  No {@html} — all values are text (FOUND-07).
  No type-switcher <select> in headers (FOUND-09).
  Svelte 5 runes: $props, $derived (FOUND-04).
-->
<div class="tc-table-wrapper" role="region" aria-label={caption ?? 'Data table'}>
  {#if data.length === 0}
    <p class="tc-empty-state">No data to display.</p>
  {:else}
    <table class="tc-table" role="grid">
      {#if caption}
        <caption class="tc-caption">{caption}</caption>
      {/if}
      <thead>
        <tr>
          {#each columnKeys as key}
            <th scope="col" class="tc-th">{getLabel(key)}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each data as row, i}
          <tr class="tc-tr">
            {#each columnKeys as key}
              <td class="tc-td">
                {renderCell((row as Record<string, unknown>)[key])}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  /* CSS custom property design tokens — replaces Tailwind CDN (FOUND-08) */
  .tc-table-wrapper {
    overflow-x: auto;
    border: 1px solid var(--tc-border-color, #e5e7eb);
    border-radius: var(--tc-border-radius, 0.5rem);
  }

  .tc-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--tc-font-size, 0.875rem);
    font-family: var(--tc-font-family, inherit);
  }

  .tc-th {
    padding: var(--tc-spacing-3, 0.75rem) var(--tc-spacing-4, 1rem);
    text-align: left;
    font-weight: 600;
    background-color: var(--tc-header-bg, #f9fafb);
    color: var(--tc-header-color, #374151);
    border-bottom: 1px solid var(--tc-border-color, #e5e7eb);
  }

  .tc-td {
    padding: var(--tc-spacing-3, 0.75rem) var(--tc-spacing-4, 1rem);
    border-bottom: 1px solid var(--tc-border-color, #e5e7eb);
    color: var(--tc-cell-color, #111827);
  }

  .tc-tr:last-child .tc-td {
    border-bottom: none;
  }

  .tc-tr:hover {
    background-color: var(--tc-row-hover-bg, #f3f4f6);
  }

  .tc-empty-state {
    padding: var(--tc-spacing-4, 1rem);
    text-align: center;
    color: var(--tc-muted-color, #6b7280);
  }

  .tc-caption {
    padding: var(--tc-spacing-3, 0.75rem);
    font-weight: 600;
    text-align: left;
    color: var(--tc-header-color, #374151);
  }
</style>
```

--- FILE: packages/svelte/src/lib/index.ts ---

```typescript
/**
 * @tablecraft/svelte — Public API
 *
 * Phase 1: Table component stub exported.
 * Phase 3: Additional component exports (pagination, filters, etc.)
 */

export { default as Table } from './Table.svelte';
export type { ColumnType, ColumnDefinition, TableConfig } from '@tablecraft/core';
```

  </action>

  <verify>
    <automated>cd /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind && test -f packages/svelte/src/lib/Table.svelte && grep -q "\$props" packages/svelte/src/lib/Table.svelte && grep -c "{@html}" packages/svelte/src/lib/Table.svelte | grep -q "^0$" && grep -c "svelte:head" packages/svelte/src/lib/Table.svelte | grep -q "^0$" && grep -c "<select" packages/svelte/src/lib/Table.svelte | grep -q "^0$" && echo "PASS" || echo "FAIL"</automated>
  </verify>

<acceptance_criteria> - `test -f packages/svelte/package.json` exits 0 - `grep '"name": "@tablecraft/svelte"' packages/svelte/package.json` finds the line - `grep '"license": "MIT"' packages/svelte/package.json` finds the line - `grep '"node": ">=20.19.0' packages/svelte/package.json` finds the line - `grep '"@sveltejs/package"' packages/svelte/package.json` finds the line - `grep '"svelte": "\^5' packages/svelte/package.json` finds the line in peerDependencies - `grep '"@tablecraft/core": "workspace:\*"' packages/svelte/package.json` finds the line - `grep '"build": "svelte-package' packages/svelte/package.json` finds the line - `test -f packages/svelte/svelte.config.js` exits 0 - `grep "vitePreprocess" packages/svelte/svelte.config.js` finds the import - `test -f packages/svelte/src/lib/Table.svelte` exits 0 - `grep "\$props" packages/svelte/src/lib/Table.svelte` finds the rune usage - `grep "\$derived" packages/svelte/src/lib/Table.svelte` finds the rune usage - `grep -c "{@html}" packages/svelte/src/lib/Table.svelte` outputs 0 (FOUND-07) - `grep -c "svelte:head" packages/svelte/src/lib/Table.svelte` outputs 0 (FOUND-08) - `grep -c "unpkg.com" packages/svelte/src/lib/Table.svelte` outputs 0 (FOUND-08) - `grep -c "<select" packages/svelte/src/lib/Table.svelte` outputs 0 (FOUND-09) - `grep -c "export let" packages/svelte/src/lib/Table.svelte` outputs 0 (Svelte 3 syntax gone) - `grep "lang=\"ts\"" packages/svelte/src/lib/Table.svelte` finds the script lang - `grep "\-\-tc\-" packages/svelte/src/lib/Table.svelte` finds CSS custom property usage - `test -f packages/svelte/src/lib/index.ts` exits 0 - `grep "export.*Table" packages/svelte/src/lib/index.ts` finds the named export
</acceptance_criteria>

<done>packages/svelte has all six files. Table.svelte uses Svelte 5 $props/$derived runes. Zero {@html}, zero svelte:head CDN link, zero type-switcher select. CSS custom properties replace Tailwind CDN. @sveltejs/package used for build. @tablecraft/core referenced as workspace:\* dep.</done>
</task>

<task type="auto">
  <name>Task 3: Scaffold packages/react, packages/vue, and apps/docs</name>

<read_first> - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/packages/core/package.json (verify @tablecraft/core name for workspace:\* dep reference) - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/.planning/phases/01-foundation/01-CONTEXT.md (React and Vue wrapper approach: tsup 8.x, ESM+CJS, peer deps)
</read_first>

  <files>
    packages/react/package.json
    packages/react/tsconfig.json
    packages/react/tsup.config.ts
    packages/react/src/index.ts
    packages/vue/package.json
    packages/vue/tsconfig.json
    packages/vue/tsup.config.ts
    packages/vue/src/index.ts
    apps/docs/package.json
  </files>

  <action>
Create all nine files for packages/react, packages/vue, and apps/docs stubs.

--- FILE: packages/react/package.json ---

```json
{
  "name": "@tablecraft/react",
  "version": "0.0.1",
  "description": "React wrapper for @tablecraft — uses the tc-table Web Component via @lit/react",
  "license": "MIT",
  "author": "Arshdeep Singh <arsh22sahni@gmail.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/ArshdeepSahni/Svelte-Tables-Tailwind",
    "directory": "packages/react"
  },
  "engines": {
    "node": ">=20.19.0 || >=22.12.0"
  },
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  },
  "files": ["dist", "src"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "dependencies": {
    "@tablecraft/core": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tsup": "^8.4.0",
    "typescript": "^5.8.3",
    "vitest": "^4.1.0"
  },
  "keywords": ["tablecraft", "react", "table", "data-grid"]
}
```

--- FILE: packages/react/tsconfig.json ---

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "noEmit": true
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}
```

--- FILE: packages/react/tsup.config.ts ---

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', '@tablecraft/core'],
  treeshake: true,
  target: 'es2022',
  outDir: 'dist',
});
```

--- FILE: packages/react/src/index.ts ---

```typescript
/**
 * @tablecraft/react — Phase 1 stub
 *
 * Phase 5 implementation: React wrapper via @lit/react for tc-table Web Component.
 * Phase 1: Type re-exports only, so TypeScript consumers can import types now.
 */

export type { ColumnType, ColumnDefinition, TableConfig } from '@tablecraft/core';

/**
 * Placeholder export — replaced with real React component in Phase 5.
 * Exported so the module is non-empty and tsup produces output.
 */
export const TABLECRAFT_REACT_VERSION = '0.0.1';
```

--- FILE: packages/vue/package.json ---

```json
{
  "name": "@tablecraft/vue",
  "version": "0.0.1",
  "description": "Vue 3 wrapper for @tablecraft — uses the tc-table Web Component",
  "license": "MIT",
  "author": "Arshdeep Singh <arsh22sahni@gmail.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/ArshdeepSahni/Svelte-Tables-Tailwind",
    "directory": "packages/vue"
  },
  "engines": {
    "node": ">=20.19.0 || >=22.12.0"
  },
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  },
  "files": ["dist", "src"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "vue": ">=3.0.0"
  },
  "dependencies": {
    "@tablecraft/core": "workspace:*"
  },
  "devDependencies": {
    "@vue/runtime-core": "^3.5.0",
    "tsup": "^8.4.0",
    "typescript": "^5.8.3",
    "vue": "^3.5.0",
    "vitest": "^4.1.0"
  },
  "keywords": ["tablecraft", "vue", "vue3", "table", "data-grid"]
}
```

--- FILE: packages/vue/tsconfig.json ---

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "noEmit": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

--- FILE: packages/vue/tsup.config.ts ---

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['vue', '@tablecraft/core'],
  treeshake: true,
  target: 'es2022',
  outDir: 'dist',
});
```

--- FILE: packages/vue/src/index.ts ---

```typescript
/**
 * @tablecraft/vue — Phase 1 stub
 *
 * Phase 5 implementation: Vue 3 SFC wrapper for tc-table Web Component.
 * Phase 1: Type re-exports only.
 */

export type { ColumnType, ColumnDefinition, TableConfig } from '@tablecraft/core';

/**
 * Placeholder export — replaced with real Vue component in Phase 5.
 */
export const TABLECRAFT_VUE_VERSION = '0.0.1';
```

--- FILE: apps/docs/package.json ---

```json
{
  "name": "@tablecraft/docs",
  "version": "0.0.1",
  "description": "Documentation site for @tablecraft — SvelteKit (stub — implemented in Phase 7)",
  "license": "MIT",
  "private": true,
  "engines": {
    "node": ">=20.19.0 || >=22.12.0"
  },
  "scripts": {
    "dev": "echo 'Docs site not yet implemented — Phase 7'",
    "build": "echo 'Docs site not yet implemented — Phase 7'"
  },
  "keywords": ["tablecraft", "docs"]
}
```

  </action>

  <verify>
    <automated>cd /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind && test -f packages/react/tsup.config.ts && test -f packages/vue/tsup.config.ts && grep -q '"name": "@tablecraft/react"' packages/react/package.json && grep -q '"name": "@tablecraft/vue"' packages/vue/package.json && grep -q '"license": "MIT"' packages/react/package.json && grep -q '"license": "MIT"' packages/vue/package.json && echo "PASS" || echo "FAIL"</automated>
  </verify>

<acceptance_criteria> - `grep '"name": "@tablecraft/react"' packages/react/package.json` finds the line - `grep '"license": "MIT"' packages/react/package.json` finds the line - `grep '"node": ">=20.19.0' packages/react/package.json` finds the line - `grep '"tsup"' packages/react/package.json` finds tsup in devDependencies - `grep '"build": "tsup"' packages/react/package.json` finds the build script - `grep 'format.*esm.*cjs' packages/react/tsup.config.ts` finds the formats - `grep "external.*react" packages/react/tsup.config.ts` finds react in externals - `test -f packages/react/src/index.ts` exits 0 - `grep '"name": "@tablecraft/vue"' packages/vue/package.json` finds the line - `grep '"license": "MIT"' packages/vue/package.json` finds the line - `grep '"node": ">=20.19.0' packages/vue/package.json` finds the line - `grep '"tsup"' packages/vue/package.json` finds tsup in devDependencies - `grep 'format.*esm.*cjs' packages/vue/tsup.config.ts` finds the formats - `grep "external.*vue" packages/vue/tsup.config.ts` finds vue in externals - `test -f packages/vue/src/index.ts` exits 0 - `test -f apps/docs/package.json` exits 0 - `grep '"name": "@tablecraft/docs"' apps/docs/package.json` finds the line - All four packages: `grep -r "{@html}" packages/` outputs nothing - All four packages: `grep -r "rollup" packages/*/package.json` outputs nothing
</acceptance_criteria>

<done>packages/react and packages/vue each have package.json (MIT, engines, tsup devDep, workspace:\* dep on core), tsconfig.json extending base, tsup.config.ts producing ESM+CJS, and src/index.ts with type re-exports. apps/docs has package.json stub. No {@html} or rollup anywhere in any package.</done>
</task>

</tasks>

<verification>
After all three tasks complete:

```bash
# Package structure complete
for pkg in core svelte react vue; do
  test -f packages/$pkg/package.json && echo "$pkg/package.json: OK" || echo "$pkg/package.json: MISSING"
  test -f packages/$pkg/tsconfig.json && echo "$pkg/tsconfig.json: OK" || echo "$pkg/tsconfig.json: MISSING"
done

# FOUND-07: Zero {@html} in any package source
grep -r '{@html}' packages/ | wc -l  # must be 0

# FOUND-08: Zero CDN Tailwind links
grep -r 'unpkg.com\|cdn.tailwindcss' packages/ | wc -l  # must be 0

# FOUND-09: Zero type-switcher selects
grep -r '<select' packages/svelte/src/ | wc -l  # must be 0

# FOUND-04: Svelte 5 runes in Table.svelte
grep '$props' packages/svelte/src/lib/Table.svelte  # must find
grep 'export let' packages/svelte/src/lib/Table.svelte | wc -l  # must be 0

# Core types exported
grep 'ColumnType' packages/core/src/index.ts  # must find
grep 'defineColumns' packages/core/src/index.ts  # must find

# MIT license in all packages
for pkg in core svelte react vue; do
  grep '"license": "MIT"' packages/$pkg/package.json && echo "$pkg: MIT OK" || echo "$pkg: MIT MISSING"
done

# Engines in all packages
for pkg in core svelte react vue; do
  grep '"node": ">=20.19.0' packages/$pkg/package.json && echo "$pkg: engines OK" || echo "$pkg: engines MISSING"
done
```

</verification>

<success_criteria>

1. `grep -r '{@html}' packages/ | wc -l` outputs 0 — FOUND-07 satisfied in all packages
2. `grep -r 'unpkg.com\|cdn.tailwindcss' packages/ | wc -l` outputs 0 — FOUND-08 satisfied
3. `grep -r '<select' packages/svelte/src/ | wc -l` outputs 0 — FOUND-09 satisfied
4. `grep '\$props' packages/svelte/src/lib/Table.svelte` finds the rune — FOUND-04 satisfied
5. All 4 package.json files have `"license": "MIT"` — FOUND-06 coverage
6. All 4 package.json files have `"node": ">=20.19.0 || >=22.12.0"` — FOUND-10 coverage
7. `grep 'ColumnType\|ColumnDefinition\|TableConfig\|defineColumns' packages/core/src/index.ts` — FOUND-03 types defined
8. `grep '"@sveltejs/package"' packages/svelte/package.json` and `grep '"tsup"' packages/react/package.json` — FOUND-02 build tools declared
   </success_criteria>

<output>
After completion, create `.planning/phases/01-foundation/01-02-SUMMARY.md` with:
- All files created per package
- Key type definitions in packages/core/src/types.ts (ColumnType union members)
- Evidence of zero-defect authoring (grep results showing 0 {@html}, 0 CDN links, 0 type-switcher selects)
- Workspace dep graph (@tablecraft/svelte → @tablecraft/core, @tablecraft/react → @tablecraft/core, @tablecraft/vue → @tablecraft/core)
</output>
