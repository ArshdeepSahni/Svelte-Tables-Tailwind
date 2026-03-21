---
phase: 3
slug: svelte-5-component-zero-config-api
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 3 — Validation Strategy

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + @testing-library/svelte 5.3.1 + vitest-axe |
| **Config file** | `packages/svelte/vitest.config.ts` (exists, needs setupFiles update) |
| **Quick run command** | `pnpm --filter @tablecraft/svelte test --run` |
| **Coverage run** | `pnpm --filter @tablecraft/svelte test --run --coverage` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** `pnpm --filter @tablecraft/svelte test --run`
- **After every plan wave:** `pnpm --filter @tablecraft/svelte test --run --coverage`
- **Before `/gsd:verify-work`:** Full suite including vitest-axe WCAG checks must be green

---

## Per-Task Verification Map

| Task | Req | Test Type | Command | File | Status |
|------|-----|-----------|---------|------|--------|
| Table.svelte zero-config | SVLT-01 | unit | `pnpm --filter @tablecraft/svelte test --run` | ❌ Wave 0 | ⬜ |
| Column override API | SVLT-02 | unit | same | ❌ Wave 0 | ⬜ |
| Sort state + aria-sort | SVLT-03 | unit | same | ❌ Wave 0 | ⬜ |
| Global search filter | SVLT-04 | unit | same | ❌ Wave 0 | ⬜ |
| Pagination controls | SVLT-06 | unit | same | ❌ Wave 0 | ⬜ |
| Empty state + snippet | SVLT-07 | unit | same | ❌ Wave 0 | ⬜ |
| Loading skeleton + aria-busy | SVLT-08 | unit | same | ❌ Wave 0 | ⬜ |
| Row selection + bind:selectedRows | SVLT-09 | unit | same | ❌ Wave 0 | ⬜ |
| Keyboard navigation arrows | SVLT-11 | unit | same | ❌ Wave 0 | ⬜ |
| WCAG 2.1 AA via vitest-axe | SVLT-12 | axe | same | ❌ Wave 0 | ⬜ |
| Row/cell click events | SVLT-13 | unit | same | ❌ Wave 0 | ⬜ |
| v1 colname/rowdata compat | SVLT-15 | unit | same | ❌ Wave 0 | ⬜ |
| @sveltejs/package build | SVLT-14 | build | `pnpm --filter @tablecraft/svelte build` | config | ⬜ |
| Responsive display | SVLT-10 | visual | manual viewport test | manual | ⬜ |

---

## Wave 0 Requirements

- [ ] Overwrite `packages/svelte/src/lib/Table.test.ts` with full Phase 3 test stubs
- [ ] Create `packages/svelte/src/test/setup.ts` — imports `vitest-axe/extend-expect`
- [ ] Update `packages/svelte/vitest.config.ts` — add `setupFiles: ['./src/test/setup.ts']`
- [ ] Install `vitest-axe@1.0.0-pre.5` in `packages/svelte`
- [ ] Stub `requestIdleCallback` via `vi.stubGlobal` in test setup

---

## Manual-Only Verifications

| Behavior | Req | Why Manual | Instructions |
|----------|-----|------------|--------------|
| Responsive horizontal scroll | SVLT-10 | Needs browser viewport | Open dev server at 320px width; confirm horizontal scroll, no overflow clip |
| Screen reader announces sort | SVLT-12 | Needs NVDA/VoiceOver | Tab to sorted header; confirm `aria-sort` announcement |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] No watch-mode flags in automated commands (`--run` not `--watch`)
- [ ] vitest-axe passes for all 4 render states (empty, loading, data, selection)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
