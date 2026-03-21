# Pitfalls Research

**Project:** svelte-tables-tailwind v2.0.0
**Domain:** Framework-agnostic data-grid / table library
**Researched:** 2026-03-20
**Overall Confidence:** HIGH (API/architecture pitfalls), MEDIUM (Web Components/SSR specifics), HIGH (Svelte 3→5 migration)

---

## API Design Pitfalls

### Pitfall 1: Column definitions as objects-with-type-keys (current `colname` pattern)

**What goes wrong:** The v1 API maps a JavaScript object's keys to renderer type names: `{ "string": "Name", "number": "Age" }`. This fails the moment two columns need the same type — you can only have one "string" column because object keys are unique. Every real-world table has multiple text columns. Developers hit this wall on their second column and file issues or abandon the library.

**Why it happens:** The design optimises for the demo case (one column per type) instead of the real case (N columns, each with an independently specified type).

**Consequences:** Forces users into a column-order-dependent `Array<Array>` for row data, which has no named access, breaks on column reorder, and loses all type information at the call site.

**Warning signs (v1 already shows this):** The current `rowdata` is positional — `rowdata[i][0]` means "first column" with no semantic label. Sorting or reordering columns requires the caller to manually reindex their data arrays.

**Prevention for v2:** Column definitions must be an array of column descriptor objects, one per column, keyed by a stable `key` / `id` field that matches a property in each row object. Row data must be an array of plain objects, not arrays of arrays.

```typescript
// Correct for v2
columns: [
  { key: 'name', type: 'string', label: 'Full Name' },
  { key: 'email', type: 'mail', label: 'Email' },
  { key: 'score', type: 'number', label: 'Score' },
];
rows: [{ name: 'Alice', email: 'a@b.com', score: 99 }];
```

**Phase mapping:** Phase 1 (dependency upgrade + API foundation). This must be the first API decision made — it defines the migration path from v1 and everything else is built on top of it.

---

### Pitfall 2: Exposing renderer implementation as string literals in the public API

**What goes wrong:** When renderer type names (`"string"`, `"number"`, `"image"`) are part of the public API contract, every rename, split, or merge of a renderer is a breaking change. react-table v6 → v7 → v8 were so painful partly because internal concepts leaked into the public API surface — users built around implementation details.

**Why it happens:** String literals are the simplest possible API. But they become load-bearing the moment documentation is written and users copy-paste examples.

**Consequences:** You can never rename `"tag"` to `"badge"` without a major version. You can never introduce a smarter auto-detection that supersedes `"string"` without confusion. The type system cannot validate these strings at compile time without a union type that must also be versioned.

**Warning signs:** Type override API uses raw strings; no TypeScript union enforcing valid values; no IDE autocomplete on renderer names.

**Prevention for v2:** Export a typed `ColumnType` union from day one. Keep renderer names stable and semantic (prefer generic names over implementation names). Consider a const enum or string literal union in TypeScript so any rename is a compile error at the user's build step, not a silent runtime regression.

**Phase mapping:** Phase 1 (TypeScript + type system setup).

---

### Pitfall 3: Zero-config as "no API exists" rather than "API has sensible defaults"

**What goes wrong:** True zero-config (`<Table data={rows} />`) is powerful, but if the upgrade path from zero-config to partial config is non-obvious, users either stay stuck at zero-config or rewrite to a different library. This is the adoption-and-retention failure mode — TanStack Table v8's headless approach went the opposite extreme: everything requires configuration, so power users love it but beginners bounce immediately.

**Why it happens:** Zero-config and power-user config are usually designed by different people at different times, and the gap between them becomes a cliff.

**Prevention for v2:** Design the one-prop override first (the `columns` prop), verify it composes cleanly with zero-config mode, then build advanced features as additional optional props. The API surface should form a gradient: `<Table data={rows} />` → `<Table data={rows} columns={overrides} />` → `<Table data={rows} columns={fullDefs} sortable filtering />`. No cliff.

**Phase mapping:** Phase 2 (zero-config engine + type inference). Design the column override prop at the same time as auto-inference, not after.

---

### Pitfall 4: The runtime type-switcher dropdown shipped as a user-facing feature

**What goes wrong:** The v1 component exposes a per-column dropdown in the table header that lets end users change the renderer type at runtime. This sounds like a feature but is an anti-feature for nearly every production use case:

- End users do not know what "string" vs "number" means in a data rendering context.
- It gives users control over the component's internal rendering mode, not the data.
- It adds significant UI noise to every table that uses the library.
- It is impossible to disable in v1 — it is always rendered.

**Why it happens:** Built as a developer-debugging aid during development, never extracted or made optional.

**Consequences:** Every production table using v1 has a select dropdown in every column header. This is a hard blocker for professional UI usage and likely the single biggest reason developers don't adopt v1.

**Prevention for v2:** Remove the runtime type-switcher from the default rendering entirely. If a debug/development mode renderer-inspector is desired, it must be explicitly opt-in (`devMode` prop) and clearly documented as not for production.

**Phase mapping:** Phase 1 (API foundation). Remove on day one of the v2 rewrite.

---

### Pitfall 5: API stickiness through feature accretion (the AG Grid trap)

**What goes wrong:** AG Grid started simple and became one of the most complex JavaScript libraries in existence — thousands of config options, dozens of callback names, multiple ways to do the same thing, and a configuration object that requires reading the documentation for every interaction. The complexity arose from adding features one at a time without a unifying API design philosophy.

**Why it happens:** Each feature addition seems reasonable in isolation. The feature works. It ships. Over time the API surface is enormous and no one can hold it in their head.

