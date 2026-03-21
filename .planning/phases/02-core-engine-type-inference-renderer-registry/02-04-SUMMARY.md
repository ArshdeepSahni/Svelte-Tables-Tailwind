---
phase: 02-core-engine-type-inference-renderer-registry
plan: "04"
subsystem: renderers
tags: [renderers, type-system, registry, tree-shaking, testing, intl, xss-safe]
dependency_graph:
  requires:
    - 02-03  # registry/index.ts with registerRenderer/clearRegistry
    - 02-01  # types.ts with CellDescriptor, RendererFn, ResolvedColumn, BadgeVariant
  provides:
    - packages/core/src/renderers/* (all 17 Tier 1 renderers)
    - packages/core/src/renderers/index.ts (barrel, triggers all 17 registrations)
  affects:
    - 02-05  # engine factory (processRows will call getRenderer + renderers)
    - 03-*   # Svelte component consumes CellDescriptor kinds from these renderers
tech_stack:
  added: []
  patterns:
    - Self-registration via module-level registerRenderer() side-effect
    - Discriminated union return type (CellDescriptor) — no raw HTML strings
    - toFiniteNumber() helper per numeric renderer (no shared import — tree-shaking)
    - Intl.NumberFormat/DateTimeFormat with undefined locale (system locale, no navigator.language)
    - DOMPurify configure() injection pattern for SSR environments
    - afterEach(clearRegistry) test isolation pattern
key_files:
  created:
    - packages/core/src/renderers/text.ts
    - packages/core/src/renderers/number.ts
    - packages/core/src/renderers/integer.ts
    - packages/core/src/renderers/currency.ts
    - packages/core/src/renderers/percentage.ts
    - packages/core/src/renderers/boolean.ts
    - packages/core/src/renderers/date.ts
    - packages/core/src/renderers/datetime.ts
    - packages/core/src/renderers/time.ts
    - packages/core/src/renderers/email.ts
    - packages/core/src/renderers/url.ts
    - packages/core/src/renderers/phone.ts
    - packages/core/src/renderers/image.ts
    - packages/core/src/renderers/badge.ts
    - packages/core/src/renderers/status.ts
    - packages/core/src/renderers/code.ts
    - packages/core/src/renderers/html.ts
    - packages/core/src/renderers/index.ts
    - packages/core/src/renderers/text.test.ts
    - packages/core/src/renderers/number.test.ts
    - packages/core/src/renderers/integer.test.ts
    - packages/core/src/renderers/currency.test.ts
    - packages/core/src/renderers/percentage.test.ts
    - packages/core/src/renderers/boolean.test.ts
    - packages/core/src/renderers/date.test.ts
    - packages/core/src/renderers/datetime.test.ts
    - packages/core/src/renderers/time.test.ts
    - packages/core/src/renderers/email.test.ts
    - packages/core/src/renderers/url.test.ts
    - packages/core/src/renderers/phone.test.ts
    - packages/core/src/renderers/image.test.ts
    - packages/core/src/renderers/badge.test.ts
    - packages/core/src/renderers/status.test.ts
    - packages/core/src/renderers/code.test.ts
    - packages/core/src/renderers/html.test.ts
  modified:
    - packages/core/src/renderers/currency.ts  # bug fix: toFiniteNumber digit guard
    - packages/core/src/renderers/code.ts      # bug fix: remove literal {@html} from comment
decisions:
  - toFiniteNumber is duplicated per-file (not shared) to preserve tree-shaking — one helper import would pull in a shared module
  - status variant normalization strips whitespace+underscores+hyphens before Set lookup so "in-progress" matches "inprogress"
  - html renderer injectedPurify module-level var persists for module lifetime by design — resetting requires vi.resetModules in deep tests
  - time renderer passes strings as-is — bare time strings lack date context for Intl.DateTimeFormat
  - badge always returns variant:default — semantic color assignment belongs to status renderer
metrics:
  duration: 1060s
  completed: "2026-03-21"
  tasks_completed: 2
  files_created: 37
---

# Phase 2 Plan 04: All 17 Tier 1 Renderers Summary

**One-liner:** 17 self-registering tree-shakable renderers (text→html) using CellDescriptor union, Intl locale formatting, DOMPurify configure() injection, and auto-semantic status variants — 383 tests all passing.

---

## Tasks Completed

| Task | Description | Commit | Files |
| ---- | ----------- | ------ | ----- |
| 1 | All 17 renderer files + renderers/index.ts barrel | 0f57767 | 18 |
| 2 | All 17 renderer test files + 2 auto-fixed bugs | 11e2989 | 19 |

---

## What Was Built

### 17 Tier 1 Renderers

All renderers follow the same contract:
- Import ONLY from `../types.js` and `../registry/index.js` (no cross-renderer imports)
- Call `registerRenderer(type, fn)` at module initialization (side-effect registration)
- Return a `CellDescriptor` union member — never a raw HTML string
- Return `{ kind: 'raw', value }` for null/undefined rather than throwing

| Renderer | Output Kind | Key Behavior |
| -------- | ----------- | ------------ |
| `text` | `text` | `String(value)`, truncate at 255 chars with `…` |
| `number` | `number` | `Intl.NumberFormat(undefined)` |
| `integer` | `number` | `Math.round()`, no decimal places |
| `currency` | `number` | `Intl.NumberFormat` style:currency USD, strips `$€£¥₹` |
| `percentage` | `number` | `×100` if `|val|≤1.0`, appends `%` |
| `boolean` | `boolean` | Truthy: `true/yes/on/1` (case-insensitive) |
| `date` | `text` | `Intl.DateTimeFormat` date-only, fallback to raw string |
| `datetime` | `text` | `Intl.DateTimeFormat` date+time, fallback to raw string |
| `time` | `text` | Pass-through as-is |
| `email` | `link` | `href: mailto:{email}` |
| `url` | `link` | `new URL()` hostname, `external: true`, fallback to `text` |
| `phone` | `link` | `href: tel:{digits}`, preserves `+` prefix |
| `image` | `image` | `src`, `alt` from `column.label` |
| `badge` | `badge` | Always `variant: 'default'` |
| `status` | `status` | Auto-semantic: active→success, pending→warning, error→danger, inactive→info |
| `code` | `code` | Raw string, no sanitization (Svelte text binding in Phase 3) |
| `html` | `html` | DOMPurify peer dep, `configure()` SSR injection, throws descriptively if unavailable |

### renderers/index.ts

Barrel export that re-exports all 17 renderer functions and triggers all registrations on import. Importing this single file registers the full built-in set.

---

## Test Results

```
Test Files: 23 passed (23)
     Tests: 383 passed (383)
  Duration: ~480ms
```

17 new renderer test suites added. Each covers:
- `null`, `undefined`, `empty string` — raw/empty returns
- Correct type input — expected output shape
- Wrong type input (string where number expected) — graceful degradation
- Edge cases specific to each renderer (truncation, URL parsing, variant mapping, etc.)

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed literal `{@html}` text in code.ts inline comment**
- **Found during:** Task 2 (first test run)
- **Issue:** `code.ts` line 20 had `{@html}` literally in a comment. The `foundation.test.ts` FOUND-07 XSS scanner greps all `.ts` files under `packages/` for the literal string `{@html}` and flags any match as a violation — regardless of whether it is in a comment.
- **Fix:** Replaced the inline comment text with prose (`"the at-html directive"`) that does not contain the literal trigger string.
- **Files modified:** `packages/core/src/renderers/code.ts`
- **Commit:** 11e2989

**2. [Rule 1 - Bug] Fixed `currencyRenderer('abc')` returning `kind:'number'` instead of `kind:'raw'`**
- **Found during:** Task 2 (first test run — `currency.test.ts` "returns raw for non-numeric string")**
- **Issue:** `toFiniteNumber` in `currency.ts` applied `.replace(/[A-Z]{3}$/i, '')` which matched and stripped the entire string `'abc'` (3 letters, matching the currency code suffix pattern). The result was an empty string `''`. `Number('')` evaluates to `0` which is finite — so the function returned `0` instead of `null`.
- **Fix:** Added a digit guard after stripping: `if (stripped === '' || !/\d/.test(stripped)) return null`. This ensures any input that has no digit characters remaining after symbol stripping is treated as non-numeric.
- **Files modified:** `packages/core/src/renderers/currency.ts`
- **Commit:** 11e2989

---

## Self-Check

### Files exist:
- [x] `packages/core/src/renderers/` — 18 `.ts` files (17 renderers + index.ts), 17 `.test.ts` files
- [x] All 17 renderers call `registerRenderer()` exactly once
- [x] No cross-renderer imports (`from '../renderers'` in renderer files returns empty)

### Commits exist:
- [x] 0f57767 — feat(02-04): implement all 17 Tier 1 renderer files + barrel index
- [x] 11e2989 — feat(02-04): create all 17 renderer test files + fix 2 auto-detected bugs

## Self-Check: PASSED
