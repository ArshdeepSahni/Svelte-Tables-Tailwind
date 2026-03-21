import { describe, it, expect, afterEach } from 'vitest';
import { dateRenderer } from './date.js';
import { clearRegistry } from '../registry/index.js';
import type { ResolvedColumn } from '../types.js';

const col = { key: 'created', type: 'date', label: 'Created' } as ResolvedColumn;

afterEach(() => clearRegistry());

describe('dateRenderer', () => {
  it('returns raw for null', () => {
    expect(dateRenderer(null, col).kind).toBe('raw');
  });
  it('returns raw for undefined', () => {
    expect(dateRenderer(undefined, col).kind).toBe('raw');
  });
  it('returns raw for empty string', () => {
    expect(dateRenderer('', col).kind).toBe('raw');
  });
  it('formats an ISO date string', () => {
    const result = dateRenderer('2024-01-15', col);
    expect(result.kind).toBe('text');
    if (result.kind === 'text') expect(result.value.length).toBeGreaterThan(0);
  });
  it('formats a Date object', () => {
    const result = dateRenderer(new Date('2024-01-15T00:00:00Z'), col);
    expect(result.kind).toBe('text');
    if (result.kind === 'text') expect(result.value.length).toBeGreaterThan(0);
  });
  it('falls back to text for invalid date string', () => {
    const result = dateRenderer('not-a-date', col);
    expect(result.kind).toBe('text');
    if (result.kind === 'text') expect(result.value).toBe('not-a-date');
  });
  it('formatted output contains year from ISO date', () => {
    const result = dateRenderer('2024-06-20', col);
    if (result.kind === 'text') expect(result.value).toContain('2024');
  });
});
