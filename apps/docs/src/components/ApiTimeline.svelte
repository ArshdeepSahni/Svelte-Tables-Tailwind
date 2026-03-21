<script lang="ts">
  interface Props {
    darkMode: boolean;
  }
  let { darkMode }: Props = $props();

  interface TimelineItem {
    year: string;
    title: string;
    description: string;
    type: 'pain' | 'insight' | 'solution';
    code?: string;
  }

  const timeline: TimelineItem[] = [
    {
      year: '2016',
      title: 'The Schema-First Era',
      description: 'Every major table library demands you declare your schema upfront. AG Grid\'s columnDefs, React Table\'s columns array — 15-30 lines per table, copied and modified for each new use case. The boilerplate was becoming crippling.',
      type: 'pain',
      code: `// AG Grid — schema required before any data
const columnDefs = [
  { field: 'name', headerName: 'Name', sortable: true, filter: true, resizable: true },
  { field: 'email', headerName: 'Email', cellRenderer: MailRenderer },
  { field: 'salary', valueFormatter: currencyFormatter },
  // 40 more lines...
];`,
    },
    {
      year: '2019',
      title: 'Enterprise Lock-In Problem',
      description: 'AG Grid Community became free but AG Grid Enterprise (features like server-side row model, Excel export) costs $1,500/dev/year. Teams were paying for basic table functionality. Open source alternatives existed but all required the same boilerplate burden.',
      type: 'pain',
      code: `// Typical complaint on Reddit/HN:
// "Why do I need 80 lines of config for a data table?"
// "AG Grid Enterprise: $1,500/dev/year for grouping & pivots"
// "TanStack is headless — still need to build all the UI"`,
    },
    {
      year: '2021',
      title: 'The Inference Insight',
      description: 'The key realization: most table column types can be inferred from the data itself. Email addresses always look like emails. ISO dates always follow the same format. Percentages between 0-1 are recognizable. The type information is already IN the data.',
      type: 'insight',
      code: `// If every value in a column matches /[^\s@]+@[^\s@]+\.[^\s@]+/
// → column type is "email"
// If every value is a boolean
// → column type is "boolean"
// If every value matches /^\d{4}-\d{2}-\d{2}$/
// → column type is "date"
// No config required.`,
    },
    {
      year: '2022',
      title: 'Two-Phase Architecture',
      description: 'Running inference synchronously blocks the UI. The solution: render text columns instantly (fast path), then run inference via requestIdleCallback. The table appears in under 16ms, and typed rendering upgrades seamlessly. Never sacrifice perceived performance for correctness.',
      type: 'insight',
      code: `// Phase 1: Immediate (synchronous, <1ms)
resolvedColumns = engine.resolveColumns(data); // all 'text'
processedRows = engine.processRows(data, textCols);
// Table renders instantly

// Phase 2: Async (never blocks UI)
requestIdleCallback(() => {
  const schema = engine.inferSchema(data); // typed inference
  resolvedColumns = engine.resolveColumns(data, schema);
  // Table upgrades silently
});`,
    },
    {
      year: '2023',
      title: 'Zero-Config Target',
      description: 'The goal crystallized: <Table data={rows} /> must be the entire API for 90% of use cases. Column overrides via { myCol: "currency" } for the remaining 10%. No required props. No mandatory schema. No boilerplate. Progressive disclosure of complexity.',
      type: 'solution',
      code: `// Zero-config (works for 90% of use cases):
<Table data={rows} />

// When you need more (progressive disclosure):
<Table
  data={rows}
  columns={{ salary: 'currency', avatar: 'image' }}
  selectable
  pageSize={25}
/>

// Full control (escape hatch, never required):
<Table data={rows} columns={defineColumns<User>()(
  [{ key: 'email', type: 'email', label: 'Contact' }]
)} />`,
    },
    {
      year: '2024',
      title: '@tablecraft v2.0.0',
      description: 'Production-ready with Svelte 5 Runes, 17 built-in renderers, virtual scrolling for 10k+ rows, Web Worker sort offload, WCAG 2.1 AA accessibility, and a framework-agnostic core that\'s ready for React and Vue adapters.',
      type: 'solution',
      code: `// The complete API surface:
import { Table, defineColumns } from '@tablecraft/svelte';

// That's it. That's the import.
// <Table data={rows} />`,
    },
  ];

  let expandedItem = $state<number | null>(null);

  const typeColors = { pain: '#f87171', insight: '#fbbf24', solution: '#4ade80' };
  const typeLabels = { pain: 'Pain Point', insight: 'Key Insight', solution: 'Solution' };
