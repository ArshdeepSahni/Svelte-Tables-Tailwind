<script lang="ts">
  /**
   * ColumnMenu Integration Example
   *
   * Shows how to use ColumnMenu with a table header.
   * This example is for reference — ColumnMenu is an internal component
   * managed by the Table component in production.
   */

  import ColumnMenu from './ColumnMenu.svelte';
  import type { ResolvedColumn } from '@tablecraft/core';

  // Example resolved column
  const exampleColumn: ResolvedColumn = {
    key: 'email',
    label: 'Email',
    type: 'email',
    width: 280,
    sortable: true,
    filterable: true,
  };

  // State
  let menuVisible = $state(false);
  let menuPosition = $state({ x: 0, y: 0 });
  let activeColumn: ResolvedColumn | null = $state(null);
  let sortState = $state({ key: null as string | null, dir: null as 'asc' | 'desc' | null });
  let freezeState = $state({ key: null as string | null, side: null as 'left' | 'right' | null });
  let groupByColumn = $state<string | null>(null);

  // Handlers
  function openMenu(column: ResolvedColumn, event: MouseEvent) {
    activeColumn = column;
    menuPosition = { x: event.clientX, y: event.clientY };
    menuVisible = true;
  }

  function closeMenu() {
    menuVisible = false;
    activeColumn = null;
  }

  function handleSort(key: string, dir: 'asc' | 'desc') {
    sortState = { key, dir };
    console.log(`✓ Sorted ${key} (${dir})`);
    closeMenu();
  }

  function handleHide(key: string) {
    console.log(`✓ Hidden column ${key}`);
    closeMenu();
  }

  function handleFreeze(key: string, side: 'left' | 'right' | null) {
    freezeState = { key, side };
    console.log(`✓ Froze ${key} to ${side || 'unfrozen'}`);
  }

  function handleGroupBy(key: string) {
    groupByColumn = groupByColumn === key ? null : key;
    console.log(`✓ Group by ${groupByColumn ? key : 'none'}`);
    closeMenu();
  }

  function handleChangeType(key: string, type: string) {
    console.log(`✓ Changed ${key} type to ${type}`);
    closeMenu();
  }

  function handleCalculate(key: string, fn: string) {
    console.log(`✓ Calculate ${fn} for ${key}`);
    closeMenu();
  }

  function handleFilterColumn(key: string, value: string) {
    console.log(`✓ Filter ${key} by "${value}"`);
    closeMenu();
  }

  function handleInsertLeft(key: string) {
    console.log(`✓ Insert column to left of ${key}`);
    closeMenu();
  }

  function handleInsertRight(key: string) {
    console.log(`✓ Insert column to right of ${key}`);
    closeMenu();
  }

  function handleDuplicate(key: string) {
    console.log(`✓ Duplicated column ${key}`);
    closeMenu();
  }
</script>

<div class="example-container">
  <h2>ColumnMenu Integration Example</h2>

  <!-- Example header cell with menu trigger -->
  <div class="column-header">
    <span class="column-label">{exampleColumn.label}</span>
    <button
      class="menu-trigger"
      onclick={(e) => openMenu(exampleColumn, e)}
      title="Column options"
      aria-label="Open column menu"
    >
      ⋮
    </button>
  </div>

  <!-- The ColumnMenu component -->
  {#if activeColumn}
    <ColumnMenu
      column={activeColumn}
      position={menuPosition}
      visible={menuVisible}
      {sortState}
      {freezeState}
      {groupByColumn}
      onsort={handleSort}
      onhide={handleHide}
      onfreeze={handleFreeze}
      ongroupby={handleGroupBy}
      onchangetype={handleChangeType}
      oncalculate={handleCalculate}
      onfiltercolumn={handleFilterColumn}
      oninsertleft={handleInsertLeft}
      oninsertright={handleInsertRight}
      onduplicate={handleDuplicate}
      onclose={closeMenu}
    />
  {/if}

  <!-- State display for debugging -->
  <div class="state-display">
    <h3>Current State</h3>
    <pre>{JSON.stringify({
      sortState,
      freezeState,
      groupByColumn,
      menuVisible,
    }, null, 2)}</pre>
  </div>

  <!-- Console output simulation -->
  <div class="instructions">
    <p>Try these actions:</p>
    <ul>
      <li>Click the ⋮ button to open the menu</li>
      <li>Click any menu item to trigger an action</li>
      <li>Check the console or state display above</li>
      <li>Click outside the menu to close it</li>
      <li>Press Escape to close the menu</li>
    </ul>
  </div>
</div>

<style>
  .example-container {
    max-width: 800px;
    margin: 40px auto;
    padding: 40px;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  h2 {
    margin: 0 0 32px 0;
    font-size: 24px;
    font-weight: 600;
    color: #0a0a0a;
  }

  h3 {
    margin: 0 0 16px 0;
    font-size: 14px;
    font-weight: 600;
    color: #a3a3a3;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Column header example */
  .column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    height: 40px;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    background: #ffffff;
    margin-bottom: 32px;
  }

  .column-label {
    font-size: 14px;
    font-weight: 500;
    color: #0a0a0a;
  }

  .menu-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    color: #a3a3a3;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.1s ease;
    font-size: 16px;
  }

  .menu-trigger:hover {
    background: #f8f8f8;
    color: #0a0a0a;
  }

  .menu-trigger:active {
    background: #f0f0f0;
  }

  /* State display */
  .state-display {
    margin: 32px 0;
    padding: 16px;
    background: #f8f8f8;
    border-radius: 8px;
    border: 1px solid #f0f0f0;
  }

  .state-display pre {
    margin: 0;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;
    color: #0a0a0a;
    overflow-x: auto;
    line-height: 1.5;
  }

  /* Instructions */
  .instructions {
    margin-top: 32px;
    padding: 16px;
    background: #f8f8f8;
    border-radius: 8px;
    border-left: 3px solid #0a0a0a;
  }

  .instructions p {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: #0a0a0a;
    font-weight: 500;
  }

  .instructions ul {
    margin: 0;
    padding: 0 0 0 20px;
  }

  .instructions li {
    margin: 8px 0;
    font-size: 13px;
    color: #a3a3a3;
  }
</style>