**Warning signs to watch for in v2:** More than one way to configure the same thing (column width settable via prop AND via column def AND via CSS variable). Callback names that don't follow a consistent pattern (`onSort` vs `onColumnResize` vs `cellClick`). Options with boolean flags that flip behavior instead of separate well-named props.

**Prevention for v2:** Establish a strict API design document before adding any feature after the foundation. Every prop addition must go through: "Is there an existing prop this composes with?" "Does this follow the naming convention?" "Can this be an extension point rather than a core prop?" Aim for fewer, more composable props rather than more specific props.

**Phase mapping:** Phase 2 (ongoing). Create the API design doc during foundation phase and enforce it throughout.

---

## Performance Pitfalls

### Pitfall 6: Rendering all rows into the DOM without virtualization

**What goes wrong:** The current v1 architecture renders every row synchronously on mount. For 100 rows this is invisible. For 1,000 rows it causes a noticeable render lag. For 10,000 rows the browser tab hangs for seconds. For 100,000 rows (the v2 target) the browser may crash or OOM.

At 100k rows × 14 columns = 1.4 million DOM nodes. Each node has event listeners, computed styles, and layout geometry. Browser layout alone takes several seconds on modern hardware.

**Why it happens:** Table rendering is intuitive as a loop — render all the data. Virtual scrolling adds significant complexity.

**Consequences:** The 100k row target in the project requirements is impossible without virtual scrolling. Even 5k rows will feel sluggish.

**Prevention for v2:** Virtual scrolling is not optional — it must be part of the core architecture design. The table body must only render the visible row window plus a small overscan buffer (typically 3-5 rows above and below the viewport). This requires knowing the row height (fixed or dynamic) and the scroll container height. Design the core rendering pipeline around a `visibleRows` derived value from scroll position, not a raw `rows.length` loop.

Implement in three phases:

1. Fixed row height virtualisation (simpler, covers 90% of cases)
2. Dynamic row height virtualisation (intersection observer or measured heights map)
3. Horizontal column virtualisation for very wide tables (100+ columns)

**Phase mapping:** Phase 3 (performance). Do not build virtualisation as a retrofit — the row rendering architecture must account for it from Phase 2 (zero-config engine).

---

### Pitfall 7: Re-render cascade from reactive column definitions

**What goes wrong:** In Svelte 5 with runes, if `columns` is a reactive `$state()` array and each column definition is an object inside that array, mutating any property on any column definition triggers a full re-render of all column headers AND the full table body if the column definitions are part of the row rendering derivation chain. This is the reactive cascade problem.

Concretely: if a user clicks a column header to sort, and sorting updates a `sorted` flag inside the column definition object, the entire column definitions array is considered changed, which re-evaluates every derived value that reads `columns`, including all cell renderers.

**Why it happens:** Svelte 5's fine-grained reactivity is better than Svelte 3, but still requires conscious design of state shape and derived computation boundaries.

**Prevention for v2:** Separate concerns into separate reactive stores:

- `columns` (definitions — changes rarely, when user reorders or resizes)
- `sortState` (which column, ascending/descending — changes on header click)
- `filterState` (filter values per column)
- `visibleRows` (derived from `rows + sortState + filterState + scrollPosition`)

Cell renderers should only re-render when the cell's value changes or the column's type changes — not when sort order changes. Use `$derived` with tight dependency scoping. Test this explicitly with large datasets before finalising the state model.

**Phase mapping:** Phase 2 (state architecture). Svelte 5 rune design must be planned before implementation begins.

---

### Pitfall 8: Event listener accumulation on dynamic cell content

**What goes wrong:** The v1 component attaches `on:click={click}` to a wrapper `<div>` inside every cell. For 100k rows × 14 columns this means 1.4 million event listeners registered on individual DOM nodes rather than using event delegation at the table level.

With virtual scrolling this becomes worse: as rows enter and leave the viewport, the component library must correctly attach and detach listeners. If a cell component is destroyed and recreated (common with virtual scrolling recycling), listeners can accumulate if the lifecycle hooks are incorrect.

**Why it happens:** Component-level event binding is the natural Svelte idiom — `on:click` on a component just works. But at scale it is a memory and performance problem.

**Prevention for v2:** Use a single delegated event listener on the `<tbody>` or the scroll container. When a click event fires, read the row index and column key from `data-*` attributes on the target element. This pattern handles 100k rows with a single listener and works correctly with virtual scrolling's DOM recycling.

```typescript
// Event delegation pattern
tbody.addEventListener('click', (e) => {
  const cell = e.target.closest('[data-row][data-col]');
  if (!cell) return;
  const rowIndex = parseInt(cell.dataset.row);
  const colKey = cell.dataset.col;
  onCellClick({ rowIndex, colKey, row: rows[rowIndex] });
});
```

**Phase mapping:** Phase 3 (performance). Plan the event model in Phase 2 so the architecture accommodates delegation from the start.

---

### Pitfall 9: XSS via `{@html}` with unsanitized cell values

**What goes wrong:** The v1 codebase uses `{@html returndatatype(key, value)}` to render every cell. The `returndatatype` function constructs HTML strings by concatenating raw user-provided values with no escaping. This is a critical XSS vulnerability documented in CONCERNS.md.

For a library that will be used with real-world data from databases, APIs, or user input, this is a rewrite-level blocker. A single malicious value in any column (injected via a compromised database record or a user-supplied import) can execute arbitrary JavaScript in the consuming application.

**Consequences:** Enterprise customers with security reviews will reject the library. Bug reports will come immediately from any user processing externally-sourced data.

