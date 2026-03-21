---
phase: 01-foundation
plan: 03
type: execute
wave: 3
depends_on:
  - 01-PLAN
  - 02-PLAN
files_modified:
  - packages/core/dist/
  - packages/svelte/dist/
  - packages/react/dist/
  - packages/vue/dist/
  - package.json
autonomous: true
requirements:
  - FOUND-02
  - FOUND-03
  - FOUND-05
  - FOUND-10

must_haves:
  truths:
    - 'pnpm install succeeds with zero errors and zero peer dependency warnings that block the build'
    - 'pnpm --filter @tablecraft/core build exits 0 and produces packages/core/dist/index.js, index.cjs, index.umd.js, index.d.ts'
    - 'pnpm --filter @tablecraft/svelte build exits 0 and produces packages/svelte/dist/index.js'
    - 'pnpm --filter @tablecraft/react build exits 0 and produces packages/react/dist/index.js and index.cjs'
    - 'pnpm --filter @tablecraft/vue build exits 0 and produces packages/vue/dist/index.js and index.cjs'
    - 'pnpm -r typecheck exits 0 with zero TypeScript errors'
    - 'pnpm -r build exits 0 (all packages in one command)'
  artifacts:
    - path: 'packages/core/dist/index.js'
      provides: 'ESM build of @tablecraft/core'
    - path: 'packages/core/dist/index.cjs'
      provides: 'CJS build of @tablecraft/core'
    - path: 'packages/core/dist/index.umd.js'
      provides: 'UMD build of @tablecraft/core'
    - path: 'packages/core/dist/index.d.ts'
      provides: 'TypeScript declarations for @tablecraft/core'
    - path: 'packages/svelte/dist/index.js'
      provides: 'ESM build of @tablecraft/svelte'
    - path: 'packages/react/dist/index.js'
      provides: 'ESM build of @tablecraft/react'
    - path: 'packages/react/dist/index.cjs'
      provides: 'CJS build of @tablecraft/react'
    - path: 'packages/vue/dist/index.js'
      provides: 'ESM build of @tablecraft/vue'
    - path: 'packages/vue/dist/index.cjs'
      provides: 'CJS build of @tablecraft/vue'
  key_links:
    - from: 'packages/svelte/package.json'
      to: 'packages/core/dist/index.js'
      via: 'workspace:* dep resolved by pnpm link'
      pattern: '@tablecraft/core'
    - from: 'packages/core/vite.config.ts'
      to: 'packages/core/dist/'
      via: 'vite build library mode'
      pattern: 'vite build'
---

<objective>
Install all dependencies and verify every package builds to its expected dist/ output with zero errors.

Purpose: Wave 3 is the first time the full tool chain runs end-to-end. If Vite 8 + vite-plugin-dts, @sveltejs/package, and tsup all succeed, the monorepo scaffold is proven correct. TypeScript typecheck across all packages confirms the tsconfig.base.json extends chain and the cross-package type imports (packages/svelte importing from @tablecraft/core) resolve correctly.

Output:

- dist/ directories under each package with the correct format outputs
- Confirmed zero TypeScript errors across all 4 packages
- Any build errors diagnosed and fixed inline (missing peer deps, config corrections, import path issues)

This plan is primarily diagnostic and corrective — it runs the builds, observes failures, and fixes them. The builds must all pass before Wave 4 (testing infrastructure) begins.
</objective>

<execution_context>
@/Users/arshdeep.singh/.claude/get-shit-done/workflows/execute-plan.md
@/Users/arshdeep.singh/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/phases/01-foundation/01-CONTEXT.md
@.planning/phases/01-foundation/01-01-SUMMARY.md
@.planning/phases/01-foundation/01-02-SUMMARY.md

<interfaces>
<!-- Build tools per package (from CONTEXT.md locked decisions): -->
<!-- @tablecraft/core: `vite build` (Vite 8 + vite-plugin-dts) -->
<!-- @tablecraft/svelte: `svelte-package -i src/lib` (@sveltejs/package 2.x) -->
<!-- @tablecraft/react: `tsup` (tsup 8.x) -->
<!-- @tablecraft/vue: `tsup` (tsup 8.x) -->

