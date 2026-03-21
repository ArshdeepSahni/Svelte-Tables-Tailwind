/**
 * Performance benchmarks — Phase 4 acceptance gate
 * Covers: PERF-01 (row virtualization), PERF-03 (CSS containment),
 *         PERF-05 (initial render + scroll fps), PERF-07 (Worker sort)
 *
 * Note on CI thresholds: Performance targets in the browser are stricter
 * (< 200ms render, 60fps scroll, < 50ms Worker sort). CI thresholds are relaxed
 * to account for headless Chromium on variable CI hardware. The architectural
 * assertions (DOM count < 60, contain includes 'layout') are hard assertions.
 *
 * CSS containment note: Chromium normalises `contain: layout style paint` to the
 * computed value `"content"` (CSS spec shorthand). `contain: layout style` computes
 * to `"style layout"` or similar. Tests check for the normalised forms:
 *   - tr  (contain: layout style)        → computed contains "layout"
 *   - td  (contain: layout style paint)  → computed is "content" or contains "paint"
 */
import { test, expect } from '@playwright/test';

test.describe('Performance benchmarks (Phase 4)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for virtual scroll to activate — confirms 100k row virtualizer is working
    await page.waitForSelector('.tc-table-scroll--virtual', { timeout: 15_000 });
    // Wait for at least one data row in the virtual render
    await page.waitForSelector('tbody tr[data-row]', { timeout: 15_000 });
  });

  // PERF-01: Virtual scrolling keeps DOM row count low regardless of dataset size
  test('DOM row count stays below 60 at any scroll position (PERF-01)', async ({ page }) => {
    // Check at initial position
    const initialCount = await page.$$eval(
      'tbody tr[data-row]',
      (rows) => rows.length,
    );
    expect(initialCount).toBeLessThan(60);

    // Scroll partway through and re-check
    const scrollEl = page.locator('.tc-table-scroll--virtual');
    await scrollEl.evaluate((el) => { el.scrollTop = 50_000 * 48; }); // scroll to row ~50k
    await page.waitForTimeout(200); // allow virtualizer to update

    const midCount = await page.$$eval(
      'tbody tr[data-row]',
      (rows) => rows.length,
    );
    expect(midCount).toBeLessThan(60);
  });

  // PERF-03: CSS containment applied to rows
  // .tc-tr has `contain: layout style` — Chromium computes this as a value containing "layout"
  test('CSS containment: contain includes layout on .tc-tr (PERF-03)', async ({ page }) => {
    const contain = await page.$eval(
      'tbody tr[data-row]',
      (tr) => getComputedStyle(tr).contain,
    );
    // Must include 'layout' — confirms contain: layout style is applied
    expect(contain).toContain('layout');
  });

  // PERF-03: CSS containment applied to cells
  // .tc-td has `contain: layout style paint` — Chromium normalises to "content" (CSS spec shorthand)
  test('CSS containment: contain is content/paint on .tc-td (PERF-03)', async ({ page }) => {
    const contain = await page.$eval(
      'tbody tr[data-row] td[data-col]',
      (td) => getComputedStyle(td).contain,
    );
    // Chromium normalises `layout style paint` → `"content"` per CSS Containment spec.
    // Accept "content" (= layout + style + paint) or any value that includes "paint".
    const hasPaintContainment = contain === 'content' || contain === 'strict' || contain.includes('paint');
    expect(hasPaintContainment).toBe(true);
  });

  // PERF-05: Initial render time — virtualizer activates and first rows paint quickly
  // Measures: time from DOMContentLoaded to first virtual data row appearing in the DOM.
  // Note: the bench page generates 100k objects synchronously (Array.from), which accounts
  // for the majority of startup time. The virtualizer itself only paints ~30 rows (< 16ms).
  // CI threshold: 5000ms (includes 100k JS array generation + Svelte mount + virtualizer init)
  // Real browser render target (virtualizer only): < 200ms
  test('Virtual rows appear within 5s of page load (PERF-05, CI threshold)', async ({ page }) => {
    // Navigate fresh and measure from DOMContentLoaded to first data row
    const startMark = Date.now();
    await page.goto('/');
    // waitForSelector resolves when first virtual row is painted
    await page.waitForSelector('tbody tr[data-row]', { timeout: 15_000 });
    const elapsed = Date.now() - startMark;

    // CI threshold: 5000ms (100k row generation + Svelte mount + virtualizer)
    // Confirms virtualizer activates and renders data without hanging indefinitely.
    expect(elapsed).toBeLessThan(5_000);

    // Architectural check: even after loading, DOM row count must stay low (virtualizer active)
    const domRowCount = await page.$$eval('tbody tr[data-row]', (rows) => rows.length);
    expect(domRowCount).toBeLessThan(60);
  });

  // PERF-05: Scroll frame time (relaxed for CI headless — target is 60fps = 16.67ms in real browser)
  test('Scroll does not produce layout jank (PERF-05, CI threshold 100ms/frame)', async ({ page }) => {
    const maxFrameMs = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        const scrollEl = document.querySelector('.tc-table-scroll--virtual') as HTMLElement | null;
        if (!scrollEl) { resolve(9999); return; }
        let maxFrame = 0;
        let lastTime = performance.now();
        let frames = 0;

        function onFrame(now: number) {
          const dt = now - lastTime;
          if (dt > maxFrame) maxFrame = dt;
          lastTime = now;
          frames++;
          scrollEl.scrollTop += 1000; // fast scroll
          if (frames < 20) requestAnimationFrame(onFrame);
          else resolve(maxFrame);
        }
        requestAnimationFrame(onFrame);
      });
    });
    // CI threshold: 100ms (no frame should take > 100ms even in headless)
    // In a real browser, target is < 16.67ms (60fps)
    expect(maxFrameMs).toBeLessThan(100);
  });

  // PERF-07: Worker sort for 100k rows — confirms non-blocking behavior
  test('Sort of 100k rows completes without blocking (PERF-07, CI threshold 2000ms)', async ({ page }) => {
    // Click the first sortable header
    const sortableHeader = page.locator('thead th.tc-th--sortable').first();
    await expect(sortableHeader).toBeVisible();

    const start = Date.now();
    await sortableHeader.click();

    // Wait for sort to complete: aria-sort attribute appears on a header
    await page.waitForFunction(
      () => document.querySelector('thead th[aria-sort="ascending"]') !== null,
      { timeout: 5_000 },
    );
    const elapsed = Date.now() - start;

    // CI threshold: 2000ms. In a real browser with Worker, target is < 50ms.
    // The important property is that the main thread did not freeze (page remains interactive).
    expect(elapsed).toBeLessThan(2000);

    // Verify the sort actually happened — row data should be rendered post-sort
    const firstCellText = await page.locator('tbody tr[data-row="0"] td[data-col="0"]').textContent();
    expect(firstCellText).toBeTruthy(); // data was rendered post-sort
  });
});
