# Features Research: Table/Data-Grid Library Competitive Landscape

**Domain:** Table / Data-Grid UI Library
**Researched:** 2026-03-20
**Overall confidence:** HIGH for established libraries (AG Grid, TanStack, Handsontable, react-table, Tabulator, DataTables, Grid.js); MEDIUM for newer/smaller libraries (Glide Data Grid, shadcn table, vue-good-table recent state)

**Note on sources:** Web tools were unavailable during this research session. All findings are drawn from training knowledge through August 2025, which covers all stable releases of every library analyzed. Confidence flags are applied per-finding.

---

## Competitive Landscape

### 1. AG Grid

**What it is:** The dominant enterprise JavaScript data grid. Framework adapters for React, Angular, Vue, Svelte. Two editions: Community (MIT) and Enterprise (paid, ~$1,800/dev).

**Unique value:** Handles genuinely extreme data scenarios — 1M+ rows with row virtualisation, server-side row model, integrated charting, Excel-style pivoting, clipboard copy/paste, range selection. The only library that ships complete out of the box for enterprise use.

**Minimum working example (lines of code):**

```javascript
// HTML
<div id="myGrid" style="height: 200px;" class="ag-theme-quartz"></div>;

// JS — ~15 lines of mandatory configuration
import { createGrid, ModuleRegistry } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';

ModuleRegistry.registerModules([ClientSideRowModelModule]);

const columnDefs = [{ field: 'make' }, { field: 'model' }, { field: 'price' }];

const rowData = [{ make: 'Toyota', model: 'Celica', price: 35000 }];

createGrid(document.querySelector('#myGrid'), { columnDefs, rowData });
```

Even the minimal example requires: knowing the module registration pattern, picking a theme class, setting an explicit height, defining `columnDefs` as objects. There is no zero-config path.

**Bundle size:** Community ~400KB minified, ~120KB gzipped. Enterprise significantly larger. (MEDIUM confidence — exact numbers shift with each release.)

**Feature list (Community + Enterprise combined):**

- Row virtualisation (DOM recycling for large datasets)
- Column sorting (single and multi-column)
- Column filtering (text, number, date, set filter, multi-filter)
- Column resizing, reordering, pinning (left/right)
- Row grouping and aggregation (Enterprise)
- Pivoting (Enterprise)
- Tree data / hierarchical rows
- Row selection (single, multiple, checkbox)
- Inline cell editing (many editor types: text, numeric, select, date, rich text)
- Custom cell renderers (via component framework or plain JS)
- Custom cell editors
- Context menus (Enterprise)
- Range selection and clipboard (Enterprise)
- Excel export / CSV export
- Server-side row model (pagination, infinite scroll, lazy load)
- Integrated charts (Enterprise, powered by AG Charts)
- Master-detail rows (expandable sub-grids)
- Full-width rows
- Row animations
- Theming (Quartz, Alpine, Balham, Material themes; CSS variables for customisation)
- Status bar (Enterprise — aggregate summaries in footer)
- Tool panels: column tool panel, filter tool panel (Enterprise)
- Touch support
- Keyboard navigation and ARIA (accessibility)
- Column spanning / row spanning
- Loading overlays, no-rows overlays
- Localisation (i18n)
- Printing mode
- Column state persistence (save/restore column config to JSON)
- Event system (rowClicked, cellClicked, sortChanged, etc.)

**Weaknesses and pain points (HIGH confidence — consistent GitHub/Reddit/SO patterns):**

- Configuration object is enormous. A production AG Grid setup routinely requires 200-500 lines of `columnDefs` + grid options.
- Module registration system (introduced to enable tree-shaking) is confusing and a common source of "feature not working" bugs.
- Theming system was overhauled in v32 (Theming API), breaking existing CSS customizations. Migration is non-trivial.
- Enterprise features are not clearly documented in Community docs — developers discover a feature they need is paywalled mid-implementation.
- Bundle size is punishing for simple use cases. No meaningful tree-shaking for Community edition.
- Framework adapter versions lag behind core. Svelte adapter has historically been third-priority.
- React strict mode causes double-render issues in older versions.
- TypeScript types were incomplete / inconsistent before v30.
- Vertical scrolling and horizontal scrolling fight each other in certain container configurations.
- The DOM structure is proprietary (divs, not semantic `<table>`), breaking assistive technologies and CSS targeting.

---

### 2. TanStack Table v8 (formerly react-table)

**What it is:** A headless UI library for tables. Provides all the logic (sorting, filtering, pagination, row selection, column visibility) as framework-agnostic hooks/adapters, with zero rendered markup. Adapters for React, Vue, Svelte, Solid, Angular.

**Unique value:** Maximum flexibility — you own 100% of the markup and styling. Logic and UI are fully decoupled. Works with any CSS framework.

**Minimum working example (lines of code):**

