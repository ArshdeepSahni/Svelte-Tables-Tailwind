# Architecture

**Analysis Date:** 2026-03-19

## Pattern Overview

**Overall:** Single-component Svelte library with built-in data rendering abstraction

**Key Characteristics:**

- Monolithic single-file component design
- Type-agnostic data rendering engine with 14+ supported data types
- Tailwind CSS-first styling approach
- Runtime type mapping and HTML generation
- Click and URL navigation callbacks

## Layers

**Component Layer:**

- Purpose: Encapsulates entire table UI and data rendering logic
- Location: `src/Tables.svelte`
- Contains: Svelte component with script, markup, and styles
- Depends on: None (pure Svelte)
- Used by: External applications importing via `src/index.js`

**Export/Module Layer:**

- Purpose: Provides entry point and UMD/ESM dual build support
- Location: `src/index.js`
- Contains: Default export of Tables component
- Depends on: Tables.svelte
- Used by: Build system and package consumers

**Build/Bundle Layer:**

- Purpose: Transforms Svelte component to distributable formats
- Location: `rollup.config.js`
- Outputs: `dist/index.js` (UMD), `dist/index.mjs` (ESM), `dist/tags.css`
- Depends on: rollup plugins for Svelte, CSS, node resolution

## Data Flow

**Component Initialization:**

1. Props accepted: `colname` (column headers with data types), `rowdata` (array of rows), `url` (optional link), `click` (optional callback)
2. `enterdatatypes()` executes on window load, extracting data type keys from `colname` object into `datatypelist` array
3. `datatypelist` drives header rendering and data cell rendering

**Row and Cell Rendering:**

1. `#each rowdata as i, index` loops through rows
2. Inner `#each i as j, indexj` loops through cells in each row
3. For each cell, `returndatatype(datatypelist[indexj], j)` is called
4. The function maps the data type (key) and value to appropriate HTML markup

**User Interaction:**

1. Click handler on table data cells fires user-provided `click` callback
2. Wrapping link with `url` prop enables optional navigation
3. Type-specific controls (input, select, checkbox) are rendered but not bound back to parent

## Key Abstractions

**Data Type Renderer:**

- Purpose: Maps data type names to HTML representations
- Implementation: `returndatatype()` function (lines 15-122 in Tables.svelte)
- Pattern: Long if-else chain returning HTML strings
- Supported types: string, number, input, date, time, mail, phone, dropdown, checkbox, list, image, html, code, tag, url

**Column Metadata:**

- Purpose: Pairs column headers with their data type
- Pattern: `colname` prop as object with data type keys and header string values
- Example: `{ "string": "Column1", "number": "0" }`

**Row Data:**

- Purpose: Stores tabular data aligned to column order
- Pattern: Array of arrays, where each inner array is a row, elements aligned to column types
- Example: `[["String1", "1"], ["String2", "2"]]`

## Entry Points

**Component Import:**

- Location: `src/index.js`
- Triggers: Consumer package import: `import Tables from 'svelte-tables-tailwind'`
- Responsibilities: Re-exports default Tables component

**DOM Entry:**

- Location: `Tables.svelte` template (line 132-224)
- Triggers: Svelte mount on DOM element with component instantiation
- Responsibilities: Renders table structure with headers, rows, cells

## Error Handling

**Strategy:** Minimal/none currently implemented

**Patterns:**

- No validation of `colname` structure
- No null/undefined checks on `rowdata`
- No error boundaries or try-catch
- Type mismatch in data vs. colname falls through to default case in `returndatatype()` (returns empty string)

## Cross-Cutting Concerns

**Logging:** Console.log on line 14 logs datatypelist during component initialization (development aid only)

**Validation:** None - caller responsible for ensuring colname keys match rowdata column order

**Styling:** Tailwind CSS classes embedded directly in markup; external CDN link in svelte:head for Tailwind (line 127-131); component CSS overrides select element background (line 227-230)

---

_Architecture analysis: 2026-03-19_
