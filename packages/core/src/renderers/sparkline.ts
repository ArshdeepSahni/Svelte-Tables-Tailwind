/**
 * @tablecraft/core — Sparkline renderer
 *
 * Renders an array of numbers as an inline sparkline descriptor.
 * The actual SVG rendering happens in the Svelte Cell component.
 * Self-registers on module initialization.
 *
 * CORE-07: Tree-shakable — importing only this file loads only this renderer.
 */

import type { CellDescriptor, ResolvedColumn } from '../types.js';
import { registerRenderer } from '../registry/index.js';

const DEFAULT_WIDTH = 80;
const DEFAULT_HEIGHT = 24;

export function sparklineRenderer(value: unknown, _column: ResolvedColumn): CellDescriptor {
  if (value === null || value === undefined) return { kind: 'raw', value };

  let values: number[];
  if (Array.isArray(value)) {
    values = value.filter((v): v is number => typeof v === 'number' && !isNaN(v));
  } else if (typeof value === 'string') {
    // Try parsing comma-separated or JSON array
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        values = parsed.filter((v): v is number => typeof v === 'number' && !isNaN(v));
      } else {
        return { kind: 'raw', value };
      }
    } catch {
      values = value.split(',').map(Number).filter(n => !isNaN(n));
    }
  } else {
    return { kind: 'raw', value };
  }

  if (values.length === 0) return { kind: 'raw', value };

  const min = Math.min(...values);
  const max = Math.max(...values);

  return {
    kind: 'sparkline',
    values,
    min,
    max,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  };
}

registerRenderer('sparkline', sparklineRenderer);
