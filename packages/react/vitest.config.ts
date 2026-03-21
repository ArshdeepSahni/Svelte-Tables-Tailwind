import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@tablecraft/react',
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
