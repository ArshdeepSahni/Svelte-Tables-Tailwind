<script lang="ts">
  /**
   * @tablecraft/svelte — Cell component
   *
   * CellDescriptor → safe Svelte markup dispatcher.
   * FOUND-07: The ONLY {@html} usage in the entire package is the html kind branch,
   * which renders descriptor.sanitized (already DOMPurify-sanitized by the renderer).
   * All other kinds use text bindings — never raw user data via {@html}.
   */

  import type { CellDescriptor } from '@tablecraft/core';

  interface Props {
    descriptor: CellDescriptor;
  }

  let { descriptor }: Props = $props();
</script>

{#if descriptor.kind === 'text'}
  <span>{descriptor.value}</span>
{:else if descriptor.kind === 'number'}
  <span class="tc-num">{descriptor.formatted}</span>
{:else if descriptor.kind === 'link'}
  <a
    href={descriptor.href}
    target={descriptor.external ? '_blank' : undefined}
    rel={descriptor.external ? 'noopener noreferrer' : undefined}
  >{descriptor.label}</a>
{:else if descriptor.kind === 'image'}
  <img src={descriptor.src} alt={descriptor.alt} class="tc-img" loading="lazy" />
{:else if descriptor.kind === 'badge'}
  <span class="tc-badge tc-badge--{descriptor.variant}">{descriptor.label}</span>
{:else if descriptor.kind === 'status'}
  <span class="tc-status tc-status--{descriptor.variant}" role="status">{descriptor.label}</span>
{:else if descriptor.kind === 'boolean'}
  <span aria-label={descriptor.value ? 'Yes' : 'No'}>{descriptor.value ? '✓' : '✗'}</span>
{:else if descriptor.kind === 'code'}
  <code class="tc-code">{descriptor.value}</code>
{:else if descriptor.kind === 'html'}
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html descriptor.sanitized}
{:else}
  <span>{String(descriptor.value)}</span>
{/if}

<style>
  /* Number cells — right-aligned */
  .tc-num {
    display: inline-block;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  /* Image cells */
  .tc-img {
    max-height: var(--tc-img-height, 2rem);
    object-fit: cover;
    display: block;
  }

  /* Code cells — monospace with subtle background */
  .tc-code {
    font-family: var(--tc-font-mono, ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace);
    font-size: 0.875em;
    background-color: var(--tc-color-bg-code, #f3f4f6);
    color: var(--tc-color-code, #1f2937);
    padding: 0.1em 0.4em;
    border-radius: var(--tc-border-radius-sm, 0.25rem);
    white-space: pre;
  }

  /* Badge — pill/tag styles */
  .tc-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1.25;
  }

  .tc-badge--default {
    background-color: var(--tc-color-badge-default-bg, #f3f4f6);
    color: var(--tc-color-badge-default-text, #374151);
  }

  .tc-badge--success {
    background-color: var(--tc-color-badge-success-bg, #dcfce7);
    color: var(--tc-color-success, #16a34a);
  }

  .tc-badge--warning {
    background-color: var(--tc-color-badge-warning-bg, #fef9c3);
    color: var(--tc-color-warning, #ca8a04);
  }

  .tc-badge--danger {
    background-color: var(--tc-color-badge-danger-bg, #fee2e2);
    color: var(--tc-color-danger, #dc2626);
  }

  .tc-badge--info {
    background-color: var(--tc-color-badge-info-bg, #dbeafe);
    color: var(--tc-color-info, #2563eb);
  }

  /* Status — same pill shape as badge with a subtle left indicator feel */
  .tc-status {
    display: inline-flex;
    align-items: center;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1.25;
    gap: 0.25rem;
  }

  .tc-status::before {
    content: '';
    display: inline-block;
    width: 0.4rem;
    height: 0.4rem;
    border-radius: 50%;
    background-color: currentColor;
    flex-shrink: 0;
  }

  .tc-status--default {
    background-color: var(--tc-color-badge-default-bg, #f3f4f6);
    color: var(--tc-color-badge-default-text, #374151);
  }

  .tc-status--success {
    background-color: var(--tc-color-badge-success-bg, #dcfce7);
    color: var(--tc-color-success, #16a34a);
  }

  .tc-status--warning {
    background-color: var(--tc-color-badge-warning-bg, #fef9c3);
    color: var(--tc-color-warning, #ca8a04);
  }

  .tc-status--danger {
    background-color: var(--tc-color-badge-danger-bg, #fee2e2);
    color: var(--tc-color-danger, #dc2626);
  }

  .tc-status--info {
    background-color: var(--tc-color-badge-info-bg, #dbeafe);
    color: var(--tc-color-info, #2563eb);
  }
</style>
