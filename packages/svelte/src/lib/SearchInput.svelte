<script lang="ts">
  /**
   * @tablecraft/svelte — SearchInput component
   *
   * Clean, minimal search input. No token pills, no operator syntax exposed to users.
   * Just a beautiful underline input that filters across all fields.
   * Debounce: 150ms.
   * Svelte 5 runes: $props(), $state() — no createEventDispatcher.
   */

  import { onDestroy } from 'svelte';

  interface Props {
    placeholder?: string;
    onfilter: (value: string) => void;
  }

  let { placeholder = 'Search...', onfilter }: Props = $props();

  let inputValue = $state('');
  let debounceTimer: number | undefined;

  function handleInput(e: Event) {
    inputValue = (e.target as HTMLInputElement).value;
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      onfilter(inputValue);
    }, 150);
  }

  function clearSearch() {
    inputValue = '';
    onfilter('');
  }

  onDestroy(() => window.clearTimeout(debounceTimer));
</script>

<div class="tc-search">
  <span class="tc-search-icon" aria-hidden="true">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="7" cy="7" r="5"/>
      <path d="M12 12l2.5 2.5"/>
    </svg>
  </span>

  <input
    type="text"
    class="tc-search-input"
    {placeholder}
    value={inputValue}
    oninput={handleInput}
    aria-label="Search"
    autocomplete="off"
    spellcheck={false}
  />

  {#if inputValue}
    <button
      class="tc-search-clear"
      type="button"
      aria-label="Clear search"
      onclick={clearSearch}
      title="Clear search"
    >
      <svg width="12" height="12" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 1l8 8M9 1l-8 8"/>
      </svg>
    </button>
  {/if}
</div>

<style>
  .tc-search {
    position: relative;
    display: inline-flex;
    align-items: center;
    flex: 1;
    max-width: 320px;
  }

  .tc-search-icon {
    position: absolute;
    left: 12px;
    color: var(--tc-color-text-muted, #a3a3a3);
    pointer-events: none;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .tc-search-input {
    width: 100%;
    border: 1px solid var(--tc-search-border-color, #e5e5e5);
    border-radius: var(--tc-search-border-radius, 8px);
    background: var(--tc-search-bg, #f9f9f9);
    padding: 8px 36px 8px 36px;
    font-size: var(--tc-font-size, 13px);
    font-family: inherit;
    color: var(--tc-color-text, #0a0a0a);
    min-width: var(--tc-search-min-width, 240px);
    outline: none;
    box-shadow: none;
    transition: all 0.15s ease;
    -webkit-appearance: none;
  }

  .tc-search-input::placeholder {
    color: var(--tc-color-text-placeholder, #a3a3a3);
  }

  .tc-search-input:focus-visible {
    border-color: var(--tc-color-border-input-focus, #0a0a0a);
    background: var(--tc-search-bg-focus, #ffffff);
    outline: none;
    box-shadow: 0 0 0 2px rgba(10, 10, 10, 0.05);
  }

  /* Clear button */
  .tc-search-clear {
    position: absolute;
    right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--tc-color-text-muted, #a3a3a3);
    padding: 4px;
    border-radius: 4px;
    transition: all 0.15s ease;
    line-height: 1;
    flex-shrink: 0;
  }

  .tc-search-clear:hover {
    color: var(--tc-color-text, #0a0a0a);
    background: rgba(0, 0, 0, 0.05);
  }

  .tc-search-clear:active {
    background: rgba(0, 0, 0, 0.08);
  }
</style>
