---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                     |
| ---------------------- | --------------------------------------------------------- |
| **Framework**          | Vitest 4.1.0 (workspace mode) + Playwright 1.x            |
| **Config file**        | `vitest.config.ts` at monorepo root (Wave 0 creates this) |
| **Quick run command**  | `pnpm -r typecheck && pnpm test`                          |
| **Full suite command** | `pnpm -r build && pnpm test && pnpm exec playwright test` |
| **Estimated runtime**  | ~30 seconds (build) + ~10 seconds (tests)                 |

---

## Sampling Rate

- **After every task commit:** Run `pnpm -r typecheck && pnpm test`
- **After every plan wave:** Run `pnpm -r build && pnpm test && pnpm exec playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~60 seconds

---

## Per-Task Verification Map

| Task ID | Req      | Test Type | Automated Command                                                    | File Exists | Status     |
| ------- | -------- | --------- | -------------------------------------------------------------------- | ----------- | ---------- |
| 1-01    | FOUND-01 | smoke     | `pnpm install && pnpm -r build`                                      | ❌ Wave 0   | ⬜ pending |
| 1-02    | FOUND-02 | build     | `pnpm --filter @tablecraft/svelte build`                             | ❌ Wave 0   | ⬜ pending |
| 1-03    | FOUND-03 | typecheck | `pnpm -r typecheck`                                                  | ❌ Wave 0   | ⬜ pending |
| 1-04    | FOUND-04 | lint/unit | `pnpm test --project svelte`                                         | ❌ Wave 0   | ⬜ pending |
| 1-05    | FOUND-05 | manual    | `grep -r "rollup-plugin" packages/ \| wc -l` (expect 0)              | manual      | ⬜ pending |
| 1-06    | FOUND-06 | unit      | `pnpm test` (foundation.test.ts)                                     | ❌ Wave 0   | ⬜ pending |
| 1-07    | FOUND-07 | lint      | `grep -r '{@html}' packages/ \| wc -l` (expect 0)                    | manual      | ⬜ pending |
| 1-08    | FOUND-08 | lint      | `grep -r 'unpkg.com\|cdn.tailwindcss' packages/ \| wc -l` (expect 0) | manual      | ⬜ pending |
| 1-09    | FOUND-09 | lint      | `grep -r '<select' packages/svelte/src/ \| wc -l` (expect 0)         | manual      | ⬜ pending |
| 1-10    | FOUND-10 | unit      | `pnpm test` (foundation.test.ts engines/changeset checks)            | ❌ Wave 0   | ⬜ pending |
| 1-11    | FOUND-11 | smoke     | `pnpm test && pnpm exec playwright test`                             | ❌ Wave 0   | ⬜ pending |
| 1-12    | FOUND-12 | lint      | `pnpm lint && pnpm format --check`                                   | ❌ Wave 0   | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

These test files must be created BEFORE implementation tasks begin:

- [ ] `vitest.config.ts` at monorepo root (workspace config pointing to all packages)
- [ ] `packages/core/vitest.config.ts` — unit tests for core package
- [ ] `packages/svelte/vitest.config.ts` — component tests with @testing-library/svelte
- [ ] `packages/react/vitest.config.ts` — unit tests for React wrapper
- [ ] `packages/vue/vitest.config.ts` — unit tests for Vue wrapper
- [ ] `packages/core/src/foundation.test.ts` — verifies types.ts exports compile, MIT license in all package.json, engines field set, .changeset/config.json exists
- [ ] `packages/svelte/src/lib/Table.test.ts` — stub Table renders without errors
- [ ] `packages/react/src/index.test.ts` — stub imports without errors
- [ ] `packages/vue/src/index.test.ts` — stub imports without errors
- [ ] `e2e/smoke.spec.ts` — Playwright placeholder smoke test (passes immediately)
- [ ] `playwright.config.ts` at monorepo root

---

## Manual-Only Verifications

| Behavior                     | Requirement | Why Manual | Test Instructions                                                         |
| ---------------------------- | ----------- | ---------- | ------------------------------------------------------------------------- |
| No old rollup plugins remain | FOUND-05    | Grep check | Run: `grep -r "rollup-plugin" packages/ \| wc -l` — expect 0              |
| No `{@html}` in any source   | FOUND-07    | Grep check | Run: `grep -r '{@html}' packages/ \| wc -l` — expect 0                    |
| No CDN Tailwind link         | FOUND-08    | Grep check | Run: `grep -r 'unpkg.com\|cdn.tailwindcss' packages/ \| wc -l` — expect 0 |
| No type-switcher `<select>`  | FOUND-09    | Grep check | Run: `grep -r '<select' packages/svelte/src/ \| wc -l` — expect 0         |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
