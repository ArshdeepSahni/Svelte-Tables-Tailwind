/**
 * @tablecraft/core — Badge renderer
 *
 * Renders string values as colored pill/tag badges with 'default' variant.
 * For semantic variant assignment based on value content, use the status renderer.
 * Self-registers on module initialization.
 *
 * CORE-07: Tree-shakable — importing only this file loads only this renderer.
 */

import type { CellDescriptor, ResolvedColumn } from '../types.js';
import { registerRenderer } from '../registry/index.js';

export function badgeRenderer(value: unknown, _column: ResolvedColumn): CellDescriptor {
  if (value === null || value === undefined) return { kind: 'raw', value };
  return { kind: 'badge', label: String(value), variant: 'default' };
}

registerRenderer('badge', badgeRenderer);