<!-- Expected dist outputs: -->
<!-- core: dist/index.js (ESM), dist/index.cjs (CJS), dist/index.umd.js (UMD), dist/index.d.ts (types) -->
<!-- svelte: dist/index.js + dist/Table.svelte (svelte-package output) -->
<!-- react: dist/index.js (ESM), dist/index.cjs (CJS), dist/index.d.ts (types) -->
<!-- vue: dist/index.js (ESM), dist/index.cjs (CJS), dist/index.d.ts (types) -->

<!-- Known potential issues to watch for: -->
<!-- 1. vite-plugin-dts + NodeNext moduleResolution: may need "rollupTypes: true" in dts() config -->
<!-- 2. @sveltejs/package requires svelte.config.js at package root (already created) -->
<!-- 3. workspace:* deps: pnpm must link @tablecraft/core before svelte/react/vue build -->
<!-- 4. tsup external array must list all peer deps or build will bundle React/Vue -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install all dependencies and verify workspace linking</name>

<read_first> - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/package.json (root devDependencies — verify all tools are listed) - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/pnpm-workspace.yaml (confirm workspace config before running install) - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/packages/core/package.json (verify @tablecraft/core devDependencies for Vite 8) - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/packages/svelte/package.json (verify svelte devDependencies and workspace:\* dep on core)
</read_first>

  <files>
    package.json
    packages/core/package.json
    packages/svelte/package.json
    packages/react/package.json
    packages/vue/package.json
  </files>

  <action>
Step 1 — Before running install, verify root package.json has the missing ESLint deps that eslint.config.js requires (added in plan 01, task 3). If `@eslint/js` and `globals` and `svelte-eslint-parser` are not in root devDependencies, add them now:

Check root package.json devDependencies. If any of these are missing, add them:

```json
"@eslint/js": "^9.24.0",
"globals": "^16.0.0",
"svelte-eslint-parser": "^0.43.0"
```

Step 2 — Run pnpm install from repo root:

```bash
pnpm install
```

Expected output: All packages install, workspace symlinks created. @tablecraft/core will be linked into packages/svelte/node_modules/@tablecraft/core, packages/react/node_modules/@tablecraft/core, packages/vue/node_modules/@tablecraft/core.

Step 3 — Verify workspace links exist:

```bash
test -d packages/svelte/node_modules/@tablecraft/core && echo "svelte→core link: OK" || echo "svelte→core link: MISSING"
test -d packages/react/node_modules/@tablecraft/core && echo "react→core link: OK" || echo "react→core link: MISSING"
test -d packages/vue/node_modules/@tablecraft/core && echo "vue→core link: OK" || echo "vue→core link: MISSING"
```

If workspace links are missing after install, it means pnpm-workspace.yaml was not found or packages don't have workspace:\* dep correctly. Debug by checking `pnpm ls --filter @tablecraft/core`.

Step 4 — Fix any peer dependency issues that block builds. Common issues to resolve:

Issue A: @sveltejs/vite-plugin-svelte peer warning about Svelte version

- Resolution: Ensure root package.json devDependencies has `"svelte": "^5.0.0"` — it does. Ignore peer warnings for packages that are installed correctly.

Issue B: @testing-library/svelte requires @vitest/browser

- Resolution: This is an optional peer dep for browser mode. For jsdom mode it's not required. Add to root devDependencies if the warning becomes a blocking error:
  `"@vitest/browser": "^4.1.0"`

Issue C: missing peerDependency for react or vue in packages/react or packages/vue

- Resolution: These are devDependencies already (react ^19.0.0, vue ^3.5.0) so they are installed.

Step 5 — Verify pnpm install produced no fatal errors:

```bash
pnpm ls --depth 0 2>&1 | head -20
```

If `pnpm install` fails for any reason, read the exact error message and fix the specific issue:

