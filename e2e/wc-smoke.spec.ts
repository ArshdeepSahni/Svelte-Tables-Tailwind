// e2e/wc-smoke.spec.ts
// Phase 5 Plan 05 — Web Component smoke tests
// Tests use page.setContent() + page.addScriptTag() with local dist files.
// No live dev server required (use playwright.smoke.config.ts).
import { test, expect, type Page } from '@playwright/test';
import { resolve } from 'path';

// 100 rows for smoke test — enough to confirm rendering works
const ROWS = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  age: 20 + (i % 50),
  active: i % 2 === 0,
}));

const ROWS_JSON = JSON.stringify(ROWS);

// Path to built dist files — Playwright loads these directly from the filesystem
// __dirname is available in Playwright test files (CommonJS context)
const ELEMENT_ESM_PATH = resolve(__dirname, '../packages/core/dist/element.js');
const ELEMENT_UMD_PATH = resolve(__dirname, '../packages/core/dist/element.umd.js');

// ---------------------------------------------------------------------------
// Helper: Load the ESM element bundle and render <tc-table> in a page
// ---------------------------------------------------------------------------
async function loadVanillaPage(page: Page): Promise<void> {
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body>
        <tc-table id="tbl"></tc-table>
      </body>
    </html>
  `);
  // Load ESM bundle — registers the tc-table custom element
  await page.addScriptTag({ path: ELEMENT_ESM_PATH, type: 'module' });
  // Wait for the custom element to be fully defined before assigning data
  await page.waitForFunction(() => customElements.get('tc-table') !== undefined, { timeout: 5000 });
  // Assign data via DOM property — must happen after element is defined
  await page.evaluate((rows) => {
    const el = document.querySelector('#tbl') as HTMLElement & { data: unknown[] };
    el.data = rows;
  }, ROWS);
}

// ---------------------------------------------------------------------------
// WC-02: Vanilla JS — element.data property renders table
// ---------------------------------------------------------------------------
test('WC-02: vanilla JS — element.data property renders 100-row table', async ({ page }) => {
  await loadVanillaPage(page);

  // Wait for Lit to render the table
  await page.waitForSelector('tc-table table', { timeout: 8000 });

  // Table is visible
  const table = page.locator('tc-table table');
  await expect(table).toBeVisible();

  // Headers derived from data keys (id, name, email, age, active)
  const headers = page.locator('tc-table table th');
  await expect(headers).toHaveCount(5);

  // 100 data rows in tbody
  const rows = page.locator('tc-table table tbody tr');
  await expect(rows).toHaveCount(100);

  // First cell of first row shows "1" (id column)
  const firstCell = page.locator('tc-table table tbody tr:first-child td:first-child');
  await expect(firstCell).toContainText('1');
});

// ---------------------------------------------------------------------------
// WC-04: CustomEvent dispatch — clicking a cell fires tc-cell-click
// ---------------------------------------------------------------------------
test('WC-04: tc-cell-click CustomEvent fires on cell click', async ({ page }) => {
  await loadVanillaPage(page);
  await page.waitForSelector('tc-table table tbody tr', { timeout: 8000 });

  // Listen for the CustomEvent and capture its detail
  const detailPromise = page.evaluate(
    () =>
      new Promise<Record<string, unknown>>((resolve) => {
        document.querySelector('#tbl')!.addEventListener(
          'tc-cell-click',
          (e) => {
            resolve((e as CustomEvent).detail as Record<string, unknown>);
          },
          { once: true },
        );
      }),
  );

  // Click first tbody cell
  await page.locator('tc-table table tbody tr:first-child td:first-child').click();

  const detail = await detailPromise;
  expect(detail).toHaveProperty('row');
  expect(detail).toHaveProperty('rowIndex', 0);
  expect(detail).toHaveProperty('value');
});

// ---------------------------------------------------------------------------
// WC-07: React wrapper — TcTable renders 100 rows
// React 19 natively supports Custom Elements (no adapter needed for smoke test).
// Strategy: load UMD bundle to register tc-table, then use dynamic import() to
// load React from CDN and render the element with data assigned via ref.
// ---------------------------------------------------------------------------
test('WC-07: React wrapper — Table component renders 100 rows', async ({ page }) => {
  await page.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><div id="root"></div></body></html>`);
  // Load UMD bundle (no type="module") to register tc-table as a global custom element
  await page.addScriptTag({ path: ELEMENT_UMD_PATH });
  await page.waitForFunction(() => customElements.get('tc-table') !== undefined, { timeout: 5000 });

  // Use page.evaluate with dynamic import() to load React from CDN and render
  await page.evaluate(async (rowsJson: string) => {
    const rows = JSON.parse(rowsJson) as Array<Record<string, unknown>>;

    // Dynamic import from CDN — runs in browser context
    const React = await import('https://esm.sh/react@19?dev') as typeof import('react');
    const { createRoot } = await import('https://esm.sh/react-dom@19/client?dev') as typeof import('react-dom/client');

    const root = createRoot(document.getElementById('root')!);
    root.render(
      // React 19 natively supports Custom Elements — pass ref to assign .data property
      React.createElement('tc-table' as keyof JSX.IntrinsicElements, {
        id: 'react-table',
        ref: (el: HTMLElement & { data: unknown[] } | null) => {
          if (el) el.data = rows;
        },
      }),
    );
  }, ROWS_JSON);

  await page.waitForSelector('tc-table table', { timeout: 20000 });

  const table = page.locator('tc-table table');
  await expect(table).toBeVisible();

  const rows = page.locator('tc-table table tbody tr');
  await expect(rows).toHaveCount(100);
});