```tsx
// React — MINIMUM functional table with sorting: ~80-120 lines
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useState } from 'react';

const columns = [
  { accessorKey: 'firstName', header: 'First Name' },
  { accessorKey: 'lastName', header: 'Last Name' },
  { accessorKey: 'age', header: 'Age' },
];

function Table({ data }) {
  const [sorting, setSorting] = useState([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
                {flexRender(header.column.columnDef.header, header.getContext())}
                {header.column.getIsSorted() === 'asc' ? ' ▲' : ' ▼'}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

This is **the minimum viable TanStack Table** with sorting. Adding filtering adds another ~30 lines. Adding pagination adds another ~40 lines. A production implementation with filtering, sorting, pagination, row selection, and column visibility is typically 200-400 lines before any styling.

**Bundle size:** Core ~14KB gzipped (framework adapter adds ~5-10KB). Excellent for a headless library. (HIGH confidence)

**Feature list:**

- Sorting (single-column and multi-column, with sort direction cycling)
- Column filtering (global filter, per-column filter, custom filter functions)
- Pagination (client-side, with ability to wire to server-side)
- Row selection (single, multi, select-all)
- Column visibility toggling
- Column pinning (left/right)
- Column ordering (manual drag-drop requires separate DnD library)
- Column resizing (manual or auto)
- Column grouping (nested headers)
- Row grouping (expanding/collapsing grouped rows)
- Expanding rows (detail panels)
- Faceted column values (unique values for filter UIs)
- Column spanning
- Row virtualisation (via the separate @tanstack/react-virtual package)
- TypeScript-first (generics on data type, excellent inference)
- Framework adapters: React, Vue, Svelte, Solid, Angular, Qwik

**Weaknesses and pain points (HIGH confidence):**

- The API surface for a complete implementation is enormous. `useReactTable` accepts 40+ options. Docs explain every option but the "getting started" journey is brutal for beginners.
- Headless = you write all the markup. For developers who want a styled, ready component, TanStack Table is not a solution — it's a building block.
- Column definition objects are complex. A production column definition with sorting, filtering, a custom cell renderer, pinning state, and sizing can be 15-20 lines per column.
- Row virtualisation requires the separate `@tanstack/react-virtual` package and significant integration code (measuring rows, dynamic heights, scroll container setup).
- The `flexRender` pattern is unfamiliar to developers who expect JSX-in-JSX or template-slot patterns.
- Svelte adapter lags slightly behind React adapter in documentation quality.
- Error messages when configuration is wrong are cryptic ("rows.map is not a function" rather than "data must be an array").
- No built-in visual design. Every project using TanStack Table looks different; component library authors (shadcn, etc.) build on top of it.

---

### 3. react-table (v7 — legacy)

react-table v7 preceded the TanStack rebranding and was hooks-based but React-only. It is effectively deprecated in favour of TanStack Table v8. Still widely used in legacy codebases.

**Pain points specific to v7 (HIGH confidence):** No TypeScript support by default, React-only, plugin system replaced by the v8 feature flag model, no virtual scrolling support.

---

### 4. Handsontable

**What it is:** A spreadsheet-style data grid. Excel-like UX: inline cell editing everywhere by default, formula support, copy/paste with clipboard integration, fill handle (drag to fill), context menus with spreadsheet operations.

**Licensing:** Source-available but NOT open source for commercial use. Free for non-commercial projects; paid licence required for commercial applications. This is the single biggest adoption barrier.

**Minimum working example (lines of code):**

```javascript
// ~8 lines for basic setup
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example');
const hot = new Handsontable(container, {
  data: [
    ['', 'Tesla', 'Nissan'],
    ['2017', 10, 11],
  ],
  rowHeaders: true,
  colHeaders: true,
  licenseKey: 'non-commercial-and-evaluation',
});
```

8-10 lines for basic, but data must be an array-of-arrays (not array-of-objects — a significant ergonomic friction point for modern JS devs used to JSON APIs).

**Bundle size:** ~200-300KB gzipped. Very large because it ships a complete spreadsheet engine. (MEDIUM confidence)

**Feature list:**

- Inline editing (every cell is an input by default)
- Column types: text, numeric, date, time, checkbox, select/dropdown, autocomplete, password, handsontable (nested grid in cell)
- Cell validation (built-in and custom validators)
- Formula support (via optional HyperFormula plugin)
- Copy/paste from/to clipboard (including Excel-formatted clipboard)
- Fill handle (drag corner of selection to auto-fill)
- Row and column headers (numbered rows, lettered columns Excel-style)
- Fixed/frozen rows and columns
- Merge cells
- Column sorting and filtering
- Context menus (customisable)
- Row/column insertion and deletion via context menu
- Undo/redo
- Search and highlight
- Cell comments
- Conditional formatting
- Column resizing and reordering
- Selection (range selection, like Excel)
- Drag-to-reorder rows and columns
- Scrolling (rows and columns virtualised)
- Mobile touch support
- i18n translations
- Custom cell renderer and editor types

**Weaknesses and pain points (HIGH confidence):**

- Commercial licence requirement blocks adoption for any commercial product unless budget approved. Creates "adoption ceiling."
- Array-of-arrays data model is awkward for developers working with REST APIs returning JSON objects.
- The spreadsheet metaphor is wrong for many use cases. When you just need to display data (read-mostly), having every cell be an input is confusing and creates accidental edits.
- Bundle size is always expensive.
- Plugin API is complex and tightly coupled to internal lifecycle.
- Not truly framework-agnostic: framework wrappers (React, Vue, Angular) have historically lagged the core in features.
- v14 broke many v13 APIs; migration is non-trivial.

---

### 5. Tabulator

**What it is:** A feature-rich, framework-agnostic JavaScript table library that ships its own rendering engine (not headless). Unlike TanStack, it is a complete styled component. Unlike AG Grid, it is free and open source.

**Minimum working example:**

```javascript
// ~5 lines
import { TabulatorFull as Tabulator } from 'tabulator-tables';

