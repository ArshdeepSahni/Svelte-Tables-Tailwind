/**
 * @tablecraft/core — Rating renderer
 *
 * Renders numeric values as star ratings (0–N).
 * Default max is 5 stars. Value is clamped to [0, max].
 * Self-registers on module initialization.
 *
 * CORE-07: Tree-shakable — importing only this file loads only this renderer.
 */

import type { CellDescriptor, ResolvedColumn } from '../types.js';
import { registerRenderer } from '../registry/index.js';

export function ratingRenderer(value: unknown, _column: ResolvedColumn): CellDescriptor {
  if (value === null || value === undefined) return { kind: 'raw', value };

  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) return { kind: 'raw', value };

  const max = 5;
  const clamped = Math.max(0, Math.min(max, num));

  return { kind: 'rating', value: clamped, max };
}

registerRenderer('rating', ratingRenderer);