// ---------------------------------------------------------------------------
// WC-08: Vue wrapper — TcTable renders 100 rows
// Vue 3 handles Custom Elements natively via isCustomElement compiler option.
// Strategy: load UMD bundle to register tc-table, then use dynamic import()
// to load Vue from CDN and mount a component that assigns data via template ref.
// Note: uses Vue's render() function (not template string) to avoid requiring
// the Vue compiler in the smoke test.
// ---------------------------------------------------------------------------
test('WC-08: Vue wrapper — TcTable component renders 100 rows', async ({ page }) => {
  await page.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><div id="app"></div></body></html>`);
  await page.addScriptTag({ path: ELEMENT_UMD_PATH });
  await page.waitForFunction(() => customElements.get('tc-table') !== undefined, { timeout: 5000 });

  await page.evaluate(async (rowsJson: string) => {
    const rows = JSON.parse(rowsJson) as Array<Record<string, unknown>>;

    const Vue = await import('https://esm.sh/vue@3?dev') as typeof import('vue');
    const { createApp, ref, onMounted, h } = Vue;

    const App = {
      setup() {
        const tableRef = ref<HTMLElement & { data: unknown[] } | null>(null);
        onMounted(() => {
          if (tableRef.value) {
            tableRef.value.data = rows;
          }
        });
        // Use render function (h) instead of template string to avoid Vue compiler
        return () => h('tc-table', { id: 'vue-table', ref: tableRef });
      },
    };

    const app = createApp(App);
    // Tell Vue compiler that tc-table is a custom element
    app.config.compilerOptions.isCustomElement = (tag: string) => tag.startsWith('tc-');
    app.mount('#app');
  }, ROWS_JSON);

  await page.waitForSelector('tc-table table', { timeout: 20000 });

  const table = page.locator('tc-table table');
  await expect(table).toBeVisible();

  const rows = page.locator('tc-table table tbody tr');
  await expect(rows).toHaveCount(100);
});

// ---------------------------------------------------------------------------
// WC-09: UMD bundle exposes TcTable global and registers the custom element
// ---------------------------------------------------------------------------
test('WC-09: UMD bundle registers tc-table custom element', async ({ page }) => {
  await page.setContent(`<!DOCTYPE html><html><body></body></html>`);
  // Load UMD without type="module" — it uses the IIFE global pattern
  await page.addScriptTag({ path: ELEMENT_UMD_PATH });

  // UMD bundle should expose TcTable global (name: 'TcTable' in vite.config.element.ts)
  // AND register the tc-table custom element as a side effect
  const result = await page.evaluate(() => {
    const win = window as unknown as Record<string, unknown>;
    return {
      hasTcTableGlobal: typeof win['TcTable'] !== 'undefined',
      hasCustomElement: customElements.get('tc-table') !== undefined,
    };
  });

  // At minimum, the custom element must be registered
  expect(result.hasCustomElement).toBe(true);
  // TcTable global is also expected (from UMD name: 'TcTable')
  expect(result.hasTcTableGlobal).toBe(true);
});
