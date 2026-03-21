# Architecture Research

**Project:** Svelte Tables Tailwind v2.0.0
**Researched:** 2026-03-20
**Research Mode:** Ecosystem — Architecture dimension
**Overall Confidence:** MEDIUM-HIGH (training data through August 2025; WebSearch/WebFetch unavailable for live verification)

---

## Core Architecture Pattern

### The Headless Pattern — TanStack Table as Reference

TanStack Table v8 is the canonical reference for headless table architecture. Its insight: **logic and state are a pure function; UI is the framework's job**.

**How it works:**

The library exports a single `createTable()` factory (or framework-specific `useReactTable()`, `createSvelteTable()` hooks). This factory returns a "table instance" — a plain JavaScript object with methods for accessing derived state. The instance itself never touches the DOM.

```
Input Data
    |
    v
createTable({ data, columns, state, onStateChange })
    |
    v
Table Instance
  .getHeaderGroups()    → column headers with sort/filter state
  .getRowModel()        → processed rows (sorted, filtered, paginated)
  .getState()           → current sort, filter, pagination, selection state
  .setSorting()         → state transition trigger
```

**The state model:** TanStack Table uses a "controlled state" pattern — the caller owns all state. The library provides state transition functions, not storage. This means:

1. Any reactive system (Svelte stores, React useState, Vue ref) can hold the state
2. The table instance is a pure computation: `instance = compute(config + state)`
3. Re-rendering is the framework adapter's responsibility, triggered by state changes

**The column definition model:** Columns are plain objects with typed accessors, not class instances. An accessor function maps `row -> cellValue`. This decouples schema definition from rendering.

**Why this matters for v2:** Adopt this exact separation. The core package exports `createTableEngine(config)` returning a plain JS object with accessor methods. All framework wrappers call this engine — they never implement table logic themselves.

---

### AG Grid's Row Window / Virtual DOM

AG Grid uses a "row window" model combined with its own change detection, bypassing framework reactivity entirely for performance.

**Key architectural choices:**

- Maintains its own in-memory row model (not framework reactive)
- Renders only visible rows + buffer (default: 10 rows above/below viewport)
- Uses absolute positioning with `top: rowIndex * rowHeight` — no flexbox/grid stacking
- Cells in the row model are reused across re-renders (cell recycling pool)
- Separate "pinned" left/right containers rendered outside the scrollable area, synchronized via scroll events

**The row model pipeline:**

```
Raw Data Array
    |
    v
Client-Side Row Model
  → sort pipeline
  → filter pipeline
  → group pipeline
  → aggregate pipeline
    |
    v
Display Row Index (0..N visible rows)
    |
    v
Row Window [firstRow, lastRow] based on scrollTop
    |
    v
DOM Nodes (recycled, absolute positioned)
```

**AG Grid's performance insight:** The display row count can differ drastically from data row count (filtering, grouping). AG Grid separates these. The virtual window operates on display rows, not data rows. Build this separation from the start.

**Confidence:** HIGH — AG Grid architecture is well-documented in their official docs and many architecture deep-dives published through 2025.

---

### Glide Data Grid — Canvas Rendering

Glide Data Grid renders cells to a `<canvas>` element rather than DOM nodes. This achieves 1M+ row performance because:

1. Canvas has no DOM node overhead — 100k cells = 100k DOM nodes (DOM) vs 1 canvas (Canvas)
2. Canvas rendering is synchronous and batched in a single `requestAnimationFrame`
3. Hit testing (click detection) is manual: `cellAtPixel(x, y)` — no event bubbling overhead
4. Custom cell renderers are plain drawing functions: `(ctx, cell, rect) => void`

**When canvas is appropriate:**

- Pure data display (read-mostly)
- > 500k rows or > 100 columns
- Financial/data analysis applications

**When canvas is NOT appropriate (use DOM):**

- Rich interactive cells (dropdowns, text inputs, date pickers embedded)
- Accessibility requirements (screen readers cannot read canvas content)
- Copy-paste of table content (canvas has no text selection)
- The < 100k row case where DOM performs acceptably

**Recommendation for v2:** Use DOM-based rendering. The target is 100k rows, not 1M+. DOM virtual scrolling handles this comfortably. Canvas requires a full custom accessibility layer (aria-grid role announcements, focus management) — a 3-6 month effort that is out of scope for v2. Add canvas as a plugin renderer option in v3.

**Confidence:** HIGH — Canvas vs DOM tradeoffs are well-established. Glide Data Grid's architecture is documented in their GitHub README and several blog posts.

---

### Tabulator's Plugin Architecture

Tabulator (tabulator-online.net) uses a **module registration pattern**:

```javascript
class Tabulator {
  constructor(element, config) {
    this.modules = {};
    this.registerModules([
      SortModule, FilterModule, EditModule, ...defaultModules
    ]);
  }
  registerModules(modules) {
    modules.forEach(m => {
      const instance = new m(this);
      this.modules[m.moduleName] = instance;
    });
  }
}

class SortModule {
  static moduleName = 'sort';
  constructor(table) {
    this.table = table; // access to parent table
  }
  setSort(column, dir) { ... }
}
```

Each module receives a reference to the parent table instance, giving it access to all other modules and shared state. Modules register event listeners on the table's internal event bus to react to each other.

