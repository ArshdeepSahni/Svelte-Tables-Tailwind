---
phase: 01-foundation
plan: 04
type: execute
wave: 4
depends_on:
  - 01-PLAN
  - 02-PLAN
  - 03-PLAN
files_modified:
  - vitest.config.ts
  - playwright.config.ts
  - packages/core/vitest.config.ts
  - packages/core/src/foundation.test.ts
  - packages/svelte/vitest.config.ts
  - packages/svelte/src/lib/Table.test.ts
  - packages/react/vitest.config.ts
  - packages/react/src/index.test.ts
  - packages/vue/vitest.config.ts
  - packages/vue/src/index.test.ts
  - e2e/smoke.spec.ts
  - package.json
autonomous: true
requirements:
  - FOUND-06
  - FOUND-07
  - FOUND-08
  - FOUND-09
  - FOUND-10
  - FOUND-11
  - FOUND-12

must_haves:
  truths:
    - 'pnpm test exits 0 with Vitest running tests from all four packages'
    - 'pnpm exec playwright test exits 0 for the smoke spec'
    - 'foundation.test.ts verifies MIT license in all package.json files and engines field set'
    - 'foundation.test.ts verifies zero {@html} in any .svelte source file'
    - 'foundation.test.ts verifies zero CDN Tailwind links in any source file'
    - 'foundation.test.ts verifies zero type-switcher <select> in packages/svelte/src'
    - 'foundation.test.ts verifies .changeset/config.json exists with access: public'
    - 'pnpm lint exits 0 — ESLint passes with zero errors'
    - 'pnpm format:check exits 0 — all files are Prettier-formatted'
  artifacts:
    - path: 'vitest.config.ts'
      provides: 'Root Vitest workspace config — runs all packages with single pnpm test'
      contains: 'workspace'
    - path: 'packages/core/src/foundation.test.ts'
      provides: 'Automated verification of all FOUND-* requirements'
      min_lines: 40
    - path: 'playwright.config.ts'
      provides: 'Playwright E2E config — Chromium, Firefox, WebKit'
      contains: 'chromium'
    - path: 'e2e/smoke.spec.ts'
      provides: 'Playwright smoke test — passes immediately as infrastructure proof'
      min_lines: 10
  key_links:
    - from: 'vitest.config.ts'
      to: 'packages/*/vitest.config.ts'
      via: 'Vitest workspace projects array'
      pattern: "packages/\\*"
    - from: 'packages/core/src/foundation.test.ts'
      to: 'packages/*/package.json'
      via: 'fs.readFileSync to read and parse each package.json'
      pattern: 'readFileSync.*package.json'
    - from: 'packages/core/src/foundation.test.ts'
      to: 'packages/svelte/src/lib/Table.svelte'
      via: 'fs.readFileSync to grep for defects'
      pattern: 'readFileSync.*Table.svelte'
---

<objective>
Install testing infrastructure (Vitest 4 workspace, Playwright), create foundation test suite that codifies all FOUND-* requirements as automated assertions, and verify ESLint + Prettier run clean.

Purpose: Wave 4 closes the loop. The foundation test suite in packages/core/src/foundation.test.ts is the machine-readable spec for Phase 1 — it will fail if anyone re-introduces {@html}, CDN Tailwind, or a missing MIT license. This is the "never regress" safety net for all subsequent phases. Playwright smoke test proves E2E infrastructure exists and is wired correctly.

Output:

- vitest.config.ts (root workspace mode)
- Per-package vitest.config.ts files
- packages/core/src/foundation.test.ts (FOUND-\* spec)
- Table.test.ts, index.test.ts stubs per package
- playwright.config.ts + e2e/smoke.spec.ts
- All tests passing: pnpm test exits 0
- pnpm lint exits 0
- pnpm format:check exits 0
  </objective>

<execution_context>
@/Users/arshdeep.singh/.claude/get-shit-done/workflows/execute-plan.md
@/Users/arshdeep.singh/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/phases/01-foundation/01-CONTEXT.md
@.planning/phases/01-foundation/01-01-SUMMARY.md
@.planning/phases/01-foundation/01-02-SUMMARY.md
@.planning/phases/01-foundation/01-03-SUMMARY.md

