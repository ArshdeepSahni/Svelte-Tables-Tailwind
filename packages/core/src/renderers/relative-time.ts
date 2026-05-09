/**
 * @tablecraft/core — Relative Time renderer
 *
 * Converts ISO date strings or Date objects to human-friendly relative time
 * (e.g. "3 days ago", "in 2 hours"). Also provides the absolute date as fallback.
 * Self-registers on module initialization.
 *
 * CORE-07: Tree-shakable — importing only this file loads only this renderer.
 */

import type { CellDescriptor, ResolvedColumn } from '../types.js';
import { registerRenderer } from '../registry/index.js';

const UNITS: [string, number][] = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['week', 7 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
  ['second', 1000],
];

function toRelative(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const absDiff = Math.abs(diff);
  const isFuture = diff < 0;

  for (const [unit, ms] of UNITS) {
    const count = Math.floor(absDiff / ms);
    if (count >= 1) {
      const plural = count !== 1 ? 's' : '';
      return isFuture ? `in ${count} ${unit}${plural}` : `${count} ${unit}${plural} ago`;
    }
  }
  return 'just now';
}

export function relativeTimeRenderer(value: unknown, _column: ResolvedColumn): CellDescriptor {
  if (value === null || value === undefined) return { kind: 'raw', value };

  let date: Date;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string' || typeof value === 'number') {
    date = new Date(value);
  } else {
    return { kind: 'raw', value };
  }

  if (isNaN(date.getTime())) return { kind: 'text', value: String(value) };

  return {
    kind: 'relative-time',
    relative: toRelative(date),
    iso: date.toISOString(),
    absolute: date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

registerRenderer('relative-time', relativeTimeRenderer);