**Warning signs:** Any `{@html string_concatenation_with_user_data}` pattern. The comma-replace hack in `.toString().replace(",", "")` (CONCERNS.md lines 58, 65, 83, 97) also produces malformed HTML when data contains commas.

**Prevention for v2:** Never use `{@html}` for data values. Use Svelte's text bindings (`{value}`) for all data display. Build a proper component per renderer type — each `<StringCell>`, `<MailCell>`, `<ImageCell>` component handles its own DOM construction safely with Svelte's built-in escaping. The `html` renderer type specifically must require explicit opt-in and pass values through DOMPurify before rendering.

**Phase mapping:** Phase 1 (foundation — security must be resolved before ANY feature work).

---

### Pitfall 10: Tailwind CDN injection polluting the host application's styles

**What goes wrong:** The v1 component injects a full Tailwind CSS bundle via `<svelte:head>` CDN link. This means:

- Every Tailwind utility class is globally available to the host application (unintended global side effect).
- In a host app that already uses Tailwind (different version), two versions conflict.
- In a host app that doesn't use Tailwind, the CDN link adds a blocking network request before any table renders.
- The injected CSS is Tailwind v2 — the current version is Tailwind v4, with significant incompatibilities.
- SSR environments (SvelteKit, Next.js) cannot resolve CDN URLs at build time.

**Why it happens:** Tailwind via CDN was the fastest way to style the v1 demo. It was never replaced with a proper build-time solution.

**Prevention for v2:** Do not inject any global CSS from the library. Three approaches, in order of preference:

1. **CSS Variables + minimal scoped CSS**: Define the design system as CSS custom properties, inject only the variables scoped to the component root. Consumers apply their theme by overriding variables.
2. **Tailwind as a peer dependency**: Document that consumers must have Tailwind configured. Provide a `tailwind.config` preset to add the library's content paths.
3. **Zero-dependency CSS**: Write minimal vanilla CSS scoped to the component. Ship as a separate importable stylesheet (`import 'svelte-tables/styles.css'`).

Option 1 is recommended for v2 — it makes the library work in Tailwind AND non-Tailwind projects without any configuration from the consumer.

**Phase mapping:** Phase 1 (foundation). Cannot be deferred — affects every rendered component.

---

## Bundle Size Pitfalls

### Pitfall 11: Shipping all renderers unconditionally

**What goes wrong:** A table library with 14 renderer types that ships all 14 in every bundle will be significantly larger than necessary. If a consumer only uses `string`, `number`, and `date` types, they still pay for the `code`, `html`, `image`, `tag`, and all other renderers.

At scale this matters: each renderer has its own CSS, its own DOM construction logic, and potentially its own dependencies (e.g., a code renderer might want syntax highlighting, a rich-text renderer might want a markdown parser). Bundling all renderers unconditionally creates a weight floor that grows with every new renderer added.

**Why it happens:** The current architecture uses a single `returndatatype()` function with a long if-else chain. Tree-shaking cannot eliminate individual branches of an if-else.

**Warning signs:** Bundle size grows linearly with number of renderer types. Adding a new renderer increases ALL consumers' bundle size regardless of whether they use it.

**Prevention for v2:** Design the renderer registry as individually importable modules. The core library ships with only the primitive renderers (`string`, `number`, `date`, `boolean`). All other renderers are separately importable and register themselves into the registry.

```typescript
// Consumer imports only what they use
import { Table, renderers } from 'svelte-tables';
import { ImageRenderer } from 'svelte-tables/renderers/image';
import { CodeRenderer } from 'svelte-tables/renderers/code';

renderers.register('image', ImageRenderer);
renderers.register('code', CodeRenderer);
```

When using auto-inference mode (`<Table data={rows} />`), only the renderers detected in the actual data are imported dynamically. This requires careful design of the auto-inference pipeline.

**Phase mapping:** Phase 2 (renderer architecture). The renderer registry must be designed before implementing individual renderers.

---

### Pitfall 12: Svelte component inlining breaking tree-shaking

**What goes wrong:** Svelte compiles `.svelte` files into JavaScript modules. When multiple Svelte components are bundled together (e.g., all renderers in a single file or a single index export), the bundler cannot tree-shake individual components because Svelte's compiled output includes side effects (CSS injection, component registration) that bundlers conservatively treat as non-tree-shakeable.

**Why it happens:** The current codebase is a single file. The v2 monorepo must ensure each renderer is in its own file with a clean `export`, and the package.json `sideEffects` field is correctly set.

**Prevention for v2:**

- One component per file — never barrel-export Svelte components from a single index that imports all of them.
- Set `"sideEffects": false` in the library's `package.json` (or list only genuinely side-effectful files like CSS imports).
- Use `@sveltejs/package` (svelte-package) which correctly handles the `exports` map for tree-shaking.
- Verify tree-shaking with bundle analyser (e.g., `rollup-plugin-visualizer`) as part of CI.

**Phase mapping:** Phase 1 (monorepo + build system setup).

---

### Pitfall 13: CSS specificity wars and stylesheet ordering sensitivity

**What goes wrong:** If the library ships any global CSS (even scoped Tailwind classes), consumers who use Tailwind v3 or v4 or a different CSS reset will encounter specificity conflicts. The order that stylesheets load in determines which styles win — a non-deterministic outcome depending on how the consumer's bundler orders CSS.

**Why it happens:** CSS has global scope by default. Any class name the library uses could collide with the consumer's own classes.

**Prevention for v2:**

