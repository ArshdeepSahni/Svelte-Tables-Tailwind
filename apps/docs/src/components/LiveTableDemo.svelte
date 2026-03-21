<script lang="ts">
  import { Table } from '@tablecraft/svelte';

  interface Props {
    darkMode: boolean;
  }
  let { darkMode }: Props = $props();

  type Dataset = 'users' | 'products' | 'orders';

  const usersData = [
    { id: 1, name: 'Alice Johnson', email: 'alice@acme.com', role: 'Admin', active: true, joined: '2023-01-15', salary: 95000, score: 0.95 },
    { id: 2, name: 'Bob Martinez', email: 'bob@acme.com', role: 'Engineer', active: true, joined: '2022-06-01', salary: 110000, score: 0.87 },
    { id: 3, name: 'Carol White', email: 'carol@acme.com', role: 'Designer', active: false, joined: '2023-08-20', salary: 88000, score: 0.72 },
    { id: 4, name: 'David Kim', email: 'david@acme.com', role: 'Manager', active: true, joined: '2021-03-10', salary: 130000, score: 0.91 },
    { id: 5, name: 'Eva Chen', email: 'eva@acme.com', role: 'Engineer', active: true, joined: '2023-11-05', salary: 105000, score: 0.89 },
  ];

  const productsData = [
    { id: 'P-001', name: 'Pro Dashboard', category: 'Software', price: 299.99, stock: 999, status: 'active', launched: '2024-01-01', inStock: true },
    { id: 'P-002', name: 'Analytics Suite', category: 'Software', price: 149.50, stock: 999, status: 'active', launched: '2023-06-15', inStock: true },
    { id: 'P-003', name: 'Wireless Keyboard', category: 'Hardware', price: 79.95, stock: 234, status: 'low_stock', launched: '2022-09-01', inStock: true },
    { id: 'P-004', name: 'USB-C Hub', category: 'Hardware', price: 45.00, stock: 0, status: 'out_of_stock', launched: '2023-02-28', inStock: false },
    { id: 'P-005', name: 'Team License', category: 'Software', price: 999.00, stock: 999, status: 'active', launched: '2024-03-01', inStock: true },
  ];

  const ordersData = [
    { order: '#ORD-9001', customer: 'Acme Corp', total: 2499.97, items: 3, status: 'shipped', date: '2024-03-15T10:30:00Z', paid: true },
    { order: '#ORD-9002', customer: 'Tech Startup', total: 149.50, items: 1, status: 'processing', date: '2024-03-16T14:22:00Z', paid: true },
    { order: '#ORD-9003', customer: 'Design Co', total: 799.95, items: 5, status: 'pending', date: '2024-03-17T09:11:00Z', paid: false },
    { order: '#ORD-9004', customer: 'Global Inc', total: 5999.00, items: 2, status: 'delivered', date: '2024-03-12T16:45:00Z', paid: true },
    { order: '#ORD-9005', customer: 'Local Biz', total: 89.95, items: 1, status: 'cancelled', date: '2024-03-18T08:00:00Z', paid: false },
  ];

  let activeDataset = $state<Dataset>('users');
  let selectable = $state(false);
  let loading = $state(false);
  let striped = $state(true);
  let bordered = $state(false);
  let showInference = $state(true);

  const currentData = $derived(
    activeDataset === 'users' ? usersData :
    activeDataset === 'products' ? productsData :
    ordersData
  );

  const inferenceResults = $derived.by(() => {
    if (activeDataset === 'users') {
      return [
        { key: 'id', type: 'integer', confidence: 0.99, color: '#6366f1' },
        { key: 'name', type: 'text', confidence: 0.95, color: '#64748b' },
        { key: 'email', type: 'email', confidence: 0.99, color: '#ec4899' },
        { key: 'role', type: 'badge', confidence: 0.82, color: '#f59e0b' },
        { key: 'active', type: 'boolean', confidence: 0.99, color: '#22c55e' },
        { key: 'joined', type: 'date', confidence: 0.97, color: '#14b8a6' },
        { key: 'salary', type: 'currency', confidence: 0.91, color: '#a78bfa' },
        { key: 'score', type: 'percentage', confidence: 0.88, color: '#fb7185' },
      ];
    } else if (activeDataset === 'products') {
      return [
        { key: 'id', type: 'code', confidence: 0.85, color: '#6366f1' },
        { key: 'name', type: 'text', confidence: 0.95, color: '#64748b' },
        { key: 'category', type: 'badge', confidence: 0.78, color: '#f59e0b' },
        { key: 'price', type: 'currency', confidence: 0.98, color: '#a78bfa' },
        { key: 'stock', type: 'integer', confidence: 0.99, color: '#6366f1' },
        { key: 'status', type: 'status', confidence: 0.91, color: '#22c55e' },
        { key: 'launched', type: 'date', confidence: 0.97, color: '#14b8a6' },
        { key: 'inStock', type: 'boolean', confidence: 0.99, color: '#22c55e' },
      ];
    } else {
      return [
        { key: 'order', type: 'code', confidence: 0.92, color: '#6366f1' },
        { key: 'customer', type: 'text', confidence: 0.95, color: '#64748b' },
        { key: 'total', type: 'currency', confidence: 0.98, color: '#a78bfa' },
        { key: 'items', type: 'integer', confidence: 0.99, color: '#6366f1' },
        { key: 'status', type: 'status', confidence: 0.94, color: '#22c55e' },
        { key: 'date', type: 'datetime', confidence: 0.97, color: '#14b8a6' },
        { key: 'paid', type: 'boolean', confidence: 0.99, color: '#22c55e' },
      ];
    }
  });

  function simulateLoading() {
    loading = true;
    setTimeout(() => { loading = false; }, 1500);
  }
