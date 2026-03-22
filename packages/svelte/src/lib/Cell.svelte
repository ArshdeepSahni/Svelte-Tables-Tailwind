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
{:else if descriptor.kind === 'rating'}
  <span class="tc-rating" aria-label="{descriptor.value} out of {descriptor.max ?? 5}">
    {#each Array.from({ length: descriptor.max ?? 5 }) as _, i}
      <span
        class="tc-star {i < Math.round(descriptor.value) ? 'tc-star--filled' : ''}"
        aria-hidden="true"
      >★</span>
    {/each}
  </span>
{:else if descriptor.kind === 'progress'}
  <div
    class="tc-progress"
    role="progressbar"
    aria-valuenow={descriptor.value}
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div class="tc-progress-bar" style="width: {Math.min(100, Math.max(0, descriptor.value))}%"></div>
    <span class="tc-progress-label">{Math.round(descriptor.value)}%</span>
  </div>
{:else if descriptor.kind === 'relative-time'}
  <time datetime={descriptor.iso} title={descriptor.absolute} class="tc-relative-time">{descriptor.relative}</time>
{:else if descriptor.kind === 'color'}
  <span class="tc-color-swatch">
    <span class="tc-color-dot" style="background: {descriptor.hex}"></span>
    {descriptor.hex}
  </span>
{:else}
  <span>{String(descriptor.value)}</span>
{/if}

<style>
  /* Numbers — right-aligned monospace tabular */
  .tc-num {
    display: block;
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum';
    font-weight: var(--tc-font-weight-medium, 500);
    color: var(--tc-color-text, #0a0a0a);
  }

  /* Links */
  .tc-link {
    color: var(--tc-color-info, #1d4ed8);
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: border-color 0.15s ease, color 0.15s ease;
  }
  .tc-link:hover {
    border-bottom-color: var(--tc-color-info, #1d4ed8);
  }

  /* Images — avatar circle */
  .tc-img {
    width: var(--tc-img-size, 28px);
    height: var(--tc-img-size, 28px);
    border-radius: var(--tc-img-border-radius, 50%);
    border: 1.5px solid var(--tc-color-border, #f0f0f0);
    object-fit: cover;
    display: block;
  }

  /* Code — monospace, subtle background */
  .tc-code {
    font-family: var(--tc-font-family-mono, ui-monospace, 'JetBrains Mono', 'Cascadia Code', Menlo, monospace);
    font-size: var(--tc-font-size-sm, 11px);
    background: var(--tc-color-bg-code, #f5f5f5);
    color: var(--tc-color-text, #0a0a0a);
    padding: 0.15em 0.45em;
    border-radius: var(--tc-border-radius-xs, 4px);
    border: none;
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
    font-weight: var(--tc-font-weight-bold, 700);
    line-height: 1;
  }
  .tc-bool--true {
    background: var(--tc-color-success-bg, #f0fdf4);
    color: var(--tc-color-success, #15803d);
  }
  .tc-bool--false {
    background: var(--tc-color-danger-bg, #fff1f2);
    color: var(--tc-color-danger, #be123c);
  }

  /* Badge — pill, monochrome default, semantic variants */
  .tc-badge {
    display: inline-flex;
    align-items: center;
    padding: var(--tc-badge-padding, 2px 8px);
    border-radius: var(--tc-badge-border-radius, 9999px);
    font-size: var(--tc-badge-font-size, 11px);
    font-weight: var(--tc-badge-font-weight, 500);
    letter-spacing: 0.02em;
    line-height: 1.25;
    border: none;
  }
  .tc-badge--default {
    background: var(--tc-color-neutral-bg, #f5f5f5);
    color: var(--tc-color-neutral, #525252);
  }
  .tc-badge--success {
    background: var(--tc-color-success-bg, #f0fdf4);
    color: var(--tc-color-success, #15803d);
  }
  .tc-badge--warning {
    background: var(--tc-color-warning-bg, #fffbeb);
    color: var(--tc-color-warning, #b45309);
  }
  .tc-badge--danger {
    background: var(--tc-color-danger-bg, #fff1f2);
    color: var(--tc-color-danger, #be123c);
  }
  .tc-badge--info {
    background: var(--tc-color-info-bg, #eff6ff);
    color: var(--tc-color-info, #1d4ed8);
  }

  /* Status — pulse dot, pill */
  .tc-status {
    display: inline-flex;
    align-items: center;
    padding: var(--tc-badge-padding, 2px 8px);
    padding-left: 6px;
    border-radius: var(--tc-badge-border-radius, 9999px);
    font-size: var(--tc-badge-font-size, 11px);
    font-weight: var(--tc-badge-font-weight, 500);
    letter-spacing: 0.02em;
    gap: 0.35rem;
    border: none;
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
  .tc-status--default  { background: var(--tc-color-neutral-bg, #f5f5f5); color: var(--tc-color-neutral, #525252); }
  .tc-status--success  { background: var(--tc-color-success-bg, #f0fdf4); color: var(--tc-color-success, #15803d); }
  .tc-status--warning  { background: var(--tc-color-warning-bg, #fffbeb); color: var(--tc-color-warning, #b45309); }
  .tc-status--danger   { background: var(--tc-color-danger-bg, #fff1f2); color: var(--tc-color-danger, #be123c); }
  .tc-status--info     { background: var(--tc-color-info-bg, #eff6ff); color: var(--tc-color-info, #1d4ed8); }

  /* Pulse animation for success status dot only */
  @keyframes tc-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  .tc-status--success::before {
    animation: tc-pulse 3s ease-in-out infinite;
  }

  /* Rating — star display */
  .tc-rating {
    display: inline-flex;
    align-items: center;
    gap: 1px;
    line-height: 1;
    font-size: 0.875rem;
  }

  .tc-star {
    color: var(--tc-color-border, #f0f0f0);
    transition: color 0.1s ease;
  }

  .tc-star--filled {
    color: #f59e0b;
  }

  /* Progress bar */
  .tc-progress {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 80px;
    position: relative;
  }

  .tc-progress-bar {
    border-radius: var(--tc-border-radius-pill, 9999px);
    height: 5px;
    flex: 1;
    max-width: 80px;
    background-color: var(--tc-color-border, #f0f0f0);
    background-image: linear-gradient(
      to right,
      var(--tc-color-accent, #0a0a0a) var(--tc-progress-pct, 0%),
      transparent var(--tc-progress-pct, 0%)
    );
  }

  .tc-progress-label {
    font-size: var(--tc-font-size-sm, 11px);
    font-variant-numeric: tabular-nums;
    color: var(--tc-color-text-muted, #a3a3a3);
    white-space: nowrap;
    min-width: 2.5rem;
    text-align: right;
  }

  /* Relative time */
  .tc-relative-time {
    color: var(--tc-color-text-secondary, #737373);
    font-size: var(--tc-font-size, 13px);
    cursor: default;
  }

  /* Color swatch */
  .tc-color-swatch {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-family: var(--tc-font-family-mono, ui-monospace, monospace);
    font-size: var(--tc-font-size-sm, 11px);
    color: var(--tc-color-text-secondary, #737373);
  }

  .tc-color-dot {
    display: inline-block;
    width: 0.875rem;
    height: 0.875rem;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
  }
</style>
