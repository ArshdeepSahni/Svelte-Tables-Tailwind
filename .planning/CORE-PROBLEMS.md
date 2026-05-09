# CORE PROBLEMS: Fundamental Table Challenges Worth 100X Returns

## Executive Summary

This document identifies **10 fundamental, unsolved problems in HTML tables and table libraries** that represent breakthrough opportunities. These aren't minor feature requests—they're architectural limitations that have persisted since the 1990s because nobody has found elegant solutions.

**The 100X opportunity framework**: A table library that solves even ONE of these problems cleanly would make developers say *"This is impossible... how did they do this?"*

---

## 1. The Layout Problem: Tables vs. Modern CSS

### Why It's Fundamentally Hard

HTML's `display: table` is a legacy layout primitive that conflicts with modern CSS:

- **Can't use flexbox/grid inside cells** — `display: flex` on a `<td>` breaks cell alignment semantics
- **Can't animate height** — table cells recalculate based on row height, destroying smooth animations
- **Sticky headers break in overflow contexts** — `position: sticky` on `<thead>` doesn't work when the table is inside an overflow container (gotcha: `overflow` creates a stacking context that blocks sticky)
- **No subgrid support** — can't create nested layouts that align with parent columns
- **Border-collapse hides overflow** — can't create dropdown menus or complex cells

### Current Best Attempts

1. **CSS Grid replacement** — Use `display: grid` instead of tables, but this loses semantic table meaning (ARIA, accessibility)
2. **Container Queries (NEW in 2025)** — Allow tables to respond to container width instead of viewport (93.92% browser support), enabling true responsive component-level design
3. **Light DOM custom elements** — Build table as div-based structure, but lose built-in table semantics

### Breakthrough Opportunity

**Composite Table Architecture**: A table library that:
- Keeps HTML `<table>` semantics for accessibility
- Uses CSS Grid for internal layout (cells are grid items)
- Applies `display: contents` strategically to unwrap row/cell elements
- Leverages container queries for responsive column behavior
- Maintains Light DOM for DOM query compatibility

**Current state**: No production table library has solved this without trade-offs.

**Why it's a 100X return**: Developers would gain responsive, animated, composable tables without losing accessibility or performance. This would eliminate the "semantic vs. modern CSS" false choice.

---

## 2. The Reactivity Problem: O(1) Cell Updates

### Why It's Fundamentally Hard

When one cell changes in a 100k-row table, most libraries re-render too much:

- React Table (TanStack): Re-renders affected row
- AG Grid: Re-renders row and dependency graph
- Even Svelte's fine-grained reactivity re-renders the containing `<tr>`

The theoretical minimum: **only the changed `<td>` should re-render** (O(1) work for a single cell change).

### Current Best Attempts

1. **Fine-grained reactivity** (Solid, Svelte 5) — Track which cells depend on which data
   - Solid's reactive graph can update individual signals
   - Svelte's runes enable fine-grained updates
   - **Problem**: Still need to map data properties → cell DOM nodes in O(1)

2. **CRDT-based state** (HarperDB 4.3) — Conflict-free replicated data types
   - Allows fine-grained property updates on records
   - Can express "only property X changed on row Y"
   - **Problem**: Not used in table libraries; infrastructure is database-focused

3. **Signal-based frameworks** (Preact Signals) — Signals propagate without re-rendering parent
   - But signals require component architecture changes
   - **Problem**: Doesn't solve for traditional DOM updates

### Breakthrough Opportunity

**Cell-level Signal Graph**:
- Each cell is a signal: `cellSignal[rowId][colName]`
- Data updates only touch signals that changed
- DOM update only for affected cells
- Reverse dependency tracking: "if data.X changed, update these cells"

Pseudocode:
```javascript
const cellSignal = createSignal(row[col])
effect(() => {
  dom.querySelector(`[data-row="${rowId}"][data-col="${colName}"]`).textContent = cellSignal()
})
```

