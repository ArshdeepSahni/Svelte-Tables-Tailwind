import { test, expect } from '@playwright/test';

/**
 * Phase 1 smoke test — infrastructure proof.
 * Verifies Playwright can run. No real UI exists yet (Phase 3).
 * This test passes immediately to prove the E2E test runner is wired correctly.
 *
 * Phase 3 will replace this with actual <Table> rendering tests.
 */
test.describe('Playwright smoke test', () => {
  test('test runner is operational', () => {
    // This test intentionally has no page navigation.
    // It proves that @playwright/test is installed and configured correctly.
    expect(true).toBe(true);
  });

  test('Playwright version is accessible', () => {
    // Verify the test environment provides expected globals
    expect(typeof test).toBe('function');
    expect(typeof expect).toBe('function');
  });
});