- Use CSS custom properties (variables) for all theme values — these scope naturally.
- Namespace any non-variable CSS classes with a library prefix: `.stt-table`, `.stt-cell`, etc.
- Ship CSS as a separate importable file so consumers control load order.
- Provide a CSS Layers (`@layer`) wrapper so the library's styles have lower specificity than the consumer's overrides by default.
- For the Tailwind integration: document the exact content path pattern to add to consumer's Tailwind config.

**Phase mapping:** Phase 2 (design system). CSS architecture must be locked in before any component styling work.

---

## Framework-Agnostic Pitfalls

### Pitfall 14: Custom Elements attribute vs property reflection mismatch

**What goes wrong:** HTML attributes are always strings. Custom Elements (Web Components) receive attribute values as strings, but the library's data (`rows`, `columns`) are JavaScript objects and arrays. Attempting to pass complex data via attributes breaks:

```html
<!-- This does not work — attributes are strings -->
<svelte-table rows="[{name:'Alice'}]" />
```

Frameworks handle this differently:

- React (pre-React 19): passes complex data via attributes as JSON-stringified strings, breaking on the Custom Element boundary.
- React 19+: has improved Custom Elements support but still has edge cases with event handling.
- Svelte: passes properties directly when using `bind:` syntax, bypassing attribute reflection.
- Lit-based Custom Elements: use `.property=${value}` dot-prefix syntax in templates.

**Why it happens:** The HTML attribute/property duality is a fundamental Web Components footgun. Attributes are for simple scalars; properties are for complex data. But React's JSX traditionally mapped all JSX props to HTML attributes.

**Prevention for v2:**

- The Web Components core must accept data via JavaScript properties, not attributes. Document this explicitly.
- Provide setter methods and property accessors on the Custom Element class for all complex inputs.
- Test the Custom Element wrapper in React (both pre-19 and React 19), Vue 3, and vanilla JS.
- For the React wrapper, use a thin React component that passes data via a ref-based property assignment rather than JSX attribute spreading.
- Keep attribute-reflected properties to simple scalars only: `page-size`, `loading`, `bordered` (booleans/numbers/strings).

**Phase mapping:** Phase 4 (framework wrappers). The Web Components core design must resolve this before wrappers are built.

---

### Pitfall 15: Shadow DOM blocking Tailwind utility classes

**What goes wrong:** If the Web Components core uses Shadow DOM for style encapsulation, Tailwind's utility classes in the consuming application's global stylesheet cannot pierce the shadow boundary. A Tailwind class applied to a host element's slot content is invisible to the shadow DOM. This means:

- Consumers cannot customise cell appearance with Tailwind classes.
- The library cannot use the consumer's Tailwind theme (colors, spacing, fonts).
- Dark mode via `class="dark"` on `<html>` does not propagate into the shadow root without explicit CSS custom property forwarding.

**Why it happens:** Shadow DOM is the standard Web Components encapsulation mechanism. It is also fundamentally incompatible with external stylesheet-based customisation.

**Prevention for v2 — choose one strategy:**

1. **No Shadow DOM (Light DOM mode)**: The Custom Element renders into the regular DOM. Full Tailwind compatibility. Loss of style encapsulation. Recommended for this library given the Tailwind-first positioning.
2. **Shadow DOM with CSS custom properties bridge**: Define all visual tokens as CSS custom properties on `:host`. Consumer overrides variables. No class-level customisation. More work to maintain.
3. **Constructable Stylesheets**: Adopt the Shadow DOM but inject the consumer's Tailwind stylesheet into the shadow root via `adoptedStyleSheets`. Complex, not universally supported.

Recommendation: Use Light DOM. This library's value proposition is Tailwind integration. Shadow DOM directly contradicts that value. Document the tradeoff.

**Phase mapping:** Phase 4 (Web Components core). This is an architectural decision that cannot be reversed without a breaking change.

---

### Pitfall 16: SSR/SSG incompatibility with Web Components

**What goes wrong:** Custom Elements require a browser DOM. In SSR environments (SvelteKit, Next.js, Nuxt), the component lifecycle runs in Node.js where `window`, `document`, and `customElements` do not exist. A Web Components-based table that calls `customElements.define()` at module load time will throw on the server side, breaking SSR completely.

Additional SSR pitfalls:

- `window.onload` (present in v1 at line 13) crashes immediately in Node.js.
- Any use of `document.createElement`, `ResizeObserver`, `IntersectionObserver` must be guarded.
- Virtual scrolling's scroll position tracking requires `window.scrollY` — not available server-side.
- The current `<svelte:head>` CDN link approach also fails in SSR-strict environments.

**Why it happens:** Browser APIs are used without environment guards.

**Prevention for v2:**

- Guard all browser-only code with `if (typeof window !== 'undefined')` or Svelte's `browser` import from `$app/environment`.
- Render a meaningful skeleton/placeholder on the server side — the table structure (headers, empty rows) can be server-rendered even if the data rendering is client-only.
- Custom Element registration must be lazy: only call `customElements.define()` inside a `browser` guard or inside `onMount`.
- Test SvelteKit with SSR enabled as part of CI from the start.

**Phase mapping:** Phase 4 (Web Components) and Phase 5 (integration testing). SSR guards must be built into the Web Components core.

---

### Pitfall 17: React wrapper event handling mismatch

**What goes wrong:** Custom Events fired by a Web Component (`new CustomEvent('cell-click', { detail: {...} })`) are not automatically handled by React's synthetic event system. React's `onClick` prop does not map to a Custom Event named `cell-click`. This means React consumers cannot receive table events naturally.

Additionally, React's reconciler does not assign DOM properties for unknown attributes — it passes them as HTML attributes (stringified), breaking complex data input (see Pitfall 14).