**Advantage**: O(1) per cell change, scales to 1M rows.

**Current state**: No table library implements this architecture.

**Why it's a 100X return**: 10-100x faster updates. A table that feels instant when changing individual cells would feel like magic.

---

## 3. The Virtualization Problem: Dynamic Row Heights Without Layout Thrashing

### Why It's Fundamentally Hard

Virtual scrolling (TanStack Virtual, react-window) assumes **fixed or pre-measured row heights**:

- User opens expandable row → height changes unpredictably
- Text wraps to 2 lines instead of 1 → row height shifts
- Loaded images resize cells → virtualization breaks

Attempts to measure dynamically (CellMeasurer):
- Renders cells off-screen to measure
- **Layout thrashing**: paint → measure → relayout → paint
- Destroys 60fps scrolling

### Current Best Attempts

1. **CellMeasurer cache** (React Virtualized)
   - Pre-measure cells before rendering
   - Cache heights
   - **Problem**: Causes jank on initial scroll; scrollbar thumb size jumps as measurements arrive

2. **resetAfterIndex** (react-window)
   - Recalculate row heights after expansion
   - **Problem**: User sees scrollbar jump; UX is jarring

3. **MUI Data Grid approach**
   - Lazy measurement as rows render
   - **Problem**: Scrollbar thumb changes size during scroll (bad UX)

### Breakthrough Opportunity

**Speculative Virtualization with Lazy Measurement**:
- Estimate row heights using first 50ms of content
- Render speculatively with estimates
- Measure in background without blocking scroll
- **Key insight**: Accept small scrollbar position inaccuracy (pixel-level) while scrolling, lock in true heights on scroll stop
- Use `ResizeObserver` to detect actual size changes

**Pseudo-algorithm**:
```javascript
// Estimate height while scrolling (don't block)
estimatedHeights[rowId] = estimateFromContent(row)

// Measure in background
ResizeObserver.observe(rowElement, () => {
  actualHeights[rowId] = rowElement.offsetHeight
  if (error > threshold) {
    recalculateVisibleRange() // Only if significantly wrong
  }
})
```

**Advantage**: Smooth scrolling with dynamic content, no layout thrashing.

**Current state**: No major library has solved this cleanly.

**Why it's a 100X return**: Expandable rows + smooth scrolling + 100k rows = impossible with current libraries. Solving this makes complex hierarchical tables practical.

---

## 4. The Copy-Paste Problem: Universal Clipboard Interop

### Why It's Fundamentally Hard

Tables have 4 incompatible clipboard formats:

| Format | Copy from Excel | Paste to Excel | Copy from Web | Paste to Web |
|--------|---|---|---|---|
| **Tab-separated** | ✓ (default) | ✓ | ✓ | ✗ (loses structure) |
| **HTML table** | ✗ | ✗ | ✓ | ✗ (parsing fragile) |
| **CSV** | ✗ | ✓ | ✗ | ✗ |
| **Excel native (BIFF8)** | ✓ (with formatting) | ✓ (preserves styles) | ✗ | ✗ |

The core problem: **No standard for table round-trip in web clipboard API**.

### Current Best Attempts

1. **Tab-separated text** — Works everywhere but loses formatting
2. **HTML MIME type** — Includes formatting but parser fragility issues (nested tables, rowspan/colspan)
3. **Excel PasteSpecial** (desktop) — Only works in Excel desktop; web version partially supported

Sources mention:
- PasteSpecial methods (Excel Interop) preserve formatting via BIFF8 binary format
- Excel for web maintains some formatting on paste but inconsistently
- Web browsers have no standard way to write binary Excel format to clipboard

### Breakthrough Opportunity

**Web Clipboard Standard for Tabular Data** (if implementable):

Clipboard should carry multiple MIME types simultaneously:
```
text/plain: "A\tB\tC\n1\t2\t3"
text/html: "<table><tr><td>A</td>...</tr></table>"
application/json: [{A:1, B:2, C:3}]
```