const table = new Tabulator('#example-table', {
  data: tabledata,
  columns: [
    { title: 'Name', field: 'name' },
    { title: 'Age', field: 'age' },
  ],
});
```

5-8 lines. Closest to "simple" among full-featured table libraries. Column definitions still required.

**Bundle size:** ~180KB gzipped for TabulatorFull. A modular import approach reduces this. (MEDIUM confidence)

**Feature list:**

- Sorting (multi-column)
- Filtering (header filters, external filters, custom filter functions)
- Pagination (client-side and AJAX/server-side)
- Column formatters: progress bars, stars, traffic lights, images, date, time, datetime, money, text, HTML, link, rownum, handle
- Column editors: input, textarea, number, range, tick/checkbox, star, progress, select, autocomplete, list (multiple select), date, time, datetime, color
- Column calculations (footer aggregates: sum, avg, max, min, count, concat, unique)
- Row grouping (with group header formatters, grouping calculations)
- Row selection
- Column resizing, reordering, pinning
- Column visibility toggling
- Frozen rows and columns
- Nested tables (sub-tables)
- Expanding row detail panels
- Tree data (parent-child relationships)
- Data mutation (add, update, delete rows programmatically)
- Ajax data loading with loader indicator
- Infinite scroll / progressive load
- CSV, JSON, XLSX export
- Print styling
- Cell tooltips
- Context menus (header and cell level)
- Row handles (drag to reorder rows)
- Clipboard (copy/paste)
- Undo/redo (via history module)
- Accessibility (ARIA attributes)
- Persistent column state (via localStorage)
- Theming (CSS variables)
- Responsive column hiding (hide columns on mobile)
- Virtual DOM rendering for performance

**Weaknesses and pain points (MEDIUM confidence — based on GitHub issues and community discussions):**

- Documentation quality is inconsistent. Some advanced features have minimal examples.
- The `TabulatorFull` import includes everything; tree-shaking requires knowing the module system intimately.
- Column definition API is extensive (~60+ column options per column) but defaults are sparse — you feel like you're always setting options you shouldn't have to.
- React integration is community-maintained, not official.
- TypeScript types exist but are not generated from the source; they can lag the implementation.
- The "formatter" and "editor" distinction sometimes surprises developers — formatters are display-only; editors are edit-mode-only; there's no unified cell renderer concept.

---

### 6. DataTables (jQuery-based)

**What it is:** The original JavaScript table enhancement library. Attaches to an existing `<table>` HTML element and progressively enhances it. Requires jQuery.

**Minimum working example:**

```javascript
// 3 lines — if your HTML table already exists
$('#myTable').DataTable();
```

This is legitimately the simplest API in the category, but the tradeoff is jQuery as a required dependency (~90KB gzipped), which is unacceptable in modern frameworks.

**Bundle size:** DataTables core ~30KB + jQuery ~90KB = ~120KB gzipped overhead minimum. (HIGH confidence)

**Feature list (core):** Sorting, filtering (global search), pagination, display-length control, state saving, API for data manipulation, server-side processing, AJAX data source, column reordering (extension), column visibility (extension), fixed columns/headers (extension), row grouping (extension), buttons (CSV/Excel/PDF export via extension), Responsive (hide columns on mobile), Select (row selection extension).

**Weaknesses (HIGH confidence):**

- jQuery hard dependency is fatal for React/Vue/Svelte projects. No one writing modern SPA code wants jQuery.
- Progressive enhancement model (must have server-rendered HTML table) conflicts with SPA data-first patterns.
- Extension system creates version matrix complexity.
- The look is dated and theming requires Bootstrap or Foundation integration.
- No virtual scrolling for large datasets without the Scroller extension.
- Still widely used in server-rendered apps (Rails, Laravel) but not in SPA context.

---

### 7. Grid.js

**What it is:** A lightweight (~12KB gzipped), framework-agnostic table library that ships its own rendering and styling. Framework wrappers available for React, Vue, Angular, Svelte.

**Minimum working example:**

```javascript
// ~6 lines
import Grid from 'gridjs';
import 'gridjs/dist/theme/mermaid.css';

new Grid({
  columns: ['Name', 'Email', 'Phone Number'],
  data: [['John', 'john@example.com', '(353) 01 222 3333']],
}).render(document.getElementById('wrapper'));
```

Or with the automatic column header derivation from object keys:

```javascript
new Grid({
  columns: Object.keys(data[0]),
  data: data.map(Object.values),
}).render(wrapper);
```

Still requires columns to be specified, but smaller boilerplate than AG Grid.

**Bundle size:** ~12KB gzipped — the lightest full-featured table library. (HIGH confidence)

**Feature list:** Sorting, filtering (search), pagination, fixed header, resizable columns, custom cell formatters (via `html()` helper), custom cell components, loading skeleton, hidden columns, multi-line columns, event system.

**Weaknesses (MEDIUM confidence):**

- Feature set is intentionally minimal. No row selection, no infinite scroll, no column pinning, no row grouping, no tree data, no editing.
- For any advanced use case, Grid.js requires reaching for TanStack Table instead.
- The `data` format requires array-of-arrays or array-of-arrays-of-cell-configs — not native array-of-objects unless you transform.
- Svelte wrapper lags React wrapper in maintenance.

---

### 8. Glide Data Grid (canvas-based)

**What it is:** A React-only data grid that renders via HTML5 Canvas instead of DOM elements. Built by Glide (spreadsheet product company). Purpose-built for editing-heavy, very-large-dataset scenarios (claimed 1M+ rows at 60fps).

**Minimum working example:**

```tsx
// ~30-50 lines
import DataEditor, { GridCellKind } from '@glideapps/glide-data-grid';
import '@glideapps/glide-data-grid/dist/index.css';

function App() {
  const data = [
    /* your rows */
  ];
  const columns = [{ title: 'Name', width: 200 }];

  const getCellContent = useCallback(
    ([col, row]) => {
      return {
        kind: GridCellKind.Text,
        data: data[row][col],
        displayData: data[row][col],
        allowOverlay: true,
      };
    },
    [data],
  );

  return <DataEditor columns={columns} getCellContent={getCellContent} rows={data.length} />;
}
```

**Bundle size:** ~200KB+ gzipped. Canvas rendering engine is not cheap. (MEDIUM confidence)

**Feature list:** Extremely high row count (1M+ at 60fps), cell-level editing, grouped column headers, frozen columns and rows, custom cell renderers (canvas-based), row grouping, drag-to-reorder columns, row reordering, range selection, copy/paste, column resizing, theme system, image cells, boolean cells, markdown cells, URI cells, bubble/tag cells, drilldown cells (sparklines), loading skeleton, touch support.

**Weaknesses (HIGH confidence):**

- React only. No official Vue, Svelte, Angular adapters.
- Canvas rendering breaks accessibility completely. Screen readers cannot access canvas content. No semantic HTML is produced.
- Debugging canvas rendering is significantly harder than DOM debugging.
- Custom cell types require implementing a canvas drawing function — much higher skill floor than HTML-based renderers.
- Not suitable for text-selection use cases (users cannot select text with cursor in a canvas grid).
- Overkill for < 100k rows.

---

### 9. shadcn/ui Table

**What it is:** Not a library — a code pattern distributed as copy-paste components. Uses TanStack Table v8 for logic, Radix UI for accessibility primitives, and Tailwind CSS for styling. Ships as editable source code in your project.

**Minimum working example:** ~150-250 lines of boilerplate you copy into your project, then wire TanStack Table on top. All the complexity of TanStack Table plus the responsibility of maintaining your own copy.

**Bundle size:** Zero (it's your code). You pay the TanStack Table bundle cost (~14KB) plus Tailwind.

**Why it matters:** shadcn/ui is the most-starred UI component collection as of 2024-2025. Its Table component is what most React developers reach for when they want "a nice table." But it's just a styled shell — you must wire in all TanStack Table features yourself.

**Weaknesses:** Configuration complexity is identical to raw TanStack Table. Zero-config not possible.

---

### 10. vue-good-table

**What it is:** A Vue 2/3 table component with sorting, filtering, pagination, and a clean API. Not headless — ships styled components.

**Minimum working example:**

```vue
<template>
  <vue-good-table :columns="columns" :rows="rows" />
