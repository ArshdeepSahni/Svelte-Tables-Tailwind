import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 5176,
    host: true,
  },
  resolve: {
    conditions: ['svelte', 'browser', 'import', 'module', 'default'],
    alias: {
      // Resolve @tablecraft/svelte from source so Vite can properly handle
      // the sort.worker.ts URL reference and Svelte compilation
      '@tablecraft/svelte': path.resolve(
        __dirname,
        '../../packages/svelte/src/lib/index.ts'
      ),
    },
  },
});
