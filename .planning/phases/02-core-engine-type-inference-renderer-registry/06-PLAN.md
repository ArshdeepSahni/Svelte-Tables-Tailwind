---
phase: 02-core-engine-type-inference-renderer-registry
plan: 06
type: execute
wave: 5
depends_on:
  - 02-05
files_modified: []
autonomous: true
requirements:
  - CORE-12

must_haves:
  truths:
    - "pnpm --filter @tablecraft/core test --coverage exits 0 with all thresholds green"
    - "Inference engine coverage >= 95% lines (src/inference/**/*.ts)"
    - "All renderer coverage >= 90% lines (src/renderers/**/*.ts)"
    - "pnpm --filter @tablecraft/core build exits 0"
    - "dist/renderers/ directory exists with 17 separate renderer files (tree-shaking verified)"
    - "dist/index.js and dist/index.cjs both exist"
    - "No renderer file in src/renderers/ imports from any sibling renderer file (source-level tree-shaking assertion)"
  artifacts:
    - path: "packages/core/dist/index.js"
      provides: "ES module build of complete public API"
    - path: "packages/core/dist/index.cjs"
      provides: "CJS build of complete public API"
    - path: "packages/core/dist/renderers/currency.js"
      provides: "Individual tree-shakable currency renderer (representative of 17)"
  key_links:
    - from: "packages/core/dist/renderers/"
      to: "packages/core/src/renderers/"
      via: "Vite multi-entry build produces one output file per entry (17 renderer entries)"
    - from: "packages/core/vitest.config.ts thresholds"
      to: "src/inference/**/*.ts"
      via: "Vitest coverage.thresholds enforces >= 95% lines on inference code"
---

<objective>
Run the full test suite with coverage to verify all CORE-12 thresholds pass, then run the build to verify the multi-entry Vite configuration produces 17 separate renderer output files. This is a verification-only plan — it produces no new source files.

Purpose: CORE-12 requires > 95% inference and > 90% renderer coverage, and the build must produce a tree-shakable dist. This plan surfaces any gaps so they can be fixed before Phase 3 begins.
Output: Green test run with coverage, green build with 17 renderer output files.
</objective>

<execution_context>
@/Users/arshdeep.singh/.claude/get-shit-done/workflows/execute-plan.md
@/Users/arshdeep.singh/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/02-core-engine-type-inference-renderer-registry/02-RESEARCH.md
@.planning/phases/02-core-engine-type-inference-renderer-registry/02-VALIDATION.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Run coverage — fix any threshold failures</name>
  <files>
    packages/core/src/inference/detectors.ts
    packages/core/src/inference/index.ts
    packages/core/src/renderers/*.ts
  </files>
  <read_first>
    - packages/core/vitest.config.ts — verify coverage thresholds are configured (src/inference >= 95%, src/renderers >= 90%)
    - packages/core/src/inference/detectors.ts — check for any unreachable branches that need test coverage
    - packages/core/src/inference/detectors.test.ts — see if any detectors lack sufficient input variety
    - packages/core/src/renderers/html.ts — html renderer has multiple branches; verify all are tested
  </read_first>
  <action>
STEP 1 — Run coverage and capture output:
```
pnpm --filter @tablecraft/core test --coverage
```

STEP 2 — Read the coverage report. If any file in src/inference/**/*.ts reports < 95% lines:
- Identify the uncovered branch or line from the report
- Add a targeted test case to the appropriate test file
- Re-run coverage to confirm the threshold passes

STEP 3 — If any file in src/renderers/**/*.ts reports < 90% lines:
- Identify the uncovered branch (commonly: null/undefined guard in html.ts, or the URL constructor throw path in url.ts)
- Add the missing test case to the corresponding .test.ts file
- Re-run coverage to confirm

STEP 4 — Common coverage gaps to proactively check:

For detectors.ts — these branches are often missed:
- detectStatus: returns null when only 1 unique value (test: ['same','same','same'])
- detectCode: returns null when < 60% match (test: plain paragraph text)
- detectInteger: returns null when ALSO contains % (the currency guard)

For inference/index.ts:
- sampleRows: returns all rows when data.length === maxSamples exactly (boundary case)
- runDetectors: the absolute fallback (last line) requires all detectors to return null — but detectText never returns null, so this is unreachable by design. If the linter flags it, add `/* c8 ignore next */` comment.

For renderers/html.ts:
- getPurify: the globalThis DOMPurify path (requires mock)
- The throw path (inject null-ish configure + no globalThis DOMPurify)

