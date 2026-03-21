---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [pnpm, monorepo, typescript, eslint, prettier, changesets, svelte5, vite]

# Dependency graph
requires: []
provides:
  - pnpm workspace with packages/* and apps/* discovery
  - Root package.json as private monorepo root (no entry points)
  - MIT license corrected in both LICENSE file and package.json
  - tsconfig.base.json with strict TypeScript ES2022 shared config
  - ESLint 9 flat config with svelte/no-at-html-tags: error (FOUND-07 enforcement)
  - .prettierrc with prettier-plugin-svelte
  - .changeset/config.json with public access and linked @tablecraft/* packages
  - Package stub directories: packages/core, packages/svelte, packages/react, packages/vue, apps/docs
  - v1 artifacts eliminated: rollup.config.js, src/, dist/, package-lock.json, bun.lock
affects:
  - 01-foundation/02 (package scaffolding depends on workspace + stub dirs)
  - All future phases (inherit tsconfig.base.json, eslint.config.js, .prettierrc)

# Tech tracking
tech-stack:
  added:
    - pnpm 9.15.4 (packageManager field)
    - TypeScript 5.8.3 (strict mode, ES2022, NodeNext)
    - ESLint 9.24.0 (flat config)
    - Prettier 3.5.3 + prettier-plugin-svelte 3.4.0
    - "@changesets/cli 2.30.0"
    - Vitest 4.1.0 (declared as root devDependency)
    - Svelte 5.x (declared as root devDependency)
    - eslint-plugin-svelte 2.46.1
    - "@eslint/js 9.24.0"
    - globals 16.0.0
    - svelte-eslint-parser 0.43.0
  patterns:
    - pnpm workspace protocol for cross-package dependencies
    - ESLint 9 flat config (not .eslintrc.json)
    - tsconfig.base.json extended by each package tsconfig
    - Changesets for coordinated @tablecraft/* version releases

key-files:
  created:
    - pnpm-workspace.yaml
    - tsconfig.base.json
    - eslint.config.js
    - .prettierrc
    - .changeset/config.json
    - packages/core/ (stub)
    - packages/svelte/ (stub)
    - packages/react/ (stub)
    - packages/vue/ (stub)
    - apps/docs/ (stub)
  modified:
    - package.json (complete rewrite: v1 → monorepo root)
    - .gitignore (monorepo-aware patterns)
    - LICENSE (was MIT already, package.json corrected from ISC to MIT)

key-decisions:
  - "Used ESLint 9 flat config (eslint.config.js) not legacy .eslintrc — v9 is the current standard"
  - "svelte/no-at-html-tags set to error level — enforces FOUND-07 XSS elimination at lint time"
  - "NodeNext module resolution chosen — required for pnpm workspace ESM interop in Node 20+"
  - "verbatimModuleSyntax: true — prevents type-only imports from polluting runtime output"
  - "Changesets linked array groups all @tablecraft/* for coordinated releases"
  - "@eslint/js, globals, svelte-eslint-parser added to root devDependencies (needed by eslint.config.js but missing from plan's initial dep list — auto-included in Task 3)"

patterns-established:
  - "Monorepo root pattern: private: true, no main/module fields, only workspace scripts"
  - "ESLint flat config pattern: separate blocks per file type (ts, svelte, global ignores)"
  - "tsconfig.base.json extend pattern: packages/*/tsconfig.json will extend via ../../tsconfig.base.json"

requirements-completed: [FOUND-01, FOUND-06, FOUND-07, FOUND-08, FOUND-09, FOUND-10]

# Metrics
duration: 2min
completed: 2026-03-21
---

# Phase 1, Plan 01: Foundation Summary

**pnpm monorepo skeleton with strict TypeScript, ESLint 9 flat config (XSS rule enforced), Prettier, Changesets, and all v1 Rollup/Svelte-3 artifacts eliminated**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-21T12:34:07Z
- **Completed:** 2026-03-21T12:36:23Z
- **Tasks:** 3/3
- **Files modified:** 9 created, 2 modified, 6 deleted

## Accomplishments

- Converted flat v1 repository to pnpm monorepo with pnpm-workspace.yaml declaring packages/* and apps/*
- Eliminated all v1 blocking artifacts: rollup.config.js, src/Tables.svelte, src/index.js, dist/, package-lock.json, bun.lock
- Fixed FOUND-06 license mismatch: package.json corrected from ISC to MIT (LICENSE file was already MIT)
- Created strict TypeScript foundation (tsconfig.base.json: strict, ES2022, NodeNext, noUnusedLocals/Parameters)
- Enforced FOUND-07 XSS prevention at lint level: svelte/no-at-html-tags: error in ESLint flat config
- Configured Changesets for coordinated @tablecraft/* package releases with public access

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete v1 source files and create pnpm workspace** - `d472ae0` (chore)
2. **Task 2: Rewrite root package.json as private monorepo root** - `eaccd5e` (chore)
3. **Task 3: Create root TypeScript, ESLint, and Prettier configs** - `65a927b` (chore)

## Files Created/Modified

**Created:**
- `pnpm-workspace.yaml` — Workspace declaration, packages/* and apps/*
- `tsconfig.base.json` — Shared strict TypeScript config (ES2022, NodeNext, all strict checks)
- `eslint.config.js` — ESLint 9 flat config with TypeScript + Svelte support, XSS rule at error level
- `.prettierrc` — Prettier config with prettier-plugin-svelte
- `.changeset/config.json` — Changesets config: public access, linked @tablecraft/* packages
- `packages/core/`, `packages/svelte/`, `packages/react/`, `packages/vue/` — Empty stub directories
- `apps/docs/` — Empty stub directory

**Modified:**
- `package.json` — Complete rewrite: private monorepo root, MIT, engines, workspace scripts, modern devDeps
- `.gitignore` — Updated for monorepo: packages/*/dist, apps/*/build, .svelte-kit patterns

**Deleted:**
- `rollup.config.js`, `src/Tables.svelte`, `src/index.js` — v1 source files
- `dist/` — v1 build output
- `package-lock.json`, `bun.lock` — v1 lock files

## Decisions Made

- ESLint 9 flat config chosen over legacy .eslintrc — v9 is the current standard and required for correct plugin interop
- `svelte/no-at-html-tags` set to `error` (not `warn`) — FOUND-07 XSS must be a hard blocker, not advisory
- `verbatimModuleSyntax: true` in tsconfig — prevents type-only imports from leaking into runtime output
- `NodeNext` module resolution — required for pnpm workspace ESM interop with Node 20 LTS
- Added `@eslint/js`, `globals`, `svelte-eslint-parser` to root devDependencies — required peer packages for eslint.config.js that were missing from the plan's initial dep list but included in Task 3 action note

## Deviations from Plan

None — plan executed exactly as written. The three extra devDependencies (`@eslint/js`, `globals`, `svelte-eslint-parser`) were explicitly specified in the Task 3 action note as additions to make to package.json, so they are part of the plan, not a deviation.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Monorepo workspace structure is complete; Plan 02 can scaffold individual package manifests
- All six v1 defects eliminated at the root level (FOUND-01 through FOUND-10 requirements)
- tsconfig.base.json ready to be extended by each package's local tsconfig.json
- eslint.config.js active at root; XSS rule enforced from this point forward
- Directory stubs (packages/core, packages/svelte, packages/react, packages/vue, apps/docs) exist and ready for Plan 02 package.json scaffolding

---
*Phase: 01-foundation*
*Completed: 2026-03-21*