</template>
<script>
export default {
  data() {
    return {
      columns: [
        { label: 'Name', field: 'name' },
        { label: 'Age', field: 'age', type: 'number' },
      ],
      rows: [{ name: 'John', age: 20 }],
    };
  },
};
</script>
```

~15-20 lines. Requires column definitions but they're minimal. Explicitly declaring `type: 'number'` for sorting purposes.

**Bundle size:** ~50-80KB gzipped. (LOW confidence — less frequently benchmarked.)

**Feature list:** Sorting, filtering (global + per-column), pagination, row selection, custom slot-based cell renderers, column resizing, row grouping, fixed headers, loading indicator, theme (default, black, nocturne, polar-bear), responsive mode.

**Weaknesses (MEDIUM confidence):** Vue 2 roots make Vue 3 integration slightly awkward (different package names). Smaller ecosystem than React-world alternatives. Maintenance pace is slower. No virtual scrolling for large datasets.

---

### 11. el-table (Element Plus / Element UI)

**What it is:** The table component bundled with Element UI (Vue 2) / Element Plus (Vue 3) design system. Not a standalone library — ships with the full design system.

**Minimum working example:**

```vue
<template>
  <el-table :data="tableData">
    <el-table-column prop="date" label="Date" />
    <el-table-column prop="name" label="Name" />
  </el-table>
