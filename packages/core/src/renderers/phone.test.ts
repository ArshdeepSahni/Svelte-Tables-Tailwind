import { describe, it, expect, afterEach } from 'vitest';
import { phoneRenderer } from './phone.js';
import { clearRegistry } from '../registry/index.js';
import type { ResolvedColumn } from '../types.js';

const col = { key: 'phone', type: 'phone', label: 'Phone' } as ResolvedColumn;

afterEach(() => clearRegistry());

describe('phoneRenderer', () => {
  it('returns raw for null', () => {
    expect(phoneRenderer(null, col).kind).toBe('raw');
  });
  it('returns raw for undefined', () => {
    expect(phoneRenderer(undefined, col).kind).toBe('raw');
  });
  it('returns raw for empty string', () => {
    expect(phoneRenderer('', col).kind).toBe('raw');
  });
  it('returns link with tel: href (digits only)', () => {
    const result = phoneRenderer('(555) 123-4567', col);
    expect(result.kind).toBe('link');
    if (result.kind === 'link') {
      expect(result.href).toBe('tel:5551234567');
      expect(result.label).toBe('(555) 123-4567');
    }
  });
  it('preserves + prefix in international numbers', () => {
    const result = phoneRenderer('+1 (555) 123-4567', col);
    expect(result.kind).toBe('link');
    if (result.kind === 'link') expect(result.href).toBe('tel:+15551234567');
  });
  it('displays original formatted number as label', () => {
    const result = phoneRenderer('+44 20 7946 0958', col);
    expect(result.kind).toBe('link');
    if (result.kind === 'link') expect(result.label).toBe('+44 20 7946 0958');
  });
  it('handles plain digit string', () => {
    const result = phoneRenderer('5551234567', col);
    expect(result.kind).toBe('link');
    if (result.kind === 'link') expect(result.href).toBe('tel:5551234567');
  });
  it('strips dots and dashes from href', () => {
    const result = phoneRenderer('555.123.4567', col);
    expect(result.kind).toBe('link');
    if (result.kind === 'link') expect(result.href).toBe('tel:5551234567');
  });
});
