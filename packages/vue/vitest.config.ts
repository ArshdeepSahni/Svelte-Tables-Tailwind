import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      // Tell Vue compiler that tc-table is a custom element — suppress unknown element warnings
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('tc-'),
        },
      },
    }),
  ],
  test: {
    name: '@tablecraft/vue',
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});