</template>
```

~8-10 lines. Very clean API — but requires importing the full Element Plus design system.

**Feature list:** Sorting, filtering, fixed columns, fixed headers, multi-level headers, expandable rows, tree data, row selection, custom cell templates (via slots), pagination (separate el-pagination component), loading state, stripe/border/size variants.

**Weaknesses:** Only for Vue. Requires full Element Plus adoption — you cannot use just the table in a non-Element app without pulling in the entire CSS and JS bundle. No virtual scrolling. No row virtualisation for large datasets.

---

### 12. Mantine DataTable

**What it is:** A React table component built on Mantine design system. Opinionated styling, feature-rich, good DX for Mantine users.

**Feature list:** Sorting, filtering, pagination, row selection, pinned columns, row context menus, expandable rows, row actions, loading skeleton, custom cell renderers, column resizing, sticky header.

**Weaknesses:** Mantine-only ecosystem. If you're not using Mantine, the bundle overhead is prohibitive.

---

### 13. Headless UI (Radix Table)

Radix does not ship a table component. It ships accessibility primitives. Any "Radix table" is a custom component using Radix for accessibility utilities only.

---

### 14. Svelte-specific: svelte-headless-table, svelte-datagrid

**svelte-headless-table:** The Svelte equivalent of TanStack Table's approach — headless, all logic, you supply markup. Feature parity roughly with TanStack v7. ~10KB. Requires same boilerplate overhead as TanStack.

**svelte-datagrid:** Canvas-based like Glide Data Grid but for Svelte. Niche and lower maintenance.

---

### API Complexity Summary

| Library                 | Lines for Basic Working Table   | Lines for Sort+Filter+Paginate | Framework Req    |
| ----------------------- | ------------------------------- | ------------------------------ | ---------------- |
| DataTables (jQuery)     | 3 (HTML table exists)           | ~15                            | jQuery           |
| Tabulator               | 5-8                             | ~25                            | None             |
| Grid.js                 | 6-8                             | ~20                            | None             |
| el-table (Element Plus) | 8-10                            | ~20                            | Vue + Element    |
| AG Grid                 | 15-20                           | ~50                            | None (adapters)  |
| vue-good-table          | 15-20                           | ~30                            | Vue              |
| Handsontable            | 8-10                            | ~20                            | None             |
| Glide Data Grid         | 30-50                           | ~80                            | React            |
| TanStack Table v8       | 80-120                          | ~200                           | None (adapters)  |
| shadcn/ui Table         | 150-250 (copy-paste)            | ~300                           | React + Tailwind |
| **Our v1 library**      | **2** (colname + rowdata)       | **Not supported**              | **Svelte**       |
| **Our v2 target**       | **1** (`<Table data={rows} />`) | **~5** (one prop each)         | **None**         |

**Confidence:** HIGH for TanStack, AG Grid, Tabulator, Handsontable. MEDIUM for others.

---

## Feature Classification

### TABLE STAKES

Features every serious table library must have. Users will leave or reject the library if these are missing. No exceptions.

| Feature                                            | Why Non-Negotiable                                                                                                       | Current v1 Status          |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| **Column sorting**                                 | Users expect to click a header to sort. The most basic table interaction. Every library from DataTables onward has this. | MISSING                    |
| **Column filtering / search**                      | Searching/filtering data is the second most basic table operation. Required for any table with > 20 rows.                | MISSING                    |
| **Pagination**                                     | Required when data exceeds visible rows without virtual scrolling. Standard expectation.                                 | MISSING                    |
| **Responsive display**                             | Tables must not overflow on mobile. Horizontal scroll or column hiding is acceptable; broken layout is not.              | MISSING                    |
| **Column header labels**                           | Column names must be human-readable, not raw object keys. Current v1 requires manual specification.                      | PARTIAL (manual only)      |
| **Auto-derive column headers from data keys**      | When data is `[{firstName: 'John'}]`, "First Name" should be inferred. Zero-config requirement.                          | MISSING                    |
| **Row click / cell click events**                  | Standard interaction for drill-down patterns.                                                                            | Present in v1              |
| **Empty state display**                            | When data is empty, show a "No data" message rather than an empty table. Users expect this.                              | MISSING                    |
| **Loading state**                                  | Skeleton or spinner while data is async. Any real app loads data asynchronously.                                         | MISSING                    |
| **TypeScript support**                             | In 2025-2026, a library without TypeScript types will be rejected by enterprise teams. Required, not optional.           | MISSING                    |
| **Accessibility (ARIA, keyboard nav)**             | WCAG compliance is a legal requirement in many markets. Libraries without it fail procurement review.                    | MISSING                    |
| **CSS customisation**                              | Developer must be able to override colors, sizes, borders. Hard-coded Tailwind CDN classes in v1 are non-customisable.   | BROKEN (CDN anti-pattern)  |
| **Zero-config initialization**                     | Core differentiator elevated to table stakes because it is the entire premise of this library.                           | PARTIAL (requires colname) |
| **Row selection (at minimum checkbox select-all)** | Standard expectation for data tables used in admin UIs.                                                                  | MISSING                    |
| **Column resizing**                                | Users drag column borders to adjust width. Expected in any data-dense table.                                             | MISSING                    |

---

### DIFFERENTIATORS

Features that create competitive advantage. Not universally expected but create strong preference.

| Feature                                                 | Priority         | Competitive Gap                                                                              | Complexity                       |
| ------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------- | -------------------------------- |
| **Auto type inference from data**                       | P0 (core thesis) | None do this. All require column definitions.                                                | High — requires heuristic engine |
| **1-prop override API**                                 | P0 (core thesis) | None have this pattern. Others require per-column config objects.                            | Medium                           |
| **14+ opinionated cell renderers**                      | P1               | AG Grid and Tabulator have many; none auto-apply them.                                       | Medium                           |
| **Zero boilerplate: `<Table data={rows} />`**           | P0               | No library offers this with real rendering.                                                  | Medium                           |
| **Virtual scrolling with zero config**                  | P1               | All competitors require configuration to enable virtualisation.                              | High                             |
| **Framework-agnostic Web Components core**              | P1               | Only AG Grid and Grid.js are truly framework-agnostic. TanStack requires framework adapters. | High                             |
| **Column type switcher in UI**                          | P2 (v1 feature)  | Unique. No other library has runtime type switching in the header.                           | Low                              |
| **Smart default formatters**                            | P1               | Format numbers with commas, dates as "Jan 3, 2025", URLs as clickable links — automatically. | Medium                           |
| **Inline editing with zero config**                     | P2               | Handsontable has this but is paywalled; AG Grid requires editor config.                      | High                             |
| **Row grouping with auto-detect**                       | P2               | All libraries require explicit grouping config.                                              | High                             |
| **Theme system (light/dark/custom)**                    | P1               | AG Grid has themes; TanStack (headless) leaves this to you.                                  | Medium                           |
| **Column pinning**                                      | P2               | Present in AG Grid, TanStack, Tabulator. Not common in simpler libs.                         | Medium                           |
| **Export (CSV, JSON)**                                  | P2               | Tabulator and AG Grid have this; simpler libs do not.                                        | Low                              |
| **Plugin renderer API**                                 | P1               | Necessary for library extensibility. None offer this zero-config style.                      | High                             |
| **Sub-row / expandable rows**                           | P2               | Common in AG Grid, TanStack, Tabulator.                                                      | Medium                           |
| **Column reordering (drag)**                            | P3               | Nice to have; AG Grid and Tabulator support this.                                            | High                             |
| **Sticky header / footer**                              | P2               | Expected for scrollable tables. Most libraries support it.                                   | Low                              |
| **Aggregate footer row (sum, avg, count)**              | P2               | Tabulator has this well; others require custom code.                                         | Medium                           |
| **Copy to clipboard**                                   | P3               | AG Grid Enterprise, Handsontable have this.                                                  | Low                              |
| **Column search highlight**                             | P3               | Highlights matching text in cells during filter. DX polish.                                  | Low                              |
| **Configurable density (compact/comfortable/spacious)** | P2               | AG Grid has this (Quartz theme size variants).                                               | Low                              |

**Priority key:** P0 = must be in initial v2 release, P1 = must be in v2, P2 = v2 target or early v3, P3 = v3+

---

### ANTI-FEATURES

Things to deliberately NOT build. Each is a complexity trap that would undermine the zero-config thesis or create scope creep.

| Anti-Feature                                               | Why Avoid                                                                                                                                                 | What to Do Instead                                                                             |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Formula engine (Excel formulas)**                        | This is a full product — Handsontable + HyperFormula. Adds massive complexity, bundle weight, and a completely different user mental model.               | Aggregate footer functions (sum, avg, count) cover 90% of the need                             |
| **Server-side data model as v2 core**                      | Requires handling pagination state, sort state, filter state server-sync — creates an entire API contract problem. Explicitly out-of-scope in PROJECT.md. | Provide `onFetch` callback hook so developers wire their own server-side logic                 |
| **Built-in charting / sparklines**                         | AG Grid Enterprise does this; it balloons the bundle. Chart libraries exist.                                                                              | Cell renderers can accept custom components; developers can render a chart component in a cell |
| **Real-time collaboration**                                | Explicit non-goal. Conflict resolution is an application-level problem.                                                                                   | —                                                                                              |
| **Full drag-to-reorder rows (default on)**                 | Creates accidental reorders. Requires undo state management. High interaction complexity.                                                                 | Offer as opt-in prop `draggableRows`                                                           |
| **Right-click context menus**                              | Every platform has different context menu conventions. AG Grid's implementation is widely complained about for interfering with browser defaults.         | Fire cell/row events; let developers build context menus with their own component              |
| **Undo/redo for editing**                                  | Application-state-level concern. Correct implementation requires event sourcing.                                                                          | Emit `onChange` events; let the application manage undo state                                  |
| **Built-in XLSX export**                                   | SheetJS (the library behind most XLSX export features) is itself a significant bundle and has a complex licensing history (dual license changes).         | Export CSV (zero dependency); document how to wire SheetJS if needed                           |
| **Column calculator expressions (like Airtable formulas)** | Computed column values based on other columns with expression syntax is a feature category unto itself.                                                   | Support static `computed` column definitions (value derived from row object); not expressions  |
| **Print layout / print mode**                              | Very narrow use case; CSS `@media print` is sufficient for most cases.                                                                                    | Document Tailwind `print:` utilities as the solution                                           |
| **Mobile-native wrappers**                                 | Explicit non-goal. Web-first.                                                                                                                             | —                                                                                              |
| **Backend/ORM integrations**                               | Explicit non-goal.                                                                                                                                        | —                                                                                              |
| **Copy-paste from Excel format**                           | Clipboard data parsing is complex and OS-dependent. Handsontable does this but it's a major source of bugs.                                               | Basic text copy of selected cells only                                                         |
| **Auto-save / persistence to localStorage**                | Application-level concern. Column state persistence is acceptable; row data persistence is not.                                                           | Save column config to localStorage only; data is always caller-controlled                      |

---

## Column Renderer Catalog

This is a comprehensive catalog of all cell renderer types needed for dashboard builders, data analysts, and enterprise application developers. The 14 types in v1 are a starting point; v2 should expand significantly.

### Priority Tiers

**Tier 1 (Ship in v2 — most common use cases)**

| Type            | Detection Heuristic                                                                                                                             | Rendered Output                               | Notes                                                         |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------- |
| `text`          | Any string not matching other patterns                                                                                                          | `<span>Value</span>`                          | Default/fallback. Replaces v1 "string"                        |
| `number`        | `typeof value === 'number'` or numeric string                                                                                                   | Right-aligned number, locale-formatted        | Auto-detect; add comma separator, configurable decimal places |
| `integer`       | Integer value                                                                                                                                   | Right-aligned integer, no decimals            | Sub-type of number                                            |
| `currency`      | Numeric value with currency field name heuristic (`price`, `cost`, `amount`, `revenue`, `salary`)                                               | `$1,234.56` with locale currency              | Auto-detect via field name + numeric value                    |
| `percentage`    | Number between 0-1 or 0-100 with `%` field name heuristic                                                                                       | `42.5%` or progress bar                       | Configurable as badge or progress bar                         |
| `boolean`       | `true`/`false`, `0`/`1`, `"yes"`/`"no"`, `"true"`/`"false"`                                                                                     | Checkmark icon / X icon, or toggle            | Auto-detect; v1 "checkbox" was just an input                  |
| `date`          | ISO 8601 string, Date object, UNIX timestamp with date field name                                                                               | Human-formatted: "Jan 3, 2025"                | Auto-detect via field name + ISO pattern                      |
| `datetime`      | ISO 8601 with time component                                                                                                                    | "Jan 3, 2025, 2:30 PM"                        | Separate from date                                            |
| `time`          | HH:MM:SS string or time-field-name                                                                                                              | "14:30"                                       | v1 had this                                                   |
| `email`         | Contains `@` and `.` in plausible email pattern                                                                                                 | `<a href="mailto:...">✉ email</a>`            | v1 had this as "mail"                                         |
| `url`           | Starts with `http://` or `https://`                                                                                                             | `<a href="...">🌐 Link</a>` or truncated URL  | v1 had this                                                   |
| `phone`         | Matches phone number pattern (`+1 555-...`, `(555) 555-5555`)                                                                                   | `<a href="tel:...">📞 phone</a>`              | v1 had this                                                   |
| `image`         | URL ending in image extension OR field name heuristic (`avatar`, `photo`, `thumbnail`, `image_url`)                                             | `<img>` with configurable size                | v1 had this                                                   |
| `badge` / `tag` | Short string in enum-like field (< 20 chars, field named `status`, `type`, `category`, `label`)                                                 | Pill/chip with color mapping                  | Replaces/upgrades v1 "tag"                                    |
| `status`        | Same as badge but with semantic color auto-assignment: `active`→green, `inactive`→gray, `pending`→yellow, `error`/`failed`→red, `success`→green | Color-coded status pill                       | Powerful differentiator — zero config                         |
| `code`          | Field named `code`, `snippet`, `query`, `command` OR multiline string with code-like content                                                    | `<code>` block, monospace, syntax-highlighted | v1 had code; add syntax highlighting                          |
| `html`          | Field explicitly typed as html                                                                                                                  | Raw HTML rendered via innerHTML equivalent    | v1 had this; keep with XSS warning                            |

