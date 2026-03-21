// e2e/wc-smoke.spec.ts
import { test, expect } from '@playwright/test';

const SAMPLE_ROWS = JSON.stringify([
  { name: 'Alice', age: 30, email: 'alice@example.com' },
  { name: 'Bob', age: 25, email: 'bob@example.com' },
  { name: 'Carol', age: 35, email: 'carol@example.com' },
]);

// ---------------------------------------------------------------------------
// Vanilla JS smoke test — WC-02, WC-04
// Sets element.data via JS property (not attribute) and confirms render
// ---------------------------------------------------------------------------
test('WC-02: vanilla JS — element.data property renders table', async ({ page }) => {
  // STUB: will pass once element.ts is implemented and UMD build exists
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body>
        <tc-table></tc-table>
        <script type="module">
          // This will 404 until Plan 05 runs the UMD build
          import '/packages/core/dist/element.js';
          const el = document.querySelector('tc-table');
          el.data = ${SAMPLE_ROWS};
        </script>
      </body>
    </html>
  `);
  await page.waitForSelector('table', { timeout: 5000 }).catch(() => null);
  const table = page.locator('table');
  await expect(table).toBeVisible({ timeout: 5000 });
});

// ---------------------------------------------------------------------------
// React smoke test — WC-07, WC-10
// Genuine failing assertions: tc-table must be attached and have 100 rows.
// These FAIL until Plan 05 runs the full build (element.umd.js not yet built).
// ---------------------------------------------------------------------------
test('WC-07: React wrapper — TcTable renders 100 rows via @lit/react', async ({ page }) => {
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body><div id="root"></div></body>
    </html>
  `);
  // Fails until element.umd.js is built in Plan 05 and React wrapper exists
  const element = page.locator('tc-table');
  await expect(element).toBeAttached({ timeout: 5000 });
  const rows = page.locator('tc-table tbody tr');
  await expect(rows).toHaveCount(100);
});

// ---------------------------------------------------------------------------
// Vue smoke test — WC-08, WC-10
// Genuine failing assertions: tc-table must be attached and have 100 rows.
// These FAIL until Plan 05 runs the full build and Vue wrapper exists.
// ---------------------------------------------------------------------------
test('WC-08: Vue wrapper — TcTable renders 100 rows via Vue 3 SFC', async ({ page }) => {
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body><div id="app"></div></body>
    </html>
  `);
  // Fails until element.umd.js is built in Plan 05 and Vue wrapper exists
  const element = page.locator('tc-table');
  await expect(element).toBeAttached({ timeout: 5000 });
  const rows = page.locator('tc-table tbody tr');
  await expect(rows).toHaveCount(100);
});
