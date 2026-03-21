---
phase: 02-core-engine-type-inference-renderer-registry
plan: "02"
subsystem: inference-engine
tags: [inference, detectors, type-detection, keyword-boost, sampling, CORE-02, CORE-03, CORE-04]
dependency_graph:
  requires:
    - "02-01: types.ts (ColumnType, InferenceResult, ColumnInferenceMap)"
    - "02-01: vitest.config.ts (test infrastructure + coverage thresholds)"
  provides:
    - "packages/core/src/inference/detectors.ts (15 detector functions + getBoostMap + DETECTORS)"
    - "packages/core/src/inference/index.ts (inferSchema, sampleRows, runDetectors)"
  affects:
    - "02-03: registry plan imports from inference (dependency confirmation)"
    - "02-04+: engine factory (Wave 5) calls inferSchema"
    - "packages/core/src/index.ts (new inference exports added)"
tech_stack:
  added: []
  patterns:
    - "Detector chain pattern: ordered function array, first match above threshold wins"
    - "Systematic sampling: step=ceil(n/200), preserves sorted/grouped data distribution"
    - "Null guard: >50% null/undefined/empty → immediate text fallback at inference level"
    - "Keyword boost: +0.15 additive, clamped to 1.0 — 8 keyword groups mapped to ColumnType"
    - "_at suffix regex for date boost (avoids false match on 'avatar', 'rate')"
key_files:
  created:
    - packages/core/src/inference/detectors.ts
    - packages/core/src/inference/index.ts
    - packages/core/src/inference/detectors.test.ts
    - packages/core/src/inference/inference.test.ts
  modified:
    - packages/core/src/index.ts
decisions:
  - "Used _at suffix regex for date keyword boost instead of 'at' substring — avoids false matches on 'avatar', 'rate', 'state'"
  - "detectStatus requires value length <= 20 AND non-numeric AND unique count <= 10 — explicit numeric guard prevents overlap with integer columns that happen to have low cardinality"
  - "Wave 0 stubs committed first (all it.todo) then replaced with real assertions in same task — clean TDD RED→GREEN in single atomic commit per file"
metrics:
  duration: 452s
  completed: "2026-03-21"
  tasks_completed: 4
  files_created: 4
  files_modified: 1
---

# Phase 2 Plan 02: Type Inference Engine Summary

**One-liner:** 15-detector priority chain with systematic 200-row sampling, 0.8 threshold, and +0.15 keyword boost for 8 column name patterns, all tested with 226 passing assertions.

---

## What Was Built

### packages/core/src/inference/detectors.ts (441 lines)

Implements all 15 detector functions in priority order plus keyword boost infrastructure:

- **DetectorFn type**: `(samples: unknown[], columnKey: string) => { type: ColumnType; confidence: number } | null`
- **Internal helpers**: `toStringOrNull`, `nonNullStrings`, `matchRatio` — shared null-safe value normalization
- **15 detectors** in exact priority order:
  1. `detectBoolean` — true/false/yes/no/on/off/1/0 (actual booleans + strings, case-insensitive)
  2. `detectCurrency` — `$€£¥₹` prefix/suffix + ISO currency codes (USD/EUR/etc.)
  3. `detectPercentage` — `%` suffix OR 0-1 decimals when column name contains rate/ratio/pct/percent
  4. `detectInteger` — whole numbers, rejects currency prefix
  5. `detectNumber` — decimal numbers, rejects currency prefix
  6. `detectDatetime` — ISO 8601 with T separator (`/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/`)
  7. `detectDate` — ISO 8601 date only, defers if datetime pattern seen
  8. `detectTime` — HH:MM or HH:MM:SS, rejects date patterns
  9. `detectEmail` — `local@domain.tld` via RFC-compatible regex
  10. `detectPhone` — 7-15 digits with `+()- ` separators, rejects emails
  11. `detectImage` — `.jpg/.jpeg/.png/.gif/.svg/.webp` extension OR `/images/` OR `/img/` OR `cdn.` pattern
  12. `detectUrl` — `https?://` prefix, rejects emails
  13. `detectStatus` — unique values <= 10, all strings <= 20 chars, non-numeric
  14. `detectCode` — multi-line + code pattern (`{}`, `=>`, `function`, `const`/`let`/`var`)
  15. `detectText` — always returns `{ type: 'text', confidence: 0.5 }` (the catch-all fallback)
