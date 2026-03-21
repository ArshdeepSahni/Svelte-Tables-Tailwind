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
  <a class="tc-link" href={descriptor.href} target={descriptor.external ? '_blank' : undefined} rel={descriptor.external ? 'noopener noreferrer' : undefined}>{descriptor.label}</a>
{:else if descriptor.kind === 'image'}
  <img src={descriptor.src} alt={descriptor.alt} class="tc-img" loading="lazy" />
{:else if descriptor.kind === 'badge'}
  <span class="tc-badge tc-badge--{descriptor.variant}">{descriptor.label}</span>
{:else if descriptor.kind === 'status'}
  <span class="tc-status tc-status--{descriptor.variant}" role="status">{descriptor.label}</span>
{:else if descriptor.kind === 'boolean'}
  <span class="tc-bool {descriptor.value ? 'tc-bool--true' : 'tc-bool--false'}" aria-label={descriptor.value ? 'Yes' : 'No'}>{descriptor.value ? '✓' : '✗'}</span>
{:else if descriptor.kind === 'code'}
  <code class="tc-code">{descriptor.value}</code>
{:else if descriptor.kind === 'html'}
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html descriptor.sanitized}
{:else}
  <span>{String(descriptor.value)}</span>
{/if}

<style>
  /* Numbers — right-aligned tabular */
  .tc-num {
    display: block;
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum';
    font-weight: 500;
    color: var(--tc-color-text, #0f172a);
  }

  /* Links */
  .tc-link {
    color: var(--tc-color-primary, #6366f1);
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: border-color 0.15s ease, color 0.15s ease;
  }
  .tc-link:hover {
    border-bottom-color: var(--tc-color-primary, #6366f1);
  }

  /* Images — rounded, constrained */
  .tc-img {
    max-height: var(--tc-img-height, 2rem);
    max-width: var(--tc-img-width, 2rem);
    width: auto;
    height: auto;
    object-fit: cover;
    display: block;
    border-radius: 50%;
    border: 2px solid var(--tc-border-color, #e2e8f0);
  }

  /* Code */
  .tc-code {
    font-family: var(--tc-font-mono, ui-monospace, 'JetBrains Mono', 'Cascadia Code', 'Fira Code', Menlo, monospace);
    font-size: 0.8125rem;
    background: var(--tc-color-bg-code, #f1f5f9);
    color: var(--tc-color-code, #7c3aed);
    padding: 0.15em 0.45em;
    border-radius: 0.3125rem;
    border: 1px solid var(--tc-border-color, #e2e8f0);
  }

  /* Boolean */
  .tc-bool {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    font-size: 0.7rem;
    font-weight: 700;
    line-height: 1;
  }
  .tc-bool--true {
    background: #dcfce7;
    color: #15803d;
  }
  .tc-bool--false {
    background: #fee2e2;
    color: #b91c1c;
  }

  /* Badge — pill with ring */
  .tc-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.2rem 0.6rem;
    border-radius: 9999px;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    line-height: 1.25;
    border: 1px solid transparent;
  }
  .tc-badge--default {
    background: #f1f5f9;
    color: #475569;
    border-color: #e2e8f0;
  }
  .tc-badge--success {
    background: #f0fdf4;
    color: #15803d;
    border-color: #bbf7d0;
  }
  .tc-badge--warning {
    background: #fffbeb;
    color: #b45309;
    border-color: #fde68a;
  }
  .tc-badge--danger {
    background: #fff1f2;
    color: #be123c;
    border-color: #fecdd3;
  }
  .tc-badge--info {
    background: #eef2ff;
    color: #4338ca;
    border-color: #c7d2fe;
  }

  /* Status — pulse dot */
  .tc-status {
    display: inline-flex;
    align-items: center;
    padding: 0.2rem 0.6rem 0.2rem 0.45rem;
    border-radius: 9999px;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    gap: 0.35rem;
    border: 1px solid transparent;
  }
  .tc-status::before {
    content: '';
    display: inline-block;
    width: 0.4375rem;
    height: 0.4375rem;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }
  .tc-status--default  { background: #f1f5f9; color: #475569; border-color: #e2e8f0; }
  .tc-status--success  { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
  .tc-status--warning  { background: #fffbeb; color: #b45309; border-color: #fde68a; }
  .tc-status--danger   { background: #fff1f2; color: #be123c; border-color: #fecdd3; }
  .tc-status--info     { background: #eef2ff; color: #4338ca; border-color: #c7d2fe; }

  /* Pulse animation for success status */
  @keyframes tc-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  .tc-status--success::before {
    animation: tc-pulse 2s ease-in-out infinite;
  }
</style>
