# Phase 1: Foundation - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning
**Mode:** Auto (all decisions selected by Claude with recommended defaults)

<domain>
## Phase Boundary

Monorepo scaffold, dependency upgrades (all packages to latest stable), toolchain modernization (Svelte 3 + Rollup 2 → Svelte 5 + Vite 5), and elimination of all six critical v1 defects. This phase delivers a buildable, testable, secure foundation. Zero new features ship in Phase 1 — it exists so Phase 2 can start on solid ground.

**Fixed phase scope (from ROADMAP.md):** FOUND-01 through FOUND-12

</domain>

<decisions>
## Implementation Decisions

### Package Naming Strategy

- npm scope: `@tablecraft` (verify availability before publish — `@tablecraft/svelte`, `@tablecraft/core`, `@tablecraft/react`, `@tablecraft/vue`)
- The existing `svelte-tables-tailwind` name is retired; a v1 deprecation patch pointing to `@tablecraft/svelte` ships in Phase 7
- All new code lives under `@tablecraft/*` — do not create packages under the old name

### Monorepo Structure

- Tool: pnpm workspaces only (no Turborepo, no Nx — 4 packages don't justify it)
- Root `package.json` with `"workspaces": ["packages/*", "apps/*"]`
- Package directories: `packages/core`, `packages/svelte`, `packages/react`, `packages/vue`
- Apps directory: `apps/docs` (SvelteKit docs site — scaffold stub only in Phase 1, implemented in Phase 7)
- Root-level tooling: `tsconfig.base.json`, `.eslintrc.cjs`, `.prettierrc`, Vitest workspace config, `changeset` config

### Dependency Upgrade Approach

- Upgrade ALL dependencies to latest stable — no exceptions, no held-back versions
- Svelte: 3.37.0 → 5.x (latest stable)
- Rollup: 2.45.2 → remove (replaced by Vite 5 + `@sveltejs/package`)
- `rollup-plugin-*`: all removed
- New build stack: Vite 5, `@sveltejs/package` 2.x, `vite-plugin-dts`, tsup 8.x
- TypeScript 5.x (strict mode)
- Testing: Vitest 2.x, `@testing-library/svelte` (latest Svelte 5 compatible), Playwright 1.x
- Node minimum: 20 LTS (declared in `engines` field of all packages)
- Changeset tooling: `@changesets/cli` latest

### Codebase Migration Approach

- Strategy: **Fresh Svelte 5 scaffold** — do not attempt incremental Svelte 3→5 migration
- Rationale: v1 uses `window.onload`, `$:` reactivity, `on:click`, `export let` — all have breaking equivalents in Svelte 5
- Reference v1 `src/Tables.svelte` only for the renderer logic (the 14 type mappings in `returndatatype()`) — this logic will be reimplemented as individual typed renderer modules in Phase 2
- The v1 `colname`/`rowdata` API is documented but NOT reimplemented in Phase 1 (that's Phase 2 scope)
- Phase 1 delivers: monorepo structure, build pipeline, TypeScript types skeleton, test infrastructure

### v1 Critical Defect Elimination

All six blocking defects must be GONE before Phase 1 closes:

1. **XSS via `{@html}`** — No `{@html}` with string-concatenated values anywhere in any Phase 1 source file. All cell rendering in Phase 1 uses safe text bindings. The `html` renderer type (with opt-in sanitization) is a Phase 2 concern.
2. **Tailwind CDN injection** — No `<svelte:head>` or `<link>` to unpkg.com/tailwindcss CDN in any component. Replace with CSS custom property token stubs (`--tc-*`) as placeholder design system foundation.
3. **Runtime type-switcher dropdown** — No `<select>` in column headers in any Phase 1 code. The column type-switcher is removed entirely. If needed for debugging, it will be a `devMode` prop behind a flag in a future phase.
4. **`colname` object-key uniqueness bug** — The v2 column definition type uses arrays, not objects with type keys. Define `ColumnDefinition` TypeScript type in Phase 1 (even if no implementation yet): `{ key: string; type?: ColumnType; label?: string }[]`.
5. **ISC/MIT license mismatch** — `package.json` `license` field and `LICENSE` file must both read `MIT`.
6. **Svelte 3 + Rollup 2 toolchain** — Completely replaced by Vite 5 + `@sveltejs/package`. No Rollup config files remain.

### TypeScript Foundation

- TypeScript strict mode across all packages
- Define core types in `packages/core/src/types.ts` (even before implementation):
  - `ColumnType` — union of all 17 Tier 1 renderer types
  - `ColumnDefinition<TRow>` — full column descriptor interface
  - `TableConfig<TRow>` — top-level engine config interface
  - `InferenceResult` — type inference output shape
- `defineColumns<TRow>()` helper function stub (implementation in Phase 2)
- All package `exports` maps include `.d.ts` entries

### Build Pipeline per Package

- `@tablecraft/core` — Vite 5 library mode + `vite-plugin-dts`; outputs ESM + CJS + UMD
- `@tablecraft/svelte` — `@sveltejs/package` 2.x exclusively; do not use Vite directly for this package
- `@tablecraft/react` — tsup 8.x; outputs ESM + CJS
- `@tablecraft/vue` — tsup 8.x; outputs ESM + CJS
- All packages: bundle size verification step in CI (Phase 1 target: `@tablecraft/core` stub < 5KB; `@tablecraft/svelte` stub < 10KB — real sizes measured in Phase 3/4)

### Test Infrastructure

- Vitest 2.x configured as workspace (single `pnpm test` runs all packages)
- `@testing-library/svelte` for Svelte component tests
- Playwright 1.x configured for E2E and Web Components tests (browsers: Chromium, Firefox, WebKit)
- `vitest-axe` installed for accessibility assertions (used in Phase 3)
- Phase 1 test goal: build passes, test runner executes with 0 failures (no coverage requirements yet — that's Phase 2)

### Changesets + Release Config

- `@changesets/cli` configured at monorepo root
- `.changeset/config.json` with `"access": "public"`, linked packages for coordinated releases
- GitHub Actions workflow stub for `changeset publish` (implementation in Phase 7)

### Claude's Discretion

- Exact `tsconfig.base.json` compiler options (TypeScript handles best practices)
- ESLint rule selection (use recommended Svelte 5 + TypeScript presets)
- Prettier configuration details
- Exact pnpm workspace protocol syntax (`"workspace:*"` for cross-package deps)
- `.gitignore` updates for monorepo (node_modules, dist, .svelte-kit, etc.)
- Package `description`, `keywords`, `repository` fields in each `package.json`

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation

- `.planning/PROJECT.md` — Vision, constraints, core value, key decisions
- `.planning/REQUIREMENTS.md` — FOUND-01 through FOUND-12 (Phase 1 scope); full context on v2 goals
- `.planning/ROADMAP.md` — Phase 1 success criteria (5 observable outcomes to verify against)

### Research Findings

- `.planning/research/STACK.md` — Full technology stack decisions with rationale; monorepo structure; build tool per package; CSS strategy; what NOT to use
- `.planning/research/PITFALLS.md` — Phase 1 non-negotiable checklist (see "Phase 1 Non-Negotiable" section); Svelte 3→5 migration risks; Rollup→Vite migration
- `.planning/research/SUMMARY.md` — Executive summary; stack decisions table; critical pitfalls Phase 1 must resolve

### Existing Codebase (for reference during migration)

- `src/Tables.svelte` — v1 source; renderer logic in `returndatatype()` (lines 15–122) is the only thing worth preserving (as reference, not copy-paste)
- `package.json` — v1 dependency list; all packages being upgraded or replaced
- `rollup.config.js` — v1 build config; being replaced entirely; do not extend

No external specs or ADRs exist beyond project planning docs — all requirements captured in decisions above.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `src/Tables.svelte` `returndatatype()` function (lines 15–122): Contains the renderer type mapping logic for 14 types. Use as a reference to understand what each renderer should produce — do NOT copy the `{@html}` string-concatenation pattern. Reimplemented as individual typed modules in Phase 2.
- `package.json` dependency list: Reference for what OLD packages are being replaced. Each old package maps to a new equivalent (documented in STACK.md).

### Established Patterns

- **None to carry forward** — The v1 codebase patterns (Svelte 3 reactivity, Rollup config, CDN Tailwind, object-key column API) are all being replaced. Phase 1 establishes the new patterns from scratch.
- The only pattern worth preserving: dual ESM + UMD output (v1 did this right; v2 continues it via Vite library mode for `@tablecraft/core`).

### Integration Points

- `src/index.js` → replaced by `packages/svelte/src/index.ts` (new entry point)
- `rollup.config.js` → replaced by `packages/*/vite.config.ts` + `@sveltejs/package` config
- `package.json` root → becomes monorepo root `package.json` (workspace config); individual package metadata moves to `packages/*/package.json`
- `.gitignore` → update for monorepo: add `packages/*/dist`, `packages/*/.svelte-kit`, `apps/*/build`

</code_context>

<specifics>
## Specific Ideas

- Fresh scaffold strategy (not incremental migration) — this is the explicit architectural decision for Svelte 3→5
- The renderer logic reference in `returndatatype()` is the only intellectual property being carried forward; everything else is rewritten
- The `@tablecraft` npm scope must be verified available before publishing (Phase 7 concern, but register early)
- Phase 1 is purely infrastructure — no user-visible table functionality ships; if you run the build output, it produces empty/stub packages

</specifics>

<deferred>
## Deferred Ideas

- `@tablecraft/solid` and `@tablecraft/angular` wrappers — noted for v3 backlog
- CDN-first vanilla JS UMD example — Phase 7 or beyond
- GitHub Actions full CI pipeline — stub in Phase 1, complete in Phase 7
- npm scope registration — do it during Phase 1 setup but publish happens in Phase 7

</deferred>

---

_Phase: 01-foundation_
_Context gathered: 2026-03-20_
