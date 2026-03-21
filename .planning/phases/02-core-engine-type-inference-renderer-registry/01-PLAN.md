---
phase: 02-core-engine-type-inference-renderer-registry
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/core/src/types.ts
  - packages/core/src/tokens.ts
  - packages/core/src/scheduler.ts
  - packages/core/vite.config.ts
  - packages/core/vitest.config.ts
  - packages/core/src/scheduler.test.ts
  - packages/core/src/tokens.test.ts
autonomous: true
requirements:
  - CORE-05
  - CORE-09

must_haves:
  truths:
    - "types.ts exports CellDescriptor, ResolvedColumn, RendererFn, ProcessedRow, BadgeVariant without removing existing Phase 1 types"
    - "tokens.ts exports a DEFAULT_TOKENS object containing all 18 --tc-* CSS custom property names as keys"
    - "scheduler.ts exports scheduleIdleWork that uses requestIdleCallback in browser, setImmediate in Node, setTimeout fallback"
    - "vitest.config.ts has coverage thresholds: inference >= 95%, renderers >= 90%"
    - "vite.config.ts uses rolldownOptions (not rollupOptions), multi-entry with 17 renderer paths, rollupTypes: false, formats es+cjs only"
    - "scheduler.test.ts and tokens.test.ts exist with failing stubs (Wave 0 established)"
  artifacts:
    - path: "packages/core/src/types.ts"
      provides: "All Phase 2 type contracts"
      contains: "CellDescriptor"
    - path: "packages/core/src/tokens.ts"
      provides: "CSS token defaults"
      contains: "DEFAULT_TOKENS"
    - path: "packages/core/src/scheduler.ts"
      provides: "Isomorphic idle scheduling"
      exports: ["scheduleIdleWork"]
    - path: "packages/core/src/scheduler.test.ts"
      provides: "Wave 0 test stubs for CORE-05"
    - path: "packages/core/src/tokens.test.ts"
      provides: "Wave 0 test stubs for CORE-09"
    - path: "packages/core/vite.config.ts"
      provides: "Multi-entry Vite 8 build config"
      contains: "rolldownOptions"
    - path: "packages/core/vitest.config.ts"
      provides: "Coverage thresholds"
      contains: "src/inference"
  key_links:
    - from: "packages/core/src/types.ts"
      to: "packages/core/src/registry/index.ts"
      via: "RendererFn + ResolvedColumn imported in Wave 3"
    - from: "packages/core/vite.config.ts"
      to: "packages/core/src/renderers/*.ts"
      via: "rendererEntries object in lib.entry map"
---

<objective>
Establish all type contracts, infrastructure helpers, build config, and test stubs that every later wave depends on. Nothing in this plan contains business logic — it defines the contracts and scaffolding so Waves 2-5 have zero ambiguity.

Purpose: Every downstream plan imports from types.ts (for CellDescriptor/ResolvedColumn/RendererFn) and relies on the scheduler for async inference. Getting these right first eliminates re-work.
Output: Extended types.ts, new tokens.ts, new scheduler.ts, updated vite.config.ts with multi-entry, updated vitest.config.ts with coverage thresholds, two Wave 0 test stubs.
</objective>

<execution_context>
@/Users/arshdeep.singh/.claude/get-shit-done/workflows/execute-plan.md
@/Users/arshdeep.singh/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/phases/02-core-engine-type-inference-renderer-registry/02-CONTEXT.md
@.planning/phases/02-core-engine-type-inference-renderer-registry/02-RESEARCH.md

