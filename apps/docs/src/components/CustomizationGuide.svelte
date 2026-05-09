<script lang="ts">
  import { Table } from '@tablecraft/svelte';

  interface Props {
    darkMode: boolean;
  }
  let { darkMode }: Props = $props();

  // Theme editor state
  let bgColor = $state('#ffffff');
  let textColor = $state('#0a0a0a');
  let borderColor = $state('#f0f0f0');
  let accentColor = $state('#0a0a0a');
  let headerColor = $state('#737373');
  let hoverBg = $state('#fafafa');
  let rowHeight = $state(44);
  let fontSize = $state(14);
  let borderRadius = $state(8);
  let copied = $state(false);

  const sampleData = [
    { name: 'Alice Johnson', email: 'alice@acme.com', role: 'Admin', active: true, salary: 95000 },
    { name: 'Bob Martinez', email: 'bob@corp.io', role: 'Engineer', active: true, salary: 110000 },
    { name: 'Carol White', email: 'carol@startup.co', role: 'Designer', active: false, salary: 88000 },
    { name: 'David Kim', email: 'david@team.dev', role: 'Manager', active: true, salary: 130000 },
  ];

  const cssOutput = $derived(`.my-table {
  --tc-color-bg: ${bgColor};
  --tc-color-text: ${textColor};
  --tc-color-border: ${borderColor};
  --tc-color-accent: ${accentColor};
  --tc-color-text-header: ${headerColor};
  --tc-color-bg-row-hover: ${hoverBg};
  --tc-row-height: ${rowHeight}px;
  --tc-font-size: ${fontSize}px;
  --tc-border-radius: ${borderRadius}px;
}`);

  function copyCss() {
    navigator.clipboard.writeText(cssOutput);
    copied = true;
    setTimeout(() => { copied = false; }, 2000);
  }

  const presets = [
    { name: 'Default', bg: '#ffffff', text: '#0a0a0a', border: '#f0f0f0', accent: '#0a0a0a', header: '#737373', hover: '#fafafa' },
    { name: 'Midnight', bg: '#0f172a', text: '#e2e8f0', border: '#1e293b', accent: '#0a0a0a', header: '#64748b', hover: '#1e293b' },
    { name: 'Forest', bg: '#fafdf7', text: '#1a2e1a', border: '#e8f0e0', accent: '#2d6a2e', header: '#5a7a5a', hover: '#f0f7ec' },
    { name: 'Warm', bg: '#fef9f3', text: '#3d2b1f', border: '#f0e6d8', accent: '#c2742f', header: '#8a7060', hover: '#fdf3e8' },
  ];

  function applyPreset(p: typeof presets[0]) {
    bgColor = p.bg; textColor = p.text; borderColor = p.border;
    accentColor = p.accent; headerColor = p.header; hoverBg = p.hover;
  }

  const tokenGroups = [
    {
      title: 'Colors',
      tokens: [
        '--tc-color-bg', '--tc-color-text', '--tc-color-text-secondary',
        '--tc-color-text-muted', '--tc-color-text-header', '--tc-color-border',
        '--tc-color-accent', '--tc-color-bg-row-hover', '--tc-color-bg-row-selected',
        '--tc-color-bg-row-striped', '--tc-color-success', '--tc-color-warning',
        '--tc-color-danger', '--tc-color-info',
      ],
    },
    {
      title: 'Typography',
      tokens: [
        '--tc-font-family', '--tc-font-family-mono', '--tc-font-size',
        '--tc-font-size-sm', '--tc-font-size-xs', '--tc-font-size-header',
        '--tc-font-weight-normal', '--tc-font-weight-medium', '--tc-font-weight-bold',
        '--tc-letter-spacing-header',
      ],
    },
    {
      title: 'Spacing',
      tokens: [
        '--tc-row-height', '--tc-cell-padding-x', '--tc-cell-padding-y',
        '--tc-header-padding-x', '--tc-header-padding-y', '--tc-toolbar-padding',
        '--tc-footer-padding', '--tc-border-radius', '--tc-border-width',
      ],
    },
    {
      title: 'Effects',
      tokens: [
        '--tc-shadow-wrapper', '--tc-shadow-pin', '--tc-shadow-drag',
        '--tc-shadow-action-bar', '--tc-transition-row', '--tc-transition-btn',
        '--tc-transition-sort',
      ],
    },
  ];
