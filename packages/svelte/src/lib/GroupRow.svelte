<script lang="ts">
  import type { ProcessedGroupRow } from './types.js';

  interface Props {
    group: ProcessedGroupRow;
    columnCount: number;
    selectable?: boolean;
    collapsed: boolean;
    ontoggle?: (label: string) => void;
  }

  let { group, columnCount, selectable = false, collapsed, ontoggle }: Props = $props();

  const colSpan = $derived(columnCount + (selectable ? 1 : 0));
</script>

<tr
  class="tc-group-row"
  role="row"
  onclick={() => ontoggle?.(group.label)}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      ontoggle?.(group.label);
    }
  }}
  tabindex={0}
  aria-expanded={!collapsed}
>
  <td class="tc-group-cell" colspan={colSpan} role="rowheader">
    <span class="tc-group-indicator" aria-hidden="true">{collapsed ? '▶' : '▼'}</span>
    <span class="tc-group-label">{group.label}</span>
    <span class="tc-group-count">({group.count})</span>
  </td>
</tr>

<style>
  .tc-group-row {
    cursor: pointer;
    background: var(--tc-header-bg, #f8fafc);
    user-select: none;
  }

  .tc-group-row:hover {
    background: var(--tc-header-bg-hover, #f1f5f9);
  }

  .tc-group-row:focus-visible {
    outline: 2px solid var(--tc-color-primary, #6366f1);
    outline-offset: -2px;
  }

  .tc-group-cell {
    padding: 0.5rem 1rem;
    border-bottom: 1px solid var(--tc-border-color, #e2e8f0);
    font-weight: 600;
    font-size: 0.8125rem;
    color: var(--tc-color-text, #0f172a);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .tc-group-indicator {
    font-size: 0.625rem;
    color: var(--tc-color-muted, #94a3b8);
    width: 1rem;
    text-align: center;
  }

  .tc-group-label {
    text-transform: capitalize;
  }

  .tc-group-count {
    color: var(--tc-color-muted, #94a3b8);
    font-weight: 400;
  }
</style>