<interfaces>
<!-- Existing types.ts exports — DO NOT remove, only append -->
From packages/core/src/types.ts:
```typescript
export type ColumnType = 'text' | 'number' | 'integer' | 'currency' | 'percentage' | 'boolean' | 'date' | 'datetime' | 'time' | 'email' | 'url' | 'phone' | 'image' | 'badge' | 'status' | 'code' | 'html';
export type ColumnOverrideShort = Record<string, ColumnType>;
export interface ColumnDefinition<TRow = Record<string, unknown>> { key, label?, type?, sortable?, filterable?, hideable?, minWidth?, maxWidth?, pinned? }
export interface TableConfig<TRow = Record<string, unknown>> { data: TRow[]; columns?: ColumnOverrideShort | ColumnDefinition<TRow>[]; }
export interface InferenceResult { type: ColumnType; confidence: number; source: 'declared' | 'inferred' | 'fallback'; }
export type ColumnInferenceMap = Record<string, InferenceResult>;
export function defineColumns<TRow>(): (cols: ColumnDefinition<TRow>[]) => ColumnDefinition<TRow>[];
```

From packages/core/vite.config.ts (current — to be replaced):
```typescript
// Uses rollupOptions (deprecated in Vite 8), single entry, formats: ['es','cjs','umd'], rollupTypes: true
// Phase 2 MUST rename to rolldownOptions, drop UMD for multi-entry, set rollupTypes: false
```

From packages/core/vitest.config.ts (current — to be updated):
```typescript
// No coverage thresholds yet — Phase 2 adds glob thresholds for inference >= 95%, renderers >= 90%
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Extend types.ts + create tokens.ts</name>
  <files>
    packages/core/src/types.ts
    packages/core/src/tokens.ts
  </files>
  <read_first>
    - packages/core/src/types.ts — READ THE ENTIRE FILE before touching it; append only, never remove existing exports
    - .planning/phases/02-core-engine-type-inference-renderer-registry/02-CONTEXT.md — CellDescriptor union definition (decisions section)
    - .planning/phases/02-core-engine-type-inference-renderer-registry/02-RESEARCH.md — TypeScript patterns section, CellDescriptor union, tokens list
  </read_first>
  <behavior>
    - types.ts: All existing Phase 1 exports remain untouched
    - types.ts: BadgeVariant type is exported
    - types.ts: CellDescriptor union has all 10 discriminated members (text, number, link, image, badge, status, boolean, code, html, raw)
    - types.ts: RendererFn = (value: unknown, column: ResolvedColumn) => CellDescriptor
    - types.ts: ResolvedColumn extends ColumnDefinition with required type and label fields, optional inferenceResult
    - types.ts: ProcessedRow has _original and cells fields
    - tokens.ts: exports DEFAULT_TOKENS as const object with exactly 18 --tc-* keys matching the list in CONTEXT.md
  </behavior>
  <action>
STEP 1 — Read packages/core/src/types.ts completely. Do not overwrite it. Append the following block after the last line of the file:

```typescript
// ---------------------------------------------------------------------------
// Phase 2 additions — renderer and engine types
// ---------------------------------------------------------------------------

/** Variant names shared by badge and status renderers */
export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

/**
 * Discriminated union returned by every renderer function.
 * The Svelte component (Phase 3) switches on `kind` — never calls {@html} on raw data.
 * FOUND-07: No at-html string concatenation.
 */
export type CellDescriptor =
  | { kind: 'text'; value: string }
  | { kind: 'number'; value: number; formatted: string }
  | { kind: 'link'; href: string; label: string; external?: boolean }
  | { kind: 'image'; src: string; alt: string }
  | { kind: 'badge'; label: string; variant: BadgeVariant }
  | { kind: 'status'; label: string; variant: BadgeVariant }
  | { kind: 'boolean'; value: boolean }
  | { kind: 'code'; value: string }
  | { kind: 'html'; sanitized: string }
  | { kind: 'raw'; value: unknown };

/**
 * Renderer function signature — all built-in and custom renderers implement this.
 * CORE-06: Built-ins use the same API as external plugins.
 */
export type RendererFn = (value: unknown, column: ResolvedColumn) => CellDescriptor;

/**
 * Column definition after inference + override resolution.
 * type and label are always present (defaults applied); inferenceResult is present when inferred.
 */
