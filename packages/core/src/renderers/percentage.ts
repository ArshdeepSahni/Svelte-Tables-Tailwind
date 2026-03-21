/**
 * @tablecraft/core — Percentage renderer
 *
 * Formats percentage values. Multiplies by 100 if value <= 1.0 (decimal ratio heuristic).
 * Strips % suffix from string inputs. Appends % to the formatted output.
 * Self-registers on module initialization.
 *
 * CORE-07: Tree-shakable — importing only this file loads only this renderer.
 */

import type { CellDescriptor, ResolvedColumn } from '../types.js';
import { registerRenderer } from '../registry/index.js';

function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const str = String(value).replace(/%$/, '').trim();
  const n = Number(str);
  return Number.isFinite(n) ? n : null;
}

export function percentageRenderer(value: unknown, _column: ResolvedColumn): CellDescriptor {
  const n = toFiniteNumber(value);
  if (n === null) return { kind: 'raw', value };
  // Heuristic: multiply by 100 if value <= 1.0 (treat as decimal ratio)
  // Known ambiguity: value of 1 becomes 100%, not 1%. Documented design choice.
  const pct = Math.abs(n) <= 1.0 ? n * 100 : n;
  const formatted = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(pct) + '%';
  return { kind: 'number', value: pct, formatted };
}

registerRenderer('percentage', percentageRenderer);
