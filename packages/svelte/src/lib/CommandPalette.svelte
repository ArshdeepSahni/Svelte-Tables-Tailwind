<script lang="ts">
  /**
   * @tablecraft/svelte — CommandPalette component
   *
   * Linear/Notion/Raycast-style command palette with fuzzy search.
   * Trigger: Cmd+K (Mac) / Ctrl+K (Win)
   *
   * Features:
   * - Fuzzy search with instant filtering
   * - Dynamic commands (columns populate command list)
   * - Keyboard navigation (Arrow up/down, Enter to execute, Escape to close)
   * - Recent commands (last 5 used)
   * - Category grouping (Sort, Filter, View, Data, Navigate, Edit)
   * - Smooth animations (fade-in, slide-down)
   * - Centered modal overlay with backdrop blur
   *
   * Design:
   * - Width: 480px, max-height: 400px
   * - Rounded: 12px, subtle shadow
   * - Input at top with search icon
   * - Results with category headers and keyboard highlight
   * - Selected item: subtle background (#f5f5f5)
   *
   * Svelte 5: $props, $state, $derived, $effect only
   * CSS: Custom properties (--tc-*) only, NO Tailwind
   */

  import { onDestroy } from 'svelte';
  import type { ResolvedColumn } from '@tablecraft/core';

  interface CommandAction {
    id: string;
    label: string;
    category: 'Sort' | 'Filter' | 'Group' | 'View' | 'Density' | 'Export' | 'Navigate' | 'Select' | 'Edit';
    icon?: string;
    shortcut?: string;
    action: () => void;
  }

  interface Props {
    visible: boolean;
    columns?: ResolvedColumn[];
    onclose: () => void;
    onsort?: (key: string, dir: 'asc' | 'desc') => void;
    onfilter?: (query: string) => void;
    onfilterinput?: () => void;
    ongroupby?: (key: string | null) => void;
    ondensity?: (density: 'compact' | 'comfortable' | 'spacious') => void;
    onexport?: (format: 'csv' | 'json' | 'clipboard') => void;
    onhidecolumn?: (key: string) => void;
    onshowallcolumns?: () => void;
    onselectall?: () => void;
    ondeselectall?: () => void;
    onclearfilters?: () => void;
    onclearsort?: () => void;
  }

  let {
    visible = false,
    columns = [],
    onclose,
    onsort,
    onfilter,
    onfilterinput,
    ongroupby,
    ondensity,
    onexport,
    onhidecolumn,
    onshowallcolumns,
    onselectall,
    ondeselectall,
    onclearfilters,
    onclearsort,
  }: Props = $props();

  // State
  let searchQuery = $state('');
  let selectedIndex = $state(0);
  let recentCommands = $state<string[]>([]);

  // Local storage for recent commands
  const STORAGE_KEY = 'tc-cmd-palette-recent';

  function loadRecentCommands() {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  function saveRecentCommands(commands: string[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(commands.slice(0, 5)));
    } catch {
      // Silently fail if localStorage unavailable
    }
  }

  // Build dynamic command list
  const buildCommands = (): CommandAction[] => {
    const cmds: CommandAction[] = [];

    // Sort commands — limit to first 5 columns to keep list manageable
    if (onsort && columns.length > 0) {
      const sortCols = columns.filter(c => c.type !== 'image' && c.type !== 'actions').slice(0, 5);
      for (const col of sortCols) {
        cmds.push({
          id: `sort-${col.key}-asc`,
          label: `Sort ${col.label} ascending`,
          category: 'Sort',
          icon: '↑',
          action: () => {
            onsort?.(col.key, 'asc');
            addRecentCommand(`sort-${col.key}-asc`);
            onclose();
          },
        });

        cmds.push({
          id: `sort-${col.key}-desc`,
          label: `Sort ${col.label} descending`,
          category: 'Sort',
          icon: '↓',
          action: () => {
            onsort?.(col.key, 'desc');
            addRecentCommand(`sort-${col.key}-desc`);
            onclose();
          },
        });
      }
    }

    // Filter commands
    if (onfilterinput) {
      cmds.push({
        id: 'filter-open',
        label: 'Open filter',
        category: 'Filter',
        icon: '⊙',
        action: () => {
          // Focus the filter input
          onfilterinput?.();
          addRecentCommand('filter-open');
          onclose();
        },
      });
    }

    if (onclearfilters) {
      cmds.push({
        id: 'clear-filters',
        label: 'Clear all filters',
        category: 'Filter',
        icon: '✕',
        action: () => {
          onclearfilters?.();
          addRecentCommand('clear-filters');
          onclose();
        },
      });
    }

    // Group commands
    if (ongroupby && columns.length > 0) {
      cmds.push({
        id: 'group-clear',
        label: 'Clear grouping',
        category: 'Group',
        icon: '⊞',
        action: () => {
          ongroupby?.(null);
          addRecentCommand('group-clear');
          onclose();
        },
      });

      for (const col of columns) {
        cmds.push({
          id: `group-${col.key}`,
          label: `Group by ${col.label}`,
          category: 'Group',
          icon: '⊞',
          action: () => {
            ongroupby?.(col.key);
            addRecentCommand(`group-${col.key}`);
            onclose();
          },
        });
      }
    }

    // Hide column commands
    if (onhidecolumn && columns.length > 0) {
      for (const col of columns) {
        cmds.push({
          id: `hide-${col.key}`,
          label: `Hide ${col.label}`,
          category: 'View',
          icon: '👁',
          action: () => {
            onhidecolumn?.(col.key);
            addRecentCommand(`hide-${col.key}`);
            onclose();
          },
        });
      }
    }

    // Show all columns
    if (onshowallcolumns) {
      cmds.push({
        id: 'show-all-columns',
        label: 'Show all columns',
        category: 'View',
        icon: '👁',
        action: () => {
          onshowallcolumns?.();
          addRecentCommand('show-all-columns');
          onclose();
        },
      });
    }

    // Density commands
    if (ondensity) {
      cmds.push({
        id: 'density-compact',
        label: 'Compact view',
        category: 'Density',
        icon: '◀',
        action: () => {
          ondensity?.('compact');
          addRecentCommand('density-compact');
          onclose();
        },
      });

      cmds.push({
        id: 'density-comfortable',
        label: 'Comfortable view',
        category: 'Density',
        icon: '◆',
        action: () => {
          ondensity?.('comfortable');
          addRecentCommand('density-comfortable');
          onclose();
        },
      });

      cmds.push({
        id: 'density-spacious',
        label: 'Spacious view',
        category: 'Density',
        icon: '▶',
        action: () => {
          ondensity?.('spacious');
          addRecentCommand('density-spacious');
          onclose();
        },
      });
    }

    // Export commands
    if (onexport) {
      cmds.push({
        id: 'export-csv',
        label: 'Export as CSV',
        category: 'Export',
        icon: '↓',
        action: () => {
          onexport?.('csv');
          addRecentCommand('export-csv');
          onclose();
        },
      });

      cmds.push({
        id: 'export-json',
        label: 'Export as JSON',
        category: 'Export',
        icon: '↓',
        action: () => {
          onexport?.('json');
          addRecentCommand('export-json');
          onclose();
        },
      });

      cmds.push({
        id: 'export-clipboard',
        label: 'Copy to clipboard',
        category: 'Export',
        icon: '📋',
        action: () => {
          onexport?.('clipboard');
          addRecentCommand('export-clipboard');
          onclose();
        },
      });
    }

    // Select commands
    if (onselectall) {
      cmds.push({
        id: 'select-all',
        label: 'Select all',
        category: 'Select',
        icon: '☑',
        action: () => {
          onselectall?.();
          addRecentCommand('select-all');
          onclose();
        },
      });
    }

    if (ondeselectall) {
      cmds.push({
        id: 'deselect-all',
        label: 'Deselect all',
        category: 'Select',
        icon: '☐',
        action: () => {
          ondeselectall?.();
          addRecentCommand('deselect-all');
          onclose();
        },
      });
    }

    // Edit commands
    if (onclearsort) {
      cmds.push({
        id: 'clear-sort',
        label: 'Clear sort',
        category: 'Edit',
        icon: '⇄',
        action: () => {
          onclearsort?.();
          addRecentCommand('clear-sort');
          onclose();
        },
      });
    }

    return cmds;
  };

  const allCommands = $derived(buildCommands());

  // Fuzzy search
  function fuzzyMatch(query: string, text: string): boolean {
    if (!query) return true;
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    let qi = 0;
    for (let i = 0; i < t.length && qi < q.length; i++) {
      if (t[i] === q[qi]) qi++;
    }
    return qi === q.length;
  }

  // Filtered and grouped commands
  const filteredCommands = $derived.by(() => {
    let results = allCommands.filter(cmd =>
      fuzzyMatch(searchQuery, cmd.label)
    );

    // Sort by recent first
    results.sort((a, b) => {
      const aRecent = recentCommands.indexOf(a.id);
      const bRecent = recentCommands.indexOf(b.id);
      if (aRecent !== -1 && bRecent !== -1) return aRecent - bRecent;
      if (aRecent !== -1) return -1;
      if (bRecent !== -1) return 1;
      return 0;
    });

    // Group by category
    const grouped = new Map<string, CommandAction[]>();
    const categoryOrder = ['Sort', 'Filter', 'Group', 'View', 'Density', 'Export', 'Navigate', 'Select', 'Edit'];

    for (const cmd of results) {
      if (!grouped.has(cmd.category)) {
        grouped.set(cmd.category, []);
      }
      grouped.get(cmd.category)!.push(cmd);
    }

    // Build ordered result with category headers
    const ordered: (CommandAction | { __categoryHeader: string })[] = [];
    for (const cat of categoryOrder) {
      if (grouped.has(cat)) {
        ordered.push({ __categoryHeader: cat });
        ordered.push(...grouped.get(cat)!);
      }
    }

    return ordered;
  });

  // Flatten for indexing
  const flatCommands = $derived(
    filteredCommands.filter(
      (item): item is CommandAction => !('__categoryHeader' in item)
    )
  );

  function addRecentCommand(id: string) {
    recentCommands = [id, ...recentCommands.filter(x => x !== id)].slice(0, 5);
    saveRecentCommands(recentCommands);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!visible) {
      // Global Cmd+K / Ctrl+K handler
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Would trigger visible = true, but we can't modify parent state directly
        // This component only handles visible = true case
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      onclose();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, Math.max(0, flatCommands.length - 1));
      // Scroll selected item into view
      setTimeout(() => {
        const selected = document.querySelector('.tc-cmd-palette-item.selected');
        if (selected) {
          selected.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 0);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      // Scroll selected item into view
      setTimeout(() => {
        const selected = document.querySelector('.tc-cmd-palette-item.selected');
        if (selected) {
          selected.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 0);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = flatCommands[selectedIndex];
      if (cmd) {
        cmd.action();
      }
      return;
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onclose();
    }
  }

  // Reset selected index when search changes
  $effect(() => {
    searchQuery;
    selectedIndex = 0;
  });

  // Load recent commands on mount
  $effect(() => {
    recentCommands = loadRecentCommands();
  });

  // Focus input when palette opens
  let inputRef: HTMLInputElement | undefined = $state();
  $effect(() => {
    if (visible && inputRef) {
      // Use setTimeout to defer focus until after animation starts
      setTimeout(() => inputRef?.focus(), 0);
    }
  });

  onDestroy(() => {
    // Cleanup
  });
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if visible}
  <div
    class="tc-cmd-palette-backdrop"
    role="presentation"
    onmousedown={handleBackdropClick}
  >
    <div
      class="tc-cmd-palette-container"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <!-- Search input -->
      <div class="tc-cmd-palette-search">
        <svg
          class="tc-cmd-palette-search-icon"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="7" cy="7" r="5" />
          <path d="M12 12l2.5 2.5" />
        </svg>

        <input
          type="text"
          class="tc-cmd-palette-input"
          placeholder="Search commands..."
          bind:value={searchQuery}
          bind:this={inputRef}
          aria-label="Search commands"
          spellcheck={false}
        />
      </div>

      <!-- Results -->
      <div class="tc-cmd-palette-results">
        {#if flatCommands.length > 0}
          {#each filteredCommands as item, _idx}
            {#if '__categoryHeader' in item}
              <div class="tc-cmd-palette-category">{item.__categoryHeader}</div>
            {:else}
              {@const cmdIndex = flatCommands.indexOf(item)}
              <button
                class="tc-cmd-palette-item"
                class:selected={cmdIndex === selectedIndex}
                type="button"
                onmousedown={() => (selectedIndex = cmdIndex)}
                onmouseup={() => item.action()}
                onmouseover={() => (selectedIndex = cmdIndex)}
                onfocus={() => (selectedIndex = cmdIndex)}
                aria-label={item.label}
              >
                {#if item.icon}
                  <span class="tc-cmd-palette-item-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                {/if}

                <span class="tc-cmd-palette-item-label">{item.label}</span>

                {#if item.shortcut}
                  <span class="tc-cmd-palette-item-shortcut">{item.shortcut}</span>
                {/if}
              </button>
            {/if}
          {/each}
        {:else}
          <div class="tc-cmd-palette-empty">
            {#if searchQuery}
              No commands found for "{searchQuery}"
            {:else}
              Start typing to see commands
            {/if}
          </div>
        {/if}
      </div>

      <!-- Footer hint -->
      <div class="tc-cmd-palette-footer">
        <span class="tc-cmd-palette-hint">
          <kbd>↑↓</kbd> navigate
          <kbd>↵</kbd> select
          <kbd>esc</kbd> close
        </span>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Animations */
  @keyframes tc-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes tc-slide-down {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Backdrop */
  .tc-cmd-palette-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 10vh;
    background: rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(4px);
    z-index: 9999;
    animation: tc-fade-in 0.15s ease-out;
  }

  /* Container */
  .tc-cmd-palette-container {
    width: 480px;
    max-height: 400px;
    background: var(--tc-color-background, #ffffff);
    border-radius: var(--tc-border-radius, 12px);
    border: var(--tc-border-color, 1px solid #f0f0f0);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
                0 10px 10px -5px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: tc-slide-down 0.2s ease-out;
  }

  /* Search input area */
  .tc-cmd-palette-search {
    position: relative;
    padding: var(--tc-spacing, 12px) 16px;
    border-bottom: 1px solid #f0f0f0;
    background: var(--tc-color-background, #ffffff);
    display: flex;
    align-items: center;
  }

  .tc-cmd-palette-search-icon {
    position: absolute;
    left: 16px;
    color: var(--tc-color-text-muted, #a3a3a3);
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    pointer-events: none;
  }

  .tc-cmd-palette-input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 8px 12px 8px 36px;
    font-size: var(--tc-font-size, 13px);
    font-family: inherit;
    color: var(--tc-color-text, #0a0a0a);
    outline: none;
    appearance: none;
    -webkit-appearance: none;
  }

  .tc-cmd-palette-input::placeholder {
    color: var(--tc-color-text-placeholder, #a3a3a3);
  }

  .tc-cmd-palette-input:focus-visible {
    outline: none;
  }

  /* Results list */
  .tc-cmd-palette-results {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* Category header */
  .tc-cmd-palette-category {
    padding: 6px 16px 4px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--tc-color-text-muted, #a3a3a3);
    user-select: none;
  }

  .tc-cmd-palette-category:first-child {
    padding-top: 8px;
  }

  /* Individual command item */
  .tc-cmd-palette-item {
    width: 100%;
    padding: 8px 12px;
    margin: 0;
    border: none;
    background: transparent;
    color: var(--tc-color-text, #0a0a0a);
    font-size: var(--tc-font-size, 13px);
    font-family: inherit;
    text-align: left;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: background-color 0.1s ease;
    outline: none;
  }

  .tc-cmd-palette-item:hover {
    background-color: #f5f5f5;
  }

  .tc-cmd-palette-item.selected {
    background-color: #f5f5f5;
  }

  .tc-cmd-palette-item-icon {
    width: 16px;
    flex-shrink: 0;
    text-align: center;
    color: var(--tc-color-text-muted, #a3a3a3);
    font-size: 14px;
  }

  .tc-cmd-palette-item-label {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tc-cmd-palette-item-shortcut {
    font-size: 11px;
    color: var(--tc-color-text-muted, #a3a3a3);
    white-space: nowrap;
  }

  /* Empty state */
  .tc-cmd-palette-empty {
    padding: 24px 16px;
    text-align: center;
    color: var(--tc-color-text-muted, #a3a3a3);
    font-size: var(--tc-font-size, 13px);
  }

  /* Footer */
  .tc-cmd-palette-footer {
    padding: 8px 12px;
    border-top: 1px solid #f0f0f0;
    background: #fafafa;
    font-size: 11px;
    color: var(--tc-color-text-muted, #a3a3a3);
    display: flex;
    justify-content: flex-end;
  }

  .tc-cmd-palette-hint {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  kbd {
    padding: 2px 6px;
    background: var(--tc-color-background, #ffffff);
    border: 1px solid #e5e5e5;
    border-radius: 4px;
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 10px;
    font-weight: 500;
  }

  /* Scrollbar styling */
  .tc-cmd-palette-results::-webkit-scrollbar {
    width: 6px;
  }

  .tc-cmd-palette-results::-webkit-scrollbar-track {
    background: transparent;
  }

  .tc-cmd-palette-results::-webkit-scrollbar-thumb {
    background: #d3d3d3;
    border-radius: 3px;
  }

  .tc-cmd-palette-results::-webkit-scrollbar-thumb:hover {
    background: #999999;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .tc-cmd-palette-container {
      width: calc(100% - 32px);
      max-height: calc(100vh - 100px);
    }
  }
</style>
