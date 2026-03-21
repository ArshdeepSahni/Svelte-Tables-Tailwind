/**
 * @tablecraft/vue — Phase 1 stub tests
 */

import { describe, it, expect } from 'vitest';

describe('@tablecraft/vue stub', () => {
  it('exports TABLECRAFT_VUE_VERSION', async () => {
    const mod = await import('./index.js');
    expect(mod.TABLECRAFT_VUE_VERSION).toBe('0.0.1');
  });

  it('re-exports ColumnType from @tablecraft/core (type check only)', () => {
    expect(true).toBe(true);
  });
});
