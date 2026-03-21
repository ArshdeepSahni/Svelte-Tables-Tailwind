/**
 * @tablecraft/core — Email renderer
 *
 * Converts email addresses to mailto: links.
 * Returns kind:'link' with href:'mailto:{email}' and the email as the label.
 * Self-registers on module initialization.
 *
 * CORE-07: Tree-shakable — importing only this file loads only this renderer.
 */

import type { CellDescriptor, ResolvedColumn } from '../types.js';
import { registerRenderer } from '../registry/index.js';

export function emailRenderer(value: unknown, _column: ResolvedColumn): CellDescriptor {
  if (value === null || value === undefined || value === '') return { kind: 'raw', value };
  const email = String(value).trim();
  return { kind: 'link', href: `mailto:${email}`, label: email };
}

registerRenderer('email', emailRenderer);
