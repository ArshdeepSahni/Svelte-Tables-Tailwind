// playwright.smoke.config.ts
// Dedicated Playwright config for Web Component smoke tests (Phase 5, Plan 05).
// No webServer dependency — tests use page.setContent() with local file paths.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'wc-smoke.spec.ts',
  fullyParallel: false, // run sequentially for stable output
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  reporter: 'list',
  // No webServer — these tests load files directly via page.setContent()
  // and page.addScriptTag({ path: ... }). No HTTP server required.
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