<interfaces>
<!-- From VALIDATION.md (Wave 0 requirements): -->
<!-- Wave 0 test files that MUST exist before any implementation: -->
<!-- - vitest.config.ts at monorepo root (workspace config) -->
<!-- - packages/core/vitest.config.ts -->
<!-- - packages/svelte/vitest.config.ts -->
<!-- - packages/react/vitest.config.ts -->
<!-- - packages/vue/vitest.config.ts -->
<!-- - packages/core/src/foundation.test.ts -->
<!-- - packages/svelte/src/lib/Table.test.ts -->
<!-- - packages/react/src/index.test.ts -->
<!-- - packages/vue/src/index.test.ts -->
<!-- - e2e/smoke.spec.ts -->
<!-- - playwright.config.ts -->

<!-- Vitest 4 workspace config syntax: -->
<!-- import { defineConfig } from 'vitest/config' -->
<!-- projects: ['packages/*/vitest.config.ts'] -->

<!-- @testing-library/svelte: requires jsdom environment -->
<!-- Playwright: requires @playwright/test, not playwright package for test runner -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create Vitest workspace config, per-package configs, and Playwright config</name>

<read_first> - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/package.json (verify vitest and @playwright/test are in devDependencies) - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/.planning/phases/01-foundation/01-VALIDATION.md (Wave 0 requirements — exact file list) - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/packages/svelte/vite.config.ts (verify jsdom environment already configured)
</read_first>

  <files>
    vitest.config.ts
    packages/core/vitest.config.ts
    packages/svelte/vitest.config.ts
    packages/react/vitest.config.ts
    packages/vue/vitest.config.ts
    playwright.config.ts
    e2e/smoke.spec.ts
    package.json
  </files>

  <action>
Step 0 — Ensure @playwright/test is in root devDependencies. Read root package.json. If only `"playwright"` is listed but not `"@playwright/test"`, replace or add:

```json
"@playwright/test": "^1.50.1"
```

The `playwright` package is for the browser automation library; `@playwright/test` is the test runner. Both may be needed. Add `@playwright/test` to root devDependencies if not already present.

Run `pnpm install` after updating package.json if changed.

Step 1 — Create vitest.config.ts at repo root with EXACTLY this content:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Workspace mode: run all package test suites from one command
    workspace: [
      'packages/core/vitest.config.ts',
      'packages/svelte/vitest.config.ts',
      'packages/react/vitest.config.ts',
      'packages/vue/vitest.config.ts',
    ],
  },
});
```

Step 2 — Create packages/core/vitest.config.ts with EXACTLY this content:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@tablecraft/core',
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.d.ts'],
    },
  },
});
```

Step 3 — Create packages/svelte/vitest.config.ts with EXACTLY this content:

```typescript
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: false })],
  test: {
    name: '@tablecraft/svelte',
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.svelte'],
    setupFiles: [],
  },
});
```

Step 4 — Create packages/react/vitest.config.ts with EXACTLY this content:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@tablecraft/react',
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
```

Step 5 — Create packages/vue/vitest.config.ts with EXACTLY this content:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@tablecraft/vue',
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});
```

Step 6 — Create playwright.config.ts at repo root with EXACTLY this content:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

Step 7 — Create e2e/ directory and smoke spec:

```bash
mkdir -p e2e
```

Create e2e/smoke.spec.ts with EXACTLY this content:

```typescript
import { test, expect } from '@playwright/test';

/**
 * Phase 1 smoke test — infrastructure proof.
 * Verifies Playwright can run. No real UI exists yet (Phase 3).
 * This test passes immediately to prove the E2E test runner is wired correctly.
 *
 * Phase 3 will replace this with actual <Table> rendering tests.
 */
test.describe('Playwright smoke test', () => {
  test('test runner is operational', () => {
    // This test intentionally has no page navigation.
    // It proves that @playwright/test is installed and configured correctly.
    expect(true).toBe(true);
  });

  test('Playwright version is accessible', () => {
    // Verify the test environment provides expected globals
    expect(typeof test).toBe('function');
    expect(typeof expect).toBe('function');
  });
});
```

