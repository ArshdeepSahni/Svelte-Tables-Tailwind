<script lang="ts">
  interface Props {
    darkMode: boolean;
  }
  let { darkMode }: Props = $props();

  let copiedStep = $state<number | null>(null);

  function copy(text: string, step: number) {
    navigator.clipboard.writeText(text);
    copiedStep = step;
    setTimeout(() => { copiedStep = null; }, 2000);
  }

  const steps = [
    {
      title: 'Install',
      code: 'npm install @tablecraft/svelte',
      lang: 'bash',
    },
    {
      title: 'Import',
      code: "import { Table } from '@tablecraft/svelte';",
      lang: 'js',
    },
    {
      title: 'Use',
      code: '<Table data={yourData} />',
      lang: 'svelte',
    },
  ];

  const features = [
    { icon: '&#9672;', title: 'Zero Config', desc: 'Drop in data, get a complete table. Column types, sorting, pagination — all automatic.' },
    { icon: '&#9733;', title: '17+ Types', desc: 'Email, currency, date, status, image, boolean, phone, URL — all auto-detected.' },
    { icon: '&#9889;', title: '100k Rows', desc: 'Virtual scrolling, Web Worker sort, CSS containment. Buttery smooth at any scale.' },
    { icon: '&#9783;', title: 'Full Control', desc: '60+ CSS tokens, column overrides, grouping, pinning, persistence. Override anything.' },
  ];

  const overrideExample = `<Table
  data={users}
  columns={{ avatar: 'image', salary: 'currency' }}
  selectable
  density="compact"
  groupBy="department"
/>`;
</script>

<section class="section" class:dark={darkMode}>
  <div class="section-inner">
    <div class="section-header">
      <div class="section-tag">Getting Started</div>
      <h2 class="section-title">From Zero to Table in 60 Seconds</h2>
      <p class="section-desc">
        Three lines of code. No configuration files, no schema definitions, no boilerplate.
      </p>
    </div>

    <div class="steps">
      {#each steps as step, i}
        <div class="step-card">
          <div class="step-number">{i + 1}</div>
          <div class="step-content">
            <div class="step-title">{step.title}</div>
            <div class="step-code-wrap">
              <pre class="step-code"><code>{step.code}</code></pre>
              <button class="copy-btn" onclick={() => copy(step.code, i)}>
                {copiedStep === i ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <div class="features-grid">
      {#each features as feat}
        <div class="feature-card">
          <div class="feature-icon">{@html feat.icon}</div>
          <div class="feature-title">{feat.title}</div>
          <div class="feature-desc">{feat.desc}</div>
        </div>
      {/each}
    </div>

    <div class="advanced-section">
      <div class="advanced-header">
        <h3 class="advanced-title">Need more control?</h3>
        <p class="advanced-desc">
          Override only what you need. Everything else stays auto-inferred.
        </p>
      </div>
      <pre class="advanced-code"><code>{overrideExample}</code></pre>
    </div>
  </div>
</section>

<style>
  .section {
    padding: 5rem 2rem;
    background: var(--bg-primary);
    border-top: 1px solid var(--border-color);
  }
  .section-inner { max-width: 900px; margin: 0 auto; }
  .section-header { text-align: center; margin-bottom: 3rem; }
  .section-tag {
    display: inline-block; padding: 0.25rem 0.75rem;
    background: rgba(10, 10, 10, 0.08); color: #0a0a0a;
    border: 1px solid rgba(10, 10, 10, 0.15); border-radius: 9999px;
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

  .steps {
    display: flex; flex-direction: column; gap: 1rem; margin-bottom: 3rem;
  }
  .step-card {
    display: flex; align-items: center; gap: 1.25rem;
    padding: 1.25rem 1.5rem;
    background: var(--bg-secondary); border: 1px solid var(--border-color);
    border-radius: 0.75rem; transition: border-color 0.2s;
  }
  .step-card:hover { border-color: rgba(10, 10, 10, 0.15); }
  .step-number {
    flex-shrink: 0; width: 2.5rem; height: 2.5rem;
    display: flex; align-items: center; justify-content: center;
    background: rgba(10, 10, 10, 0.06); color: #0a0a0a;
    border-radius: 50%; font-size: 1rem; font-weight: 800;
  }
  .step-content { flex: 1; min-width: 0; }
  .step-title {
    font-size: 0.6875rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 0.375rem;
  }
  .step-code-wrap {
    display: flex; align-items: center; gap: 0.75rem;
  }
  .step-code {
    flex: 1; padding: 0.5rem 0.75rem; border-radius: 0.375rem;
    background: #f8fafc; color: #0a0a0a;
    font-family: ui-monospace, 'JetBrains Mono', monospace;
    font-size: 0.875rem; overflow-x: auto; white-space: nowrap;
    border: 1px solid rgba(10, 10, 10, 0.12);
  }
  .copy-btn {
    flex-shrink: 0; padding: 0.375rem 0.75rem; border-radius: 0.375rem;
    background: rgba(10, 10, 10, 0.06); border: 1px solid rgba(10, 10, 10, 0.15);
    color: #0a0a0a; font-size: 0.75rem; font-weight: 600;
    cursor: pointer; transition: all 0.15s; white-space: nowrap;
  }
  .copy-btn:hover { background: rgba(10, 10, 10, 0.1); }

  .features-grid {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;
    margin-bottom: 3rem;
  }
  .feature-card {
    padding: 1.5rem; background: var(--bg-secondary);
    border: 1px solid var(--border-color); border-radius: 0.75rem;
    transition: border-color 0.2s;
  }
  .feature-card:hover { border-color: rgba(10, 10, 10, 0.15); }
  .feature-icon {
    font-size: 1.5rem; margin-bottom: 0.75rem; color: #0a0a0a;
  }
  .feature-title {
    font-size: 1rem; font-weight: 700; color: var(--text-primary);
    margin-bottom: 0.375rem;
  }
  .feature-desc {
    font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5;
  }

  .advanced-section {
    background: var(--bg-secondary); border: 1px solid var(--border-color);
    border-radius: 0.75rem; padding: 2rem;
  }
  .advanced-header { margin-bottom: 1.25rem; }
  .advanced-title {
    font-size: 1.25rem; font-weight: 700; color: var(--text-primary);
    margin-bottom: 0.375rem;
  }
  .advanced-desc { font-size: 0.9375rem; color: var(--text-secondary); }
  .advanced-code {
    padding: 1rem 1.25rem; border-radius: 0.5rem;
    background: #f8fafc; color: #0a0a0a;
    font-family: ui-monospace, 'JetBrains Mono', monospace;
    font-size: 0.8125rem; line-height: 1.8; overflow-x: auto;
    border: 1px solid rgba(10, 10, 10, 0.12);
  }

  @media (max-width: 640px) {
    .features-grid { grid-template-columns: 1fr; }
    .step-card { flex-direction: column; align-items: flex-start; }
  }
</style>
