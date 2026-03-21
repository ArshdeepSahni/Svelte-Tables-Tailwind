// packages/core/vite.config.element.ts
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/element.ts'),
      name: 'TcTable',
      fileName: 'element',
      // Single entry = UMD is supported
      formats: ['umd', 'es'],
    },
    outDir: 'dist',
    emptyOutDir: false, // preserve ESM+CJS output from main build
    rolldownOptions: {
      external: [], // Bundle lit into UMD for CDN self-contained usage
    },
    sourcemap: true,
    minify: true, // UMD is for CDN — minify for smaller download
  },
  plugins: [
    dts({
      include: ['src/element.ts'],
      outDir: 'dist',
      rollupTypes: false,
    }),
  ],
});
