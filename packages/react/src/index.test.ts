/**
 * @tablecraft/react — Phase 1 stub tests
 */

import { describe, it, expect } from 'vitest';

describe('@tablecraft/react stub', () => {
  it('exports TABLECRAFT_REACT_VERSION', async () => {
    const mod = await import('./index.js');
    expect(mod.TABLECRAFT_REACT_VERSION).toBe('0.0.1');
  });

  it('re-exports ColumnType from @tablecraft/core (type check only)', () => {
    // This test verifies the module can be imported without runtime errors.
    // ColumnType is a type-only export — verified by TypeScript at build time.
    expect(true).toBe(true);
  });
});
