---
phase: 01-foundation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - pnpm-workspace.yaml
  - package.json
  - tsconfig.base.json
  - eslint.config.js
  - .prettierrc
  - .gitignore
  - LICENSE
  - .changeset/config.json
autonomous: true
requirements:
  - FOUND-01
  - FOUND-06
  - FOUND-07
  - FOUND-08
  - FOUND-09
  - FOUND-10

must_haves:
  truths:
    - 'pnpm-workspace.yaml exists and declares packages/* and apps/*'
    - 'Root package.json is private, has no main/module fields, engines.node is set, all old devDependencies are gone'
    - "LICENSE file contains the string 'MIT License'"
    - "package.json license field is 'MIT'"
    - 'No rollup.config.js file exists in the repo root'
    - 'No src/Tables.svelte, src/index.js, or dist/ directory exists'
    - '.changeset/config.json exists with access: public'
    - 'tsconfig.base.json exists with strict: true and target: ES2022'
    - '.prettierrc exists with prettier-plugin-svelte listed in plugins'
    - 'eslint.config.js exists at repo root'
  artifacts:
    - path: 'pnpm-workspace.yaml'
      provides: 'Workspace package discovery'
      contains: 'packages/*'
    - path: 'package.json'
      provides: 'Monorepo root manifest — private, workspace scripts'
      contains: '"private": true'
    - path: 'tsconfig.base.json'
      provides: 'Shared TypeScript strict config'
      contains: '"strict": true'
    - path: '.changeset/config.json'
      provides: 'Changesets release config'
      contains: '"access": "public"'
    - path: 'LICENSE'
      provides: 'MIT license text'
      contains: 'MIT License'
  key_links:
    - from: 'package.json'
      to: 'pnpm-workspace.yaml'
      via: 'pnpm reads workspace config automatically'
      pattern: 'packages/\*'
    - from: 'tsconfig.base.json'
      to: 'packages/*/tsconfig.json'
      via: 'extends field in each package tsconfig'
      pattern: '"extends".*tsconfig.base'
---

<objective>
Transform the flat v1 repository into a pnpm monorepo skeleton and eliminate all six v1 critical defects at the root level.

Purpose: Wave 1 creates the repository structure that all subsequent plans depend on. Without pnpm-workspace.yaml, the monorepo does not exist. Without removing rollup.config.js and src/, Wave 2 package scaffolds would conflict with the old entry points. The MIT license fix and removal of old source files are structural prerequisites, not cleanup — they change what the repository IS.

Output:

- pnpm-workspace.yaml (workspace declaration)
- Root package.json (private monorepo root, no old rollup/svelte deps)
- tsconfig.base.json (strict TypeScript shared config)
- eslint.config.js (ESLint 9 flat config)
- .prettierrc (prettier + svelte plugin)
- .gitignore (monorepo-aware)
- LICENSE (corrected to MIT)
- .changeset/config.json (changesets config)
- DELETED: src/Tables.svelte, src/index.js (if exists), rollup.config.js, dist/, package-lock.json
  </objective>

<execution_context>
@/Users/arshdeep.singh/.claude/get-shit-done/workflows/execute-plan.md
@/Users/arshdeep.singh/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/01-foundation/01-CONTEXT.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Delete v1 source files and create pnpm workspace</name>

<read_first> - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/package.json (current v1 root manifest — read to confirm what exists before deleting) - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/rollup.config.js (confirm it exists before deletion) - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/.planning/phases/01-foundation/01-CONTEXT.md (locked decisions on workspace structure)
</read_first>

  <files>
    pnpm-workspace.yaml
    .gitignore
    [DELETE] rollup.config.js
    [DELETE] src/Tables.svelte
    [DELETE] src/index.js (if exists)
    [DELETE] dist/ (if exists)
    [DELETE] package-lock.json (if exists)
    [DELETE] bun.lock (if exists)
  </files>

  <action>
Step 1 — Delete v1 artifacts. Run these commands exactly:

