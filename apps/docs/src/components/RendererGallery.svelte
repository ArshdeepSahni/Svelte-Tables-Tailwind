<script lang="ts">
  interface Props {
    darkMode: boolean;
  }
  let { darkMode }: Props = $props();

  interface RendererInfo {
    name: string;
    type: string;
    inputType: string;
    output: string;
    example: { input: string; display: string; kind: string };
    descriptor: Record<string, unknown>;
    color: string;
  }

  const renderers: RendererInfo[] = [
    {
      name: 'Text', type: 'text', inputType: 'string | any',
      output: 'Plain string span',
      example: { input: '"Hello World"', display: 'Hello World', kind: 'text' },
      descriptor: { kind: 'text', value: 'Hello World' },
      color: '#64748b',
    },
    {
      name: 'Number', type: 'number', inputType: 'number',
      output: 'Locale-formatted number',
      example: { input: '1234567.89', display: '1,234,567.89', kind: 'number' },
      descriptor: { kind: 'number', value: 1234567.89, formatted: '1,234,567.89' },
      color: '#0a0a0a',
    },
    {
      name: 'Integer', type: 'integer', inputType: 'number (whole)',
      output: 'Integer without decimals',
      example: { input: '42', display: '42', kind: 'integer' },
      descriptor: { kind: 'number', value: 42, formatted: '42' },
      color: '#0a0a0a',
    },
    {
      name: 'Currency', type: 'currency', inputType: 'number',
      output: 'Locale currency with symbol',
      example: { input: '9999.99', display: '$9,999.99', kind: 'currency' },
      descriptor: { kind: 'number', value: 9999.99, formatted: '$9,999.99' },
      color: '#a78bfa',
    },
    {
      name: 'Percentage', type: 'percentage', inputType: 'number (0-1 or 0-100)',
      output: 'Formatted as N%',
      example: { input: '0.87', display: '87%', kind: 'percentage' },
      descriptor: { kind: 'number', value: 0.87, formatted: '87%' },
      color: '#c4b5fd',
    },
    {
      name: 'Boolean', type: 'boolean', inputType: 'boolean | "true" | "false"',
      output: 'Checkmark or cross icon',
      example: { input: 'true', display: '✓', kind: 'boolean' },
      descriptor: { kind: 'boolean', value: true },
      color: '#22c55e',
    },
    {
      name: 'Date', type: 'date', inputType: 'ISO 8601 date string',
      output: 'Locale date string',
      example: { input: '"2024-03-15"', display: 'Mar 15, 2024', kind: 'date' },
      descriptor: { kind: 'text', value: 'Mar 15, 2024' },
      color: '#14b8a6',
    },
    {
      name: 'DateTime', type: 'datetime', inputType: 'ISO 8601 datetime',
      output: 'Locale date + time',
      example: { input: '"2024-03-15T10:30:00Z"', display: 'Mar 15, 2024, 10:30 AM', kind: 'datetime' },
      descriptor: { kind: 'text', value: 'Mar 15, 2024, 10:30 AM' },
      color: '#06b6d4',
    },
    {
      name: 'Time', type: 'time', inputType: 'HH:mm or HH:mm:ss',
      output: 'Locale time display',
      example: { input: '"14:30:00"', display: '2:30 PM', kind: 'time' },
      descriptor: { kind: 'text', value: '2:30 PM' },
      color: '#38bdf8',
    },
    {
      name: 'Email', type: 'email', inputType: 'email string',
      output: 'mailto: anchor link',
      example: { input: '"alice@acme.com"', display: 'alice@acme.com', kind: 'email' },
      descriptor: { kind: 'link', href: 'mailto:alice@acme.com', label: 'alice@acme.com', external: false },
      color: '#ec4899',
    },
    {
      name: 'URL', type: 'url', inputType: 'URL string',
      output: 'Anchor with external icon',
      example: { input: '"https://tablecraft.dev"', display: 'tablecraft.dev', kind: 'url' },
      descriptor: { kind: 'link', href: 'https://tablecraft.dev', label: 'tablecraft.dev', external: true },
      color: '#f43f5e',
    },
    {
      name: 'Phone', type: 'phone', inputType: 'phone number string',
      output: 'tel: anchor link',
      example: { input: '"+1-555-0100"', display: '+1-555-0100', kind: 'phone' },
      descriptor: { kind: 'link', href: 'tel:+15550100', label: '+1-555-0100', external: false },
      color: '#fb7185',
    },
    {
      name: 'Image', type: 'image', inputType: 'URL string (image)',
      output: '<img> with lazy loading',
      example: { input: '"https://i.pravatar.cc/32"', display: '[avatar]', kind: 'image' },
      descriptor: { kind: 'image', src: 'https://i.pravatar.cc/32', alt: 'Image' },
      color: '#f59e0b',
    },
    {
      name: 'Badge', type: 'badge', inputType: 'enum string',
      output: 'Colored pill tag',
      example: { input: '"Admin"', display: 'Admin', kind: 'badge' },
      descriptor: { kind: 'badge', label: 'Admin', variant: 'info' },
      color: '#fbbf24',
    },
    {
      name: 'Status', type: 'status', inputType: 'enum string',
      output: 'Status dot + label',
      example: { input: '"active"', display: 'active', kind: 'status' },
      descriptor: { kind: 'status', label: 'active', variant: 'success' },
      color: '#34d399',
    },
    {
      name: 'Code', type: 'code', inputType: 'string (code/ID)',
      output: 'Monospace <code> block',
      example: { input: '"ORD-9001"', display: 'ORD-9001', kind: 'code' },
      descriptor: { kind: 'code', value: 'ORD-9001' },
      color: '#0a0a0a',
    },
    {
      name: 'HTML', type: 'html', inputType: 'HTML string (opt-in)',
      output: 'DOMPurify-sanitized HTML',
      example: { input: '"<b>Bold</b>"', display: 'Bold', kind: 'html' },
      descriptor: { kind: 'html', sanitized: '<b>Bold</b>' },
      color: '#dc2626',
    },
  ];

  let selectedRenderer = $state<RendererInfo | null>(null);
  let showDescriptor = $state(false);

  function getDisplayEl(r: RendererInfo): string {
    switch (r.example.kind) {
      case 'boolean': return r.example.input === 'true' ? '✓' : '✗';
      default: return r.example.display;
    }
  }
