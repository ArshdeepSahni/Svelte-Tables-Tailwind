/**
 * @tablecraft/core — Currency renderer
 *
 * Formats currency values using Intl.NumberFormat with style:'currency'.
 * Strips common currency symbols and commas before parsing string inputs.
 * Defaults to USD — per-column currency config is a Phase 6 concern.
 * Self-registers on module initialization.
 *
 * CORE-07: Tree-shakable — importing only this file loads only this renderer.
 */

import type { CellDescriptor, ResolvedColumn } from '../types.js';
import { registerRenderer } from '../registry/index.js';

function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  // Strip common currency symbols and commas before parsing
  const str = String(value).replace(/[¥€£$₹,\s]/g, '').replace(/[A-Z]{3}$/i, '').trim();
  const n = Number(str);
  return Number.isFinite(n) ? n : null;
}

export function currencyRenderer(value: unknown, _column: ResolvedColumn): CellDescriptor {
  const n = toFiniteNumber(value);
  if (n === null) return { kind: 'raw', value };
  // Default to USD — column-level currency config is a Phase 6 concern
  const formatted = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
  return { kind: 'number', value: n, formatted };
}

registerRenderer('currency', currencyRenderer);
