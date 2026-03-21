/**
 * @tablecraft/core — Time renderer
 *
 * Displays time strings as-is. Time strings like "14:30" or "14:30:00" are passed through
 * without locale formatting — bare time strings lack a date context for Intl parsing.
 * Self-registers on module initialization.
 *
 * CORE-07: Tree-shakable — importing only this file loads only this renderer.
 */

import type { CellDescriptor, ResolvedColumn } from '../types.js';
import { registerRenderer } from '../registry/index.js';

export function timeRenderer(value: unknown, _column: ResolvedColumn): CellDescriptor {
  if (value === null || value === undefined || value === '') return { kind: 'raw', value };
  // Time strings like "14:30" or "14:30:00" — display as-is (no locale parsing for bare time strings)
  return { kind: 'text', value: String(value) };
}

registerRenderer('time', timeRenderer);