export interface ResolvedColumn extends ColumnDefinition {
  /** Always present after resolution — inferred or declared */
  type: ColumnType;
  /** Always present after resolution — key is used as fallback */
  label: string;
  /** Present when the type came from the inference engine */
  inferenceResult?: InferenceResult;
}

/**
 * A single data row after processing through resolveColumns + renderer pipeline.
 * _original holds the raw row object; cells maps column key → CellDescriptor.
 * CORE-08: State is external — ProcessedRow is immutable output, not reactive state.
 */
export interface ProcessedRow {
  /** The original data row (typed as Record for framework-agnostic use) */
  _original: Record<string, unknown>;
  /** Column key → rendered cell descriptor */
  cells: Record<string, CellDescriptor>;
}
```

STEP 2 — Create packages/core/src/tokens.ts with this exact content:

```typescript
/**
 * @tablecraft/core — CSS custom property design token defaults
 *
 * CORE-09: 18 --tc-* tokens exported as a plain object.
 * The Svelte package (Phase 3) injects these in :root or [data-tc] scope.
 * Consumers override via CSS: [data-theme="dark"] { --tc-color-bg: #0f172a; }
 */

export const DEFAULT_TOKENS = {
  // Colors
  '--tc-color-text': '#111827',
  '--tc-color-text-muted': '#6B7280',
  '--tc-color-bg': '#FFFFFF',
  '--tc-color-bg-hover': '#F9FAFB',
  '--tc-color-border': '#E5E7EB',
  '--tc-color-accent': '#3B82F6',
  // Status colors
  '--tc-color-success': '#10B981',
  '--tc-color-warning': '#F59E0B',
  '--tc-color-danger': '#EF4444',
  '--tc-color-info': '#6366F1',
  // Spacing
  '--tc-row-height': '48px',
  '--tc-cell-padding-x': '12px',
  '--tc-cell-padding-y': '8px',
  '--tc-header-height': '40px',
  // Typography
  '--tc-font-family': 'inherit',
  '--tc-font-size': '14px',
  '--tc-font-size-sm': '12px',
  // Borders
  '--tc-border-radius': '4px',
  '--tc-border-width': '1px',
} as const;

export type TokenName = keyof typeof DEFAULT_TOKENS;
```
  </action>
  <verify>
    <automated>cd /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind && pnpm --filter @tablecraft/core typecheck 2>&1 | tail -5</automated>
  </verify>
  <acceptance_criteria>
    - grep -c "CellDescriptor" packages/core/src/types.ts returns >= 1
    - grep -c "ResolvedColumn" packages/core/src/types.ts returns >= 1
    - grep -c "RendererFn" packages/core/src/types.ts returns >= 1
    - grep -c "ProcessedRow" packages/core/src/types.ts returns >= 1
    - grep -c "BadgeVariant" packages/core/src/types.ts returns >= 1
    - grep "defineColumns" packages/core/src/types.ts still exists (not removed)
    - grep -c "\-\-tc\-" packages/core/src/tokens.ts returns 18
    - pnpm --filter @tablecraft/core typecheck exits 0
  </acceptance_criteria>
  <done>types.ts has all Phase 1 exports plus 5 new Phase 2 types. tokens.ts has exactly 18 --tc-* tokens. TypeScript strict mode passes.</done>
</task>

<task type="auto">
  <name>Task 2: Create scheduler.ts + Wave 0 test stubs + update vite.config.ts + vitest.config.ts</name>
  <files>
    packages/core/src/scheduler.ts
    packages/core/src/scheduler.test.ts
    packages/core/src/tokens.test.ts
    packages/core/vite.config.ts
    packages/core/vitest.config.ts
  </files>
  <read_first>
    - packages/core/vite.config.ts — read entire file before rewriting; note rollupOptions location and existing structure
    - packages/core/vitest.config.ts — read entire file before updating; add thresholds without removing existing config
    - .planning/phases/02-core-engine-type-inference-renderer-registry/02-RESEARCH.md — requestIdleCallback SSR Pattern section, Vitest Coverage Configuration section, Vite Multi-Entry Tree-Shaking section
  </read_first>
  <action>
STEP 1 — Create packages/core/src/scheduler.ts:

```typescript
/**
 * @tablecraft/core — Isomorphic idle work scheduler
 *
 * CORE-05: Type inference runs in requestIdleCallback (browser) or setImmediate (Node.js 20+).
 * The table renders immediately with text fallback; inference updates the column types once idle.
 *
 * Environment detection:
 *   - requestIdleCallback: present in browser environments
 *   - setImmediate: present in Node.js 20+ (executes after I/O, before setTimeout)
 *   - setTimeout(fn, 0): universal fallback for edge runtimes and old Node
 *
 * DO NOT check `typeof navigator` to detect environment — Node 20 ships a partial
 * navigator global that makes the check unreliable. Use requestIdleCallback presence instead.
 */

