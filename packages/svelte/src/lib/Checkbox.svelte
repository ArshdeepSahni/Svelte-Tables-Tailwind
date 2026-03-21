<script lang="ts">
  interface Props {
    checked?: boolean;
    indeterminate?: boolean;
    disabled?: boolean;
    'aria-label'?: string;
    oncheckedchange?: (checked: boolean) => void;
  }

  let {
    checked = false,
    indeterminate = false,
    disabled = false,
    'aria-label': ariaLabel,
    oncheckedchange,
  }: Props = $props();

  let inputEl: HTMLInputElement | undefined = $state();

  $effect(() => {
    if (inputEl) {
      inputEl.indeterminate = indeterminate;
    }
  });

  function handleChange(e: Event) {
    const target = e.target as HTMLInputElement;
    oncheckedchange?.(target.checked);
  }
</script>

<input
  type="checkbox"
  class="tc-checkbox"
  bind:this={inputEl}
  {checked}
  {disabled}
  aria-label={ariaLabel}
  onchange={handleChange}
/>

<style>
  .tc-checkbox {
    width: 1rem;
    height: 1rem;
    cursor: pointer;
    accent-color: var(--tc-color-primary, #6366f1);
    border-radius: 0.25rem;
  }

  .tc-checkbox:focus-visible {
    outline: 2px solid var(--tc-color-primary, #6366f1);
    outline-offset: 2px;
  }
</style>
