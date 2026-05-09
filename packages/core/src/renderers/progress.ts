/**
 * @tablecraft/core — Progress renderer
 *
 * Renders numeric values as progress bars (0–100%).
 * Values are clamped to [0, 100]. Non-numeric values fall back to raw.
 * Self-registers on module initialization.
 *
 * CORE-07: Tree-shakable — importing only this file loads only this renderer.
 */

import type { CellDescriptor, ResolvedColumn } from '../types.js';
import { registerRenderer } from '../registry/index.js';

export function progressRenderer(value: unknown, _column: ResolvedColumn): CellDescriptor {
  if (value === null || value === undefined) return { kind: 'raw', value };

  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) return { kind: 'raw', value };

  const clamped = Math.max(0, Math.min(100, num));

  return { kind: 'progress', value: clamped };
}

registerRenderer('progress', progressRenderer);