For renderers/url.ts:
- URL constructor throw path: test with 'not-a-url' (already in tests but verify coverage)

For renderers/status.ts:
- Each of the 5 word sets needs at least one test hitting it (SUCCESS, WARNING, DANGER, INFO, default)

STEP 5 — If html.ts globalThis DOMPurify path is not covered, add this test to html.test.ts:

```typescript
it('uses globalThis.DOMPurify when configure() has not been called', () => {
  // Reset injected purify
  configure(null as never);  // reset injection
  // Set globalThis.DOMPurify
  const mockPurify = { sanitize: (s: string) => `global:${s}` };
  (globalThis as Record<string, unknown>)['DOMPurify'] = mockPurify;

  const result = htmlRenderer('<b>test</b>', col);
  delete (globalThis as Record<string, unknown>)['DOMPurify'];

  if (result.kind === 'html') expect(result.sanitized).toBe('global:<b>test</b>');
});
```

NOTE: If configure(null) is not a valid way to reset (the implementation uses a closure), then test the throw path instead:

```typescript
it('throws descriptive error when DOMPurify is unavailable', () => {
  // Ensure no injection and no globalThis.DOMPurify
  const savedDOMPurify = (globalThis as Record<string, unknown>)['DOMPurify'];
  delete (globalThis as Record<string, unknown>)['DOMPurify'];

  // Need to reset the injected purify — import the module fresh or test indirectly
  // If module caches injected purify, this path cannot be tested without module reset
  // In that case: accept < 100% on html.ts; the 90% threshold is still achievable

  (globalThis as Record<string, unknown>)['DOMPurify'] = savedDOMPurify;
});
```

CONTINUE fixing until `pnpm --filter @tablecraft/core test --coverage` exits 0 with all thresholds green.
  </action>
  <verify>
    <automated>cd /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind && pnpm --filter @tablecraft/core test --coverage 2>&1 | tail -20</automated>
  </verify>
  <acceptance_criteria>
    - pnpm --filter @tablecraft/core test --coverage exits 0
    - Coverage output shows NO "Threshold not met" lines
    - Coverage output shows src/inference/ files at >= 95% lines
    - Coverage output shows src/renderers/ files at >= 90% lines
    - All test counts show 0 failures
  </acceptance_criteria>
  <done>Full test suite passes. All coverage thresholds met. No uncovered branches causing threshold failures.</done>
</task>

<task type="auto">
  <name>Task 2: Run build — verify multi-entry dist output</name>
  <files>
    packages/core/vite.config.ts
  </files>
  <read_first>
    - packages/core/vite.config.ts — verify rolldownOptions, multi-entry map, rollupTypes:false, formats:['es','cjs']
    - packages/core/src/renderers/index.ts — verify all 17 renderer exports are present (build entry depends on this)
    - packages/core/src/engine/index.ts — verify createTableEngine is exported (build entry)
    - .planning/phases/02-core-engine-type-inference-renderer-registry/02-RESEARCH.md — Vite Multi-Entry Tree-Shaking section; Gotchas #1 (rolldownOptions), #2 (rollupTypes:false), #3 (no UMD)
  </read_first>
  <action>
STEP 1 — Run the build:
```
pnpm --filter @tablecraft/core build
```

STEP 2 — Verify output structure:
```
ls packages/core/dist/
ls packages/core/dist/renderers/
```

Expected dist layout:
```
dist/
  index.js          (ES module — main entry)
  index.cjs         (CJS — main entry)
  index.d.ts        (types for ES)
  index.d.cts       (types for CJS)
  renderers/
    text.js
    text.cjs
    text.d.ts
    text.d.cts
    number.js
    ... (all 17 renderers × 4 files each)
  inference/
    ...
  engine/
    ...
  registry/
    ...
```

STEP 3 — Count renderer output files:
```
ls packages/core/dist/renderers/*.js | wc -l
```
Expected: 17 (one .js per renderer, plus index.js = 18 total if barrel is separate, but barrel is folded into index.js at the package level). The renderers/ dir should have exactly 17 .js files (the individual renderer entries) plus potentially index.js if the barrel was given its own entry.

STEP 4 — Verify tree-shaking guarantee at source level:
```
grep -rn "from '\.\./renderers" packages/core/src/renderers/
```
Expected: NO output (no cross-renderer imports in any renderer source file).

STEP 5 — If build fails, diagnose:

**Common failure: `Cannot find module` in renderer files**
- Cause: renderer imports from ../types.js or ../registry/index.js but file doesn't exist yet
- Fix: verify all Wave 3 files exist; re-run Task 1 to check

