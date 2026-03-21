# Technology Stack

**Analysis Date:** 2026-03-19

## Languages

**Primary:**

- JavaScript (ES6+) - Component logic and build configuration
- Svelte - UI component framework

**Secondary:**

- CSS - Styling via Tailwind CSS utility classes

## Runtime

**Environment:**

- Node.js - Build and development environment

**Package Manager:**

- npm - Dependency management
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**

- Svelte 3.37.0 - Lightweight reactive UI component framework for building the Tables component

**Build/Dev:**

- Rollup 2.45.2 - Module bundler for creating distributable library artifacts
  - `rollup-plugin-svelte` 7.1.0 - Compiles Svelte components to JavaScript
  - `rollup-plugin-node-resolve` 5.2.0 - Locates and resolves third-party dependencies
  - `rollup-plugin-css-only` 3.1.0 - Extracts CSS into separate stylesheet

**Styling:**

- Tailwind CSS 2.x (via CDN) - Utility-first CSS framework for component styling

## Key Dependencies

**Critical:**

- `svelte` 3.37.0 - Core framework for reactive component development
- `rollup` 2.45.2 - Required for building distributable library format
- `rollup-plugin-svelte` 7.1.0 - Svelte compilation within Rollup build pipeline

**Build Support:**

- `@rollup/plugin-commonjs` 18.0.0 - Enables CommonJS module compatibility
- `rollup-plugin-css-only` 3.1.0 - CSS extraction and bundling
- `rollup-plugin-node-resolve` 5.2.0 - Node module resolution during build

## Configuration

**Build:**

- Location: `rollup.config.js`
- Input: `src/Tables.svelte`
- Outputs:
  - ES Module: `dist/index.mjs`
  - UMD Module: `dist/index.js`
  - CSS Bundle: `dist/tags.css`

**Entry Points:**

- Svelte component: `src/Tables.svelte`
- Module export: `src/index.js` (re-exports Tables component)

**Package Metadata:**

- Main entry: `dist/index.js` (UMD format)
- Module entry: `dist/index.mjs` (ES Module format)
- Svelte entry: `src/Tables.svelte` (source component)

## Platform Requirements

**Development:**

- Node.js with npm
- No specific version constraints declared in package.json

**Production:**

- Browser environment supporting ES6 JavaScript
- Tailwind CSS 2.x loaded via CDN (unpkg.com)
- UMD build can be consumed as library in any JavaScript project
- ES Module build for modern module bundlers

## Distribution

**Package Type:** Library/Component package
**Publishing:** npm registry (github.com/ArshdeepSahni/Svelte-Tables-Tailwind)
**Format:** Dual UMD + ES Module exports for maximum compatibility
**Current Version:** 1.0.6

---

_Stack analysis: 2026-03-19_