Then:
1. **Copy from web table** → write all 3 formats
2. **Paste to Excel** → Excel picks native format, falls back to TSV
3. **Paste to web table** → Parse JSON, or parse HTML, fallback to TSV

**Challenge**: Browsers don't expose clipboard write to non-standard MIME types yet (requires Web Clipboard API enhancement).

**Alternative within current constraints**:
- **On copy**: Detect target application heuristically (based on user context)
- **On paste**: Support HTML, TSV, JSON, auto-detect structure
- **Format preservation**: Use data attributes on cells for styling hints

### Current state

Sources show:
- Excel Interop allows rich PasteSpecial with format control
- Excel for web partially supports formatting
- No web table library has solved universal round-trip copy-paste

**Why it's a 100X return**: "Copy from Excel → paste into web table → modify → copy → paste back to Excel with all formatting intact" would feel like true interop (currently impossible).

---

## 5. The Accessibility Problem: Virtual Tables with Screen Readers

### Why It's Fundamentally Hard

ARIA grid pattern requires complex keyboard navigation + screen reader announcements:

```html
<div role="grid" aria-label="Data table">
  <div role="row" aria-rowindex="1">
    <div role="gridcell" aria-colindex="1">...</div>
  </div>
</div>
```

But when rows are virtualized (only 20 visible out of 10k):
- Screen reader sees only 20 cells in ARIA tree
- aria-rowcount tells reader there are 10k rows
- **Mismatch**: Reader announces "Row 1 of 10,000" but only 20 are in DOM
- Navigation breaks: arrow-down on row 20 → nothing happens (row 21 not in DOM)

### Current Best Attempts

1. **Static ARIA grid** (WAI-ARIA APG)
   - Full keyboard navigation (arrow keys, Home, End)
   - Works for small tables (< 1000 rows)
   - **Problem**: Doesn't scale; all rows in DOM

2. **Virtual + aria-rowindex/aria-colindex** (AG Grid, TanStack Table)
   - Update aria-rowindex as rows mount/unmount
   - Maintain aria-rowcount for total size
   - **Problem**: Screen readers still struggle; announcement timing is off

3. **Lazy-load ARIA announcements** (Telerik, KendoReact)
   - Load rows on demand into ARIA tree
   - **Problem**: Incomplete solution; not all AT vendors handle it correctly

Sources report:
- Modern grid components comply with WCAG 2.2 AA
- Virtual grids have "fundamental mismatches" with screen readers
- Best practice requires aria-rowindex/aria-colindex updates (but incomplete)

### Breakthrough Opportunity

**Speculative ARIA Rendering**:
- Pre-render 50 rows ahead/behind visible range in ARIA tree (but CSS-hidden)
- Screen reader can see "next" rows without rendering them visually
- Announcement timing: Wait for user to navigate, then announce the hidden pre-rendered row
- On virtualization: Swap ARIA tree (move row 1000+ into view, remove row 1-99)

**Or, more radical**:
- Build a separate "ARIA index" (JSON) that screen readers request
- Browser/AT can navigate the JSON index without DOM
- Only render cells that are needed
- Requires new ARIA extension (hypothetical)

### Current state

No table library has solved truly accessible virtual tables. Best attempts have "known limitations" with screen readers.

**Why it's a 100X return**: "A fully accessible virtual table that works with all screen readers and keyboard users" would be a first-ever achievement.

---

## 6. The Column Width Problem: Sub-linear Content Measurement

### Why It's Fundamentally Hard

Auto-sizing columns to content requires measuring every cell:
- O(n * m) complexity: n rows × m columns
- For a 10k row × 50 column table: 500k text measurements
- Each measurement requires browser layout calculation
- **Current solution**: Limit to first 100-1000 rows, accept inaccuracy

### Current Best Attempts

