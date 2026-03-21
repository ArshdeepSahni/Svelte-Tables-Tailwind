import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@tablecraft/vue',
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});
