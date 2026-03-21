/**
 * @tablecraft/core — HTML renderer — EXPLICIT OPT-IN ONLY.
 *
 * Requires DOMPurify as a peer dependency. Throws a descriptive error if unavailable.
 * For SSR environments, inject DOMPurify via configure() before rendering.
 *
 * CORE-07: DOMPurify is a peer dep — not bundled. Keeps @tablecraft/core under 50KB gzipped.
 * FOUND-07: Only renders sanitized HTML (DOMPurify output). Never raw user input.
 *
 * Usage (browser with CDN DOMPurify on window):
 *   import '@tablecraft/core/renderers/html'; // auto-detects window.DOMPurify
 *
 * Usage (SSR / Node.js):
 *   import DOMPurify from 'dompurify';
 *   import { configure } from '@tablecraft/core/renderers/html';
 *   configure(DOMPurify);
 *
 * Self-registers on module initialization.
 */

import type { CellDescriptor, ResolvedColumn } from '../types.js';
import { registerRenderer } from '../registry/index.js';

type PurifyInstance = { sanitize: (s: string) => string };

let injectedPurify: PurifyInstance | null = null;

/**
 * Inject a DOMPurify instance for SSR environments where window.DOMPurify is unavailable.
 * Call once at app startup before any html renderer invocations.
 *
 * @example
 * import DOMPurify from 'dompurify';
 * import { configure } from '@tablecraft/core/renderers/html';
 * configure(DOMPurify);
 */
export function configure(purify: PurifyInstance): void {
  injectedPurify = purify;
}

function getPurify(): PurifyInstance {
  if (injectedPurify) return injectedPurify;
  if (typeof globalThis !== 'undefined' && 'DOMPurify' in globalThis) {
    return (globalThis as Record<string, unknown>)['DOMPurify'] as PurifyInstance;
  }
  throw new Error(
    '[tablecraft] html renderer requires DOMPurify. ' +
    'Install it: npm install dompurify. ' +
    'For SSR: import DOMPurify from "dompurify"; ' +
    'import { configure } from "@tablecraft/core/renderers/html"; configure(DOMPurify). ' +
    'Migration guide: https://tablecraft.dev/migrate/html-renderer',
  );
}

export function htmlRenderer(value: unknown, _column: ResolvedColumn): CellDescriptor {
  if (value === null || value === undefined || value === '') {
    return { kind: 'html', sanitized: '' };
  }
  const purify = getPurify(); // throws descriptive error if unavailable
  const raw = String(value);
  return { kind: 'html', sanitized: purify.sanitize(raw) };
}

registerRenderer('html', htmlRenderer);
