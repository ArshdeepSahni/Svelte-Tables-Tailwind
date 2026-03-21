import { describe, it, expect, afterEach } from 'vitest';
import { datetimeRenderer } from './datetime.js';
import { clearRegistry } from '../registry/index.js';
import type { ResolvedColumn } from '../types.js';

const col = { key: 'updated', type: 'datetime', label: 'Updated' } as ResolvedColumn;

afterEach(() => clearRegistry());

describe('datetimeRenderer', () => {
  it('returns raw for null', () => {
    expect(datetimeRenderer(null, col).kind).toBe('raw');
  });
  it('returns raw for undefined', () => {
    expect(datetimeRenderer(undefined, col).kind).toBe('raw');
  });
  it('returns raw for empty string', () => {
    expect(datetimeRenderer('', col).kind).toBe('raw');
  });
  it('formats an ISO datetime string', () => {
    const result = datetimeRenderer('2024-01-15T10:30:00Z', col);
    expect(result.kind).toBe('text');
    if (result.kind === 'text') expect(result.value.length).toBeGreaterThan(0);
  });
  it('formats a Date object', () => {
    const result = datetimeRenderer(new Date('2024-01-15T10:30:00Z'), col);
    expect(result.kind).toBe('text');
    if (result.kind === 'text') expect(result.value.length).toBeGreaterThan(0);
  });
  it('falls back to text for invalid datetime string', () => {
    const result = datetimeRenderer('invalid-dt', col);
    expect(result.kind).toBe('text');
    if (result.kind === 'text') expect(result.value).toBe('invalid-dt');
  });
  it('formatted output contains year from ISO datetime', () => {
    const result = datetimeRenderer('2024-03-21T09:00:00Z', col);
    if (result.kind === 'text') expect(result.value).toContain('2024');
  });
});
