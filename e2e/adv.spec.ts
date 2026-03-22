/**
 * e2e/adv.spec.ts — Phase 6 Advanced Features Playwright tests
 *
 * Wave 0: Stubs that will be implemented in Waves 3 (resize), 4 (reorder/pin), 5 (grouping)
 * Run: pnpm exec playwright test e2e/adv.spec.ts
 */
import { test, expect } from '@playwright/test';

// ADV-01: Column Resize
test.describe('Column Resize (ADV-01)', () => {
  test('drag resize handle increases column width', async () => {
    test.skip(true, 'Wave 3 — not yet implemented');
  });
  test('drag resize handle respects minWidth constraint', async () => {
    test.skip(true, 'Wave 3 — not yet implemented');
  });
  test('width persists after resize when persistKey is set', async () => {
    test.skip(true, 'Wave 3 — not yet implemented');
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
