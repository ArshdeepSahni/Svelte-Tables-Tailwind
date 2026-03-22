/**
 * e2e/adv.spec.ts — Phase 6 Advanced Features Playwright tests
 *
 * Wave 3: ADV-01 Column Resize implemented
 * Wave 4: ADV-02 Column Reorder / ADV-03 Column Pinning (stubs)
 * Wave 5: ADV-06 Row Grouping (stubs)
 * Run: pnpm exec playwright test e2e/adv.spec.ts
 */
import { test, expect } from '@playwright/test';

// ADV-01: Column Resize
test.describe('Column Resize (ADV-01)', () => {
  test('drag resize handle increases column width', async ({ page }) => {
    await page.goto('/');
    // Wait for table to render
    await page.waitForSelector('.tc-th');
    const firstTh = page.locator('.tc-th').first();
    const initialWidth = await firstTh.evaluate((el: HTMLElement) => el.offsetWidth);

    // Find resize handle within first th
    const handle = firstTh.locator('.tc-resize-handle');
    const handleBox = await handle.boundingBox();
    if (!handleBox) throw new Error('Resize handle not found');

    // Drag 100px to the right
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + handleBox.width / 2 + 100, handleBox.y + handleBox.height / 2, { steps: 10 });
    await page.mouse.up();

    const newWidth = await firstTh.evaluate((el: HTMLElement) => el.offsetWidth);
    expect(newWidth).toBeGreaterThan(initialWidth);
  });

  test('drag resize handle respects minWidth constraint', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.tc-th');
    const firstTh = page.locator('.tc-th').first();
    const handle = firstTh.locator('.tc-resize-handle');
    const handleBox = await handle.boundingBox();
    if (!handleBox) throw new Error('Resize handle not found');

    // Drag far left (beyond minWidth)
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox.x - 500, handleBox.y + handleBox.height / 2, { steps: 20 });
    await page.mouse.up();

    const finalWidth = await firstTh.evaluate((el: HTMLElement) => el.offsetWidth);
    expect(finalWidth).toBeGreaterThanOrEqual(60); // default minWidth
  });

  test('width persists after resize when persistKey is set', async () => {
    test.skip(true, 'Wave 3 — persistence test deferred to Wave 4');
  });
});

// ADV-02: Column Reorder
test.describe('Column Reorder (ADV-02)', () => {
  test('drag column header to new position changes column order', async () => {
    test.skip(true, 'Wave 4 — not yet implemented');
  });
  test('drop indicator appears during drag', async () => {
    test.skip(true, 'Wave 4 — not yet implemented');
  });
});

// ADV-03: Column Pinning
test.describe('Column Pinning (ADV-03)', () => {
  test('pinned:left column has position:sticky and left offset', async () => {
    test.skip(true, 'Wave 4 — not yet implemented');
  });
  test('pinned column remains visible during horizontal scroll', async () => {
    test.skip(true, 'Wave 4 — not yet implemented');
  });
  test('pinned column has box-shadow separator', async () => {
    test.skip(true, 'Wave 4 — not yet implemented');
  });
});

// ADV-06: Row Grouping
test.describe('Row Grouping (ADV-06)', () => {
  test('groupBy prop inserts group header rows', async () => {
    test.skip(true, 'Wave 5 — not yet implemented');
  });
  test('clicking group header collapses its rows', async () => {
    test.skip(true, 'Wave 5 — not yet implemented');
  });
  test('clicking again expands collapsed group', async () => {
    test.skip(true, 'Wave 5 — not yet implemented');
  });
});
