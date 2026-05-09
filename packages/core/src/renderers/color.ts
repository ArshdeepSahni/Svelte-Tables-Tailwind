/**
 * @tablecraft/core — Color renderer
 *
 * Renders hex/rgb color strings as a visual swatch with the hex code.
 * Self-registers on module initialization.
 *
 * CORE-07: Tree-shakable — importing only this file loads only this renderer.
 */

import type { CellDescriptor, ResolvedColumn } from '../types.js';
import { registerRenderer } from '../registry/index.js';

/** Normalize a color value to hex format. Falls back to the raw string. */
function normalizeColor(value: string): string {
  const trimmed = value.trim().toLowerCase();

  // Already hex
  if (/^#[0-9a-f]{3,8}$/i.test(trimmed)) {
    // Expand 3-char hex to 6-char
    if (trimmed.length === 4) {
      return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
    }
    return trimmed;
  }

  // rgb(r, g, b) → #rrggbb
  const rgbMatch = trimmed.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return `#${Number(r).toString(16).padStart(2, '0')}${Number(g).toString(16).padStart(2, '0')}${Number(b).toString(16).padStart(2, '0')}`;
  }

  return trimmed;
}

export function colorRenderer(value: unknown, _column: ResolvedColumn): CellDescriptor {
  if (value === null || value === undefined) return { kind: 'raw', value };
  if (typeof value !== 'string') return { kind: 'raw', value };

  return { kind: 'color', hex: normalizeColor(value) };
}

registerRenderer('color', colorRenderer);