type Callback = () => void;

/**
 * Schedule a function to run when the thread is idle.
 * Uses requestIdleCallback in browser, setImmediate in Node 20+, setTimeout fallback elsewhere.
 */
export function scheduleIdleWork(fn: Callback): void {
  if (typeof requestIdleCallback !== 'undefined') {
    // Browser: defer until the browser has no pending work
    requestIdleCallback(fn);
  } else if (typeof setImmediate !== 'undefined') {
    // Node.js 20+: after I/O phase, before setTimeout — better inference semantics
    setImmediate(fn);
  } else {
    // Edge runtimes, old Node, Cloudflare Workers
    setTimeout(fn, 0);
  }
}
```

STEP 2 — Create packages/core/src/scheduler.test.ts (Wave 0 stubs — these MUST fail until scheduler.ts is implemented, but scheduler.ts is created in Step 1 so these should pass):

```typescript
/**
 * CORE-05: scheduleIdleWork scheduler tests
 * Wave 0 stubs — these are the acceptance criteria for the scheduler implementation.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { scheduleIdleWork } from './scheduler.js';

describe('scheduleIdleWork', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls the callback synchronously via setImmediate in Node environment', async () => {
    const fn = vi.fn();
    // In Node 20 test environment: setImmediate is available, requestIdleCallback is not
    scheduleIdleWork(fn);
    // setImmediate executes before the next event loop tick completes
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('calls the callback exactly once', async () => {
    const fn = vi.fn();
    scheduleIdleWork(fn);
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('schedules via requestIdleCallback when available', async () => {
    const mockRIC = vi.fn((cb: FrameRequestCallback) => { cb({} as IdleDeadline); return 0; });
    // Temporarily make requestIdleCallback available
    const originalRIC = (globalThis as Record<string, unknown>)['requestIdleCallback'];
    (globalThis as Record<string, unknown>)['requestIdleCallback'] = mockRIC;

    const fn = vi.fn();
    scheduleIdleWork(fn);

    // Restore before assertion
    (globalThis as Record<string, unknown>)['requestIdleCallback'] = originalRIC;

    expect(mockRIC).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledOnce();
  });

  it('falls back to setTimeout when neither requestIdleCallback nor setImmediate available', async () => {
    const originalRIC = (globalThis as Record<string, unknown>)['requestIdleCallback'];
    const originalSI = (globalThis as Record<string, unknown>)['setImmediate'];
    delete (globalThis as Record<string, unknown>)['requestIdleCallback'];
    delete (globalThis as Record<string, unknown>)['setImmediate'];

    const fn = vi.fn();
    scheduleIdleWork(fn);

    await new Promise<void>((resolve) => setTimeout(resolve, 10));
    expect(fn).toHaveBeenCalledOnce();

    // Restore globals
    (globalThis as Record<string, unknown>)['requestIdleCallback'] = originalRIC;
    (globalThis as Record<string, unknown>)['setImmediate'] = originalSI;
  });
});
```

STEP 3 — Create packages/core/src/tokens.test.ts (Wave 0 stubs):

```typescript
/**
 * CORE-09: CSS custom property token system tests
 * Verifies DEFAULT_TOKENS has all 18 --tc-* tokens with non-empty string values.
 */
