import { describe, it, expect, afterEach } from 'vitest';
import { currencyRenderer } from './currency.js';
import { clearRegistry } from '../registry/index.js';
import type { ResolvedColumn } from '../types.js';

const col = { key: 'price', type: 'currency', label: 'Price' } as ResolvedColumn;

afterEach(() => clearRegistry());

describe('currencyRenderer', () => {
  it('returns raw for null', () => {
    expect(currencyRenderer(null, col).kind).toBe('raw');
  });
  it('returns raw for undefined', () => {
    expect(currencyRenderer(undefined, col).kind).toBe('raw');
  });
  it('returns raw for non-numeric string', () => {
    expect(currencyRenderer('abc', col).kind).toBe('raw');
  });
  it('formats a plain number', () => {
    const result = currencyRenderer(42, col);
    expect(result.kind).toBe('number');
    if (result.kind === 'number') {
      expect(result.value).toBe(42);
      expect(result.formatted).toContain('42');
    }
  });
  it('strips $ symbol and parses', () => {
    const result = currencyRenderer('$99.99', col);
    expect(result.kind).toBe('number');
    if (result.kind === 'number') expect(result.value).toBeCloseTo(99.99);
  });
  it('strips € symbol and parses', () => {
    const result = currencyRenderer('€50', col);
    expect(result.kind).toBe('number');
    if (result.kind === 'number') expect(result.value).toBe(50);
  });
  it('formatted string is non-empty', () => {
    const result = currencyRenderer(100, col);
    if (result.kind === 'number') expect(result.formatted.length).toBeGreaterThan(0);
  });
  it('handles negative currency values', () => {
    const result = currencyRenderer(-25.50, col);
    expect(result.kind).toBe('number');
    if (result.kind === 'number') expect(result.value).toBeCloseTo(-25.50);
  });
  it('handles zero', () => {
    const result = currencyRenderer(0, col);
    expect(result.kind).toBe('number');
    if (result.kind === 'number') expect(result.value).toBe(0);
  });
});
