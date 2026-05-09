<script lang="ts">
  /**
   * @tablecraft/svelte — CellEditor component
   *
   * Type-aware inline cell editor with support for:
   * - Text, number, currency, percentage, boolean, date, datetime, time, email, url
   * - Status/badge dropdowns (from unique column values)
   * - Rating (clickable stars)
   * - Progress (draggable slider)
   *
   * Keyboard shortcuts:
   * - Enter: confirm edit
   * - Escape: cancel edit
   * - Tab: confirm and move to next cell
   * - Tab+Shift: confirm and move to previous cell
   *
   * Design: CSS custom properties only (--tc-*), no Tailwind
   * Edit mode: subtle blue glow border, auto-focus input, auto-select text
   */

  import type { ResolvedColumn } from '@tablecraft/core';

  interface Props {
    value: unknown;
    column: ResolvedColumn;
    row: Record<string, unknown>;
    onconfirm: (newValue: unknown) => void;
    oncancel: () => void;
    onnext?: (direction: 'forward' | 'backward') => void;
  }

  let {
    value,
    column,
    row,
    onconfirm,
    oncancel,
    onnext
  }: Props = $props();

  // Reactive state
  let inputValue = $state(String(value ?? ''));
  let selectedRating = $state(typeof value === 'number' ? value : 0);
  let sliderValue = $state(typeof value === 'number' ? Math.max(0, Math.min(100, value)) : 0);
  let isInvalid = $state(false);
  let inputRef: HTMLInputElement | undefined = $state();
  let sliderRef: HTMLInputElement | undefined = $state();
  // Guard: prevent onblur→cancel from racing with onconfirm
  let confirmed = $state(false);

  // Validation logic per column type
  function validateInput(val: string): boolean {
    const trimmed = val.trim();

    switch (column.type) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
      case 'url':
        try {
          new URL(trimmed);
          return true;
        } catch {
          return false;
        }
      case 'number':
      case 'currency':
      case 'percentage':
        return !isNaN(Number(trimmed)) && trimmed !== '';
      case 'integer':
        return Number.isInteger(Number(trimmed)) && trimmed !== '';
      case 'date':
        return /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
      case 'datetime':
        return !isNaN(new Date(trimmed).getTime()) && trimmed !== '';
      case 'time':
        return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(trimmed);
      default:
        return true;
    }
  }

  // Parse input to proper type
  function parseValue(val: string): unknown {
    const trimmed = val.trim();

    switch (column.type) {
      case 'number':
      case 'currency':
      case 'percentage':
        return Number(trimmed);
      case 'integer':
        return parseInt(trimmed, 10);
      case 'boolean':
        return trimmed.toLowerCase() === 'true' || trimmed === '1';
      case 'date':
      case 'datetime':
      case 'time':
        return trimmed;
      default:
        return trimmed;
    }
  }

  // Confirm edit
  function handleConfirm() {
    if (confirmed) return;
    confirmed = true;

    if (column.type === 'rating' || column.type === 'progress') {
      onconfirm(column.type === 'rating' ? selectedRating : sliderValue);
      return;
    }

    // Validate before confirming
    if (!validateInput(inputValue)) {
      isInvalid = true;
      confirmed = false;
      return;
    }

    const newValue = parseValue(inputValue);
    onconfirm(newValue);
  }

  // Cancel edit — skipped if confirm already fired (prevents blur race)
  function handleCancel() {
    if (confirmed) return;
    oncancel();
  }

  // Handle keyboard events — stopPropagation prevents tbody's keydown from interfering
  function handleKeyDown(e: KeyboardEvent) {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleConfirm();
      if (onnext) {
        onnext(e.shiftKey ? 'backward' : 'forward');
      }
    }
  }

  // Auto-focus on mount for ALL input types (not just text/email/url)
  $effect(() => {
    if (inputRef) {
      inputRef.focus();
      // Select text content for easy overwrite (skip for date/time/color pickers)
      if (['text', 'code', 'email', 'url', 'number', 'currency', 'integer', 'percentage', 'status', 'badge'].includes(column.type)) {
        inputRef.select();
      }
    }
  });

  // Auto-focus slider on mount
  $effect(() => {
    if (sliderRef && (column.type === 'progress')) {
      sliderRef.focus();
    }
  });
</script>