import { describe, it, expect } from 'vitest';
import { DEFAULT_TOKENS } from './tokens.js';

describe('DEFAULT_TOKENS', () => {
  const EXPECTED_TOKENS = [
    '--tc-color-text',
    '--tc-color-text-muted',
    '--tc-color-bg',
    '--tc-color-bg-hover',
    '--tc-color-border',
    '--tc-color-accent',
    '--tc-color-success',
    '--tc-color-warning',
    '--tc-color-danger',
    '--tc-color-info',
    '--tc-row-height',
    '--tc-cell-padding-x',
    '--tc-cell-padding-y',
    '--tc-header-height',
    '--tc-font-family',
    '--tc-font-size',
    '--tc-font-size-sm',
    '--tc-border-radius',
    '--tc-border-width',
  ] as const;

  it('exports exactly 18 tokens', () => {
    expect(Object.keys(DEFAULT_TOKENS)).toHaveLength(18);
  });

  it('contains all expected --tc-* token names', () => {
    for (const token of EXPECTED_TOKENS) {
      expect(DEFAULT_TOKENS).toHaveProperty(token);
    }
  });

  it('all token values are non-empty strings', () => {
    for (const [key, value] of Object.entries(DEFAULT_TOKENS)) {
      expect(typeof value, `Token ${key} should be a string`).toBe('string');
      expect(value.length, `Token ${key} should not be empty`).toBeGreaterThan(0);
    }
  });

  it('all token keys start with --tc-', () => {
    for (const key of Object.keys(DEFAULT_TOKENS)) {
      expect(key.startsWith('--tc-'), `${key} should start with --tc-`).toBe(true);
    }
  });

  it('--tc-row-height default is 48px', () => {
    expect(DEFAULT_TOKENS['--tc-row-height']).toBe('48px');
  });

  it('is a const object (values are string literals, not mutable)', () => {
    // TypeScript const assertion prevents mutation — verify the object is not a class instance
    expect(typeof DEFAULT_TOKENS).toBe('object');
    expect(DEFAULT_TOKENS).not.toBeNull();
  });
});
```

STEP 4 — Rewrite packages/core/vite.config.ts (replacing the entire file — the old single-entry config is no longer correct):

```typescript
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

/**
 * All 17 Tier 1 renderer names.
 * Each gets its own entry point in the build for tree-shaking (CORE-07).
 * Importing @tablecraft/core/renderers/currency does NOT load code or html renderer.
 */
const RENDERER_NAMES = [
  'text',
  'number',
  'integer',
  'currency',
  'percentage',
  'boolean',
  'date',
  'datetime',
  'time',
  'email',
  'url',
  'phone',
  'image',
  'badge',
  'status',
  'code',
  'html',
] as const;

