<script lang="ts">
  interface Props {
    darkMode: boolean;
  }
  let { darkMode }: Props = $props();

  // All code strings stored as arrays of lines to avoid Vite mistaking
  // the display-only import statements for real module specifiers.
  const imp = 'import';
  const beforeLines: string[] = [
    '// AG Grid — Minimum viable setup',
    `${imp} { AgGridReact } from 'ag-grid-react';`,
    `${imp} 'ag-grid-community/styles/ag-grid.css';`,
    `${imp} 'ag-grid-community/styles/ag-theme-alpine.css';`,
    `${imp} { useState, useMemo, useCallback, useRef } from 'react';`,
    `${imp} { ClientSideRowModelModule } from 'ag-grid-community';`,
    `${imp} { ModuleRegistry } from 'ag-grid-community';`,
    '',
    'ModuleRegistry.registerModules([ClientSideRowModelModule]);',
    '',
    'const GridExample = ({ data }) => {',
    '  const gridRef = useRef(null);',
    '  const [rowData, setRowData] = useState(null);',
    '  const [columnDefs, setColumnDefs] = useState([',
    "    { field: 'id', headerName: 'ID', sortable: true, filter: true,",
    "      width: 80, resizable: true, type: 'numericColumn' },",
    "    { field: 'name', headerName: 'Name', sortable: true,",
    "      filter: 'agTextColumnFilter', resizable: true, flex: 1 },",
    "    { field: 'email', headerName: 'Email', sortable: true,",
    "      filter: 'agTextColumnFilter', resizable: true, flex: 1,",
    '      cellRenderer: (params) => `<a href="mailto:${params.value}">${params.value}</a>` },',
    "    { field: 'salary', headerName: 'Salary', sortable: true,",
    "      filter: 'agNumberColumnFilter', type: 'numericColumn',",
    "      valueFormatter: p => new Intl.NumberFormat('en-US', {",
    "        style: 'currency', currency: 'USD'",
    '      }).format(p.value) },',
    "    { field: 'active', headerName: 'Active', sortable: true,",
    "      cellRenderer: (params) => params.value ? '✓' : '✗' },",
    "    { field: 'joined', headerName: 'Joined', sortable: true,",
    "      filter: 'agDateColumnFilter',",
    '      valueFormatter: p => new Date(p.value).toLocaleDateString() },',
    '  ]);',
    '  const defaultColDef = useMemo(() => ({',
    '    sortable: true, filter: true, resizable: true,',
    '  }), []);',
    '  const onGridReady = useCallback(params => {',
    "    fetch('/api/data')",
    '      .then(resp => resp.json())',
    '      .then(data => setRowData(data));',
    '  }, []);',
    '',
    '  return (',
    '    <div className="ag-theme-alpine" style={{ height: 400, width: "100%" }}>',
    '      <AgGridReact',
    '        ref={gridRef}',
    '        rowData={data}',
    '        columnDefs={columnDefs}',
    '        defaultColDef={defaultColDef}',
    '        onGridReady={onGridReady}',
    '        pagination={true}',
    '        paginationPageSize={20}',
    '        rowSelection="multiple"',
    '        animateRows={true}',
    '      />',
    '    </div>',
    '  );',
    '};',
  ];

  const afterLines: string[] = [
    '<!-- @tablecraft/svelte — Zero config -->',
    '<script>',
    `  ${imp} { Table } from '@tablecraft/svelte';`,
    '<' + '/script>',
    '',
    '<Table data={rows} />',
  ];

  type TooltipEntry = { line: number; text: string };
  const tooltips: Record<string, TooltipEntry> = {
    '0': { line: 0, text: 'AG Grid requires importing the React wrapper AND two CSS files just to start.' },
    '3': { line: 3, text: 'You need useState, useMemo, useCallback, AND useRef — for a table.' },
    '5': { line: 5, text: 'You must manually register modules — otherwise nothing renders.' },
    '13': { line: 13, text: 'columnDefs must be manually constructed for every column, every time.' },
    '20': { line: 20, text: 'Email links require a custom cellRenderer function — not auto-detected.' },
    '23': { line: 23, text: 'Currency formatting: 4 lines of Intl.NumberFormat boilerplate per column.' },
    '30': { line: 30, text: 'Date formatting: another custom valueFormatter needed.' },
    '32': { line: 32, text: 'defaultColDef must be memoized or it causes infinite re-renders.' },
    '35': { line: 35, text: 'You need a separate onGridReady callback to fetch data — why?' },
  };

  let hoveredLine = $state<number | null>(null);
  let activeTooltip = $state<string | null>(null);

  function handleLineHover(lineIdx: number) {
    hoveredLine = lineIdx;
    activeTooltip = tooltips[String(lineIdx)]?.text ?? null;
  }

  function handleLineLeave() {
    hoveredLine = null;
    activeTooltip = null;
  }

  let showDetails = $state(false);