**Prevention for v2:** The React wrapper (`packages/react`) must:

1. Attach native DOM event listeners via `ref` + `addEventListener` for all Custom Events.
2. Forward those events as regular React props (`onCellClick`, `onSort`, etc.).
3. Assign complex data (rows, columns) via `ref.current.rows = value` after mount.
4. Use `React.forwardRef` so consumers can still access the underlying DOM element.

**Phase mapping:** Phase 5 (React wrapper package).

---

## DX Pitfalls

### Pitfall 18: TypeScript generics that are too complex for everyday use

**What goes wrong:** A table library that is generic over row type (`Table<TRow>`) must thread that generic through column definitions, cell renderers, sort callbacks, filter callbacks, and cell click handlers. If done naively, the resulting type signatures become unreadable and IntelliSense autocomplete stops working because TypeScript cannot infer the concrete type through too many indirections.

TanStack Table v8 suffers from this: the type inference for `columnHelper.accessor()` requires explicit type parameters in many cases, and the error messages when you get it wrong are incomprehensible.

**Why it happens:** Maximally type-safe generics require complex conditional types and infer keywords. These work but degrade IDE performance and produce difficult error messages.

**Prevention for v2:**

- Constrain the generic to `TRow extends Record<string, unknown>`. This is sufficient for the zero-config use case.
- Use `accessorKey: keyof TRow` to get type-safe column-to-property binding without deep generics.
- Provide a `defineColumns<TRow>()` helper function that captures the generic once and returns a typed array — users call this once per table, then get full autocompletion on column definitions.
- Test type inference with actual consumer usage patterns (not just the ideal case) before finalising types.
- Ship `.d.ts` files for all public APIs from day one, not as an afterthought.

**Phase mapping:** Phase 1 (TypeScript setup). Type architecture must precede implementation.

---

### Pitfall 19: The zero-config type inference false promise

**What goes wrong:** Auto-inferring renderer type from raw data is harder than it looks:

- A column containing `"2024-01-15"` — is it a date string or just a string?
- A column containing `"123"` — is it a number or a string code like a ZIP code?
- A column containing `"true"` — is it a boolean or the string `"true"`?
- A column containing URLs — is it an image URL or a link URL?
- A column containing `null` values — the type cannot be inferred from nulls.
- Mixed-type columns (some rows have numbers, some have strings) — what wins?

If inference gets it wrong and the user cannot easily override, they are worse off than a library with explicit column definitions.

**Why it happens:** Data inference seems simple in demos (clean, typed data) and is hard in production (dirty, heterogeneous, missing data).

**Prevention for v2:**

- Inference must be documented as a best-effort heuristic, not a guarantee.
- Provide a clear, one-prop override path (`columns={{ avatar: 'image' }}`).
- Inference heuristics must be tested against realistic dirty data: nulls, empty strings, mixed types, very long values, Unicode, special characters.
- Inference should err toward the safest renderer (`string`) when ambiguous — never choose a renderer that could fail (e.g., `image` for a URL column when some values are non-URL strings).
- Provide a debug prop that shows inferred types without rendering data, so developers can verify inference before deploying.

**Phase mapping:** Phase 2 (zero-config engine). The inference engine is the hardest part of v2 and must be built with extensive tests.

---

### Pitfall 20: Documentation that shows only the happy path

**What goes wrong:** Most table library documentation shows perfect, clean, pre-typed data. Real users have:

- Data from REST APIs with snake_case keys.
- Nullable/optional fields.
- Nested objects in cells.
- Very long text that wraps badly.
- Thousands of rows before they read the virtualisation docs.
- Data that arrives asynchronously.

When the documentation doesn't cover these cases, GitHub issues flood in asking the same questions. Maintainer time is consumed answering questions instead of building features. This is a common OSS sustainability killer.

**Prevention for v2:**

- The documentation site must include a live playground (REPL) where users paste their actual data and see inference results.
- Every feature must have a "real world" example alongside the clean demo example.
- The README must answer the top 5 questions before users have to file issues: "Why did my column not infer as a date?", "How do I override just one column type?", "How do I handle null values?", "How do I sort by a nested field?", "How do I add a custom renderer?".
- Track GitHub issue topics after launch and retroactively document the top questions within the first month.

**Phase mapping:** Phase 6 (docs site). But the documentation structure must be planned in Phase 1 so implementation choices align with what's documentable.

---

### Pitfall 21: The `colname` / `rowdata` migration cliff

**What goes wrong:** v1 has existing users who use the `colname` object syntax and `rowdata` array-of-arrays format. If v2 is a hard break (different prop names, different data shape), every existing user must rewrite their implementation. This creates a reputation for breaking changes and deters new adopters who fear the next breaking change.

**Warning signs:** A v2 CHANGELOG that says "all v1 props renamed; data format changed" with no migration path.

**Prevention for v2:**

- Ship a compatibility layer that detects `colname` and `rowdata` props and transforms them to the v2 internal format with a deprecation warning.
- The deprecation warning must include the exact v2 equivalent: "colname is deprecated. Use: `columns={[{key: 'string', type: 'string', label: 'Column1'}]}` (see migration guide)."
- Remove the compatibility layer only in v3, not v2.
- Publish a migration guide as part of the v2 announcement, with automated migration scripts if possible (codemod).

**Phase mapping:** Phase 1 (API foundation). The compatibility shim is part of the v2 API design, not an afterthought.

---

## OSS Sustainability Pitfalls

### Pitfall 22: The extension API that requires touching core code