1. **Fixed-width algorithm (CSS table-layout: fixed)**
   - O(1): Only measure first row
   - **Problem**: Columns don't fit content
   - **Used by**: Nearly all tables that prioritize performance

2. **Smart heuristics** (SlickGrid)
   - GetLongestText: Find longest string, measure once
   - GetLongestTextAndSub: Substitute each char for 'm', estimate
   - Measure only top 100-1000 rows
   - **Accuracy**: ~85-95%, much faster
   - **Problem**: Inaccurate for variable fonts, special characters

3. **Canvas text measurement** (Handsontable, AG Grid)
   - Use canvas.measureText() (faster than DOM measurement)
   - Measure top N rows + samples
   - **Speed**: 10-100x faster than DOM
   - **Problem**: Still O(n) for accurate sizing

4. **Lazy measurement**
   - Let columns be narrow initially
   - Measure on first render
   - Adjust width
   - **Problem**: Layout shift after render

### Breakthrough Opportunity

**Probabilistic Width Estimation**:
- Sample 5% of rows uniformly across dataset
- Use statistical model to estimate column width distribution
- Measure sample set (fast for 500 cells in 10k row table)
- Estimate 95th percentile width
- **Accept known inaccuracy**: 0-2% of content might overflow

**Or, Hybrid Approach**:
- Use fastest method (heuristic) for initial render
- Measure in background as user scrolls
- Refine width estimates incrementally
- Update columns only if error exceeds threshold

**Example**:
```javascript
// Fast: measure every 200th row (50 samples in 10k rows)
const samples = rowData.filter((_, i) => i % 200 === 0)
const measurements = samples.map(row => measureText(row[col]))
const width = Math.max(...measurements) * 1.1 // 10% buffer
```

### Current state

No production table library has solved this below O(n*m) for 100% accuracy. All trade accuracy for speed.

**Why it's a 100X return**: "Auto-column-sizing that works perfectly on 10M rows without hanging the browser" would be an engineering breakthrough.

---

## 7. The Print Problem: Web-to-Print for Data Tables

### Why It's Fundamentally Hard

HTML print (`@media print`) has fundamental gaps:

1. **Repeating headers** — `display: table-header-group` on `<thead>` works but:
   - Only works with native table markup (not div-based tables)
   - Breaks with CSS Grid layouts
   - Doesn't repeat footers reliably

2. **Page breaks mid-row** — `page-break-inside: avoid` doesn't work well:
   - Browsers struggle with complex nested content
   - Expandable rows don't collapse before break
   - Borders disappear at page boundaries

3. **Responsive collapse** — Tables that go vertical on mobile collapse to unreadable format in print

4. **Large datasets** — Printing 10k rows:
   - Generates massive PDF (100+ pages)
   - No built-in pagination controls
   - No column selection before print

### Current Best Attempts

1. **CSS print rules** (CSS-Tricks, W3Docs)
   ```css
   @media print {
     thead { display: table-header-group; }
     tfoot { display: table-footer-group; }
     tr { page-break-inside: avoid; }
     tbody tr:first-child { page-break-before: avoid; }
   }
   ```
   - **Works for**: Simple tables with regular content
   - **Breaks for**: Expandable rows, nested tables, images

2. **JavaScript pagination** (Handsontable)
   - Render N rows per page before printing
   - Send to print preview
   - **Problem**: Manual, user has to configure

3. **Server-side PDF generation** (Puppeteer, wkhtmltopdf)
   - Render page, screenshot to PDF
   - **Problem**: Slow, requires backend, server load, latency

### Breakthrough Opportunity

**Smart Print Layout Engine**:
- Detect table structure and content type
- Before printing:
  1. Measure each row's print height
  2. Pack rows into pages optimally (bin packing algorithm)
  3. Insert page breaks to avoid orphans
  4. Repeat headers/footers
  5. Collapse expandable rows, render as footnotes
