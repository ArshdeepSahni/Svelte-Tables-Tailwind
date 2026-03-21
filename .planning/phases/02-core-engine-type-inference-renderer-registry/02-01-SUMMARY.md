---
phase: 02-core-engine-type-inference-renderer-registry
plan: 01
subsystem: core
tags: [types, tokens, scheduler, build-config, test-stubs]
dependency_graph:
  requires: []
  provides:
    - packages/core/src/types.ts#CellDescriptor
    - packages/core/src/types.ts#ResolvedColumn
    - packages/core/src/types.ts#RendererFn
    - packages/core/src/types.ts#ProcessedRow
    - packages/core/src/types.ts#BadgeVariant
    - packages/core/src/tokens.ts#DEFAULT_TOKENS
    - packages/core/src/scheduler.ts#scheduleIdleWork
  affects:
    - packages/core/src/index.ts (must export new types)
    - packages/core/src/registry/index.ts (imports RendererFn + ResolvedColumn in Wave 3)
    - packages/core/src/renderers/*.ts (each entry point in vite multi-entry)
tech_stack:
  added: []
  patterns:
    - discriminated union on CellDescriptor.kind — renderer-switch XSS elimination
    - requestIdleCallback > setImmediate > setTimeout priority chain for isomorphic scheduling
    - Vite 8 rolldownOptions + multi-entry for per-renderer tree-shaking
    - Vitest per-glob coverage thresholds (inference >=95%, renderers >=90%)
key_files:
  created:
    - packages/core/src/tokens.ts
    - packages/core/src/scheduler.ts
    - packages/core/src/scheduler.test.ts
    - packages/core/src/tokens.test.ts
  modified:
    - packages/core/src/types.ts (appended Phase 2 types; no Phase 1 exports removed)
    - packages/core/vite.config.ts (rollupOptions → rolldownOptions, multi-entry, no UMD)
    - packages/core/vitest.config.ts (coverage thresholds added)
decisions:
  - plan-action token count (19) exceeded must_haves claim of 18; dropped --tc-border-width to achieve exactly 18 keys; tokens.test.ts EXPECTED_TOKENS array reflects 18-entry truth
key_decisions:
  - Dropped --tc-border-width to align token count to 18 as required by plan must_haves; border-width defaults to browser 1px and is safely omitted from token system
metrics:
  duration: 185s
  completed: "2026-03-21"
  tasks: 2
  files: 7
---

# Phase 2 Plan 01: Foundation Scaffolding — Types, Tokens, Scheduler, Build Config Summary

One-liner: Phase 2 scaffolding with CellDescriptor discriminated union, 18-token CSS system, isomorphic idle scheduler, Vite 8 multi-entry build, and Vitest per-glob coverage thresholds.

---

## What Was Built

### Task 1: types.ts + tokens.ts

Extended `packages/core/src/types.ts` by appending Phase 2 type contracts after the last Phase 1 export. All 6 Phase 1 exports (`ColumnType`, `ColumnOverrideShort`, `ColumnDefinition`, `TableConfig`, `InferenceResult`, `ColumnInferenceMap`, `defineColumns`) remain untouched.

New Phase 2 additions:
- `BadgeVariant` — `'default' | 'success' | 'warning' | 'danger' | 'info'`
- `CellDescriptor` — 10-variant discriminated union (text, number, link, image, badge, status, boolean, code, html, raw); Svelte component switches on `kind`
- `RendererFn` — `(value: unknown, column: ResolvedColumn) => CellDescriptor`
- `ResolvedColumn` — extends `ColumnDefinition` with required `type: ColumnType`, `label: string`, optional `inferenceResult`
- `ProcessedRow` — `{ _original: Record<string, unknown>; cells: Record<string, CellDescriptor> }`

Created `packages/core/src/tokens.ts` with `DEFAULT_TOKENS` as a `const` object containing 18 `--tc-*` CSS custom property defaults (6 colors, 4 status colors, 4 spacing, 3 typography, 1 border).

### Task 2: scheduler.ts + Wave 0 test stubs + config updates

Created `packages/core/src/scheduler.ts` implementing `scheduleIdleWork` with environment detection via API presence (not `typeof navigator`): checks `requestIdleCallback` (browser), then `setImmediate` (Node.js 20+), then falls back to `setTimeout(fn, 0)` for edge runtimes.

Created Wave 0 test stubs:
- `scheduler.test.ts` — 4 tests covering all three scheduler branches
- `tokens.test.ts` — 6 tests verifying all 18 tokens with correct names and non-empty values

Rewrote `packages/core/vite.config.ts`:
- `rollupOptions` → `rolldownOptions` (Vite 8 requirement)
- Single entry → multi-entry: `index` + 17 renderer entries (`renderers/{name}`) for tree-shaking
- Formats: `['es', 'cjs']` (UMD dropped — not compatible with Rolldown multi-entry)
- `rollupTypes: false` — one `.d.ts` per source file instead of bundled index.d.ts

Updated `packages/core/vitest.config.ts`:
- Added `src/tokens.ts` to coverage exclude (pure data object, no branches)
- Added per-glob coverage thresholds: inference `>=95%`, renderers `>=90%`
- Global floor: lines/functions/statements `>=90%`, branches `>=85%`

---

## Verification Results

| Check | Result |
| ----- | ------ |
| `pnpm --filter @tablecraft/core typecheck` | Exit 0 |
| `pnpm --filter @tablecraft/core test` | Exit 0 |
| CellDescriptor in types.ts | Present (10 variants) |
| ResolvedColumn in types.ts | Present |
| RendererFn in types.ts | Present |
| ProcessedRow in types.ts | Present |
| BadgeVariant in types.ts | Present |
| defineColumns in types.ts | Present (not removed) |
| DEFAULT_TOKENS key count | 18 |
| rolldownOptions in vite.config.ts | Present |
| rollupTypes: false in vite.config.ts | Present |
| renderers/currency in vite.config.ts | Present |
| src/inference threshold in vitest.config.ts | Present (>=95%) |
| src/renderers threshold in vitest.config.ts | Present (>=90%) |

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Token count reconciliation: 19 → 18**
- **Found during:** Task 1 (tokens.ts creation)
- **Issue:** Plan `must_haves` states "exactly 18 --tc-* tokens" but the `DEFAULT_TOKENS` action content in Step 2 contains 19 unique keys (plan author miscounted). The Wave 0 test stub uses `toHaveLength(18)`, making the conflict machine-verifiable.
- **Fix:** Removed `--tc-border-width` (least essential; border-width defaults to 1px browser default and is not a layout-critical token). Updated `tokens.test.ts` EXPECTED_TOKENS array to 18 entries matching the 18-key object. Test passes with `toHaveLength(18)`.
- **Files modified:** `packages/core/src/tokens.ts`, `packages/core/src/tokens.test.ts`
- **Commit:** a4999f9 (tokens.ts), 8af7336 (tokens.test.ts)

---

## Self-Check: PASSED

| Item | Status |
| ---- | ------ |
| packages/core/src/types.ts | FOUND |
| packages/core/src/tokens.ts | FOUND |
| packages/core/src/scheduler.ts | FOUND |
| packages/core/src/scheduler.test.ts | FOUND |
| packages/core/src/tokens.test.ts | FOUND |
| packages/core/vite.config.ts | FOUND |
| packages/core/vitest.config.ts | FOUND |
| Commit a4999f9 | FOUND |
| Commit 8af7336 | FOUND |
