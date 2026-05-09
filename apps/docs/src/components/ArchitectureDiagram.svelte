<script lang="ts">
  interface Props {
    darkMode: boolean;
  }
  let { darkMode }: Props = $props();

  interface Node {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    label: string;
    sublabel?: string;
    color: string;
    textColor: string;
    description: string;
    size?: string;
  }

  const nodes: Node[] = [
    {
      id: 'core', x: 300, y: 20, w: 200, h: 60,
      label: '@tablecraft/core', sublabel: 'Framework agnostic',
      color: '#0a0a0a', textColor: '#fff',
      description: 'The heart of tablecraft. Contains: type inference engine (17 types), renderer registry (plugin system), cell descriptor pipeline, v1 compat adapter, and the createTableEngine() factory. Ships as ESM + CJS. No framework dependencies.',
      size: '~30 KB',
    },
    {
      id: 'inference', x: 20, y: 130, w: 180, h: 55,
      label: 'Inference Engine', sublabel: 'inferSchema()',
      color: '#a78bfa', textColor: '#fff',
      description: 'Scans data rows and classifies each column into one of 17 ColumnTypes. Uses pattern matching, regex, and value distribution analysis. Returns a ColumnInferenceMap with confidence scores (0-1). Runs via requestIdleCallback to never block the UI thread.',
      size: '~8 KB',
    },
    {
      id: 'registry', x: 215, y: 130, w: 180, h: 55,
      label: 'Renderer Registry', sublabel: '17 built-in + plugins',
      color: '#ec4899', textColor: '#fff',
      description: 'Maps ColumnType → RendererFn. Each renderer is a pure function: (value, column) => CellDescriptor. The registry is extensible — call registry.register() to add custom renderers. Tree-shakable: each renderer is a separate module that can be imported independently.',
      size: '~12 KB',
    },
    {
      id: 'engine', x: 410, y: 130, w: 180, h: 55,
      label: 'Table Engine', sublabel: 'createTableEngine()',
      color: '#f59e0b', textColor: '#fff',
      description: 'Orchestrates the full pipeline: data → inference → column resolution → row processing → CellDescriptor output. Returns resolveColumns(), inferSchema(), and processRows() functions. Stateless — state is managed by the framework layer above it.',
      size: '~6 KB',
    },
    {
      id: 'svelte', x: 80, y: 250, w: 200, h: 60,
      label: '@tablecraft/svelte', sublabel: 'Svelte 5 runes',
      color: '#ff3e00', textColor: '#fff',
      description: 'The Svelte 5 adapter. Uses $state(), $derived(), $effect() runes for reactivity. Implements two-phase rendering (text first, typed second). Integrates @tanstack/svelte-virtual for virtual scrolling. Exposes Table, defineColumns. Ships as .svelte source files.',
      size: '~15 KB',
    },
    {
      id: 'react', x: 305, y: 250, w: 200, h: 60,
      label: '@tablecraft/react', sublabel: 'React 18+ (Phase 8)',
      color: '#61dafb', textColor: '#0a0e1a',
      description: 'React adapter (planned for Phase 8). Will use useMemo, useEffect hooks. Same CellDescriptor pipeline as Svelte adapter. Target: identical API surface — <Table data={rows} /> works in both frameworks.',
      size: '~12 KB (planned)',
    },
    {
      id: 'vue', x: 530, y: 250, w: 200, h: 60,
      label: '@tablecraft/vue', sublabel: 'Vue 3 (Phase 9)',
      color: '#42b883', textColor: '#fff',
      description: 'Vue 3 adapter (planned for Phase 9). Uses ref(), computed(), watchEffect(). Same zero-config API. Target: <Table :data="rows" /> with identical feature set to the Svelte adapter.',
      size: '~12 KB (planned)',
    },
  ];

  const edges = [
    { from: 'core', to: 'inference' },
    { from: 'core', to: 'registry' },
    { from: 'core', to: 'engine' },
    { from: 'core', to: 'svelte' },
    { from: 'core', to: 'react' },
    { from: 'core', to: 'vue' },
    { from: 'inference', to: 'engine' },
    { from: 'registry', to: 'engine' },
  ];

  let selectedNode = $state<Node | null>(null);
  let showDetails = $state(false);

  function getCenter(node: Node) {
    return { cx: node.x + node.w / 2, cy: node.y + node.h / 2 };
  }

  function getEdgePath(from: Node, to: Node) {
    const fc = getCenter(from);
    const tc = getCenter(to);
    const mx = (fc.cx + tc.cx) / 2;
    const my = (fc.cy + tc.cy) / 2;
    return `M ${fc.cx} ${fc.cy + from.h / 2} Q ${mx} ${my} ${tc.cx} ${tc.cy - to.h / 2}`;
  }

  const svgW = 760;
  const svgH = 350;
