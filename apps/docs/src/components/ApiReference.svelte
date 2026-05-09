<script lang="ts">
  interface Props {
    darkMode: boolean;
  }
  let { darkMode }: Props = $props();

  let activeCategory = $state('core');

  const categories = [
    { id: 'core', label: 'Core Props' },
    { id: 'display', label: 'Display' },
    { id: 'interaction', label: 'Interaction' },
    { id: 'advanced', label: 'Advanced' },
    { id: 'events', label: 'Events' },
  ];

  interface PropDoc {
    name: string;
    type: string;
    default: string;
    desc: string;
  }

  const propsByCategory: Record<string, PropDoc[]> = {
    core: [
      { name: 'data', type: 'Record<string, unknown>[]', default: '[]', desc: 'The array of row objects. This is the only required prop — everything else is inferred.' },
      { name: 'columns', type: "Record<string, ColumnType> | ColumnDefinition[]", default: 'auto-inferred', desc: 'Override column types. Short form: { price: "currency" }. Long form: array of ColumnDefinition objects.' },
      { name: 'caption', type: 'string', default: "''", desc: 'Accessible table caption. Rendered as <caption> for screen readers.' },
    ],
    display: [
      { name: 'loading', type: 'boolean', default: 'false', desc: 'Show skeleton loading state with animated placeholder rows.' },
      { name: 'skeletonRows', type: 'number', default: '5', desc: 'Number of skeleton rows shown during loading.' },
      { name: 'striped', type: 'boolean', default: 'false', desc: 'Alternate row background colors for better readability.' },
      { name: 'bordered', type: 'boolean', default: 'false', desc: 'Show cell borders for a more structured look.' },
      { name: 'emptyMessage', type: 'string', default: "'No data'", desc: 'Message shown when data array is empty.' },
      { name: 'density', type: "'compact' | 'comfortable' | 'spacious'", default: "'comfortable'", desc: 'Row height preset: compact (32px), comfortable (44px), spacious (64px).' },
    ],
    interaction: [
      { name: 'filterable', type: 'boolean', default: 'true', desc: 'Show the search/filter input above the table.' },
      { name: 'selectable', type: 'boolean', default: 'false', desc: 'Enable row selection checkboxes with select-all support.' },
      { name: 'pageSize', type: 'number', default: '50', desc: 'Rows per page. Pagination appears automatically when data exceeds this.' },
      { name: 'sortTransition', type: 'boolean', default: 'true', desc: 'Animate sort transitions using the View Transitions API (Chrome 111+).' },
      { name: 'virtualizeAt', type: 'number', default: '200', desc: 'Row count threshold to enable virtual scrolling. Set to Infinity to disable.' },
    ],
    advanced: [
      { name: 'groupBy', type: 'string | null', default: 'null', desc: 'Column key to group rows by. Shows collapsible group headers.' },
      { name: 'showAggregates', type: 'boolean', default: 'false', desc: 'Show aggregate footer row with sum/avg/count per column.' },
      { name: 'persistKey', type: 'string', default: "''", desc: 'localStorage key to persist column widths, sort, visibility, and density.' },
      { name: 'hiddenColumns', type: 'Set<string>', default: 'new Set()', desc: 'Bindable set of hidden column keys. Use bind:hiddenColumns.' },
      { name: 'selectedRows', type: 'Row[]', default: '[]', desc: 'Bindable array of selected rows. Use bind:selectedRows.' },
    ],
    events: [
      { name: 'onselect', type: '(e: { rows, allSelected }) => void', default: '—', desc: 'Fired when row selection changes. Includes selected rows and allSelected boolean.' },
      { name: 'onrowclick', type: '(e: { row, rowIndex }) => void', default: '—', desc: 'Fired when a row is clicked. Includes the row data and visual index.' },
      { name: 'oncellclick', type: '(e: { row, column, value }) => void', default: '—', desc: 'Fired when a cell is clicked. Includes row, resolved column, and cell value.' },
    ],
  };

  const currentProps = $derived(propsByCategory[activeCategory] ?? []);

  const columnTypes = [
    'text', 'number', 'integer', 'currency', 'percentage',
    'boolean', 'date', 'datetime', 'time',
    'email', 'url', 'phone',
    'image', 'badge', 'status',
    'code', 'html', 'rating', 'progress', 'color',
  ];