- Generate print-optimized HTML
- Hand to browser print

**Or, Client-side Pagination**:
- Build mini-pagination UI within table
- "Print page 1-10 of 50"
- Reduce PDF size, user controls scope

### Current state

Web-to-print for complex tables requires hacks. No standard solution.

**Why it's a 100X return**: "Print a 10k-row table perfectly, with repeating headers, optimal page breaks, and readable output" would eliminate the need for server-side PDF tools.

---

## 8. The Formula Problem: Lightweight Reactive Formulas in Tables

### Why It's Fundamentally Hard

Spreadsheets have formulas (SUM, AVERAGE, IF, VLOOKUP). Tables don't. But:

- **No formula engine** — Tables can't compute derived columns
- **No dependency tracking** — Can't know which cells feed which formulas
- **No circular reference detection** — Can cause infinite loops
- **Complex state management** — Formula state lives outside table logic

Building a formula engine requires:
- Parser (to understand =SUM(A1:A10))
- Evaluator (to execute)
- Dependency graph (to know what changed)
- Memoization (to avoid re-computing)

Full spreadsheet engines (Excel, Google Sheets) are 1M+ LOC. Too heavy for a table library.

### Current Best Attempts

1. **HyperFormula** (Handsontable ecosystem)
   - Open-source formula engine (~300KB minified)
   - Supports 500+ Excel functions
   - **Problem**: Heavy for simple tables; overkill if you only need SUM

2. **Sunrise** (Reactive Spreadsheet)
   - Spreadsheet-driven development
   - Cell + Formula cell types
   - **Problem**: Designed for sheets, not tables

3. **React-Spread-Sheet-Excel**
   - Lightweight, renders 100k+ cells
   - Formula engine included
   - **Problem**: Primarily for spreadsheets, not data tables

### Breakthrough Opportunity

**Micro Formula Engine**:
- Support only ~10-20 most-common functions: SUM, AVG, MIN, MAX, COUNT, IF, CONCAT
- Parse formulas in 100 lines of code
- Execute with dependency tracking
- Integrates with table state (not standalone)

**Example use case**:
```
Column: "Total" = formula(=A + B + C)
Column: "Tax" = formula(=Total * 0.08)
Column: "Final" = formula(=Total + Tax)
```

User changes A → Spreadsheet recalculates B columns, updates UI.

**Architecture**:
```javascript
const formulas = {
  "Total": (row) => row.A + row.B + row.C,
  "Tax": (row, computed) => computed.Total * 0.08,
  "Final": (row, computed) => computed.Total + computed.Tax
}

// Dependency order: Total → Tax → Final
const computedColumns = evaluateFormulas(row, formulas)
```

### Current state

No table library has lightweight formula support. Most require external engine (HyperFormula) if needed.

**Why it's a 100X return**: "A table with formulas that feels as natural as a spreadsheet but without the complexity" would be a huge UX win.

---

## 9. The Selection Problem: True 2D Range Selection (Excel-style)

### Why It's Fundamentally Hard

Web tables have almost no multi-cell selection support. Excel has:
- Click a cell, drag to select range
- Shift+arrow keys to extend selection
- Ctrl+C to copy range
- Ctrl+V to paste into range
- Column/row header selection (select entire column)
- Non-contiguous selection (Ctrl+click)

Implementing this requires:
- **Mouse tracking** — Detect drag, compute cells in range
- **Keyboard state machine** — Shift+arrow changes selection mode
- **Selection serialization** — Know which cells are selected (A1:C10)
- **Copy-paste integration** — Handle multi-cell copy/paste
- **Visual feedback** — Show selection with styling

### Current Best Attempts

1. **DataTables KeyTable extension**
   - Single-cell keyboard navigation
   - No range selection
   - **Problem**: Not 2D selection

2. **AG Grid cell selection**
   - Range selection support (click-drag)
   - Copy/paste entire range
   - **Problem**: Part of paid enterprise tier