**Tier 2 (v2 optional / v3 core — important but less universal)**

| Type               | Description                                                         | Notes                                             |
| ------------------ | ------------------------------------------------------------------- | ------------------------------------------------- |
| `avatar`           | Image URL displayed as circle with fallback initials if image fails | First letter(s) of name field as fallback         |
| `avatar-with-name` | Avatar + name combined in single cell                               | Common pattern in user tables                     |
| `list`             | Array value rendered as `<ul>` or comma-separated                   | v1 had this; upgrade to cleaner rendering         |
| `dropdown`         | Array of options for editable cell                                  | v1 had this; upgrade to proper select component   |
| `progress`         | Number 0-100 rendered as progress bar                               | No dep; pure CSS                                  |
| `sparkline`        | Array of numbers rendered as mini line chart                        | Requires canvas or SVG; significant complexity    |
| `rating`           | Number 1-5 rendered as stars                                        | Common in product/review tables                   |
| `color`            | CSS color string (hex, rgb, named) rendered as color swatch + label | Useful for design system tables                   |
| `icon`             | Icon name from a set (e.g., Heroicons)                              | Requires icon library dependency                  |
| `file`             | File path or name with file-type icon                               | `.pdf` → PDF icon, `.xls` → spreadsheet icon      |
| `duration`         | Number of seconds rendered as "2h 15m" or "00:02:15"                | Analytics dashboards                              |
| `relative-time`    | ISO date rendered as "2 hours ago", "Yesterday", "3 months ago"     | Very common in activity feeds                     |
| `bytes`            | Number rendered as "1.2 MB", "340 KB"                               | File size, download size columns                  |
| `json`             | Object/array rendered as collapsed/expandable JSON tree             | Debug tables, API response tables                 |
| `actions`          | Buttons / icon buttons for row-level actions (Edit, Delete, View)   | Common pattern; renders a slot                    |
| `input`            | Editable text input (inline edit)                                   | v1 had this; should be opt-in via `editable` prop |
| `select`           | Editable dropdown select                                            | Needs controlled options                          |
| `number-input`     | Editable numeric input                                              |                                                   |
| `date-input`       | Editable date picker                                                |                                                   |
| `toggle`           | Boolean as a toggle switch (for editable cells)                     |                                                   |
| `textarea`         | Multiline editable text                                             |                                                   |
| `multiselect`      | Array of selected values from a defined option set                  |                                                   |
| `range`            | Numeric range slider                                                |                                                   |

**Tier 3 (v3 / enterprise tier — specialized)**

