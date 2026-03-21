// packages/vue/vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

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
    dts({
      include: ['src/**/*.ts', 'src/**/*.vue'],
      outDir: 'dist',
      rollupTypes: false,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: 'index',
    },
    rolldownOptions: {
      external: ['vue', '@tablecraft/core'],
    },
    sourcemap: true,
    minify: false,
  },
});
