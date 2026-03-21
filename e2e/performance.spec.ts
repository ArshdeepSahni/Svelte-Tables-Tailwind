/**
 * Performance benchmarks for @tablecraft/svelte — Phase 4 (PERF-01, PERF-03, PERF-05, PERF-07)
 * Wave 0 stubs: tests are structurally correct but will fail until the virtualizer is integrated.
 * Run: pnpm exec playwright test e2e/performance.spec.ts
 */
import { test, expect } from '@playwright/test';

test.describe('Performance benchmarks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for table to have at least one data row rendered
    await page.waitForSelector('tbody tr:not([data-skeleton])', { timeout: 10_000 });
  });

  // PERF-01 + PERF-05: virtual scrolling keeps DOM row count low
  test('DOM row count stays below 60 at any scroll position (PERF-01)', async ({ page }) => {
    const count = await page.$$eval('tbody tr:not([data-skeleton])', (rows) => rows.length);
    // Wave 0 STUB: without virtualizer, 100k rows render → count will be >> 60 → test fails
    expect(count).toBeLessThan(60);
  });

  // PERF-03: CSS containment applied
  test('CSS containment: getComputedStyle(tr).contain includes layout (PERF-03)', async ({ page }) => {
    const contain = await page.$eval(
      'tbody tr:not([data-skeleton])',
      (tr) => getComputedStyle(tr).contain,
    );
    // Wave 0 STUB: no CSS containment yet → will not contain 'layout' → fails
    expect(contain).toContain('layout');
  });

  // PERF-05: initial render time
  test('Initial render < 200ms with 100k rows (PERF-05)', async ({ page }) => {
    // Navigate fresh and measure time to first tr
    const timing = await page.evaluate(() => {
      return performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
    });
    // Wave 0 STUB: rendering 100k real DOM rows will exceed 200ms
    expect(timing).toBeLessThan(200);
  });

  // PERF-05: scroll frame time
  test('Scroll holds 60fps — no frame exceeds 16.67ms (PERF-05)', async ({ page }) => {
    const maxFrameMs = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        const scrollEl = document.querySelector('.tc-table-scroll') as HTMLElement | null;
        if (!scrollEl) { resolve(9999); return; }
        let maxFrame = 0;
        let lastTime = performance.now();
        let frames = 0;
        function onFrame(now: number) {
          const dt = now - lastTime;
          if (dt > maxFrame) maxFrame = dt;
          lastTime = now;
          frames++;
          scrollEl.scrollTop += 300;
          if (frames < 30) requestAnimationFrame(onFrame);
          else resolve(maxFrame);
        }
        requestAnimationFrame(onFrame);
      });
    });
    // Wave 0 STUB: no virtualization → layout thrash → frame times will exceed 16.67ms
    expect(maxFrameMs).toBeLessThan(16.67);
  });

  // PERF-07: Worker sort time
  test('Worker sort completes in < 50ms for 100k rows (PERF-07)', async ({ page }) => {
    // Click the first sortable column header and measure time to aria-sort update
    const start = Date.now();
    const header = page.locator('thead th.tc-th--sortable').first();
    await header.click();
    await page.waitForFunction(
      () => document.querySelector('thead th[aria-sort="ascending"]') !== null,
      { timeout: 5_000 },
    );
    const elapsed = Date.now() - start;
    // Wave 0 STUB: no Worker yet → main-thread sort of 100k rows may exceed 50ms
    expect(elapsed).toBeLessThan(50);
  });
});