</script>

<section class="section" class:dark={darkMode}>
  <div class="section-inner">
    <div class="section-header">
      <div class="section-tag">Reference</div>
      <h2 class="section-title">API Reference</h2>
      <p class="section-desc">
        Every prop, event, and type — documented with defaults and descriptions.
      </p>
    </div>

    <div class="category-tabs">
      {#each categories as cat}
        <button
          class="cat-tab"
          class:active={activeCategory === cat.id}
          onclick={() => { activeCategory = cat.id; }}
        >
          {cat.label}
        </button>
      {/each}
    </div>

    <div class="props-table">
      <div class="props-header">
        <span class="ph-name">Prop</span>
        <span class="ph-type">Type</span>
        <span class="ph-default">Default</span>
        <span class="ph-desc">Description</span>
      </div>
      {#each currentProps as prop}
        <div class="prop-row">
          <span class="pr-name"><code>{prop.name}</code></span>
          <span class="pr-type"><code>{prop.type}</code></span>
          <span class="pr-default"><code>{prop.default}</code></span>
          <span class="pr-desc">{prop.desc}</span>
        </div>
      {/each}
    </div>

    <div class="types-section">
      <h3 class="types-title">Auto-Detected Column Types</h3>
      <p class="types-desc">
        The inference engine automatically detects these 20 column types
        from your data values and field names — zero configuration needed.
      </p>
      <div class="type-grid">
        {#each columnTypes as ct}
          <div class="type-badge">{ct}</div>
        {/each}
      </div>
    </div>

    <div class="migration-section">
      <h3 class="migration-title">Migrating from v1</h3>
      <p class="migration-desc">
        The v1 API used <code>colname</code> and <code>rowdata</code> props.
        These still work with a deprecation warning, but here's how to upgrade:
      </p>
      <div class="migration-grid">
        <div class="migration-card">
          <div class="migration-label before">v1 (deprecated)</div>
          <pre class="migration-code"><code>&lt;Table
  colname={'{'}['Name','Email']{'}'}
  rowdata={'{'}rows{'}'}
/&gt;</code></pre>
        </div>
        <div class="migration-arrow">&#8594;</div>
        <div class="migration-card">
          <div class="migration-label after">v2 (recommended)</div>
          <pre class="migration-code"><code>&lt;Table data={'{'}rows{'}'} /&gt;</code></pre>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .section {
    padding: 5rem 2rem; background: var(--bg-primary);
    border-top: 1px solid var(--border-color);
  }
  .section-inner { max-width: 1100px; margin: 0 auto; }
  .section-header { text-align: center; margin-bottom: 2.5rem; }
  .section-tag {
    display: inline-block; padding: 0.25rem 0.75rem;
    background: rgba(245, 158, 11, 0.15); color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 9999px;
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

  .category-tabs {
    display: flex; gap: 2px; margin-bottom: 1.5rem;
    background: var(--bg-secondary); border: 1px solid var(--border-color);
    border-radius: 0.5rem; padding: 3px; width: fit-content; margin-left: auto; margin-right: auto;
  }
  .cat-tab {
    padding: 0.5rem 1rem; border: none; border-radius: 0.375rem;
    background: transparent; color: var(--text-secondary);
    font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.15s;
  }
  .cat-tab.active { background: #0a0a0a; color: white; font-weight: 600; }
  .cat-tab:not(.active):hover { color: var(--text-primary); background: var(--bg-hover); }

  .props-table {
    background: var(--bg-secondary); border: 1px solid var(--border-color);
    border-radius: 0.75rem; overflow: hidden; margin-bottom: 3rem;
  }
  .props-header, .prop-row {
    display: grid; grid-template-columns: 150px 240px 110px 1fr;
    gap: 1rem; padding: 0.75rem 1.25rem; align-items: start;
  }
  .props-header {
    font-size: 0.6875rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: var(--text-muted);
    border-bottom: 1px solid var(--border-color); background: var(--bg-primary);
  }
  .prop-row {
    border-bottom: 1px solid var(--border-color); font-size: 0.875rem;
  }
  .prop-row:last-child { border-bottom: none; }
  .pr-name code {
    color: var(--text-primary); font-weight: 600;
    font-family: ui-monospace, monospace; font-size: 0.8125rem;
  }
  .pr-type code {
    color: #0a0a0a; font-family: ui-monospace, monospace;
    font-size: 0.75rem; word-break: break-all;
  }
  .pr-default code {
    color: var(--text-muted); font-family: ui-monospace, monospace;
    font-size: 0.75rem;
  }
  .pr-desc { color: var(--text-secondary); line-height: 1.5; font-size: 0.8125rem; }

  .types-section {
    background: var(--bg-secondary); border: 1px solid var(--border-color);
    border-radius: 0.75rem; padding: 2rem; margin-bottom: 2rem;
  }
  .types-title {
    font-size: 1.25rem; font-weight: 700; color: var(--text-primary);
    margin-bottom: 0.375rem;
  }
  .types-desc {
    font-size: 0.9375rem; color: var(--text-secondary);
    margin-bottom: 1.25rem; line-height: 1.5;
  }
  .types-desc code {
    font-family: ui-monospace, monospace; color: #0a0a0a;
    background: rgba(10, 10, 10, 0.08); padding: 0.1em 0.3em;
    border-radius: 0.25rem; font-size: 0.875em;
  }
  .type-grid {
    display: flex; flex-wrap: wrap; gap: 0.5rem;
  }
  .type-badge {
    padding: 0.25rem 0.75rem; border-radius: 0.375rem;
    background: rgba(10, 10, 10, 0.06); border: 1px solid rgba(10, 10, 10, 0.15);
    color: #0a0a0a; font-family: ui-monospace, monospace;
    font-size: 0.8125rem; font-weight: 600;
  }

  .migration-section {
    background: var(--bg-secondary); border: 1px solid var(--border-color);
    border-radius: 0.75rem; padding: 2rem;
  }
  .migration-title {
    font-size: 1.25rem; font-weight: 700; color: var(--text-primary);
    margin-bottom: 0.375rem;
  }
  .migration-desc {
    font-size: 0.9375rem; color: var(--text-secondary);
    margin-bottom: 1.5rem; line-height: 1.5;
  }
  .migration-desc code {
    font-family: ui-monospace, monospace; color: #0a0a0a;
    background: rgba(10, 10, 10, 0.08); padding: 0.1em 0.3em;
    border-radius: 0.25rem; font-size: 0.875em;
  }
  .migration-grid {
    display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;
  }
  .migration-card { flex: 1; min-width: 240px; }
  .migration-label {
    font-size: 0.6875rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; margin-bottom: 0.5rem;
  }
  .migration-label.before { color: #f87171; }
  .migration-label.after { color: #4ade80; }
  .migration-arrow {
    font-size: 1.5rem; color: var(--text-muted); flex-shrink: 0;
  }
  .migration-code {
    padding: 0.75rem 1rem; border-radius: 0.5rem;
    background: #f8fafc; color: #0a0a0a;
    font-family: ui-monospace, monospace; font-size: 0.8125rem;
    line-height: 1.6; border: 1px solid rgba(10, 10, 10, 0.12);
  }

  @media (max-width: 800px) {
    .props-header, .prop-row {
      grid-template-columns: 1fr; gap: 0.25rem;
    }
    .props-header { display: none; }
    .prop-row { padding: 1rem 1.25rem; }
    .migration-arrow { display: none; }
  }
</style>