| Type              | Description                                                                 |
| ----------------- | --------------------------------------------------------------------------- |
| `map-pin`         | Lat/lng rendered as a small map thumbnail                                   |
| `sparkbar`        | Bar chart variant of sparkline                                              |
| `heatmap-cell`    | Cell background color scales with value (like Excel conditional formatting) |
| `mention`         | Text with `@user` mentions rendered as clickable chips                      |
| `markdown`        | Markdown string rendered to HTML (basic subset)                             |
| `formula`         | Value computed from other row fields via expression                         |
| `tree-cell`       | Cell with expand/collapse for tree-data rows                                |
| `nested-table`    | Expandable sub-table within a cell                                          |
| `image-gallery`   | Multiple image URLs in a cell, shown as thumbnails                          |
| `video-thumbnail` | Video URL with thumbnail preview                                            |
| `qr-code`         | String rendered as QR code                                                  |

### Auto-Detection Heuristic Priority

When `<Table data={rows} />` is called with no column config, inference should run in this order:

1. **Value type check** — `typeof`, `instanceof Date`, `Array.isArray()`, regex patterns
2. **Field name heuristic** — key matching against a curated keyword list
3. **Enum detection** — if all values in a column appear in a set of ≤ 15 unique values → `badge`/`status`
4. **URL pattern check** — starts with `https?://`, ends with image extension
5. **Phone pattern check** — matches phone regex
6. **Email pattern check** — matches email regex
7. **ISO date pattern check** — matches ISO 8601 regex
8. **Numeric check** — all values are numbers or numeric strings
9. **Boolean check** — all values are boolean or boolean-like strings
10. **Default** → `text`

**Field name keywords (HIGH confidence heuristic list):**

- Avatar/image: `avatar`, `photo`, `thumbnail`, `image`, `picture`, `img`, `profile_pic`, `icon`, `logo`
- Currency: `price`, `cost`, `amount`, `revenue`, `salary`, `fee`, `total`, `subtotal`, `tax`, `discount`
- Status: `status`, `state`, `condition`, `phase`, `stage`
- Email: `email`, `mail`, `e_mail`, `email_address`
- Phone: `phone`, `tel`, `mobile`, `cell`, `fax`, `contact_number`
- Date: `date`, `created_at`, `updated_at`, `deleted_at`, `published_at`, `born_at`, `start_date`, `end_date`, `due_date`, `deadline`
- Datetime: `created_at`, `updated_at` (if value has time component), `timestamp`, `datetime`
- Boolean: `is_active`, `active`, `enabled`, `disabled`, `visible`, `checked`, `verified`, `confirmed`
- URL: `url`, `link`, `href`, `website`, `page`, `endpoint`
- Code: `code`, `snippet`, `query`, `command`, `script`, `expression`
- Name: `name`, `full_name`, `first_name`, `last_name`, `username`, `display_name`
- Progress: `progress`, `completion`, `percent_complete`, `percentage`
- Rating: `rating`, `score`, `stars`, `rank`

---

## Minimum Viable API

**The goal:** 80% of use cases handled with zero configuration. The remaining 20% handled with one prop per override.

### Zero-Config API (handles ~60% of real tables)

```svelte
<!-- Svelte -->
<Table data={rows} />

<!-- React -->
<Table data={rows} />

<!-- Web Component -->
<data-table data={JSON.stringify(rows)}></data-table>
```

Library infers: column names (from object keys, prettified), column types (from heuristics), default sorting (alphabetical for strings, numeric for numbers), default pagination (if > 50 rows).

**Input contract:** `data` is an array of plain objects. All objects should share the same keys. Extra keys in some objects are handled gracefully.

### One-Prop Overrides (handles ~20% more)

```svelte
<!-- Override column types for specific columns -->
<Table data={rows} columns={{ avatar_url: 'image', status: 'status', price: 'currency' }} />

<!-- Override column labels -->
<Table data={rows} labels={{ first_name: 'First Name', org_id: 'Organisation' }} />

<!-- Enable features -->
<Table data={rows} sortable searchable paginate={25} />

<!-- Events -->
<Table data={rows} on:rowClick={handleRowClick} on:cellClick={handleCellClick} />

<!-- Theming -->
<Table data={rows} theme="dark" density="compact" />
```

### Column Definition API (for the remaining 20% needing full control)

```svelte
<Table
  data={rows}
  columns={[
    { key: 'id', label: 'ID', type: 'number', hidden: true },
    { key: 'name', label: 'Employee', type: 'avatar-with-name', sortable: true },
    { key: 'status', label: 'Status', type: 'status', filterable: true },
    { key: 'salary', label: 'Salary', type: 'currency', align: 'right' },
    {
      key: 'actions',
      label: '',
      type: 'actions',
      actions: [
        { label: 'Edit', onClick: (row) => editRow(row) },
        { label: 'Delete', onClick: (row) => deleteRow(row), variant: 'danger' },
      ],
    },
  ]}
/>
```

### Props Surface (complete v2 API target)

```typescript
interface TableProps<T extends Record<string, unknown>> {
  // Required
  data: T[];

  // Column control (progressive — use the simplest form you need)
  columns?: ColumnShorthand | ColumnDefinition[];
  // ColumnShorthand: { [key: string]: ColumnType }  — e.g. { status: 'badge' }
  // ColumnDefinition[]: full control per column

  labels?: Record<string, string>; // override column header labels
  hidden?: string[]; // hide specific columns

  // Feature flags
  sortable?: boolean | string[]; // true = all cols, string[] = specific cols
  searchable?: boolean; // global search
  filterable?: boolean | string[]; // column-level filter dropdowns
  paginate?: number | false; // rows per page (false = no pagination)
  selectable?: boolean | 'multi'; // row selection
  editable?: boolean | string[]; // inline editing
  resizable?: boolean; // column resize handles

  // Display
  theme?: 'light' | 'dark' | 'auto' | string; // string = custom theme name
  density?: 'compact' | 'comfortable' | 'spacious';
  striped?: boolean;
  bordered?: boolean;
  stickyHeader?: boolean;
  maxHeight?: string; // enables vertical scroll

  // States
  loading?: boolean;
  emptyMessage?: string;

  // Events
  onRowClick?: (row: T, index: number) => void;
  onCellClick?: (value: unknown, column: string, row: T) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
  onChange?: (updatedRow: T, column: string, newValue: unknown) => void; // edit callback
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, string>) => void;
  onPageChange?: (page: number, pageSize: number) => void;
}
```

