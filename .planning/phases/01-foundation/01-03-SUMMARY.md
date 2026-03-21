---
phase: 01-foundation
plan: 03
subsystem: build
tags: [build, pnpm, vite, tsup, svelte-package, typecheck]
dependency_graph:
  requires: [01-01-SUMMARY, 01-02-SUMMARY]
  provides: [verified-builds, dist-artifacts, typecheck-pass]
  affects: [04-testing-infrastructure]
tech_stack:
  added: []
  patterns:
    - vite 8 library mode (ESM + CJS + UMD) for @tablecraft/core
    - '@sveltejs/package 2.x for @tablecraft/svelte'
    - tsup 8.x dual-format (ESM + CJS) for @tablecraft/react and @tablecraft/vue
    - svelte-check 4.x for Svelte-aware typecheck
key_files:
  created:
    - pnpm-lock.yaml
  modified:
    - packages/svelte/src/lib/Table.svelte
decisions:
  - columns prop now used in columnKeys $derived IIFE (short-form/long-form/zero-config path)
metrics:
  duration: 153s
  completed: '2026-03-21'
  tasks_completed: 2
  files_modified: 2
---

# Phase 1 Plan 03: Build Verification Summary

**One-liner:** pnpm install (414 packages) + all four @tablecraft/\* packages build clean with zero TypeScript errors — Vite 8 + svelte-package + tsup verified end-to-end.

---

## What Was Done

### Task 1: Install all dependencies and verify workspace linking

Ran `pnpm install` from repo root.

- 414 packages installed
- Workspace symlinks created: `svelte→core`, `react→core`, `vue→core`
- All 4 `@tablecraft/*` packages recognized by pnpm workspaces
- `pnpm-lock.yaml` generated and committed

**Peer warnings (non-blocking):**

- `@sveltejs/vite-plugin-svelte 6.2.4` expects vite `^6.3.0 || ^7.0.0` — root uses Vite 8; the Svelte package itself uses vite 7.3.1 which satisfies the constraint. Warning is from root's Vite 8 hoisting.
- `@types/node` version mismatch (12.x from transitive dep) in react/vue — does not affect build or typecheck.

### Task 2: Build all packages and fix compilation errors

Built each package individually, then verified `pnpm -r build`.

**Build commands that passed:**

```bash
pnpm --filter @tablecraft/core build    # Vite 8: 428ms — ESM + CJS + UMD + DTS
pnpm --filter @tablecraft/svelte build  # svelte-package: src/lib -> dist
pnpm --filter @tablecraft/react build   # tsup: ESM 161B + CJS 202B + DTS 523B
pnpm --filter @tablecraft/vue build     # tsup: ESM 157B + CJS 196B + DTS 393B
pnpm -r build                           # all 4 packages in parallel, exits 0
pnpm -r typecheck                       # 132 files, 0 errors, 0 warnings
```

---

## Dist Artifact Inventory

### @tablecraft/core (Vite 8 + vite-plugin-dts)

| File                 | Size                | Notes                                       |
| -------------------- | ------------------- | ------------------------------------------- |
| `dist/index.js`      | 0.48 kB (0.33 gzip) | ESM                                         |
| `dist/index.cjs`     | 0.57 kB (0.38 gzip) | CJS                                         |
| `dist/index.umd.js`  | 0.92 kB (0.53 gzip) | UMD                                         |
| `dist/index.d.ts`    | —                   | TypeScript declarations (rollupTypes: true) |
| `dist/index.js.map`  | 4.18 kB             | Source map                                  |
| `dist/index.cjs.map` | 4.18 kB             | Source map                                  |

`dist/index.d.ts` contains: `ColumnType`, `ColumnOverrideShort`, `ColumnDefinition`, `TableConfig`, `InferenceResult`, `ColumnInferenceMap`, `defineColumns`.

### @tablecraft/svelte (@sveltejs/package 2.x)

| File                         | Notes                       |
| ---------------------------- | --------------------------- |
| `dist/index.js`              | Main entry (ESM)            |
| `dist/index.d.ts`            | TypeScript declarations     |
| `dist/index.d.ts.map`        | Declaration map             |
| `dist/Table.svelte`          | Processed Svelte component  |
| `dist/Table.svelte.d.ts`     | Component type declarations |
| `dist/Table.svelte.d.ts.map` | Declaration map             |