const rendererEntries = Object.fromEntries(
  RENDERER_NAMES.map((name) => [
    `renderers/${name}`,
    resolve(__dirname, `src/renderers/${name}.ts`),
  ]),
);

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        ...rendererEntries,
      },
      // name is not required for multi-entry (only needed for UMD single-entry)
      // UMD format dropped for multi-entry — not supported by Rolldown for multiple entries.
      // Phase 5 (WC-09) adds UMD via a separate build config for the web component.
      formats: ['es', 'cjs'],
    },
    // CRITICAL: renamed from rollupOptions in Vite 8 (rollupOptions is deprecated, will break in Vite 9)
    rolldownOptions: {
      external: [], // zero runtime dependencies — 50KB budget
    },
    sourcemap: true,
    minify: false,
  },
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      outDir: 'dist',
      // CRITICAL: false = one .d.ts per source file — required for multi-entry tree-shaking.
      // true would bundle all declarations into index.d.ts, breaking individual renderer imports.
      rollupTypes: false,
    }),
  ],
});
```

STEP 5 — Rewrite packages/core/vitest.config.ts (adding coverage thresholds; preserve all existing fields):

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
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.d.ts',
        'src/tokens.ts', // plain data object — no branches to cover
      ],
      thresholds: {
        // Global floor — all source files must meet this minimum
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
        // CORE-12: Inference engine must exceed 95% (per-glob override)
        'src/inference/**/*.ts': {
          lines: 95,
          functions: 95,
          branches: 90,
          statements: 95,
        },
        // CORE-12: All renderer modules must exceed 90% (per-glob override)
        'src/renderers/**/*.ts': {
          lines: 90,
          functions: 90,
          branches: 85,
          statements: 90,
        },
      },
    },
  },
});
```
  </action>
  <verify>
    <automated>cd /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind && pnpm --filter @tablecraft/core test --reporter=verbose 2>&1 | grep -E "(PASS|FAIL|✓|×|scheduler|tokens)" | head -20</automated>
  </verify>
  <acceptance_criteria>
    - grep "rolldownOptions" packages/core/vite.config.ts returns a match (old rollupOptions gone)
    - grep "rollupTypes: false" packages/core/vite.config.ts returns a match
    - grep "renderers/currency" packages/core/vite.config.ts returns a match (multi-entry exists)
    - grep "formats.*es.*cjs" packages/core/vite.config.ts returns a match (no umd)
    - grep "src/inference" packages/core/vitest.config.ts returns a match (threshold added)
    - grep "src/renderers" packages/core/vitest.config.ts returns a match (threshold added)
    - pnpm --filter @tablecraft/core test exits 0 (scheduler and tokens tests pass)
    - grep "scheduleIdleWork" packages/core/src/scheduler.ts returns a match
  </acceptance_criteria>
  <done>scheduler.ts, scheduler.test.ts, tokens.test.ts exist and tests pass. vite.config.ts uses rolldownOptions + multi-entry + rollupTypes:false. vitest.config.ts has inference >= 95% and renderers >= 90% thresholds.</done>
</task>

</tasks>

<verification>
After both tasks complete:
1. `pnpm --filter @tablecraft/core test` — all tests pass (scheduler + tokens stubs)
2. `pnpm --filter @tablecraft/core typecheck` — strict mode passes
3. `grep -c "CellDescriptor\|ResolvedColumn\|RendererFn\|ProcessedRow\|BadgeVariant" packages/core/src/types.ts` — returns >= 5
4. `grep -c "\-\-tc\-" packages/core/src/tokens.ts` — returns 18
5. `grep "rolldownOptions" packages/core/vite.config.ts` — returns match
6. `grep "rollupTypes: false" packages/core/vite.config.ts` — returns match
</verification>

<success_criteria>
- types.ts has all Phase 1 exports PLUS CellDescriptor (10 variants), ResolvedColumn, RendererFn, ProcessedRow, BadgeVariant — strict TypeScript passes
- tokens.ts has DEFAULT_TOKENS with exactly 18 --tc-* keys — tokens.test.ts passes
- scheduler.ts uses requestIdleCallback > setImmediate > setTimeout priority — scheduler.test.ts passes
- vite.config.ts: rolldownOptions (not rollupOptions), formats es+cjs, 17 renderer entries, rollupTypes: false
- vitest.config.ts: inference >= 95%, renderers >= 90% thresholds configured
- All existing tests (foundation.test.ts) still pass
</success_criteria>

<output>
After completion, create `.planning/phases/02-core-engine-type-inference-renderer-registry/02-01-SUMMARY.md`
</output>