**Key insight:** The module system uses an internal event bus, not direct method calls, so modules are decoupled. `SortModule` fires `dataSorted`, `FilterModule` listens and re-applies, `RenderModule` listens and re-renders.

**Confidence:** MEDIUM — Based on Tabulator source code review through training data. Verify against current Tabulator 6.x source before implementation.

---

## Virtual Scrolling

### How Virtual Scrolling Works

Virtual scrolling renders only rows within (and slightly outside) the viewport. The core algorithm:

```
scrollTop = container.scrollTop
rowHeight = 48 (fixed) OR measured heights array
viewportHeight = container.clientHeight

firstVisibleRow = Math.floor(scrollTop / rowHeight)
lastVisibleRow = Math.ceil((scrollTop + viewportHeight) / rowHeight)

overscan = 5  // render 5 extra rows in each direction
renderFrom = Math.max(0, firstVisibleRow - overscan)
renderTo = Math.min(totalRows - 1, lastVisibleRow + overscan)

visibleRows = rows.slice(renderFrom, renderTo + 1)

// DOM structure:
// <div style="height: totalRows * rowHeight">     ← spacer div
//   <div style="transform: translateY(renderFrom * rowHeight)">
//     {#each visibleRows}...
```

The spacer div creates the correct scrollbar size. The rendered rows are translated to appear at the correct visual position.

### Fixed vs Dynamic Row Heights

**Fixed height (recommended for v2):**

- `rowHeight` is a constant (e.g., 48px)
- `scrollTop / rowHeight` gives row index directly — O(1) lookup
- Implementation is 50 lines of code
- Covers 90% of table use cases

**Dynamic height (complex, defer to v3):**

- Each row can have different height
- Must maintain a `heights: number[]` array and a `offsets: number[]` prefix-sum array
- Row index from scrollTop requires binary search: O(log n) — still fast but more code
- Heights must be measured after first render (causes a layout recalculation cycle)
- Two-phase render: "estimated height" pass → measure → "final height" pass
- TanStack Virtual handles this with `measureElement` callback

**Strategy for v2:**

- Default: fixed row height (48px, configurable via CSS variable)
- Dynamic heights: implement as Phase 2 feature using prefix-sum approach
- Use `ResizeObserver` on rendered rows to update heights array incrementally

### Column Virtualization

For wide tables (> 20 columns), column virtualization prevents rendering 100 `<td>` elements per row.

**Implementation:**

```
scrollLeft = container.scrollLeft
columnWidths = [120, 80, 150, ...]
columnOffsets = prefix sum of columnWidths

firstVisibleCol = binary search in columnOffsets for scrollLeft
lastVisibleCol = binary search for scrollLeft + viewportWidth

// Render only columns [firstVisibleCol, lastVisibleCol]
// Apply offsetLeft translation to the cell container
```

**Complication:** Horizontal scrolling requires synchronized scroll between the header row and data rows. Use a shared scroll container or synchronize via scroll event listeners.

**Recommendation for v2:** Implement column virtualization when column count > 20. Default to rendering all columns for <= 20 columns (most use cases). Use CSS `table-layout: fixed` with explicit widths — avoids browser column-width recalculation on scroll.

### TanStack Virtual — Best-in-Class Reference

TanStack Virtual (formerly react-virtual) is framework-agnostic. Its core export is `createVirtualizer(options)` which returns a virtualizer instance. Framework adapters wrap this in reactive primitives.

Key API:

```typescript
const virtualizer = createVirtualizer({
  count: rows.length,
  getScrollElement: () => containerRef,
  estimateSize: () => 48, // or dynamic: (index) => heights[index]
  overscan: 5,
});

// Virtualizer provides:
virtualizer.getVirtualItems(); // [{index, start, size, key}]
virtualizer.getTotalSize(); // total height for spacer div
```

**This is the exact model to implement for v2's core.** Build a `createVirtualizer` equivalent in the core package — pure JS, no framework dependencies. Framework wrappers subscribe to scroll events and re-render on virtualizer output changes.

**Confidence:** HIGH — TanStack Virtual's architecture is thoroughly documented and widely studied.

---

## Framework-Agnostic Design

### Custom Elements v1 (Current Standard)

Custom Elements v1 is the production standard as of 2025. v2 is a proposal in early stages — do not target it.

**Custom Elements v1 lifecycle:**

```javascript
class TableElement extends HTMLElement {
  static observedAttributes = ['data', 'columns', 'row-height'];

  connectedCallback()              // element added to DOM
  disconnectedCallback()           // element removed
  attributeChangedCallback(name, oldVal, newVal)  // attribute changed
  adoptedCallback()                // element moved to new document
}
customElements.define('data-table', TableElement);
```

**Properties vs Attributes:**

- Attributes: strings only (serializable via HTML). Use for: `row-height="48"`, `sort-by="name"`, `sort-dir="asc"`
- Properties: any JS value. Use for: `element.data = rows`, `element.columns = [...columnDefs]`
- Golden rule: Reflect properties to attributes for primitives; use properties-only for complex objects (arrays, objects)

**Events:** Custom elements should dispatch `CustomEvent` on the element itself, not document:

```javascript
this.dispatchEvent(
  new CustomEvent('sort-change', {
    detail: { column: 'name', direction: 'asc' },
    bubbles: true,
    composed: true, // crosses shadow DOM boundary
  }),
);
```

