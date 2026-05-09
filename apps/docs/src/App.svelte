<script lang="ts">
  import HeroSection from './components/HeroSection.svelte';
  import GettingStarted from './components/GettingStarted.svelte';
  import ReplPlayground from './components/ReplPlayground.svelte';
  import LiveTableDemo from './components/LiveTableDemo.svelte';
  import ApiReference from './components/ApiReference.svelte';
  import CustomizationGuide from './components/CustomizationGuide.svelte';
  import RendererGallery from './components/RendererGallery.svelte';
  import ComparisonPanel from './components/ComparisonPanel.svelte';
  import ArchitectureDiagram from './components/ArchitectureDiagram.svelte';
  import PerformanceDashboard from './components/PerformanceDashboard.svelte';
  import TypeInferenceDemo from './components/TypeInferenceDemo.svelte';
  import RoadmapProgress from './components/RoadmapProgress.svelte';
  import ApiTimeline from './components/ApiTimeline.svelte';
  import LazySection from './components/LazySection.svelte';

  let darkMode = $state(false);
  let mobileNavOpen = $state(false);
  let activeSection = $state('hero');

  const navLinks = [
    { id: 'hero',          label: 'Overview',        group: 'main' },
    { id: 'getting-started', label: 'Getting Started', group: 'main' },
    { id: 'playground',    label: 'Playground',       group: 'main' },
    { id: 'demo',          label: 'Live Demo',        group: 'main' },
    { id: 'api',           label: 'API Reference',    group: 'docs' },
    { id: 'customization', label: 'Customization',    group: 'docs' },
    { id: 'renderers',     label: 'Renderers',        group: 'docs' },
    { id: 'comparison',    label: '100x Simpler',     group: 'explore' },
    { id: 'architecture',  label: 'Architecture',     group: 'explore' },
    { id: 'performance',   label: 'Performance',      group: 'explore' },
    { id: 'inference',     label: 'Type Inference',   group: 'explore' },
    { id: 'roadmap',       label: 'Roadmap',          group: 'explore' },
    { id: 'timeline',      label: 'API Design',       group: 'explore' },
  ];

  const groups = [
    { id: 'main', label: '' },
    { id: 'docs', label: 'Documentation' },
    { id: 'explore', label: 'Explore' },
  ];

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      activeSection = id;
    }
    mobileNavOpen = false;
  }

  // Track active section on scroll
  $effect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            activeSection = entry.target.id;
          }
        }
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );

    const sections = document.querySelectorAll('section[id]');
    sections.forEach(s => observer.observe(s));

    return () => observer.disconnect();
  });
</script>