</script>

<section class="section" class:dark={darkMode} id="comparison">
  <div class="section-inner">
    <div class="section-header">
      <div class="section-tag">100x Simpler</div>
      <h2 class="section-title">From 60 Lines to 1</h2>
      <p class="section-desc">
        The same table functionality. Click any line in the "Before" panel to see why it exists.
      </p>
    </div>

    <div class="line-counter-bar">
      <div class="counter-block before">
        <span class="counter-num">{beforeLines.length}</span>
        <span class="counter-label">lines with AG Grid</span>
      </div>
      <div class="counter-arrow">&#8594;</div>
      <div class="counter-block after">
        <span class="counter-num">{afterLines.length}</span>
        <span class="counter-label">lines with @tablecraft</span>
      </div>
      <div class="counter-reduction">
        <span class="reduction-num">{Math.round((1 - afterLines.length / beforeLines.length) * 100)}%</span>
        <span class="reduction-label">less code</span>
      </div>
    </div>

    {#if activeTooltip}
      <div class="tooltip-banner">
        <span class="tooltip-icon">?</span>
        {activeTooltip}
      </div>
    {/if}

    <div class="panels">
      <div class="panel panel-before">
        <div class="panel-header">
          <div class="panel-title-group">
            <span class="panel-dot dot-red"></span>
            <span class="panel-dot dot-yellow"></span>
            <span class="panel-dot dot-green"></span>
          </div>
          <span class="panel-title">Before — AG Grid (React)</span>
          <span class="panel-lines">{beforeLines.length} lines</span>
        </div>
        <div class="code-block">
          {#each beforeLines as line, i}
            <div
              class="code-line"
              class:highlighted={hoveredLine === i}
              class:has-tooltip={tooltips[String(i)] !== undefined}
              onmouseenter={() => handleLineHover(i)}
              onmouseleave={handleLineLeave}
              role="listitem"
            >
              <span class="line-num">{i + 1}</span>
              <span class="line-content">{line}</span>
              {#if tooltips[String(i)] !== undefined}
                <span class="tooltip-indicator">?</span>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <div class="panel panel-after">
        <div class="panel-header">
          <div class="panel-title-group">
            <span class="panel-dot dot-red"></span>
            <span class="panel-dot dot-yellow"></span>
            <span class="panel-dot dot-green"></span>
          </div>
          <span class="panel-title">After — @tablecraft</span>
          <span class="panel-lines panel-lines-good">{afterLines.length} lines</span>
        </div>
        <div class="code-block code-block-after">
          {#each afterLines as line, i}
            <div class="code-line code-line-after" role="listitem">
              <span class="line-num">{i + 1}</span>
              <span class="line-content">{line}</span>
            </div>
          {/each}

          <div class="magic-badge">
            <span class="magic-icon">*</span>
            Auto-infers email, currency, date, boolean types
          </div>
          <div class="magic-badge">
            <span class="magic-icon">*</span>
            Built-in sorting, filtering, pagination, selection
          </div>
          <div class="magic-badge">
            <span class="magic-icon">*</span>
            WCAG 2.1 AA accessible by default
          </div>
          <div class="magic-badge">
            <span class="magic-icon">*</span>
            Virtual scrolling for 10,000+ rows
          </div>
        </div>
      </div>
    </div>

    <button class="details-toggle" onclick={() => { showDetails = !showDetails; }}>
      {showDetails ? 'Hide' : 'Show'} Technical Details
    </button>

    {#if showDetails}
      <div class="details-panel">
        <h3>Why is @tablecraft so much simpler?</h3>
        <p>
          AG Grid, TanStack Table, and similar libraries are <strong>schema-first</strong> — you must declare every column,
          its type, its formatter, its comparator. They're powerful but require enormous boilerplate for every table.
        </p>
        <p>
          @tablecraft is <strong>inference-first</strong> — it scans your data using a 17-type inference engine and
          automatically selects the right renderer. You only specify what differs from the inferred default.
          The engine runs via <code>requestIdleCallback</code> so it never blocks your main thread.
        </p>
        <p>
          The philosophy: <em>"Make the common case trivial, and the complex case possible."</em>
        </p>
      </div>
    {/if}
  </div>
</section>

<style>
  .section {
    padding: 5rem 2rem;
    background: var(--bg-secondary);
    border-top: 1px solid var(--border-color);
  }

  .section-inner { max-width: 1200px; margin: 0 auto; }

  .section-header { text-align: center; margin-bottom: 2.5rem; }

  .section-tag {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: rgba(34, 197, 94, 0.15);
    color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.3);
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

  .line-counter-bar {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    justify-content: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .counter-block {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 0.75rem;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
  }

  .counter-block.before .counter-num { color: #f87171; }
  .counter-block.after .counter-num { color: #4ade80; }

  .counter-num {
    font-size: 2rem;
    font-weight: 900;
    font-variant-numeric: tabular-nums;
  }

  .counter-label {
    font-size: 0.875rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .counter-arrow {
    font-size: 1.5rem;
    color: var(--text-muted);
  }

  .counter-reduction {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.125rem;
    padding: 0.75rem 1.5rem;
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    border-radius: 0.75rem;
  }

  .reduction-num {
    font-size: 2rem;
    font-weight: 900;
    color: #4ade80;
  }

  .reduction-label {
    font-size: 0.75rem;
    color: #4ade80;
    opacity: 0.7;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .tooltip-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: rgba(251, 191, 36, 0.1);
    border: 1px solid rgba(251, 191, 36, 0.3);
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    color: #fde68a;
    animation: slideIn 0.15s ease;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .tooltip-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    background: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
    border-radius: 50%;
    font-size: 0.75rem;
    font-weight: 800;
    flex-shrink: 0;
  }

  .panels {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 900px) {
    .panels { grid-template-columns: 1fr; }
  }

  .panel {
    border-radius: 0.75rem;
    overflow: hidden;
    border: 1px solid var(--border-color);
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0.875rem;
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-color);
  }

  .panel-title-group { display: flex; gap: 5px; }
  .panel-dot { width: 10px; height: 10px; border-radius: 50%; }
  .dot-red { background: #f87171; }
  .dot-yellow { background: #fbbf24; }
  .dot-green { background: #4ade80; }

  .panel-title { flex: 1; font-size: 0.8125rem; font-weight: 600; color: var(--text-secondary); }
  .panel-lines { font-size: 0.75rem; font-weight: 700; color: #f87171; }
  .panel-lines-good { color: #4ade80; }

  .code-block {
    background: #0a0e1a;
    padding: 0.5rem 0;
    overflow-x: auto;
    max-height: 400px;
    overflow-y: auto;
  }

  .code-block-after {
    max-height: none;
    padding-bottom: 1rem;
  }

  .code-line {
    display: flex;
    align-items: flex-start;
    gap: 0;
    padding: 0.125rem 0.75rem;
    font-family: ui-monospace, 'JetBrains Mono', monospace;
    font-size: 0.8rem;
    line-height: 1.6;
    white-space: pre;
    transition: background 0.1s;
    cursor: default;
    position: relative;
  }

  .code-line.has-tooltip { cursor: help; }
  .code-line.highlighted { background: rgba(251, 191, 36, 0.1); }

  .line-num {
    display: inline-block;
    min-width: 2rem;
    color: #334155;
    text-align: right;
    margin-right: 1rem;
    user-select: none;
    flex-shrink: 0;
  }

  .line-content { color: #cbd5e1; flex: 1; }

  .tooltip-indicator {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1rem;
    height: 1rem;
    background: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
    border-radius: 50%;
    font-size: 0.6rem;
    font-weight: 800;
    cursor: help;
  }

  .code-line-after .line-content { color: #a5f3fc; }

  .magic-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1.25rem;
    font-size: 0.8125rem;
    color: #4ade80;
  }

  .magic-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.125rem;
    height: 1.125rem;
    background: rgba(34, 197, 94, 0.2);
    border-radius: 50%;
    font-size: 0.6rem;
    font-weight: 800;
    flex-shrink: 0;
  }

  .details-toggle {
    display: block;
    margin: 0 auto;
    padding: 0.5rem 1.5rem;
    background: var(--bg-primary);
    color: var(--text-muted);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s;
  }
  .details-toggle:hover { color: var(--text-primary); border-color: #0a0a0a; }

  .details-panel {
    margin-top: 1.5rem;
    padding: 1.5rem;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    animation: slideIn 0.2s ease;
  }

  .details-panel h3 {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 1rem;
  }

  .details-panel p {
    font-size: 0.9375rem;
    color: var(--text-secondary);
    line-height: 1.7;
    margin-bottom: 0.875rem;
  }

  .details-panel strong { color: var(--text-primary); }
  .details-panel em { color: #0a0a0a; }

  .details-panel code {
    font-family: ui-monospace, monospace;
    font-size: 0.875em;
    background: rgba(10, 10, 10, 0.06);
    color: #0a0a0a;
    padding: 0.1em 0.35em;
    border-radius: 0.25rem;
  }

  @media (max-width: 640px) { .section { padding: 3rem 1rem; } }
</style>