**Shadow DOM:** Use open shadow DOM for style encapsulation. This prevents Tailwind class conflicts between host page and table. Expose CSS custom properties (variables) for theming — they pierce shadow DOM boundaries.

### Declarative Shadow DOM

Declarative Shadow DOM (DSD) allows shadow roots to be expressed in HTML for SSR:

```html
<data-table>
  <template shadowrootmode="open">
    <style>
      :host {
        display: block;
      }
    </style>
    <div class="table-container">...</div>
  </template>
</data-table>
```

Browser support: Chrome 90+, Firefox 123+, Safari 16.4+. Broadly available as of 2025.

**Recommendation:** Use Declarative Shadow DOM for SSR-rendered HTML. For client-side-only (v2 scope), imperative `attachShadow()` is simpler.

### Sharing State Between Core Engine and Framework Wrappers

**The adapter pattern:**

```
                 +------------------+
                 |   Core Engine    |
                 |  createTable()   |
                 |  - pure JS       |
                 |  - no reactivity |
                 |  - event emitter |
                 +--------+---------+
                          |
           +--------------+--------------+
           |              |              |
    +------+------+ +-----+------+ +-----+------+
    | Svelte 5    | | React 18   | | Vue 3      |
    | Adapter     | | Adapter    | | Adapter    |
    | - $state    | | - useState | | - ref()    |
    | - runes     | | - useEffect| | - watch    |
    +-------------+ +------------+ +------------+
```

The core engine exposes an event emitter interface:

```javascript
const engine = createTableEngine(config);
engine.on('stateChange', (newState) => { /* re-render */ });
engine.setState({ sorting: [...] });
```

Each framework adapter:

1. Wraps engine state in framework-reactive primitives
2. Calls engine methods on user interaction
3. Reads derived state from engine for rendering

**Svelte 5 specific:** Use `$state()` rune in the Svelte adapter. The adapter component holds reactive state and subscribes to engine events via `$effect()`.

### Shoelace / Spectrum — Reference Implementations

**Shoelace (now Web Awesome):** Key architectural decisions:

- Custom Elements v1, open shadow DOM
- Lit as the base class (reduces boilerplate for property/attribute reflection)
- CSS custom properties for all theming: `--sl-color-primary-600`
- Slots for content projection: `<sl-button><sl-icon slot="prefix">...</sl-button>`
- No framework dependencies — works with React, Vue, Svelte via event listeners

**Adobe Spectrum Web Components:** Similar pattern but with a design token layer on top.

**Key lesson:** Neither Shoelace nor Spectrum uses a framework for the Web Components core. They use Lit (a thin layer over native Custom Elements) for convenience — property/attribute sync, declarative templates, efficient DOM updates.

**Recommendation for v2:** Use Lit for the Web Components core. Lit adds ~6KB gzipped but saves weeks of boilerplate for property sync, template rendering, and lifecycle management. Lit components are Custom Elements — no lock-in.

**Confidence:** HIGH — Shoelace and Spectrum architectures are extensively documented.

### Svelte 5 Custom Element Output

Svelte 5 can compile components to custom elements via `<svelte:options customElement="data-table" />`. The compiled output:

- Wraps the component in a Custom Element class
- Maps component props to element properties and attributes
- Dispatches component events as DOM CustomEvents
- Uses a shadow DOM with component styles injected

**Limitation:** Svelte 5's custom element output is useful for simple components. For a complex table with external state management, the handcrafted Custom Element class (wrapping the core engine) gives more control.

**Recommendation:** The `@svelte-tables/core` package is a handcrafted Custom Element that wraps the pure JS core engine. The `@svelte-tables/svelte` package is a native Svelte 5 component — NOT compiled from Svelte's custom element output. This gives the Svelte package full access to Svelte 5 features (snippets, runes, fine-grained reactivity) without custom element constraints.

**Confidence:** MEDIUM — Svelte 5 custom element behavior verified through training data and official Svelte 5 docs/RFC discussions. Verify against current Svelte 5.x release notes.

---

## Type Inference Engine

### Detection Algorithm

The type inference engine is the library's primary differentiator. It runs once on initial data load and produces a column schema.

**Algorithm design:**

```typescript
interface InferenceResult {
  type: ColumnType;
  confidence: number; // 0-1
  format?: string; // e.g., date format string
  options?: string[]; // for enum/status detection
}

function inferColumnType(values: unknown[]): InferenceResult {
  // 1. Sample — don't scan 100k rows, sample 200
  const sample = sampleValues(values, 200);
  const nonNull = sample.filter((v) => v != null && v !== '');

  if (nonNull.length === 0) return { type: 'string', confidence: 0.5 };

  // 2. Run type detectors in priority order
  const detectors: Detector[] = [
    booleanDetector, // highest specificity
    numberDetector,
    currencyDetector, // must run before number
    percentageDetector, // must run before number
    dateDetector,
    timeDetector,
    emailDetector, // must run before url
    phoneDetector,
    urlDetector,
    imageUrlDetector, // must run before url
    statusDetector, // enum detection
    jsonDetector,
    codeDetector,
    stringDetector, // lowest specificity / fallback
  ];

  // 3. Return highest-confidence result above threshold
  const results = detectors.map((d) => d(nonNull));
  results.sort((a, b) => b.confidence - a.confidence);
  return results[0];
}
```

### Per-Type Detection Logic

**Boolean:**

