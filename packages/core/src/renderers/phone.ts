/**
 * @tablecraft/core — Phone renderer
 *
 * Converts phone numbers to tel: links. Strips all non-digit characters for the href,
 * preserving the leading + for international numbers. Displays the original formatted
 * number as the label.
 * Self-registers on module initialization.
 *
 * CORE-07: Tree-shakable — importing only this file loads only this renderer.
 */

import type { CellDescriptor, ResolvedColumn } from '../types.js';
import { registerRenderer } from '../registry/index.js';

export function phoneRenderer(value: unknown, _column: ResolvedColumn): CellDescriptor {
  if (value === null || value === undefined || value === '') return { kind: 'raw', value };
  const display = String(value).trim();
  // Strip all non-digit characters for the tel: href (except leading +)
  const digits = display.startsWith('+')
    ? '+' + display.slice(1).replace(/\D/g, '')
    : display.replace(/\D/g, '');
  return { kind: 'link', href: `tel:${digits}`, label: display };
}

registerRenderer('phone', phoneRenderer);
