import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Workspace mode: run all package test suites from one command
    workspace: [
      'packages/core/vitest.config.ts',
      'packages/svelte/vitest.config.ts',
      'packages/react/vitest.config.ts',
      'packages/vue/vitest.config.ts',
    ],
  },
});
