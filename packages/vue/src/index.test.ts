// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';

describe('@tablecraft/vue — wrapper exports', () => {
  it('WC-08: index.ts can be imported without throwing', async () => {
    // In jsdom environment, Vue SFC imports may not be instantiable but the module resolves.
    await expect(import('./index.js')).resolves.not.toThrow();
  });

  it('WC-08: Table is exported from package entry', async () => {
    const mod = await import('./index.js');
    expect(mod.Table).toBeDefined();
  });
});