- Missing package: add to the correct package.json devDependencies
- Incompatible version: check exact version constraint
- Network error: retry once
  </action>

    <verify>
      <automated>cd /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind && pnpm install 2>&1 | tail -5 && test -d node_modules && echo "INSTALL PASS" || echo "INSTALL FAIL"</automated>
    </verify>

  <acceptance_criteria> - `pnpm install` exits 0 - `test -d node_modules` exits 0 - `test -d node_modules/.pnpm` exits 0 - `test -d packages/core/node_modules || test -L packages/core/node_modules` exits 0 (node_modules may be hoisted) - `pnpm ls --filter @tablecraft/core 2>&1 | grep "@tablecraft/core"` finds the package - `pnpm ls --filter @tablecraft/svelte 2>&1 | grep "@tablecraft/svelte"` finds the package - `pnpm ls --filter @tablecraft/react 2>&1 | grep "@tablecraft/react"` finds the package - `pnpm ls --filter @tablecraft/vue 2>&1 | grep "@tablecraft/vue"` finds the package
  </acceptance_criteria>

  <done>pnpm install exits 0. All four packages recognized by pnpm. Workspace symlinks for @tablecraft/core created in consuming packages' node_modules. No fatal peer dependency errors blocking builds.</done>
  </task>

<task type="auto">
  <name>Task 2: Build all packages and fix any compilation errors</name>

<read_first> - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/packages/core/vite.config.ts (verify config before running build) - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/packages/svelte/svelte.config.js (verify @sveltejs/package config before running build) - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/packages/react/tsup.config.ts (verify tsup config before running build) - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/packages/vue/tsup.config.ts (verify tsup config before running build) - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/packages/core/src/index.ts (verify exports before building) - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/packages/svelte/src/lib/Table.svelte (verify no syntax errors before building)
</read_first>

  <files>
    packages/core/dist/
    packages/svelte/dist/
    packages/react/dist/
    packages/vue/dist/
  </files>

  <action>
Build each package individually to isolate errors. Fix any error before moving to the next package.

Step 1 — Build @tablecraft/core:

```bash
pnpm --filter @tablecraft/core build
```

Expected output: Vite 8 compiles src/index.ts, vite-plugin-dts generates type declarations.
Expected files after build:

- packages/core/dist/index.js (ESM)
- packages/core/dist/index.cjs (CJS)
- packages/core/dist/index.umd.js (UMD)
- packages/core/dist/index.d.ts (TypeScript declarations)

Common errors and fixes:

ERROR: "Could not resolve 'path'" in vite.config.ts
FIX: Add `import { resolve } from 'node:path'` (use node: prefix). The vite.config.ts should already use this.

ERROR: "vite-plugin-dts: rollupTypes failed" or "Cannot find module 'typescript'"
FIX: Ensure typescript is in packages/core/devDependencies (it is: "typescript": "^5.8.3"). Run `pnpm install` first.

ERROR: "type: module conflicts with require()"
FIX: The vite.config.ts uses `import` syntax and packages/core/package.json has `"type": "module"` — this is correct for Vite 8.

Verify core build:

```bash
test -f packages/core/dist/index.js && echo "core ESM: OK"
test -f packages/core/dist/index.cjs && echo "core CJS: OK"
test -f packages/core/dist/index.d.ts && echo "core types: OK"
```

Step 2 — Build @tablecraft/svelte:

```bash
pnpm --filter @tablecraft/svelte build
```

The build command is `svelte-package -i src/lib` (from package.json scripts).
@sveltejs/package will:

1. Read svelte.config.js for preprocessor (vitePreprocess)
2. Compile Table.svelte to JavaScript
3. Generate TypeScript declarations
4. Output to packages/svelte/dist/

Expected files after build:

- packages/svelte/dist/index.js (main entry)
- packages/svelte/dist/Table.svelte (processed Svelte component)
- packages/svelte/dist/index.d.ts

Common errors and fixes:

ERROR: "Cannot find module '@tablecraft/core'" inside Table.svelte
FIX: The workspace link must exist. Check `test -L packages/svelte/node_modules/@tablecraft/core`. If missing, run `pnpm install` from root first.

