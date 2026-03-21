# Phase 2: Core Engine + Type Inference + Renderer Registry - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning
**Mode:** Auto (all decisions selected by Claude with recommended defaults)

<domain>
## Phase Boundary

Build the pure-JS core engine of `@tablecraft/core`: the type inference engine, the renderer plugin registry, all 17 Tier 1 cell renderers, the CSS custom property token system, and the v1 compatibility shim. No UI components ship in this phase — only framework-agnostic TypeScript that is fully testable in a plain Node.js environment.

**Fixed phase scope (from ROADMAP.md):** CORE-01 through CORE-12

</domain>

<decisions>
## Implementation Decisions

### Engine API Design (`createTableEngine`)

- `createTableEngine(config: TableConfig<TRow>)` returns a plain object (not a class) with these methods:
  - `inferSchema(data: TRow[]): ColumnInferenceMap` — runs type inference, returns results
  - `resolveColumns(data: TRow[], overrides?: ColumnOverrideShort | ColumnDefinition<TRow>[]): ResolvedColumn[]` — merges inferred + declared columns into final column list
  - `processRows(rows: TRow[], columns: ResolvedColumn[]): ProcessedRow[]` — maps row data to typed cell values
  - `getConfig(): TableConfig<TRow>` — returns current config (immutable copy)
- The engine is **stateless** — it is a pure computation factory. State (sort order, filter state, scroll position) lives in the Svelte `$state()` rune in Phase 3, NOT in the engine.
- The engine has **zero DOM dependencies** — it must work in Node.js with `vitest` and no browser environment.

### Renderer Output Format (`CellDescriptor`)

- Renderers do NOT return raw HTML strings (prevents XSS, enables framework-agnostic use)
- Each renderer returns a `CellDescriptor` union:
  ```ts
  type CellDescriptor =
    | { kind: 'text'; value: string }
    | { kind: 'number'; value: number; formatted: string }
    | { kind: 'link'; href: string; label: string; external?: boolean }
    | { kind: 'image'; src: string; alt: string }
    | { kind: 'badge'; label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }
    | { kind: 'status'; label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }
    | { kind: 'boolean'; value: boolean }
    | { kind: 'code'; value: string }
    | { kind: 'html'; sanitized: string }  // only after DOMPurify.sanitize()
    | { kind: 'raw'; value: unknown }  // fallback for unknown types
  ```
- The Svelte `<Table>` component (Phase 3) converts `CellDescriptor` objects to Svelte component renders — it never calls `{@html}` on raw user data.
- Add `CellDescriptor` to `packages/core/src/types.ts` (alongside existing types from Phase 1).

### Type Inference Algorithm

- **Sampling:** Systematic (not random) — sample every `Math.ceil(data.length / 200)` rows up to 200 samples. Systematic sampling preserves distribution for sorted/grouped data.
- **Detector priority order** (first match above threshold wins):
  1. `boolean` — `true/false/yes/no/on/off/1/0` (case-insensitive string or actual boolean)
  2. `currency` — number prefixed/suffixed with currency symbol (`$€£¥₹`, or `USD`, `EUR` etc.)
  3. `percentage` — number followed by `%`, or value between 0-1 when column name contains `rate/ratio/pct/percent`
  4. `integer` — whole number with no fractional part, no currency symbol
  5. `number` — numeric with decimal places
  6. `datetime` — ISO 8601 with time component (`T` separator)
  7. `date` — ISO 8601 date only (`YYYY-MM-DD`) or locale date string
  8. `time` — `HH:MM` or `HH:MM:SS` pattern
  9. `email` — `@` + domain, passes basic RFC 5322 pattern
  10. `phone` — digit-only with optional `+`, `()`, `-`, ` ` separators; 7-15 digits total
  11. `image` — URL ending in `.jpg/.jpeg/.png/.gif/.svg/.webp` or containing `/images/`, `/img/`, `cdn.` patterns
  12. `url` — starts with `http://` or `https://`
  13. `status` — low-cardinality string column (≤ 10 unique values, all same type, all short strings ≤ 20 chars)
  14. `code` — multi-line string with code-like patterns (`{`, `}`, `=>`, `function`, etc.)
  15. `text` — fallback (always 0.5 confidence)