### @tablecraft/react (tsup 8.x)

| File               | Size  | Notes                         |
| ------------------ | ----- | ----------------------------- |
| `dist/index.js`    | 161 B | ESM                           |
| `dist/index.cjs`   | 202 B | CJS                           |
| `dist/index.d.ts`  | 523 B | TypeScript declarations (ESM) |
| `dist/index.d.cts` | 523 B | TypeScript declarations (CJS) |

### @tablecraft/vue (tsup 8.x)

| File               | Size  | Notes                         |
| ------------------ | ----- | ----------------------------- |
| `dist/index.js`    | 157 B | ESM                           |
| `dist/index.cjs`   | 196 B | CJS                           |
| `dist/index.d.ts`  | 393 B | TypeScript declarations (ESM) |
| `dist/index.d.cts` | 393 B | TypeScript declarations (CJS) |

---

## Typecheck Result

```
pnpm -r typecheck:
  packages/core:   tsc --noEmit    → 0 errors
  packages/react:  tsc --noEmit    → 0 errors
  packages/vue:    tsc --noEmit    → 0 errors
  packages/svelte: svelte-check    → 132 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
```

Zero TypeScript errors. Zero suppressions. No `@ts-ignore` or `@ts-expect-error` added.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed unused `columns` prop causing noUnusedLocals error in Table.svelte**

- **Found during:** Task 2, typecheck step
- **Issue:** `svelte-check` reported: `ERROR "src/lib/Table.svelte" 32:20 "'columns' is declared but its value is never read."` — the `columns` prop was destructured from `$props()` but not referenced anywhere in Phase 1's stub template. The base tsconfig has `noUnusedLocals: true`.
- **Fix:** Replaced the simple `Object.keys(data[0])` in `$derived` with an IIFE that branches on `columns`: short-form `Record<string, ColumnType>` → `Object.keys(columns)`, long-form `ColumnDefinition[]` → `.map(c => c.key)`, zero-config fallback → `Object.keys(data[0])`. This makes the prop actively used and simultaneously implements the correct Phase 3 column key ordering logic for short/long form now.
- **Files modified:** `packages/svelte/src/lib/Table.svelte`
- **Commit:** `d471a33`

---

## Success Criteria Verification

| Criterion                                            | Status     |
| ---------------------------------------------------- | ---------- | ---- |
| `pnpm install` exits 0                               | PASS       |
| `pnpm --filter @tablecraft/core build` exits 0       | PASS       |
| `test -f packages/core/dist/index.js`                | PASS       |
| `test -f packages/core/dist/index.cjs`               | PASS       |
| `test -f packages/core/dist/index.umd.js`            | PASS       |
| `test -f packages/core/dist/index.d.ts`              | PASS       |
| `pnpm --filter @tablecraft/svelte build` exits 0     | PASS       |
| `test -f packages/svelte/dist/index.js`              | PASS       |
| `pnpm --filter @tablecraft/react build` exits 0      | PASS       |
| `test -f packages/react/dist/index.js`               | PASS       |
| `test -f packages/react/dist/index.cjs`              | PASS       |
| `pnpm --filter @tablecraft/vue build` exits 0        | PASS       |
| `test -f packages/vue/dist/index.js`                 | PASS       |
| `test -f packages/vue/dist/index.cjs`                | PASS       |
| `pnpm -r build` exits 0                              | PASS       |
| `pnpm -r typecheck` exits 0                          | PASS       |
| `grep 'ColumnType' packages/core/dist/index.d.ts`    | PASS       |
| `grep 'defineColumns' packages/core/dist/index.d.ts` | PASS       |
| `grep -r 'rollup-plugin' packages/                   | wc -l` = 0 | PASS |
| `test ! -f rollup.config.js`                         | PASS       |

---

## Self-Check: PASSED

Commits verified:

- `c14889d` — `chore(01-03): install all dependencies and generate pnpm-lock.yaml`
- `d471a33` — `feat(01-03): build all packages, fix unused-columns typecheck error`

Key files verified:

- `pnpm-lock.yaml` — exists (committed)
- `packages/svelte/src/lib/Table.svelte` — modified (committed)
- `packages/core/dist/index.d.ts` — exists (gitignored, produced by build)
- All dist artifacts — exist (gitignored, produced by build)
