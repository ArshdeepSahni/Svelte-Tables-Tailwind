# @tablecraft — Standing Instructions for Claude

These instructions apply to every session working on this repository.
Read STATE.md and ROADMAP.md before touching any code.

## Project North Star
"Today's table libraries are the button phone. @tablecraft is the iPhone."
Every decision must reflect this. Not incremental — paradigm-shifting.
Design reference: Apple, Notion, Linear, Cron, Johnny Ive aesthetic.

## Execution Mode
- YOLO: Do not ask for permission. Decide and execute.
- Test visually: After every change, rebuild and screenshot localhost:5173
- Commit atomically: One logical change per commit, descriptive message
- Never stop mid-task: Complete the full cycle (code → test → verify → commit)

## Before Writing Any Code
1. `cat .planning/STATE.md` — understand where we are
2. `pnpm --filter @tablecraft/svelte exec vitest run` — confirm current green baseline
3. Screenshot localhost:5173 — understand current visual state

## After Every Code Change
1. `pnpm --filter @tablecraft/svelte exec vitest run` — must stay GREEN (82+ tests)
2. `pnpm --filter @tablecraft/svelte build` — must exit 0
3. Screenshot localhost:5173 — verify visual result

## Dev Servers
- Dev playground: http://localhost:5173 (run: pnpm --filter @tablecraft/dev dev)
- Dashboard: http://localhost:5176 (run: pnpm --filter @tablecraft/docs dev)
- Benchmark: http://localhost:5174 (run: pnpm --filter @tablecraft/svelte bench)

## Design Non-Negotiables
- Background: pure white #ffffff only
- Accent: near-black #0a0a0a (NEVER indigo, purple, or blue as primary)
- Borders: nearly invisible #f0f0f0
- No Tailwind in the library — CSS custom properties (--tc-*) only
- No Shadow DOM in the Lit element — Light DOM permanently
- No {@ html} on raw user data — only on pre-sanitized CellDescriptor.sanitized

## Architecture Non-Negotiables
- Engine is stateless — reactive state lives in Svelte $state() only
- Sort Worker returns sortedIndices[] not rows (avoids Proxy overhead)
- All renderers individually tree-shakable
- v1 colname/rowdata shim retained with console.warn
- Column virtualizer disabled when reorder/pinning active

## Package Commands
```bash
pnpm --filter @tablecraft/core build           # core ESM+CJS
pnpm --filter @tablecraft/core build:element   # UMD for CDN
pnpm --filter @tablecraft/svelte build         # main package
pnpm --filter @tablecraft/svelte exec vitest run  # unit tests
pnpm exec playwright test e2e/                 # E2E tests
pnpm test                                      # all workspace tests
```

## Current Phase Status
Read .planning/ROADMAP.md for current state.
Phases 1-6 + Phase 11 (critical fixes) are complete.
Phases 7-10 are next: Docs → AI Intelligence → Streams → Ecosystem.
Run `/gsd:autonomous` to continue all remaining phases.

## User's Explicit Feedback (always keep in mind)
- Search must feel natural — zero dev syntax exposed to users
- Design must beat Apple, Notion, Amie, Cron — not match them
- Customisation must be limitless (60+ CSS tokens, every visual property)
- Table concept must be rethought — not just display, but intelligence
- Performance must be world-class at every scale (100k rows, 60fps)