- **Confidence threshold:** 0.8 — if no detector scores ≥ 0.8, fall back to `text`
- **Column-name keyword boosting:** Add 0.15 to the matching detector's score when column name contains:
  - `avatar/photo/image/img/picture/thumbnail` → boost `image`
  - `email/mail` → boost `email`
  - `phone/tel/mobile/cell` → boost `phone`
  - `url/link/href/website` → boost `url`
  - `price/cost/amount/fee/salary/revenue/income` → boost `currency`
  - `date/created/updated/timestamp/born/at` → boost `date` or `datetime`
  - `status/state/stage/phase` → boost `status`
  - `rate/ratio/pct/percent/percentage` → boost `percentage`
- **Inference timing:** `inferSchema()` is called in `requestIdleCallback` (in browser context) or immediately (in SSR/Node context). The `resolveColumns()` method returns `text` type for all columns immediately, then updates when inference completes.
- **Null handling:** Null/undefined/empty string values are skipped during inference. If > 50% of sampled values are null, inference returns `text` with 0.5 confidence.

### Renderer Plugin Registry (`registerRenderer`)

- Global registry: `Map<string, RendererFn>` where `RendererFn = (value: unknown, column: ResolvedColumn) => CellDescriptor`
- API:
  ```ts
  registerRenderer(type: string, fn: RendererFn): void  // register custom renderer
  getRenderer(type: string): RendererFn | undefined      // retrieve renderer
  hasRenderer(type: string): boolean                      // check existence
  unregisterRenderer(type: string): void                  // remove (testing/cleanup)
  ```
- Built-in Tier 1 renderers are registered via `registerRenderer()` on module initialization — they use the SAME API as external plugins. No special-casing of built-ins.
- Each renderer is in its own file: `packages/core/src/renderers/{type}.ts`
- Tree-shakable: importing `@tablecraft/core/renderers/currency` only loads the currency renderer, not the other 16.
- All 17 Tier 1 renderers must be individually importable AND auto-registered when `@tablecraft/core` is imported.

### All 17 Tier 1 Renderers to Implement

Each renderer file: `packages/core/src/renderers/{name}.ts`

| Type | Input | Output kind | Key behavior |
|------|-------|-------------|--------------|
| `text` | any | `text` | `String(value)`, truncate at 255 chars |
| `number` | number | `number` | `Intl.NumberFormat` locale formatting |
| `integer` | number | `number` | No decimal places, `Math.round()` |
| `currency` | number/string | `number` | `Intl.NumberFormat` with `style: 'currency'`; detect currency from column name |
| `percentage` | number | `number` | Multiply by 100 if value ≤ 1.0; append `%` |
| `boolean` | any | `boolean` | Truthy detection for strings (`yes/true/on/1`) |
| `date` | string/Date | `text` | `Intl.DateTimeFormat` date-only |
| `datetime` | string/Date | `text` | `Intl.DateTimeFormat` date + time |
| `time` | string | `text` | Display as-is or `Intl.DateTimeFormat` time-only |
| `email` | string | `link` | href: `mailto:{email}`, label: email address |
| `url` | string | `link` | href: URL, label: hostname, external: true |
| `phone` | string | `link` | href: `tel:{digits}`, label: formatted number |
| `image` | string | `image` | src: URL, alt: column label or empty |
| `badge` | string | `badge` | label: value, variant: 'default' |
| `status` | string | `status` | Auto-assign variant by value: `active/done/success/approved` → success; `pending/review/waiting` → warning; `error/failed/rejected/blocked` → danger; `inactive/disabled` → info; all others → default |
| `code` | string | `code` | value: raw string (rendered in `<code>` element — NO `{@html}`) |
| `html` | string | `html` | REQUIRES DOMPurify. Throws `Error('html renderer requires DOMPurify peer dependency')` if not available. `sanitized: DOMPurify.sanitize(value)` |

### DOMPurify Strategy (`html` renderer)

- DOMPurify is a **peer dependency** of `@tablecraft/core` — not bundled
- The `html` renderer does a runtime check: `if (typeof window !== 'undefined' && typeof (window as any).DOMPurify === 'undefined' && !globalThis.DOMPurify)` → throw descriptive error
- Bundle impact: `@tablecraft/core` stays under 50KB gzipped without DOMPurify; consumers who want `html` rendering install DOMPurify themselves
- Alternative lightweight sanitizer: `packages/core/src/renderers/html.ts` exports a `configure(purify: typeof DOMPurify)` function so consumers can inject the DOMPurify instance — this works in SSR environments where `window.DOMPurify` doesn't exist

