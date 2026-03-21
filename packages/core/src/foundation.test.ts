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
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM-safe __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  it('types.ts exports defineColumns helper', async () => {
    // Dynamic import to verify the module resolves correctly
    const types = await import('./types.js');
    expect(typeof types.defineColumns).toBe('function');
  });

  it('defineColumns helper returns an identity function', async () => {
    const { defineColumns } = await import('./types.js');
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
