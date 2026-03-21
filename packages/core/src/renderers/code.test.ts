import { describe, it, expect, afterEach } from 'vitest';
import { codeRenderer } from './code.js';
import { clearRegistry } from '../registry/index.js';
import type { ResolvedColumn } from '../types.js';

const col = { key: 'snippet', type: 'code', label: 'Snippet' } as ResolvedColumn;

afterEach(() => clearRegistry());

describe('codeRenderer', () => {
  it('returns raw for null', () => {
    expect(codeRenderer(null, col).kind).toBe('raw');
  });
  it('returns raw for undefined', () => {
    expect(codeRenderer(undefined, col).kind).toBe('raw');
  });
  it('returns code descriptor with raw string value', () => {
    const result = codeRenderer('function foo() { return 1; }', col);
    expect(result).toEqual({ kind: 'code', value: 'function foo() { return 1; }' });
  });
  it('handles multi-line code strings', () => {
    const code = 'const x = 1;\nconst y = 2;\nreturn x + y;';
    const result = codeRenderer(code, col);
    expect(result.kind).toBe('code');
    if (result.kind === 'code') expect(result.value).toBe(code);
  });
  it('converts non-string values to string', () => {
    const result = codeRenderer(42, col);
    expect(result.kind).toBe('code');
    if (result.kind === 'code') expect(result.value).toBe('42');
  });
  it('handles empty string', () => {
    const result = codeRenderer('', col);
    expect(result).toEqual({ kind: 'code', value: '' });
  });
  it('does NOT sanitize content (XSS prevention is Phase 3 text binding concern)', () => {
    const xss = '<script>alert("xss")</script>';
    const result = codeRenderer(xss, col);
    // Code renderer passes raw — XSS prevention is in the Svelte text binding, not here
    expect(result.kind).toBe('code');
    if (result.kind === 'code') expect(result.value).toBe(xss);
  });
  it('handles code with special characters', () => {
    const code = 'const obj = { a: 1, b: 2 }; => result';
    const result = codeRenderer(code, col);
    if (result.kind === 'code') expect(result.value).toBe(code);
  });
});
