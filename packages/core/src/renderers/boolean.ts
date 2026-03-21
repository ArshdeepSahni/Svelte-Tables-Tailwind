/**
 * @tablecraft/core — Boolean renderer
 *
 * Detects truthy values from actual booleans, numbers, and common string representations.
 * Truthy strings: 'true', 'yes', 'on', '1' (case-insensitive).
 * Self-registers on module initialization.
 *
 * CORE-07: Tree-shakable — importing only this file loads only this renderer.
 */

import type { CellDescriptor, ResolvedColumn } from '../types.js';
import { registerRenderer } from '../registry/index.js';

const TRUTHY_STRINGS = new Set(['true', 'yes', 'on', '1']);

export function booleanRenderer(value: unknown, _column: ResolvedColumn): CellDescriptor {
  if (value === null || value === undefined) return { kind: 'raw', value };
  if (typeof value === 'boolean') return { kind: 'boolean', value };
  if (typeof value === 'number') return { kind: 'boolean', value: value !== 0 };
  const str = String(value).toLowerCase().trim();
  return { kind: 'boolean', value: TRUTHY_STRINGS.has(str) };
}

registerRenderer('boolean', booleanRenderer);
