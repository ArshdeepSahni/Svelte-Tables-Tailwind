<script lang="ts">
  interface Props {
    darkMode: boolean;
  }
  let { darkMode }: Props = $props();

  interface InferenceResult {
    key: string;
    type: string;
    confidence: number;
    color: string;
    reason: string;
    sample: string;
  }

  const examples: { name: string; json: string }[] = [
    {
      name: 'Users',
      json: JSON.stringify([
        { id: 1, name: 'Alice Johnson', email: 'alice@acme.com', salary: 95000, active: true, joined: '2023-01-15', avatar: 'https://i.pravatar.cc/32?img=1', score: 0.95 },
        { id: 2, name: 'Bob Martinez', email: 'bob@acme.com', salary: 110000, active: false, joined: '2022-06-01', avatar: 'https://i.pravatar.cc/32?img=2', score: 0.87 },
      ], null, 2),
    },
    {
      name: 'Products',
      json: JSON.stringify([
        { sku: 'P-001', name: 'Pro Dashboard', price: 299.99, quantity: 42, status: 'active', launched: '2024-01-01', url: 'https://example.com/p001', inStock: true },
        { sku: 'P-002', name: 'Analytics Suite', price: 149.50, quantity: 0, status: 'out_of_stock', launched: '2023-06-15', url: 'https://example.com/p002', inStock: false },
      ], null, 2),
    },
    {
      name: 'Financial',
      json: JSON.stringify([
        { date: '2024-03-15', ticker: 'AAPL', open: 172.50, close: 175.20, volume: 45000000, change: 0.0156, marketCap: 2700000000000 },
        { date: '2024-03-16', ticker: 'MSFT', open: 415.00, close: 420.35, volume: 22000000, change: 0.0129, marketCap: 3100000000000 },
      ], null, 2),
    },
  ];

  let jsonText = $state(examples[0].json);
  let selectedExample = $state(0);
  let inferenceResults = $state<InferenceResult[]>([]);
  let error = $state('');
  let isInferring = $state(false);

  function inferType(key: string, values: unknown[]): InferenceResult {
    const nonNull = values.filter(v => v !== null && v !== undefined);
    const sample = String(nonNull[0] ?? '');

    // Email pattern
    if (nonNull.every(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)))) {
      return { key, type: 'email', confidence: 0.99, color: '#ec4899', reason: 'All values match email regex pattern', sample };
    }

    // URL pattern
    if (nonNull.every(v => /^https?:\/\/.+\..+/.test(String(v)))) {
      return { key, type: 'url', confidence: 0.97, color: '#f43f5e', reason: 'All values are valid URLs', sample };
    }

    // Boolean
    if (nonNull.every(v => typeof v === 'boolean')) {
      return { key, type: 'boolean', confidence: 0.99, color: '#22c55e', reason: 'All values are booleans', sample };
    }

    // ISO date (datetime)
    if (nonNull.every(v => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(String(v)))) {
      return { key, type: 'datetime', confidence: 0.97, color: '#06b6d4', reason: 'All values match ISO 8601 datetime format', sample };
    }

    // ISO date (date only)
    if (nonNull.every(v => /^\d{4}-\d{2}-\d{2}$/.test(String(v)))) {
      return { key, type: 'date', confidence: 0.97, color: '#14b8a6', reason: 'All values match ISO 8601 date format (YYYY-MM-DD)', sample };
    }

    // Image URL
    if (nonNull.every(v => /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i.test(String(v)) || /pravatar|unsplash|i\.imgur/.test(String(v)))) {
      return { key, type: 'image', confidence: 0.88, color: '#f59e0b', reason: 'URLs match common image patterns', sample };
    }

    // Number types
    if (nonNull.every(v => typeof v === 'number' && !isNaN(v))) {
      const nums = nonNull as number[];
      const allInts = nums.every(n => Number.isInteger(n));
      const allFrac = nums.every(n => n > 0 && n <= 1);
      const bigNums = nums.some(n => Math.abs(n) > 1000);

      if (allFrac && !bigNums) {
        return { key, type: 'percentage', confidence: 0.85, color: '#c4b5fd', reason: 'All values between 0-1, likely percentage fractions', sample };
      }
      if (allInts) {
        return { key, type: 'integer', confidence: 0.98, color: '#0a0a0a', reason: 'All values are whole integers', sample };
      }
      // Heuristic: key contains price/cost/salary/amount/fee
      if (/price|cost|salary|amount|fee|revenue|total|pay/.test(key.toLowerCase())) {
        return { key, type: 'currency', confidence: 0.91, color: '#a78bfa', reason: `Key name "${key}" suggests currency, values are decimal numbers`, sample };
      }
      return { key, type: 'number', confidence: 0.95, color: '#0a0a0a', reason: 'All values are numbers', sample };
    }

    // Status / badge (low cardinality strings)
    if (nonNull.every(v => typeof v === 'string')) {
      const strs = nonNull as string[];
      const unique = new Set(strs).size;
      if (/status|state|phase|stage|tier/.test(key.toLowerCase()) || (unique <= 5 && strs.length > 1)) {
        const typeChoice = /status|state/.test(key.toLowerCase()) ? 'status' : 'badge';
        return { key, type: typeChoice, confidence: 0.82, color: typeChoice === 'status' ? '#34d399' : '#fbbf24', reason: `Low cardinality (${unique} unique values) — enum-like field`, sample };
      }
      // Code/ID pattern
      if (/^[A-Z]+-\d+$|^[A-Z]{2,}-\d+$/.test(sample) || /id|sku|code|ref|ticket/.test(key.toLowerCase())) {
        return { key, type: 'code', confidence: 0.87, color: '#0a0a0a', reason: 'Matches code/ID pattern or key name indicates identifier', sample };
      }
    }

    return { key, type: 'text', confidence: 0.7, color: '#64748b', reason: 'No specific pattern detected — fallback to plain text', sample };
  }

  function runInference() {
    error = '';
    inferenceResults = [];

    let parsed: unknown[];
    try {
      parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        error = 'Input must be a non-empty JSON array of objects.';
        return;
      }
    } catch (e) {
      error = 'Invalid JSON. Please check your input.';
      return;
    }

    isInferring = true;

    // Simulate the requestIdleCallback timing
    setTimeout(() => {
      const keys = Object.keys(parsed[0] as Record<string, unknown>);
      inferenceResults = keys.map(key => {
        const values = (parsed as Record<string, unknown>[]).map(row => row[key]);
        return inferType(key, values);
      });
      isInferring = false;
    }, 400);
  }

  function loadExample(idx: number) {
    selectedExample = idx;
    jsonText = examples[idx].json;
    inferenceResults = [];
    error = '';
  }

  // Auto-run on initial load
  $effect(() => {
    if (jsonText && inferenceResults.length === 0) {
      runInference();
    }
  });

  const typeColors: Record<string, string> = {
    text: '#64748b', number: '#0a0a0a', integer: '#0a0a0a',
    currency: '#a78bfa', percentage: '#c4b5fd', boolean: '#22c55e',
    date: '#14b8a6', datetime: '#06b6d4', time: '#38bdf8',
    email: '#ec4899', url: '#f43f5e', phone: '#fb7185',
    image: '#f59e0b', badge: '#fbbf24', status: '#34d399',
    code: '#0a0a0a', html: '#dc2626',
  };
