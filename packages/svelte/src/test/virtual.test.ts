/**
 * virtual.test.ts — Unit tests for row/column virtualization thresholds (PERF-02, PERF-06)
 * Wave 0 stubs: tests are semantically correct but fail until virtualizer is wired in Wave 2 and Wave 5.
 */
import { describe, it } from 'vitest';

describe('Row virtualization (PERF-02)', () => {
  it('TODO Wave 2 — row virtualizer activates when row count exceeds virtualizeAt threshold', () => {
    // Wave 0 stub: will be replaced with real Table mount test in Wave 2 plan
    throw new Error('TODO: implement in Wave 2 (04-02-PLAN) — mount Table with 201 rows, check that virtualizer store is created');
  });

  it('TODO Wave 2 — row height defaults to 48px from --tc-row-height CSS variable', () => {
    throw new Error('TODO: implement in Wave 2 — check estimateSize returns 48 for default --tc-row-height');
  });
});

describe('Column virtualization (PERF-06)', () => {
  it('TODO Wave 5 — column virtualizer activates when resolvedColumns.length > 20', () => {
    // Wave 0 stub: will be replaced in Wave 5 (04-05-PLAN)
    throw new Error('TODO: implement in Wave 5 (04-05-PLAN) — mount Table with 21 columns, check columnVirtualizer store is created');
  });

  it('TODO Wave 5 — fewer than 20 columns do not activate column virtualization', () => {
    throw new Error('TODO: implement in Wave 5');
  });
});
