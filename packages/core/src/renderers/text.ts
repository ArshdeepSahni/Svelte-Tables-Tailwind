/**
 * @tablecraft/core — Text renderer
 *
 * Fallback renderer for any value. Converts to string and truncates at 255 chars.
 * Self-registers on module initialization — import this file for side-effect registration.
 *
 * CORE-07: Tree-shakable — importing only this file loads only this renderer.
 */

import type { CellDescriptor, ResolvedColumn } from '../types.js';
import { registerRenderer } from '../registry/index.js';

const MAX_LENGTH = 255;

export function textRenderer(value: unknown, _column: ResolvedColumn): CellDescriptor {
  if (value === null || value === undefined) return { kind: 'raw', value };
  const str = String(value);
  const truncated = str.length > MAX_LENGTH ? str.slice(0, MAX_LENGTH) + '\u2026' : str;
  return { kind: 'text', value: truncated };
}

registerRenderer('text', textRenderer);
