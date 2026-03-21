<script lang="ts">
  /**
   * @tablecraft/svelte — SearchInput component
   *
   * Debounced global search input with onfilter callback prop.
   * Debounce: 150ms via setTimeout.
   * Svelte 5 runes: $props(), $state() — no createEventDispatcher.
   * Clears debounce timer on destroy to prevent memory leaks.
   */

  import { onDestroy } from 'svelte';

  interface Props {
    placeholder?: string;
    onfilter: (value: string) => void;
  }

  let { placeholder = 'Search\u2026', onfilter }: Props = $props();

  let inputValue = $state('');
  let debounceTimer: number | undefined;

  function handleInput(e: Event) {
    inputValue = (e.target as HTMLInputElement).value;
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      onfilter(inputValue);
    }, 150);
  }

  onDestroy(() => window.clearTimeout(debounceTimer));
</script>

<div class="tc-search-wrapper">
  <span class="tc-search-icon" aria-hidden="true">
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <circle cx="7" cy="7" r="5"/>
      <path d="M12 12l2.5 2.5"/>
    </svg>
  </span>
  <input
    type="search"
    class="tc-search-input"
    {placeholder}
    value={inputValue}
    oninput={handleInput}
    aria-label="Search table"
  />
</div>

<style>
  .tc-search-wrapper {
    display: flex;
    align-items: center;
    position: relative;
  }

  .tc-search-icon {
    position: absolute;
    left: 0.625rem;
    color: var(--tc-color-muted, #94a3b8);
    pointer-events: none;
    display: flex;
    align-items: center;
  }

  .tc-search-input {
    padding: 0.4rem 0.75rem 0.4rem 2rem;
    border: 1px solid var(--tc-border-color, #e2e8f0);
    border-radius: 0.5rem;
    font-size: 0.8125rem;
    font-family: inherit;
    min-width: 220px;
    background: var(--tc-color-bg, #ffffff);
    color: var(--tc-color-text, #0f172a);
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    line-height: 1.5;
  }

  .tc-search-input:focus-visible {
    outline: none;
    border-color: var(--tc-color-primary, #6366f1);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
  }

  .tc-search-input::placeholder {
    color: var(--tc-color-placeholder, #94a3b8);
  }
</style>
