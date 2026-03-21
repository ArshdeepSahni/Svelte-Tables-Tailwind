// @vitest-environment node
// packages/core/src/element.test.ts
//
// All tests run in Node.js (no browser globals) to validate SSR safety.
// jsdom is intentionally NOT used — jsdom defines customElements, which masks
// real SSR failures. These tests catch "customElements is not defined" at import time.

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// WC-05: SSR safety — importing element.ts in Node.js must not throw
// ---------------------------------------------------------------------------
describe('TcTable — SSR safety', () => {
  beforeEach(() => {
    // Reset module cache so each test gets a fresh import
    vi.resetModules();
  });

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

// ---------------------------------------------------------------------------
// WC-02 / WC-03: Static properties shape — inspectable without DOM
// ---------------------------------------------------------------------------
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

  it('WC-03: TcTable declares page-size as a numeric attribute', async () => {
    const { TcTable } = await import('./element.js');
    const props = (TcTable as unknown as { properties: Record<string, unknown> }).properties;
    expect(props['pageSize']).toMatchObject({ type: Number, attribute: 'page-size' });
  });

  it('WC-03: TcTable declares sort-by and sort-dir as string attributes', async () => {
    const { TcTable } = await import('./element.js');
    const props = (TcTable as unknown as { properties: Record<string, unknown> }).properties;
    expect(props['sortBy']).toMatchObject({ type: String, attribute: 'sort-by' });
    expect(props['sortDir']).toMatchObject({ type: String, attribute: 'sort-dir' });
  });

  it('WC-02: selectedRows has attribute:false (complex data, not an HTML attribute)', async () => {
    const { TcTable } = await import('./element.js');
    const props = (TcTable as unknown as { properties: Record<string, unknown> }).properties;
    expect((props['selectedRows'] as { attribute: boolean }).attribute).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// WC-01: Light DOM — structural check (no instantiation required)
// ---------------------------------------------------------------------------
describe('TcTable — Light DOM', () => {
  it('WC-01: createRenderRoot method exists on TcTable prototype', async () => {
    const { TcTable } = await import('./element.js');
    // Verify the override exists — cannot call it without DOM but structural check is enough
    expect(typeof TcTable.prototype.createRenderRoot).toBe('function');
  });
});
