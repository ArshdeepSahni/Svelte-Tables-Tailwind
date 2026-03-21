import { describe, it, expect, afterEach } from 'vitest';
import { percentageRenderer } from './percentage.js';
import { clearRegistry } from '../registry/index.js';
import type { ResolvedColumn } from '../types.js';

const col = { key: 'rate', type: 'percentage', label: 'Rate' } as ResolvedColumn;

afterEach(() => clearRegistry());

describe('percentageRenderer', () => {
  it('returns raw for null', () => {
    expect(percentageRenderer(null, col).kind).toBe('raw');
  });
  it('returns raw for undefined', () => {
    expect(percentageRenderer(undefined, col).kind).toBe('raw');
  });
  it('returns raw for non-numeric string', () => {
    expect(percentageRenderer('abc', col).kind).toBe('raw');
  });
  it('multiplies by 100 when value <= 1.0 (decimal ratio)', () => {
    const result = percentageRenderer(0.75, col);
    expect(result.kind).toBe('number');
    if (result.kind === 'number') expect(result.value).toBeCloseTo(75);
  });
  it('does not double-multiply values > 1.0', () => {
    const result = percentageRenderer(75, col);
    expect(result.kind).toBe('number');
    if (result.kind === 'number') expect(result.value).toBeCloseTo(75);
  });
  it('strips % suffix and parses', () => {
    const result = percentageRenderer('42%', col);
    expect(result.kind).toBe('number');
    if (result.kind === 'number') expect(result.value).toBeCloseTo(42);
  });
  it('formatted string ends with %', () => {
    const result = percentageRenderer(0.5, col);
    expect(result.kind).toBe('number');
    if (result.kind === 'number') expect(result.formatted.endsWith('%')).toBe(true);
  });
  it('handles 0 input (0%)', () => {
    const result = percentageRenderer(0, col);
    expect(result.kind).toBe('number');
    if (result.kind === 'number') expect(result.value).toBe(0);
  });
  it('handles negative ratios', () => {
    const result = percentageRenderer(-0.1, col);
    expect(result.kind).toBe('number');
    if (result.kind === 'number') expect(result.value).toBeCloseTo(-10);
  });
});
