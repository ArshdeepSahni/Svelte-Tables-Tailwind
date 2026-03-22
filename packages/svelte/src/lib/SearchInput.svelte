<script lang="ts">
  /**
   * @tablecraft/svelte — SearchInput component
   *
   * Tokenized multi-field search with visual pill chips.
   * Supports: `status:active salary:>80000 name:alice` plus free text.
   * Token format: field:value, field:>value, field:<value, field:>=value, field:<=value
   * Debounce: 150ms via setTimeout.
   * Svelte 5 runes: $props(), $state() — no createEventDispatcher.
   */

  import { onDestroy } from 'svelte';

  interface SearchToken {
    field: string;
    op: string;
    value: string;
    raw: string; // original matched text (e.g. "status:active")
  }

  interface Props {
    placeholder?: string;
    onfilter: (value: string) => void;
  }

  let { placeholder = 'Search\u2026', onfilter }: Props = $props();

  let inputValue = $state('');
  let debounceTimer: number | undefined;

  /** Parse tokens from a raw query string — same logic as Table.svelte parser */
  function parseTokens(query: string): { tokens: SearchToken[]; remainder: string } {
    const tokens: SearchToken[] = [];
    const tokenRegex = /(\w+)(:>=|:<=|:>|:<|:!=|:)("([^"]*)"|\S+)/g;
    let match: RegExpExecArray | null;
    const usedRanges: [number, number][] = [];

    while ((match = tokenRegex.exec(query)) !== null) {
      usedRanges.push([match.index, match.index + match[0].length]);
      tokens.push({
        field: match[1],
        op: match[2],
        value: match[4] ?? match[3],
        raw: match[0],
      });
    }

    // Remainder = everything outside token ranges
    let remainder = '';
    let pos = 0;
    for (const [start, end] of usedRanges) {
      remainder += query.slice(pos, start);
      pos = end;
    }
    remainder += query.slice(pos);

    return { tokens, remainder: remainder.trim() };
  }

  // Derived pills from the current inputValue
  const parsed = $derived(parseTokens(inputValue));
  const pills = $derived(parsed.tokens);
  const bareText = $derived(parsed.remainder);

  function handleInput(e: Event) {
    inputValue = (e.target as HTMLInputElement).value;
    emitFiltered(inputValue);
  }

  function emitFiltered(val: string) {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      onfilter(val);
    }, 150);
  }

  function removeToken(token: SearchToken) {
    // Remove this token's raw text from inputValue
    inputValue = inputValue.replace(token.raw, '').replace(/\s+/g, ' ').trim();
    emitFiltered(inputValue);
  }

  function clearAll() {
    inputValue = '';
    onfilter('');
  }

  const hasPills = $derived(pills.length > 0);

  onDestroy(() => window.clearTimeout(debounceTimer));
</script>

<div class="tc-search-wrapper" class:tc-search-wrapper--has-pills={hasPills}>
  <span class="tc-search-icon" aria-hidden="true">
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <circle cx="7" cy="7" r="5"/>
      <path d="M12 12l2.5 2.5"/>
    </svg>
  </span>

  {#if hasPills}
    <div class="tc-search-pills" aria-label="Active search filters">
      {#each pills as token (token.raw)}
        <span class="tc-pill" title="{token.field}{token.op}{token.value}">
          <span class="tc-pill-field">{token.field}</span>
          <span class="tc-pill-op">{token.op}</span>
          <span class="tc-pill-val">{token.value}</span>
          <button
            class="tc-pill-remove"
            type="button"
            aria-label="Remove filter {token.raw}"
            onclick={() => removeToken(token)}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M1 1l6 6M7 1l-6 6"/>
            </svg>
          </button>
        </span>
      {/each}
    </div>
  {/if}

  <input
    type="search"
    class="tc-search-input"
    class:tc-search-input--with-pills={hasPills}
    placeholder={hasPills ? (bareText ? '' : 'Add more filters\u2026') : placeholder}
    value={inputValue}
    oninput={handleInput}
    aria-label="Search table — supports field:value tokens"
  />

  {#if inputValue}
    <button
      class="tc-search-clear"
      type="button"
      aria-label="Clear search"
      onclick={clearAll}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M1 1l8 8M9 1l-8 8"/>
      </svg>
    </button>
  {/if}
</div>

<style>
  .tc-search-wrapper {
    display: flex;
    align-items: center;
    position: relative;
    flex-wrap: wrap;
    gap: 0.25rem;
    border: 1px solid var(--tc-border-color, #e2e8f0);
    border-radius: 0.5rem;
    padding: 0.25rem 0.5rem 0.25rem 2rem;
    min-width: 220px;
    background: var(--tc-color-bg, #ffffff);
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .tc-search-wrapper:focus-within {
    border-color: var(--tc-color-primary, #6366f1);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
  }

  .tc-search-icon {
    position: absolute;
    left: 0.625rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--tc-color-muted, #94a3b8);
    pointer-events: none;
    display: flex;
    align-items: center;
  }

  .tc-search-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    align-items: center;
  }

  /* Token pill chip */
  .tc-pill {
    display: inline-flex;
    align-items: center;
    gap: 0;
    background: var(--tc-color-primary, #6366f1);
    color: #ffffff;
    border-radius: 9999px;
    font-size: 0.6875rem;
    font-weight: 500;
    padding: 0.15rem 0.15rem 0.15rem 0.5rem;
    white-space: nowrap;
    user-select: none;
  }

  .tc-pill-field {
    font-weight: 600;
  }

  .tc-pill-op {
    opacity: 0.75;
    font-size: 0.625rem;
    padding: 0 1px;
  }

  .tc-pill-val {
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tc-pill-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.25);
    border: none;
    border-radius: 50%;
    width: 1rem;
    height: 1rem;
    margin-left: 0.25rem;
    cursor: pointer;
    padding: 0;
    color: inherit;
    transition: background 0.1s ease;
    flex-shrink: 0;
  }

  .tc-pill-remove:hover {
    background: rgba(255, 255, 255, 0.4);
  }

  /* The actual text input — borderless inside the wrapper */
  .tc-search-input {
    border: none;
    outline: none;
    font-size: 0.8125rem;
    font-family: inherit;
    background: transparent;
    color: var(--tc-color-text, #0f172a);
    line-height: 1.5;
    padding: 0.15rem 1.5rem 0.15rem 0;
    min-width: 120px;
    flex: 1;
  }

  /* Override browser's search input built-in appearance */
  .tc-search-input::-webkit-search-decoration,
  .tc-search-input::-webkit-search-cancel-button {
    display: none;
  }

  .tc-search-input::placeholder {
    color: var(--tc-color-placeholder, #94a3b8);
  }

  /* Clear button */
  .tc-search-clear {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--tc-color-muted, #94a3b8);
    padding: 0.125rem;
    border-radius: 50%;
    transition: color 0.1s ease;
  }

  .tc-search-clear:hover {
    color: var(--tc-color-text, #0f172a);
  }
</style>
