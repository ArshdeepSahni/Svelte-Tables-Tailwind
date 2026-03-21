import { describe, it, expect, afterEach } from 'vitest';
import { timeRenderer } from './time.js';
import { clearRegistry } from '../registry/index.js';
import type { ResolvedColumn } from '../types.js';

const col = { key: 'start', type: 'time', label: 'Start Time' } as ResolvedColumn;

afterEach(() => clearRegistry());

describe('timeRenderer', () => {
  it('returns raw for null', () => {
    expect(timeRenderer(null, col).kind).toBe('raw');
  });
  it('returns raw for undefined', () => {
    expect(timeRenderer(undefined, col).kind).toBe('raw');
  });
  it('returns raw for empty string', () => {
    expect(timeRenderer('', col).kind).toBe('raw');
  });
  it('returns text for HH:MM time string', () => {
    const result = timeRenderer('14:30', col);
    expect(result).toEqual({ kind: 'text', value: '14:30' });
  });
  it('returns text for HH:MM:SS time string', () => {
    const result = timeRenderer('09:00:15', col);
    expect(result).toEqual({ kind: 'text', value: '09:00:15' });
  });
  it('converts non-string values to string', () => {
    const result = timeRenderer(1430, col);
    expect(result.kind).toBe('text');
    if (result.kind === 'text') expect(result.value).toBe('1430');
  });
  it('passes midnight through as-is', () => {
    const result = timeRenderer('00:00:00', col);
    expect(result).toEqual({ kind: 'text', value: '00:00:00' });
  });
});
