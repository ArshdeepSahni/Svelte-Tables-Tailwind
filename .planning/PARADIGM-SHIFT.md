# The Paradigm Shift: Building the iPhone of Tables

**Thesis:** Today's table libraries are specialized tools for data display. @tablecraft must be a rethinking of what tables are—from inert display surfaces to intelligent, adaptive, magical data interfaces.

The goal is not to be the fastest or most feature-rich table. It's to be the one that makes users say: "I can NEVER go back."

---

## Part 1: What's Broken (Competitive Analysis)

### AG Grid: The Legacy Problem
**Top 5 UX Failures:**
1. **Breaking changes every release** — Users spend years maintaining fragile dependencies instead of using the product
2. **Steep learning curve** — Feels more like a system than a tool; requires deep API knowledge
3. **Configuration overload** — 100+ options that 90% of users will never touch
4. **Inflexible to custom workflows** — Enterprise-first design means simple use cases feel over-engineered
5. **Clunky interactions** — Interactions feel mechanical, not delightful; no sense of buttery smoothness

*Sources:* [GitHub Issue: "Do you hate your users?" on AG Grid breaking changes](https://github.com/ag-grid/ag-grid/issues/9556), [AG Grid Support Issues](https://ag-grid.zendesk.com/hc/en-us/sections/360002265312-Known-issues), [G2 Community Reviews](https://www.g2.com/products/ag-grid/reviews)

---

### TanStack Table: The Headless Trap
**Top 5 UX Failures:**
1. **Headless = Helpless** — No UI means users rebuild the same patterns 1000x across the web
2. **Memory usage with grouping** — 30-40 second render times on 50k rows with grouping active
3. **Virtualization not included** — Must pair with react-virtual and manage state externally
4. **Steep API** — Hook-based API requires memoization patterns, mental models, debugging skills
5. **No out-of-box polish** — Works, but feels unfinished; every implementation looks different

*Sources:* [TanStack Table Discussion: "Why so overcomplicated?"](https://github.com/TanStack/table/discussions/2147), [DronaHQ Review of React Table Limitations](https://www.dronahq.com/top-react-tables/), [JP Camara: Making TanStack Table 1000x faster](https://jpcamara.com/2023/03/07/making-tanstack-table.html)

---

### Notion Tables: The Note-Taking App Problem
**Top 5 UX Failures:**
1. **Performance degrades with scale** — Gets "buggy and slow" with large datasets (designed as text-first, not data-first)
2. **Limited relational power** — Cannot handle complex multi-table queries or advanced joins
3. **Text display priority** — Clean text editing comes at the cost of being mediocre at structured data
4. **Not designed for dense information** — Works great for 50 rows, breaks down at 500+
5. **Presentation-first, flexibility-second** — Easy for beginners, limited for power users

*Sources:* [Airtable vs Notion Comparison](https://www.whalesync.com/blog/airtable-vs-notion-the-ultimate-guide), [Comparison: Whalesync](https://efficient.app/compare/airtable-vs-notion), [Nuclino Analysis](https://www.nuclino.com/solutions/airtable-vs-notion)

---

### Airtable: The Locked-In Enterprise
**Top 5 UX Failures:**
1. **Vendor lock-in** — Difficult to export or migrate data freely
2. **Mobile UX is secondary** — Optimized for desktop, mobile is an afterthought
3. **Pricing per view** — Complex licensing that makes power users expensive
4. **Automation requires configuration** — Not accessible to non-technical users
5. **Limited inline editing polish** — Actions and edits feel clunky compared to native apps

*Sources:* [Lovable: 8 Best Airtable Alternatives](https://lovable.dev/guides/airtable-alternatives-custom-apps), [Zapier: Airtable vs Notion](https://zapier.com/blog/airtable-vs-notion/)

---

### Google Sheets: The Spreadsheet Illusion
**Top 5 UX Failures:**
1. **Designed for text cells, not data** — Formula-first mindset creates tension with modern UI/UX
2. **Mobile experience is weak** — Designed for desktop; mobile feels like an afterthought
3. **Collaboration has lag** — Real-time sync is good, but not zero-latency smooth
4. **No intelligent defaults** — Requires manual setup of filters, sorts, formatting
5. **Performance cliffs** — Slows down dramatically past 10k rows; no built-in virtualization

*Sources:* [Google Sheets Tables Feature](https://www.owox.com/blog/articles/tables-feature-google-sheets)

---

### Common Pattern: What EVERY Table Gets Wrong

**The Seven Deadly Sins of Current Tables:**

1. **Configuration > Convention** — Users must tell the table how to behave instead of it learning from data
2. **Dumb display, smart users required** — No intelligence to column types, sorting, filtering, or data relationships
3. **Rigid structure** — Table is table. Can't fluidly shift to timeline, kanban, or custom views
4. **Invisible labor** — Editing requires modal dialogs, page navigation, or awkward inline modes
5. **No presence** — Who's viewing? Who's editing? Collaboration is a bolt-on, not native
6. **Interaction debt** — Every hover, click, scroll feels like it was designed in 2015
7. **No context awareness** — Table doesn't understand what data means, what columns relate to, what actions matter

---

## Part 2: The 10 Paradigm Shifts

### 1. **Zero-Config Intelligence** (Impact: 9/10 | Feasibility: 7/10 | Differentiation: 9/10)

**The Paradigm Shift:**
The table automatically understands your data without configuration. Column types inferred. Sort orders guessed. Relationships discovered. Default actions inferred from data patterns.

**Why it's a paradigm shift:**
Users spend 60% of their time configuring tables. @tablecraft should spend that time being smart. When a user drops in data with a `created_at` column, the table KNOWS to sort by it descending. A `status` column triggers multi-select filtering. A `price` column knows it's currency. This is table-as-AI.

**How to implement:**
- **Automatic type inference** — Use first 100 rows to detect column types (number, currency, percentage, date, email, URL, enum, boolean)
- **Smart defaults** — If column name matches patterns (`id`, `_id`, `pk`), hide it by default. If date column, sort descending
- **Relationship discovery** — Detect foreign keys based on naming patterns (`user_id` → links to users)
- **Action inference** — If `url` column exists, show "open" action. If `email`, show "send email" action
- **Format guessing** — Phone numbers auto-format. Dates render in locale. Large numbers get thousands separators

**Deliverable:**
- Column type auto-detection algorithm with 90%+ accuracy
- Smart defaults JSON config (generated, not configured)
- User can override in 1 click, not 1 dialog

---

### 2. **Natural Language Everything** (Impact: 8/10 | Feasibility: 6/10 | Differentiation: 10/10)

**The Paradigm Shift:**
"show me top performers" becomes a filter. "average revenue by region" creates a summary. "send email to leads" becomes a bulk action. Natural language, zero dev syntax.

**Why it's a paradigm shift:**
SQL, Excel formulas, and filter syntax are developer languages masquerading as user-friendly. Notion got close with text-first approach. @tablecraft should speak human.

**How to implement:**
- **NLP layer (client-side)** — Use browser-compatible ML model (ONNX.js) to parse natural language queries
- **Query-to-filter translation** — "high revenue" → `revenue > percentile(0.75)`. "last 30 days" → `date > now() - 30 days`
- **Aggregation detection** — "average salary by department" → create grouped summary view
- **Action syntax** — "bulk update status to shipped" → creates batch action UI
- **Learning from corrections** — User rejects filter suggestion; system learns and improves next time

**Quick wins (Phase 1):**
- Predefined natural language templates for common patterns (100 most common)
- Fuzzy matching against column names ("salse" → "sales")
- Simple token parsing for operators ("greater than", "contains", "starts with")

**Ambitious (Phase 2):**
- Fine-tuned LLM specific to table queries (similar to how Copilot works in Excel)
- Integration with backend APIs for semantic search on data

---

### 3. **Spatial Awareness** (Impact: 7/10 | Feasibility: 8/10 | Differentiation: 8/10)

**The Paradigm Shift:**
Table is not a linear list. It's a 2D canvas where position, grouping, and spatial organization encode meaning. Same data, different spatial arrangements, different insights.

**Why it's a paradigm shift:**
Excel users intuitively understand that spatial organization = information hierarchy. @tablecraft should make position as important as values. Drag a column to the left = higher priority. Columns cluster by category. Rows cluster by similarity.

**How to implement:**
- **Column grouping visualization** — Show column categories with subtle visual hierarchy (light dividers, subtle background colors)
- **Drag-to-reorder is primary** — Not in settings; drag columns left/right to prioritize. First 3 columns are most important
- **Row grouping visualization** — "Group by region" creates visual row separators and summary rows
- **Pinning with visual affordance** — First 2-3 columns pinned by default, visually distinct from scrollable columns
- **Density awareness** — "Compact" mode shows more rows; "spacious" shows breathing room; user doesn't choose—data density chooses
- **Implicit sorting via position** — Sorted column gets visual elevation; multiple sorts show as levels

**Deliverable:**
- Column reordering that updates pinning automatically
- Row grouping that preserves data integrity (groups are views, not mutations)
- Visual hierarchy system that scales from 5 to 500 columns gracefully

---

### 4. **Time Travel** (Impact: 6/10 | Feasibility: 5/10 | Differentiation: 10/10)

**The Paradigm Shift:**
Full undo/redo with visual timeline. Branch states (what if I delete this row?). Revert to any point in table's history. Time becomes navigable like space.

**Why it's a paradigm shift:**
Spreadsheets have undo. Databases don't. Notion has version history but it's hidden and slow. @tablecraft should make time the 5th dimension. Users should feel safe to explore because they can always revert.

**How to implement:**
- **CRDT-based state management** — Use Yjs or Automerge to track every cell change
- **Visual timeline** — Slider at bottom showing time; scrub to see state at any point
- **Branch indicators** — "You're 3 edits ahead of last save" with visual branch metaphor
- **Diff visualization** — Hover any point on timeline; changed cells highlight
- **Instant revert** — Click any historical state; table reverts without confirmation (safe because time-travelable)
- **Collaborative branching** — Multiple users can have divergent edits; merge with conflict resolution

**Phase 1 (MVP):**
- Undo/redo with 50-item history buffer
- Timestamp on each edit visible in cell hover

**Phase 2:**
- Full timeline scrubber with diff preview
- Multi-branch support

---

### 5. **Collaborative Intelligence** (Impact: 8/10 | Feasibility: 7/10 | Differentiation: 9/10)

**The Paradigm Shift:**
Real-time presence, comments on cells, @mentions, activity feed. Not a bolt-on; native to every interaction. Collaboration is the default, not the exception.

**Why it's a paradigm shift:**
Google Docs showed that collaborative editing feels magical. AG Grid has zero collaboration. @tablecraft should make collaboration so natural that single-user feels lonely.

**How to implement:**
- **User presence avatars** — Colored avatars show who's viewing/editing; follows cursor across table
- **Cell-level commenting** — Click cell header to add comment thread; shows unresolved count
- **Selection visibility** — When Alice selects rows, Bob sees Alice's selection as highlighted range
- **@mention in comments** — Notify teammates inline; integrates with Slack if available
- **Activity feed in sidebar** — "Bob added 10 rows", "Alice changed filter", "Charlie resolved comment"
- **Edit locks** — When Bob starts editing a cell, it locks for 5 seconds; prevents conflicts without formal checkout
- **Change history per cell** — Hover any cell; see "edited by Alice at 2:15pm" with link to full edit chain

**Deliverable:**
- Presence system using WebSocket or Liveblocks
- Comment threads attached to cells/rows
- Activity log with timestamps and diffs

---

### 6. **Adaptive Density** (Impact: 7/10 | Feasibility: 8/10 | Differentiation: 7/10)

**The Paradigm Shift:**
Row height adapts to content. Compact mode shows 500 rows. Spacious mode shows 10. Text truncation is intelligent. Never waste vertical space; never sacrifice readability.

**Why it's a paradigm shift:**
Every table is a compromise: dense data, sparse readability. Or readable, but only 10 rows visible. @tablecraft should adapt. Long text cells expand; short cells stay compact.

**How to implement:**
- **Content-aware row heights** — Row height auto-expands based on longest cell in that row
- **Density slider (global)** — Adjusts both row padding and font size; live preview as you drag
- **Per-column text handling** — Long text shows first line + "...", click to expand inline (not modal)
- **Smart truncation** — URLs truncate from middle, not end. Email shows first part before @
- **Responsive text** — On small screens, switches to single-column card view automatically
- **Compact mode quick-access** — Right-click header; "Compact", "Normal", "Spacious"

**Deliverable:**
- Dynamic row height calculation
- Density presets with saved preferences
- Truncation logic that preserves scannability

---

### 7. **Micro-interactions at 60fps** (Impact: 8/10 | Feasibility: 9/10 | Differentiation: 8/10)

**The Paradigm Shift:**
Every interaction—scroll, sort, filter, drag, edit—feels buttery smooth. No janky transitions. No frame drops. Interactions confirm action through haptic feedback and animation, not UI affordances.

**Why it's a paradigm shift:**
Apple's design philosophy: micro-interactions communicate intent and delight. Current tables are mechanical. @tablecraft should feel like touching glass, not pressing buttons.

**How to implement:**
- **Scroll momentum** — Native scroll physics; doesn't stop abruptly at boundaries
- **Sort animation** — When clicking sort, column glows, rows reorder with smooth stagger animation (80ms total)
- **Filter state transition** — Filtered-out rows fade out, remaining rows reposition smoothly
- **Drag feedback** — Column being dragged gets 20% opacity; target drop zone highlights
- **Edit mode transition** — Click cell; border appears, focus glows, keyboard ready in <100ms
- **Hover states** — Row hover: background shifts to #fafafa. Action buttons fade in (200ms)
- **Haptic feedback** — On mobile: subtle vibration when sort completes, when row selected, when edit confirmed
- **Loading state** — Skeleton rows appear while data loads; never show blank space

**Tech stack:**
- Framer Motion or similar for orchestrated animations
- CSS transforms for maximum performance (no layout thrashing)
- RequestAnimationFrame for custom physics
- Web Haptics API for mobile feedback

**Deliverable:**
- Motion design system (easing curves, durations, stagger amounts)
- Performance budget: every interaction 60fps or better
- Haptic feedback on iOS/Android

---

### 8. **Composable Views** (Impact: 9/10 | Feasibility: 6/10 | Differentiation: 9/10)

**The Paradigm Shift:**
Same underlying data, infinite display lenses. Toggle between table, kanban, timeline, chart, calendar, form. Not separate components; unified data model with pluggable renderers.

**Why it's a paradigm shift:**
Notion's biggest win: same data, different views. But switching views is slow and janky. @tablecraft should make view-switching instant and preserve context (scroll position, selection, filters).

**How to implement:**
- **View abstraction layer** — Data model decoupled from renderer
  - Renderer 1: Table (rows × columns)
  - Renderer 2: Kanban (grouped columns as swim lanes)
  - Renderer 3: Timeline (x-axis is date, y-axis is group)
  - Renderer 4: Chart (aggregated data with visual encoding)
  - Renderer 5: Calendar (date column as calendar grid)
  - Renderer 6: Form (single row as form fields)
- **Instant view switching** — Click view icon; transition in 200ms without re-fetching data
- **View-specific filters** — Each view can have independent filters/sorts; saved separately
- **Shared selection** — Select rows in table; same rows highlighted in kanban
- **Persistent scroll position** — Switch to kanban, back to table; scroll position restored

**Architecture:**
- Core `DataModel` class (handles data, sorting, filtering, grouping)
- View interface: `render(dataModel, filters, sorts, groups) → VirtualDOMNodes`
- Each renderer independently tree-shakable

**Phase 1:**
- Table + Kanban (80% of use cases)

**Phase 2:**
- Timeline, Chart, Calendar, Form

---

### 9. **Smart Defaults, Infinite Customization** (Impact: 9/10 | Feasibility: 8/10 | Differentiation: 9/10)

**The Paradigm Shift:**
Works perfectly out-of-box for 90% of use cases. But nothing is locked. 60+ CSS tokens, every visual property customizable. Same codebase: starter to enterprise without re-implementation.

**Why it's a paradigm shift:**
TanStack Table is powerful but requires 1000 lines of setup. AG Grid works but feels like "enterprise bloat". @tablecraft should be baby-simple by default, infinitely powerful when needed.

**How to implement:**
- **CSS Custom Properties for everything:**
  ```css
  --tc-border-color: #f0f0f0
  --tc-row-height: 40px
  --tc-header-bg: #fff
  --tc-hover-bg: #fafafa
  --tc-text-color: #0a0a0a
  --tc-accent-color: #0a0a0a
  --tc-font-size: 14px
  --tc-font-family: system-ui
  --tc-selection-bg: #e0e0ff
  --tc-stripe-color: transparent
  --tc-shadow-color: rgba(0,0,0,0.05)
  ```
  (60+ tokens covering all visual aspects)

- **Component slots for customization:**
  ```svelte
  <Table {data}>
    <HeaderCell let:column>
      <!-- Override header rendering -->
      <div class="my-custom-header">{column.name}</div>
    </HeaderCell>
    <Cell let:value let:column>
      <!-- Override cell rendering -->
      {#if column.type === 'url'}
        <a href={value}>{value}</a>
      {:else}
        {value}
      {/if}
    </Cell>
  </Table>
  ```

- **No Tailwind in library** — CSS custom properties only (as per CLAUDE.md)
- **User can override globally** — One CSS file; affects entire table instance
- **Zero vendor lock-in** — Table renders semantic HTML; easy to style with any CSS approach

**Deliverable:**
- Component with 5-10 slots for customization
- 60+ CSS tokens documented
- 10 pre-built themes (light, dark, minimalist, bordered, striped, etc.)

---

### 10. **AI as Co-pilot** (Impact: 7/10 | Feasibility: 5/10 | Differentiation: 10/10)

**The Paradigm Shift:**
AI doesn't replace thinking; it augments it. "Highlight anomalies", "Suggest categories", "Auto-format this column", "Find correlations". AI surfaces insights without user asking.

**Why it's a paradigm shift:**
Excel/Google Sheets have zero intelligence. Notion has some AI but it's hidden. @tablecraft should make AI a collaborative partner, always available, never intrusive.

**How to implement:**
- **Client-side AI suggestions** (no server calls)
  - Anomaly detection: Highlight rows that deviate >2σ from mean
  - Category suggestion: "This column looks like it should be an enum; suggested values: [A, B, C]"
  - Format suggestion: "This column looks like currency; format as $?"
  - Duplicate detection: "Found 3 potential duplicate rows"
  - Missing value inference: "Col A is 90% complete; infer missing 10%?"

- **Optional server-side AI** (for power users)
  - Natural language query execution
  - Predictive sorting: "Based on your filters, you usually want to sort by revenue descending"
  - Trend detection: "Sales are trending down 15% month-over-month"
  - Forecasting: "Based on history, next month will have X orders"

- **UI for AI**
  - Sidebar "Suggestions" panel; users accept/reject
  - Sparkline indicator: "AI found something interesting in this column"
  - Tooltip explanations: "Why anomaly? Because it's 3x higher than average"

**Phase 1:**
- Client-side anomaly highlighting
- Category suggestion

**Phase 2:**
- Connect to LLM API for natural language queries
- Trend forecasting

---

## Part 3: The "iPhone Moment" Features

What 3-5 features would make someone say "I can NEVER go back to AG Grid"?

### Feature 1: **Instant View Switching (Table → Kanban → Timeline)**
Clicking a view icon switches rendering in 200ms, preserving filters, selection, and scroll context. This single feature eliminates the need for separate tools (Airtable, Notion, specialized timeline apps). One component, infinite views.

**Why iPhone moment?** "I can see my data through any lens without leaving the app, and switching costs nothing."

---

### Feature 2: **Natural Language Filtering**
Say "show me high performers from last quarter" and the table filters itself. No SQL, no filter builder UI, just human language. Combined with AI suggestions, users feel like they have a smart assistant.

**Why iPhone moment?** "My data talks to me in my language, not forcing me to speak computer."

---

### Feature 3: **Collaborative Presence + Comments on Cells**
See who's viewing/editing in real-time. Click a cell to start a comment thread. @mention teammates. Activity feed shows all changes. Suddenly tables become team coordination tools, not isolated data silos.

**Why iPhone moment?** "We don't need Slack + Google Sheets + Asana. Everything happens in one place, and I see what everyone is doing."

---

### Feature 4: **Smart Defaults That Just Work**
Drop in any data; the table is immediately usable. Columns auto-detected and formatted. Sensible sorting applied. Actions inferred. Zero configuration required, but every pixel customizable with CSS tokens.

**Why iPhone moment?** "It works perfectly out-of-the-box. I didn't have to read docs or configure anything. But when I want to customize it to my brand, I can change everything."

---

### Feature 5: **Time Travel (Undo/Redo with Visual Timeline)**
Scrub back in time to see any previous state. Branch states (what if I delete these 100 rows?). Revert with confidence knowing you can always go back. No "are you sure?" modals; just safe exploration.

**Why iPhone moment?** "I can fearlessly explore because time is navigable. No more paranoia about accidentally deleting data."

---

## Part 4: Implementation Priority

**Ranked by Impact × Feasibility × Differentiation / (3 Months Effort)**

### Tier 1: Ship in MVP (Q2 2026)
These are non-negotiable. Each alone justifies a rewrite from AG Grid.

| Feature | Impact | Feasibility | Differentiation | Est. Effort | Score |
|---------|--------|-------------|-----------------|-------------|-------|
| Zero-Config Intelligence | 9 | 7 | 9 | 2 weeks | **9.0** |
| Micro-interactions at 60fps | 8 | 9 | 8 | 1 week | **8.3** |
| Smart Defaults, Infinite Customization | 9 | 8 | 9 | 2 weeks | **8.7** |
| Adaptive Density | 7 | 8 | 7 | 1 week | **7.3** |
| Composable Views (Table + Kanban) | 9 | 6 | 9 | 3 weeks | **8.0** |

**Phase 1 Output:** Table component that is beautiful, intelligent, and collaborative by default. 5 renderer types. Instant view switching. No configuration required, infinite customization available.

---

### Tier 2: Follow-up Release (Q3 2026)
Multiply the impact of Tier 1.

| Feature | Impact | Feasibility | Differentiation | Est. Effort | Score |
|---------|--------|-------------|-----------------|-------------|-------|
| Natural Language Everything | 8 | 6 | 10 | 4 weeks | **8.0** |
| Collaborative Intelligence | 8 | 7 | 9 | 2 weeks | **8.0** |
| Time Travel (Undo/Redo + Timeline) | 6 | 5 | 10 | 2 weeks | **7.0** |
| Spatial Awareness | 7 | 8 | 8 | 2 weeks | **7.7** |

**Phase 2 Output:** Table is intelligent, collaborative, and time-aware. Natural language queries. Full presence and commenting. Visual undo/redo timeline.

---

### Tier 3: Specialization (Q4 2026+)
Power-user and enterprise-specific features.

| Feature | Impact | Feasibility | Differentiation | Est. Effort | Score |
|---------|--------|-------------|-----------------|-------------|-------|
| AI as Co-pilot | 7 | 5 | 10 | 3 weeks | **7.3** |
| Additional Views (Timeline, Chart, Calendar) | 9 | 6 | 8 | 4 weeks | **7.7** |

---

## The Roadmap: From Today to Paradigm Shift

### Weeks 1-2: Foundation
- Solid implementation of Zero-Config Intelligence
- First 60 CSS tokens defined and documented
- Micro-interaction system (easing curves, timing)

### Weeks 3-4: MVP Delight
- Kanban view implemented
- Adaptive density finalized
- 60fps performance baseline achieved

### Weeks 5-6: Collaboration
- Presence system working (avatars show who's viewing)
- Comments on cells
- Activity log

### Weeks 7-8: Polish & Launch
- All Tier 1 features complete
- 10 pre-built themes
- Landing page showing paradigm shifts vs competitors

### Months 3-4: Natural Language
- NLP layer for filter translation
- Suggested filters based on data patterns
- AI anomaly highlighting

### Months 4-5: Time Travel
- CRDT-based state management
- Visual undo/redo timeline
- Branching state support

---

## Success Metrics

**By end of Phase 1:**
- Developers say "I deleted AG Grid and never looked back"
- 90% of tables require zero configuration
- Performance on 100k rows: <16ms render, 60fps scroll
- Customization: 100% CSS token coverage of all visual properties
- Collaboration: Real-time presence + commenting working seamlessly

**By end of Phase 2:**
- Users say "I can't imagine using a separate tool for views anymore"
- Natural language queries work for 80% of common filtering patterns
- Time travel makes users feel fearless about data exploration
- Table adoption in companies with 10+ users where collaboration matters

---

## Competitive Differentiation Summary

| Dimension | AG Grid | TanStack | Notion | Airtable | **@tablecraft** |
|-----------|---------|----------|--------|----------|-----------------|
| Config required | Heavy | Medium | Low | Low | **Zero** |
| Out-of-box delight | No | No | Yes | Yes | **Yes** |
| Collaborative | No | No | Yes | Yes | **Yes** |
| View switching | No | No | Yes | Yes | **Yes** |
| AI-powered | No | No | Limited | Limited | **Yes** |
| Time travel | No | No | Basic | No | **Yes** |
| Micro-interactions | No | No | Good | Good | **World-class** |
| Customization depth | Deep | Deep | Shallow | Shallow | **Deep + Easy** |
| Learning curve | Steep | Medium | Shallow | Shallow | **Gentle** |
| **Summary** | Legacy | Headless | Document-centric | Platform lock-in | **iPhone** |

---

## The North Star Question

**For every feature, ask: "Does this make someone say 'I can NEVER go back'?"**

If the answer is no, it's a nice-to-have. If yes, it's core.

- Zero-Config Intelligence? Yes. "I'll never tolerate configuring columns again."
- Natural Language? Yes. "Why would I type SQL or use a filter builder?"
- Collaboration? Yes. "Tables without live presence feel lonely."
- Time Travel? Yes. "One-way data operations are the dark ages."
- Micro-interactions? Yes. "Mechanical interactions feel slow even at 60fps."

Build these five pillars, and @tablecraft becomes inevitable.