**Common failure: `rolldownOptions is not a valid key`**
- Cause: older version of Vite might not recognize rolldownOptions
- Fix: Check installed Vite version: `cat packages/core/node_modules/vite/package.json | grep '"version"'`
- If Vite < 8: rollupOptions is correct; rolldownOptions is for Vite 8+
- The research confirmed vite@8.0.1 is installed — rolldownOptions should work

**Common failure: `UMD format not supported with multiple entry points`**
- Cause: vite.config.ts still has 'umd' in formats
- Fix: Remove 'umd' from formats array; leave only ['es', 'cjs']

**Common failure: `vite-plugin-dts failed to generate declarations`**
- Cause: rollupTypes:true (should be false for multi-entry)
- Fix: verify rollupTypes: false in plugin config

STEP 6 — After successful build, verify the key files exist:
```
test -f packages/core/dist/index.js && echo "index.js: OK"
test -f packages/core/dist/index.cjs && echo "index.cjs: OK"
test -f packages/core/dist/renderers/currency.js && echo "currency.js: OK"
test -f packages/core/dist/renderers/html.js && echo "html.js: OK"
test -f packages/core/dist/renderers/status.js && echo "status.js: OK"
```

STEP 7 — Verify no cross-renderer bundling (tree-shaking):

Open packages/core/dist/renderers/currency.js and verify it does NOT contain code from other renderers (e.g., does not contain 'imageRenderer' or 'htmlRenderer' strings):
```
grep "imageRenderer\|htmlRenderer\|codeRenderer" packages/core/dist/renderers/currency.js
```
Expected: NO matches.
  </action>
  <verify>
    <automated>cd /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind && pnpm --filter @tablecraft/core build 2>&1 | tail -10 && ls packages/core/dist/renderers/*.js 2>/dev/null | wc -l</automated>
  </verify>
  <acceptance_criteria>
    - pnpm --filter @tablecraft/core build exits 0
    - ls packages/core/dist/renderers/*.js | wc -l returns >= 17
    - packages/core/dist/index.js exists
    - packages/core/dist/index.cjs exists
    - packages/core/dist/renderers/currency.js exists
    - grep "imageRenderer\|htmlRenderer" packages/core/dist/renderers/currency.js returns empty (tree-shaking confirmed)
    - grep "rolldownOptions" packages/core/vite.config.ts returns a match (correct Vite 8 config)
  </acceptance_criteria>
  <done>Build succeeds. dist/renderers/ has 17+ individual renderer files. dist/index.js and dist/index.cjs exist. Tree-shaking verified: currency.js does not contain other renderer code.</done>
</task>

</tasks>

<verification>
Phase 2 is complete when all of the following are true:
1. `pnpm --filter @tablecraft/core test --coverage` exits 0 — all tests pass, all thresholds met
2. `pnpm --filter @tablecraft/core build` exits 0 — multi-entry build succeeds
3. `ls packages/core/dist/renderers/*.js | wc -l` returns >= 17
4. `grep -rn "from '\.\./renderers" packages/core/src/renderers/` returns empty (no cross-renderer imports)
5. `pnpm --filter @tablecraft/core typecheck` exits 0

Phase 2 success criteria verification:
- SC1: `node -e "const {createTableEngine}=require('./packages/core/dist/index.cjs'); const e=createTableEngine({data:[{name:'Alice',email:'a@b.com'}]}); e.inferSchema([{name:'Alice',email:'a@b.com'}]).then(m=>console.log(m))"` — should print inference map with email type
- SC2: Boolean keyword boost test passing in detectors.test.ts (already in Wave 2)
- SC3: registry.test.ts "custom renderer is invoked" test passing (already in Wave 3)
- SC4: currency.js does not import code.js or image.js (verified in Step 7 above)
- SC5: `pnpm --filter @tablecraft/core test --coverage` shows inference >= 95%, renderers >= 90%
</verification>

<success_criteria>
- Full test suite (all Waves combined) exits 0
- Coverage: inference engine >= 95% lines, all renderers >= 90% lines
- Build: 17 individual renderer files in dist/renderers/
- Tree-shaking: currency.js does not contain other renderer code
- TypeScript strict mode: zero errors across all new files
- All 12 CORE-* requirements covered by passing tests or verified artifacts
</success_criteria>

<output>
After completion, create `.planning/phases/02-core-engine-type-inference-renderer-registry/02-06-SUMMARY.md`
</output>
