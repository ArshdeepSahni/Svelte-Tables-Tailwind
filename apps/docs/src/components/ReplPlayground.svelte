<script lang="ts">
  import { Table } from '@tablecraft/svelte';

  interface Props {
    darkMode: boolean;
  }
  let { darkMode }: Props = $props();

  const sampleDatasets: Record<string, { label: string; json: string }> = {
    users: {
      label: 'Users',
      json: JSON.stringify([
        { name: 'Alice Johnson', email: 'alice@acme.com', role: 'Admin', active: true, joined: '2023-01-15', salary: 95000 },
        { name: 'Bob Martinez', email: 'bob@acme.com', role: 'Engineer', active: true, joined: '2022-06-01', salary: 110000 },
        { name: 'Carol White', email: 'carol@acme.com', role: 'Designer', active: false, joined: '2023-08-20', salary: 88000 },
        { name: 'David Kim', email: 'david@acme.com', role: 'Manager', active: true, joined: '2021-03-10', salary: 130000 },
        { name: 'Eva Chen', email: 'eva@acme.com', role: 'Engineer', active: true, joined: '2023-11-05', salary: 105000 },
      ], null, 2),
    },
    products: {
      label: 'Products',
      json: JSON.stringify([
        { sku: 'PRO-001', name: 'Pro Dashboard', price: 299.99, stock: 142, category: 'Software', status: 'active', url: 'https://example.com/pro' },
        { sku: 'PRO-002', name: 'Analytics Suite', price: 149.50, stock: 89, category: 'Software', status: 'active', url: 'https://example.com/analytics' },
        { sku: 'HW-003', name: 'Wireless Keyboard', price: 79.95, stock: 234, category: 'Hardware', status: 'low_stock', url: 'https://example.com/kb' },
        { sku: 'HW-004', name: 'USB-C Hub', price: 45.00, stock: 0, category: 'Hardware', status: 'out_of_stock', url: 'https://example.com/hub' },
      ], null, 2),
    },
    finance: {
      label: 'Finance',
      json: JSON.stringify([
        { ticker: 'AAPL', company: 'Apple Inc', price: 178.72, change: 0.023, sector: 'Technology', pe_ratio: 28.4 },
        { ticker: 'GOOGL', company: 'Alphabet Inc', price: 141.80, change: -0.011, sector: 'Technology', pe_ratio: 25.1 },
        { ticker: 'JPM', company: 'JPMorgan Chase', price: 195.40, change: 0.008, sector: 'Finance', pe_ratio: 11.8 },
        { ticker: 'TSLA', company: 'Tesla Inc', price: 248.50, change: -0.032, sector: 'Automotive', pe_ratio: 62.3 },
      ], null, 2),
    },
  };

  let activePreset = $state('users');
  let jsonInput = $state(sampleDatasets.users.json);
  let parsedData = $state<Record<string, unknown>[]>([]);
  let parseError = $state('');
  let copied = $state(false);

  // Parse JSON on change
  $effect(() => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsedData = parsed;
        parseError = '';
      } else {
        parseError = 'Input must be a non-empty JSON array';
        parsedData = [];
      }
    } catch (e: unknown) {
      parseError = e instanceof Error ? e.message : 'Invalid JSON';
      parsedData = [];
    }
  });

  function loadPreset(key: string) {
    activePreset = key;
    jsonInput = sampleDatasets[key].json;
  }

  function copyUsageCode() {
    const code = `import { Table } from '@tablecraft/svelte';\n\n<Table data={yourData} />`;
    navigator.clipboard.writeText(code);
    copied = true;
    setTimeout(() => { copied = false; }, 2000);
  }

  // Derive inferred types from parsed data columns
  const inferredTypes = $derived.by(() => {
    if (parsedData.length === 0) return [];
    const keys = Object.keys(parsedData[0]);
    return keys.map(key => {
      const values = parsedData.map(r => r[key]);
      const type = guessType(key, values);
      return { key, type };
    });
  });

  function guessType(key: string, values: unknown[]): string {
    const k = key.toLowerCase();
    if (k.includes('email')) return 'email';
    if (k.includes('url') || k.includes('website') || k.includes('link')) return 'url';
    if (k.includes('phone') || k.includes('tel')) return 'phone';
    if (k.includes('avatar') || k.includes('image') || k.includes('photo')) return 'image';
    if (k.includes('status')) return 'status';
    if (k.includes('active') || k.includes('enabled') || k.includes('paid')) return 'boolean';
    if (k.includes('price') || k.includes('cost') || k.includes('salary') || k.includes('total')) return 'currency';
    if (k.includes('date') || k.includes('joined') || k.includes('created') || k.endsWith('_at')) return 'date';

    const sample = values.filter(v => v != null);
    if (sample.every(v => typeof v === 'boolean')) return 'boolean';
    if (sample.every(v => typeof v === 'number')) {
      if (sample.every(v => Number.isInteger(v as number))) return 'integer';
      if (sample.every(v => Math.abs(v as number) <= 1)) return 'percentage';
      return 'number';
    }
    return 'text';
  }
