/// <reference lib="webworker" />
/**
 * sort.worker.ts — Web Worker for non-blocking sort of large datasets.
 * Returns sorted indices (not sorted rows) to avoid re-serializing ProcessedRow objects.
 * Imported in Table.svelte via: new Worker(new URL('./sort.worker.ts', import.meta.url), { type: 'module' })
 */

export interface SortMessage {
  data: Record<string, unknown>[];
  key: string;
  dir: 'asc' | 'desc';
}

export interface SortResult {
  /** Sorted indices into the original data array — avoids re-serializing row objects */
  sortedIndices: number[];
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
  // Sort indices rather than copying the full array — avoids a redundant structured-clone on postMessage
  const indices = Array.from({ length: data.length }, (_, i) => i);
  indices.sort((a, b) => sortComparator(data[a], data[b], key, dir));
  self.postMessage({ sortedIndices: indices } satisfies SortResult);
});
