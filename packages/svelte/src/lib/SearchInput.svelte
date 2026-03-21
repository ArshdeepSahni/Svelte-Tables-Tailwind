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
    justify-content: flex-end;
    margin-bottom: var(--tc-spacing-3, 0.75rem);
  }

  .tc-search-input {
    padding: var(--tc-spacing-2, 0.5rem) var(--tc-spacing-3, 0.75rem);
    border: 1px solid var(--tc-border-color, #e5e7eb);
    border-radius: var(--tc-border-radius, 0.375rem);
    font-size: inherit;
    font-family: inherit;
    min-width: 200px;
    outline-offset: 2px;
    background-color: var(--tc-color-bg, #ffffff);
    color: var(--tc-color-text, #111827);
    transition: border-color 0.15s ease;
  }

  .tc-search-input:focus-visible {
    outline: 2px solid var(--tc-color-primary, #2563eb);
    border-color: var(--tc-color-primary, #2563eb);
  }

  .tc-search-input::placeholder {
    color: var(--tc-color-placeholder, #9ca3af);
  }
</style>
