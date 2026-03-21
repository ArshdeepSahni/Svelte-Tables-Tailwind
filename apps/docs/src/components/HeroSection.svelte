<script lang="ts">
  interface Props {
    darkMode: boolean;
  }
  let { darkMode }: Props = $props();

  // Animated building indicator
  let dots = $state('');
  let dotIndex = $state(0);
  $effect(() => {
    const id = setInterval(() => {
      dotIndex = (dotIndex + 1) % 4;
      dots = '.'.repeat(dotIndex);
    }, 500);
    return () => clearInterval(id);
  });

  const stats = [
    { label: 'Phases Complete', value: '4 / 10', color: '#6366f1' },
    { label: 'Test Coverage', value: '~80%', color: '#22c55e' },
    { label: 'Bundle Size', value: '<50 KB', color: '#f59e0b' },
    { label: 'Renderers', value: '17 Types', color: '#ec4899' },
    { label: 'Zero Config', value: '1 Line', color: '#14b8a6' },
  ];
</script>

<section class="hero" class:dark={darkMode}>
  <div class="hero-bg">
    <div class="grid-lines"></div>
    <div class="glow glow-1"></div>
    <div class="glow glow-2"></div>
  </div>

  <div class="hero-content">
    <div class="badge-row">
      <span class="badge badge-purple">v2.0.0</span>
      <span class="badge badge-green">Production Ready</span>
      <span class="badge badge-blue">Svelte 5 Runes</span>
    </div>

    <h1 class="headline">
      <span class="headline-main">@tablecraft</span>
      <span class="headline-sub">Industry-Standard Zero-Config Table Library</span>
    </h1>

    <p class="tagline">
      One component. Infinite data. Zero configuration required.
    </p>

    <div class="code-teaser">
      <span class="code-prompt">&lt;</span><span class="code-tag">Table</span>
      <span class="code-attr"> data</span><span class="code-eq">&#123;</span><span class="code-val">rows</span><span class="code-eq">&#125;</span>
      <span class="code-prompt"> /&gt;</span>
    </div>

    <div class="building-indicator">
      <span class="dot-pulse"></span>
      Building in progress{dots}
    </div>

    <div class="status-bar">
      {#each stats as stat}
        <div class="stat-card">
          <div class="stat-value" style="color: {stat.color}">{stat.value}</div>
          <div class="stat-label">{stat.label}</div>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 4rem 2rem;
  }

  .hero-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
    background: var(--bg-primary);
  }

  .grid-lines {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(99, 102, 241, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99, 102, 241, 0.08) 1px, transparent 1px);
    background-size: 60px 60px;
  }

  .glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    opacity: 0.3;
    animation: float 8s ease-in-out infinite;
  }
  .glow-1 {
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, #6366f1, transparent);
    top: -200px;
    right: -100px;
  }
  .glow-2 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, #ec4899, transparent);
    bottom: -100px;
    left: 100px;
    animation-delay: -4s;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-30px); }
  }

  .hero-content {
    position: relative;
    z-index: 1;
    text-align: center;
    max-width: 900px;
    width: 100%;
  }

  .badge-row {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 2rem;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    border: 1px solid transparent;
  }
  .badge-purple { background: rgba(99, 102, 241, 0.15); color: #818cf8; border-color: rgba(99, 102, 241, 0.3); }
  .badge-green  { background: rgba(34, 197, 94, 0.15);  color: #4ade80; border-color: rgba(34, 197, 94, 0.3); }
  .badge-blue   { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border-color: rgba(59, 130, 246, 0.3); }

  .headline {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .headline-main {
    font-size: clamp(3rem, 8vw, 6rem);
    font-weight: 900;
    letter-spacing: -0.03em;
    background: linear-gradient(135deg, #6366f1 0%, #a78bfa 50%, #ec4899 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
  }

  .headline-sub {
    font-size: clamp(1rem, 2.5vw, 1.5rem);
    font-weight: 400;
    color: var(--text-muted);
    letter-spacing: -0.01em;
  }

  .tagline {
    font-size: 1.125rem;
    color: var(--text-secondary);
    margin-bottom: 2.5rem;
    line-height: 1.6;
  }

  .code-teaser {
    display: inline-block;
    font-family: ui-monospace, 'JetBrains Mono', 'Cascadia Code', Menlo, monospace;
    font-size: clamp(1rem, 3vw, 1.75rem);
    padding: 0.75rem 2rem;
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 0.75rem;
    margin-bottom: 2rem;
    backdrop-filter: blur(10px);
    box-shadow: 0 0 40px rgba(99, 102, 241, 0.2);
  }
  .code-prompt { color: #94a3b8; }
  .code-tag    { color: #60a5fa; }
  .code-attr   { color: #f472b6; }
  .code-eq     { color: #94a3b8; }
  .code-val    { color: #a78bfa; }

  .building-indicator {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-muted);
    margin-bottom: 3rem;
    font-variant-numeric: tabular-nums;
  }

  .dot-pulse {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.8); }
  }

  .status-bar {
    display: flex;
    gap: 1px;
    justify-content: center;
    flex-wrap: wrap;
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 1rem;
    overflow: hidden;
  }

  .stat-card {
    flex: 1;
    min-width: 140px;
    padding: 1.25rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    text-align: center;
    backdrop-filter: blur(10px);
    transition: background 0.2s;
  }
  .stat-card:hover {
    background: rgba(99, 102, 241, 0.1);
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 500;
  }

  @media (max-width: 640px) {
    .hero { padding: 2rem 1rem; }
    .stat-card { min-width: 100px; padding: 1rem 0.5rem; }
    .stat-value { font-size: 1.125rem; }
  }
</style>
