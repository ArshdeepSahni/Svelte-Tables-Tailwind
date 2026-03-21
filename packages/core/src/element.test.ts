// packages/core/src/element.test.ts
import { describe, it, expect } from 'vitest';

// Tests are stubs — they will FAIL until Plan 02 creates src/element.ts

describe('TcTable — SSR safety', () => {
  it('WC-05: importing element.ts in a Node.js environment does not throw', async () => {
    // Must not throw "customElements is not defined" or "window is not defined"
    await expect(import('./element.js')).resolves.not.toThrow();
  });

  it('WC-05: TcTable class is exported from element.ts', async () => {
    const mod = await import('./element.js');
    expect(mod.TcTable).toBeDefined();
    expect(typeof mod.TcTable).toBe('function');
  });
});

describe('TcTable — static properties declaration', () => {
  it('WC-02: TcTable declares data and columns as non-attribute properties', async () => {
    const { TcTable } = await import('./element.js');
    const props = (TcTable as unknown as { properties: Record<string, unknown> }).properties;
    expect(props).toBeDefined();
    expect((props['data'] as { attribute: boolean }).attribute).toBe(false);
    expect((props['columns'] as { attribute: boolean }).attribute).toBe(false);
  });

  it('WC-03: TcTable declares row-height as a numeric attribute', async () => {
    const { TcTable } = await import('./element.js');
    const props = (TcTable as unknown as { properties: Record<string, unknown> }).properties;
    expect(props['rowHeight']).toMatchObject({ type: Number, attribute: 'row-height' });
  });

  it('WC-03: TcTable declares bordered, striped, loading, filterable, selectable as boolean attributes', async () => {
    const { TcTable } = await import('./element.js');
    const props = (TcTable as unknown as { properties: Record<string, unknown> }).properties;
    expect(props['bordered']).toMatchObject({ type: Boolean });
    expect(props['striped']).toMatchObject({ type: Boolean });
    expect(props['loading']).toMatchObject({ type: Boolean });
    expect(props['filterable']).toMatchObject({ type: Boolean });
    expect(props['selectable']).toMatchObject({ type: Boolean });
  });
});
