import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@tablecraft/core',
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.d.ts',
        'src/tokens.ts', // plain data object — no branches to cover
      ],
      thresholds: {
        // Global floor — all source files must meet this minimum
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
        // CORE-12: Inference engine must exceed 95% (per-glob override)
        'src/inference/**/*.ts': {
          lines: 95,
          functions: 95,
          branches: 90,
          statements: 95,
        },
        // CORE-12: All renderer modules must exceed 90% (per-glob override)
        'src/renderers/**/*.ts': {
          lines: 90,
          functions: 90,
          branches: 85,
          statements: 90,
        },
      },
    },
  },
});
