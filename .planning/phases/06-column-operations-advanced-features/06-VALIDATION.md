---
phase: 6
slug: column-operations-advanced-features
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 6 — Validation Strategy

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Unit** | Vitest 4.x + @testing-library/svelte |
| **E2E** | Playwright 1.50.1 |
| **Quick run** | `pnpm --filter @tablecraft/svelte test --run` |
| **Full run** | `pnpm test && pnpm exec playwright test e2e/adv.spec.ts` |

---

## Per-Task Verification Map

| Task | Req | Test | Command | Status |
|------|-----|------|---------|--------|
| Column resize | ADV-01 | Playwright | `playwright test e2e/adv.spec.ts` | ⬜ |
| Column reorder | ADV-02 | Playwright | same | ⬜ |
| Column pinning | ADV-03 | Playwright + CSS | same | ⬜ |
| Sticky header | ADV-04 | Already done Phase 3 | — | ✅ |
| Column visibility | ADV-05 | Unit | `pnpm --filter @tablecraft/svelte test --run` | ⬜ |
| Row grouping | ADV-06 | Unit + Playwright | both | ⬜ |
| Aggregate footer | ADV-07 | Unit | unit | ⬜ |
| Persistence | ADV-08 | Unit (localStorage mock) | unit | ⬜ |
| Density | ADV-09 | Unit | unit | ⬜ |

---

## Wave 0 Requirements

- [ ] `e2e/adv.spec.ts` — Playwright stubs for resize, reorder, pin
- [ ] Critical CSS fix: `overflow: hidden → clip-path: inset(...)` on `.tc-table-wrapper` (required for pinning)

---

*Phase: 06-column-operations-advanced-features*
*Created: 2026-03-22*