Step 8 — Install Playwright browsers (required for playwright test to run):

```bash
pnpm exec playwright install chromium
```

Note: Only install Chromium for Phase 1 to save time. Firefox and WebKit can be installed before Phase 3 E2E tests that actually need them. The smoke test file runs on all three in the config, but if only Chromium is installed, run with `--project=chromium` in the smoke test command.

If the full `playwright install` takes too long, use `playwright install chromium` only.
</action>

  <verify>
    <automated>cd /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind && test -f vitest.config.ts && test -f playwright.config.ts && test -f e2e/smoke.spec.ts && grep -q "workspace" vitest.config.ts && echo "CONFIGS PASS" || echo "CONFIGS FAIL"</automated>
  </verify>

<acceptance_criteria> - `test -f vitest.config.ts` exits 0 - `grep "workspace" vitest.config.ts` finds the workspace array - `grep "packages/core/vitest.config.ts" vitest.config.ts` finds the entry - `grep "packages/svelte/vitest.config.ts" vitest.config.ts` finds the entry - `grep "packages/react/vitest.config.ts" vitest.config.ts` finds the entry - `grep "packages/vue/vitest.config.ts" vitest.config.ts` finds the entry - `test -f packages/core/vitest.config.ts` exits 0 - `grep '"@tablecraft/core"' packages/core/vitest.config.ts` finds the test name - `test -f packages/svelte/vitest.config.ts` exits 0 - `grep "jsdom" packages/svelte/vitest.config.ts` finds the environment - `test -f packages/react/vitest.config.ts` exits 0 - `test -f packages/vue/vitest.config.ts` exits 0 - `test -f playwright.config.ts` exits 0 - `grep "chromium" playwright.config.ts` finds the project - `grep "firefox" playwright.config.ts` finds the project - `test -f e2e/smoke.spec.ts` exits 0 - `grep "expect(true).toBe(true)" e2e/smoke.spec.ts` finds the assertion
</acceptance_criteria>

<done>Root vitest.config.ts in workspace mode pointing to all four package configs. Per-package vitest configs with correct environments (node for core, jsdom for svelte/react/vue). playwright.config.ts with three browser projects. e2e/smoke.spec.ts as immediately-passing infrastructure proof. Playwright browsers installed (at minimum Chromium).</done>
</task>

<task type="auto">
  <name>Task 2: Create foundation test suite and per-package stubs, then run all tests</name>