3. **Handsontable**
   - Full Excel-like selection
   - Copy/paste ranges
   - **Problem**: Full spreadsheet library (overkill for tables)

4. **Jspreadsheet**
   - Excel-like interface including range selection
   - **Problem**: Spreadsheet-focused, not table-focused

### Breakthrough Opportunity

**Minimal 2D Selection Module**:
- Tracks selection state: `{ startRow, startCol, endRow, endCol }`
- Mouse: On drag, update end position, re-render selection styling
- Keyboard: Shift+arrow extends selection, Ctrl+arrow jumps, etc.
- Export: Selection as ranges ("A1:C10", "A1,C1,F5") for copy/paste

**Integration with table**:
```javascript
const [selection, setSelection] = createSignal(null)

// On cell click: start selection
onCellClick((row, col, e) => {
  if (e.shiftKey && selection) {
    // Extend existing selection
    setSelection({ ...selection, endRow: row, endCol: col })
  } else {
    // Start new selection
    setSelection({ startRow: row, startCol: col, endRow: row, endCol: col })
  }
})

// On copy: get cells in range
onCopy(() => {
  const cells = getCellsInRange(selection)
  clipboard.writeText(formatAsTabSeparated(cells))
})
```

### Current state

No lightweight table library has true Excel-style range selection as a default feature.

**Why it's a 100X return**: Users expect Excel-like selection in data tables. A table with perfect range selection would feel dramatically more powerful.

---

## 10. The Data Shape Problem: Native Nested/Relational Data

### Why It's Fundamentally Hard

Tables assume flat arrays of objects:
```javascript
[
  { name: "Alice", age: 30 },
  { name: "Bob", age: 25 }
]
```

But real data is nested/relational:
```javascript
[
  {
    id: 1,
    user: {
      name: "Alice",
      address: { city: "NYC", zip: "10001" }
    },
    orders: [
      { id: 101, total: 50 },
      { id: 102, total: 75 }
    ]
  }
]
```

Current solution: **Flatten the data**
```javascript
[
  { userId: 1, userName: "Alice", userCity: "NYC", orderId: 101, orderTotal: 50 },
  { userId: 1, userName: "Alice", userCity: "NYC", orderId: 102, orderTotal: 75 }
]
```

