/**
 * @tablecraft/core — Number renderer
 *
 * Formats numeric values using Intl.NumberFormat with the system locale.
 * Self-registers on module initialization.
 *
 * CORE-07: Tree-shakable — importing only this file loads only this renderer.
 */

import type { CellDescriptor, ResolvedColumn } from '../types.js';
import { registerRenderer } from '../registry/index.js';

function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function numberRenderer(value: unknown, _column: ResolvedColumn): CellDescriptor {
  const n = toFiniteNumber(value);
  if (n === null) return { kind: 'raw', value };
  const formatted = new Intl.NumberFormat(undefined).format(n);
  return { kind: 'number', value: n, formatted };
}

registerRenderer('number', numberRenderer);