**API design principles:**

1. Every prop has a sensible default so it can be omitted.
2. Boolean props can be upgraded to arrays for column-specific control (e.g., `sortable={['name', 'date']}` to sort only those two columns).
3. The `columns` prop accepts both the shorthand object form AND full definition array — the API detects which was passed.
4. Events follow framework conventions (Svelte `on:event`, React `onEvent`, Web Component `addEventListener`).

---

## Feature Gap Analysis: v1 → v2

### What v1 Has (and its quality)

| Feature                         | v1 Quality                                                                                             | v2 Action                                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| 14 cell renderer types          | Functional but unpolished. String concatenation HTML generation. No sanitization.                      | Rewrite as proper components. Add 15+ new types.                                                    |
| `colname` prop for type mapping | Works but brittle. Object with type-as-key forces type before label. Single type per column.           | Replace with `columns` prop (shorthand object or array). Deprecate `colname`.                       |
| `rowdata` prop                  | Array-of-arrays is non-idiomatic. Modern data is array-of-objects.                                     | Accept array-of-objects as primary format. Support array-of-arrays via adapter for backward compat. |
| Click callback                  | Present. Global — fires on any cell click with no context.                                             | Upgrade: `onRowClick(row, index)` and `onCellClick(value, columnKey, row)`.                         |
| URL navigation per row          | Present. Global URL (same URL for all rows) — nearly useless for real use.                             | Upgrade: `url` prop accepts string (template: `"/users/{id}"`) or function `(row) => string`.       |
| Tailwind CSS styling            | CDN link in `<svelte:head>` — an anti-pattern that injects Tailwind globally, conflicts with host app. | Distribute pre-built CSS. Make Tailwind purely a dev/build tool, not runtime dependency.            |
| Column type switcher in header  | Unique feature — interactive type switcher per column.                                                 | Keep in v2 but make it opt-in (`typeSwitch` prop).                                                  |
| Sorting                         | MISSING                                                                                                | Add via v2 core.                                                                                    |
| Filtering                       | MISSING                                                                                                | Add via v2 core.                                                                                    |
| Pagination                      | MISSING                                                                                                | Add via v2 core.                                                                                    |
| Virtual scrolling               | MISSING                                                                                                | Add via v2 core for large data.                                                                     |
| TypeScript                      | MISSING                                                                                                | v2 is TypeScript-first.                                                                             |
| Accessibility                   | MISSING                                                                                                | v2 targets WCAG 2.1 AA.                                                                             |
| Tests                           | MISSING                                                                                                | v2 requires test suite.                                                                             |
| Auto type inference             | MISSING (entire v1 premise is manual type specification)                                               | The entire v2 thesis.                                                                               |
| Framework-agnostic              | MISSING (Svelte only)                                                                                  | v2 Web Components core.                                                                             |
| Dark mode / theming             | MISSING                                                                                                | v2 theme system.                                                                                    |
| Row selection                   | MISSING                                                                                                | v2 core feature.                                                                                    |
| Column resize                   | MISSING                                                                                                | v2 core feature.                                                                                    |
| Empty state                     | MISSING                                                                                                | v2 core feature.                                                                                    |
| Loading state                   | MISSING                                                                                                | v2 core feature.                                                                                    |
| Error handling                  | MISSING                                                                                                | v2 core — validates data, warns on mismatches.                                                      |

### v1 → v2 Migration Path

The v1 API (`colname`, `rowdata`) must be supported in v2 behind a deprecation warning for at least one minor cycle:

```javascript
// v1 props → v2 adapter mapping
if (colname && rowdata) {
  console.warn('[Table] colname/rowdata props are deprecated. Use data= with array-of-objects.');
  // Convert array-of-arrays to array-of-objects using colname keys
  const keys = Object.keys(colname);
  const types = {};
  keys.forEach((k) => {
    types[k] = k;
  }); // type IS the key in v1
  data = rowdata.map((row) => Object.fromEntries(keys.map((k, i) => [k, row[i]])));
  columns = types; // pass the shorthand type map
}
```

**Breaking changes that are acceptable in v2:**

- Removing `window.onload` coupling (was a bug, not a feature)
- Removing inline `console.log` in component initialization
- Removing Tailwind CDN `<link>` from component head
- Requiring `data` to be array-of-objects (with adapter for old array-of-arrays)
- Requiring explicit `typeSwitch={true}` to show the column type selector (was always-on in v1, which is inappropriate for production)

---

## Sources

All findings based on training knowledge through August 2025. Libraries covered:

- AG Grid (v30-v32 era): https://www.ag-grid.com/
- TanStack Table v8: https://tanstack.com/table/v8
- Handsontable v14: https://handsontable.com/
- Tabulator v6: https://tabulator.info/
- DataTables v2: https://datatables.net/
- Grid.js v6: https://gridjs.io/
- Glide Data Grid v6: https://github.com/glideapps/glide-data-grid
- shadcn/ui Table: https://ui.shadcn.com/docs/components/data-table
- vue-good-table-next: https://github.com/xaksis/vue-good-table
- Element Plus el-table: https://element-plus.org/en-US/component/table.html
- svelte-headless-table: https://svelte-headless-table.bryanmylee.com/
- Mantine DataTable: https://icflorescu.github.io/mantine-datatable/

**Confidence levels:**

- AG Grid features/pain points: HIGH (extensive public documentation + widespread community discussion)
- TanStack Table v8 features/pain points: HIGH (primary documentation + widespread adoption)
- Handsontable features/licensing: HIGH (official docs + licensing controversy well-documented)
- Tabulator features: HIGH (comprehensive official docs)
- DataTables features/weaknesses: HIGH (10+ year public track record)
- Grid.js features: HIGH (small and well-documented)
- Glide Data Grid features/weaknesses: MEDIUM (less mainstream than others)
- vue-good-table, el-table details: MEDIUM (less direct exposure in training)
- Bundle sizes: MEDIUM (exact numbers shift with versions; relative ordering is HIGH confidence)
- Auto-detection heuristics: HIGH (based on domain knowledge of data patterns, not library-specific)
- v1 codebase gaps: HIGH (read directly from source)