### CSS Custom Property Token System (`--tc-*`)

- Defined in `packages/core/src/tokens.ts` — a plain JS object mapping token name to default value
- Token categories:
  ```ts
  // Colors
  '--tc-color-text': '#111827'
  '--tc-color-text-muted': '#6B7280'
  '--tc-color-bg': '#FFFFFF'
  '--tc-color-bg-hover': '#F9FAFB'
  '--tc-color-border': '#E5E7EB'
  '--tc-color-accent': '#3B82F6'
  // Status colors
  '--tc-color-success': '#10B981'
  '--tc-color-warning': '#F59E0B'
  '--tc-color-danger': '#EF4444'
  '--tc-color-info': '#6366F1'
  // Spacing
  '--tc-row-height': '48px'
  '--tc-cell-padding-x': '12px'
  '--tc-cell-padding-y': '8px'
  '--tc-header-height': '40px'
  // Typography
  '--tc-font-family': 'inherit'
  '--tc-font-size': '14px'
  '--tc-font-size-sm': '12px'
  // Borders
  '--tc-border-radius': '4px'
  '--tc-border-width': '1px'
  ```
- The Svelte package injects these as CSS custom properties in a `:host` / `:root` scope selector in Phase 3
- Dark mode: consumers override via `[data-theme="dark"]` attribute or `prefers-color-scheme`

### v1 Compatibility Shim (`adaptV1Props`)

- Location: `packages/core/src/compat/v1.ts`
- Input: `colname: Record<string, string>` (v1 format — key = ColumnType, value = label) + `rowdata: unknown[][]`
- Output: `{ data: Record<string, unknown>[]; columns: ColumnDefinition[] }`
- Algorithm:
  1. Extract `Object.entries(colname)` to get `[type, label]` pairs in order
  2. Map to `ColumnDefinition[]`: `{ key: label.toLowerCase().replace(/\s+/g, '_'), type: type as ColumnType, label }`
  3. Map `rowdata` (array of arrays) to array of objects: row[i] → `{ [columns[i].key]: row[i] }`
  4. Log: `console.warn('[tablecraft] colname/rowdata API is deprecated. Use <Table data={rows} /> instead. Migration guide: https://tablecraft.dev/migrate/v1')`
- The `html` type in colname maps to the v2 `html` renderer (with DOMPurify requirement)
- The `dropdown` type in colname maps to v2 `status` renderer (closest equivalent)
- The `list` type in colname maps to v2 `text` renderer (comma-join array values)
- The `input` type in colname maps to v2 `text` renderer (editing is Phase 6 scope)
- The `checkbox` type in colname maps to v2 `boolean` renderer

### State Graph (for Phase 3 reference — defined here, implemented in Phase 3)

The engine does NOT own reactive state. The Svelte `$state()` layer in Phase 3 owns:
- `columns: ResolvedColumn[]` — derived from `resolveColumns()`, changes rarely
- `sortState: { key: string; dir: 'asc' | 'desc' } | null` — changes on header click
- `filterState: Record<string, string>` — changes on filter input
- `visibleRows: ProcessedRow[]` — derived from data + sortState + filterState

Keeping state separated prevents sort/filter changes from triggering full cell re-renders. Document this separation in `packages/core/src/README.md` as the canonical architecture note.

### Test Coverage Requirements (CORE-12)

- Inference engine: > 95% line coverage via Vitest
- All 17 renderers: > 90% line coverage via Vitest
- Each renderer: test with `null`, `undefined`, empty string, correct type, wrong type
- Inference: test with 0 rows, 1 row, 200+ rows, all-null column, mixed types, field-name boosting
- Plugin registry: test register, retrieve, unregister, override built-in, duplicate registration
- v1 shim: test all 5 type-mapping edge cases (html, dropdown, list, input, checkbox)

### Claude's Discretion

