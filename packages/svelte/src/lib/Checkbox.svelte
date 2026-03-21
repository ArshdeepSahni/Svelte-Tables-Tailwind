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
    cursor: pointer;
    width: 1rem;
    height: 1rem;
    accent-color: var(--tc-color-primary, #2563eb);
  }

  .tc-checkbox:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
</style>
