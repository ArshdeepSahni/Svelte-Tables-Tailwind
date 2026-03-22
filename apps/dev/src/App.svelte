<script lang="ts">
  import { Table } from '@tablecraft/svelte';

  // --- Sample datasets ---

  const users = [
    { id: 1, name: 'Alice Johnson',  email: 'alice@example.com',  avatar: 'https://i.pravatar.cc/40?img=1',  role: 'admin',  active: true,  joined: '2023-01-15', salary: 95000 },
    { id: 2, name: 'Bob Smith',      email: 'bob@example.com',    avatar: 'https://i.pravatar.cc/40?img=2',  role: 'editor', active: false, joined: '2023-03-22', salary: 72000 },
    { id: 3, name: 'Carol White',    email: 'carol@example.com',  avatar: 'https://i.pravatar.cc/40?img=3',  role: 'viewer', active: true,  joined: '2023-07-10', salary: 68000 },
    { id: 4, name: 'Dave Brown',     email: 'dave@example.com',   avatar: 'https://i.pravatar.cc/40?img=4',  role: 'admin',  active: true,  joined: '2022-11-01', salary: 110000 },
    { id: 5, name: 'Eve Davis',      email: 'eve@example.com',    avatar: 'https://i.pravatar.cc/40?img=5',  role: 'editor', active: false, joined: '2024-02-28', salary: 78000 },
    { id: 6, name: 'Frank Miller',   email: 'frank@example.com',  avatar: 'https://i.pravatar.cc/40?img=6',  role: 'viewer', active: true,  joined: '2023-09-14', salary: 62000 },
    { id: 7, name: 'Grace Lee',      email: 'grace@example.com',  avatar: 'https://i.pravatar.cc/40?img=7',  role: 'admin',  active: true,  joined: '2022-05-30', salary: 115000 },
    { id: 8, name: 'Hank Wilson',    email: 'hank@example.com',   avatar: 'https://i.pravatar.cc/40?img=8',  role: 'editor', active: false, joined: '2024-01-10', salary: 74000 },
    { id: 9, name: 'Iris Chen',      email: 'iris@example.com',   avatar: 'https://i.pravatar.cc/40?img=9',  role: 'viewer', active: true,  joined: '2023-04-05', salary: 58000 },
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

  // Finance dataset — showcases rating, progress, color cell renderers
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

  type Dataset = 'users' | 'products' | 'finance' | 'empty';

  let dataset = $state<Dataset>('users');
  let loading = $state(false);
  let density = $state<'compact' | 'comfortable' | 'spacious'>('comfortable');
  let groupBy = $state<string | null>(null);
  let showAggregates = $state(false);

  function simulateLoad() {
    loading = true;
    setTimeout(() => (loading = false), 2000);
  }

  const currentData = $derived(
    dataset === 'users'    ? users    :
    dataset === 'products' ? products :
    dataset === 'finance'  ? finance  : [],
  );

  const groupByOptions = $derived(
    dataset === 'users'    ? ['role', 'active']    :
    dataset === 'products' ? ['category']          :
    dataset === 'finance'  ? ['sector']            : [],
  );

  // Reset groupBy when dataset changes (avoid stale key)
  $effect(() => {
    void dataset;
    groupBy = null;
  });
</script>

<h1>@tablecraft/svelte — Dev Playground</h1>
<p>
  Live preview of @tablecraft/svelte. Switch datasets to test zero-config inference and new cell renderers.
  Try tokenized search: <code>role:admin salary:&gt;80000</code>
</p>

<div class="toolbar">
  <div class="toolbar-group">
    <span class="toolbar-label">Dataset:</span>
    <button onclick={() => (dataset = 'users')}    class:active={dataset === 'users'}>Users</button>
    <button onclick={() => (dataset = 'products')} class:active={dataset === 'products'}>Products</button>
    <button onclick={() => (dataset = 'finance')}  class:active={dataset === 'finance'}>Finance</button>
    <button onclick={() => (dataset = 'empty')}    class:active={dataset === 'empty'}>Empty</button>
  </div>

  <div class="toolbar-group">
    <span class="toolbar-label">Density:</span>
    <button onclick={() => (density = 'compact')}     class:active={density === 'compact'}>Compact</button>
    <button onclick={() => (density = 'comfortable')} class:active={density === 'comfortable'}>Comfortable</button>
    <button onclick={() => (density = 'spacious')}    class:active={density === 'spacious'}>Spacious</button>
  </div>

  <div class="toolbar-group">
    <span class="toolbar-label">Group by:</span>
    <button onclick={() => (groupBy = null)} class:active={groupBy === null}>None</button>
    {#each groupByOptions as opt}
      <button onclick={() => (groupBy = opt)} class:active={groupBy === opt}>{opt}</button>
    {/each}
  </div>

  <div class="toolbar-group">
    <label class="toolbar-toggle">
      <input type="checkbox" bind:checked={showAggregates} />
      Show aggregates
    </label>
    <button onclick={simulateLoad} class="btn-secondary">Simulate Loading (2s)</button>
  </div>
</div>

{#if dataset === 'finance'}
  <p class="hint">
    Finance dataset showcases new cell renderers: <strong>rating</strong> (stars), <strong>progress</strong> (bar), <strong>color</strong> (swatch).
    Try: <code>sector:Technology change_pct:&gt;1</code>
  </p>
{/if}

<Table
  data={currentData}
  {loading}
  {density}
  {groupBy}
  {showAggregates}
  caption="Dev Playground Table"
  selectable
/>

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
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-right: 0.15rem;
  }

  .toolbar-toggle {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.875rem;
    color: #475569;
    cursor: pointer;
  }

  button {
    padding: 0.375rem 0.875rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    font-size: 0.875rem;
    color: #475569;
    transition: all 0.15s;
  }

  button:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }

  button.active {
    background: #3b82f6;
    border-color: #3b82f6;
    color: white;
  }

  .btn-secondary {
    background: #f8fafc;
    margin-left: 0.5rem;
  }

  .hint {
    font-size: 0.875rem;
    color: #64748b;
    margin-bottom: 1rem;
    padding: 0.625rem 1rem;
    background: #f0f9ff;
    border-left: 3px solid #3b82f6;
    border-radius: 0 6px 6px 0;
  }

  .hint code {
    background: #e0f2fe;
    padding: 0.1em 0.35em;
    border-radius: 3px;
    font-size: 0.8125rem;
    color: #0369a1;
  }
</style>
