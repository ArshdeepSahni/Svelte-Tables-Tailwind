// e2e/sveltekit-ssr.spec.ts
//
// WC-06: SvelteKit SSR build test.
// This test runs pnpm build on a minimal SvelteKit project that imports
// @tablecraft/core in a server load function.
//
// Purpose: Confirm that importing @tablecraft/core in Node.js (SvelteKit SSR)
// does not throw "window is not defined" or "customElements is not defined".
//
// Strategy: build-only (no dev server) — if SSR guards are missing, the build
// will fail with a browser-global error in stderr.
import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURE_DIR = resolve(__dirname, 'fixtures/sveltekit-ssr');

test('WC-06: SvelteKit SSR — @tablecraft/core import does not throw browser-global errors', () => {
  let stderr = '';
  let buildFailed = false;

  try {
    // Install dependencies for the fixture (workspace:* resolves to local packages/core)
    // Run build — if SSR guards are missing, vite build stderr will contain the error
    execSync('pnpm install --frozen-lockfile=false && pnpm build', {
      cwd: FIXTURE_DIR,
      encoding: 'utf-8',
      timeout: 120_000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (err: unknown) {
    buildFailed = true;
    if (err && typeof err === 'object' && 'stderr' in err) {
      stderr = String((err as { stderr: unknown }).stderr);
    }
  }

  // The build must succeed
  expect(buildFailed, `SvelteKit build failed. stderr:\n${stderr}`).toBe(false);

  // Even if build succeeded, stderr must not contain these SSR-incompatible errors
  expect(stderr).not.toContain('window is not defined');
  expect(stderr).not.toContain('customElements is not defined');
  expect(stderr).not.toContain('document is not defined');
});