</script>

<section class="section" class:dark={darkMode}>
  <div class="section-inner">
    <div class="section-header">
      <div class="section-tag">Theming</div>
      <h2 class="section-title">Complete Visual Customization</h2>
      <p class="section-desc">
        60+ CSS custom properties give you total control over every visual detail.
        Tweak the sliders below and copy the generated CSS.
      </p>
    </div>

    <div class="editor-layout">
      <div class="controls-panel">
        <div class="controls-header">
          <span class="controls-title">Theme Editor</span>
        </div>

        <div class="presets">
          {#each presets as preset}
            <button class="preset-btn" onclick={() => applyPreset(preset)}>
              <span class="preset-swatch" style="background: {preset.bg}; border: 1px solid {preset.border};">
                <span style="color: {preset.accent}; font-weight: 900;">A</span>
              </span>
              {preset.name}
            </button>
          {/each}
        </div>

        <div class="control-group">
          <label class="control-label">Background
            <input type="color" bind:value={bgColor} />
          </label>
          <label class="control-label">Text
            <input type="color" bind:value={textColor} />
          </label>
          <label class="control-label">Border
            <input type="color" bind:value={borderColor} />
          </label>
          <label class="control-label">Accent
            <input type="color" bind:value={accentColor} />
          </label>
          <label class="control-label">Header text
            <input type="color" bind:value={headerColor} />
          </label>
          <label class="control-label">Row hover
            <input type="color" bind:value={hoverBg} />
          </label>
        </div>

        <div class="range-group">
          <label class="range-label">
            Row height: {rowHeight}px
            <input type="range" min="28" max="72" bind:value={rowHeight} />
          </label>
          <label class="range-label">
            Font size: {fontSize}px
            <input type="range" min="11" max="18" bind:value={fontSize} />
          </label>
          <label class="range-label">
            Border radius: {borderRadius}px
            <input type="range" min="0" max="16" bind:value={borderRadius} />
          </label>
        </div>

        <div class="css-output">
          <div class="css-header">
            <span>Generated CSS</span>
            <button class="copy-btn" onclick={copyCss}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre class="css-code"><code>{cssOutput}</code></pre>
        </div>
      </div>

      <div class="preview-panel">
        <div class="preview-header">Live Preview</div>
        <div
          class="preview-table"
          style="
            --tc-color-bg: {bgColor};
            --tc-color-text: {textColor};
            --tc-color-border: {borderColor};
            --tc-color-accent: {accentColor};
            --tc-color-text-header: {headerColor};
            --tc-color-bg-row-hover: {hoverBg};
            --tc-row-height: {rowHeight}px;
            --tc-font-size: {fontSize}px;
            --tc-border-radius: {borderRadius}px;
          "
        >
          <Table data={sampleData} caption="Theme Preview" />
        </div>
      </div>
    </div>

    <div class="tokens-reference">
      <h3 class="tokens-title">Complete Token Reference</h3>
      <p class="tokens-desc">All available CSS custom properties grouped by category.</p>
      <div class="token-groups">
        {#each tokenGroups as group}
          <div class="token-group">
            <div class="token-group-title">{group.title}</div>
            <div class="token-list">
              {#each group.tokens as token}
                <code class="token-name">{token}</code>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>

<style>
  .section {
    padding: 5rem 2rem; background: var(--bg-primary);
    border-top: 1px solid var(--border-color);
  }
  .section-inner { max-width: 1200px; margin: 0 auto; }
  .section-header { text-align: center; margin-bottom: 3rem; }
  .section-tag {
    display: inline-block; padding: 0.25rem 0.75rem;
    background: rgba(236, 72, 153, 0.15); color: #f472b6;
    border: 1px solid rgba(236, 72, 153, 0.3); border-radius: 9999px;
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

  .editor-layout {
    display: grid; grid-template-columns: 340px 1fr; gap: 1.5rem;
    margin-bottom: 3rem;
  }

  .controls-panel {
    background: var(--bg-secondary); border: 1px solid var(--border-color);
    border-radius: 0.75rem; overflow: hidden;
  }
  .controls-header {
    padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color);
  }
  .controls-title {
    font-size: 0.8125rem; font-weight: 700; color: var(--text-primary);
    text-transform: uppercase; letter-spacing: 0.05em;
  }

  .presets {
    display: flex; gap: 0.375rem; padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border-color); flex-wrap: wrap;
  }
  .preset-btn {
    display: flex; align-items: center; gap: 0.375rem;
    padding: 0.25rem 0.625rem; border-radius: 0.375rem;
    background: var(--bg-primary); border: 1px solid var(--border-color);
    color: var(--text-secondary); font-size: 0.75rem; font-weight: 500;
    cursor: pointer; transition: all 0.15s;
  }
  .preset-btn:hover { border-color: rgba(10, 10, 10, 0.3); color: var(--text-primary); }
  .preset-swatch {
    width: 20px; height: 20px; border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.625rem;
  }

  .control-group {
    display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;
    padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color);
  }
  .control-label {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 0.75rem; color: var(--text-secondary); gap: 0.5rem;
  }
  .control-label input[type="color"] {
    width: 28px; height: 22px; border: 1px solid var(--border-color);
    border-radius: 4px; cursor: pointer; padding: 0;
  }

  .range-group {
    display: flex; flex-direction: column; gap: 0.625rem;
    padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color);
  }
  .range-label {
    display: flex; flex-direction: column; gap: 0.25rem;
    font-size: 0.75rem; color: var(--text-secondary);
  }
  .range-label input[type="range"] {
    width: 100%; height: 4px; accent-color: #0a0a0a;
  }

  .css-output { padding: 0.75rem 1rem; }
  .css-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 0.5rem;
    font-size: 0.6875rem; font-weight: 700; color: var(--text-muted);
    text-transform: uppercase; letter-spacing: 0.05em;
  }
  .copy-btn {
    padding: 0.2rem 0.5rem; border-radius: 0.25rem;
    background: rgba(10, 10, 10, 0.1); border: 1px solid rgba(10, 10, 10, 0.2);
    color: #0a0a0a; font-size: 0.6875rem; font-weight: 600; cursor: pointer;
  }
  .css-code {
    padding: 0.75rem; border-radius: 0.5rem;
    background: rgba(15, 23, 42, 0.85); color: #525252;
    font-family: ui-monospace, monospace; font-size: 0.6875rem;
    line-height: 1.7; overflow-x: auto; white-space: pre;
    border: 1px solid rgba(10, 10, 10, 0.15);
  }

  .preview-panel {
    background: var(--bg-secondary); border: 1px solid var(--border-color);
    border-radius: 0.75rem; overflow: hidden;
  }
  .preview-header {
    padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color);
    font-size: 0.8125rem; font-weight: 700; color: var(--text-primary);
    text-transform: uppercase; letter-spacing: 0.05em;
  }
  .preview-table { padding: 1rem; }

  .tokens-reference {
    background: var(--bg-secondary); border: 1px solid var(--border-color);
    border-radius: 0.75rem; padding: 2rem;
  }
  .tokens-title {
    font-size: 1.25rem; font-weight: 700; color: var(--text-primary);
    margin-bottom: 0.375rem;
  }
  .tokens-desc {
    font-size: 0.9375rem; color: var(--text-secondary); margin-bottom: 1.5rem;
  }
  .token-groups {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;
  }
  .token-group-title {
    font-size: 0.6875rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 0.625rem;
  }
  .token-list { display: flex; flex-direction: column; gap: 0.25rem; }
  .token-name {
    font-family: ui-monospace, monospace; font-size: 0.75rem;
    color: #0a0a0a; padding: 0.125rem 0.5rem; border-radius: 0.25rem;
    background: rgba(10, 10, 10, 0.06);
  }

  @media (max-width: 800px) {
    .editor-layout { grid-template-columns: 1fr; }
    .token-groups { grid-template-columns: 1fr; }
  }
</style>
