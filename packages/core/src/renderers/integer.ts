/**
 * @tablecraft/core — Integer renderer
 *
 * Formats integer values — rounds to nearest integer, no decimal places.
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

export function integerRenderer(value: unknown, _column: ResolvedColumn): CellDescriptor {
  const n = toFiniteNumber(value);
  if (n === null) return { kind: 'raw', value };
  const rounded = Math.round(n);
  const formatted = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(rounded);
  return { kind: 'number', value: rounded, formatted };
}

registerRenderer('integer', integerRenderer);
