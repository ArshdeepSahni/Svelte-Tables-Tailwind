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
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
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
  }

  .tc-search-icon {
    position: absolute;
    left: 0;
    color: var(--tc-color-text-muted, #a3a3a3);
    pointer-events: none;
    display: flex;
    align-items: center;
  }

  .tc-search-input {
    border: var(--tc-search-border, none);
    border-bottom: var(--tc-search-border-bottom, 1.5px solid #e5e5e5);
    border-radius: var(--tc-search-border-radius, 0);
    background: transparent;
    padding: 6px 0 6px 20px;
    font-size: var(--tc-font-size, 13px);
    font-family: inherit;
    color: var(--tc-color-text, #0a0a0a);
    min-width: var(--tc-search-min-width, 180px);
    outline: none;
    box-shadow: none;
    transition: border-color 0.15s ease;
    -webkit-appearance: none;
  }

  .tc-search-input::placeholder {
    color: var(--tc-color-text-placeholder, #a3a3a3);
  }

  .tc-search-input:focus-visible {
    border-bottom-color: var(--tc-color-border-input-focus, #0a0a0a);
    outline: none;
    box-shadow: none;
  }

  /* Clear button */
  .tc-search-clear {
    position: absolute;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--tc-color-text-muted, #a3a3a3);
    padding: 2px;
    border-radius: 50%;
    transition: color 0.1s ease;
    line-height: 1;
  }

  .tc-search-clear:hover {
    color: var(--tc-color-text, #0a0a0a);
  }
</style>