</script>

<section class="section" class:dark={darkMode} id="architecture">
  <div class="section-inner">
    <div class="section-header">
      <div class="section-tag">Architecture</div>
      <h2 class="section-title">Interactive Component Diagram</h2>
      <p class="section-desc">
        Click any component to see what it does, its size, and its role in the pipeline.
      </p>
    </div>

    <div class="diagram-container">
      <svg
        viewBox="0 0 {svgW} {svgH}"
        width="100%"
        role="img"
        aria-label="Architecture diagram showing @tablecraft package dependencies"
        style="display: block;"
      >
        <!-- Edges -->
        {#each edges as edge}
          {@const fromNode = nodes.find(n => n.id === edge.from)!}
          {@const toNode = nodes.find(n => n.id === edge.to)!}
          <path
            d={getEdgePath(fromNode, toNode)}
            fill="none"
            stroke="rgba(10,10,10,0.15)"
            stroke-width="1.5"
            stroke-dasharray="4 3"
          />
        {/each}

        <!-- Animated data flow dots -->
        {#each edges.slice(0, 3) as edge, i}
          {@const fromNode = nodes.find(n => n.id === edge.from)!}
          {@const toNode = nodes.find(n => n.id === edge.to)!}
          <circle r="3" fill="#0a0a0a" opacity="0.8">
            <animateMotion dur="{2 + i * 0.4}s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1">
              <mpath href="#edge-{i}" />
            </animateMotion>
          </circle>
          <path
            id="edge-{i}"
            d={getEdgePath(fromNode, toNode)}
            fill="none"
            stroke="none"
          />
        {/each}

        <!-- Nodes -->
        {#each nodes as node}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <g
            class="node-group"
            onclick={() => { selectedNode = node; }}
            style="cursor: pointer;"
          >
            <rect
              x={node.x}
              y={node.y}
              width={node.w}
              height={node.h}
              rx="8"
              fill={node.color}
              opacity={selectedNode?.id === node.id ? 1 : 0.85}
              stroke={selectedNode?.id === node.id ? '#fff' : 'transparent'}
              stroke-width="2"
              filter={selectedNode?.id === node.id ? 'drop-shadow(0 0 12px rgba(255,255,255,0.3))' : 'none'}
            />
            <text
              x={node.x + node.w / 2}
              y={node.y + (node.sublabel ? 22 : 33)}
              text-anchor="middle"
              font-family="-apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif"
              font-size="11"
              font-weight="700"
              fill={node.textColor}
            >
              {node.label}
            </text>
            {#if node.sublabel}
              <text
                x={node.x + node.w / 2}
                y={node.y + 38}
                text-anchor="middle"
                font-family="-apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif"
                font-size="9"
                font-weight="400"
                fill={node.textColor}
                opacity="0.8"
              >
                {node.sublabel}
              </text>
            {/if}
            {#if node.size}
              <text
                x={node.x + node.w - 6}
                y={node.y + node.h - 6}
                text-anchor="end"
                font-family="ui-monospace, monospace"
                font-size="8"
                fill={node.textColor}
                opacity="0.7"
              >
                {node.size}
              </text>
            {/if}
          </g>
        {/each}
      </svg>
    </div>

    {#if selectedNode}
      <div class="node-detail" style="--node-color: {selectedNode.color}">
        <div class="node-detail-header">
          <div class="node-detail-badge" style="background: {selectedNode.color};">
            {selectedNode.label}
          </div>
          {#if selectedNode.size}
            <div class="node-size">{selectedNode.size}</div>
          {/if}
          <button class="close-btn" onclick={() => { selectedNode = null; }}>
            x
          </button>
        </div>
        <p class="node-detail-text">{selectedNode.description}</p>
      </div>
    {:else}
      <div class="click-hint">
        Click any component above to explore its role in the pipeline
      </div>
    {/if}

    <button class="details-toggle" onclick={() => { showDetails = !showDetails; }}>
      {showDetails ? 'Hide' : 'Show'} Data Flow Details
    </button>

    {#if showDetails}
      <div class="flow-steps">
        <div class="flow-step">
          <div class="step-num">1</div>
          <div class="step-content">
            <strong>Data Input</strong>
            <p>Raw <code>Row[]</code> arrives at Table component. No schema required.</p>
          </div>
        </div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">
          <div class="step-num">2</div>
          <div class="step-content">
            <strong>Phase 1: Text Pass</strong>
            <p>All columns instantly shown as text. Table renders immediately.</p>
          </div>
        </div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">
          <div class="step-num">3</div>
          <div class="step-content">
            <strong>Phase 2: Inference</strong>
            <p>requestIdleCallback triggers inferSchema() — never blocks UI.</p>
          </div>
        </div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">
          <div class="step-num">4</div>
          <div class="step-content">
            <strong>CellDescriptors</strong>
            <p>Each cell becomes a typed descriptor. No raw HTML — safe by design.</p>
          </div>
        </div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">
          <div class="step-num">5</div>
          <div class="step-content">
            <strong>Render</strong>
            <p>Cell.svelte switches on descriptor.kind — type-safe, no innerHTML.</p>
          </div>
        </div>
      </div>
    {/if}
  </div>
</section>

<style>
  .section {
    padding: 5rem 2rem;
    background: var(--bg-primary);
    border-top: 1px solid var(--border-color);
  }

  .section-inner { max-width: 1100px; margin: 0 auto; }
  .section-header { text-align: center; margin-bottom: 3rem; }

  .section-tag {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: rgba(167, 139, 250, 0.15);
    color: #c4b5fd;
    border: 1px solid rgba(167, 139, 250, 0.3);
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

  .diagram-container {
    background: #f8fafc;
    border: 1px solid rgba(10, 10, 10, 0.12);
    border-radius: 1rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    overflow: hidden;
  }

  .node-group { transition: opacity 0.15s; }
  .node-group:hover rect { opacity: 1 !important; }

  .node-detail {
    padding: 1.25rem 1.5rem;
    background: var(--bg-secondary);
    border: 1px solid var(--node-color, var(--border-color));
    border-left: 4px solid var(--node-color, var(--border-color));
    border-radius: 0.75rem;
    margin-bottom: 1.5rem;
    animation: slideIn 0.2s ease;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .node-detail-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
  }

  .node-detail-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: 0.375rem;
    font-size: 0.8125rem;
    font-weight: 700;
    color: white;
  }

  .node-size {
    font-size: 0.8125rem;
    color: var(--text-muted);
    font-family: ui-monospace, monospace;
    margin-left: auto;
  }

  .close-btn {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    color: var(--text-muted);
    font-size: 0.75rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .node-detail-text {
    font-size: 0.9375rem;
    color: var(--text-secondary);
    line-height: 1.7;
  }

  .click-hint {
    text-align: center;
    color: var(--text-muted);
    font-size: 0.875rem;
    padding: 1.5rem;
    border: 1px dashed var(--border-color);
    border-radius: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .details-toggle {
    display: block;
    margin: 0 auto 1.5rem;
    padding: 0.5rem 1.5rem;
    background: var(--bg-secondary);
    color: var(--text-muted);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s;
  }
  .details-toggle:hover { color: var(--text-primary); border-color: #0a0a0a; }

  .flow-steps {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
    animation: slideIn 0.2s ease;
  }

  .flow-step {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    flex: 1;
    min-width: 160px;
  }

  .step-num {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    background: #0a0a0a;
    color: white;
    border-radius: 50%;
    font-size: 0.8125rem;
    font-weight: 800;
    flex-shrink: 0;
  }

  .step-content strong {
    display: block;
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
  }

  .step-content p {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .step-content code {
    font-family: ui-monospace, monospace;
    font-size: 0.85em;
    color: #0a0a0a;
    background: rgba(10,10,10,0.06);
    padding: 0.1em 0.3em;
    border-radius: 0.25rem;
  }

  .flow-arrow {
    color: var(--text-muted);
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  @media (max-width: 640px) {
    .section { padding: 3rem 1rem; }
    .flow-steps { flex-direction: column; }
    .flow-arrow { transform: rotate(90deg); }
  }
</style>
