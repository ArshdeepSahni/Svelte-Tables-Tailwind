<script lang="ts">
  type ViewMode = 'table' | 'kanban' | 'gallery' | 'list' | 'timeline';

  interface Props {
    mode: ViewMode;
    onchange: (mode: ViewMode) => void;
  }

  let { mode, onchange }: Props = $props();

  const viewOptions: Array<{ id: ViewMode; label: string; icon: string }> = [
    {
      id: 'table',
      label: 'Table',
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="4" height="4" stroke="currentColor" stroke-width="1"/>
        <rect x="7" y="2" width="7" height="4" stroke="currentColor" stroke-width="1"/>
        <rect x="2" y="7" width="4" height="7" stroke="currentColor" stroke-width="1"/>
        <rect x="7" y="7" width="7" height="7" stroke="currentColor" stroke-width="1"/>
      </svg>`,
    },
    {
      id: 'kanban',
      label: 'Kanban',
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="3" height="12" stroke="currentColor" stroke-width="1"/>
        <rect x="6.5" y="2" width="3" height="12" stroke="currentColor" stroke-width="1"/>
        <rect x="11" y="2" width="3" height="12" stroke="currentColor" stroke-width="1"/>
      </svg>`,
    },
    {
      id: 'gallery',
      label: 'Gallery',
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="4" height="4" stroke="currentColor" stroke-width="1"/>
        <rect x="7" y="2" width="7" height="4" stroke="currentColor" stroke-width="1"/>
        <rect x="2" y="7" width="4" height="7" stroke="currentColor" stroke-width="1"/>
        <rect x="7" y="7" width="7" height="7" stroke="currentColor" stroke-width="1"/>
      </svg>`,
    },
    {
      id: 'list',
      label: 'List',
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <line x1="3" y1="3" x2="13" y2="3" stroke="currentColor" stroke-width="1"/>
        <line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" stroke-width="1"/>
        <line x1="3" y1="13" x2="13" y2="13" stroke="currentColor" stroke-width="1"/>
      </svg>`,
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="3" cy="4" r="1.5" fill="currentColor"/>
        <line x1="3" y1="5" x2="3" y2="10" stroke="currentColor" stroke-width="1"/>
        <circle cx="3" cy="12" r="1.5" fill="currentColor"/>
        <line x1="5" y1="4" x2="12" y2="4" stroke="currentColor" stroke-width="1"/>
        <line x1="5" y1="12" x2="12" y2="12" stroke="currentColor" stroke-width="1"/>
      </svg>`,
    },
  ];

  function handleModeChange(newMode: ViewMode) {
    onchange(newMode);
  }
</script>

<div class="tc-view-switcher">
  {#each viewOptions as option (option.id)}
    <button
      type="button"
      class="tc-view-button"
      class:tc-view-button--active={mode === option.id}
      onclick={() => handleModeChange(option.id)}
      title={option.label}
      aria-label={option.label}
      aria-pressed={mode === option.id}
    >
      {@html option.icon}
    </button>
  {/each}
</div>

<style>
  .tc-view-switcher {
    display: inline-flex;
    align-items: center;
    gap: 0;
    padding: 4px;
    background: var(--tc-bg-secondary, #f5f5f5);
    border-radius: 8px;
    height: 32px;
  }

  .tc-view-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--tc-text-secondary, #666666);
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.12s ease-out;
    font-size: 0;
  }

  .tc-view-button:hover:not(.tc-view-button--active) {
    background: var(--tc-bg-hover, #eeeeee);
    color: var(--tc-text-primary, #0a0a0a);
  }

  .tc-view-button--active {
    background: var(--tc-text-primary, #0a0a0a);
    color: var(--tc-bg-primary, #ffffff);
  }

  .tc-view-button:focus-visible {
    outline: 1px solid var(--tc-text-primary, #0a0a0a);
    outline-offset: 1px;
  }

  .tc-view-button :global(svg) {
    width: 16px;
    height: 16px;
  }
</style>