<div class="app" class:dark={darkMode} class:light={!darkMode}>
  <!-- Top navbar (mobile) -->
  <nav class="topnav">
    <div class="topnav-inner">
      <a href="#hero" class="brand" onclick={(e) => { e.preventDefault(); scrollTo('hero'); }}>
        <span class="brand-icon">&#9783;</span>
        <span class="brand-name">@tablecraft</span>
        <span class="brand-version">v2.0.0</span>
      </a>

      <div class="topnav-actions">
        <button
          class="theme-toggle"
          onclick={() => { darkMode = !darkMode; }}
          aria-label="Toggle {darkMode ? 'light' : 'dark'} mode"
          title="Toggle theme"
        >
          {darkMode ? '☼' : '☾'}
        </button>

        <button
          class="hamburger"
          class:open={mobileNavOpen}
          onclick={() => { mobileNavOpen = !mobileNavOpen; }}
          aria-label="Toggle navigation"
          aria-expanded={mobileNavOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>

    {#if mobileNavOpen}
      <div class="mobile-nav">
        {#each navLinks as link}
          <button
            class="mobile-nav-link"
            class:active={activeSection === link.id}
            onclick={() => scrollTo(link.id)}
          >
            {link.label}
          </button>
        {/each}
      </div>
    {/if}
  </nav>

  <!-- Sidebar (desktop) -->
  <aside class="sidebar">
    <div class="sidebar-brand">
      <div class="sidebar-logo">&#9783;</div>
      <div>
        <div class="sidebar-name">@tablecraft</div>
        <div class="sidebar-ver">v2.0.0</div>
      </div>
    </div>

    <nav class="sidebar-nav">
      {#each groups as group}
        {#if group.label}
          <div class="sidebar-group-label">{group.label}</div>
        {/if}
        {#each navLinks.filter(l => l.group === group.id) as link}
          <button
            class="sidebar-link"
            class:active={activeSection === link.id}
            onclick={() => scrollTo(link.id)}
          >
            {link.label}
          </button>
        {/each}
      {/each}
    </nav>

    <div class="sidebar-footer">
      <a class="sidebar-github" href="https://github.com/ArshdeepSahni/Svelte-Tables-Tailwind" target="_blank" rel="noopener noreferrer">
        GitHub
      </a>
      <button
        class="theme-toggle-sidebar"
        onclick={() => { darkMode = !darkMode; }}
        aria-label="Toggle theme"
      >
        <span>{darkMode ? '☼' : '☾'}</span>
        {darkMode ? 'Light mode' : 'Dark mode'}
      </button>
    </div>
  </aside>

  <!-- Main content -->
  <main class="main-content">
    <section id="hero" class="section-wrap">
      <HeroSection {darkMode} />
    </section>

    <section id="getting-started" class="section-wrap">
      <LazySection rootMargin="100px 0px">
        <GettingStarted {darkMode} />
      </LazySection>
    </section>

    <section id="playground" class="section-wrap">
      <LazySection>
        <ReplPlayground {darkMode} />
      </LazySection>
    </section>

    <section id="demo" class="section-wrap">
      <LazySection>
        <LiveTableDemo {darkMode} />
      </LazySection>
    </section>

    <section id="api" class="section-wrap">
      <LazySection>
        <ApiReference {darkMode} />
      </LazySection>
    </section>

    <section id="customization" class="section-wrap">
      <LazySection>
        <CustomizationGuide {darkMode} />
      </LazySection>
    </section>

    <section id="renderers" class="section-wrap">
      <LazySection>
        <RendererGallery {darkMode} />
      </LazySection>
    </section>

    <section id="comparison" class="section-wrap">
      <LazySection>
        <ComparisonPanel {darkMode} />
      </LazySection>
    </section>

    <section id="architecture" class="section-wrap">
      <LazySection>
        <ArchitectureDiagram {darkMode} />
      </LazySection>
    </section>

    <section id="performance" class="section-wrap">
      <LazySection>
        <PerformanceDashboard {darkMode} />
      </LazySection>
    </section>

    <section id="inference" class="section-wrap">
      <LazySection>
        <TypeInferenceDemo {darkMode} />
      </LazySection>
    </section>

    <section id="roadmap" class="section-wrap">
      <LazySection>
        <RoadmapProgress {darkMode} />
      </LazySection>
    </section>

    <section id="timeline" class="section-wrap">
      <LazySection>
        <ApiTimeline {darkMode} />
      </LazySection>
    </section>

    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <span class="footer-logo">&#9783;</span>
          <span>@tablecraft v2.0.0</span>
        </div>
        <div class="footer-links">
          <a href="https://github.com/ArshdeepSahni/Svelte-Tables-Tailwind" target="_blank" rel="noopener noreferrer">GitHub</a>
          <span class="footer-sep">&middot;</span>
          <span>MIT License</span>
          <span class="footer-sep">&middot;</span>
          <span>Built with Svelte 5 + Vite</span>
        </div>
        <div class="footer-note">
          This docs site is itself built using @tablecraft — the Live Demo and Playground render real data.
        </div>
      </div>
    </footer>
  </main>
</div>

<style>
  :global(*), :global(*::before), :global(*::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(:root) {
    --sidebar-width: 220px;
  }

  .app {
    display: flex;
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', system-ui, sans-serif;
  }

  /* Dark theme (default) */
  .app.dark {
    --bg-primary: #0a0e1a;
    --bg-secondary: #0d1424;
    --bg-hover: #1e2535;
    --text-primary: #f0f4ff;
    --text-secondary: #94a3b8;
    --text-muted: #475569;
    --border-color: #1e293b;
    --sidebar-bg: #080c17;
    --topnav-bg: rgba(8, 12, 23, 0.95);
    --footer-bg: #060910;
  }

  /* Light theme */
  .app.light {
    --bg-primary: #ffffff;
    --bg-secondary: #f8fafc;
    --bg-hover: #f1f5f9;
    --text-primary: #0f172a;
    --text-secondary: #475569;
    --text-muted: #94a3b8;
    --border-color: #e2e8f0;
    --sidebar-bg: #f8fafc;
    --topnav-bg: rgba(248, 250, 252, 0.95);
    --footer-bg: #f1f5f9;
  }

  /* ------------------------------------------------------------------ */
  /* Sidebar */
  /* ------------------------------------------------------------------ */

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: var(--sidebar-width);
    height: 100vh;
    background: var(--sidebar-bg);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    z-index: 100;
    overflow-y: auto;
  }

  .sidebar-brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.25rem 1rem 1rem;
    border-bottom: 1px solid var(--border-color);
  }

  .sidebar-logo {
    font-size: 1.5rem;
    color: #0a0a0a;
  }

  .sidebar-name {
    font-size: 0.9375rem;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.02em;
  }

  .sidebar-ver {
    font-size: 0.6875rem;
    color: #737373;
    font-weight: 700;
    font-family: ui-monospace, monospace;
  }

  .sidebar-nav {
    flex: 1;
    padding: 0.75rem 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .sidebar-group-label {
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    padding: 0.75rem 0.75rem 0.25rem;
    margin-top: 0.25rem;
  }

  .sidebar-link {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0.4rem 0.75rem;
    border-radius: 0.5rem;
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 0.8125rem;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
    transition: all 0.15s;
  }

  .sidebar-link:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .sidebar-link.active {
    background: rgba(10, 10, 10, 0.06);
    color: #0a0a0a;
    font-weight: 700;
  }

  .sidebar-footer {
    padding: 0.75rem;
    border-top: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .sidebar-github {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.4rem 0.75rem;
    border-radius: 0.5rem;
    background: var(--bg-hover);
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    font-size: 0.8125rem;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.15s;
  }
  .sidebar-github:hover { color: var(--text-primary); border-color: #0a0a0a; }

  .theme-toggle-sidebar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.4rem 0.75rem;
    border-radius: 0.5rem;
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-muted);
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all 0.15s;
  }
  .theme-toggle-sidebar:hover { color: var(--text-primary); border-color: #0a0a0a; }

  /* ------------------------------------------------------------------ */
  /* Top nav (mobile only) */
  /* ------------------------------------------------------------------ */

  .topnav {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 200;
    background: var(--topnav-bg);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border-color);
  }

  .topnav-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.875rem 1rem;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: var(--text-primary);
  }

  .brand-icon { font-size: 1.25rem; color: #0a0a0a; }
  .brand-name { font-size: 0.9375rem; font-weight: 800; letter-spacing: -0.02em; }
  .brand-version { font-size: 0.6875rem; color: #737373; font-weight: 700; font-family: ui-monospace, monospace; }

  .topnav-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .theme-toggle {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    color: var(--text-muted);
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }
  .theme-toggle:hover { color: var(--text-primary); border-color: #0a0a0a; }

  .hamburger {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 2rem;
    height: 2rem;
    padding: 0.375rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    cursor: pointer;
    gap: 4px;
  }

  .hamburger span {
    display: block;
    height: 2px;
    background: var(--text-muted);
    border-radius: 2px;
    transition: all 0.2s;
    width: 100%;
  }

  .mobile-nav {
    display: flex;
    flex-direction: column;
    border-top: 1px solid var(--border-color);
    background: var(--bg-secondary);
    max-height: 70vh;
    overflow-y: auto;
  }

  .mobile-nav-link {
    padding: 0.75rem 1.25rem;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--border-color);
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
    transition: all 0.15s;
  }
  .mobile-nav-link.active { color: #0a0a0a; font-weight: 700; background: rgba(10,10,10,0.04); }
  .mobile-nav-link:hover { color: var(--text-primary); background: var(--bg-hover); }
  .mobile-nav-link:last-child { border-bottom: none; }

  /* ------------------------------------------------------------------ */
  /* Main content area */
  /* ------------------------------------------------------------------ */

  .main-content {
    margin-left: var(--sidebar-width);
    flex: 1;
    min-width: 0;
    background: var(--bg-primary);
  }

  .section-wrap {
    /* inner sections have their own ids */
  }

  /* ------------------------------------------------------------------ */
  /* Footer */
  /* ------------------------------------------------------------------ */

  .site-footer {
    padding: 3rem 2rem;
    background: var(--footer-bg);
    border-top: 1px solid var(--border-color);
  }

  .footer-inner {
    max-width: 1100px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    align-items: center;
    text-align: center;
  }

  .footer-brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--text-secondary);
  }

  .footer-logo { font-size: 1.25rem; color: #0a0a0a; }

  .footer-links {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-muted);
    flex-wrap: wrap;
    justify-content: center;
  }

  .footer-links a {
    color: #0a0a0a;
    text-decoration: none;
    transition: color 0.15s;
  }
  .footer-links a:hover { color: #525252; }

  .footer-sep { color: var(--border-color); }

  .footer-note {
    font-size: 0.8125rem;
    color: var(--text-muted);
    max-width: 500px;
    line-height: 1.5;
  }

  /* ------------------------------------------------------------------ */
  /* Responsive: hide sidebar, show topnav on mobile */
  /* ------------------------------------------------------------------ */

  @media (max-width: 900px) {
    .sidebar { display: none; }
    .topnav { display: block; }
    .main-content { margin-left: 0; padding-top: 56px; }
  }
</style>