**What goes wrong:** If adding a new renderer type requires modifying a central registry file, a switch statement, or the main component file, contributors cannot add renderers without risking merge conflicts and requiring maintainer review of core code. This bottleneck kills contribution momentum and forces the maintainer to be the gatekeeper for every new renderer.

**Why it happens:** The v1 architecture (single if-else chain in `returndatatype()`) requires exactly this: every new type requires modifying the core function. There is no plugin or extension point.

**Consequences for OSS:** The maintainer becomes the single point of failure for all renderer contributions. As requests accumulate, the backlog grows, contributors are frustrated, and the project stagnates.

**Prevention for v2:**

- Design a first-class renderer registry with a public `register(type: string, renderer: RendererComponent)` API.
- Publish the renderer interface as a TypeScript type so contributors can write renderers in isolation.
- Ship the built-in renderers using the same registry API — no special-cased built-in path.
- Write a "Contributing a new renderer" guide as part of the v2 docs.
- Consider a `@svelte-tables/community-renderers` companion package for renderers that are useful but not part of the core.

**Phase mapping:** Phase 2 (renderer architecture). The registry API must be designed before any built-in renderers are implemented.

---

### Pitfall 23: Monorepo complexity outpacing maintainer capacity

**What goes wrong:** A monorepo with packages for `core` (Web Components), `svelte`, `react`, and `vue` is 4x the maintenance surface of a single package. Each wrapper must be tested independently. Each has its own build pipeline, its own peer dependency matrix, its own versioning. When a core API changes, all 4 wrappers must be updated simultaneously.

For a solo or small-team project, this complexity can cause months-long delays between core improvements and wrapper updates, creating a two-tier experience where the Svelte package is current and the React/Vue packages are always behind.

**Prevention for v2:**

- Use a monorepo tool (Turborepo or pnpm workspaces) to share build scripts and enforce that wrapper builds are always run together.
- Write the Web Components core tests once; run them against each wrapper.
- For v2, launch with only the Svelte package and the Web Components core. Ship React and Vue wrappers as v2.1 or v2.2 after the core is stable. Scope creep at launch is a sustainability risk.
- Automate the wrapper build: the React and Vue wrappers should be thin generated wrappers with minimal hand-written code.

**Phase mapping:** Phase 1 (monorepo setup). Scope the initial launch carefully. Do not commit to 4 packages at launch.

---

### Pitfall 24: MIT vs ISC licensing confusion

**What goes wrong:** The current package.json lists `"license": "ISC"` but the repository has an MIT LICENSE file. This mismatch will cause automated license scanners (used by most enterprise security review toolchains) to flag the library as having a license conflict. Enterprise adopters with strict open-source compliance programs will be blocked from using the library until this is resolved.

**Why it matters for a library targeting AG Grid replacement:** AG Grid's enterprise product has a commercial license. One of the reasons developers look for alternatives is to avoid license complexity. If this library has a license inconsistency, it undermines the trust argument.

**Prevention for v2:** Reconcile the license in Phase 1. Choose MIT (the broader, more commonly understood license). Update `package.json` and the LICENSE file to match. This is a 5-minute fix that must not be missed.

**Phase mapping:** Phase 1 (foundation). Fix before the first v2 publish.

---

## Dependency Upgrade Pitfalls

### Pitfall 25: Svelte 3 → 5 migration breaking changes

**What goes wrong:** This is not a drop-in upgrade. Svelte 3 → Svelte 5 involves two distinct breaking layers:

**Layer 1: Svelte 3 → 4 changes** (mostly minor for this codebase)

- `on:eventname` deprecation in favour of `oneventname` prop (Svelte 4 warns, Svelte 5 removes)
- `<svelte:self>` and `<svelte:component>` semantics tightened
- CSS scoping changes for `:global()` selectors
- `createEventDispatcher` deprecated in favour of callback props

**Layer 2: Svelte 4 → 5 changes** (significant — requires rethinking reactivity)

- `let` reactive declarations replaced by `$state()` runes
- `$:` reactive statements replaced by `$derived()` and `$effect()`
- `export let` props replaced by `$props()` rune (different syntax entirely)
- `onMount` / `onDestroy` from `svelte` still work but `$effect` is preferred
- Component instantiation API changed (no more `new Component({...})` in tests)
- Stores (`writable`, `readable`) still work but `$state` is preferred for new code

**Specific v1 code breakages:**

1. `window.onload = enterdatatypes()` (line 13): This is not a Svelte pattern at all. In Svelte 5, use `$effect(() => { ... })` or remove entirely and derive `datatypelist` from `columns` as a `$derived`.

2. `export let colname`, `export let rowdata` (lines 2-5): In Svelte 5, replace with `let { colname, rowdata } = $props()`.

3. `bind:value={datatypelist[indexj]}` (line 154): Binding to an array index still works in Svelte 5 but reactivity semantics differ. If `datatypelist` is `$state()`, mutations to array indices are tracked. This needs testing.

4. `{@html returndatatype(...)}` (line 210): `{@html}` still exists in Svelte 5. But since we are removing this pattern anyway (Pitfall 9), this is moot.

5. `on:click={click}` (line 208): In Svelte 5, event directives (`on:`) are replaced with `onclick={click}` (lowercase, no colon, no `on:`). Both forms work during transition but `on:` is deprecated.

**Upgrade strategy for this specific codebase:**
Since v1 → v2 is a near-complete rewrite anyway (new prop API, new architecture, Web Components, TypeScript), do not attempt an incremental Svelte 3 → 4 → 5 migration of the existing code. Instead:

