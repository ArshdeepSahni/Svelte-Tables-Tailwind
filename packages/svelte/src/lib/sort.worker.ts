/// <reference lib="webworker" />
/**
 * sort.worker.ts — Web Worker for non-blocking sort of large datasets.
 * Imported in Table.svelte via: new Worker(new URL('./sort.worker.ts', import.meta.url), { type: 'module' })
 * For the published npm package, vite.config.ts must pre-compile this.
 * SSR guard lives in Table.svelte — this file never runs in Node.
 */

export interface SortMessage {
  data: Record<string, unknown>[];
  key: string;
  dir: 'asc' | 'desc';
}

export interface SortResult {
  sorted: Record<string, unknown>[];
}

// Extracted comparator — also importable directly in unit tests (no Worker needed)
export function sortComparator(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  key: string,
  dir: 'asc' | 'desc',
): number {
  const av = a[key];
  const bv = b[key];
  const d = dir === 'asc' ? 1 : -1;
  if (av == null) return d;
  if (bv == null) return -d;
  if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * d;
  return String(av).localeCompare(String(bv)) * d;
}

self.addEventListener('message', (e: MessageEvent<SortMessage>) => {
  const { data, key, dir } = e.data;
  const sorted = [...data].sort((a, b) => sortComparator(a, b, key, dir));
  self.postMessage({ sorted } satisfies SortResult);
});