</script>

<section class="section" class:dark={darkMode} id="renderers">
  <div class="section-inner">
    <div class="section-header">
      <div class="section-tag">Cell Renderers</div>
      <h2 class="section-title">All 17 Tier 1 Renderers</h2>
      <p class="section-desc">
        Every renderer auto-detected by the inference engine. Click any card to see the CellDescriptor it produces.
      </p>
    </div>

    <div class="renderers-grid">
      {#each renderers as renderer}
        <button
          class="renderer-card"
          class:selected={selectedRenderer?.type === renderer.type}
          onclick={() => {
            selectedRenderer = selectedRenderer?.type === renderer.type ? null : renderer;
            showDescriptor = false;
          }}
          style="--r-color: {renderer.color}"
        >
          <div class="renderer-card-top">
            <div class="renderer-type-badge" style="background: {renderer.color}22; color: {renderer.color}; border-color: {renderer.color}44">
              {renderer.type}
            </div>
          </div>
          <div class="renderer-name">{renderer.name}</div>
          <div class="renderer-input">{renderer.inputType}</div>
          <div class="renderer-preview">
            <span class="preview-input">{renderer.example.input}</span>
            <span class="preview-arrow">→</span>
            <span
              class="preview-output"
              class:preview-bool-true={renderer.example.kind === 'boolean' && renderer.example.input === 'true'}
              class:preview-bool-false={renderer.example.kind === 'boolean' && renderer.example.input === 'false'}
              class:preview-link={renderer.example.kind === 'email' || renderer.example.kind === 'url' || renderer.example.kind === 'phone'}
              class:preview-badge={renderer.example.kind === 'badge'}
              class:preview-status={renderer.example.kind === 'status'}
              class:preview-code={renderer.example.kind === 'code'}
              class:preview-number={renderer.example.kind === 'number' || renderer.example.kind === 'integer' || renderer.example.kind === 'currency' || renderer.example.kind === 'percentage'}
            >
              {getDisplayEl(renderer)}
            </span>
          </div>
        </button>
      {/each}
    </div>

    {#if selectedRenderer}
      <div class="renderer-detail">
        <div class="detail-header">
          <div>
            <span class="detail-type-tag" style="background: {selectedRenderer.color}22; color: {selectedRenderer.color}; border: 1px solid {selectedRenderer.color}44">
              {selectedRenderer.type}
            </span>
            <h3 class="detail-name">{selectedRenderer.name} Renderer</h3>
          </div>
          <button class="descriptor-toggle" onclick={() => { showDescriptor = !showDescriptor; }}>
            {showDescriptor ? 'Hide' : 'View'} CellDescriptor
          </button>
        </div>

        <div class="detail-grid">
          <div class="detail-row">
            <span class="detail-label">Input type</span>
            <code class="detail-value">{selectedRenderer.inputType}</code>
          </div>
          <div class="detail-row">
            <span class="detail-label">Output</span>
            <span class="detail-value">{selectedRenderer.output}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Example input</span>
            <code class="detail-value">{selectedRenderer.example.input}</code>
          </div>
          <div class="detail-row">
            <span class="detail-label">Renders as</span>
            <span class="detail-value">{selectedRenderer.example.display}</span>
          </div>
        </div>

        {#if showDescriptor}
          <div class="descriptor-block">
            <div class="descriptor-title">CellDescriptor returned by this renderer:</div>
            <pre class="descriptor-code">{JSON.stringify(selectedRenderer.descriptor, null, 2)}</pre>
          </div>
        {/if}
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
    background: rgba(236, 72, 153, 0.15);
    color: #f472b6;
    border: 1px solid rgba(236, 72, 153, 0.3);
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

  .renderers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.875rem;
    margin-bottom: 1.5rem;
  }

  .renderer-card {
    padding: 1rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-left: 3px solid var(--r-color);
    border-radius: 0.75rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.15s;
  }

  .renderer-card:hover {
    border-color: var(--r-color);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  }

  .renderer-card.selected {
    border-color: var(--r-color);
    background: rgba(var(--r-color), 0.05);
    box-shadow: 0 0 0 2px var(--r-color);
  }

  .renderer-card-top { margin-bottom: 0.5rem; }

  .renderer-type-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.2rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.6875rem;
    font-weight: 700;
    font-family: ui-monospace, monospace;
    border: 1px solid;
    letter-spacing: 0.03em;
  }

  .renderer-name {
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
  }

  .renderer-input {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-family: ui-monospace, monospace;
    margin-bottom: 0.625rem;
    line-height: 1.4;
  }

  .renderer-preview {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8125rem;
    flex-wrap: wrap;
  }

  .preview-input {
    color: var(--text-muted);
    font-family: ui-monospace, monospace;
    font-size: 0.75rem;
  }

  .preview-arrow { color: var(--text-muted); }

  .preview-output {
    font-weight: 600;
    color: var(--text-primary);
  }

  .preview-bool-true {
    color: #22c55e;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    background: rgba(34, 197, 94, 0.15);
    border-radius: 50%;
    font-size: 0.75rem;
  }

  .preview-link { color: #0a0a0a; text-decoration: underline; }

  .preview-badge {
    padding: 0.15rem 0.45rem;
    background: rgba(10, 10, 10, 0.15);
    color: #0a0a0a;
    border-radius: 9999px;
    font-size: 0.6875rem;
    font-weight: 700;
    border: 1px solid rgba(10, 10, 10, 0.3);
  }

  .preview-status {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.15rem 0.45rem 0.15rem 0.35rem;
    background: rgba(34, 197, 94, 0.1);
    color: #22c55e;
    border-radius: 9999px;
    font-size: 0.6875rem;
    font-weight: 700;
    border: 1px solid rgba(34, 197, 94, 0.25);
  }
  .preview-status::before {
    content: '';
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #22c55e;
  }

  .preview-code {
    font-family: ui-monospace, monospace;
    background: rgba(124, 58, 237, 0.1);
    color: #a78bfa;
    padding: 0.1em 0.35em;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    border: 1px solid rgba(124, 58, 237, 0.2);
  }

  .preview-number {
    font-variant-numeric: tabular-nums;
    text-align: right;
    font-weight: 600;
  }

  .renderer-detail {
    padding: 1.5rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    animation: slideIn 0.2s ease;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .detail-type-tag {
    display: inline-flex;
    padding: 0.2rem 0.6rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 700;
    font-family: ui-monospace, monospace;
    margin-bottom: 0.375rem;
  }

  .detail-name {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.02em;
  }

  .descriptor-toggle {
    padding: 0.4rem 0.875rem;
    background: var(--bg-primary);
    color: var(--text-muted);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .descriptor-toggle:hover { color: var(--text-primary); border-color: #0a0a0a; }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .detail-row {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
  }

  .detail-label {
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .detail-value {
    font-size: 0.9375rem;
    color: var(--text-primary);
    font-weight: 500;
  }

  code.detail-value {
    font-family: ui-monospace, monospace;
    font-size: 0.875rem;
    color: #0a0a0a;
  }

  .descriptor-block {
    margin-top: 1rem;
    animation: slideIn 0.15s ease;
  }

  .descriptor-title {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--text-muted);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .descriptor-code {
    background: #0a0e1a;
    color: #a5f3fc;
    font-family: ui-monospace, 'JetBrains Mono', monospace;
    font-size: 0.875rem;
    padding: 1rem 1.25rem;
    border-radius: 0.625rem;
    border: 1px solid rgba(10, 10, 10, 0.2);
    overflow-x: auto;
    line-height: 1.6;
  }

  @media (max-width: 640px) {
    .section { padding: 3rem 1rem; }
    .renderers-grid { grid-template-columns: repeat(2, 1fr); }
  }
</style>
