---
phase: 2
slug: core-engine-type-inference-renderer-registry
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 with coverage (v8 provider) |
| **Config file** | `packages/core/vitest.config.ts` (exists from Phase 1, needs threshold additions) |
| **Quick run command** | `pnpm --filter @tablecraft/core test` |
| **Coverage run command** | `pnpm --filter @tablecraft/core test --coverage` |
| **Full suite command** | `pnpm test` (workspace root) |
| **Estimated runtime** | ~15 seconds (unit) + ~20 seconds (coverage) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @tablecraft/core test`
- **After every plan wave:** Run `pnpm --filter @tablecraft/core test --coverage`
- **Before `/gsd:verify-work`:** Full suite + coverage thresholds must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task | Req | Test Type | Automated Command | File Exists | Status |
|------|-----|-----------|-------------------|-------------|--------|
| Types + tokens + scheduler | CORE-01,05,09 | unit | `pnpm --filter @tablecraft/core test` | ❌ Wave 0 | ⬜ |
| Inference detectors | CORE-02,03,04 | unit | same | ❌ Wave 0 | ⬜ |
| Renderer registry | CORE-06 | unit | same | ❌ Wave 0 | ⬜ |
| 17 Tier 1 renderers | CORE-07,12 | unit | same | ❌ Wave 0 | ⬜ |
| createTableEngine | CORE-01,08 | unit | same | ❌ Wave 0 | ⬜ |
| CSS tokens | CORE-09 | unit | same | ❌ Wave 0 | ⬜ |
| v1 shim | CORE-10 | unit | same | ❌ Wave 0 | ⬜ |
| Coverage thresholds | CORE-12 | coverage | `pnpm --filter @tablecraft/core test --coverage` | config update | ⬜ |
| Tree-shaking structure | CORE-07 | structural | `grep -r "from './" packages/core/src/renderers/` | manual | ⬜ |
| Build multi-entry | CORE-06,07 | build | `pnpm --filter @tablecraft/core build && ls packages/core/dist/` | post-build | ⬜ |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

All test stubs must be created BEFORE implementation begins:

- [ ] `packages/core/src/engine/engine.test.ts` — CORE-01 stubs
- [ ] `packages/core/src/inference/inference.test.ts` — CORE-02 stubs (sampling, threshold, null)
- [ ] `packages/core/src/inference/detectors.test.ts` — CORE-03, CORE-04 stubs
- [ ] `packages/core/src/scheduler.test.ts` — CORE-05 stubs
- [ ] `packages/core/src/registry/registry.test.ts` — CORE-06 stubs
- [ ] `packages/core/src/renderers/*.test.ts` — 17 renderer test files (CORE-07, CORE-12)
- [ ] `packages/core/src/tokens.test.ts` — CORE-09 stubs
- [ ] `packages/core/src/compat/v1.test.ts` — CORE-10 stubs
- [ ] Update `packages/core/vitest.config.ts` — add coverage thresholds (inference ≥95%, renderers ≥90%)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| State separation documented | CORE-08 | Architecture doc | Read `packages/core/src/README.md` — must contain state separation explanation |
| Tree-shaking build output | CORE-07 | Build artifact | Run `pnpm --filter @tablecraft/core build && ls packages/core/dist/renderers/` — expect 17 separate files |
| Currency import isolation | CORE-07 | Source check | `grep -r "from './" packages/core/src/renderers/currency.ts` — no cross-renderer imports |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 test stubs created before implementation waves
- [ ] No watch-mode flags in automated commands
- [ ] Feedback latency < 20s
- [ ] Coverage thresholds configured in vitest.config.ts
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