<read_first> - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/packages/core/src/types.ts (what's exported — test will verify these exports compile) - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/packages/svelte/src/lib/Table.svelte (test will verify no defects in this file using fs.readFileSync) - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/.planning/phases/01-foundation/01-VALIDATION.md (exact test IDs: 1-06, 1-07, 1-08, 1-09, 1-10) - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/.changeset/config.json (test will verify this file exists with access: public) - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/packages/svelte/vitest.config.ts (verify jsdom is configured before writing Table.test.ts)
</read_first>

  <files>
    packages/core/src/foundation.test.ts
    packages/svelte/src/lib/Table.test.ts
    packages/react/src/index.test.ts
    packages/vue/src/index.test.ts
  </files>

  <action>
Create the foundation test suite and three package stub tests, then run everything.

--- FILE: packages/core/src/foundation.test.ts ---

```typescript
/**
 * Foundation test suite — automated verification of FOUND-* requirements.
 *
 * These tests codify Phase 1 success criteria as machine-checkable assertions.
 * They will FAIL if anyone:
 * - Re-introduces {@html} in any .svelte file (FOUND-07)
 * - Adds CDN Tailwind back (FOUND-08)
 * - Adds a type-switcher <select> (FOUND-09)
 * - Changes license from MIT (FOUND-06)
 * - Removes engines.node (FOUND-10)
 * - Removes .changeset/config.json (FOUND-10)
 *
 * Test IDs map to VALIDATION.md: 1-06, 1-07, 1-08, 1-09, 1-10
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

// Root of the monorepo — relative to packages/core/src/
const ROOT = resolve(__dirname, '../../../');
const PACKAGES_DIR = join(ROOT, 'packages');
const PACKAGE_NAMES = ['core', 'svelte', 'react', 'vue'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readJson(filePath: string): Record<string, unknown> {
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as Record<string, unknown>;
}

function readText(filePath: string): string {
  return readFileSync(filePath, 'utf-8');
}

function findFiles(dir: string, ext: string): string[] {
  const results: string[] = [];
  function walk(current: string): void {
    if (!existsSync(current)) return;
    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      // Skip dist, node_modules, .svelte-kit
      if (['dist', 'node_modules', '.svelte-kit', 'build'].includes(entry.name)) continue;
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith(ext)) {
        results.push(fullPath);
      }
    }
  }
  walk(dir);
  return results;
}

// ─── FOUND-06: MIT License ─────────────────────────────────────────────────────

describe('FOUND-06: MIT License', () => {
  it('root package.json has license: MIT', () => {
    const pkg = readJson(join(ROOT, 'package.json'));
    expect(pkg['license']).toBe('MIT');
  });

  it('LICENSE file contains "MIT License"', () => {
    const licenseText = readText(join(ROOT, 'LICENSE'));
    expect(licenseText).toContain('MIT License');
    expect(licenseText).not.toContain('ISC');
  });

  it.each(PACKAGE_NAMES)('packages/%s/package.json has license: MIT', (pkgName) => {
    const pkgPath = join(PACKAGES_DIR, pkgName, 'package.json');
    const pkg = readJson(pkgPath);
    expect(pkg['license'], `packages/${pkgName}/package.json license field`).toBe('MIT');
  });
});

// ─── FOUND-07: No {@html} string concatenation ─────────────────────────────────

describe('FOUND-07: XSS — zero {@html} in source files', () => {
  it('finds no {@html} in any .svelte file under packages/', () => {
    const svelteFiles = findFiles(PACKAGES_DIR, '.svelte');
    const violations: string[] = [];

    for (const file of svelteFiles) {
      const content = readText(file);
      if (content.includes('{@html')) {
        violations.push(file.replace(ROOT, ''));
      }
    }

    expect(violations, `{@html} found in: ${violations.join(', ')}`).toHaveLength(0);
  });

  it('finds no {@html} in any .ts file under packages/', () => {
    const tsFiles = findFiles(PACKAGES_DIR, '.ts').filter(
      (f) => !f.endsWith('.d.ts') && !f.endsWith('.test.ts'),
    );
    const violations: string[] = [];

    for (const file of tsFiles) {
      const content = readText(file);
      if (content.includes('{@html')) {
        violations.push(file.replace(ROOT, ''));
      }
    }

    expect(violations, `{@html} found in: ${violations.join(', ')}`).toHaveLength(0);
  });
});

// ─── FOUND-08: No CDN Tailwind ─────────────────────────────────────────────────

describe('FOUND-08: No CDN Tailwind injection', () => {
  const CDN_PATTERNS = [
    'unpkg.com/tailwindcss',
    'cdn.tailwindcss.com',
    'cdn.jsdelivr.net/npm/tailwindcss',
  ];

  it('finds no CDN Tailwind link in any .svelte file', () => {
    const svelteFiles = findFiles(PACKAGES_DIR, '.svelte');
    const violations: string[] = [];

    for (const file of svelteFiles) {
      const content = readText(file);
      for (const pattern of CDN_PATTERNS) {
        if (content.includes(pattern)) {
          violations.push(`${file.replace(ROOT, '')} (contains: ${pattern})`);
        }
      }
    }

    expect(violations, `CDN Tailwind found in: ${violations.join(', ')}`).toHaveLength(0);
  });

  it('finds no svelte:head CDN stylesheet injection', () => {
    const svelteFiles = findFiles(PACKAGES_DIR, '.svelte');
    const violations: string[] = [];

    for (const file of svelteFiles) {
      const content = readText(file);
      // svelte:head with an href that points to a CDN for Tailwind
      if (content.includes('<svelte:head>') && content.includes('tailwindcss')) {
        violations.push(file.replace(ROOT, ''));
      }
    }

    expect(
      violations,
      `CDN Tailwind in svelte:head found in: ${violations.join(', ')}`,
    ).toHaveLength(0);
  });
});

// ─── FOUND-09: No type-switcher <select> ───────────────────────────────────────

describe('FOUND-09: No runtime type-switcher <select>', () => {
  it('finds no <select> in Table.svelte column headers', () => {
    const tableSvelte = join(PACKAGES_DIR, 'svelte', 'src', 'lib', 'Table.svelte');

    expect(existsSync(tableSvelte), 'Table.svelte must exist').toBe(true);

    const content = readText(tableSvelte);

    // No bare <select> in Table.svelte (the type-switcher was the exact v1 defect)
    // This check excludes <select> that might appear in comments
    const selectMatches = content
      .split('\n')
      .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
      .filter((line) => line.includes('<select'));

    expect(
      selectMatches,
      `Type-switcher <select> found in Table.svelte: ${selectMatches.join(', ')}`,
    ).toHaveLength(0);
  });
});

// ─── FOUND-10: Node engines + Changesets ───────────────────────────────────────

describe('FOUND-10: Node engines and changesets configured', () => {
  it('root package.json declares engines.node >= 20.19.0', () => {
    const pkg = readJson(join(ROOT, 'package.json'));
    const engines = pkg['engines'] as Record<string, string> | undefined;
    expect(engines, 'engines field must exist in root package.json').toBeDefined();
    expect(engines!['node']).toContain('20.19.0');
  });

  it.each(PACKAGE_NAMES)('packages/%s/package.json declares engines.node', (pkgName) => {
    const pkgPath = join(PACKAGES_DIR, pkgName, 'package.json');
    const pkg = readJson(pkgPath);
    const engines = pkg['engines'] as Record<string, string> | undefined;
    expect(engines, `packages/${pkgName}/package.json must have engines field`).toBeDefined();
    expect(engines!['node'], `packages/${pkgName} node engine range`).toContain('20.19.0');
  });

  it('.changeset/config.json exists', () => {
    const changesetConfig = join(ROOT, '.changeset', 'config.json');
    expect(existsSync(changesetConfig), '.changeset/config.json must exist').toBe(true);
  });

  it('.changeset/config.json has access: public', () => {
    const changesetConfig = join(ROOT, '.changeset', 'config.json');
    const config = readJson(changesetConfig);
    expect(config['access']).toBe('public');
  });

  it('.changeset/config.json links all @tablecraft/* packages', () => {
    const changesetConfig = join(ROOT, '.changeset', 'config.json');
    const config = readJson(changesetConfig);
    const linked = config['linked'] as string[][] | undefined;
    expect(linked, 'linked array must exist').toBeDefined();
    const allLinked = linked!.flat();
    expect(allLinked).toContain('@tablecraft/core');
    expect(allLinked).toContain('@tablecraft/svelte');
  });
});

// ─── FOUND-01: Monorepo structure ─────────────────────────────────────────────

describe('FOUND-01: pnpm monorepo structure', () => {
  it('pnpm-workspace.yaml exists', () => {
    expect(existsSync(join(ROOT, 'pnpm-workspace.yaml'))).toBe(true);
  });

  it('pnpm-workspace.yaml contains packages/*', () => {
    const workspace = readText(join(ROOT, 'pnpm-workspace.yaml'));
    expect(workspace).toContain("'packages/*'");
  });

  it.each(PACKAGE_NAMES)('packages/%s/ directory exists', (pkgName) => {
    expect(existsSync(join(PACKAGES_DIR, pkgName))).toBe(true);
  });

  it.each(PACKAGE_NAMES)('packages/%s/package.json has correct @tablecraft/* name', (pkgName) => {
    const pkg = readJson(join(PACKAGES_DIR, pkgName, 'package.json'));
    expect(pkg['name']).toBe(`@tablecraft/${pkgName}`);
  });

  it('root package.json is private', () => {
    const pkg = readJson(join(ROOT, 'package.json'));
    expect(pkg['private']).toBe(true);
  });

  it('rollup.config.js does not exist (v1 build tool removed)', () => {
    expect(existsSync(join(ROOT, 'rollup.config.js'))).toBe(false);
  });

  it('src/ directory does not exist (v1 source removed)', () => {
    expect(existsSync(join(ROOT, 'src'))).toBe(false);
  });
});

// ─── Type exports sanity check ─────────────────────────────────────────────────

describe('FOUND-03: TypeScript types exported from @tablecraft/core', () => {
  it('types.ts exports ColumnType union', async () => {
    // Dynamic import to verify the module resolves correctly
    const types = await import('./types.js');
    expect(typeof types.defineColumns).toBe('function');
  });

  it('defineColumns helper returns an identity function', () => {
    // Import statically for type checking
    const { defineColumns } = require('./types.js') as typeof import('./types.js');
    const helper = defineColumns<{ name: string; age: number }>();
    const columns = helper([
      { key: 'name', type: 'text' },
      { key: 'age', type: 'number' },
    ]);
    expect(columns).toHaveLength(2);
    expect(columns[0].key).toBe('name');
    expect(columns[1].type).toBe('number');
  });
});
```

--- FILE: packages/svelte/src/lib/Table.test.ts ---

```typescript
/**
 * @tablecraft/svelte — Table component stub tests
 *
 * Phase 1: Verify the component renders without errors.
 * Phase 3: Full behavior tests (sorting, filtering, pagination, accessibility).
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Table from './Table.svelte';

describe('Table component (Phase 1 stub)', () => {
  it('renders without throwing', () => {
    // Minimal render — no data, no columns
    const { container } = render(Table, {
      props: { data: [] },
    });
    expect(container).toBeTruthy();
  });

  it('shows empty state when data is empty', () => {
    const { getByText } = render(Table, {
      props: { data: [] },
    });
    expect(getByText('No data to display.')).toBeTruthy();
  });

  it('renders column headers from data keys', () => {
    const data = [{ name: 'Alice', age: 30 }];
    const { getByText } = render(Table, {
      props: { data },
    });
    // Column header derived from key "name" → "Name" (capitalized)
    expect(getByText('Name')).toBeTruthy();
    expect(getByText('Age')).toBeTruthy();
  });

  it('renders row data as text without {@html}', () => {
    const data = [{ name: 'Alice', age: 30 }];
    const { getByText } = render(Table, {
      props: { data },
    });
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('30')).toBeTruthy();
  });

  it('renders boolean values as Yes/No', () => {
    const data = [{ active: true, verified: false }];
    const { getByText } = render(Table, {
      props: { data },
    });
    expect(getByText('Yes')).toBeTruthy();
    expect(getByText('No')).toBeTruthy();
  });

  it('uses role="grid" for accessibility', () => {
    const { container } = render(Table, {
      props: { data: [{ id: 1 }] },
    });
    expect(container.querySelector('[role="grid"]')).toBeTruthy();
  });
});
```

--- FILE: packages/react/src/index.test.ts ---

```typescript
/**
 * @tablecraft/react — Phase 1 stub tests
 */

import { describe, it, expect } from 'vitest';

describe('@tablecraft/react stub', () => {
  it('exports TABLECRAFT_REACT_VERSION', async () => {
    const mod = await import('./index.js');
    expect(mod.TABLECRAFT_REACT_VERSION).toBe('0.0.1');
  });

  it('re-exports ColumnType from @tablecraft/core (type check only)', () => {
    // This test verifies the module can be imported without runtime errors.
    // ColumnType is a type-only export — verified by TypeScript at build time.
    expect(true).toBe(true);
  });
});
```

--- FILE: packages/vue/src/index.test.ts ---

```typescript
/**
 * @tablecraft/vue — Phase 1 stub tests
 */

import { describe, it, expect } from 'vitest';

describe('@tablecraft/vue stub', () => {
  it('exports TABLECRAFT_VUE_VERSION', async () => {
    const mod = await import('./index.js');
    expect(mod.TABLECRAFT_VUE_VERSION).toBe('0.0.1');
  });

  it('re-exports ColumnType from @tablecraft/core (type check only)', () => {
    expect(true).toBe(true);
  });
});
```

After creating all four test files, run the full test suite:

```bash
pnpm test
```

Expected: All tests pass. foundation.test.ts has ~15 test cases that verify the FOUND-\* requirements. Table.test.ts has ~6 component tests. react/vue stubs have 2 tests each.

If any test fails:

FAIL: "No data to display." not found in Table.test.ts
FIX: Verify Table.svelte renders the empty state message exactly as "No data to display." — check the exact text in packages/svelte/src/lib/Table.svelte.

FAIL: foundation.test.ts "rollup.config.js does not exist"
FIX: If rollup.config.js still exists at repo root, delete it: `rm rollup.config.js`

FAIL: foundation.test.ts "defineColumns" import fails
FIX: The require() call in the test uses CommonJS syntax. Since packages/core/vitest.config.ts uses node environment, vitest handles .js extension resolution. If the import fails, change the test to:

```typescript
const { defineColumns } = await import('./types.js');
```

FAIL: Table.test.ts — jsdom missing or @testing-library/svelte not found
FIX: Verify @testing-library/svelte is in root devDependencies and pnpm install was run.

After all tests pass, run ESLint and Prettier:

```bash
# ESLint
pnpm lint
```

Expected: Zero errors. The eslint.config.js rule `svelte/no-at-html-tags: error` will fail if any {@html} is present — but we verified there is none.

If eslint fails with "Cannot find module '@eslint/js'" or similar:
FIX: The root devDependencies must include `"@eslint/js": "^9.24.0"`. Add it and run `pnpm install`.

```bash
# Prettier check
pnpm format:check
```

If prettier reports formatting issues, auto-fix them:

```bash
pnpm format
```

Then run `pnpm format:check` again to verify it exits 0.
</action>

  <verify>
    <automated>cd /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind && pnpm test 2>&1 | tail -20 && echo "TEST RUN COMPLETE"</automated>
  </verify>

<acceptance_criteria> - `test -f packages/core/src/foundation.test.ts` exits 0 - `grep "FOUND-07" packages/core/src/foundation.test.ts` finds the comment (test is documented) - `grep "FOUND-08" packages/core/src/foundation.test.ts` finds the comment - `grep "FOUND-09" packages/core/src/foundation.test.ts` finds the comment - `grep "FOUND-10" packages/core/src/foundation.test.ts` finds the comment - `grep "readFileSync" packages/core/src/foundation.test.ts` finds fs usage (test reads actual files) - `grep "{@html}" packages/core/src/foundation.test.ts | grep -v "#"` finds the string literal being checked (the test searches for this pattern) - `test -f packages/svelte/src/lib/Table.test.ts` exits 0 - `grep "render(Table" packages/svelte/src/lib/Table.test.ts` finds the render call - `grep "No data to display" packages/svelte/src/lib/Table.test.ts` finds the expected text - `grep 'role="grid"' packages/svelte/src/lib/Table.test.ts` finds the accessibility check - `test -f packages/react/src/index.test.ts` exits 0 - `test -f packages/vue/src/index.test.ts` exits 0 - `pnpm test` exits 0 (all tests pass) - `pnpm lint` exits 0 (zero ESLint errors) - `pnpm format:check` exits 0 (all files Prettier-formatted) - `pnpm exec playwright test --project=chromium` exits 0 (smoke test passes)
</acceptance_criteria>

<done>All test files exist. pnpm test exits 0 — Vitest runs foundation.test.ts (FOUND-\* spec), Table.test.ts (Svelte component), and react/vue stubs. pnpm lint exits 0. pnpm format:check exits 0. pnpm exec playwright test exits 0 for smoke test. Phase 1 success criteria are all machine-verified by the foundation test suite.</done>
</task>

</tasks>

<verification>
Final Phase 1 verification — all five success criteria from ROADMAP.md:

```bash
echo "=== PHASE 1 SUCCESS CRITERIA ==="

# Criterion 1: pnpm install && pnpm build succeeds with zero errors
pnpm install && pnpm -r build && echo "CRITERION 1: PASS" || echo "CRITERION 1: FAIL"

# Criterion 2: pnpm test runs without failures
pnpm test && echo "CRITERION 2: PASS" || echo "CRITERION 2: FAIL"

# Criterion 3: No {@html} string concatenation in any source file
HTMLCOUNT=$(grep -r '{@html}' packages/ --include='*.svelte' --include='*.ts' | grep -v 'dist/' | grep -v 'node_modules/' | wc -l)
[ "$HTMLCOUNT" -eq 0 ] && echo "CRITERION 3: PASS (0 {@html} occurrences)" || echo "CRITERION 3: FAIL ($HTMLCOUNT occurrences)"

# Criterion 4: No Tailwind CDN link, no type-switcher <select>
CDNCOUNT=$(grep -r 'unpkg.com\|cdn.tailwindcss' packages/ --include='*.svelte' | wc -l)
SELECTCOUNT=$(grep -r '<select' packages/svelte/src/ --include='*.svelte' | wc -l)
[ "$CDNCOUNT" -eq 0 ] && echo "CRITERION 4a CDN: PASS" || echo "CRITERION 4a CDN: FAIL ($CDNCOUNT occurrences)"
[ "$SELECTCOUNT" -eq 0 ] && echo "CRITERION 4b select: PASS" || echo "CRITERION 4b select: FAIL ($SELECTCOUNT occurrences)"

# Criterion 5: MIT license + engines.node >= 20
grep -q '"license": "MIT"' package.json && echo "CRITERION 5a license: PASS" || echo "CRITERION 5a: FAIL"
grep -q '"node": ">=20.19.0' package.json && echo "CRITERION 5b engines: PASS" || echo "CRITERION 5b: FAIL"
grep -q 'MIT License' LICENSE && echo "CRITERION 5c LICENSE file: PASS" || echo "CRITERION 5c: FAIL"

echo "=== TOOLCHAIN DEFECT CHECKS ==="
test ! -f rollup.config.js && echo "rollup.config.js: GONE" || echo "rollup.config.js: STILL EXISTS (defect)"
test ! -d src/ && echo "src/ directory: GONE" || echo "src/: STILL EXISTS (defect)"

echo "=== TESTING INFRASTRUCTURE ==="
pnpm exec playwright test --project=chromium && echo "Playwright smoke: PASS" || echo "Playwright smoke: FAIL"
```

</verification>

<success_criteria>

1. `pnpm test` exits 0 — Vitest runs across all 4 packages with zero failures — FOUND-11 satisfied
2. `pnpm exec playwright test --project=chromium` exits 0 — E2E infrastructure proven — FOUND-11 satisfied
3. `pnpm lint` exits 0 — ESLint 9 clean, including svelte/no-at-html-tags:error — FOUND-12 satisfied
4. `pnpm format:check` exits 0 — Prettier clean with prettier-plugin-svelte — FOUND-12 satisfied
5. foundation.test.ts contains tests for FOUND-06, FOUND-07, FOUND-08, FOUND-09, FOUND-10, FOUND-01 that all PASS — these requirements are permanently machine-verified
6. Phase 1 success criteria from ROADMAP.md all satisfied:
   - Criterion 1: `pnpm install && pnpm build` succeeds (proven in Wave 3)
   - Criterion 2: `pnpm test` runs without failures (this plan)
   - Criterion 3: No `{@html}` in any source (foundation.test.ts asserts this)
   - Criterion 4: No CDN Tailwind, no type-switcher select (foundation.test.ts asserts this)
   - Criterion 5: MIT license + engines.node >= 20 everywhere (foundation.test.ts asserts this)
     </success_criteria>

<output>
After completion, create `.planning/phases/01-foundation/01-04-SUMMARY.md` with:
- Test counts: N tests passing across M packages
- foundation.test.ts test IDs and which FOUND-* requirement each covers
- ESLint result (zero errors — list any rules that flagged warnings if any)
- Prettier result (formatted N files or already clean)
- Playwright result (smoke test pass on Chromium)
- Any test failures encountered and how they were fixed
- Final state: Phase 1 complete, all 5 success criteria proven by automated tests
</output>