- **`getBoostMap(columnKey)`** — 8 keyword groups, each boosting 0.15: image/email/phone/url/currency/date/status/percentage
- **`DETECTORS`** — `readonly DetectorFn[]` array in priority order (used by `runDetectors`)

### packages/core/src/inference/index.ts (140 lines)

Main inference pipeline with zero DOM dependencies:

- **`sampleRows<TRow>(data, maxSamples=200)`** — systematic sampling: `step = ceil(n/200)`, returns data reference unchanged when `n <= 200`
- **`runDetectors(samples, columnKey)`** — null guard first (>50% null → text fallback), computes boost map, iterates DETECTORS chain, applies additive boost clamped to 1.0, returns first result >= 0.8
- **`inferSchema<TRow>(data)`** — discovers column keys from `data[0]`, samples rows, runs per-column detector chain, returns `ColumnInferenceMap`. Handles 0 rows (empty map, no throw).

### packages/core/src/index.ts (updated)

Added exports for Wave 2 public API: `inferSchema`, `sampleRows`, `runDetectors`, `DetectorFn`, `DetectorResult`, `DETECTORS`, `getBoostMap` + Phase 2 types (`CellDescriptor`, `RendererFn`, `ResolvedColumn`, `ProcessedRow`, `BadgeVariant`).

---

## Test Coverage

| File | Tests | Coverage scope |
|------|-------|---------------|
| detectors.test.ts | 115 assertions | All 15 detectors + getBoostMap (26 cases) + DETECTORS array |
| inference.test.ts | 45 assertions | sampleRows (9) + inferSchema (24) + field-name boosting (7) + runDetectors (5) |
| **Total new** | **160** | — |
| **Total suite** | **226 passed** | All 6 test files, 0 failures |

All must_haves from the plan verified:
- inferSchema(0 rows) returns `{}` without throwing
- All 15 detectors in exact priority order
- Confidence threshold 0.8 — text fallback at 0.5
- Keyword boost +0.15 tested for each of 8 groups
- >50% null columns → text/0.5/fallback
- 200-row systematic sampling works for 201, 400, 500, 1000, 10000 row inputs
- `pnpm --filter @tablecraft/core test` exits 0

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] "at" as date keyword caused false match on "avatar"**
- **Found during:** Task 2 — first test run after detectors.ts implementation
- **Issue:** KEYWORD_BOOSTS included `'at'` as a date keyword (from CONTEXT.md: `date/created/updated/timestamp/born/at`). The substring check `lower.includes('at')` matched `'avatar'` → produced `{ image: 0.15, date: 0.15 }` instead of `{ image: 0.15 }`
- **Fix:** Removed `'at'` from the keyword list. Added `_at` suffix regex in `getBoostMap` (`/_at$/.test(lower) || lower === 'at'`) to correctly match `created_at`, `updated_at`, `published_at` without false positives
- **Files modified:** `packages/core/src/inference/detectors.ts`
- **Commit:** `080ae9b`

---

## Self-Check

**Checking files exist:**
- packages/core/src/inference/detectors.ts — FOUND
- packages/core/src/inference/index.ts — FOUND
- packages/core/src/inference/detectors.test.ts — FOUND
- packages/core/src/inference/inference.test.ts — FOUND

**Checking commits exist:**
- `9899486` test(02-02): Wave 0 stubs — FOUND
- `080ae9b` feat(02-02): detectors implementation — FOUND
- `a86f6ae` feat(02-02): inference pipeline — FOUND
- `18925d0` feat(02-02): public API exports — FOUND

**Final test run:** `pnpm --filter @tablecraft/core test` → 226 passed, 6 files, exit 0

## Self-Check: PASSED
