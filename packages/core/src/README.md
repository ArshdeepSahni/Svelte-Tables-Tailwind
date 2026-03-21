# @tablecraft/core — Architecture Notes

## State Separation

**The engine is stateless. The framework layer owns state.**

`createTableEngine()` returns a pure computation object — it performs no mutation,
holds no reactive state, and has zero DOM dependencies.  It can be called in
Node.js, Vitest, Web Workers, and SSR environments without a browser.

```
                  ┌─────────────────────────────────────────┐
                  │          createTableEngine()             │
                  │  (pure computation — no mutable state)  │
                  │                                         │
                  │  inferSchema(data)  → ColumnInferenceMap│
                  │  resolveColumns(…)  → ResolvedColumn[]  │
                  │  processRows(…)     → ProcessedRow[]    │
                  │  getConfig()        → TableConfig        │
                  └─────────────────────────────────────────┘
                                    ↓  output (immutable)
                  ┌─────────────────────────────────────────┐
                  │     Svelte 5 <Table> component           │
                  │  (owns all reactive state via $state)   │
                  │                                         │
                  │  columns      = $state(ResolvedColumn[])│
                  │  sortState    = $state({ key, dir }|null│
                  │  filterState  = $state(Record<…>)       │
                  │  visibleRows  = $derived(ProcessedRow[])│
                  └─────────────────────────────────────────┘
```

### Why this separation matters

**Performance:** Sort and filter state changes only recompute `visibleRows`
(a `$derived`). They do NOT re-run the renderer pipeline for the entire dataset —
only the subset of rows visible in the viewport is processed.

**Testability:** The engine is fully testable in Node.js without Svelte, without
`jsdom`, and without any DOM globals. Run `pnpm --filter @tablecraft/core test`.

**Framework portability:** The engine emits `ProcessedRow[]` — a plain data
structure. A React component, Vue component, Lit Web Component, or Svelte component
can all consume the same output without modification.

---

## Data Flow

```
User data (rows)
     │
     ▼
inferSchema(rows)           ← runs in requestIdleCallback (browser)
     │                         or synchronously (SSR / Node)
     ▼ ColumnInferenceMap
resolveColumns(rows, overrides?, inference?)
     │
     ▼ ResolvedColumn[]     ← stable reference; changes only when
     │                         data shape or user overrides change
     ▼
processRows(rows, columns)  ← called per-render for visible rows only
     │
     ▼ ProcessedRow[]       ← immutable output consumed by framework layer
```

### Immediate text fallback

`resolveColumns(data)` called *without* an `inferenceResult` returns `text` for
every column.  The Svelte component calls this immediately on mount so the table
renders without waiting for type inference.  Once `inferSchema` completes (idle
callback), `resolveColumns` is called again with the result and Svelte's reactivity
updates only the cells whose types changed.

---

## Key Modules

| Module | Responsibility |
|--------|----------------|
| `engine/index.ts` | `createTableEngine()` factory — stateless computation object |
| `inference/index.ts` | `inferSchema()` — systematic sampling + detector chain |
| `inference/detectors.ts` | 15 type detectors + keyword boost map |
| `registry/index.ts` | `Map<string, RendererFn>` singleton registry |
| `renderers/*.ts` | 17 Tier 1 renderer functions — self-register on import |
| `renderers/index.ts` | Barrel that triggers all 17 self-registrations |
| `compat/v1.ts` | `adaptV1Props()` — v1 `colname`/`rowdata` → v2 `{ data, columns }` |
| `tokens.ts` | `DEFAULT_TOKENS` — 18 `--tc-*` CSS custom property defaults |
| `scheduler.ts` | `scheduleIdleWork()` — `requestIdleCallback` with SSR fallback |
| `types.ts` | All public TypeScript type definitions |

---

## Renderer Registry

All 17 built-in renderers use the **same plugin API** as external custom renderers.
There is no special-casing of built-ins.

```ts
import { registerRenderer, getRenderer } from '@tablecraft/core';

// Register a custom renderer
registerRenderer('myCustomType', (value, column) => {
  return { kind: 'text', value: String(value) };
});

// Replace a built-in renderer
registerRenderer('badge', (value, column) => {
  return { kind: 'badge', label: String(value).toUpperCase(), variant: 'info' };
});
```

Tree-shaking: import individual renderers to avoid loading the full 17-renderer set:

```ts
import '@tablecraft/core/renderers/currency';  // loads only currency renderer
import '@tablecraft/core/renderers/email';     // loads only email renderer
```

---

## v1 Compatibility Shim

The v1 API (`colname`/`rowdata`) is deprecated in v2 and will be removed in v3.
Every call to `adaptV1Props()` emits a `console.warn` with a migration guide URL.

```ts
import { adaptV1Props } from '@tablecraft/core';

const { data, columns } = adaptV1Props(
  { checkbox: 'Active', dropdown: 'Status', mail: 'Email' },
  [[true, 'active', 'user@example.com']]
);
// → data:    [{ active: true, status: 'active', email: 'user@example.com' }]
// → columns: [{ key: 'active', type: 'boolean', label: 'Active' }, ...]
```

v1 → v2 type mappings:

| v1 type    | v2 type   | Reason |
|------------|-----------|--------|
| `dropdown` | `status`  | Enum value with semantic color |
| `list`     | `text`    | Array display; editing deferred to Phase 6 |
| `input`    | `text`    | Editable field; editing deferred to Phase 6 |
| `checkbox` | `boolean` | Boolean check/cross icon |
| `mail`     | `email`   | `mailto:` link |
| `tag`      | `url`     | External link anchor |

---

## CSS Tokens

`DEFAULT_TOKENS` in `tokens.ts` defines 18 `--tc-*` CSS custom properties with
sensible defaults.  The Svelte package injects these at `:root` scope in Phase 3.
Consumers override via `[data-theme="dark"]` or `prefers-color-scheme`.

---

*Last updated: Phase 2 Plan 05*
