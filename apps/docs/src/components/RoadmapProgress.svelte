<script lang="ts">
  interface Props {
    darkMode: boolean;
  }
  let { darkMode }: Props = $props();

  interface Phase {
    number: number;
    name: string;
    status: 'complete' | 'in-progress' | 'planned';
    description: string;
    deliverables: string[];
    commit?: string;
  }

  const phases: Phase[] = [
    {
      number: 1, name: 'Foundation & Types', status: 'complete',
      description: 'Core TypeScript types, monorepo setup, 17 ColumnType definitions, CellDescriptor discriminated union.',
      deliverables: ['types.ts with 17 ColumnTypes', 'CellDescriptor union', 'ColumnDefinition interface', 'TableConfig interface', 'defineColumns helper', 'pnpm workspace'],
      commit: 'd9a938b',
    },
    {
      number: 2, name: 'Inference Engine', status: 'complete',
      description: 'Framework-agnostic inference engine with 17 built-in renderers, pattern-based type detection, confidence scoring.',
      deliverables: ['inferSchema() function', '17 renderer functions', 'RendererRegistry with plugin API', 'createTableEngine() factory', 'CellDescriptor pipeline'],
      commit: 'c7f00cb',
    },
    {
      number: 3, name: 'Svelte 5 Component', status: 'complete',
      description: 'Production Svelte 5 Table component with runes, two-phase rendering, virtual scrolling, WCAG 2.1 AA.',
      deliverables: ['Table.svelte with $state/$derived/$effect', 'Two-phase inference rendering', 'Virtual scrolling (TanStack Virtual)', 'Web Worker sort for 10k+ rows', 'WCAG 2.1 AA accessibility', 'v1 backward compat'],
    },
    {
      number: 4, name: 'Test Coverage', status: 'complete',
      description: 'Comprehensive test suite covering inference engine, renderers, scheduler, and Svelte component integration.',
      deliverables: ['foundation.test.ts', 'scheduler.test.ts', 'tokens.test.ts', 'Vitest + jsdom setup', 'Accessibility tests'],
    },
    {
      number: 5, name: 'Column Controls UI', status: 'planned',
      description: 'Column visibility toggle, reordering drag-and-drop, resize handles, pin left/right, column menu.',
      deliverables: ['ColumnMenu.svelte', 'Drag-to-reorder', 'Column resize handles', 'Pin left/right', 'Visibility toggle'],
    },
    {
      number: 6, name: 'Inline Editing', status: 'planned',
      description: 'Click-to-edit cells, row-level edit mode, validation, optimistic updates, save/cancel controls.',
      deliverables: ['Editable cell renderers', 'Validation API', 'onCellEdit callback', 'Row edit mode', 'Optimistic updates'],
    },
    {
      number: 7, name: 'Docs Dashboard', status: 'in-progress',
      description: 'This very dashboard — interactive Vite + Svelte 5 SPA with live demos, architecture diagram, roadmap.',
      deliverables: ['Hero section', 'Live Table demo', 'Code comparison panel', 'Architecture SVG', 'Roadmap progress', 'Cell renderer gallery', 'Performance charts', 'Type inference demo'],
    },
    {
      number: 8, name: 'React Adapter', status: 'planned',
      description: 'React 18+ wrapper using the same @tablecraft/core engine. Identical API: <Table data={rows} />.',
      deliverables: ['@tablecraft/react package', 'useTable hook', 'React cell renderers', 'Storybook stories'],
    },
    {
      number: 9, name: 'Vue 3 Adapter', status: 'planned',
      description: 'Vue 3 Composition API adapter. <Table :data="rows" /> with full feature parity.',
      deliverables: ['@tablecraft/vue package', 'useTable composable', 'Vue cell renderers'],
    },
    {
      number: 10, name: 'npm Release', status: 'planned',
      description: 'Production release: v1.0.0 publish to npm, full docs site, Changesets workflow, CI/CD.',
      deliverables: ['npm publish @tablecraft/core', 'npm publish @tablecraft/svelte', 'Full docs site live', 'Changesets CI', 'Benchmark suite'],
    },
  ];

  let selectedPhase = $state<Phase | null>(null);
  const completedCount = phases.filter(p => p.status === 'complete').length;
  const totalCount = phases.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  const statusColor = {
    'complete': '#22c55e',
    'in-progress': '#f59e0b',
    'planned': '#475569',
  };

  const statusLabel = {
    'complete': 'Complete',
    'in-progress': 'In Progress',
    'planned': 'Planned',
  };
</script>