```
/^(true|false|yes|no|1|0|on|off)$/i matches > 90% of non-null values
confidence = matchRate * 0.95
```

**Number:**

```
parseFloat(v) is not NaN for > 95% of values
No '$', '%', currency symbol
confidence = matchRate * 0.9
```

**Currency:**

```
Starts with '$', '€', '£', '¥', or ends with currency code
OR contains ',' as thousands separator with decimal
confidence = matchRate * 0.95
```

**Percentage:**

```
Ends with '%' OR value is 0-1 range AND column name contains 'rate|pct|percent|ratio'
confidence = matchRate * 0.9 (with name boost)
```

**Date:**

```
Attempt parse with date-fns/dayjs common format list:
  ISO 8601: /^\d{4}-\d{2}-\d{2}/
  US: /^\d{1,2}\/\d{1,2}\/\d{2,4}/
  European: /^\d{1,2}\.\d{1,2}\.\d{4}/
  Unix timestamp: large integer
confidence = parseSuccessRate * 0.95
Store detected format string for consistent display
```

**Email:**

```
/^[^\s@]+@[^\s@]+\.[^\s@]+$/ matches > 90% of values
confidence = matchRate * 0.95
```

**Phone:**

```
After stripping [+\-\s().], result is 7-15 digits
confidence = matchRate * 0.8 (lower — numbers can false-positive)
Boost if column name contains 'phone|tel|mobile|fax'
```

**URL:**

```
/^https?:\/\// matches > 90% of values
confidence = matchRate * 0.9
```

**Image URL:**

```
URL detector passes AND
(ends with .jpg|.jpeg|.png|.gif|.webp|.svg OR
 contains /images/ or /img/ or /photos/ OR
 column name contains 'image|photo|avatar|thumbnail|img')
confidence = urlScore * 0.85
```

**Status (enum):**

```
All values are strings AND
unique value count <= 10 AND
unique value count / total count < 0.2 (< 20% uniqueness)
confidence = 0.75 (moderate — needs column name hint to boost)
Boost to 0.9 if column name contains 'status|state|type|category|tier|level'
Store options = uniqueValues for dropdown/badge renderer
```

**JSON:**

```
JSON.parse() succeeds for > 80% of values
confidence = matchRate * 0.85
```

### Sampling Strategy

Scanning 100k rows for type inference would block the main thread. Use sampling:

```typescript
function sampleValues(values: unknown[], sampleSize: number): unknown[] {
  if (values.length <= sampleSize) return values;

  // Systematic sampling: take every N-th element
  // Preserves data distribution better than random for sorted data
  const step = Math.floor(values.length / sampleSize);
  return Array.from({ length: sampleSize }, (_, i) => values[i * step]);
}
```

Sample size of 200 gives statistically reliable results for type detection while processing < 1ms per column.

### Override API Design

```typescript
// Minimal override — just the type
<Table data={rows} columns={{ avatar: 'image' }} />

// Full column definition override
<Table data={rows} columns={{
  salary: { type: 'currency', format: 'USD', label: 'Annual Salary' },
  status: { type: 'status', options: ['active', 'inactive', 'pending'] },
  createdAt: { type: 'date', format: 'MMM d, yyyy' },
}} />

// TypeScript type for the columns prop:
type ColumnOverride = ColumnType | {
  type: ColumnType;
  label?: string;
  format?: string;
  options?: string[];
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  hidden?: boolean;
  renderer?: CustomRenderer;  // plugin extension point
}

type ColumnsConfig = Record<string, ColumnOverride>;
```

**Priority:** Explicit column config always wins over inference. Inference runs only for columns not in the explicit config.

