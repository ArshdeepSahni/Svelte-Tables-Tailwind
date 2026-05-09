<script lang="ts">
  interface Props {
    darkMode: boolean;
  }
  let { darkMode }: Props = $props();

  interface BundleEntry {
    name: string;
    size: number;
    maxSize: number;
    color: string;
    label: string;
  }

  const bundleData: BundleEntry[] = [
    { name: 'AG Grid Community', size: 800, maxSize: 800, color: '#f87171', label: '~800 KB' },
    { name: 'TanStack Table', size: 200, maxSize: 800, color: '#fbbf24', label: '~200 KB' },
    { name: 'React Table v7', size: 150, maxSize: 800, color: '#fb923c', label: '~150 KB' },
    { name: 'Handsontable', size: 450, maxSize: 800, color: '#f472b6', label: '~450 KB' },
    { name: '@tablecraft/core', size: 30, maxSize: 800, color: '#22c55e', label: '<30 KB' },
    { name: '@tablecraft/svelte', size: 15, maxSize: 800, color: '#4ade80', label: '<15 KB' },
  ];

  interface Metric {
    label: string;
    value: string;
    unit: string;
    good: boolean;
    comparison?: string;
  }

  const metrics: Metric[] = [
    { label: 'Initial Render', value: '<16', unit: 'ms', good: true, comparison: 'AG Grid: 80-200ms' },
    { label: 'Sort (1k rows)', value: '<8', unit: 'ms', good: true, comparison: 'Main thread, small datasets' },
    { label: 'Sort (10k+ rows)', value: 'Worker', unit: '', good: true, comparison: 'Web Worker offload, no jank' },
    { label: 'Scroll FPS', value: '60', unit: 'fps', good: true, comparison: 'Virtual scrolling active' },
    { label: 'Type Inference', value: 'Idle', unit: 'cb', good: true, comparison: 'Never blocks main thread' },
    { label: 'Tree-shake target', value: '<15', unit: 'KB', good: true, comparison: 'Per adapter, per renderer' },
  ];

  interface CoverageGauge {
    label: string;
    value: number;
    color: string;
  }

  const coverage: CoverageGauge[] = [
    { label: 'Core Engine', value: 82, color: '#22c55e' },
    { label: 'Inference', value: 90, color: '#4ade80' },
    { label: 'Renderers', value: 78, color: '#0a0a0a' },
    { label: 'Svelte Layer', value: 70, color: '#0a0a0a' },
  ];

  // Virtual scroll visualization state
  let totalRows = $state(10000);
  let viewportRows = $state(12);
  let scrollPct = $state(0);
  let isAnimating = $state(false);

  const renderedRows = $derived(() => {
    const start = Math.floor((scrollPct / 100) * (totalRows - viewportRows));
    return { start, end: start + viewportRows };
  });

  function startAnimation() {
    if (isAnimating) return;
    isAnimating = true;
    let t = 0;
    const id = setInterval(() => {
      t += 2;
      scrollPct = (Math.sin(t * 0.05) + 1) * 50;
      if (t > 200) {
        clearInterval(id);
        isAnimating = false;
        scrollPct = 0;
      }
    }, 30);
  }

  function circumference(r: number) { return 2 * Math.PI * r; }
  function dashOffset(value: number, r: number) {
    return circumference(r) * (1 - value / 100);
  }
</script>

