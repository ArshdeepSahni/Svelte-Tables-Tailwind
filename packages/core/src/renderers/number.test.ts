import { describe, it, expect, afterEach } from 'vitest';
import { numberRenderer } from './number.js';
import { clearRegistry } from '../registry/index.js';
import type { ResolvedColumn } from '../types.js';

const col = { key: 'x', type: 'number', label: 'X' } as ResolvedColumn;

afterEach(() => clearRegistry());

describe('numberRenderer', () => {
  it('returns raw for null', () => {
    expect(numberRenderer(null, col).kind).toBe('raw');
  });
  it('returns raw for undefined', () => {
    expect(numberRenderer(undefined, col).kind).toBe('raw');
  });
  it('returns raw for NaN string', () => {
    expect(numberRenderer('not-a-number', col).kind).toBe('raw');
  });
  it('returns raw for Infinity', () => {
    expect(numberRenderer(Infinity, col).kind).toBe('raw');
  });
  it('returns raw for -Infinity', () => {
    expect(numberRenderer(-Infinity, col).kind).toBe('raw');
  });
  it('formats a positive number', () => {
    const result = numberRenderer(3.14, col);
    expect(result.kind).toBe('number');
    if (result.kind === 'number') {
      expect(result.value).toBe(3.14);
      expect(result.formatted.length).toBeGreaterThan(0);
    }
  });
  it('formats a negative number', () => {
    const result = numberRenderer(-42.5, col);
    expect(result.kind).toBe('number');
    if (result.kind === 'number') expect(result.value).toBe(-42.5);
  });
  it('formats zero', () => {
    const result = numberRenderer(0, col);
    expect(result.kind).toBe('number');
    if (result.kind === 'number') expect(result.value).toBe(0);
  });
  it('parses numeric strings', () => {
    const result = numberRenderer('99.9', col);
    expect(result.kind).toBe('number');
    if (result.kind === 'number') expect(result.value).toBe(99.9);
  });
});
