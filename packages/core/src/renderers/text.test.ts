import { describe, it, expect, afterEach } from 'vitest';
import { textRenderer } from './text.js';
import { clearRegistry } from '../registry/index.js';
import type { ResolvedColumn } from '../types.js';

const col = { key: 'x', type: 'text', label: 'X' } as ResolvedColumn;

afterEach(() => clearRegistry());

describe('textRenderer', () => {
  it('returns raw for null', () => {
    expect(textRenderer(null, col)).toEqual({ kind: 'raw', value: null });
  });
  it('returns raw for undefined', () => {
    expect(textRenderer(undefined, col)).toEqual({ kind: 'raw', value: undefined });
  });
  it('converts string values', () => {
    expect(textRenderer('hello', col)).toEqual({ kind: 'text', value: 'hello' });
  });
  it('converts numbers to string', () => {
    expect(textRenderer(42, col)).toEqual({ kind: 'text', value: '42' });
  });
  it('handles empty string', () => {
    expect(textRenderer('', col)).toEqual({ kind: 'text', value: '' });
  });
  it('truncates at 255 chars with ellipsis', () => {
    const long = 'a'.repeat(300);
    const result = textRenderer(long, col);
    expect(result.kind).toBe('text');
    if (result.kind === 'text') {
      expect(result.value.length).toBeLessThanOrEqual(256); // 255 chars + ellipsis char
      expect(result.value.endsWith('\u2026')).toBe(true);
    }
  });
  it('does not truncate strings under 255 chars', () => {
    const str = 'a'.repeat(200);
    const result = textRenderer(str, col);
    expect(result.kind).toBe('text');
    if (result.kind === 'text') expect(result.value).toBe(str);
  });
  it('converts boolean values to string', () => {
    expect(textRenderer(true, col)).toEqual({ kind: 'text', value: 'true' });
  });
});