<section class="section" class:dark={darkMode} id="roadmap">
  <div class="section-inner">
    <div class="section-header">
      <div class="section-tag">Roadmap</div>
      <h2 class="section-title">10-Phase Build Plan</h2>
      <p class="section-desc">
        {completedCount} of {totalCount} phases complete. Click any phase for details.
      </p>
    </div>

    <div class="overall-progress">
      <div class="progress-header">
        <span class="progress-title">Overall Progress</span>
        <span class="progress-pct">{progress}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width: {progress}%">
          <span class="progress-shimmer"></span>
        </div>
      </div>
      <div class="progress-legend">
        <span class="legend-item complete">Complete</span>
        <span class="legend-item in-progress">In Progress</span>
        <span class="legend-item planned">Planned</span>
      </div>
    </div>

    <div class="phases-grid">
      {#each phases as phase}
        <button
          class="phase-card"
          class:complete={phase.status === 'complete'}
          class:in-progress={phase.status === 'in-progress'}
          class:selected={selectedPhase?.number === phase.number}
          onclick={() => { selectedPhase = selectedPhase?.number === phase.number ? null : phase; }}
        >
          <div class="phase-top">
            <div class="phase-number">Phase {phase.number}</div>
            <div class="phase-status-dot" style="background: {statusColor[phase.status]}"></div>
          </div>
          <div class="phase-name">{phase.name}</div>
          <div class="phase-status-label" style="color: {statusColor[phase.status]}">
            {statusLabel[phase.status]}
          </div>
          {#if phase.status === 'complete'}
            <div class="phase-check">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          {/if}
        </button>
      {/each}
    </div>

    {#if selectedPhase}
      <div class="phase-detail" style="--phase-color: {statusColor[selectedPhase.status]}">
        <div class="phase-detail-header">
          <div>
            <div class="phase-detail-tag">Phase {selectedPhase.number}</div>
            <h3 class="phase-detail-title">{selectedPhase.name}</h3>
          </div>
          <div class="phase-detail-status" style="background: rgba(255,255,255,0.1); color: {statusColor[selectedPhase.status]}">
            {statusLabel[selectedPhase.status]}
          </div>
        </div>

        <p class="phase-detail-desc">{selectedPhase.description}</p>

        <div class="deliverables">
          <div class="deliverables-title">Deliverables</div>
          <div class="deliverables-grid">
            {#each selectedPhase.deliverables as item}
              <div class="deliverable-item">
                <span class="deliverable-dot" style="background: {statusColor[selectedPhase.status]}"></span>
                {item}
              </div>
            {/each}
          </div>
        </div>

        {#if selectedPhase.commit}
          <div class="phase-commit">
            Commit: <code>{selectedPhase.commit}</code>
          </div>
        {/if}
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

  .overall-progress {
    padding: 1.5rem;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 1rem;
    margin-bottom: 2rem;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.75rem;
  }

  .progress-title { font-size: 0.9375rem; font-weight: 700; color: var(--text-primary); }
  .progress-pct { font-size: 1.5rem; font-weight: 900; color: #22c55e; font-variant-numeric: tabular-nums; }

  .progress-track {
    height: 10px;
    background: var(--bg-secondary);
    border-radius: 9999px;
    overflow: hidden;
    margin-bottom: 0.875rem;
    border: 1px solid var(--border-color);
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #22c55e, #4ade80);
    border-radius: 9999px;
    position: relative;
    transition: width 0.5s ease;
    overflow: hidden;
  }

  .progress-shimmer {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    from { transform: translateX(-100%); }
    to { transform: translateX(200%); }
  }

  .progress-legend {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8125rem;
    color: var(--text-muted);
  }
  .legend-item::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .legend-item.complete::before { background: #22c55e; }
  .legend-item.in-progress::before { background: #f59e0b; }
  .legend-item.planned::before { background: #475569; }

  .phases-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 0.875rem;
    margin-bottom: 1.5rem;
  }

  .phase-card {
    position: relative;
    padding: 1rem;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.15s;
    overflow: hidden;
  }

  .phase-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: #475569;
    transition: background 0.15s;
  }

  .phase-card.complete::before { background: #22c55e; }
  .phase-card.in-progress::before { background: #f59e0b; }

  .phase-card:hover {
    border-color: rgba(99, 102, 241, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  }

  .phase-card.selected {
    border-color: rgba(99, 102, 241, 0.6);
    background: rgba(99, 102, 241, 0.05);
  }

  .phase-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .phase-number {
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .phase-status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }

  .phase-name {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
    line-height: 1.3;
  }

  .phase-status-label {
    font-size: 0.75rem;
    font-weight: 600;
  }

  .phase-check {
    position: absolute;
    bottom: 0.75rem;
    right: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
    border-radius: 50%;
  }

  .phase-detail {
    padding: 1.5rem;
    background: var(--bg-primary);
    border: 1px solid var(--phase-color, var(--border-color));
    border-left: 4px solid var(--phase-color, var(--border-color));
    border-radius: 0.75rem;
    animation: slideIn 0.2s ease;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .phase-detail-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .phase-detail-tag {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    margin-bottom: 0.25rem;
  }

  .phase-detail-title {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.02em;
  }

  .phase-detail-status {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .phase-detail-desc {
    font-size: 0.9375rem;
    color: var(--text-secondary);
    line-height: 1.7;
    margin-bottom: 1.25rem;
  }

  .deliverables-title {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    margin-bottom: 0.75rem;
  }

  .deliverables-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 0.5rem;
  }

  .deliverable-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-secondary);
    padding: 0.375rem 0;
    font-family: ui-monospace, monospace;
  }

  .deliverable-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .phase-commit {
    margin-top: 1rem;
    font-size: 0.8125rem;
    color: var(--text-muted);
  }

  .phase-commit code {
    font-family: ui-monospace, monospace;
    background: var(--bg-secondary);
    padding: 0.1em 0.4em;
    border-radius: 0.25rem;
    color: #818cf8;
  }

  @media (max-width: 640px) {
    .section { padding: 3rem 1rem; }
    .phases-grid { grid-template-columns: repeat(2, 1fr); }
  }
</style>