</script>

<section class="section" class:dark={darkMode}>
  <div class="section-inner">
    <div class="section-header">
      <div class="section-tag">Interactive</div>
      <h2 class="section-title">Live REPL Playground</h2>
      <p class="section-desc">
        Paste any JSON array and watch @tablecraft infer every column type instantly.
        No setup. No config. Just data in, table out.
      </p>
    </div>

    <div class="preset-bar">
      {#each Object.entries(sampleDatasets) as [key, ds]}
        <button
          class="preset-btn"
          class:active={activePreset === key}
          onclick={() => loadPreset(key)}
        >
          {ds.label}
        </button>
      {/each}
    </div>

    <div class="playground">
      <div class="editor-pane">
        <div class="pane-header">
          <span class="pane-title">JSON Data</span>
          <span class="pane-badge">{parsedData.length} rows</span>
        </div>
        <textarea
          class="json-editor"
          bind:value={jsonInput}
          spellcheck="false"
          placeholder="Paste a JSON array here..."
        ></textarea>
        {#if parseError}
          <div class="parse-error">{parseError}</div>
        {/if}
      </div>

      <div class="preview-pane">
        <div class="pane-header">
          <span class="pane-title">Live Preview</span>
          <button class="copy-btn" onclick={copyUsageCode}>
            {copied ? 'Copied!' : 'Copy usage code'}
          </button>
        </div>

        {#if parsedData.length > 0}
          <div class="table-wrap" class:dark={darkMode}>
            <Table data={parsedData} caption="REPL Preview" />
          </div>
        {:else}
          <div class="empty-preview">
            <div class="empty-icon">{'{ }'}</div>
            <div class="empty-text">Paste valid JSON to see your table</div>
          </div>
        {/if}
      </div>
    </div>

    {#if inferredTypes.length > 0}
      <div class="inference-bar">
        <span class="inference-label">Inferred types:</span>
        <div class="type-chips">
          {#each inferredTypes as col}
            <span class="type-chip">
              <span class="chip-key">{col.key}</span>
              <span class="chip-sep">&rarr;</span>
              <span class="chip-type">{col.type}</span>
            </span>
          {/each}
        </div>
      </div>
    {/if}

    <div class="usage-block">
      <div class="usage-header">That's it. Three lines to a working table:</div>
      <pre class="usage-code"><code><span class="hl-kw">import</span> {'{'} Table {'}'} <span class="hl-kw">from</span> <span class="hl-str">'@tablecraft/svelte'</span>;

<span class="hl-tag">&lt;Table</span> <span class="hl-attr">data</span>=<span class="hl-val">{'{'}</span><span class="hl-var">yourData</span><span class="hl-val">{'}'}</span> <span class="hl-tag">/&gt;</span></code></pre>
    </div>
  </div>
</section>

<style>
  .section {
    padding: 5rem 2rem;
    background: var(--bg-primary);
    border-top: 1px solid var(--border-color);
  }
  .section-inner { max-width: 1200px; margin: 0 auto; }
  .section-header { text-align: center; margin-bottom: 2rem; }
  .section-tag {
    display: inline-block; padding: 0.25rem 0.75rem;
    background: rgba(34, 197, 94, 0.15); color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 9999px;
    font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; margin-bottom: 1rem;
  }
  .section-title {
    font-size: clamp(1.75rem, 4vw, 2.75rem); font-weight: 800;
    letter-spacing: -0.03em; color: var(--text-primary);
    margin-bottom: 1rem; line-height: 1.1;
  }
  .section-desc {
    font-size: 1.0625rem; color: var(--text-secondary);
    max-width: 600px; margin: 0 auto; line-height: 1.6;
  }

  .preset-bar {
    display: flex; gap: 0.5rem; justify-content: center; margin-bottom: 1.5rem;
  }
  .preset-btn {
    padding: 0.375rem 1rem; border-radius: 0.5rem;
    background: var(--bg-secondary); border: 1px solid var(--border-color);
    color: var(--text-secondary); font-size: 0.875rem; font-weight: 500;
    cursor: pointer; transition: all 0.15s;
  }
  .preset-btn.active {
    background: rgba(10, 10, 10, 0.15); color: #0a0a0a;
    border-color: rgba(10, 10, 10, 0.4); font-weight: 600;
  }
  .preset-btn:not(.active):hover {
    background: var(--bg-hover); color: var(--text-primary);
  }

  .playground {
    display: grid; grid-template-columns: 1fr 1.5fr; gap: 1.5rem;
    margin-bottom: 1.5rem; min-height: 420px;
  }

  .editor-pane, .preview-pane {
    display: flex; flex-direction: column;
    background: var(--bg-secondary); border: 1px solid var(--border-color);
    border-radius: 0.75rem; overflow: hidden;
  }

  .pane-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color);
  }
  .pane-title {
    font-size: 0.8125rem; font-weight: 700; color: var(--text-primary);
    text-transform: uppercase; letter-spacing: 0.05em;
  }
  .pane-badge {
    font-size: 0.75rem; color: var(--text-muted);
    font-family: ui-monospace, monospace;
  }

  .json-editor {
    flex: 1; padding: 1rem; border: none; resize: none;
    background: transparent; color: var(--text-primary);
    font-family: ui-monospace, 'JetBrains Mono', Menlo, monospace;
    font-size: 0.8125rem; line-height: 1.6;
    outline: none; min-height: 350px;
  }
  .json-editor::placeholder { color: var(--text-muted); }

  .parse-error {
    padding: 0.5rem 1rem; background: rgba(239, 68, 68, 0.1);
    color: #f87171; font-size: 0.75rem; font-family: ui-monospace, monospace;
    border-top: 1px solid rgba(239, 68, 68, 0.2);
  }

  .copy-btn {
    padding: 0.25rem 0.75rem; border-radius: 0.375rem;
    background: rgba(10, 10, 10, 0.15); border: 1px solid rgba(10, 10, 10, 0.3);
    color: #0a0a0a; font-size: 0.75rem; font-weight: 600; cursor: pointer;
    transition: all 0.15s;
  }
  .copy-btn:hover { background: rgba(10, 10, 10, 0.25); }

  .table-wrap {
    flex: 1; overflow: auto; padding: 0.5rem;
  }
  .table-wrap.dark {
    --tc-color-text: #f1f5f9;
    --tc-color-bg: #0f172a;
    --tc-border-color: #1e293b;
    --tc-toolbar-bg: #0f172a;
    --tc-header-bg: #0a0e1a;
    --tc-header-border: #1e293b;
    --tc-color-bg-hover: #1e293b;
    --tc-color-selected-bg: #172554;
    --tc-color-muted: #64748b;
    --tc-footer-bg: #0a0e1a;
  }

  .empty-preview {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 0.75rem;
    color: var(--text-muted);
  }
  .empty-icon {
    font-size: 2rem; font-family: ui-monospace, monospace; opacity: 0.5;
  }
  .empty-text { font-size: 0.875rem; }

  .inference-bar {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.75rem 1rem; background: var(--bg-secondary);
    border: 1px solid var(--border-color); border-radius: 0.75rem;
    margin-bottom: 1.5rem; flex-wrap: wrap;
  }
  .inference-label {
    font-size: 0.75rem; font-weight: 700; color: var(--text-muted);
    text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap;
  }
  .type-chips { display: flex; flex-wrap: wrap; gap: 0.375rem; }
  .type-chip {
    display: inline-flex; align-items: center; gap: 0.25rem;
    padding: 0.125rem 0.5rem; border-radius: 0.25rem;
    background: rgba(10, 10, 10, 0.08); border: 1px solid rgba(10, 10, 10, 0.15);
    font-size: 0.6875rem; font-family: ui-monospace, monospace;
  }
  .chip-key { color: var(--text-secondary); }
  .chip-sep { color: var(--text-muted); }
  .chip-type { color: #0a0a0a; font-weight: 700; }

  .usage-block {
    text-align: center; padding: 2rem;
    background: var(--bg-secondary); border: 1px solid var(--border-color);
    border-radius: 0.75rem;
  }
  .usage-header {
    font-size: 1rem; font-weight: 600; color: var(--text-primary);
    margin-bottom: 1rem;
  }
  .usage-code {
    display: inline-block; text-align: left; padding: 1rem 1.5rem;
    background: rgba(15, 23, 42, 0.9); border-radius: 0.5rem;
    font-family: ui-monospace, 'JetBrains Mono', monospace;
    font-size: 0.875rem; line-height: 1.8; color: #e2e8f0;
    border: 1px solid rgba(10, 10, 10, 0.2);
  }
  .hl-kw { color: #525252; }
  .hl-str { color: #4ade80; }
  .hl-tag { color: #60a5fa; }
  .hl-attr { color: #f472b6; }
  .hl-val { color: #94a3b8; }
  .hl-var { color: #fbbf24; }

  @media (max-width: 800px) {
    .playground { grid-template-columns: 1fr; }
    .json-editor { min-height: 200px; }
  }
</style>
