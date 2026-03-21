<script lang="ts">
  /**
   * @tablecraft/svelte — Table component stub
   *
   * Phase 1 scaffold: Svelte 5 runes, zero defects.
   * Full implementation in Phase 3.
   *
   * FOUND-07: No at-html — all cell values rendered via text binding
   * FOUND-08: No CDN Tailwind — CSS custom properties (--tc-*) used instead
   * FOUND-09: No type-switcher select — column types are inferred/declared, never runtime-switched
   * FOUND-04: Svelte 5 runes ($props, $state, $derived) — not Svelte 3 reactive declarations
   */

  import type { ColumnDefinition, ColumnType } from '@tablecraft/core';

  type Row = Record<string, unknown>;

  interface Props {
    /** Source data rows */
    data: Row[];
    /**
     * Column definitions or short-form type overrides.
     * Short: { avatar: 'image', price: 'currency' }
     * Long: [{ key: 'avatar', type: 'image', label: 'Photo' }]
     * Omit for zero-config auto-inference (Phase 2).
     */
    columns?: Record<string, ColumnType> | ColumnDefinition<Row>[];
    /** Accessible label for the table */
    caption?: string;
  }

  let { data = [], columns, caption }: Props = $props();

  /**
   * Derive column keys from column config (if provided) or from first data row.
   * Phase 3 will expand this to support ColumnDefinition[] ordering and label overrides.
   */
  const columnKeys = $derived(
    (() => {
      if (columns && !Array.isArray(columns)) {
        // Short-form Record<string, ColumnType> — use declared key order
        return Object.keys(columns as Record<string, ColumnType>);
      }
      if (columns && Array.isArray(columns)) {
        // Long-form ColumnDefinition[] — use declared order
        return (columns as ColumnDefinition<Row>[]).map((c) => c.key);
      }
      // Zero-config: derive from first row
      return data.length > 0 ? Object.keys(data[0] as Record<string, unknown>) : [];
    })()
  );

  /** Get display label for a column key — Phase 3 will use ColumnDefinition.label */
  function getLabel(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /** Render a cell value safely — Phase 2 replaces with typed renderer components */
  function renderCell(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
</script>

<!--
  @tablecraft/svelte Phase 1 stub.
  Uses CSS custom properties (--tc-*) instead of Tailwind CDN (FOUND-08).
  No at-html — all values are text (FOUND-07).
  No type-switcher select in headers (FOUND-09).
  Svelte 5 runes: $props, $derived (FOUND-04).
-->
<div class="tc-table-wrapper" role="region" aria-label={caption ?? 'Data table'}>
  {#if data.length === 0}
    <p class="tc-empty-state">No data to display.</p>
  {:else}
    <table class="tc-table" role="grid">
      {#if caption}
        <caption class="tc-caption">{caption}</caption>
      {/if}
      <thead>
        <tr>
          {#each columnKeys as key}
            <th scope="col" class="tc-th">{getLabel(key)}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each data as row}
          <tr class="tc-tr">
            {#each columnKeys as key}
              <td class="tc-td">
                {renderCell((row as Record<string, unknown>)[key])}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  /* CSS custom property design tokens — replaces Tailwind CDN (FOUND-08) */
  .tc-table-wrapper {
    overflow-x: auto;
    border: 1px solid var(--tc-border-color, #e5e7eb);
    border-radius: var(--tc-border-radius, 0.5rem);
  }

  .tc-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--tc-font-size, 0.875rem);
    font-family: var(--tc-font-family, inherit);
  }

  .tc-th {
    padding: var(--tc-spacing-3, 0.75rem) var(--tc-spacing-4, 1rem);
    text-align: left;
    font-weight: 600;
    background-color: var(--tc-header-bg, #f9fafb);
    color: var(--tc-header-color, #374151);
    border-bottom: 1px solid var(--tc-border-color, #e5e7eb);
  }

  .tc-td {
    padding: var(--tc-spacing-3, 0.75rem) var(--tc-spacing-4, 1rem);
    border-bottom: 1px solid var(--tc-border-color, #e5e7eb);
    color: var(--tc-cell-color, #111827);
  }

  .tc-tr:last-child .tc-td {
    border-bottom: none;
  }

  .tc-tr:hover {
    background-color: var(--tc-row-hover-bg, #f3f4f6);
  }

  .tc-empty-state {
    padding: var(--tc-spacing-4, 1rem);
    text-align: center;
    color: var(--tc-muted-color, #6b7280);
  }

  .tc-caption {
    padding: var(--tc-spacing-3, 0.75rem);
    font-weight: 600;
    text-align: left;
    color: var(--tc-header-color, #374151);
  }
</style>