1. Scaffold v2 as a fresh Svelte 5 project using `sv create`.
2. Reference v1 source only for the renderer logic (what each type renders).
3. Re-implement using Svelte 5 idioms from scratch.
4. The v1 `colname`/`rowdata` compatibility layer can be written as a thin adapter in Svelte 5.

**Phase mapping:** Phase 1 (dependency upgrade). This is the first task before any v2 feature work.

---

### Pitfall 26: Rollup 2 → Vite/Rollup 4 config incompatibilities

**What goes wrong:** The current build configuration uses:

- `rollup-plugin-node-resolve` v5 (the standalone package, not `@rollup/plugin-node-resolve`)
- `@rollup/plugin-commonjs` v18
- `rollup-plugin-svelte` v7 (not `@sveltejs/vite-plugin-svelte`)
- `rollup-plugin-css-only` v3

**Specific breaking changes to address:**

1. `rollup-plugin-node-resolve` was renamed to `@rollup/plugin-node-resolve` (scoped package). The unscoped package stopped receiving updates at v5. Install `@rollup/plugin-node-resolve` (currently v15+).

2. Rollup 2 → 4 config format: `output.format: 'esm'` stays the same, but the `watch` option, `treeshake` configuration, and plugin API have changed. `rollup.config.js` must be reviewed line by line.

3. For Svelte library authoring, the recommended toolchain is no longer bare Rollup — it is `@sveltejs/package` (also called `svelte-package`), which wraps Vite and handles the SvelteKit package convention (exports map, types, .svelte source files). This is the industry standard as of 2024-2025.

4. `rollup-plugin-css-only` is not needed with Vite/`svelte-package` — CSS handling is built-in.

**Safe upgrade path:**

```
Step 1: Install Svelte 5, @sveltejs/package, vite (do NOT touch existing config)
Step 2: Create new build config alongside old one
Step 3: Verify new build produces equivalent output
Step 4: Remove old rollup config and plugins
Step 5: Update package.json scripts to use svelte-package
```

Do not do this all at once. Verify the build output at each step.

**Phase mapping:** Phase 1. This must be completed and verified before any v2 feature code is written. A broken build toolchain blocks everything downstream.

---

### Pitfall 27: Peer dependency conflicts in the monorepo consumer ecosystem

**What goes wrong:** When this library ships as multiple packages (core, svelte, react, vue), each package has peer dependencies on its framework. Consumers using package managers with strict peer dependency enforcement (pnpm, recent npm) will see errors if:

- The Svelte wrapper requires `svelte: ^5.0.0` as a peer but the consumer has `svelte: ^4.0.0`.
- The React wrapper requires `react: ^18.0.0` as a peer but the consumer has `react: ^17.0.0`.
- Two packages in the consumer's dependency tree have conflicting peer requirements for Svelte.

**Specific risk for this project:** A consumer using SvelteKit might have Svelte as a regular dependency (not peer), causing duplicate Svelte instances if the library also installs its own Svelte copy. Duplicate Svelte instances cause reactive state to not synchronise across the library/consumer boundary — a subtle, hard-to-diagnose bug.

**Prevention for v2:**

- Mark Svelte as `peerDependencies` (not `dependencies`) in the Svelte wrapper package. Document the minimum supported version (`svelte: >=5.0.0`).
- Do not list Svelte in `dependencies` at all — only `peerDependencies` and `devDependencies`.
- Test against the minimum Svelte 5 release (5.0.0), not just the latest.
- For the Web Components core (`packages/core`): zero framework peer dependencies. The core must be framework-free.
- Use `pnpm link` or `yalc` during development to test the packages as a real consumer would install them — not just via workspace symlinks.

**Phase mapping:** Phase 1 (monorepo setup). Package manifests must be correct from the start — retroactive peer dep fixes are painful.

---

### Pitfall 28: Node.js version compatibility across the toolchain

**What goes wrong:** The current `package.json` has no `engines` field. Different team members or CI environments may run different Node.js versions. Svelte 5, Vite 5, and `@sveltejs/package` all require Node.js 18+ (Node 16 is EOL since September 2023). Running on Node 16 produces cryptic errors or silent failures.

**Prevention for v2:**

- Add `"engines": { "node": ">=18.0.0" }` to all package manifests.
- Specify this in the monorepo root as well.
- Pin Node.js version in CI (`.nvmrc` or GitHub Actions `node-version`).
- Consider Node 20 LTS as the minimum — it is the oldest active LTS as of 2026.

**Phase mapping:** Phase 1 (monorepo setup). One-time configuration, takes minutes, prevents hours of debugging.

---

### Pitfall 29: Missing `exports` map causing deep import failures

**What goes wrong:** The current `package.json` uses `"main"` and `"module"` fields for dual ESM/CJS output. Modern bundlers (Vite, webpack 5, rollup with node-resolve) use the `"exports"` field instead. Without a correct `exports` map:

- Deep imports (`import { ImageRenderer } from 'svelte-tables/renderers/image'`) fail with "Package subpath './renderers/image' is not defined" errors.
- TypeScript cannot find type declarations via `moduleResolution: "bundler"` or `"node16"`.
- Tree-shaking hints are not communicated to the bundler.
- The `svelte` condition (used by `@sveltejs/vite-plugin-svelte` to prefer `.svelte` source files over compiled output) is missing.

**Prevention for v2:** Use `@sveltejs/package` to generate the `exports` map automatically. It correctly adds the `svelte` condition for all `.svelte` file exports. Manually verify the generated `package.json` `exports` field after each build.

**Phase mapping:** Phase 1 (build system). Cannot ship a library without a correct `exports` map in 2026.

---

