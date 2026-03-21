/**
 * CORE-06: Renderer plugin registry tests
 * Tests: register, retrieve, override, unregister, duplicate registration warning.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
  registerRenderer,
  getRenderer,
  hasRenderer,
  unregisterRenderer,
  clearRegistry,
  getRegisteredTypes,
} from './index.js';
import type { CellDescriptor, ResolvedColumn } from '../types.js';

// Minimal RendererFn implementation for tests
function makeRenderer(kind: string): (value: unknown, column: ResolvedColumn) => CellDescriptor {
  return (value, _column) => ({
    kind: 'text',
    value: `${kind}:${String(value)}`,
  } as CellDescriptor);
}

const testRenderer = makeRenderer('test');
const altRenderer = makeRenderer('alt');

afterEach(() => {
  // Prevent cross-test pollution from auto-registration side effects
  clearRegistry();
  vi.restoreAllMocks();
});

describe('registerRenderer', () => {
  it('stores a renderer function', () => {
    registerRenderer('myType', testRenderer);
    expect(hasRenderer('myType')).toBe(true);
  });

  it('allows registration of multiple different types', () => {
    registerRenderer('typeA', testRenderer);
    registerRenderer('typeB', altRenderer);
    expect(hasRenderer('typeA')).toBe(true);
    expect(hasRenderer('typeB')).toBe(true);
  });

  it('emits console.warn on duplicate registration', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    registerRenderer('duplicate', testRenderer);
    registerRenderer('duplicate', altRenderer);
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0][0]).toContain('duplicate');
  });

  it('overwrites the previous renderer on duplicate registration', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    registerRenderer('overwrite', testRenderer);
    registerRenderer('overwrite', altRenderer);
    expect(getRenderer('overwrite')).toBe(altRenderer);
  });
});

describe('getRenderer', () => {
  it('retrieves a registered renderer', () => {
    registerRenderer('myType', testRenderer);
    expect(getRenderer('myType')).toBe(testRenderer);
  });

  it('returns undefined for unregistered types', () => {
    expect(getRenderer('nonexistent')).toBeUndefined();
  });

  it('returns the correct renderer when multiple are registered', () => {
    registerRenderer('typeA', testRenderer);
    registerRenderer('typeB', altRenderer);
    expect(getRenderer('typeA')).toBe(testRenderer);
    expect(getRenderer('typeB')).toBe(altRenderer);
  });
});

describe('hasRenderer', () => {
  it('returns true for registered type', () => {
    registerRenderer('myType', testRenderer);
    expect(hasRenderer('myType')).toBe(true);
  });

  it('returns false for unregistered type', () => {
    expect(hasRenderer('nope')).toBe(false);
  });

  it('returns false after unregisterRenderer is called', () => {
    registerRenderer('myType', testRenderer);
    unregisterRenderer('myType');
    expect(hasRenderer('myType')).toBe(false);
  });
});

describe('unregisterRenderer', () => {
  it('removes a registered renderer', () => {
    registerRenderer('myType', testRenderer);
    unregisterRenderer('myType');
    expect(hasRenderer('myType')).toBe(false);
    expect(getRenderer('myType')).toBeUndefined();
  });

  it('does nothing when type is not registered (no throw)', () => {
    expect(() => unregisterRenderer('nonexistent')).not.toThrow();
  });

  it('does not affect other registered renderers', () => {
    registerRenderer('typeA', testRenderer);
    registerRenderer('typeB', altRenderer);
    unregisterRenderer('typeA');
    expect(hasRenderer('typeB')).toBe(true);
    expect(getRenderer('typeB')).toBe(altRenderer);
  });
});

describe('clearRegistry', () => {
  it('removes all registered renderers', () => {
    registerRenderer('a', testRenderer);
    registerRenderer('b', altRenderer);
    clearRegistry();
    expect(hasRenderer('a')).toBe(false);
    expect(hasRenderer('b')).toBe(false);
  });

  it('results in empty registered types list', () => {
    registerRenderer('x', testRenderer);
    clearRegistry();
    expect(getRegisteredTypes()).toHaveLength(0);
  });
});

describe('getRegisteredTypes', () => {
  it('returns empty array when registry is empty', () => {
    expect(getRegisteredTypes()).toHaveLength(0);
  });

  it('returns all registered type names', () => {
    registerRenderer('typeA', testRenderer);
    registerRenderer('typeB', altRenderer);
    const types = getRegisteredTypes();
    expect(types).toContain('typeA');
    expect(types).toContain('typeB');
    expect(types).toHaveLength(2);
  });

  it('returns a new array (not the internal reference)', () => {
    registerRenderer('typeA', testRenderer);
    const types = getRegisteredTypes();
    types.push('injected');
    expect(getRegisteredTypes()).not.toContain('injected');
  });
});

describe('custom renderer invocation', () => {
  it('custom renderer is invoked by the retrieved function', () => {
    const customFn = vi.fn((_value: unknown, _col: ResolvedColumn): CellDescriptor => ({
      kind: 'text',
      value: 'custom-output',
    }));
    registerRenderer('sparkline', customFn);
    const retrieved = getRenderer('sparkline');
    expect(retrieved).toBeDefined();

    // Simulate engine calling the renderer
    const fakeColumn = { key: 'data', type: 'text', label: 'Data' } as ResolvedColumn;
    retrieved!([1, 2, 3], fakeColumn);

    expect(customFn).toHaveBeenCalledOnce();
    expect(customFn).toHaveBeenCalledWith([1, 2, 3], fakeColumn);
  });

  it('custom renderer output is returned verbatim', () => {
    const customOutput: CellDescriptor = { kind: 'badge', label: 'custom', variant: 'success' };
    registerRenderer('myBadge', () => customOutput);
    const retrieved = getRenderer('myBadge')!;
    const fakeColumn = { key: 'x', type: 'text', label: 'X' } as ResolvedColumn;
    expect(retrieved(null, fakeColumn)).toBe(customOutput);
  });
});

describe('built-in override pattern (CORE-06)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('consumer can replace built-in currency renderer without touching core files', () => {
    // Simulate a built-in being registered first
    const builtInCurrency = makeRenderer('builtin-currency');
    registerRenderer('currency', builtInCurrency);

    // Consumer overrides
    const customCurrency = makeRenderer('custom-currency');
    registerRenderer('currency', customCurrency);

    expect(getRenderer('currency')).toBe(customCurrency);
  });

  it('override emits deprecation-style warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    registerRenderer('html', makeRenderer('html1'));
    registerRenderer('html', makeRenderer('html2'));
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toMatch(/html.*already registered/i);
  });
});
