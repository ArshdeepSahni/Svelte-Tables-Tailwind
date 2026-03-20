# Svelte Tables Tailwind — v2.0.0

## What This Is

A framework-agnostic, zero-config table library that sets the industry standard for displaying and interacting with tabular data on the web. Any developer — Svelte, React, Vue, or vanilla JS — passes their data and gets a production-ready table instantly, with intelligent type inference, rich cell renderers, and a dead-simple override API. The goal: replace AG Grid, TanStack Table, and every other heavy, config-heavy alternative with something 100x simpler.

## Core Value

Zero-config data display with smart type inference — `<Table data={rows} />` just works, and when you need more, one prop does it.

## Requirements

### Validated

- ✓ Column type-casting with 14+ renderer types (string, number, image, date, time, mail, phone, dropdown, checkbox, list, html, code, tag, url) — v1.0.6
- ✓ Click callback on table cells — v1.0.6
- ✓ URL navigation prop per row — v1.0.6
- ✓ Tailwind CSS-powered styling — v1.0.6
- ✓ Dual ESM + UMD build outputs — v1.0.6
- ✓ npm-publishable component library — v1.0.6

### Active

- [ ] Upgrade all dependencies to latest stable versions safely
- [ ] Zero-config auto-type inference from raw data (`<Table data={rows} />`)
- [ ] Framework-agnostic core (Web Components) with Svelte, React, Vue wrappers
- [ ] One-prop type override API (`columns={{ avatar: 'image' }}`)
- [ ] World-class performance: virtual scrolling, lazy rendering, 100k+ rows
- [ ] Best-in-class DX: TypeScript types, zero required config, instant setup
- [ ] Production-grade design system with theming support
- [ ] Column operations: sorting, filtering, resizing, reordering
- [ ] Inline cell editing with two-way data binding
- [ ] Plugin/renderer extension API for custom cell types
- [ ] Accessibility (WCAG 2.1 AA), keyboard navigation, screen reader support
- [ ] Comprehensive docs site with live playground
- [ ] Test coverage and CI/CD pipeline

### Out of Scope

- Server-side rendering of data (client-side rendering only for v2) — complexity, add in v3
- Real-time collaborative editing — out of scope for a table library
- Full spreadsheet formula engine (Excel-like) — different product category
- Mobile-native (iOS/Android) wrappers — web-first for v2
- Backend/ORM integrations — library stays UI-layer only

## Context

**Existing codebase:** Single `src/Tables.svelte` monolith (~230 lines). Props are `colname` (object mapping type-key to header label) and `rowdata` (array of arrays). Type rendering via a long if-else chain in `returndatatype()`. No tests, no TypeScript, no accessibility, no virtual scrolling. Tailwind loaded via CDN link in component head — anti-pattern for a library.

**Competitive landscape:** AG Grid (massive, enterprise, complex), TanStack Table (headless, powerful but needs wiring), react-table (same), Handsontable (Excel-like, paid), shadcn/ui Table (unstyled primitives). None offer true zero-config with intelligent type inference.

**Key opportunity:** The entire category requires developers to define column schemas before rendering. This library's unique insight — infer types from data, render immediately, override when needed — is the wedge that makes it 100x simpler.

**Dependency state:** All packages are 3-4 years old (Svelte 3, Rollup 2, 2021-era plugins). Must upgrade to Svelte 5, Vite/modern Rollup, current plugin ecosystem before v2 work begins.

## Constraints

- **Compatibility**: v2 API must provide a migration path from v1 `colname`/`rowdata` props — deprecate gracefully, don't break existing users overnight
- **Size**: Core bundle must stay under 50KB gzipped — tree-shakable renderers
- **Performance**: Must handle 100k+ rows with virtual scrolling without jank
- **Framework**: Svelte 5 with runes for the Svelte package; Web Components for the framework-agnostic core
- **Distribution**: npm-publishable, monorepo structure for multi-package output

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Upgrade deps before v2 feature work | Old toolchain blocks Svelte 5 and modern features | — Pending |
| Web Components as framework-agnostic core | Maximum reach without framework-specific rewrites | — Pending |
| Vite + @sveltejs/package for build | Industry standard for Svelte library authoring in 2025 | — Pending |
| Zero-config as primary API | The single biggest DX differentiator vs. all competitors | — Pending |
| Monorepo structure | Separate packages for core, svelte, react, vue wrappers | — Pending |

---
*Last updated: 2026-03-20 after initialization*