```bash
rm -f rollup.config.js
rm -rf src/
rm -rf dist/
rm -f package-lock.json
rm -f bun.lock
```

Step 2 — Create pnpm-workspace.yaml at repo root with EXACTLY this content:

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

Step 3 — Overwrite .gitignore with EXACTLY this content (replaces existing one-liner):

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
.svelte-kit/
build/
packages/*/dist/
packages/*/.svelte-kit/
apps/*/build/
apps/*/.svelte-kit/

# TypeScript
*.tsbuildinfo
packages/*/tsconfig.tsbuildinfo

# Test outputs
coverage/
playwright-report/
test-results/

# Editor
.DS_Store
.vscode/settings.json
*.swp

# Env
.env
.env.local
.env.*.local

# Changeset
.changeset/*.md
!.changeset/config.json
```

Step 4 — Create directory stubs for packages and apps (empty dirs):

```bash
mkdir -p packages/core
mkdir -p packages/svelte
mkdir -p packages/react
mkdir -p packages/vue
mkdir -p apps/docs
mkdir -p .changeset
```

  </action>

  <verify>
    <automated>test -f pnpm-workspace.yaml && grep -q "packages/\*" pnpm-workspace.yaml && test ! -f rollup.config.js && test ! -d src/ && echo "PASS" || echo "FAIL"</automated>
  </verify>

<acceptance_criteria> - `test -f pnpm-workspace.yaml` exits 0 - `grep "packages/\*" pnpm-workspace.yaml` finds the line - `grep "apps/\*" pnpm-workspace.yaml` finds the line - `test ! -f rollup.config.js` exits 0 (file is gone) - `test ! -d src/` exits 0 (directory is gone) - `test ! -f package-lock.json` exits 0 - `test -d packages/core` exits 0 - `test -d packages/svelte` exits 0 - `test -d packages/react` exits 0 - `test -d packages/vue` exits 0 - `test -d apps/docs` exits 0 - `test -d .changeset` exits 0
</acceptance_criteria>

<done>pnpm-workspace.yaml exists declaring packages/_ and apps/_; all v1 source files and build artifacts are gone; package directories exist as empty stubs</done>
</task>

<task type="auto">
  <name>Task 2: Rewrite root package.json as private monorepo root</name>

<read_first> - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/package.json (current v1 — being completely replaced) - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/.planning/phases/01-foundation/01-CONTEXT.md (decisions on engines, package names, tooling) - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/.planning/phases/01-foundation/01-RESEARCH.md (exact versions for all devDependencies)
</read_first>

  <files>
    package.json
    LICENSE
    .changeset/config.json
  </files>

  <action>
Step 1 — Overwrite package.json with EXACTLY this content:

```json
{
  "name": "tablecraft-monorepo",
  "version": "0.0.0",
  "private": true,
  "description": "pnpm monorepo for @tablecraft/* packages",
  "license": "MIT",
  "author": "Arshdeep Singh <arsh22sahni@gmail.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/ArshdeepSahni/Svelte-Tables-Tailwind"
  },
  "engines": {
    "node": ">=20.19.0 || >=22.12.0",
    "pnpm": ">=9.0.0"
  },
  "packageManager": "pnpm@9.15.4",
  "scripts": {
    "build": "pnpm -r build",
    "dev": "pnpm -r --parallel dev",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "pnpm -r typecheck",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "pnpm -r build && changeset publish",
    "clean": "pnpm -r --parallel exec rm -rf dist .svelte-kit build"
  },
  "devDependencies": {
    "@changesets/cli": "^2.30.0",
    "@sveltejs/vite-plugin-svelte": "^6.0.0",
    "@testing-library/svelte": "^5.2.7",
    "@typescript-eslint/eslint-plugin": "^8.31.0",
    "@typescript-eslint/parser": "^8.31.0",
    "eslint": "^9.24.0",
    "eslint-plugin-svelte": "^2.46.1",
    "playwright": "^1.50.1",
    "prettier": "^3.5.3",
    "prettier-plugin-svelte": "^3.4.0",
    "svelte": "^5.0.0",
    "typescript": "^5.8.3",
    "vitest": "^4.1.0"
  },
  "pnpm": {
    "overrides": {}
  }
}
```

Step 2 — Overwrite LICENSE file with EXACTLY this content (MIT, not ISC):

```
MIT License

Copyright (c) 2021 Arshdeep Singh

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Step 3 — Create .changeset/config.json with EXACTLY this content:

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.5/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [["@tablecraft/core", "@tablecraft/svelte", "@tablecraft/react", "@tablecraft/vue"]],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

  </action>

  <verify>
    <automated>node -e "const p=require('./package.json'); if(p.private!==true||p.license!=='MIT'||!p.engines||!p.scripts.build) process.exit(1); console.log('PASS')"</automated>
  </verify>

<acceptance_criteria> - `node -e "require('./package.json').private" | grep -q true` exits 0 - `grep '"license": "MIT"' package.json` finds the line - `grep '"private": true' package.json` finds the line - `grep '"node": ">=20.19.0' package.json` finds the line - `grep '"build": "pnpm -r build"' package.json` finds the line - `grep '"test": "vitest run"' package.json` finds the line - `grep '"@changesets/cli"' package.json` finds the line - `grep '"vitest"' package.json` finds the line - `grep 'MIT License' LICENSE` finds the line (not ISC) - `grep -v 'ISC' LICENSE` — no ISC in license file - `grep '"access": "public"' .changeset/config.json` finds the line - `grep '@tablecraft/core' .changeset/config.json` finds the line - `test ! -f package-lock.json` exits 0 - `grep 'rollup' package.json | wc -l` outputs 0 - `grep '"main"' package.json | wc -l` outputs 0 (no entry point — this is root)
</acceptance_criteria>

<done>Root package.json is private monorepo root with MIT license, correct engines, workspace scripts, and no v1 rollup/svelte devDependencies. LICENSE reads "MIT License". .changeset/config.json exists with public access and linked packages.</done>
</task>

<task type="auto">
  <name>Task 3: Create root TypeScript, ESLint, and Prettier configs</name>

<read_first> - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/.planning/phases/01-foundation/01-CONTEXT.md (TypeScript strict mode decision, ESLint/Prettier decisions) - /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind/.planning/phases/01-foundation/01-RESEARCH.md (exact eslint-plugin-svelte and typescript-eslint versions)
</read_first>

  <files>
    tsconfig.base.json
    eslint.config.js
    .prettierrc
  </files>

  <action>
Step 1 — Create tsconfig.base.json at repo root with EXACTLY this content:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "useDefineForClassFields": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "verbatimModuleSyntax": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "exclude": ["node_modules", "dist", "build", ".svelte-kit"]
}
```

Step 2 — Create eslint.config.js at repo root (ESLint 9 flat config) with EXACTLY this content:

```js
import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Base JS recommended
  js.configs.recommended,

  // TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': ts,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      ...ts.configs['recommended'].rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },

  // Svelte files
  {
    files: ['**/*.svelte'],
    plugins: { svelte },
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser,
      },
    },
    rules: {
      ...svelte.configs.recommended.rules,
      'svelte/no-at-html-tags': 'error',
    },
  },

  // Global ignores
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/.svelte-kit/**',
      '**/node_modules/**',
      'eslint.config.js',
    ],
  },
];
```

Note: eslint.config.js requires these packages to be installed at root: `@eslint/js`, `globals`, `svelte-eslint-parser`. Add them to root package.json devDependencies if not already present. The packages `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint-plugin-svelte`, and `eslint` are already declared. Add to devDependencies:

```json
"@eslint/js": "^9.24.0",
"globals": "^16.0.0",
"svelte-eslint-parser": "^0.43.0"
```

Step 3 — Create .prettierrc at repo root with EXACTLY this content:

```json
{
  "useTabs": false,
  "tabWidth": 2,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "semi": true,
  "plugins": ["prettier-plugin-svelte"],
  "overrides": [
    {
      "files": "*.svelte",
      "options": {
        "parser": "svelte"
      }
    }
  ]
}
```

  </action>

  <verify>
    <automated>node -e "const t=require('./tsconfig.base.json'); if(!t.compilerOptions.strict||t.compilerOptions.target!=='ES2022') process.exit(1); console.log('PASS')" && test -f eslint.config.js && test -f .prettierrc && echo "ALL PASS"</automated>
  </verify>

<acceptance_criteria> - `test -f tsconfig.base.json` exits 0 - `grep '"strict": true' tsconfig.base.json` finds the line - `grep '"target": "ES2022"' tsconfig.base.json` finds the line - `grep '"module": "NodeNext"' tsconfig.base.json` finds the line - `grep '"noUnusedLocals": true' tsconfig.base.json` finds the line - `test -f eslint.config.js` exits 0 - `grep 'svelte/no-at-html-tags' eslint.config.js` finds the line (anti-XSS rule) - `grep "'error'" eslint.config.js` finds lines - `test -f .prettierrc` exits 0 - `grep 'prettier-plugin-svelte' .prettierrc` finds the line - `grep '"singleQuote": true' .prettierrc` finds the line
</acceptance_criteria>

<done>tsconfig.base.json exists with strict mode + ES2022 + NodeNext. eslint.config.js exists as ESLint 9 flat config with svelte/no-at-html-tags: error. .prettierrc exists with prettier-plugin-svelte. ESLint will reject any {@html} usage, enforcing FOUND-07 at the linter level.</done>
</task>

</tasks>

<verification>
Run these checks after all three tasks complete:

```bash
# Workspace structure
test -f pnpm-workspace.yaml && echo "workspace: OK"
grep -q "packages/\*" pnpm-workspace.yaml && echo "workspace packages/*: OK"
test ! -f rollup.config.js && echo "rollup removed: OK"
test ! -d src/ && echo "src removed: OK"

# License
grep -q "MIT License" LICENSE && echo "LICENSE MIT: OK"
grep -q '"license": "MIT"' package.json && echo "package.json MIT: OK"

# Root package
grep -q '"private": true' package.json && echo "private: OK"
grep -q '"node": ">=20.19.0' package.json && echo "engines: OK"
grep -q 'rollup' package.json && echo "FAIL: rollup still in package.json" || echo "rollup absent: OK"

# TypeScript
grep -q '"strict": true' tsconfig.base.json && echo "strict: OK"

# Changesets
grep -q '"access": "public"' .changeset/config.json && echo "changeset: OK"

# FOUND-07 enforcement
grep -q 'svelte/no-at-html-tags' eslint.config.js && echo "anti-XSS rule: OK"
```

</verification>

<success_criteria>

1. `test -f pnpm-workspace.yaml` exits 0 and file contains `packages/*` and `apps/*`
2. `test ! -f rollup.config.js` exits 0 and `test ! -d src/` exits 0 — v1 source gone
3. `grep '"license": "MIT"' package.json` and `grep 'MIT License' LICENSE` both match — FOUND-06 satisfied
4. `grep '"private": true' package.json` and `grep '"node": ">=20.19.0' package.json` — FOUND-10 satisfied
5. `grep '"strict": true' tsconfig.base.json` and `grep '"target": "ES2022"' tsconfig.base.json` — FOUND-03 base satisfied
6. `grep 'svelte/no-at-html-tags.*error' eslint.config.js` — FOUND-07 enforced at lint level
7. `grep '"access": "public"' .changeset/config.json` — FOUND-10 changesets configured
   </success_criteria>

<output>
After completion, create `.planning/phases/01-foundation/01-01-SUMMARY.md` with:
- What was created/deleted
- Exact file list with purposes
- Key decisions made (engine range, changeset linked packages)
- Verification commands that passed
</output>
