/**
 * @tablecraft/core — Date renderer
 *
 * Formats date values using Intl.DateTimeFormat with date-only format.
 * Accepts ISO date strings or Date objects. Falls back to text for invalid dates.
 * Self-registers on module initialization.
 *
 * CORE-07: Tree-shakable — importing only this file loads only this renderer.
 */

import type { CellDescriptor, ResolvedColumn } from '../types.js';
import { registerRenderer } from '../registry/index.js';

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

export function dateRenderer(value: unknown, _column: ResolvedColumn): CellDescriptor {
  if (value === null || value === undefined || value === '') return { kind: 'raw', value };
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return { kind: 'text', value: String(value) };
  return { kind: 'text', value: DATE_FORMAT.format(date) };
}

registerRenderer('date', dateRenderer);