ERROR: "SyntaxError: $props is not defined" or Svelte 3 parser error on $props
FIX: This means @sveltejs/vite-plugin-svelte is using the wrong Svelte version. Ensure svelte 5.x is installed. Check `pnpm --filter @tablecraft/svelte ls svelte` — must show 5.x.

ERROR: "svelte-package: compilerOptions.moduleResolution must be Bundler"
FIX: The packages/svelte/tsconfig.json already has "moduleResolution": "Bundler" — this is the correct override.

Verify svelte build:

```bash
test -f packages/svelte/dist/index.js && echo "svelte ESM: OK"
```

Step 3 — Build @tablecraft/react:

```bash
pnpm --filter @tablecraft/react build
```

The build command is `tsup` (from package.json scripts).

Expected files:

- packages/react/dist/index.js (ESM)
- packages/react/dist/index.cjs (CJS)
- packages/react/dist/index.d.ts

Common errors and fixes:

ERROR: "Cannot find module '@tablecraft/core'"
FIX: Workspace link missing — run `pnpm install` from root.

ERROR: "tsup: external 'react' not found"
FIX: React is in devDependencies so it IS installed — the external flag just prevents bundling it. This is correct behavior.

Verify react build:

```bash
test -f packages/react/dist/index.js && echo "react ESM: OK"
test -f packages/react/dist/index.cjs && echo "react CJS: OK"
```

Step 4 — Build @tablecraft/vue:

```bash
pnpm --filter @tablecraft/vue build
```

Expected files:

- packages/vue/dist/index.js (ESM)
- packages/vue/dist/index.cjs (CJS)
- packages/vue/dist/index.d.ts

Verify vue build:

```bash
test -f packages/vue/dist/index.js && echo "vue ESM: OK"
test -f packages/vue/dist/index.cjs && echo "vue CJS: OK"
```

Step 5 — Run all builds together to confirm pnpm -r build works:

```bash
pnpm -r build
```

This must exit 0. apps/docs build script just echoes a message — that is fine.

Step 6 — Run typecheck across all packages:

```bash
pnpm -r typecheck
```

Expected: Zero TypeScript errors across core, svelte, react, vue.

Common typecheck errors and fixes:

ERROR in packages/svelte: "Type 'unknown' is not assignable to..." in Table.svelte
FIX: The Table.svelte already uses explicit type assertions (row as Record<string, unknown>). If TypeScript still complains, add `// @ts-expect-error` with a comment, or narrow the type explicitly. Do NOT disable strict mode.

ERROR in packages/core: "isolatedModules: cannot export type using 'export { type }'"
FIX: The index.ts uses `export type { ... }` syntax which requires `"verbatimModuleSyntax": true` or `"isolatedModules": true` in tsconfig. Both are set in tsconfig.base.json — this should not occur.

ERROR: "Cannot use 'import.meta' outside a module"
FIX: Ensure packages with `"type": "module"` have correct tsconfig module setting. packages/core uses NodeNext which supports import.meta.

Step 7 — If any typecheck error persists that cannot be fixed without changing the architectural approach, add a `// @ts-ignore` with a detailed comment explaining why, and log it as a known issue in the SUMMARY.
</action>

  <verify>
    <automated>cd /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind && pnpm -r build 2>&1 | tail -10 && test -f packages/core/dist/index.js && test -f packages/react/dist/index.js && test -f packages/vue/dist/index.js && echo "ALL BUILDS PASS" || echo "BUILD FAIL"</automated>
  </verify>

<acceptance_criteria> - `pnpm --filter @tablecraft/core build` exits 0 - `test -f packages/core/dist/index.js` exits 0 - `test -f packages/core/dist/index.cjs` exits 0 - `test -f packages/core/dist/index.umd.js` exits 0 - `test -f packages/core/dist/index.d.ts` exits 0 - `pnpm --filter @tablecraft/svelte build` exits 0 - `test -f packages/svelte/dist/index.js` exits 0 - `pnpm --filter @tablecraft/react build` exits 0 - `test -f packages/react/dist/index.js` exits 0 - `test -f packages/react/dist/index.cjs` exits 0 - `pnpm --filter @tablecraft/vue build` exits 0 - `test -f packages/vue/dist/index.js` exits 0 - `test -f packages/vue/dist/index.cjs` exits 0 - `pnpm -r build` exits 0 (all packages in one command) - `pnpm -r typecheck` exits 0 - `grep 'ColumnType' packages/core/dist/index.d.ts` finds the type in declarations
</acceptance_criteria>

