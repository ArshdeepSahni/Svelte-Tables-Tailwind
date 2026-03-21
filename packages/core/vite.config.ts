import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

/**
 * All 17 Tier 1 renderer names.
 * Each gets its own entry point in the build for tree-shaking (CORE-07).
 * Importing @tablecraft/core/renderers/currency does NOT load code or html renderer.
 */
const RENDERER_NAMES = [
  'text',
  'number',
  'integer',
  'currency',
  'percentage',
  'boolean',
  'date',
  'datetime',
  'time',
  'email',
  'url',
  'phone',
  'image',
  'badge',
  'status',
  'code',
  'html',
] as const;

const rendererEntries = Object.fromEntries(
  RENDERER_NAMES.map((name) => [
    `renderers/${name}`,
    resolve(__dirname, `src/renderers/${name}.ts`),
  ]),
);

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        ...rendererEntries,
      },
      // name is not required for multi-entry (only needed for UMD single-entry)
      // UMD format dropped for multi-entry — not supported by Rolldown for multiple entries.
      // Phase 5 (WC-09) adds UMD via a separate build config for the web component.
      formats: ['es', 'cjs'],
    },
    // CRITICAL: renamed from rollupOptions in Vite 8 (rollupOptions is deprecated, will break in Vite 9)
    rolldownOptions: {
      external: [], // zero runtime dependencies — 50KB budget
    },
    sourcemap: true,
    minify: false,
  },
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      outDir: 'dist',
      // CRITICAL: false = one .d.ts per source file — required for multi-entry tree-shaking.
      // true would bundle all declarations into index.d.ts, breaking individual renderer imports.
      rollupTypes: false,
    }),
  ],
});