<section class="section" class:dark={darkMode} id="performance">
  <div class="section-inner">
    <div class="section-header">
      <div class="section-tag">Performance</div>
      <h2 class="section-title">Built for Speed</h2>
      <p class="section-desc">
        Bundle size, test coverage, and runtime benchmarks — all in one view.
      </p>
    </div>

    <div class="perf-grid">
      <!-- Bundle Size Chart -->
      <div class="perf-card bundle-card">
        <h3 class="card-title">Bundle Size Comparison</h3>
        <p class="card-desc">Minified + gzipped. @tablecraft is 16x smaller than AG Grid.</p>
        <div class="bundle-bars">
          {#each bundleData as entry}
            <div class="bundle-row">
              <div class="bundle-name">{entry.name}</div>
              <div class="bundle-bar-track">
                <div
                  class="bundle-bar-fill"
                  style="width: {(entry.size / entry.maxSize) * 100}%; background: {entry.color};"
                >
                </div>
              </div>
              <div class="bundle-label" style="color: {entry.color}">{entry.label}</div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Coverage Gauges -->
      <div class="perf-card coverage-card">
        <h3 class="card-title">Test Coverage</h3>
        <p class="card-desc">Vitest + jsdom. Target: 80%+ across all packages.</p>
        <div class="gauges">
          {#each coverage as g}
            {@const r = 36}
            {@const circ = circumference(r)}
            <div class="gauge">
              <svg width="90" height="90" viewBox="0 0 90 90" role="img" aria-label="{g.label}: {g.value}%">
                <circle cx="45" cy="45" r={r} fill="none" stroke="var(--bg-secondary)" stroke-width="7" />
                <circle
                  cx="45" cy="45" r={r}
                  fill="none"
                  stroke={g.color}
                  stroke-width="7"
                  stroke-linecap="round"
                  stroke-dasharray={circ}
                  stroke-dashoffset={dashOffset(g.value, r)}
                  transform="rotate(-90 45 45)"
                />
                <text x="45" y="49" text-anchor="middle" font-size="14" font-weight="800" fill={g.color}>
                  {g.value}%
                </text>
              </svg>
              <div class="gauge-label">{g.label}</div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Metrics Cards -->
    <div class="metrics-grid">
      {#each metrics as m}
        <div class="metric-card">
          <div class="metric-top">
            <span class="metric-value" class:metric-good={m.good}>{m.value}</span>
            {#if m.unit}
              <span class="metric-unit">{m.unit}</span>
            {/if}
          </div>
          <div class="metric-label">{m.label}</div>
          {#if m.comparison}
            <div class="metric-comparison">{m.comparison}</div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Virtual Scroll Visualization -->
    <div class="virtual-section">
      <div class="virtual-header">
        <div>
          <h3 class="card-title">Virtual Scrolling Visualization</h3>
          <p class="card-desc">
            Only {viewportRows} rows are in the DOM at a time — even for {totalRows.toLocaleString()} rows.
          </p>
        </div>
        <button class="animate-btn" onclick={startAnimation} disabled={isAnimating}>
          {isAnimating ? 'Scrolling...' : 'Animate Scroll'}
        </button>
      </div>

      <div class="virtual-viz">
        <div class="virtual-list-wrap">
          <div class="virtual-label">Total rows: {totalRows.toLocaleString()}</div>
          <div class="virtual-list">
            {#each Array(20) as _, i}
              {@const rows = renderedRows()}
              {@const rowNum = Math.floor((scrollPct / 100) * (totalRows / 20)) * 20 + i * (totalRows / 20)}
              {@const inView = i >= Math.floor(scrollPct / 100 * 8) && i < Math.floor(scrollPct / 100 * 8) + viewportRows}
              <div
                class="virtual-row"
                class:in-dom={inView}
                class:virtualized={!inView}
              >
                {#if inView}
                  <span class="row-label">Row ~{Math.floor(rowNum).toLocaleString()}</span>
                  <span class="row-dom">IN DOM</span>
                {:else}
                  <span class="row-label">...</span>
                  <span class="row-virtual">VIRTUAL</span>
                {/if}
              </div>
            {/each}
          </div>
        </div>

        <div class="virtual-stats">
          <div class="vstat">
            <span class="vstat-num" style="color: #22c55e">{viewportRows}</span>
            <span class="vstat-label">Rows in DOM</span>
          </div>
          <div class="vstat">
            <span class="vstat-num" style="color: #475569">{(totalRows - viewportRows).toLocaleString()}</span>
            <span class="vstat-label">Rows virtualized</span>
          </div>
          <div class="vstat">
            <span class="vstat-num" style="color: #0a0a0a">{Math.round((viewportRows / totalRows) * 100 * 100) / 100}%</span>
            <span class="vstat-label">DOM usage</span>
          </div>
          <div class="vstat">
            <span class="vstat-num" style="color: #4ade80">60fps</span>
            <span class="vstat-label">Scroll frame rate</span>
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

  .section-inner { max-width: 1100px; margin: 0 auto; }
  .section-header { text-align: center; margin-bottom: 3rem; }

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
    max-width: 540px;
    margin: 0 auto;
    line-height: 1.6;
  }

  .perf-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 800px) { .perf-grid { grid-template-columns: 1fr; } }

  .perf-card {
    padding: 1.5rem;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 1rem;
  }

  .card-title {
    font-size: 1.0625rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.375rem;
  }

  .card-desc {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin-bottom: 1.25rem;
    line-height: 1.5;
  }

  .bundle-bars { display: flex; flex-direction: column; gap: 0.75rem; }

  .bundle-row { display: grid; grid-template-columns: 180px 1fr 70px; gap: 0.75rem; align-items: center; }

  .bundle-name { font-size: 0.8125rem; color: var(--text-secondary); font-weight: 500; }

  .bundle-bar-track {
    height: 8px;
    background: var(--bg-secondary);
    border-radius: 9999px;
    overflow: hidden;
  }

  .bundle-bar-fill {
    height: 100%;
    border-radius: 9999px;
    transition: width 0.5s ease;
  }

  .bundle-label {
    font-size: 0.75rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    text-align: right;
  }

  .gauges {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .gauge {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.375rem;
  }

  .gauge-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 600;
    text-align: center;
    max-width: 80px;
    line-height: 1.3;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .metric-card {
    padding: 1.25rem;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 0.875rem;
    transition: border-color 0.15s;
  }
  .metric-card:hover { border-color: rgba(10, 10, 10, 0.4); }

  .metric-top {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
    margin-bottom: 0.375rem;
  }

  .metric-value {
    font-size: 1.75rem;
    font-weight: 900;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
    line-height: 1;
  }
  .metric-value.metric-good { color: #22c55e; }

  .metric-unit {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-muted);
  }

  .metric-label {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
  }

  .metric-comparison {
    font-size: 0.75rem;
    color: var(--text-muted);
    line-height: 1.4;
  }

  .virtual-section {
    padding: 1.5rem;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 1rem;
  }

  .virtual-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .animate-btn {
    padding: 0.5rem 1.25rem;
    background: rgba(10, 10, 10, 0.15);
    color: #0a0a0a;
    border: 1px solid rgba(10, 10, 10, 0.3);
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .animate-btn:hover:not(:disabled) { background: rgba(10, 10, 10, 0.25); color: #525252; }
  .animate-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .virtual-viz {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 2rem;
    align-items: start;
  }

  @media (max-width: 640px) { .virtual-viz { grid-template-columns: 1fr; } }

  .virtual-list-wrap { }
  .virtual-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .virtual-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 280px;
    overflow: hidden;
  }

  .virtual-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem 0.625rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    transition: all 0.1s;
  }

  .virtual-row.in-dom {
    background: rgba(34, 197, 94, 0.12);
    border: 1px solid rgba(34, 197, 94, 0.25);
  }
  .virtual-row.virtualized {
    background: var(--bg-secondary);
    border: 1px solid transparent;
    opacity: 0.5;
  }

  .row-label { color: var(--text-muted); font-family: ui-monospace, monospace; }
  .row-dom { color: #22c55e; font-weight: 700; font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .row-virtual { color: #334155; font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.05em; }

  .virtual-stats {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .vstat { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
  .vstat-num { font-size: 1.375rem; font-weight: 900; font-variant-numeric: tabular-nums; }
  .vstat-label { font-size: 0.6875rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; text-align: center; }

  @media (max-width: 640px) { .section { padding: 3rem 1rem; } }
</style>