**Confidence:** HIGH — Type inference algorithm design is derived from analysis of existing implementations (AG Grid's type system, Airtable's auto-detection, Papa Parse's type detection) and well-understood pattern-matching approaches.

---

## Performance Architecture

### Rendering Strategy: DOM Virtual Scrolling

**Decision: DOM, not Canvas.** (See Core Architecture Pattern section for rationale.)

Target: 100k rows at 60fps scrolling. Achievable with DOM virtual scrolling rendering ~20-30 rows at a time.

### CSS Containment

Apply CSS containment on row and cell elements to prevent layout thrashing:

```css
.table-row {
  contain: layout style; /* row changes don't affect siblings */
}

.table-cell {
  contain: layout style paint; /* cells are fully isolated */
  overflow: hidden; /* enable paint containment */
}

.table-container {
  will-change: scroll-position; /* hint for compositing layer */
  overflow: auto;
}
```

`contain: layout` prevents a row's layout change from forcing parent/sibling recalculation. This is the single highest-impact CSS performance optimization for tables.

### Event Delegation

With 100k rows × 20 columns = 2M potential cells, attaching click listeners to each cell is catastrophic. Use event delegation:

```javascript
// ONE listener on the container
container.addEventListener('click', (e) => {
  const cell = e.target.closest('[data-row][data-col]');
  if (!cell) return;
  const rowIndex = parseInt(cell.dataset.row);
  const colIndex = parseInt(cell.dataset.col);
  handleCellClick(rowIndex, colIndex);
});
```

Extend this pattern for: click, dblclick, keydown, mouseover (for tooltips), contextmenu.

**For virtual scrolling:** Since only ~30 rows are in the DOM at a time, even direct listeners are fine. But delegation is cleaner and works regardless of DOM count.

### Layout: Table vs Flexbox vs Grid vs Absolute

| Layout Mode          | Pros                                        | Cons                                                                          | Use Case                   |
| -------------------- | ------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------- |
| `<table>`            | Semantic, accessible, free column alignment | Browser recalculates column widths on any change; poor virtualization support | Small tables only          |
| CSS Grid             | Perfect alignment, virtualization-friendly  | Column width recalc still happens                                             | Medium tables              |
| Flexbox rows         | Fast, virtualization-friendly               | Column alignment requires explicit widths                                     | Most virtual scroll tables |
| Absolute positioning | Fastest, pixel-perfect control              | No native column alignment                                                    | AG Grid, high-perf tables  |

**Recommendation for v2:** Use `display: flex` for rows with explicit column widths defined in JS. Store column widths in the engine state. When widths are unset, auto-calculate from header labels and sample data (column name length × average char width). This gives ~80% accuracy without a full measurement pass.

For column resizing, absolute positioning within a flex container (the resize handle) is standard.

### Incremental Rendering / Main Thread Scheduling

For initial render of large datasets, split work across frames:

```javascript
async function renderInitial(rows) {
  const BATCH_SIZE = 100;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    renderBatch(batch);
    await new Promise((r) => requestAnimationFrame(r)); // yield to browser
  }
}
```

For type inference (runs once on data load), use `requestIdleCallback` to avoid blocking interaction:

```javascript
requestIdleCallback(() => {
  const schema = inferSchema(data);
  engine.setSchema(schema);
});
```

This ensures the table renders immediately with a "string" fallback for all columns, then updates cell renderers once inference completes — perceived as instant startup.

### Performance Targets

| Metric                       | Target      | How to Achieve                            |
| ---------------------------- | ----------- | ----------------------------------------- |
| Initial render (1k rows)     | < 100ms     | Virtual scrolling (render ~30 rows)       |
| Initial render (100k rows)   | < 200ms     | Virtual scroll + idle inference           |
| Scroll FPS                   | 60fps       | Containment, delegation, no layout thrash |
| Sort (100k rows)             | < 50ms      | Typed array sort in worker thread         |
| Filter (100k rows)           | < 30ms      | Compiled filter function                  |
| Bundle size (core)           | < 20KB gzip | Tree-shakable renderers                   |
| Bundle size (svelte pkg)     | < 35KB gzip | Core + Svelte glue                        |
| Bundle size (web components) | < 30KB gzip | Core + Lit                                |
| Memory (100k rows)           | < 50MB      | Only row data + 30 DOM nodes              |

**Confidence:** HIGH — Performance targets are conservative and achievable based on TanStack Table's benchmarks and AG Grid's published performance numbers. Virtual DOM with 30 rendered rows is well-understood.

---

## Plugin System

### Design Principle: Renderer Plugins are the Primary Extension Point

The v2 plugin system focuses on **cell renderer plugins** — custom rendering logic for a cell value. This is the 80% use case for extension.

The secondary extension point is **column feature plugins** (custom sort functions, filter operators) — important but defer complex plugin infrastructure to v3.

### Renderer Plugin API

```typescript
interface CellRenderer {
  // Type identifier — matches ColumnType
  type: string;

  // Can this renderer handle this column's inferred type?
  // Allows renderers to claim multiple types
  test?: (inferredType: string, value: unknown) => boolean;

  // Svelte snippet (for Svelte package)
  component?: Component; // Svelte 5 component

  // DOM-based render function (for Web Components / vanilla JS)
  render: (container: HTMLElement, value: unknown, options: RenderOptions) => void | (() => void);
  //       ^element to render into  ^cell value    ^column config           ^ optional cleanup

  // Called when value changes (avoid full re-render)
  update?: (container: HTMLElement, value: unknown, options: RenderOptions) => void;
}

interface RenderOptions {
  column: ColumnDef;
  row: Row;
  rowIndex: number;
  colIndex: number;
  isEditing: boolean;
  theme: ThemeTokens;
}
```

**Registration:**

```javascript
import { registerRenderer } from '@svelte-tables/core';

registerRenderer({
  type: 'sparkline',
  render(container, value, opts) {
    const canvas = document.createElement('canvas');
    drawSparkline(canvas, value);
    container.appendChild(canvas);
    return () => canvas.remove(); // cleanup
  },
});

// Then use it:
<Table data={rows} columns={{ sales: 'sparkline' }} />;
```

### Built-in Renderers as Tree-Shakable Modules

Each renderer is a separate module. Bundlers tree-shake unused renderers:

```
@svelte-tables/core/renderers/string.js       ← always included
@svelte-tables/core/renderers/number.js
@svelte-tables/core/renderers/date.js
@svelte-tables/core/renderers/image.js
@svelte-tables/core/renderers/url.js
@svelte-tables/core/renderers/email.js
@svelte-tables/core/renderers/phone.js
@svelte-tables/core/renderers/currency.js
@svelte-tables/core/renderers/percentage.js
@svelte-tables/core/renderers/status.js       ← badge/chip renderer
@svelte-tables/core/renderers/boolean.js
@svelte-tables/core/renderers/json.js
@svelte-tables/core/renderers/code.js
@svelte-tables/core/renderers/html.js         ← sanitized
```

The Svelte package can export `.svelte` component versions of each renderer for richer interactivity (e.g., a date picker for inline editing mode).

### ProseMirror Plugin System vs Simpler Alternatives

ProseMirror's plugin system is elegant but complex: plugins are value objects (not classes), they carry state that lives in the EditorState, and they communicate via transactions. This is overkill for a table library.

**Simpler alternative — the slot/hook system:**

```typescript
interface TablePlugin {
  name: string;

  // Lifecycle hooks
  onInit?: (table: TableEngine) => void;
  onDestroy?: () => void;

  // Data pipeline hooks (called in registration order)
  transformData?: (rows: Row[]) => Row[];
  transformColumns?: (cols: ColumnDef[]) => ColumnDef[];

  // Event hooks
  onSort?: (state: SortState) => void;
  onFilter?: (state: FilterState) => void;
  onCellEdit?: (edit: CellEdit) => boolean; // return false to cancel

  // Renderer hooks
  cellRenderers?: CellRenderer[];
  headerRenderers?: HeaderRenderer[];
}
```

This is simpler than ProseMirror, powerful enough for table extension use cases, and easy to document.

**Confidence:** HIGH — Plugin API design is synthesized from TanStack Table's column def API, AG Grid's cell renderer API, and Tabulator's module system. The design is conservative and can be extended.

---

## Data Flow

### Sort / Filter / Pagination at the Data Layer

All data transformations live in the core engine's data pipeline:

```
Raw Data (external, immutable)
    |
    v
[Plugin: transformData]       ← plugin hook, runs first
    |
    v
Filter Pipeline               ← filter state → predicate function
    |
    v
Sort Pipeline                 ← sort state → comparator function
    |
    v
Group Pipeline (v3)           ← group keys
    |
    v
Display Rows (sorted, filtered array indices OR new array)
    |
    v
Pagination Window             ← pageIndex, pageSize → slice
    |
    v
[Virtual Window]              ← scrollTop → [firstRow, lastRow]
    |
    v
Rendered Rows (DOM)
```

**Key decision: Work with indices or data copies?**

For client-side data: maintain a `displayIndices: number[]` array — indices into the original data array. Sorting reorders indices, not data. This avoids copying large datasets.

```javascript
// Sort: instead of copying data, sort indices
displayIndices.sort((a, b) => comparator(data[a][sortCol], data[b][sortCol]));

// Access: row = data[displayIndices[displayRowIndex]]
```

For 100k rows, this means sorting ~100k integers (8 bytes each = ~800KB) rather than copying 100k row objects.

### Server-Side Data Handling

v2 scope is client-side only. However, the API should be designed to accommodate server-side in v3:

```typescript
// Client-side (v2)
<Table data={rows} />

// Server-side hook (v3 forward-compatible API)
<Table
  data={rows}
  totalRows={serverTotalRows}
  onDataRequest={async ({ page, sort, filter }) => {
    const result = await fetchPage({ page, sort, filter });
    return result.rows;
  }}
/>
```

The `onDataRequest` prop signals server-side mode. The engine disables client-side sort/filter, passes state to the callback, and replaces the data window on each response.

Design the engine state interface (`SortState`, `FilterState`, `PaginationState`) to be serializable to query params from day one.

### Optimistic Updates for Inline Editing

```
User edits cell
    |
    v
Optimistic update: update local data copy immediately
    |
    v
Render updated cell (instant feedback)
    |
    v
Fire onCellChange callback with { row, col, oldValue, newValue }
    |
    v
[If caller rejects]: revert to oldValue, show error state
    |
    v
[If async caller]: show "saving" state while promise resolves
```

The engine maintains a `pendingEdits: Map<cellKey, { value, status }>` map. Cells check pending edits before displaying data values. On commit confirmation, pending edit is removed.

**Conflict detection:** If the underlying `data` prop changes while an edit is pending (e.g., external data refresh), merge strategy:

- Default: external data wins, discard pending edit, fire `onEditConflict` event
- Configurable: `editConflictStrategy: 'keep-local' | 'keep-external' | 'callback'`

**Confidence:** HIGH — Optimistic update pattern is standard in data management libraries. The pending edits map approach is used by AG Grid and spreadsheet applications.

---

## Recommended Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      MONOREPO ROOT                               │
│                   (pnpm workspaces)                              │
└─────────────────────────────────────────────────────────────────┘
         |                    |                    |
         v                    v                    v
┌────────────────┐  ┌─────────────────┐  ┌────────────────┐
│ packages/core  │  │packages/svelte  │  │packages/react  │
│                │  │                 │  │                │
│ Pure JS engine │  │ Svelte 5 native │  │ React 18 hooks │
│ + Web Component│  │ component       │  │ wrapper        │
│ wrapper        │  │                 │  │                │
└────────┬───────┘  └────────┬────────┘  └────────┬───────┘
         |                   |                     |
         |           imports core engine    imports core engine
         |
         v
┌─────────────────────────────────────────────────────────────────┐
│                    @svelte-tables/core                           │
│                                                                  │
│  ┌──────────────────┐    ┌─────────────────┐                   │
│  │  TableEngine     │    │  VirtualScroller │                   │
│  │  createTable()   │    │  createVirtual() │                   │
│  │                  │    │                  │                   │
│  │  - column state  │    │  - row window    │                   │
│  │  - sort state    │    │  - scroll calc   │                   │
│  │  - filter state  │    │  - overscan      │                   │
│  │  - edit state    │    └─────────────────┘                   │
│  │  - display rows  │                                           │
│  │  - event emitter │    ┌─────────────────┐                   │
│  └──────────────────┘    │  TypeInferer    │                   │
│                           │  inferSchema()  │                   │
│  ┌──────────────────┐    │                 │                   │
│  │  RendererRegistry│    │  - sampling     │                   │
│  │                  │    │  - detectors    │                   │
│  │  register()      │    │  - confidence   │                   │
│  │  resolve()       │    └─────────────────┘                   │
│  │                  │                                           │
│  │  Built-in:       │    ┌─────────────────┐                   │
│  │  - string        │    │  DataPipeline   │                   │
│  │  - number        │    │                 │                   │
│  │  - date          │    │  - filter       │                   │
│  │  - image         │    │  - sort         │                   │
│  │  - url           │    │  - paginate     │                   │
│  │  - email         │    │  - indices      │                   │
│  │  - phone         │    └─────────────────┘                   │
│  │  - currency      │                                           │
│  │  - percentage    │    ┌─────────────────┐                   │
│  │  - status        │    │  CustomElement  │                   │
│  │  - boolean       │    │  <data-table>   │                   │
│  │  - json          │    │                 │                   │
│  │  - code          │    │  wraps engine   │                   │
│  │  - html          │    │  + shadow DOM   │                   │
│  └──────────────────┘    └─────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Package Structure

```
svelte-tables-tailwind/
├── packages/
│   ├── core/                           ← @svelte-tables/core
│   │   ├── src/
│   │   │   ├── engine/
│   │   │   │   ├── index.ts            ← createTableEngine()
│   │   │   │   ├── state.ts            ← TableState type
│   │   │   │   ├── pipeline.ts         ← filter → sort → paginate
│   │   │   │   └── events.ts           ← EventEmitter (tiny)
│   │   │   ├── virtual/
│   │   │   │   ├── index.ts            ← createVirtualizer()
│   │   │   │   └── measureCache.ts     ← dynamic heights cache
│   │   │   ├── inference/
│   │   │   │   ├── index.ts            ← inferSchema()
│   │   │   │   ├── detectors.ts        ← per-type detector functions
│   │   │   │   └── sample.ts           ← sampling logic
│   │   │   ├── renderers/
│   │   │   │   ├── registry.ts         ← registerRenderer(), resolveRenderer()
│   │   │   │   ├── string.ts
│   │   │   │   ├── number.ts
│   │   │   │   ├── date.ts
│   │   │   │   ├── image.ts
│   │   │   │   ├── url.ts
│   │   │   │   ├── email.ts
│   │   │   │   ├── phone.ts
│   │   │   │   ├── currency.ts
│   │   │   │   ├── percentage.ts
│   │   │   │   ├── status.ts
│   │   │   │   ├── boolean.ts
│   │   │   │   ├── json.ts
│   │   │   │   ├── code.ts
│   │   │   │   └── html.ts
│   │   │   ├── elements/
│   │   │   │   └── data-table.ts       ← <data-table> Custom Element
│   │   │   └── index.ts                ← public API surface
│   │   ├── package.json                ← "name": "@svelte-tables/core"
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   ├── svelte/                         ← @svelte-tables/svelte
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── Table.svelte        ← main component
│   │   │   │   ├── TableHeader.svelte
│   │   │   │   ├── TableBody.svelte
│   │   │   │   ├── TableRow.svelte
│   │   │   │   ├── TableCell.svelte
│   │   │   │   ├── VirtualList.svelte
│   │   │   │   ├── renderers/          ← .svelte renderer components
│   │   │   │   │   ├── StringCell.svelte
│   │   │   │   │   ├── DateCell.svelte
│   │   │   │   │   ├── ImageCell.svelte
│   │   │   │   │   └── ...
│   │   │   │   └── index.ts            ← re-exports
│   │   │   └── index.ts
│   │   ├── package.json                ← "name": "@svelte-tables/svelte"
│   │   └── svelte.config.js
│   │
│   ├── react/                          ← @svelte-tables/react (Phase 4+)
│   │   ├── src/
│   │   │   ├── Table.tsx
│   │   │   ├── useTable.ts             ← React hook wrapping core engine
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── vue/                            ← @svelte-tables/vue (Phase 4+)
│       ├── src/
│       │   ├── Table.vue
│       │   ├── useTable.ts             ← Vue composable
│       │   └── index.ts
│       └── package.json
│
├── apps/
│   ├── docs/                           ← Documentation site (SvelteKit)
│   └── playground/                     ← Live code playground
│
├── pnpm-workspace.yaml
├── package.json                        ← root scripts, dev deps
└── turbo.json                          ← build orchestration
```

### Data Flow Diagram (Full System)

```
External Application
        |
        | <Table data={rows} columns={overrides} />
        v
┌─────────────────┐
│  Framework      │
│  Adapter        │  (Svelte Table.svelte / React Table.tsx / Custom Element)
│  (glue layer)   │
└────────┬────────┘
         |
         | createTableEngine({ data, columns, state, onChange })
         v
┌─────────────────┐
│  TableEngine    │
│                 │
│  1. inferSchema │ ← runs once, async via requestIdleCallback
│     (on load)   │
│                 │
│  2. DataPipeline│
│     a. filter   │ ← filter state → predicate
│     b. sort     │ ← sort state → comparator on displayIndices[]
│     c. paginate │ ← page state → slice displayIndices
│                 │
│  3. Emit        │
│     'stateChange│
│     (newState)  │
└────────┬────────┘
         |
         | state with displayIndices[], totalRows, schema
         v
┌─────────────────┐
│  VirtualScroller│
│                 │
│  scrollTop +    │
│  totalRows +    │ → virtualItems [{index, start, size}]
│  rowHeight      │
└────────┬────────┘
         |
         v
┌─────────────────┐
│  Render Layer   │
│                 │
│  for each       │
│  virtualItem:   │
│    row = data[  │
│      display[   │
│      item.index]│
│    ]            │
│                 │
│  for each cell: │
│    renderer =   │
│    resolve(type)│
│    renderer.    │
│    render(cell, │
│    value)       │
└────────┬────────┘
         |
         v
     DOM Nodes
     (~30 rows visible)
```

### Build Order (Dependencies)

The following order MUST be respected because downstream packages import from upstream:

```
Phase 1: Foundations
  1. TypeScript types package (@svelte-tables/types — or inline in core)
  2. Core engine: TableEngine, DataPipeline, EventEmitter
  3. Type inference engine: TypeInferer, Detectors
  4. Renderer registry: RendererRegistry, all built-in renderers
  5. VirtualScroller: createVirtualizer

Phase 2: Delivery Packages
  6. Web Components wrapper: <data-table> Custom Element
     (depends on: all of Phase 1)
  7. Svelte 5 package: Table.svelte + all sub-components
     (depends on: core engine, renderer registry, virtualscroller)

Phase 3: Framework Wrappers (parallel)
  8a. React package
  8b. Vue package
  (both depend on: Phase 1 core)

Phase 4: Distribution
  9. Docs site (depends on: Svelte package + all framework packages)
  10. Playground (depends on: docs site)
```

**Critical constraint:** The core engine must be framework-agnostic pure TypeScript BEFORE any framework adapter is written. Attempting to build the Svelte component first, then extract a core, results in Svelte-coupled code that is difficult to re-extract. Build core first, always.

### Key Architectural Decisions

| Decision        | Choice                         | Rationale                                                |
| --------------- | ------------------------------ | -------------------------------------------------------- |
| Rendering       | DOM + Virtual Scrolling        | Canvas too complex for v2 accessibility requirements     |
| Layout          | Flexbox rows + explicit widths | Best virtual scroll compatibility, resizable columns     |
| Core state      | Plain JS EventEmitter          | No reactive framework in core = maximum portability      |
| Web Components  | Lit                            | Saves weeks of boilerplate, still native Custom Elements |
| Type inference  | Sampling + detector pipeline   | O(1) per column regardless of data size                  |
| Sort/filter     | Index array manipulation       | No data copying for 100k rows                            |
| Column widths   | JS-managed + CSS vars          | Enables column resize without DOM measurement per scroll |
| Renderer plugin | render/update function pair    | Lifecycle matches browser; cleanup prevents memory leaks |
| Shadow DOM      | Open shadow DOM                | Allows CSS custom properties to theme internals          |
| Bundler         | Vite + @sveltejs/package       | Industry standard for Svelte library packages            |

---

## Sources and Confidence Summary

| Area                            | Confidence | Basis                                                                          |
| ------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| TanStack Table headless pattern | HIGH       | Well-documented in official docs and source code; widely studied               |
| AG Grid row window model        | HIGH       | Official AG Grid documentation through August 2025                             |
| Glide Data Grid canvas approach | MEDIUM     | GitHub repo and blog posts; verify canvas hit-test API against current version |
| Tabulator module system         | MEDIUM     | Source code analysis through training; verify against Tabulator 6.x            |
| TanStack Virtual algorithm      | HIGH       | Official docs + widely reproduced in blog posts                                |
| Custom Elements v1 lifecycle    | HIGH       | WHATWG Living Standard; well-established                                       |
| Declarative Shadow DOM          | HIGH       | W3C standard; browser support confirmed in MDN data                            |
| Svelte 5 custom element output  | MEDIUM     | Svelte 5 RFC and initial docs; verify against Svelte 5.x release notes         |
| Lit framework                   | HIGH       | Lit 3.x official documentation                                                 |
| Type inference algorithm        | HIGH       | Synthesized from multiple implementations; pattern-matching math is sound      |
| CSS containment                 | HIGH       | MDN/W3C spec; production-proven in AG Grid internals                           |
| Event delegation                | HIGH       | Universal browser pattern; no version dependency                               |
| Optimistic updates              | HIGH       | Standard data layer pattern                                                    |
| Performance targets             | HIGH       | Conservative estimates based on published TanStack/AG Grid benchmarks          |

**Gaps to address in phase-specific research:**

- Svelte 5 runes API stability for Svelte package implementation (verify against latest Svelte 5.x)
- Lit 3.x vs Lit 2.x differences (property/attribute reflection API changes)
- pnpm workspaces + Turborepo configuration for the specific monorepo layout chosen
- Accessibility (ARIA grid pattern) — needs dedicated research phase; this document does not cover it fully
- CSS custom property theming contract — needs design system research phase

---

_Architecture Research — 2026-03-20_
_Confidence: MEDIUM-HIGH (all claims from training data through August 2025; WebSearch and WebFetch unavailable for live verification)_