## Summary: Critical Watchlist

This table orders pitfalls by severity and phase. All Phase 1 items are blockers — nothing from Phase 2 onward can succeed until they are resolved.

| #   | Pitfall                                                           | Category             | Severity | Phase   |
| --- | ----------------------------------------------------------------- | -------------------- | -------- | ------- |
| 9   | XSS via `{@html}` with unsanitized values                         | Security/Performance | CRITICAL | Phase 1 |
| 4   | Runtime type-switcher dropdown in every header                    | API Design           | CRITICAL | Phase 1 |
| 1   | `colname` object keys = column type names (uniqueness constraint) | API Design           | CRITICAL | Phase 1 |
| 25  | Svelte 3 → 5 migration — runes, event syntax, prop API            | Dependency Upgrade   | CRITICAL | Phase 1 |
| 26  | Rollup 2 → Vite/svelte-package build system                       | Dependency Upgrade   | CRITICAL | Phase 1 |
| 10  | Tailwind CDN injection in `<svelte:head>`                         | Performance/DX       | CRITICAL | Phase 1 |
| 24  | ISC/MIT license mismatch                                          | OSS                  | HIGH     | Phase 1 |
| 29  | Missing `exports` map in package.json                             | Dependency Upgrade   | HIGH     | Phase 1 |
| 6   | Rendering all rows without virtualisation                         | Performance          | HIGH     | Phase 3 |
| 8   | Event listener per cell instead of delegation                     | Performance          | HIGH     | Phase 3 |
| 11  | All renderers bundled unconditionally                             | Bundle Size          | HIGH     | Phase 2 |
| 12  | Svelte component inlining breaking tree-shaking                   | Bundle Size          | HIGH     | Phase 1 |
| 15  | Shadow DOM blocking Tailwind classes                              | Framework-Agnostic   | HIGH     | Phase 4 |
| 16  | SSR incompatibility with Web Components                           | Framework-Agnostic   | HIGH     | Phase 4 |
| 14  | Custom Element attribute vs property reflection                   | Framework-Agnostic   | HIGH     | Phase 4 |
| 22  | Extension API requiring core file modification                    | OSS                  | HIGH     | Phase 2 |
| 21  | `colname`/`rowdata` migration cliff                               | API Design           | HIGH     | Phase 1 |
| 2   | Renderer names as untyped string literals                         | API Design           | MEDIUM   | Phase 1 |
| 3   | Zero-config to power-config cliff                                 | API Design           | MEDIUM   | Phase 2 |
| 5   | Feature accretion without API design discipline (AG Grid trap)    | API Design           | MEDIUM   | Ongoing |
| 7   | Re-render cascade from reactive column definitions                | Performance          | MEDIUM   | Phase 2 |
| 13  | CSS specificity wars and stylesheet ordering                      | Bundle Size          | MEDIUM   | Phase 2 |
| 17  | React wrapper Custom Event handling mismatch                      | Framework-Agnostic   | MEDIUM   | Phase 5 |
| 18  | TypeScript generics too complex for everyday use                  | DX                   | MEDIUM   | Phase 1 |
| 19  | Zero-config inference false promise (dirty data)                  | DX                   | MEDIUM   | Phase 2 |
| 20  | Documentation happy-path only                                     | DX                   | MEDIUM   | Phase 6 |
| 23  | Monorepo complexity outpacing maintainer capacity                 | OSS                  | MEDIUM   | Phase 1 |
| 27  | Peer dependency conflicts in consumer ecosystem                   | Dependency Upgrade   | MEDIUM   | Phase 1 |
| 28  | Node.js version compatibility                                     | Dependency Upgrade   | LOW      | Phase 1 |

### Top 5 Architecture Decisions That Prevent the Most Pitfalls

1. **Row data as array of objects, columns as array of descriptors** — eliminates Pitfalls 1, 21, and much of Pitfall 19.
2. **Renderer registry pattern with individual importable files** — eliminates Pitfalls 11, 12, 22.
3. **No Shadow DOM, Light DOM Web Components** — eliminates Pitfall 15, simplifies Pitfalls 14 and 16.
4. **Event delegation at table level** — eliminates Pitfall 8, enables virtual scrolling (Pitfall 6).
5. **`$derived` state graph with separated concerns** — mitigates Pitfall 7, enables performant sorting/filtering.

### Phase 1 Non-Negotiable Checklist

Before any v2 feature work begins, these must be resolved:

- [ ] Remove `window.onload` call — replace with Svelte 5 lifecycle
- [ ] Remove Tailwind CDN `<svelte:head>` link
- [ ] Remove runtime type-switcher dropdown (or gate behind explicit `devMode` prop)
- [ ] Remove all `{@html user_data}` patterns — replace with component-per-renderer
- [ ] Fix ISC/MIT license discrepancy
- [ ] Scaffold Svelte 5 monorepo with `@sveltejs/package` build
- [ ] Add `exports` map to all package manifests
- [ ] Add `engines` field specifying Node 18+
- [ ] Mark Svelte as `peerDependency` not `dependency`
- [ ] Design and document TypeScript column types before implementing anything

---

_Research methodology: Training data synthesis (HIGH confidence for API/architecture patterns), project codebase analysis (HIGH confidence for project-specific findings), Svelte 5 migration knowledge (HIGH confidence, well-documented migration path)._

_Sources: TanStack Table migration guides (training data, pre-August 2025), Svelte 5 runes documentation (training data), Web Components specification (training data), Custom Elements and React compatibility (training data, pre-React 19 patterns are well-established), CONCERNS.md project audit (project file, 2026-03-19)._
