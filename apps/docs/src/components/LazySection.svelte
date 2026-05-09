<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';

  interface Props {
    children: Snippet;
    threshold?: number;
  }

  let { children, threshold = 500 }: Props = $props();
  let visible = $state(false);
  let container: HTMLDivElement;

  // Global stagger counter — each LazySection mounts with a slight delay
  // to prevent all Table effects from initializing in one Svelte batch
  const staggerDelay = (() => {
    const key = '__lazySectionCounter';
    const w = globalThis as Record<string, number>;
    w[key] = (w[key] ?? 0) + 1;
    return w[key] * 80; // 80ms between each section
  })();

  onMount(() => {
    function check() {
      if (visible) return;
      const rect = container.getBoundingClientRect();
      if (rect.top < window.innerHeight + threshold) {
        setTimeout(() => { visible = true; }, staggerDelay);
        cleanup();
      }
    }

    function cleanup() {
      window.removeEventListener('scroll', check, true);
      window.removeEventListener('resize', check);
    }

    // Check immediately
    check();

    // Also listen for scroll (capture phase to catch scrolling in nested containers)
    if (!visible) {
      window.addEventListener('scroll', check, true);
      window.addEventListener('resize', check);
    }

    return cleanup;
  });
</script>

<div bind:this={container} style="min-height: 100px;">
  {#if visible}
    {@render children()}
  {:else}
    <div style="height: 400px;"></div>
  {/if}
</div>