</script>

<section class="section" class:dark={darkMode} id="timeline">
  <div class="section-inner">
    <div class="section-header">
      <div class="section-tag">API Design</div>
      <h2 class="section-title">From Pain to Zero-Config</h2>
      <p class="section-desc">
        Why existing options failed, the key insights, and how @tablecraft solves them.
      </p>
    </div>

    <div class="timeline">
      {#each timeline as item, i}
        <div class="timeline-item" class:expanded={expandedItem === i}>
          <div class="timeline-connector">
            <div class="timeline-dot" style="background: {typeColors[item.type]}"></div>
            {#if i < timeline.length - 1}
              <div class="timeline-line"></div>
            {/if}
          </div>

          <button class="timeline-card" onclick={() => { expandedItem = expandedItem === i ? null : i; }}>
            <div class="card-top">
              <div class="card-year">{item.year}</div>
              <div class="card-type-badge" style="background: {typeColors[item.type]}22; color: {typeColors[item.type]}; border: 1px solid {typeColors[item.type]}44">
                {typeLabels[item.type]}
              </div>
            </div>

            <h3 class="card-title">{item.title}</h3>
            <p class="card-desc">{item.description}</p>

            {#if expandedItem === i && item.code}
              <pre class="timeline-code">{item.code}</pre>
            {/if}

            <div class="expand-hint">
              {expandedItem === i ? 'Click to collapse' : 'Click to see code example'}
            </div>
          </button>
        </div>
      {/each}
    </div>

    <div class="api-summary">
      <div class="summary-title">The Result: API Complexity Over Time</div>
      <div class="complexity-chart">
        <div class="complexity-bar-group">
          <div class="complexity-lib">AG Grid</div>
          <div class="complexity-bar-track">
            <div class="complexity-fill" style="width: 100%; background: #f87171;">
              <span class="complexity-label">80-150 lines required</span>
            </div>
          </div>
        </div>
        <div class="complexity-bar-group">
          <div class="complexity-lib">TanStack Table</div>
          <div class="complexity-bar-track">
            <div class="complexity-fill" style="width: 60%; background: #fbbf24;">
              <span class="complexity-label">40-80 lines required</span>
            </div>
          </div>
        </div>
        <div class="complexity-bar-group">
          <div class="complexity-lib">React Table v7</div>
          <div class="complexity-bar-track">
            <div class="complexity-fill" style="width: 45%; background: #fb923c;">
              <span class="complexity-label">25-50 lines required</span>
            </div>
          </div>
        </div>
        <div class="complexity-bar-group">
          <div class="complexity-lib">@tablecraft v2</div>
          <div class="complexity-bar-track">
            <div class="complexity-fill" style="width: 3%; min-width: 6px; background: #22c55e;">
            </div>
            <span class="complexity-label-outside">1 line</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .section {
    padding: 5rem 2rem;
    background: var(--bg-secondary);
    border-top: 1px solid var(--border-color);
  }

  .section-inner { max-width: 900px; margin: 0 auto; }
  .section-header { text-align: center; margin-bottom: 3rem; }

  .section-tag {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: rgba(251, 191, 36, 0.15);
    color: #fcd34d;
    border: 1px solid rgba(251, 191, 36, 0.3);
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 1rem;
  }

  .section-title {
    font-size: clamp(1.75rem, 4vw, 2.75rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--text-primary);
    margin-bottom: 1rem;
    line-height: 1.1;
  }

  .section-desc {
    font-size: 1.0625rem;
    color: var(--text-secondary);
    max-width: 560px;
    margin: 0 auto;
    line-height: 1.6;
  }

  .timeline {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin-bottom: 3rem;
  }

  .timeline-item {
    display: grid;
    grid-template-columns: 40px 1fr;
    gap: 0 1rem;
  }

  .timeline-connector {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 1rem;
  }

  .timeline-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 0 12px currentColor;
  }

  .timeline-line {
    flex: 1;
    width: 2px;
    background: var(--border-color);
    margin: 4px 0;
    min-height: 24px;
  }

  .timeline-card {
    margin-bottom: 1.5rem;
    padding: 1.25rem 1.5rem;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 0.875rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.15s;
    width: 100%;
  }
  .timeline-card:hover {
    border-color: rgba(99, 102, 241, 0.4);
    transform: translateX(4px);
  }

  .expanded .timeline-card {
    border-color: rgba(99, 102, 241, 0.5);
    background: rgba(99, 102, 241, 0.03);
  }

  .card-top {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.625rem;
    flex-wrap: wrap;
  }

  .card-year {
    font-size: 0.8125rem;
    font-weight: 800;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.05em;
  }

  .card-type-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.15rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .card-title {
    font-size: 1.125rem;
    font-weight: 800;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
    letter-spacing: -0.02em;
  }

  .card-desc {
    font-size: 0.9375rem;
    color: var(--text-secondary);
    line-height: 1.7;
    margin-bottom: 0.5rem;
  }

  .timeline-code {
    background: #0a0e1a;
    color: #a5f3fc;
    font-family: ui-monospace, 'JetBrains Mono', monospace;
    font-size: 0.8125rem;
    padding: 1rem 1.25rem;
    border-radius: 0.625rem;
    border: 1px solid rgba(99, 102, 241, 0.2);
    overflow-x: auto;
    line-height: 1.6;
    margin-top: 0.75rem;
    margin-bottom: 0.5rem;
    animation: slideIn 0.2s ease;
    white-space: pre;
    tab-size: 2;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .expand-hint {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 0.25rem;
    font-style: italic;
  }

  .api-summary {
    padding: 1.5rem;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 0.875rem;
  }

  .summary-title {
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 1.25rem;
  }

  .complexity-chart { display: flex; flex-direction: column; gap: 0.875rem; }

  .complexity-bar-group {
    display: grid;
    grid-template-columns: 160px 1fr;
    gap: 0.75rem;
    align-items: center;
  }

  .complexity-lib {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-align: right;
    white-space: nowrap;
  }

  .complexity-bar-track {
    height: 28px;
    background: var(--bg-secondary);
    border-radius: 0.375rem;
    overflow: visible;
    display: flex;
    align-items: center;
    position: relative;
  }

  .complexity-fill {
    height: 100%;
    border-radius: 0.375rem;
    display: flex;
    align-items: center;
    padding-left: 0.75rem;
    position: relative;
    min-width: 4px;
    transition: width 0.5s ease;
  }

  .complexity-label {
    font-size: 0.75rem;
    font-weight: 700;
    color: rgba(0, 0, 0, 0.7);
    white-space: nowrap;
  }

  .complexity-label-outside {
    font-size: 0.75rem;
    font-weight: 700;
    color: #22c55e;
    margin-left: 0.5rem;
    white-space: nowrap;
  }

  @media (max-width: 640px) {
    .section { padding: 3rem 1rem; }
    .complexity-bar-group { grid-template-columns: 100px 1fr; }
    .timeline-item { grid-template-columns: 28px 1fr; }
  }
</style>
