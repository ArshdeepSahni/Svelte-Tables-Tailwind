import { describe, it, expect, afterEach } from 'vitest';
import { integerRenderer } from './integer.js';
import { clearRegistry } from '../registry/index.js';
import type { ResolvedColumn } from '../types.js';

const col = { key: 'x', type: 'integer', label: 'X' } as ResolvedColumn;

afterEach(() => clearRegistry());

describe('integerRenderer', () => {
  it('returns raw for null', () => {
    expect(integerRenderer(null, col).kind).toBe('raw');
  });
  it('returns raw for undefined', () => {
    expect(integerRenderer(undefined, col).kind).toBe('raw');
  });
  it('returns raw for non-numeric string', () => {
    expect(integerRenderer('abc', col).kind).toBe('raw');
  });
  it('returns raw for Infinity', () => {
    expect(integerRenderer(Infinity, col).kind).toBe('raw');
  });
  it('rounds float up to integer', () => {
    const result = integerRenderer(3.7, col);
    expect(result.kind).toBe('number');
    if (result.kind === 'number') expect(result.value).toBe(4);
  });
  it('rounds float down to integer', () => {
    const result = integerRenderer(3.2, col);
    expect(result.kind).toBe('number');
    if (result.kind === 'number') expect(result.value).toBe(3);
  });
  it('handles string integer input', () => {
    const result = integerRenderer('42', col);
    expect(result.kind).toBe('number');
    if (result.kind === 'number') expect(result.value).toBe(42);
  });
  it('handles whole number input', () => {
    const result = integerRenderer(100, col);
    expect(result.kind).toBe('number');
    if (result.kind === 'number') expect(result.value).toBe(100);
  });
  it('formatted string has no decimal point', () => {
    const result = integerRenderer(1234.9, col);
    if (result.kind === 'number') expect(result.formatted).not.toContain('.');
  });
});