**Problems**:
- Data duplication (userName repeated 2x)
- Loss of structure (can't know user and orders are related)
- Explosion of rows (1 user + 2 orders = 2 rows; with 3 orders = 3 rows)
- Slow writes (update user.name requires finding all 3 rows)

### Current Best Attempts

1. **Flattening at query level** (SQL, Snowflake FLATTEN)
   - Flatten on load, store flat
   - **Problem**: Loses original structure

2. **Hierarchical tables** (TreeView, expandable rows)
   - Show parent rows, expand to show children
   - **Problem**: Not a true table (mixes hierarchy with tabular data)

3. **Nested fields with dot notation** (BigQuery, pandas json_normalize)
   - Access nested data via "user.address.city"
   - **Problem**: Still requires flattening for display

4. **Join-like syntax** (Relational databases)
   - SQL JOIN to combine tables
   - **Problem**: Still returns flat result set

### Breakthrough Opportunity

**Native Hierarchical Columns**:

Define columns that traverse nested structure:
```javascript
const columns = [
  { key: "user.name", header: "Name" },
  { key: "user.address.city", header: "City" },
  { key: "orders[]|total", header: "Order Total", aggregate: "SUM" }
]
```

**Rendering strategy**:
- For scalar fields (user.name, user.address.city): render directly
- For arrays (orders):
  - Option 1: Expand rows (show one row per order)
  - Option 2: Aggregate (show SUM of total)
  - Option 3: Inline list (show "50, 75, 100")

**Advantage**: No flattening required; table understands structure.

### Current state

No table library handles nested data natively. All require external flattening.

**Why it's a 100X return**: "A table that understands your data structure without flattening" would feel like the table was purpose-built for your domain.

---

## Summary: Where to Start?

### Highest-impact problems (in order):

1. **The Reactivity Problem (O(1) cell updates)**
   - Most fundamental; unlocks everything else
   - Smallest scope; most achievable
   - 10-100x performance gain

2. **The Virtualization Problem (dynamic row heights)**
   - Blocks all complex table use cases
   - Breaks 60fps on expandable content
   - Medium scope, high-impact

3. **The Selection Problem (2D ranges)**
   - Lowest-hanging fruit
   - Users expect it; doesn't exist
   - Moderate scope, high UX impact

4. **The Copy-Paste Problem (clipboard interop)**
   - Blocks Excel integration (huge use case)
   - Medium scope, high practical value
   - Browser API limitations may block full solution

5. **The Data Shape Problem (nested data)**
   - Blocks enterprise use cases
   - Unlocks graph/relational queries
   - High scope but high payoff

### Avoid (too hard or low ROI):

- **Print problem**: Requires fundamental CSS/browser changes
- **Accessibility problem**: AT vendor limitations; can't fully solve
- **Column width problem**: Good but narrow; incremental improvement
- **Formula problem**: Full spreadsheet complexity; diminishing returns vs. HyperFormula

---

## References

### Layout & CSS
- [Flexible data tables with CSS Grid](https://adamlynch.com/flexible-data-tables-with-css-grid/)
- [MDN: CSS Grid Relationship with Other Methods](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Relationship_with_other_layout_methods)
- [CSS Container Queries (2025 Production Ready)](https://caisy.io/blog/css-container-queries)
- [Dealing with overflow and position: sticky](https://css-tricks.com/dealing-with-overflow-and-position-sticky/)

### Reactivity & Signals
- [SolidJS Fine-Grained Reactivity](https://docs.solidjs.com/advanced-concepts/fine-grained-reactivity)
- [Fine-Grained Reactivity in React with Signals](https://medium.com/@sparshmalhotraaa/fine-grained-reactivity-in-react-how-preact-signals-do-it-a282943b2bd8)
- [Svelte Fine-Grained Reactivity](https://umaranis.com/2025/04/12/taking-advantage-of-fine-grained-reactivity-in-svelte/)
- [CRDTs and Conflict-Free Replicated Data Types](https://crdt.tech/)

### Virtualization
- [React Virtualized: CellMeasurer for Dynamic Heights](https://egghead.io/lessons/react-create-a-virtualized-list-with-auto-sizing-cells-using-react-virtualized-and-cellmeasurer)
- [React-Window Dynamic List Virtualization](https://tiagohorta1995.medium.com/dynamic-list-virtualization-using-react-window-ab6fbf10bfb2)
- [Dynamic Row Height Issue in TanStack Virtual](https://github.com/tannerlinsley/react-virtual/issues/159)
- [MUI Data Grid Row Height](https://mui.com/x/react-data-grid/row-height/)

### Accessibility
- [WAI-ARIA Grid Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)
- [ARIA Grids & Data Tables](https://www.accesify.io/blog/aria-grids-data-tables-accessibility/)
- [AG Grid Accessibility](https://www.ag-grid.com/vue-data-grid/accessibility/)
- [Grids Part 2: Semantics](https://sarahmhigley.com/writing/grids-part2/)

### Copy-Paste & Clipboard
- [Excel Clipboard Interop](https://techcommunity.microsoft.com/discussions/excelgeneral/excel-clipboard-format/4167582)
- [Copy Table to Excel with Formatting](https://jyotsna-anand.medium.com/copy-table-to-excel-with-table-formatting-c7beaaf31774)
- [Excel PasteSpecial Method](https://learn.microsoft.com/en-us/dotnet/api/microsoft.office.interop.excel._worksheet.pastespecial)

### Column Sizing
- [Auto Column Sizing (SlickGrid)](https://github.com/6pac/SlickGrid/wiki/Auto-Column-Sizing)
- [TanStack Table Column Sizing APIs](https://tanstack.com/table/v8/docs/api/features/column-sizing)
- [CSS table-layout Property](https://css-tricks.com/almanac/properties/t/table-layout/)
- [AG Grid Column Sizing](https://www.ag-grid.com/javascript-data-grid/column-sizing/)

### Print
- [How to Handle Page Breaks in HTML Tables](https://www.w3docs.com/snippets/html/how-to-handle-page-breaks-when-printing-a-large-html-table.html)
- [CSS Print Page Styling](https://www.docuseal.com/blog/css-print-page-style)
- [CSS Repeated Headers and Footers (W3C Spec)](https://specs.rivoal.net/css-repeat/)
- [Repeat Table Headers in Print Mode](https://www.codegenes.net/blog/repeat-table-headers-in-print-mode/)

### Formulas & Spreadsheet Engines
- [HyperFormula: Fast JavaScript Calculation Engine](https://handsontable.com/blog/introducing-hyperformula-fast-javascript-calculation-engine)
- [Jspreadsheet: Lightweight Data Grid](https://github.com/jspreadsheet/ce)
- [Sunrise: Reactive Spreadsheet Library](https://github.com/snapview/sunrise)
- [Top 5 React Spreadsheet Libraries 2024](https://blog.react-pdf.dev/top-5-react-spreadsheet-libraries-for-2024)

### Selection
- [Excel JavaScript API: Range Selection](https://learn.microsoft.com/en-us/office/dev/add-ins/excel/excel-add-ins-ranges-set-get)
- [DataTables KeyTable: Excel-like Navigation](https://editor.datatables.net/examples/extensions/keyTable.html)
- [AG Grid Cell Selection](https://www.ag-grid.com/javascript-data-grid/cell-selection/)
- [Excel-like Range Selection in React](https://gist.github.com/gargroh/8229b17c3dca3eecfdc7d5fc0e777f18)

### Nested & Hierarchical Data
- [Data Flattening Issues](https://www.datasunrise.com/knowledge-center/flattening-data-simplifying-complex-structures/)
- [BigQuery Nested and Repeated Fields](https://cloud.google.com/bigquery/docs/best-practices-performance-nested)
- [Data Flattening for Predictive Analytics](https://www.pecan.ai/blog/data-flatten-analytics-101/)
- [Nested Set Model (Hierarchical Data)](https://en.wikipedia.org/wiki/Nested_set_model)

### DOM & Accessibility
- [Shadow DOM vs Light DOM Trade-offs](https://www.matuzo.at/blog/2023/pros-and-cons-of-shadow-dom/)
- [How Shadow DOM and Accessibility Conflict](https://alice.pages.igalia.com/blog/how-shadow-dom-and-accessibility-are-in-conflict/)
- [Light-DOM-Only Web Components](https://frontendmasters.com/blog/light-dom-only/)
- [Accessibility with ID Referencing and Shadow DOM](https://coryrylan.com/blog/accessibility-with-id-referencing-and-shadow-dom)

---

## Questions for the User

As you evaluate these problems:

1. **Which problem aligns most with tablecraft's mission?** (Responsiveness? Performance? Developer experience?)
2. **Which could be solved incrementally** and shipped as a competitive advantage?
3. **Which would create the most "magical" UX** (the 100X moment)?

The best breakthrough will likely combine 2-3 of these problems elegantly. For example:

- **Reactivity + Virtualization** = Perfect scrolling experience with instant cell updates (currently impossible)
- **Selection + Copy-Paste** = True Excel parity (Holy Grail of table libraries)
- **Data Shape + Reactivity** = Tables that understand your schema without flattening

---

*Last updated: March 28, 2026*
*Research scope: Web table architecture, 2025-2026 standards, production libraries*