<!-- Boolean: instant checkbox toggle -->
{#if column.type === 'boolean'}
  <label class="tc-editor tc-editor--boolean">
    <input
      type="checkbox"
      checked={Boolean(value)}
      onchange={(e) => {
        const checked = (e.target as HTMLInputElement).checked;
        onconfirm(checked);
      }}
      class="tc-editor-checkbox"
    />
  </label>
{/if}

<!-- Text input -->
{#if column.type === 'text' || column.type === 'code'}
  <input
    type="text"
    bind:value={inputValue}
    onkeydown={handleKeyDown}
    onblur={handleCancel}
    class="tc-editor tc-editor--text {isInvalid ? 'tc-editor--invalid' : ''}"
    bind:this={inputRef}
    placeholder="Enter text"
  />
{/if}

<!-- Email input -->
{#if column.type === 'email'}
  <input
    type="email"
    bind:value={inputValue}
    onkeydown={handleKeyDown}
    onblur={handleCancel}
    class="tc-editor tc-editor--email {isInvalid ? 'tc-editor--invalid' : ''}"
    bind:this={inputRef}
    placeholder="name@example.com"
  />
{/if}

<!-- URL input -->
{#if column.type === 'url'}
  <input
    type="url"
    bind:value={inputValue}
    onkeydown={handleKeyDown}
    onblur={handleCancel}
    class="tc-editor tc-editor--url {isInvalid ? 'tc-editor--invalid' : ''}"
    bind:this={inputRef}
    placeholder="https://example.com"
  />
{/if}

<!-- Number input -->
{#if column.type === 'number' || column.type === 'currency'}
  <input
    type="number"
    bind:value={inputValue}
    onkeydown={handleKeyDown}
    onblur={handleCancel}
    class="tc-editor tc-editor--number {isInvalid ? 'tc-editor--invalid' : ''}"
    bind:this={inputRef}
    step={column.type === 'currency' ? '0.01' : 'any'}
    placeholder="0"
  />
{/if}

<!-- Integer input -->
{#if column.type === 'integer'}
  <input
    type="number"
    bind:value={inputValue}
    onkeydown={handleKeyDown}
    onblur={handleCancel}
    class="tc-editor tc-editor--integer {isInvalid ? 'tc-editor--invalid' : ''}"
    bind:this={inputRef}
    step="1"
    placeholder="0"
  />
{/if}

<!-- Percentage input (0-100 or 0-1) -->
{#if column.type === 'percentage'}
  <input
    type="number"
    bind:value={inputValue}
    onkeydown={handleKeyDown}
    onblur={handleCancel}
    class="tc-editor tc-editor--percentage {isInvalid ? 'tc-editor--invalid' : ''}"
    bind:this={inputRef}
    step="1"
    min="0"
    max="100"
    placeholder="0"
  />
{/if}

<!-- Date input -->
{#if column.type === 'date'}
  <input
    type="date"
    bind:value={inputValue}
    onkeydown={handleKeyDown}
    onblur={handleCancel}
    class="tc-editor tc-editor--date {isInvalid ? 'tc-editor--invalid' : ''}"
    bind:this={inputRef}
  />
{/if}

<!-- DateTime input -->
{#if column.type === 'datetime'}
  <input
    type="datetime-local"
    bind:value={inputValue}
    onkeydown={handleKeyDown}
    onblur={handleCancel}
    class="tc-editor tc-editor--datetime {isInvalid ? 'tc-editor--invalid' : ''}"
    bind:this={inputRef}
  />
{/if}

<!-- Time input -->
{#if column.type === 'time'}
  <input
    type="time"
    bind:value={inputValue}
    onkeydown={handleKeyDown}
    onblur={handleCancel}
    class="tc-editor tc-editor--time {isInvalid ? 'tc-editor--invalid' : ''}"
    bind:this={inputRef}
  />
{/if}

<!-- Status/Badge fallback text input -->
{#if (column.type === 'status' || column.type === 'badge')}
  <input
    type="text"
    bind:value={inputValue}
    onkeydown={handleKeyDown}
    onblur={handleCancel}
    class="tc-editor tc-editor--text"
    bind:this={inputRef}
    placeholder="Enter status"
  />
{/if}

<!-- Rating: clickable stars -->
{#if column.type === 'rating'}
  <div class="tc-editor tc-editor--rating">
    {#each Array.from({ length: 5 }) as _, i}
      <button
        type="button"
        class="tc-editor-star {i < selectedRating ? 'tc-editor-star--filled' : ''}"
        onclick={() => {
          selectedRating = i + 1;
          onconfirm(selectedRating);
        }}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectedRating = i + 1;
            onconfirm(selectedRating);
          }
        }}
        title={`${i + 1} star${i !== 0 ? 's' : ''}`}
        aria-label={`${i + 1} star${i !== 0 ? 's' : ''}`}
      >
        ★
      </button>
    {/each}
  </div>
{/if}

<!-- Progress: draggable slider -->
{#if column.type === 'progress'}
  <div class="tc-editor tc-editor--progress">
    <input
      type="range"
      bind:value={sliderValue}
      min="0"
      max="100"
      onchange={handleConfirm}
      onkeydown={handleKeyDown}
      class="tc-editor-slider"
      bind:this={sliderRef}
    />
    <span class="tc-editor-progress-label">{sliderValue}%</span>
  </div>
{/if}

<!-- Relative-time: date input (stores ISO, displays relative) -->
{#if column.type === 'relative-time'}
  <input
    type="date"
    bind:value={inputValue}
    onkeydown={handleKeyDown}
    onblur={handleCancel}
    class="tc-editor tc-editor--date {isInvalid ? 'tc-editor--invalid' : ''}"
    bind:this={inputRef}
  />
{/if}

<!-- Color: hex color input -->
{#if column.type === 'color'}
  <input
    type="color"
    bind:value={inputValue}
    onkeydown={handleKeyDown}
    onchange={handleConfirm}
    onblur={handleCancel}
    class="tc-editor tc-editor--color"
    bind:this={inputRef}
  />
{/if}

<style>
  /* Container — seamless integration */
  .tc-editor {
    appearance: none;
    width: 100%;
    padding: 0.25rem 0.375rem;
    border: 1px solid var(--tc-color-edit, rgba(59, 130, 246, 0.5));
    border-radius: var(--tc-border-radius-xs, 4px);
    background: var(--tc-color-bg, #ffffff);
    color: var(--tc-color-text, #0a0a0a);
    font-size: var(--tc-font-size, 13px);
    font-family: inherit;
    font-weight: inherit;
    line-height: 1.4;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.3);
  }

  .tc-editor:focus {
    outline: none;
    border-color: rgba(59, 130, 246, 0.8);
    box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.5), 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  .tc-editor--invalid {
    border-color: var(--tc-color-danger, #be123c);
    box-shadow: inset 0 0 0 1px var(--tc-color-danger, #be123c);
  }

  .tc-editor--invalid:focus {
    border-color: var(--tc-color-danger, #be123c);
    box-shadow: inset 0 0 0 1px var(--tc-color-danger, #be123c), 0 0 0 2px rgba(190, 18, 60, 0.2);
  }

  /* Text inputs */
  .tc-editor--text,
  .tc-editor--email,
  .tc-editor--url,
  .tc-editor--code {
    font-family: inherit;
    font-variant-numeric: inherit;
  }

  /* Number inputs */
  .tc-editor--number,
  .tc-editor--integer,
  .tc-editor--percentage {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  /* Date/Time inputs */
  .tc-editor--date,
  .tc-editor--datetime,
  .tc-editor--time {
    font-family: var(--tc-font-family-mono, ui-monospace, monospace);
  }

  /* Select dropdown for status/badge */
  .tc-editor--select {
    cursor: pointer;
  }

  /* Boolean checkbox */
  .tc-editor--boolean {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .tc-editor-checkbox {
    appearance: none;
    width: 1.25rem;
    height: 1.25rem;
    border: 1px solid var(--tc-color-border, #f0f0f0);
    border-radius: var(--tc-border-radius-xs, 4px);
    background: var(--tc-color-bg, #ffffff);
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .tc-editor-checkbox:checked {
    background: var(--tc-color-success, #15803d);
    border-color: var(--tc-color-success, #15803d);
  }

  .tc-editor-checkbox:checked::after {
    content: '✓';
    color: white;
    font-size: 0.75rem;
    font-weight: bold;
  }

  /* Rating: star buttons */
  .tc-editor--rating {
    display: inline-flex;
    gap: 0.25rem;
    align-items: center;
  }

  .tc-editor-star {
    appearance: none;
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    font-size: 1.25rem;
    color: var(--tc-color-border, #f0f0f0);
    cursor: pointer;
    transition: color 0.1s ease, transform 0.1s ease;
    line-height: 1;
  }

  .tc-editor-star:hover,
  .tc-editor-star:focus {
    outline: none;
    color: #f59e0b;
    transform: scale(1.15);
  }

  .tc-editor-star--filled {
    color: #f59e0b;
  }

  /* Progress: slider + label */
  .tc-editor--progress {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
  }

  .tc-editor-slider {
    flex: 1;
    height: 5px;
    appearance: none;
    background: linear-gradient(
      to right,
      var(--tc-color-accent, #0a0a0a) 0%,
      var(--tc-color-accent, #0a0a0a) var(--tc-progress-pct, 50%),
      var(--tc-color-border, #f0f0f0) var(--tc-progress-pct, 50%)
    );
    border-radius: var(--tc-border-radius-pill, 9999px);
    outline: none;
    cursor: pointer;
  }

  .tc-editor-slider::-webkit-slider-thumb {
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--tc-color-accent, #0a0a0a);
    border: 2px solid var(--tc-color-bg, #ffffff);
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .tc-editor-slider::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--tc-color-accent, #0a0a0a);
    border: 2px solid var(--tc-color-bg, #ffffff);
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .tc-editor-progress-label {
    font-size: var(--tc-font-size-sm, 11px);
    font-variant-numeric: tabular-nums;
    color: var(--tc-color-text-muted, #a3a3a3);
    white-space: nowrap;
    min-width: 2.5rem;
    text-align: right;
  }

  /* Color picker */
  .tc-editor--color {
    width: 100%;
    height: 32px;
    padding: 2px;
    border: 1px solid var(--tc-color-border, #f0f0f0);
    border-radius: var(--tc-border-radius-xs, 4px);
    cursor: pointer;
  }
</style>