<done>All four packages build successfully. dist/ directories exist with correct format outputs per package. pnpm -r build exits 0. pnpm -r typecheck exits 0 with zero errors. The @tablecraft/core dist/index.d.ts contains ColumnType and other type exports.</done>
</task>

</tasks>

<verification>
After both tasks complete:

```bash
# Full build pipeline
echo "=== BUILD VERIFICATION ==="
pnpm -r build && echo "pnpm -r build: PASS" || echo "pnpm -r build: FAIL"

# Typecheck
echo "=== TYPECHECK VERIFICATION ==="
pnpm -r typecheck && echo "pnpm -r typecheck: PASS" || echo "pnpm -r typecheck: FAIL"

# Dist artifacts
echo "=== DIST ARTIFACTS ==="
test -f packages/core/dist/index.js    && echo "core ESM: OK"   || echo "core ESM: MISSING"
test -f packages/core/dist/index.cjs   && echo "core CJS: OK"   || echo "core CJS: MISSING"
test -f packages/core/dist/index.umd.js && echo "core UMD: OK"  || echo "core UMD: MISSING"
test -f packages/core/dist/index.d.ts  && echo "core DTS: OK"   || echo "core DTS: MISSING"
test -f packages/svelte/dist/index.js  && echo "svelte: OK"     || echo "svelte: MISSING"
test -f packages/react/dist/index.js   && echo "react ESM: OK"  || echo "react ESM: MISSING"
test -f packages/react/dist/index.cjs  && echo "react CJS: OK"  || echo "react CJS: MISSING"
test -f packages/vue/dist/index.js     && echo "vue ESM: OK"    || echo "vue ESM: MISSING"
test -f packages/vue/dist/index.cjs    && echo "vue CJS: OK"    || echo "vue CJS: MISSING"

# Type declarations contain expected exports
grep 'ColumnType' packages/core/dist/index.d.ts && echo "ColumnType in DTS: OK" || echo "ColumnType in DTS: MISSING"
grep 'defineColumns' packages/core/dist/index.d.ts && echo "defineColumns in DTS: OK" || echo "defineColumns in DTS: MISSING"

# FOUND-05: No old build tools remain
grep -r 'rollup-plugin' packages/ | wc -l  # must output 0
test ! -f rollup.config.js && echo "rollup.config.js: GONE" || echo "rollup.config.js: STILL EXISTS"
```

</verification>

<success_criteria>

1. `pnpm install` exits 0 and all workspace symlinks are created — FOUND-05 satisfied (all old deps replaced)
2. `pnpm -r build` exits 0 — all four packages compile, FOUND-02 satisfied
3. `test -f packages/core/dist/index.d.ts` exits 0 and the file contains ColumnType — FOUND-03 TypeScript types built
4. `pnpm -r typecheck` exits 0 — zero TypeScript errors across all packages
5. `grep -r 'rollup-plugin' packages/ | wc -l` outputs 0 — FOUND-05, all Rollup plugins gone
6. `test ! -f rollup.config.js` exits 0 — v1 build config is gone
7. Phase success criterion 1 proven: `pnpm install && pnpm build` succeeds with zero errors
   </success_criteria>

<output>
After completion, create `.planning/phases/01-foundation/01-03-SUMMARY.md` with:
- Build commands that passed (exact pnpm filter commands)
- Any errors encountered and how they were fixed (exact error text → exact fix applied)
- Dist artifact inventory (all files produced per package)
- TypeScript typecheck result (zero errors or known suppressions with reasons)
- Note any version pinning changes made to package.json files during debugging
</output>
