---
phase: 5
slug: web-components-core-framework-wrappers
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 5 — Validation Strategy

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Unit framework** | Vitest 4.x (Node env for SSR, jsdom for DOM) |
| **E2E framework** | Playwright 1.50.1 |
| **Quick run** | `pnpm test` (workspace) |
| **Full run** | `pnpm test && pnpm exec playwright test e2e/wc-smoke.spec.ts` |
| **Estimated runtime** | ~15s unit + ~30s Playwright |

---

## Per-Task Verification Map

| Task | Req | Test Type | Command | File | Status |
|------|-----|-----------|---------|------|--------|
| TcTable Lit element | WC-01,02,03,04 | Unit + Playwright | `pnpm test && playwright test` | ❌ Wave 0 | ⬜ |
| Properties API | WC-02 | Playwright vanilla | `playwright test e2e/wc-smoke.spec.ts` | ❌ Wave 0 | ⬜ |
| Attributes API | WC-03 | Unit | `pnpm --filter @tablecraft/core test` | ❌ Wave 0 | ⬜ |
| CustomEvents | WC-04 | Unit + Playwright | same | ❌ Wave 0 | ⬜ |
| SSR guards | WC-05 | Unit (Node) | `pnpm --filter @tablecraft/core test` | ❌ Wave 0 | ⬜ |
| SvelteKit SSR | WC-06 | Vitest Node import | `pnpm --filter @tablecraft/core test` | ❌ Wave 0 | ⬜ |
| React wrapper | WC-07 | Playwright | `playwright test e2e/wc-smoke.spec.ts` | ❌ Wave 0 | ⬜ |
| Vue wrapper | WC-08 | Playwright | same | ❌ Wave 0 | ⬜ |
| UMD + ESM+CJS build | WC-09 | build | `pnpm --filter @tablecraft/core build` | build | ⬜ |
| Playwright smoke tests | WC-10 | Playwright | `playwright test e2e/wc-smoke.spec.ts` | ❌ Wave 0 | ⬜ |

---

## Wave 0 Requirements

- [ ] `packages/core/src/element.ts` — Lit element class (even as stub)
- [ ] `packages/core/src/element.test.ts` — SSR + property stubs
- [ ] `e2e/wc-smoke.spec.ts` — vanilla, React, Vue smoke stubs
- [ ] `packages/core/vite.config.element.ts` — separate UMD build config
- [ ] Install Lit 3 + @lit/react in respective packages

---

## Manual-Only Verifications

| Behavior | Req | Why Manual | Instructions |
|----------|-----|------------|--------------|
| Tailwind classes from host pierce table | WC-01 | Visual | Add Tailwind class to host page; confirm it styles tc-table cells |
| `element.data = rows` in browser console | WC-02 | Interactive | Open vanilla HTML page; run `document.querySelector('tc-table').data = [{name:'test'}]`; confirm render |

---

## Validation Sign-Off

- [ ] All WC-* requirements have automated commands
- [ ] SSR tested in Node.js environment (no browser needed)
- [ ] Playwright tests cover vanilla JS, React, Vue
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
