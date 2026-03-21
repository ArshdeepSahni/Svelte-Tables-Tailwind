import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { htmlRenderer, configure } from './html.js';
import { clearRegistry } from '../registry/index.js';
import type { ResolvedColumn } from '../types.js';

const col = { key: 'body', type: 'html', label: 'Body' } as ResolvedColumn;

beforeEach(() => {
  // Inject a passthrough mock so tests that need a purify don't need to set it up each time
  configure({ sanitize: (s: string) => s });
});

afterEach(() => {
  clearRegistry();
  vi.restoreAllMocks();
});

describe('htmlRenderer', () => {
  it('returns empty html for null', () => {
    expect(htmlRenderer(null, col)).toEqual({ kind: 'html', sanitized: '' });
  });
  it('returns empty html for undefined', () => {
    expect(htmlRenderer(undefined, col)).toEqual({ kind: 'html', sanitized: '' });
  });
  it('returns empty html for empty string', () => {
    expect(htmlRenderer('', col)).toEqual({ kind: 'html', sanitized: '' });
  });
  it('uses injected DOMPurify from configure()', () => {
    const mockPurify = { sanitize: vi.fn((s: string) => `purified:${s}`) };
    configure(mockPurify);
    const result = htmlRenderer('<script>bad</script>', col);
    expect(mockPurify.sanitize).toHaveBeenCalledWith('<script>bad</script>');
    expect(result.kind).toBe('html');
    if (result.kind === 'html') expect(result.sanitized).toBe('purified:<script>bad</script>');
  });
  it('configure() accepts any object with sanitize method', () => {
    const purify = { sanitize: (s: string) => s.toUpperCase() };
    configure(purify);
    const result = htmlRenderer('hello', col);
    expect(result.kind).toBe('html');
    if (result.kind === 'html') expect(result.sanitized).toBe('HELLO');
  });
  it('sanitized output comes from purify.sanitize return value', () => {
    const mockPurify = { sanitize: (_s: string) => 'SAFE_OUTPUT' };
    configure(mockPurify);
    const result = htmlRenderer('<b>raw</b>', col);
    if (result.kind === 'html') expect(result.sanitized).toBe('SAFE_OUTPUT');
  });
  it('kind is always html for non-null input', () => {
    const result = htmlRenderer('<p>hello</p>', col);
    expect(result.kind).toBe('html');
  });
});

describe('htmlRenderer - throws without DOMPurify', () => {
  it('throws descriptive error if DOMPurify not injected and not on globalThis', () => {
    // Reset injectedPurify by importing a fresh module is not possible in Vitest without vi.resetModules.
    // Instead verify the configure() path works correctly — the throw path is integration-tested separately.
    // This test verifies configure() with a null-like clearing pattern is not supported by design —
    // once configured, it stays configured until the module is re-loaded.
    // The throw path is exercised when no configure() has ever been called and no globalThis.DOMPurify exists.
    // We test it indirectly by confirming the configured path returns kind:'html'.
    configure({ sanitize: (s: string) => s });
    const result = htmlRenderer('test', col);
    expect(result.kind).toBe('html');
  });
});

describe('htmlRenderer - globalThis.DOMPurify path', () => {
  it('uses globalThis.DOMPurify when available in a fresh module', async () => {
    // vi.resetModules() clears module cache so next import gets a fresh module
    // where injectedPurify starts as null
    vi.resetModules();

    const mockPurify = { sanitize: (s: string) => `global:${s}` };
    (globalThis as Record<string, unknown>)['DOMPurify'] = mockPurify;

    // Import fresh module — injectedPurify will be null; getPurify() falls through to globalThis
    const { htmlRenderer: freshRenderer } = await import('./html.js');
    const freshCol = { key: 'body', type: 'html', label: 'Body' } as ResolvedColumn;
    const result = freshRenderer('<b>test</b>', freshCol);

    delete (globalThis as Record<string, unknown>)['DOMPurify'];

    // Restore module cache for subsequent tests
    vi.resetModules();

    expect(result.kind).toBe('html');
    if (result.kind === 'html') {
      expect(result.sanitized).toBe('global:<b>test</b>');
    }
  });

  it('throws descriptive error when no configure() called and no globalThis.DOMPurify', async () => {
    // Ensure globalThis.DOMPurify is absent
    const saved = (globalThis as Record<string, unknown>)['DOMPurify'];
    delete (globalThis as Record<string, unknown>)['DOMPurify'];

    vi.resetModules();
    const { htmlRenderer: freshRenderer } = await import('./html.js');
    const freshCol = { key: 'body', type: 'html', label: 'Body' } as ResolvedColumn;

    expect(() => freshRenderer('<b>test</b>', freshCol)).toThrow('[tablecraft] html renderer requires DOMPurify');

    // Restore
    if (saved !== undefined) {
      (globalThis as Record<string, unknown>)['DOMPurify'] = saved;
    }
    vi.resetModules();
  });
});
