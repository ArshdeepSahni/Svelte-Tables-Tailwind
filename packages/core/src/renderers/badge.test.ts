import { describe, it, expect, afterEach } from 'vitest';
import { badgeRenderer } from './badge.js';
import { clearRegistry } from '../registry/index.js';
import type { ResolvedColumn } from '../types.js';

const col = { key: 'tag', type: 'badge', label: 'Tag' } as ResolvedColumn;

afterEach(() => clearRegistry());

describe('badgeRenderer', () => {
  it('returns raw for null', () => {
    expect(badgeRenderer(null, col).kind).toBe('raw');
  });
  it('returns raw for undefined', () => {
    expect(badgeRenderer(undefined, col).kind).toBe('raw');
  });
  it('returns badge with default variant for string', () => {
    const result = badgeRenderer('premium', col);
    expect(result).toEqual({ kind: 'badge', label: 'premium', variant: 'default' });
  });
  it('converts number to string label', () => {
    const result = badgeRenderer(42, col);
    expect(result.kind).toBe('badge');
    if (result.kind === 'badge') {
      expect(result.label).toBe('42');
      expect(result.variant).toBe('default');
    }
  });
  it('handles empty string as badge with empty label', () => {
    const result = badgeRenderer('', col);
    expect(result.kind).toBe('badge');
    if (result.kind === 'badge') {
      expect(result.label).toBe('');
      expect(result.variant).toBe('default');
    }
  });
  it('always uses default variant (no auto-semantic for badge)', () => {
    // badge is intentionally always 'default' — use status for semantic variants
    const result = badgeRenderer('active', col);
    expect(result.kind).toBe('badge');
    if (result.kind === 'badge') expect(result.variant).toBe('default');
  });
  it('converts boolean to string label', () => {
    const result = badgeRenderer(true, col);
    expect(result.kind).toBe('badge');
    if (result.kind === 'badge') expect(result.label).toBe('true');
  });
});