</script>

<section class="section" class:dark={darkMode} id="inference">
  <div class="section-inner">
    <div class="section-header">
      <div class="section-tag">Type Inference</div>
      <h2 class="section-title">Paste Your JSON. Watch It Infer.</h2>
      <p class="section-desc">
        The same engine that powers @tablecraft — runs in your browser, no server calls.
        Confidence scores show certainty of each inference.
      </p>
    </div>

    <div class="demo-layout">
      <div class="input-panel">
        <div class="input-header">
          <span class="panel-label">JSON Array Input</span>
          <div class="example-tabs">
            {#each examples as ex, i}
              <button
                class="ex-tab"
                class:active={selectedExample === i}
                onclick={() => loadExample(i)}
              >
                {ex.name}
              </button>
            {/each}
          </div>
        </div>

        <textarea
          class="json-input"
          bind:value={jsonText}
          placeholder="Paste any JSON array here..."
          spellcheck="false"
          rows="18"
        ></textarea>

        {#if error}
          <div class="error-msg">{error}</div>
        {/if}

        <button class="infer-btn" onclick={runInference} disabled={isInferring}>
          {isInferring ? 'Inferring...' : 'Run Inference Engine'}
        </button>
      </div>

      <div class="results-panel">
        <div class="results-header">
          <span class="panel-label">Inference Results</span>
          {#if inferenceResults.length > 0}
            <span class="results-count">{inferenceResults.length} columns analyzed</span>
          {/if}
        </div>

        {#if isInferring}
          <div class="inferring-state">
            <div class="spinner"></div>
            <span>Running inference engine via requestIdleCallback...</span>
          </div>
        {:else if inferenceResults.length > 0}
          <div class="results-list">
            {#each inferenceResults as result}
              <div class="result-item" style="--result-color: {result.color}">
                <div class="result-header-row">
                  <code class="result-key">{result.key}</code>
                  <div class="result-type-badge" style="background: {result.color}22; color: {result.color}; border-color: {result.color}44">
                    {result.type}
                  </div>
                </div>

                <div class="confidence-row">
                  <div class="conf-track">
                    <div
                      class="conf-fill"
                      style="width: {result.confidence * 100}%; background: {result.color};"
                    ></div>
                  </div>
                  <span class="conf-pct">{Math.round(result.confidence * 100)}%</span>
                </div>

                <div class="result-reason">{result.reason}</div>
                <div class="result-sample">
                  Sample: <code>{result.sample.length > 40 ? result.sample.slice(0, 40) + '...' : result.sample}</code>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="empty-results">
            Click "Run Inference Engine" to analyze your data
          </div>
        {/if}
      </div>
    </div>
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
    background: rgba(6, 182, 212, 0.15);
    color: #67e8f9;
    border: 1px solid rgba(6, 182, 212, 0.3);
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
    max-width: 580px;
    margin: 0 auto;
    line-height: 1.6;
  }

  .demo-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  @media (max-width: 860px) { .demo-layout { grid-template-columns: 1fr; } }

  .input-panel, .results-panel {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 0.875rem;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .input-header, .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-color);
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .panel-label {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .results-count {
    font-size: 0.75rem;
    color: #4ade80;
    font-weight: 600;
  }

  .example-tabs {
    display: flex;
    gap: 2px;
    background: var(--bg-secondary);
    border-radius: 0.375rem;
    padding: 2px;
    border: 1px solid var(--border-color);
  }

  .ex-tab {
    padding: 0.25rem 0.625rem;
    border: none;
    border-radius: 0.3125rem;
    background: transparent;
    color: var(--text-muted);
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.1s;
  }
  .ex-tab.active { background: #0a0a0a; color: white; }
  .ex-tab:not(.active):hover { color: var(--text-primary); }

  .json-input {
    flex: 1;
    padding: 1rem;
    background: #0a0e1a;
    color: #a5f3fc;
    border: none;
    font-family: ui-monospace, 'JetBrains Mono', monospace;
    font-size: 0.8125rem;
    line-height: 1.6;
    resize: none;
    outline: none;
  }
  .json-input::placeholder { color: #334155; }

  .error-msg {
    padding: 0.625rem 1rem;
    background: rgba(248, 113, 113, 0.1);
    border-top: 1px solid rgba(248, 113, 113, 0.2);
    color: #fca5a5;
    font-size: 0.8125rem;
    font-weight: 500;
  }

  .infer-btn {
    margin: 0.75rem;
    padding: 0.625rem 1.25rem;
    background: #0a0a0a;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
    letter-spacing: 0.01em;
  }
  .infer-btn:hover:not(:disabled) { background: #0a0a0a; }
  .infer-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .inferring-state {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 2rem 1rem;
    color: var(--text-muted);
    font-size: 0.875rem;
    justify-content: center;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--border-color);
    border-top-color: #0a0a0a;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .results-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    overflow-y: auto;
    flex: 1;
  }

  .result-item {
    padding: 0.875rem 1rem;
    border-bottom: 1px solid var(--border-color);
    transition: background 0.1s;
  }
  .result-item:hover { background: rgba(10, 10, 10, 0.04); }
  .result-item:last-child { border-bottom: none; }

  .result-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    gap: 0.5rem;
  }

  .result-key {
    font-family: ui-monospace, monospace;
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .result-type-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.15rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.6875rem;
    font-weight: 700;
    font-family: ui-monospace, monospace;
    border: 1px solid;
    white-space: nowrap;
  }

  .confidence-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.375rem;
  }

  .conf-track {
    flex: 1;
    height: 4px;
    background: var(--bg-primary);
    border-radius: 9999px;
    overflow: hidden;
  }

  .conf-fill {
    height: 100%;
    border-radius: 9999px;
    transition: width 0.4s ease;
  }

  .conf-pct {
    font-size: 0.6875rem;
    font-weight: 700;
    color: var(--result-color);
    min-width: 30px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .result-reason {
    font-size: 0.75rem;
    color: var(--text-muted);
    line-height: 1.4;
    margin-bottom: 0.25rem;
  }

  .result-sample {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .result-sample code {
    font-family: ui-monospace, monospace;
    color: var(--text-secondary);
    font-size: 0.6875rem;
  }

  .empty-results {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: 3rem 1rem;
    color: var(--text-muted);
    font-size: 0.9375rem;
    text-align: center;
  }

  @media (max-width: 640px) { .section { padding: 3rem 1rem; } }
</style>
