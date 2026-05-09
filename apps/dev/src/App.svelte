<script lang="ts">
  import { Table, createSimulatedStream } from '@tablecraft/svelte';
  import type { StreamSource } from '@tablecraft/svelte';
  import { fly } from 'svelte/transition';

  // --- Type Showcase dataset — one column per inferred type ---

  const typeShowcase = [
    {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      phone: '+1 (555) 234-5678',
      website: 'https://alice.dev',
      avatar: 'https://i.pravatar.cc/40?img=1',
      active: true,
      joined: '2023-01-15',
      last_login: '2024-03-15T14:32:00Z',
      salary: 95000,
      completion: 0.87,
      status: 'active',
      api_key: 'sk_live_abc123',
      theme_color: '#6366f1',
      rating: 4.5,
      progress: 73,
      sparkline: [23, 45, 67, 34, 89, 56, 78, 92, 45, 67],
      actions: [{ id: 'view', label: 'View', variant: 'default' }, { id: 'edit', label: 'Edit', variant: 'primary' }],
    },
    {
      name: 'Bob Smith',
      email: 'bob@co.io',
      phone: '+44 7700 900077',
      website: 'https://bob.co',
      avatar: 'https://i.pravatar.cc/40?img=2',
      active: false,
      joined: '2022-06-20',
      last_login: '2024-03-10T09:15:00Z',
      salary: 72000,
      completion: 0.45,
      status: 'inactive',
      api_key: 'sk_test_xyz789',
      theme_color: '#10b981',
      rating: 3.5,
      progress: 45,
      sparkline: [56, 34, 78, 45, 23, 67, 89, 12, 34, 56],
      actions: [{ id: 'view', label: 'View', variant: 'default' }, { id: 'edit', label: 'Edit', variant: 'primary' }],
    },
    {
      name: 'Carol White',
      email: 'carol@startup.com',
      phone: '+1 (555) 987-6543',
      website: 'https://carol.io',
      avatar: 'https://i.pravatar.cc/40?img=3',
      active: true,
      joined: '2023-09-01',
      last_login: '2024-03-15T08:00:00Z',
      salary: 110000,
      completion: 0.95,
      status: 'admin',
      api_key: 'sk_live_qrs456',
      theme_color: '#f59e0b',
      rating: 5,
      progress: 95,
      sparkline: [12, 34, 56, 78, 90, 95, 92, 97, 98, 99],
      actions: [{ id: 'view', label: 'View', variant: 'default' }, { id: 'edit', label: 'Edit', variant: 'primary' }],
    },
    {
      name: 'Dave Brown',
      email: 'dave@corp.com',
      phone: '+61 400 123 456',
      website: 'https://dave.net',
      avatar: 'https://i.pravatar.cc/40?img=4',
      active: true,
      joined: '2021-11-15',
      last_login: '2024-03-14T16:45:00Z',
      salary: 88000,
      completion: 0.62,
      status: 'pending',
      api_key: 'sk_test_mno012',
      theme_color: '#ef4444',
      rating: 4,
      progress: 62,
      sparkline: [67, 72, 55, 80, 45, 60, 75, 82, 58, 63],
      actions: [{ id: 'view', label: 'View', variant: 'default' }, { id: 'edit', label: 'Edit', variant: 'primary' }],
    },
    {
      name: 'Eve Davis',
      email: 'eve@agency.co',
      phone: '+1 (555) 345-6789',
      website: 'https://eve.design',
      avatar: 'https://i.pravatar.cc/40?img=5',
      active: false,
      joined: '2024-01-01',
      last_login: '2024-03-13T11:30:00Z',
      salary: 78000,
      completion: 0.30,
      status: 'trial',
      api_key: 'sk_live_pqr789',
      theme_color: '#8b5cf6',
      rating: 2,
      progress: 30,
      sparkline: [89, 76, 54, 43, 32, 28, 25, 22, 20, 18],
      actions: [{ id: 'view', label: 'View', variant: 'default' }, { id: 'edit', label: 'Edit', variant: 'primary' }],
    },
  ];

  // --- Users dataset — showcases row selection ---

  const users = [
    { id: 1,  name: 'Alice Johnson', email: 'alice@example.com',  avatar: 'https://i.pravatar.cc/40?img=1',  role: 'admin',  active: true,  joined: '2023-01-15', salary: 95000 },
    { id: 2,  name: 'Bob Smith',     email: 'bob@example.com',    avatar: 'https://i.pravatar.cc/40?img=2',  role: 'editor', active: false, joined: '2023-03-22', salary: 72000 },
    { id: 3,  name: 'Carol White',   email: 'carol@example.com',  avatar: 'https://i.pravatar.cc/40?img=3',  role: 'viewer', active: true,  joined: '2023-07-10', salary: 68000 },
    { id: 4,  name: 'Dave Brown',    email: 'dave@example.com',   avatar: 'https://i.pravatar.cc/40?img=4',  role: 'admin',  active: true,  joined: '2022-11-01', salary: 110000 },
    { id: 5,  name: 'Eve Davis',     email: 'eve@example.com',    avatar: 'https://i.pravatar.cc/40?img=5',  role: 'editor', active: false, joined: '2024-02-28', salary: 78000 },
    { id: 6,  name: 'Frank Miller',  email: 'frank@example.com',  avatar: 'https://i.pravatar.cc/40?img=6',  role: 'viewer', active: true,  joined: '2023-09-14', salary: 62000 },
    { id: 7,  name: 'Grace Lee',     email: 'grace@example.com',  avatar: 'https://i.pravatar.cc/40?img=7',  role: 'admin',  active: true,  joined: '2022-05-30', salary: 115000 },
    { id: 8,  name: 'Hank Wilson',   email: 'hank@example.com',   avatar: 'https://i.pravatar.cc/40?img=8',  role: 'editor', active: false, joined: '2024-01-10', salary: 74000 },
    { id: 9,  name: 'Iris Chen',     email: 'iris@example.com',   avatar: 'https://i.pravatar.cc/40?img=9',  role: 'viewer', active: true,  joined: '2023-04-05', salary: 58000 },
    { id: 10, name: 'Jack Taylor',   email: 'jack@example.com',   avatar: 'https://i.pravatar.cc/40?img=10', role: 'admin',  active: true,  joined: '2021-12-20', salary: 98000 },
    { id: 11, name: 'Karen Moore',   email: 'karen@example.com',  avatar: 'https://i.pravatar.cc/40?img=11', role: 'editor', active: true,  joined: '2023-06-18', salary: 81000 },
    { id: 12, name: 'Liam Scott',    email: 'liam@example.com',   avatar: 'https://i.pravatar.cc/40?img=12', role: 'viewer', active: false, joined: '2024-03-01', salary: 65000 },
    { id: 13, name: 'Mia Anderson',  email: 'mia@example.com',    avatar: 'https://i.pravatar.cc/40?img=13', role: 'admin',  active: true,  joined: '2022-08-22', salary: 105000 },
    { id: 14, name: 'Noah Garcia',   email: 'noah@example.com',   avatar: 'https://i.pravatar.cc/40?img=14', role: 'editor', active: true,  joined: '2023-11-30', salary: 76000 },
    { id: 15, name: 'Olivia Hall',   email: 'olivia@example.com', avatar: 'https://i.pravatar.cc/40?img=15', role: 'viewer', active: true,  joined: '2023-02-14', salary: 69000 },
  ];

  const products = [
    { sku: 'PRD-001', name: 'Wireless Headphones', price: 149.99, stock: 234, category: 'Electronics', rating: 4.7, url: 'https://example.com/p/001' },
    { sku: 'PRD-002', name: 'Ergonomic Chair',      price: 399.00, stock: 45,  category: 'Furniture',   rating: 4.9, url: 'https://example.com/p/002' },
    { sku: 'PRD-003', name: 'Mechanical Keyboard',  price: 89.99,  stock: 512, category: 'Electronics', rating: 4.5, url: 'https://example.com/p/003' },
    { sku: 'PRD-004', name: 'Standing Desk',        price: 699.00, stock: 12,  category: 'Furniture',   rating: 4.8, url: 'https://example.com/p/004' },
    { sku: 'PRD-005', name: 'USB-C Hub',            price: 49.99,  stock: 890, category: 'Electronics', rating: 4.3, url: 'https://example.com/p/005' },
    { sku: 'PRD-006', name: 'Monitor 4K',           price: 549.99, stock: 78,  category: 'Electronics', rating: 4.6, url: 'https://example.com/p/006' },
    { sku: 'PRD-007', name: 'Webcam HD',            price: 79.99,  stock: 340, category: 'Electronics', rating: 4.2, url: 'https://example.com/p/007' },
    { sku: 'PRD-008', name: 'Desk Lamp',            price: 34.99,  stock: 623, category: 'Accessories', rating: 4.0, url: 'https://example.com/p/008' },
  ];

  const finance = [
    { ticker: 'AAPL',  name: 'Apple Inc.',            price: 189.50, change_pct: 1.24,  rating: 4.8, progress: 87, color: '#34d399', sector: 'Technology',  market_cap: '2.98T' },
    { ticker: 'MSFT',  name: 'Microsoft Corp.',        price: 415.20, change_pct: 0.87,  rating: 4.7, progress: 92, color: '#60a5fa', sector: 'Technology',  market_cap: '3.09T' },
    { ticker: 'GOOGL', name: 'Alphabet Inc.',          price: 172.80, change_pct: -0.53, rating: 4.5, progress: 74, color: '#f59e0b', sector: 'Technology',  market_cap: '2.13T' },
    { ticker: 'AMZN',  name: 'Amazon.com Inc.',        price: 198.30, change_pct: 2.11,  rating: 4.3, progress: 81, color: '#f97316', sector: 'Consumer',    market_cap: '2.07T' },
    { ticker: 'NVDA',  name: 'NVIDIA Corp.',           price: 875.40, change_pct: 3.44,  rating: 4.9, progress: 95, color: '#84cc16', sector: 'Technology',  market_cap: '2.16T' },
    { ticker: 'META',  name: 'Meta Platforms Inc.',    price: 528.10, change_pct: -1.20, rating: 4.2, progress: 68, color: '#818cf8', sector: 'Technology',  market_cap: '1.35T' },
    { ticker: 'BRK.B', name: 'Berkshire Hathaway B',  price: 406.70, change_pct: 0.44,  rating: 4.6, progress: 79, color: '#fb923c', sector: 'Financials',  market_cap: '890B' },
    { ticker: 'JPM',   name: 'JPMorgan Chase',         price: 201.30, change_pct: -0.33, rating: 4.1, progress: 63, color: '#2dd4bf', sector: 'Financials',  market_cap: '581B' },
    { ticker: 'V',     name: 'Visa Inc.',              price: 277.60, change_pct: 0.95,  rating: 4.5, progress: 85, color: '#a78bfa', sector: 'Financials',  market_cap: '571B' },
    { ticker: 'JNJ',   name: 'Johnson & Johnson',      price: 156.40, change_pct: -0.72, rating: 4.0, progress: 59, color: '#f43f5e', sector: 'Healthcare',  market_cap: '377B' },
    { ticker: 'WMT',   name: 'Walmart Inc.',           price: 68.20,  change_pct: 1.08,  rating: 3.9, progress: 71, color: '#06b6d4', sector: 'Consumer',    market_cap: '549B' },
    { ticker: 'PG',    name: 'Procter & Gamble',       price: 163.90, change_pct: 0.31,  rating: 4.2, progress: 76, color: '#d946ef', sector: 'Consumer',    market_cap: '386B' },
  ];

  // --- Live Stream dataset (Phase 9) ---

  const streamPool = [
    { ticker: 'AAPL', company: 'Apple Inc.', price: 189.50, volume: 42310000, change: 1.24, sector: 'Technology' },
    { ticker: 'MSFT', company: 'Microsoft', price: 415.20, volume: 28150000, change: 0.87, sector: 'Technology' },
    { ticker: 'GOOGL', company: 'Alphabet', price: 172.80, volume: 19870000, change: -0.53, sector: 'Technology' },
    { ticker: 'AMZN', company: 'Amazon', price: 198.30, volume: 35420000, change: 2.11, sector: 'Consumer' },
    { ticker: 'NVDA', company: 'NVIDIA', price: 875.40, volume: 51230000, change: 3.44, sector: 'Technology' },
    { ticker: 'META', company: 'Meta', price: 528.10, volume: 22890000, change: -1.20, sector: 'Technology' },
    { ticker: 'TSLA', company: 'Tesla', price: 248.50, volume: 67450000, change: -2.33, sector: 'Automotive' },
    { ticker: 'JPM', company: 'JPMorgan', price: 201.30, volume: 15670000, change: 0.44, sector: 'Financials' },
  ];

  // Column overrides for showcase — sparkline & actions need explicit type
  const showcaseColumns = {
    sparkline: 'sparkline' as const,
    actions: 'actions' as const,
  };

  let activeStream = $state<StreamSource | undefined>(undefined);

  function startStream() {
    activeStream = createSimulatedStream({
      pool: streamPool,
      intervalMs: 800,
      batchSize: 1,
      maxRows: 50,
      keyField: 'ticker',
      operations: ['append', 'append', 'update'],
    });
  }

  function stopStream() {
    activeStream = undefined;
  }

  type Dataset = 'showcase' | 'users' | 'products' | 'finance' | 'stream' | 'empty';

  let dataset = $state<Dataset>('showcase');
  let loading = $state(false);
  let density = $state<'compact' | 'comfortable' | 'spacious'>('comfortable');
  let groupBy = $state<string | null>(null);
  let showAggregates = $state(false);

  // Row selection — bind to Table, drive action bar
  let selectedRows = $state<Record<string, unknown>[]>([]);

  function simulateLoad() {
    loading = true;
    setTimeout(() => (loading = false), 2000);
  }

  // Action bar handlers
  function exportSelected() {
    const keys = Object.keys(selectedRows[0] ?? {});
    const csv = [
      keys.join(','),
      ...selectedRows.map((row) =>
        keys.map((k) => JSON.stringify(row[k] ?? '')).join(','),
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function duplicateSelected() {
    alert(`Duplicate ${selectedRows.length} row(s) — connect your data store here.`);
  }

  function deleteSelected() {
    alert(`Delete ${selectedRows.length} row(s) — connect your data store here.`);
    selectedRows = [];
  }

  const currentData = $derived(
    dataset === 'showcase' ? typeShowcase :
    dataset === 'users'    ? users        :
    dataset === 'products' ? products     :
    dataset === 'finance'  ? finance      :
    dataset === 'stream'   ? []           : [],
  );

  const groupByOptions = $derived(
    dataset === 'users'    ? ['role', 'active']    :
    dataset === 'products' ? ['category']          :
    dataset === 'finance'  ? ['sector']            : [],
  );

  // Reset groupBy + selectedRows when dataset changes
  $effect(() => {
    void dataset;
    groupBy = null;
    selectedRows = [];
    // Auto-manage stream lifecycle
    if (dataset === 'stream') {
      startStream();
    } else {
      stopStream();
    }
  });
</script>

<h1>@tablecraft/svelte — Dev Playground</h1>
<p>
  Live preview of @tablecraft/svelte. Switch datasets to test zero-config type inference, cell renderers, and row selection UX.
</p>

<div class="toolbar">
  <div class="toolbar-group">
    <span class="toolbar-label">Dataset:</span>
    <button onclick={() => (dataset = 'showcase')} class:active={dataset === 'showcase'}>Type Showcase</button>
    <button onclick={() => (dataset = 'users')}    class:active={dataset === 'users'}>Users</button>
    <button onclick={() => (dataset = 'products')} class:active={dataset === 'products'}>Products</button>
    <button onclick={() => (dataset = 'finance')}  class:active={dataset === 'finance'}>Finance</button>
    <button onclick={() => (dataset = 'stream')}   class:active={dataset === 'stream'} class:streaming={dataset === 'stream'}>&#9679; Live Stream</button>
    <button onclick={() => (dataset = 'empty')}    class:active={dataset === 'empty'}>Empty</button>
  </div>

  <div class="toolbar-group">
    <span class="toolbar-label">Density:</span>
    <button onclick={() => (density = 'compact')}     class:active={density === 'compact'}>Compact</button>
    <button onclick={() => (density = 'comfortable')} class:active={density === 'comfortable'}>Comfortable</button>
    <button onclick={() => (density = 'spacious')}    class:active={density === 'spacious'}>Spacious</button>
  </div>

  {#if groupByOptions.length > 0}
    <div class="toolbar-group">
      <span class="toolbar-label">Group by:</span>
      <button onclick={() => (groupBy = null)} class:active={groupBy === null}>None</button>
      {#each groupByOptions as opt}
        <button onclick={() => (groupBy = opt)} class:active={groupBy === opt}>{opt}</button>
      {/each}
    </div>
  {/if}

  <div class="toolbar-group">
    <label class="toolbar-toggle">
      <input type="checkbox" bind:checked={showAggregates} />
      Show aggregates
    </label>
    <button onclick={simulateLoad} class="btn-secondary">Simulate Loading</button>
  </div>
</div>

{#if dataset === 'showcase'}
  <p class="hint">
    <strong>Type Showcase</strong> — every column is a different inferred type: text, email, phone, URL, image, boolean, date, datetime, number, percentage, status, code, color, rating, progress.
  </p>
{:else if dataset === 'stream'}
  <p class="hint">
    <strong>Live Stream</strong> — real-time data arriving via AsyncIterable. Rows append automatically, ticker prices update live. Watch the green "Live" indicator and throughput counter.
  </p>
{/if}

<!-- Contextual action bar — appears on row selection -->
<div class="table-region">
  {#if selectedRows.length > 0}
    <div class="action-bar" transition:fly={{ y: 8, duration: 200 }}>
      <span class="action-count">{selectedRows.length} selected</span>
      <div class="action-buttons">
        <button onclick={exportSelected} class="action-btn action-btn--secondary">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 2v9M5 8l3 3 3-3M2 13h12"/>
          </svg>
          Export CSV
        </button>
        <button onclick={duplicateSelected} class="action-btn action-btn--secondary">Duplicate</button>
        <button onclick={deleteSelected} class="action-btn action-btn--danger">Delete</button>
      </div>
      <button onclick={() => (selectedRows = [])} class="action-deselect" aria-label="Deselect all">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M1 1l8 8M9 1l-8 8"/>
        </svg>
      </button>
    </div>
  {/if}

  <Table
    data={currentData}
    columns={dataset === 'showcase' ? showcaseColumns : undefined}
    stream={activeStream}
    {loading}
    {density}
    {groupBy}
    {showAggregates}
    selectable={dataset === 'users' || dataset === 'showcase'}
    bind:selectedRows
    editable
    exportable
    caption="Dev Playground Table"
  />
</div>

<style>
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
    align-items: center;
  }

  .toolbar-group {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  .toolbar-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #737373;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-right: 0.15rem;
  }

  .toolbar-toggle {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.875rem;
    color: #525252;
    cursor: pointer;
  }

  button {
    padding: 0.375rem 0.875rem;
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    font-size: 0.8125rem;
    color: #525252;
    transition: all 0.12s;
    font-family: inherit;
  }

  button:hover {
    border-color: #0a0a0a;
    color: #0a0a0a;
  }

  button.active {
    background: #0a0a0a;
    border-color: #0a0a0a;
    color: white;
  }

  .btn-secondary {
    background: #fafafa;
    margin-left: 0.5rem;
  }

  .streaming {
    background: rgba(34, 197, 94, 0.1) !important;
    border-color: rgba(34, 197, 94, 0.3) !important;
    color: #16a34a !important;
  }
  .streaming.active {
    background: rgba(34, 197, 94, 0.15) !important;
    font-weight: 600;
  }

  .hint {
    font-size: 0.8125rem;
    color: #737373;
    margin-bottom: 1rem;
    padding: 0.625rem 1rem;
    background: #fafafa;
    border-left: 2px solid #e5e5e5;
    border-radius: 0 6px 6px 0;
  }

  /* Table region — wraps action bar + table */
  .table-region {
    position: relative;
  }

  /* Floating action bar — glass morphism, pill shape */
  .action-bar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 8px 12px;
    margin-bottom: 8px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid #e5e5e5;
    border-radius: 9999px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.10), 0 2px 6px rgba(0, 0, 0, 0.05);
    width: fit-content;
  }

  .action-count {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #0a0a0a;
    white-space: nowrap;
    padding-left: 4px;
  }

  .action-buttons {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 5px 12px;
    border-radius: 9999px;
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.12s;
    font-family: inherit;
    white-space: nowrap;
  }

  .action-btn--secondary {
    background: #f5f5f5;
    color: #0a0a0a;
    border-color: #e5e5e5;
  }

  .action-btn--secondary:hover {
    background: #ebebeb;
    border-color: #0a0a0a;
  }

  .action-btn--danger {
    background: #fff1f2;
    color: #be123c;
    border-color: #fecdd3;
  }

  .action-btn--danger:hover {
    background: #ffe4e6;
    border-color: #be123c;
  }

  .action-deselect {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #f5f5f5;
    border: none;
    cursor: pointer;
    color: #737373;
    padding: 0;
    transition: all 0.12s;
    flex-shrink: 0;
    font-family: inherit;
  }

  .action-deselect:hover {
    background: #ebebeb;
    color: #0a0a0a;
  }
</style>
