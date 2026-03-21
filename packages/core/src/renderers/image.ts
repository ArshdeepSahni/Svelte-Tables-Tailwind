/**
 * @tablecraft/core — Image renderer
 *
 * Converts image URLs to kind:'image' descriptors. Uses column.label as the alt text.
 * Self-registers on module initialization.
 *
 * CORE-07: Tree-shakable — importing only this file loads only this renderer.
 */

import type { CellDescriptor, ResolvedColumn } from '../types.js';
import { registerRenderer } from '../registry/index.js';

export function imageRenderer(value: unknown, column: ResolvedColumn): CellDescriptor {
  if (value === null || value === undefined || value === '') return { kind: 'raw', value };
  const src = String(value).trim();
  const alt = column.label || '';
  return { kind: 'image', src, alt };
}

registerRenderer('image', imageRenderer);
