import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Projects mode: run all package test suites from one command
    // Note: Vitest 4 renamed `workspace` to `projects`
    projects: [
      'packages/core/vitest.config.ts',
      'packages/svelte/vitest.config.ts',
      'packages/react/vitest.config.ts',
      'packages/vue/vitest.config.ts',
    ],
  },
});
