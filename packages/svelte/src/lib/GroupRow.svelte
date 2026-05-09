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
    <div class="tc-group-chevron" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6 5.5L10 8.5L6 11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
    <span class="tc-group-label">{group.label}</span>
    <div class="tc-group-badge">{group.count}</div>
  </td>
</tr>

<style>
  .tc-group-row {
    cursor: pointer;
    background: var(--tc-bg-primary, #ffffff);
    border-bottom: 1px solid var(--tc-border-color, #f0f0f0);
    user-select: none;
    transition: background-color 0.08s ease-out;
  }

  .tc-group-row:hover {
    background: var(--tc-bg-hover, #fafafa);
  }

  .tc-group-row:focus-visible {
    outline: 1px solid var(--tc-border-color, #f0f0f0);
    outline-offset: -1px;
  }

  .tc-group-cell {
    padding: 12px 16px;
    font-weight: 500;
    font-size: 0.875rem;
    color: var(--tc-text-primary, #0a0a0a);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .tc-group-chevron {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    color: var(--tc-text-secondary, #666666);
    flex-shrink: 0;
    transition: transform 0.15s cubic-bezier(0.2, 0, 0.38, 0.9);
  }

  .tc-group-row[aria-expanded="false"] .tc-group-chevron {
    transform: rotate(0deg);
  }

  .tc-group-row[aria-expanded="true"] .tc-group-chevron {
    transform: rotate(90deg);
  }

  .tc-group-label {
    flex: 1;
    font-weight: 500;
    color: var(--tc-text-primary, #0a0a0a);
  }

  .tc-group-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px 8px;
    background: var(--tc-bg-secondary, #f0f0f0);
    color: var(--tc-text-secondary, #666666);
    border-radius: 12px;
    font-size: 0.8125rem;
    font-weight: 500;
    flex-shrink: 0;
  }
</style>
