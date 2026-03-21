---
phase: 4
slug: virtual-scrolling-performance
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 4 — Validation Strategy

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Unit framework** | Vitest 4.1.0 (existing, packages/svelte) |
| **E2E framework** | Playwright 1.50.1 (existing, root) |
| **Quick run** | `pnpm --filter @tablecraft/svelte test` |
| **Full run** | `pnpm test && pnpm exec playwright test e2e/performance.spec.ts` |
| **Estimated runtime** | ~10s unit + ~30s Playwright |

---

## Sampling Rate

- **After every task commit:** `pnpm --filter @tablecraft/svelte test`
- **After every plan wave:** `pnpm test && pnpm exec playwright test e2e/performance.spec.ts`
- **Phase gate:** All Playwright benchmarks green before `/gsd:verify-work`

---

## Per-Task Verification Map

| Task | Req | Test Type | Command | File | Status |
|------|-----|-----------|---------|------|--------|
| Row virtualizer integration | PERF-01 | Playwright | `pnpm exec playwright test e2e/performance.spec.ts` | ❌ Wave 0 | ⬜ |
| Fixed row height | PERF-02 | Unit | `pnpm --filter @tablecraft/svelte test` | ❌ Wave 0 | ⬜ |
| CSS containment | PERF-03 | Playwright | same Playwright | ❌ Wave 0 | ⬜ |
| Event delegation | PERF-04 | Unit | `pnpm --filter @tablecraft/svelte test` | ❌ Wave 0 | ⬜ |
| 100k render + 60fps scroll | PERF-05 | Playwright | same Playwright | ❌ Wave 0 | ⬜ |
| Column virtualization | PERF-06 | Unit | `pnpm --filter @tablecraft/svelte test` | ❌ Wave 0 | ⬜ |
| Worker sort < 50ms | PERF-07 | Playwright | same Playwright | ❌ Wave 0 | ⬜ |

---

## Wave 0 Requirements

- [ ] `e2e/performance.spec.ts` — PERF-01, PERF-03, PERF-05, PERF-07 Playwright benchmarks
- [ ] `packages/svelte/src/test/virtual.test.ts` — PERF-02, PERF-06 unit tests
- [ ] `packages/svelte/src/test/delegation.test.ts` — PERF-04 event delegation unit test
- [ ] `packages/svelte/src/lib/sort.worker.ts` — Worker file (needed by all tests)
- [ ] `playwright.config.ts` — add `webServer` config for svelte package dev server
- [ ] Bench page: `packages/svelte/bench.html` + `packages/svelte/src/bench.ts`

---

## Manual-Only Verifications

| Behavior | Req | Why Manual | Instructions |
|----------|-----|------------|--------------|
| Visual scroll smoothness | PERF-05 | Subjective fps feel | Open bench page at localhost:5174 with 100k rows, scroll rapidly |
| Worker fallback in SSR | PERF-07 | No SSR in Playwright | Manual: run `pnpm build` in a SvelteKit SSR project, confirm no `Worker is not defined` |

---

## Validation Sign-Off

- [ ] All 7 PERF-* requirements have automated commands
- [ ] Playwright webServer configured so e2e tests can load the table
- [ ] Web Worker tested via Playwright (not jsdom — jsdom doesn't support Workers)
- [ ] No watch-mode flags in any automated command
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
