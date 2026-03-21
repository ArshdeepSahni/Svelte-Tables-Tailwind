# Phase 2: Core Engine + Type Inference + Renderer Registry — Research

**Researched:** 2026-03-21
**Domain:** Framework-agnostic TypeScript — inference engine, renderer registry, Vite 8 library builds
**Confidence:** HIGH (verified against live npm registry, Vite 8 migration guide, Vitest 4 docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- `createTableEngine(config)` returns a plain object (not a class) with `inferSchema`, `resolveColumns`, `processRows`, `getConfig` methods
- Engine is stateless — no DOM dependencies, must work in Node.js/Vitest with no browser
- Renderers return `CellDescriptor` union — never raw HTML strings
- 15 detectors in priority order: boolean → currency → percentage → integer → number → datetime → date → time → email → phone → image → url → status → code → text
- Systematic sampling: every `Math.ceil(data.length / 200)` rows, up to 200 samples
- Confidence threshold: 0.8; column-name keyword boosting adds 0.15
- `requestIdleCallback` for async inference in browser; synchronous in SSR/Node
- Global `Map<string, RendererFn>` registry; `registerRenderer` / `getRenderer` / `hasRenderer` / `unregisterRenderer` API
- 17 Tier 1 renderers — each in its own file, individually tree-shakable
- DOMPurify is a peer dependency — not bundled; `html` renderer throws if unavailable
- CSS token object in `packages/core/src/tokens.ts` — 18 `--tc-*` custom properties
- v1 shim at `packages/core/src/compat/v1.ts` — `adaptV1Props(colname, rowdata)` → deprecation console.warn
- Tests: > 95% line coverage on inference engine, > 90% on all renderers via Vitest

### Claude's Discretion

- Exact file organization within `packages/core/src/` (inference/, renderers/, compat/ subdirs recommended)
- Internal helper functions (number parsing, string trimming, null coercion)
- Exact error message wording
- Whether to use `Map` or plain object for registry internals
- Exact Vitest test file naming convention
- Whether to use `Symbol` for internal token identification

### Deferred Ideas (OUT OF SCOPE)

- Dynamic row heights (prefix-sum arrays) — Phase 4 or v3
- `requestAnimationFrame`-batched inference updates — Phase 3 optimization
- Worker-thread inference for > 100k rows — Phase 4
- Tier 2 renderers (avatar-with-name, progress, relative-time, sparkline, actions) — v2.1
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CORE-01 | `createTableEngine(config)` factory — framework-agnostic, event emitter interface | TypeScript factory pattern; plain-object return; stateless design |
| CORE-02 | Type inference — 200-row sampling, 14+ detectors, priority order, confidence threshold | Verified systematic sampling math; detector chain design pattern |
| CORE-03 | All 14+ type detectors implemented | Regex patterns; Intl edge cases verified empirically |
| CORE-04 | Field-name keyword heuristics boost confidence | 0.15 boost table defined; keyword mapping locked in CONTEXT.md |
| CORE-05 | `requestIdleCallback` — browser async, SSR sync | `typeof requestIdleCallback !== 'undefined'` guard; `setImmediate` available in Node 20 |
| CORE-06 | Renderer plugin registry with `registerRenderer` API | `Map<string, RendererFn>`; built-ins use same API |
| CORE-07 | 17 Tier 1 renderers as tree-shakable modules | Vite 8 multi-entry lib mode; `rolldownOptions.external`; exports map |
| CORE-08 | State graph separation documented (implementation in Phase 3) | Document in `packages/core/src/README.md` only; no Svelte code here |
| CORE-09 | CSS custom property token system (`--tc-*`) | 18 tokens defined; plain JS object in `tokens.ts` |
| CORE-10 | v1 `colname`/`rowdata` shim with deprecation warning | Duplicate-key bug documented; type mappings locked |
| CORE-11 | `defineColumns<TRow>()` helper — already exists in Phase 1 types.ts | Already shipped; no new work required |
| CORE-12 | > 95% inference coverage, > 90% renderer coverage via Vitest | Vitest 4 glob thresholds pattern verified |
</phase_requirements>

---

## Key Findings

1. **Vite 8 ships Rolldown internally** — `vite@8.0.1` (already installed) uses Rolldown as its bundler. There is no better alternative for this use case. Rolldown standalone (`1.0.0-rc.10`) is pre-release with experimental CSS and WIP minification — do not use it directly.

2. **`rollupOptions` → `rolldownOptions` is a Vite 8 breaking change** — the existing `vite.config.ts` uses `rollupOptions`. It still works with a deprecation warning, but it must be renamed to `rolldownOptions` in Phase 2 when the config is expanded. The `system` and `amd` output formats are removed; UMD still works.

3. **`vite-plugin-dts` 4.5.4 is the legacy path; `unplugin-dts` 1.0.0-beta.6 is the Rolldown-native replacement** — `vite-plugin-dts` is now maintained as a compatibility shim. `unplugin-dts` is the rewritten universal plugin that explicitly supports Rolldown. However, 1.0.0-beta.6 is pre-release. Use `vite-plugin-dts@4.5.4` (already installed) and verify it works with Vite 8 multi-entry; switch to `unplugin-dts` only if type generation breaks.

4. **Multi-entry Vite library mode produces `es` + `cjs` only — UMD requires a single entry** — the `index` entry can keep UMD; the 17 renderer entries get `es` + `cjs` only. This is the correct architecture.

5. **`Intl.NumberFormat` does NOT throw on null/undefined/NaN/Infinity** — verified empirically. `null` coerces to `$0.00`, `NaN` displays as `$NaN`, `Infinity` displays as `$∞`. Renderers need input normalization (coerce to number, return `{ kind: 'raw', value }` for non-parseable input) but not try/catch around `Intl`.

6. **Duplicate keys in v1 `colname` are silently dropped by JS** — `JSON.parse('{"string":"Name","string":"Email"}')` returns `{"string":"Email"}` — only the last value survives. The shim must detect this at the object level (compare `Object.keys(colname).length` vs expected unique types) and warn explicitly.

7. **Vitest 4 supports per-glob coverage thresholds** — `coverage.thresholds['src/inference/**/*.ts'] = { lines: 95 }` is the correct syntax. The `perFile: true` flag enforces per-file (not aggregate) thresholds — use this for the renderer coverage gate.

8. **`setImmediate` is available in Node 20** — the SSR fallback for `requestIdleCallback` can prefer `setImmediate` over `setTimeout(fn, 0)` because `setImmediate` executes after I/O events (better semantics for inference deferral).

---

## Build Tool Decision: Vite 8 is Correct

**Question asked:** Is there anything far better than Vite for this use case?

**Answer: No. Vite 8 with Rolldown IS the current state of the art for TypeScript library builds.**

| Tool | Version | Status | Verdict |
|------|---------|--------|---------|
| **Vite 8** | 8.0.1 (installed) | Stable — uses Rolldown internally | **Use this** |
| Rolldown standalone | 1.0.0-rc.10 | RC — experimental CSS, WIP minification | Skip — Vite wraps it |
| tsup | 8.x | Stable — wraps esbuild | Worse: no per-file multi-entry, no Rolldown |
| unbuild | 3.x | Stable — Rollup-based | Worse: Rollup speed, less tree-shaking control |
| esbuild standalone | 0.25.x | Stable | No `.d.ts` generation, no UMD, no entry map |
| Rollup 4 standalone | 4.x | Stable — deprecated for Vite projects | Being replaced by Rolldown |

**Why Vite 8 wins:** It already uses Rolldown for 10-30x faster builds, has the exact multi-entry library mode needed, generates correct `.d.ts` via `vite-plugin-dts`, and is already installed and working. The team does not need to switch tools.

---

## Standard Stack

### Core (already installed — no new installs for core logic)

| Package | Version | Purpose | Note |
|---------|---------|---------|------|
| `vite` | 8.0.1 | Library bundler (uses Rolldown internally) | Already installed |
| `typescript` | 5.8.3 | Strict mode compilation | Already installed |
| `vitest` | 4.1.0 | Unit tests + coverage | Already installed |
| `vite-plugin-dts` | 4.5.4 | TypeScript declaration generation | Already installed — verify with multi-entry |
| `@vitest/coverage-v8` | 4.1.0 | V8-based coverage provider | Already installed |

### No New Runtime Dependencies

`@tablecraft/core` has zero runtime dependencies by design. The 50KB gzip budget requires this. DOMPurify is peer-only.

### Package.json Changes Needed

```json
// Add to peerDependencies (optional):
"peerDependencies": {
  "dompurify": ">=3.0.0"
},
"peerDependenciesMeta": {
  "dompurify": { "optional": true }
}
```

```json
// Add renderer exports to exports map (17 entries + index):
"./renderers/currency": {
  "import": { "types": "./dist/renderers/currency.d.ts", "default": "./dist/renderers/currency.js" },
  "require": { "types": "./dist/renderers/currency.d.cts", "default": "./dist/renderers/currency.cjs" }
}
// ... repeat for all 17 renderers
```

---

## TypeScript Patterns for Inference Engine

### Detector Function Type

```typescript
// Source: TypeScript strict mode + project tsconfig (NodeNext, verbatimModuleSyntax)

type DetectorFn = (samples: unknown[], columnKey: string) => {
  type: ColumnType;
  confidence: number;
} | null;  // null = "this detector does not apply"
```

The `null` return is cleaner than returning `{ confidence: 0 }` — it makes the chain logic unambiguous.

### Parsing Unknown Values Safely

```typescript
// Pattern: normalize unknown to string | null, then test
function toStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  return String(value).trim();
}

// Pattern: check if string is numeric without coercion surprises
function isNumericString(s: string): boolean {
  return s !== '' && !Number.isNaN(Number(s));
}

// Pattern: null guard before detector runs
const nonNullSamples = samples.filter(
  (v) => v !== null && v !== undefined && v !== ''
);
if (nonNullSamples.length / samples.length < 0.5) {
  return { type: 'text', confidence: 0.5 };  // > 50% null → fallback
}
```

### Detector Priority Chain

```typescript
// Priority chain — first detector returning confidence >= THRESHOLD wins
const CONFIDENCE_THRESHOLD = 0.8;

const DETECTORS: DetectorFn[] = [
  detectBoolean,
  detectCurrency,
  detectPercentage,
  detectInteger,
  detectNumber,
  detectDatetime,
  detectDate,
  detectTime,
  detectEmail,
  detectPhone,
  detectImage,
  detectUrl,
  detectStatus,
  detectCode,
  detectText,  // always returns 0.5 — the fallback
];

function runDetectors(
  samples: unknown[],
  columnKey: string,
  boost: Partial<Record<ColumnType, number>>
): InferenceResult {
  for (const detect of DETECTORS) {
    const result = detect(samples, columnKey);
    if (result === null) continue;
    const boosted = result.confidence + (boost[result.type] ?? 0);
    const clamped = Math.min(1.0, boosted);
    if (clamped >= CONFIDENCE_THRESHOLD) {
      return { type: result.type, confidence: clamped, source: 'inferred' };
    }
  }
  return { type: 'text', confidence: 0.5, source: 'fallback' };
}
```

### Keyword Boost Computation

```typescript
// Build boost map from column key before running detectors
const KEYWORD_BOOSTS: Array<{ keywords: string[]; type: ColumnType; boost: number }> = [
  { keywords: ['avatar', 'photo', 'image', 'img', 'picture', 'thumbnail'], type: 'image', boost: 0.15 },
  { keywords: ['email', 'mail'], type: 'email', boost: 0.15 },
  { keywords: ['phone', 'tel', 'mobile', 'cell'], type: 'phone', boost: 0.15 },
  { keywords: ['url', 'link', 'href', 'website'], type: 'url', boost: 0.15 },
  { keywords: ['price', 'cost', 'amount', 'fee', 'salary', 'revenue', 'income'], type: 'currency', boost: 0.15 },
  { keywords: ['date', 'created', 'updated', 'timestamp', 'born', 'at'], type: 'date', boost: 0.15 },
  { keywords: ['status', 'state', 'stage', 'phase'], type: 'status', boost: 0.15 },
  { keywords: ['rate', 'ratio', 'pct', 'percent', 'percentage'], type: 'percentage', boost: 0.15 },
];

function getBoostMap(columnKey: string): Partial<Record<ColumnType, number>> {
  const lower = columnKey.toLowerCase();
  const boost: Partial<Record<ColumnType, number>> = {};
  for (const { keywords, type, boost: amount } of KEYWORD_BOOSTS) {
    if (keywords.some((kw) => lower.includes(kw))) {
      boost[type] = amount;
    }
  }
  return boost;
}
```

### Systematic Sampling

```typescript
function sampleRows<TRow>(data: TRow[], maxSamples = 200): TRow[] {
  if (data.length <= maxSamples) return data;
  const step = Math.ceil(data.length / maxSamples);
  const result: TRow[] = [];
  for (let i = 0; i < data.length && result.length < maxSamples; i += step) {
    result.push(data[i]);
  }
  return result;
}
```

**Verified:** For 500 rows, step = 3, produces 167 samples. For 200 rows, step = 1, produces all 200.

### `CellDescriptor` Union (add to types.ts)

```typescript
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

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export type RendererFn = (value: unknown, column: ResolvedColumn) => CellDescriptor;

export interface ResolvedColumn extends ColumnDefinition {
  type: ColumnType;           // always defined after resolution
  label: string;              // always defined after resolution
  inferenceResult?: InferenceResult;
}

export interface ProcessedRow {
  _original: Record<string, unknown>;
  cells: Record<string, CellDescriptor>;
}
```

---

## Vite Multi-Entry Tree-Shaking

### Confirmed Pattern (Vite 8, verified from official docs)

```typescript
// packages/core/vite.config.ts — Phase 2 version
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

const RENDERER_NAMES = [
  'text', 'number', 'integer', 'currency', 'percentage',
  'boolean', 'date', 'datetime', 'time', 'email', 'url',
  'phone', 'image', 'badge', 'status', 'code', 'html',
] as const;

const rendererEntries = Object.fromEntries(
  RENDERER_NAMES.map((name) => [
    `renderers/${name}`,
    resolve(__dirname, `src/renderers/${name}.ts`),
  ])
);

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        ...rendererEntries,
      },
      // name is not needed for multi-entry (only required for UMD single-entry)
      formats: ['es', 'cjs'],  // UMD dropped for multi-entry — not supported
    },
    rolldownOptions: {          // RENAMED from rollupOptions in Vite 8
      external: [],             // no runtime deps
    },
    sourcemap: true,
    minify: false,
  },
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      outDir: 'dist',
      rollupTypes: false,       // false = separate .d.ts per file (correct for multi-entry)
    }),
  ],
});
```

**Critical note:** `rollupOptions` → `rolldownOptions` is a Vite 8 breaking change. The existing `vite.config.ts` uses `rollupOptions` and will show a deprecation warning. Phase 2 must rename it.

**UMD impact:** The existing `vite.config.ts` produces `es`, `cjs`, and `umd` formats. With multi-entry, UMD is not supported. The REQUIREMENTS.md lists `UMD + ESM dual build output` as a v1 baseline (FOUND-02) but Phase 5 (WC-09) handles UMD for the Web Component build. For `@tablecraft/core` Phase 2, `es + cjs` is sufficient. If UMD is needed for `index` only, use a separate build step or keep a second entry-point-less config.

### `rollupTypes: false` for Multi-Entry

When `rollupTypes: true`, `vite-plugin-dts` bundles ALL declarations into a single `index.d.ts`. This breaks multi-entry because renderer entries get no separate `.d.ts` files. Use `rollupTypes: false` to get one `.d.ts` per source file.

### Package.json Exports Map Pattern

```json
{
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    },
    "./renderers/currency": {
      "import": { "types": "./dist/renderers/currency.d.ts", "default": "./dist/renderers/currency.js" },
      "require": { "types": "./dist/renderers/currency.d.cts", "default": "./dist/renderers/currency.cjs" }
    }
  }
}
```

This enables `import { currencyRenderer } from '@tablecraft/core/renderers/currency'` with full type safety and no side-effect imports from other renderers.

---

## `requestIdleCallback` SSR Pattern

### Verified Isomorphic Helper

```typescript
// packages/core/src/scheduler.ts

type Callback = () => void;

export function scheduleIdleWork(fn: Callback): void {
  if (typeof requestIdleCallback !== 'undefined') {
    // Browser: run during idle time
    requestIdleCallback(fn);
  } else if (typeof setImmediate !== 'undefined') {
    // Node.js 20+: setImmediate executes after I/O, before setTimeout
    setImmediate(fn);
  } else {
    // Fallback: any environment (edge runtimes, old Node)
    setTimeout(fn, 0);
  }
}
```

**Verified:**
- `typeof requestIdleCallback !== 'undefined'` is `false` in Node.js 20 (confirmed empirically)
- `typeof setImmediate !== 'undefined'` is `true` in Node.js 20 (confirmed empirically)
- `setImmediate` is preferred over `setTimeout(fn, 0)` in Node because it executes before the timer phase

### Usage in `inferSchema`

```typescript
// In createTableEngine:
inferSchema(data: TRow[]): Promise<ColumnInferenceMap> {
  return new Promise((resolve) => {
    scheduleIdleWork(() => {
      resolve(runInference(data, config));
    });
  });
}
```

The `resolveColumns` method returns `text` type immediately for all columns, then Phase 3's reactive layer calls `inferSchema` and re-resolves when the promise resolves.

### Testing Without a Real Browser

```typescript
// In tests: mock scheduleIdleWork to be synchronous
vi.mock('../scheduler.js', () => ({
  scheduleIdleWork: (fn: () => void) => fn(),  // synchronous in tests
}));
```

---

## Vitest Coverage Configuration

### Verified Vitest 4 Glob Threshold Syntax

```typescript
// packages/core/vitest.config.ts — Phase 2 version
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
      exclude: ['src/**/*.test.ts', 'src/**/*.d.ts', 'src/tokens.ts'],
      thresholds: {
        // Global minimum (inference engine must hit 95%)
        lines: 90,
        // Per-glob overrides (more specific than global)
        'src/inference/**/*.ts': {
          lines: 95,
          functions: 95,
          branches: 90,
          statements: 95,
        },
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

**Source:** Vitest 4 official docs — `coverage.thresholds` supports string glob keys alongside `perFile`, `lines`, `functions`, `branches`, `statements`. Negative values set maximum uncovered item count instead of minimum percentage.

**Run command:** `pnpm --filter @tablecraft/core test --coverage`
**Quick run (no coverage):** `pnpm --filter @tablecraft/core test`

---

## DOMPurify Peer Dependency Pattern

### Runtime Check (verified pattern from CONTEXT.md)

```typescript
// packages/core/src/renderers/html.ts

// Injected instance (for SSR/Node environments)
let injectedPurify: { sanitize: (s: string) => string } | null = null;

/** Inject a DOMPurify instance — required for SSR environments */
export function configure(purify: { sanitize: (s: string) => string }): void {
  injectedPurify = purify;
}

function getPurify(): { sanitize: (s: string) => string } {
  // 1. Injected via configure() — works in both browser and SSR
  if (injectedPurify) return injectedPurify;
  // 2. Global browser DOMPurify
  if (typeof globalThis !== 'undefined' && 'DOMPurify' in globalThis) {
    return (globalThis as Record<string, unknown>)['DOMPurify'] as { sanitize: (s: string) => string };
  }
  throw new Error(
    '[tablecraft] html renderer requires DOMPurify. ' +
    'Install it: npm install dompurify. ' +
    'For SSR: import DOMPurify from "dompurify"; htmlRenderer.configure(DOMPurify). ' +
    'Migration: https://tablecraft.dev/migrate/html-renderer'
  );
}

export function htmlRenderer(value: unknown, column: ResolvedColumn): CellDescriptor {
  const purify = getPurify();  // throws if unavailable
  const raw = value === null || value === undefined ? '' : String(value);
  return { kind: 'html', sanitized: purify.sanitize(raw) };
}
```

### Package.json Peer Dependency Declaration

```json
{
  "peerDependencies": {
    "dompurify": ">=3.0.0"
  },
  "peerDependenciesMeta": {
    "dompurify": { "optional": true }
  }
}
```

This tells npm/pnpm: "DOMPurify works as a peer, but it is optional — don't warn if absent."

---

## Renderer Function Design

### Canonical Signature

```typescript
type RendererFn = (value: unknown, column: ResolvedColumn) => CellDescriptor;
```

### Intl Edge Cases (verified empirically in Node 20)

| Input | `Intl.NumberFormat` behavior | Renderer action |
|-------|------------------------------|-----------------|
| `null` | Coerces to 0 → `$0.00` | Guard: return `{ kind: 'raw', value: null }` |
| `undefined` | Coerces to NaN → `$NaN` | Guard: return `{ kind: 'raw', value: undefined }` |
| `NaN` | Displays as `$NaN` | Guard: return `{ kind: 'raw', value: NaN }` |
| `Infinity` | Displays as `$∞` | Guard: return `{ kind: 'raw', value: Infinity }` |
| `'not-a-number'` | String coerces to NaN → `$NaN` | Guard: parse first, fallback to raw |
| `42` | `$42.00` | Correct — proceed |

**Implication:** Renderers should normalize input BEFORE calling `Intl`, not rely on `try/catch`. Use `Number(value)` and check `Number.isFinite(result)`.

```typescript
// Shared helper for numeric renderers
function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
```

### Intl Locale Strategy

**Use `undefined` (system locale) in renderers.** Rationale:
- `navigator.language` does not exist in Node.js/SSR environments without a polyfill
- `typeof globalThis.navigator` is `true` in Node 20 (Node ships a partial `navigator` object) but `navigator.language` is `undefined`
- Using `undefined` as the locale argument to `Intl.*` selects the runtime's default locale — correct behavior in both browser and server
- Consumers who need a specific locale should pass `locale` in `ColumnDefinition` (Phase 6 concern, not Phase 2)

```typescript
// Correct: locale-agnostic, works in browser + Node
new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' })

// Wrong: throws or returns undefined in Node SSR
new Intl.NumberFormat(navigator.language, ...)
```

### Status Renderer Variant Mapping

```typescript
const SUCCESS_WORDS = new Set(['active', 'done', 'success', 'approved', 'complete', 'completed', 'enabled', 'open']);
const WARNING_WORDS = new Set(['pending', 'review', 'waiting', 'draft', 'processing', 'in-progress']);
const DANGER_WORDS  = new Set(['error', 'failed', 'failure', 'rejected', 'blocked', 'cancelled', 'canceled', 'critical']);
const INFO_WORDS    = new Set(['inactive', 'disabled', 'archived', 'closed', 'resolved']);

function getStatusVariant(label: string): BadgeVariant {
  const lower = label.toLowerCase().replace(/[\s_-]+/g, '');
  if (SUCCESS_WORDS.has(lower)) return 'success';
  if (WARNING_WORDS.has(lower)) return 'warning';
  if (DANGER_WORDS.has(lower))  return 'danger';
  if (INFO_WORDS.has(lower))    return 'info';
  return 'default';
}
```

### Percentage Renderer Boundary Condition

The `value <= 1.0` multiply-by-100 rule has an ambiguity: `1.0` could mean `100%` or `1%`. The decision from CONTEXT.md is to multiply if `value <= 1.0`. This means a literal `1` becomes `100%`. **This is a known heuristic trade-off.** The column-name boost (`rate/ratio/pct`) helps confirm intent, but is not available to the renderer at call time (it was used during inference). The renderer should apply the `<= 1.0` rule and document it.

### Email / Phone / URL — Validate or Trust?

**Decision (Claude's discretion):** Trust the type system. By the time a renderer is called, the inference engine (or explicit user override) has already determined the column type. Renderers do format-and-output, not re-validate.

- `email` renderer: build `mailto:` href from `String(value)`, do not re-run RFC 5322 check
- `phone` renderer: strip non-digit characters, build `tel:` href, display original formatted string
- `url` renderer: parse with `new URL(value)` to extract `hostname`; if `URL` constructor throws, fall back to `{ kind: 'text', value: String(value) }`

```typescript
// URL renderer — only safe URL parsing use case that needs try/catch
export function urlRenderer(value: unknown, _column: ResolvedColumn): CellDescriptor {
  const str = value === null || value === undefined ? '' : String(value);
  try {
    const parsed = new URL(str);
    return { kind: 'link', href: str, label: parsed.hostname, external: true };
  } catch {
    return { kind: 'text', value: str };
  }
}
```

---

## v1 Compatibility Shim Edge Cases

### The Duplicate Key Bug (Critical)

JSON and JavaScript object literals silently drop duplicate keys — only the last value survives. This means if a v1 consumer wrote:

```javascript
// v1 usage with duplicate type keys
colname = { "string": "Name", "number": "Age", "string": "Email" }
// After JS parses this: { "string": "Email", "number": "Age" }
// "Name" column is LOST silently
```

**Detection is impossible after-the-fact** — once the object is parsed, the information is gone. The shim cannot recover lost columns.

**What the shim MUST do:**
1. Accept the object as given — it cannot know what was lost
2. Log a detailed warning explaining the limitation
3. Document in JSDoc that duplicate type keys cause data loss and `JSON.parse` drops them

```typescript
// packages/core/src/compat/v1.ts

export function adaptV1Props(
  colname: Record<string, string>,
  rowdata: unknown[][]
): { data: Record<string, unknown>[]; columns: ColumnDefinition[] } {
  // Edge case: empty inputs
  if (Object.keys(colname).length === 0 || rowdata.length === 0) {
    return { data: [], columns: [] };
  }

  const entries = Object.entries(colname);  // [type, label][]

  // Warn: duplicate type keys in v1 colname cause silent data loss
  console.warn(
    '[tablecraft] colname/rowdata API is deprecated. Use <Table data={rows} /> instead. ' +
    'Migration guide: https://tablecraft.dev/migrate/v1\n' +
    '[tablecraft] WARNING: If you have duplicate type keys in colname (e.g., two "string" entries), ' +
    'JavaScript silently drops all but the last. Use unique type keys or migrate to v2 API.'
  );

  // Build columns from [type, label] pairs
  const columns: ColumnDefinition[] = entries.map(([v1Type, label]) => ({
    key: label.toLowerCase().replace(/\s+/g, '_'),
    label,
    type: mapV1Type(v1Type),
  }));

  // Map rowdata (array of arrays) to array of objects
  const data = rowdata.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col.key] = row[i] ?? null;
    });
    return obj;
  });

  return { data, columns };
}
```

### v1 Type Mapping Table

| v1 `colname` key | v2 `ColumnType` | Notes |
|-----------------|-----------------|-------|
| `string` | `text` | Direct equivalent |
| `number` | `number` | Direct equivalent |
| `date` | `date` | Direct equivalent |
| `time` | `time` | Direct equivalent |
| `mail` | `email` | Key renamed in v2 |
| `phone` | `phone` | Direct equivalent |
| `image` | `image` | Direct equivalent |
| `html` | `html` | DOMPurify required in v2 |
| `code` | `code` | Direct equivalent |
| `url` / `tag` | `url` | `tag` was an alias for url in v1 |
| `dropdown` | `status` | Closest v2 equivalent (semantic colors added) |
| `list` | `text` | Comma-join array; editing is Phase 6 |
| `input` | `text` | Editing is Phase 6 |
| `checkbox` | `boolean` | Direct equivalent |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `packages/core/vitest.config.ts` (exists, needs threshold additions) |
| Quick run | `pnpm --filter @tablecraft/core test` |
| Coverage run | `pnpm --filter @tablecraft/core test --coverage` |
| Full workspace | `pnpm test` (from root) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File |
|--------|----------|-----------|-------------------|------|
| CORE-01 | `createTableEngine` returns object with correct methods | unit | `pnpm --filter @tablecraft/core test` | `src/engine/engine.test.ts` — Wave 0 |
| CORE-02 | Inference samples 200 rows, runs detectors, returns best confidence | unit | same | `src/inference/inference.test.ts` — Wave 0 |
| CORE-03 | All 15 detectors produce correct output for known inputs | unit | same | `src/inference/detectors.test.ts` — Wave 0 |
| CORE-04 | Keyword boost adds 0.15 to matching detector | unit | same | `src/inference/detectors.test.ts` — Wave 0 |
| CORE-05 | `scheduleIdleWork` uses `setImmediate` in Node, `requestIdleCallback` in browser | unit | same | `src/scheduler.test.ts` — Wave 0 |
| CORE-06 | Registry: register, retrieve, override, unregister, duplicate | unit | same | `src/registry/registry.test.ts` — Wave 0 |
| CORE-07 | Each renderer file can be imported independently (no cross-imports) | unit | same | `src/renderers/*.test.ts` — Wave 0 |
| CORE-08 | `packages/core/src/README.md` documents state separation | structural | manual inspection | N/A |
| CORE-09 | `tokens.ts` exports object with all 18 `--tc-*` properties | unit | same | `src/tokens.test.ts` — Wave 0 |
| CORE-10 | v1 shim: all type mappings correct, deprecation warning emitted | unit | same | `src/compat/v1.test.ts` — Wave 0 |
| CORE-11 | `defineColumns` already tested in `foundation.test.ts` | unit | same | Exists — no new work |
| CORE-12 | Coverage thresholds enforced: inference ≥ 95%, renderers ≥ 90% | coverage | `pnpm --filter @tablecraft/core test --coverage` | Via vitest.config.ts thresholds |

### Testing `requestIdleCallback` Without a Browser

```typescript
// Use vi.mock to make scheduleIdleWork synchronous in all engine tests:
vi.mock('../scheduler.js', () => ({
  scheduleIdleWork: (fn: () => void) => fn(),
}));
// This lets inference tests run synchronously without a browser or idle budget
```

### Testing Tree-Shaking Without a Full Build

Tree-shaking guarantees cannot be tested purely at the unit level — they require a build artifact. However, you can assert the structural guarantee:

```typescript
// src/renderers/currency.test.ts
it('currency module has no import from other renderer modules', async () => {
  // Read the source file and check it does not import sibling renderers
  const src = readFileSync(new URL('./currency.ts', import.meta.url), 'utf-8');
  expect(src).not.toMatch(/from ['"]\.\/(?!currency)/);  // no sibling imports
});
```

For build-time verification, add to Phase 2 verification plan: `pnpm build && ls -la dist/renderers/` — confirm 17 separate output files exist.

### Wave 0 Gaps (test files that do not exist yet)

- [ ] `src/engine/engine.test.ts` — covers CORE-01, CORE-08 boundary
- [ ] `src/inference/inference.test.ts` — covers CORE-02 (sampling, threshold, null handling)
- [ ] `src/inference/detectors.test.ts` — covers CORE-03, CORE-04
- [ ] `src/scheduler.test.ts` — covers CORE-05
- [ ] `src/registry/registry.test.ts` — covers CORE-06
- [ ] `src/renderers/text.test.ts` through `src/renderers/html.test.ts` (17 files) — covers CORE-07, CORE-12
- [ ] `src/tokens.test.ts` — covers CORE-09
- [ ] `src/compat/v1.test.ts` — covers CORE-10

Existing: `src/foundation.test.ts` — covers FOUND-* requirements, no changes needed.

---

## Implementation Order (for Planner)

This order minimizes re-work. Each wave has no forward dependencies.

**Wave 1 — Types and Contracts (no logic, no tests)**
1. Extend `packages/core/src/types.ts` — add `CellDescriptor`, `ResolvedColumn`, `RendererFn`, `ProcessedRow`, `RendererRegistry`
2. Create `packages/core/src/tokens.ts` — 18 CSS custom property defaults
3. Create `packages/core/src/scheduler.ts` — `scheduleIdleWork` helper

**Wave 2 — Inference Engine (pure logic, fully testable)**
4. `src/inference/detectors.ts` — 15 detector functions
5. `src/inference/index.ts` — `runInference(data, config)` pipeline (sampling + chain)
6. Test files for inference (detectors + pipeline)

**Wave 3 — Registry + Renderers (many small files)**
7. `src/registry/index.ts` — `Map`-based registry with `registerRenderer` / `getRenderer` / `hasRenderer` / `unregisterRenderer`
8. `src/renderers/{name}.ts` — all 17 renderer files (each registers itself on import)
9. Test files for registry + all 17 renderers

**Wave 4 — Engine Factory**
10. `src/engine/index.ts` — `createTableEngine(config)` factory — calls inference, resolveColumns, processRows
11. Engine test file

**Wave 5 — Compat + Tokens**
12. `src/compat/v1.ts` — `adaptV1Props` shim
13. Compat test file

**Wave 6 — Build Config + Exports**
14. Update `packages/core/vite.config.ts` — multi-entry, `rolldownOptions`, `rollupTypes: false`
15. Update `packages/core/package.json` — 17 renderer export entries, `peerDependencies`
16. Update `packages/core/src/index.ts` — export all new public symbols
17. Run build, verify `dist/renderers/` has 17 files

**Wave 7 — Coverage Gate**
18. Update `packages/core/vitest.config.ts` — add glob thresholds
19. Run `pnpm --filter @tablecraft/core test --coverage` — confirm thresholds pass

---

## Gotchas and Warnings

### 1. `rollupOptions` → `rolldownOptions` Migration Required

The existing `vite.config.ts` uses `rollupOptions`. In Vite 8, this is deprecated. Phase 2 MUST rename it to `rolldownOptions` when expanding the config. Failing to do so produces a deprecation warning in the build output and may break in Vite 9.

### 2. `rollupTypes: true` Breaks Multi-Entry DTS

The current `vite.config.ts` has `rollupTypes: true`. This bundles all declarations into one file — correct for a single entry point, wrong for 17+ entries. Phase 2 MUST change this to `rollupTypes: false`.

### 3. UMD Format + Multi-Entry = Error

Vite 8 (via Rolldown) does not support UMD output with multiple entry points. The existing config has `formats: ['es', 'cjs', 'umd']`. This MUST be changed to `formats: ['es', 'cjs']` for Phase 2. UMD for the core package is handled in Phase 5 (WC-09) via a separate config.

### 4. Renderer Auto-Registration Side Effect

Each renderer file calls `registerRenderer()` at module initialization. This means importing `@tablecraft/core` (which re-exports all renderers via index.ts) triggers all 17 registrations. Importing `@tablecraft/core/renderers/currency` triggers only currency registration. This is the intended design — but tests must not rely on registration order or assume a clean registry between test files without explicit `unregisterRenderer` cleanup.

**Fix:** In registry tests, call `unregisterRenderer(type)` in `afterEach`, or use a factory function that returns a fresh registry instance for testing.

### 5. `vite-plugin-dts` vs `unplugin-dts` Decision

`vite-plugin-dts@4.5.4` is installed and marked legacy by its maintainer. `unplugin-dts@1.0.0-beta.6` is the Rolldown-native replacement but is pre-release beta. The safest path for Phase 2: keep `vite-plugin-dts@4.5.4` with `rollupTypes: false`, run the build, and verify declaration files are generated correctly for all entries. If type generation fails, then migrate to `unplugin-dts`. Do not migrate speculatively.

### 6. `status` Detector: Low-Cardinality Check

The `status` detector fires for columns with ≤ 10 unique values, all short strings (≤ 20 chars). There is a conflict: a column with 3 numeric values (`1`, `2`, `3`) could also qualify as `integer` — and `integer` has higher priority in the chain. The priority order ensures `integer` wins before `status` is checked. However, a column with 3 string values like `"A"`, `"B"`, `"C"` will correctly reach `status`. This is correct behavior; document it.

### 7. Duplicate v1 `colname` Keys Are Irrecoverable

The v1 shim cannot detect or recover from duplicate type keys in the `colname` object because JavaScript silently deduplicates object keys before the shim sees them. The shim must warn consumers about this limitation clearly in its JSDoc and in the `console.warn` output. No workaround exists in JavaScript; consumers must migrate to v2 API.

### 8. `navigator` Exists in Node 20 But `navigator.language` Is Undefined

Node 20 ships a partial `navigator` global. Checking `typeof navigator !== 'undefined'` returns `true` in Node 20, but `navigator.language` is `undefined`. Renderers that try `navigator.language ?? undefined` will get `undefined` (fine), but any renderer that checks `typeof navigator !== 'undefined'` to branch between browser and SSR will get the wrong answer. Use `typeof requestIdleCallback !== 'undefined'` (not navigator) to distinguish environments.

### 9. Percentage `<= 1.0` Rule Ambiguity

The rule "multiply by 100 if value <= 1.0" means that a column containing only the value `1` will display as `100%`, not `1%`. This is the documented heuristic. Column-name boosting (`rate/ratio/pct`) increases confidence that this is a 0-1 decimal percentage, but the renderer itself cannot access inference metadata. Accept the ambiguity; document it clearly.

### 10. CORE-11 Is Already Done

`defineColumns<TRow>()` was implemented and tested in Phase 1. The `foundation.test.ts` file has a passing test for it. No Phase 2 work needed for CORE-11 beyond confirming it still passes.

---

## Sources

### Primary (HIGH confidence — live verification)

- Vite 8 Migration Guide (https://vite.dev/guide/migration) — `rollupOptions` → `rolldownOptions` rename, UMD/multi-entry constraints, library mode patterns
- Vite 8 Library Mode docs (https://vite.dev/guide/build#library-mode) — multi-entry object syntax, es+cjs format for multiple entries
- Vitest 4 Coverage docs (https://vitest.dev/config/coverage) — glob threshold syntax, `perFile` option, negative thresholds
- npm registry — `vitest@4.1.0`, `vite@8.0.1`, `vite-plugin-dts@4.5.4`, `unplugin-dts@1.0.0-beta.6`, `rolldown@1.0.0-rc.10` (verified 2026-03-21)
- Node.js 20 empirical tests — `requestIdleCallback` absent, `setImmediate` present, `Intl.NumberFormat` edge cases with null/NaN/Infinity, `navigator` exists but `navigator.language` undefined

### Secondary (MEDIUM confidence — from official site content)

- Vite 8 announcement (https://vite.dev/blog/announcing-vite8) — Rolldown integration, 10-30x build speed improvement
- unplugin-dts GitHub (https://github.com/qmhc/vite-plugin-dts) — project renamed/rewritten, supports Rolldown, vite-plugin-dts is now legacy

### Tertiary (LOW confidence — informational only)

- rolldown.rs — Rolldown's relationship to Vite 8, experimental status of standalone features (CSS, minification)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions confirmed from npm registry
- TypeScript patterns: HIGH — derived from project's existing strict tsconfig + empirical Node.js tests
- Vite multi-entry: HIGH — verified from Vite 8 official docs
- Vitest coverage: HIGH — verified from Vitest 4 official docs
- Intl edge cases: HIGH — empirically tested in Node 20
- v1 shim: HIGH — duplicate key behavior verified empirically in Node 20
- requestIdleCallback SSR: HIGH — empirically verified presence/absence in Node 20
- unplugin-dts status: MEDIUM — beta, status from GitHub + npm, not empirically tested

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (stable APIs; Rolldown RC status could change sooner)
