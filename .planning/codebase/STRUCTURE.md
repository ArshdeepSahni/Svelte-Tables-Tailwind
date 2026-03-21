# Codebase Structure

**Analysis Date:** 2026-03-19

## Directory Layout

```
svelte-tables-tailwind/
├── src/                        # Source code
│   ├── Tables.svelte          # Main table component
│   └── index.js               # Module entry point
├── dist/                       # Built output
│   ├── index.js               # UMD build
│   ├── index.mjs              # ESM build
│   └── tags.css               # Extracted CSS
├── node_modules/              # Dependencies
├── package.json               # Project metadata and dependencies
├── rollup.config.js           # Build configuration
├── package-lock.json          # Dependency lock
├── bun.lock                   # Bun package manager lock
├── README.md                  # Usage documentation
├── LICENSE                    # ISC license
└── .gitignore                 # Git ignore rules
```

## Directory Purposes

**`src/`:**

- Purpose: Contains all source code for the package
- Contains: Svelte component file and module entry point
- Key files: `Tables.svelte`, `index.js`

**`dist/`:**

- Purpose: Compiled and bundled output for distribution
- Contains: UMD build, ESM build, and extracted CSS
- Generated: Yes (created by `npm run build`)
- Committed: Yes (pre-built distributions in repo)

**`node_modules/`:**

- Purpose: Installed npm dependencies
- Contains: Svelte, Rollup, and build plugins
- Generated: Yes (by npm install)
- Committed: No (.gitignore)

## Key File Locations

**Entry Points:**

- `src/index.js`: Main export point for consumers; re-exports Tables component
- `dist/index.js`: UMD build for CommonJS environments
- `dist/index.mjs`: ESM build for modern JavaScript environments

**Configuration:**

- `package.json`: Package metadata, version, scripts, devDependencies
- `rollup.config.js`: Build configuration specifying input, output formats, and plugins

**Core Logic:**

- `src/Tables.svelte`: Single-file component containing all UI, data rendering logic, and styling

**Build Output:**

- `dist/tags.css`: Extracted Tailwind and component styles

## Naming Conventions

**Files:**

- `.svelte` files: PascalCase (Tables.svelte)
- `.js` files: camelCase or index (index.js)
- Configuration files: kebab-case or dots (rollup.config.js, package.json)

**Directories:**

- lowercase (src, dist, node_modules)

**Exports:**

- Default export: Tables component via `src/index.js`
- Package entry: `src/Tables.svelte` (svelte field in package.json)

## Where to Add New Code

**New Feature (e.g., additional data type):**

- Primary code: `src/Tables.svelte`, extend `returndatatype()` function (lines 15-122)
- Tests: Not applicable (no test infrastructure)

**New Component/Module:**

- Only one component exists; if splitting component, create new .svelte file in `src/` and import into index.js

**Utilities:**

- No separate utilities directory; helper functions belong inline in `src/Tables.svelte` or new file in `src/`

**Styles:**

- Component styles: `<style>` block in `src/Tables.svelte` (lines 226-230)
- Tailwind classes: Embed directly in template markup
- CSS overrides: Add to `<style>` block in component

## Special Directories

**`dist/`:**

- Purpose: Pre-built distributions for npm registry consumption
- Generated: Yes (by Rollup during build)
- Committed: Yes (conveniently pre-compiled in repo)

**`.planning/codebase/`:**

- Purpose: GSD analysis documentation
- Generated: Yes (by analysis tools)
- Committed: No (analysis artifacts)

---

_Structure analysis: 2026-03-19_