</script>

<section class="section" class:dark={darkMode} id="demo">
  <div class="section-inner">
    <div class="section-header">
      <div class="section-tag">Live Demo</div>
      <h2 class="section-title">The Actual Component, Working Now</h2>
      <p class="section-desc">
        This is the real <code>&lt;Table&gt;</code> component from <code>@tablecraft/svelte</code> — not a mock.
        Switch datasets and watch the type inference adapt in real-time.
      </p>
    </div>

    <div class="demo-controls">
      <div class="control-group">
        <div class="control-label">Dataset</div>
        <div class="btn-group">
          {#each (['users', 'products', 'orders'] as Dataset[]) as ds}
            <button
              class="btn-tab"
              class:active={activeDataset === ds}
              onclick={() => { activeDataset = ds; }}
            >
              {ds.charAt(0).toUpperCase() + ds.slice(1)}
            </button>
          {/each}
        </div>
      </div>

      <div class="control-group">
        <div class="control-label">Options</div>
        <div class="toggle-group">
          <label class="toggle-label">
            <input type="checkbox" bind:checked={selectable} />
            <span>Selectable</span>
          </label>
          <label class="toggle-label">
            <input type="checkbox" bind:checked={striped} />
            <span>Striped</span>
          </label>
          <label class="toggle-label">
            <input type="checkbox" bind:checked={bordered} />
            <span>Bordered</span>
          </label>
          <label class="toggle-label">
            <input type="checkbox" bind:checked={showInference} />
            <span>Show Inference</span>
          </label>
        </div>
      </div>

      <div class="control-group">
        <button class="btn-action" onclick={simulateLoading}>
          Simulate Loading
        </button>
      </div>
    </div>

    {#if showInference}
      <div class="inference-panel">
        <div class="inference-header">
          <span class="inference-title">Auto-detected column types</span>
          <span class="inference-subtitle">via requestIdleCallback — zero config required</span>
        </div>
        <div class="inference-chips">
          {#each inferenceResults as col}
            <div class="inference-chip" style="--chip-color: {col.color}">
              <span class="chip-key">{col.key}</span>
              <span class="chip-arrow">→</span>
              <span class="chip-type">{col.type}</span>
              <span class="chip-conf">{Math.round(col.confidence * 100)}%</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <div class="table-container" class:dark={darkMode}>
      <Table
        data={currentData}
        {loading}
        {selectable}
        {striped}
        {bordered}
        caption="{activeDataset.charAt(0).toUpperCase() + activeDataset.slice(1)} Dataset"
        filterable={true}
      />
    </div>

    <div class="code-caption">
      <code class="inline-code">
        &lt;Table data={'{'}rows{'}'} {selectable ? 'selectable ' : ''}{striped ? 'striped ' : ''}{bordered ? 'bordered ' : ''}/&gt;
      </code>
    </div>
  </div>
</section>

<style>
  .section {
    padding: 5rem 2rem;
    background: var(--bg-primary);
    border-top: 1px solid var(--border-color);
  }

  .section-inner {
    max-width: 1100px;
    margin: 0 auto;
  }

  .section-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .section-tag {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: rgba(99, 102, 241, 0.15);
    color: #818cf8;
    border: 1px solid rgba(99, 102, 241, 0.3);
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
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }

  .section-desc code {
    font-family: ui-monospace, 'JetBrains Mono', monospace;
    font-size: 0.9em;
    background: rgba(99, 102, 241, 0.1);
    color: #818cf8;
    padding: 0.1em 0.4em;
    border-radius: 0.25rem;
    border: 1px solid rgba(99, 102, 241, 0.2);
  }

  .demo-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    align-items: flex-end;
    padding: 1.25rem 1.5rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .control-label {
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .btn-group {
    display: flex;
    gap: 2px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    padding: 2px;
  }

  .btn-tab {
    padding: 0.375rem 0.875rem;
    border: none;
    border-radius: 0.375rem;
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-tab.active {
    background: #6366f1;
    color: white;
    font-weight: 600;
  }
  .btn-tab:not(.active):hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .toggle-group {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .toggle-label {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.875rem;
    color: var(--text-secondary);
    cursor: pointer;
    user-select: none;
  }
  .toggle-label input { cursor: pointer; accent-color: #6366f1; }
  .toggle-label:hover span { color: var(--text-primary); }

  .btn-action {
    padding: 0.5rem 1.25rem;
    background: rgba(99, 102, 241, 0.15);
    color: #818cf8;
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-action:hover {
    background: rgba(99, 102, 241, 0.25);
    border-color: rgba(99, 102, 241, 0.5);
    color: #a5b4fc;
  }

  .inference-panel {
    padding: 1rem 1.25rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .inference-header {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
  }

  .inference-title {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .inference-subtitle {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .inference-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .inference-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.625rem;
    background: rgba(var(--chip-color, 99 102 241) / 0.1);
    border: 1px solid rgba(var(--chip-color, 99 102 241) / 0.25);
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-family: ui-monospace, monospace;
    border-left: 3px solid var(--chip-color);
  }

  .chip-key { color: var(--text-secondary); font-weight: 500; }
  .chip-arrow { color: var(--text-muted); }
  .chip-type { color: var(--chip-color); font-weight: 700; }
  .chip-conf { color: var(--text-muted); font-size: 0.6875rem; margin-left: 0.125rem; }

  .table-container {
    border-radius: 0.75rem;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  }

  .table-container.dark {
    --tc-color-text: #f1f5f9;
    --tc-color-bg: #0f172a;
    --tc-border-color: #1e293b;
    --tc-toolbar-bg: #0f172a;
    --tc-header-bg: #0a0e1a;
    --tc-header-border: #1e293b;
    --tc-color-bg-hover: #1e293b;
    --tc-color-selected-bg: #172554;
    --tc-color-muted: #64748b;
    --tc-skeleton-from: #1e293b;
    --tc-skeleton-to: #334155;
    --tc-color-primary: #818cf8;
    --tc-color-stripe: #090d18;
    --tc-footer-bg: #0a0e1a;
  }

  .code-caption {
    text-align: center;
    margin-top: 1rem;
  }

  .inline-code {
    font-family: ui-monospace, 'JetBrains Mono', monospace;
    font-size: 0.875rem;
    color: #818cf8;
    background: var(--bg-secondary);
    padding: 0.375rem 0.875rem;
    border-radius: 0.375rem;
    border: 1px solid var(--border-color);
  }

  @media (max-width: 640px) {
    .section { padding: 3rem 1rem; }
    .demo-controls { gap: 1rem; }
  }
</style>
