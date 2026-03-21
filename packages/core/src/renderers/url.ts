/**
 * @tablecraft/core — URL renderer
 *
 * Converts URLs to external links. Uses new URL() to extract the hostname as the label.
 * Falls back to kind:'text' if the URL constructor throws (not a valid URL).
 * Self-registers on module initialization.
 *
 * CORE-07: Tree-shakable — importing only this file loads only this renderer.
 */

import type { CellDescriptor, ResolvedColumn } from '../types.js';
import { registerRenderer } from '../registry/index.js';

export function urlRenderer(value: unknown, _column: ResolvedColumn): CellDescriptor {
  if (value === null || value === undefined || value === '') return { kind: 'raw', value };
  const str = String(value).trim();
  try {
    const parsed = new URL(str);
    return { kind: 'link', href: str, label: parsed.hostname, external: true };
  } catch {
    // URL constructor threw — not a valid URL; degrade to text
    return { kind: 'text', value: str };
  }
}

registerRenderer('url', urlRenderer);