- Exact file organization within `packages/core/src/` (inference/, renderers/, compat/ subdirs recommended)
- Internal helper functions (number parsing, string trimming, null coercion)
- Exact error message wording (descriptive and actionable)
- Whether to use `Map` or plain object for the renderer registry internals
- Exact Vitest test file naming convention
- Whether to use `Symbol` for internal token identification

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/PROJECT.md` — Vision, constraints, core value
- `.planning/REQUIREMENTS.md` — CORE-01 through CORE-12 (Phase 2 scope)
- `.planning/ROADMAP.md` — Phase 2 goal and success criteria

### Phase 1 Artifacts (carry-forward)
- `packages/core/src/types.ts` — ALL type definitions from Phase 1; Phase 2 EXTENDS this file (adds CellDescriptor, ResolvedColumn, RendererFn, ProcessedRow) — do NOT rewrite, only append
- `packages/core/src/index.ts` — Current public API entry point; Phase 2 adds new exports here
- `packages/core/vite.config.ts` — Build config; Phase 2 adds entry points for individual renderers
- `packages/core/vitest.config.ts` — Test config; Phase 2 adds test files

### Research Findings
- `.planning/research/ARCHITECTURE.md` — Type inference algorithm design; headless engine pattern; renderer registry design; data flow diagram
- `.planning/research/FEATURES.md` — Full Tier 1 renderer catalog with input/output specs
- `.planning/research/PITFALLS.md` — Performance pitfalls (re-render cascade, tree-shaking), DOMPurify strategy, API design anti-patterns
- `.planning/research/SUMMARY.md` — Executive summary of all research; architecture decisions

### Phase 1 Context
- `.planning/phases/01-foundation/01-CONTEXT.md` — Package naming, monorepo structure, TypeScript strict mode decisions (all carry forward)

No external specs or ADRs — all requirements captured in decisions and research above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/core/src/types.ts`: Complete type skeleton from Phase 1 — `ColumnType` (17-member union), `ColumnDefinition<TRow>`, `TableConfig<TRow>`, `InferenceResult`, `ColumnInferenceMap`, `defineColumns<TRow>()`. Phase 2 EXTENDS this, not rewrites it.
- `packages/core/src/index.ts`: Existing re-export barrel — Phase 2 adds new exports for `createTableEngine`, `registerRenderer`, `inferSchema`, `adaptV1Props`, `CellDescriptor`
- `packages/core/vitest.config.ts`: Test config already wired into workspace — just add test files

### Established Patterns
- **TypeScript strict mode**: All code must compile with `noImplicitAny`, `strictNullChecks`, `noUnusedLocals` — function signatures must be fully typed
- **ESM-first**: All imports use `.js` extension (TypeScript resolves to `.ts` at build time via NodeNext)
- **No `{@html}`**: Enforced at ESLint level — renderer output must be `CellDescriptor` objects, not HTML strings
- **Vitest**: Already configured in workspace — add test files matching `**/*.test.ts` in `packages/core/src/`
- **pnpm workspace**: Cross-package imports use `workspace:*` protocol

### Integration Points
- `packages/core/src/types.ts` → Phase 2 adds: `CellDescriptor`, `ResolvedColumn`, `RendererFn`, `ProcessedRow`, `RendererRegistry` interfaces
- `packages/core/src/index.ts` → Phase 2 adds: `createTableEngine`, `registerRenderer`, `getRenderer`, `inferSchema`, `adaptV1Props` as named exports
- `packages/core/vite.config.ts` → Phase 2 may add: individual renderer entry points for tree-shaking (e.g., `lib.entry['renderers/currency'] = 'src/renderers/currency.ts'`)
- `packages/svelte/src/lib/Table.svelte` → Phase 3 consumes `createTableEngine()` and `CellDescriptor` types — Phase 2 must have a stable API before Phase 3 starts

</code_context>

<specifics>
## Specific Ideas

- `requestIdleCallback` for async inference — renders immediately with `text` fallback, updates to inferred types once idle. Must gracefully degrade to synchronous in SSR (Node.js environment where `requestIdleCallback` doesn't exist).
- The `status` renderer auto-assigns semantic colors based on common string patterns — `active/success/done/approved` → green; `pending/waiting/review` → yellow; `failed/error/blocked/rejected` → red. This is a key differentiator — no other table lib does auto-semantic-coloring.
- The plugin registry approach (built-ins use same API as extensions) means the entire built-in renderer set can theoretically be replaced by a consumer — this is an intentional OSS design choice.

</specifics>

<deferred>
## Deferred Ideas

- Dynamic row heights (prefix-sum arrays) — Phase 4 or v3
- `requestAnimationFrame`-batched inference updates — Phase 3 optimization concern
- Worker-thread inference for very large datasets (> 100k rows) — Phase 4
- Tier 2 renderers (avatar-with-name, progress, relative-time, sparkline, actions) — v2.1 or Phase 7

</deferred>

---

*Phase: 02-core-engine-type-inference-renderer-registry*
*Context gathered: 2026-03-21*
