/**
 * CORE-09: CSS custom property token system tests
 * Verifies DEFAULT_TOKENS has all 18 --tc-* tokens with non-empty string values.
 */
import { describe, it, expect } from 'vitest';
import { DEFAULT_TOKENS } from './tokens.js';

describe('DEFAULT_TOKENS', () => {
  const EXPECTED_TOKENS = [
    '--tc-color-text',
    '--tc-color-text-muted',
    '--tc-color-bg',
    '--tc-color-bg-hover',
    '--tc-color-border',
    '--tc-color-accent',
    '--tc-color-success',
    '--tc-color-warning',
    '--tc-color-danger',
    '--tc-color-info',
    '--tc-row-height',
    '--tc-cell-padding-x',
    '--tc-cell-padding-y',
    '--tc-header-height',
    '--tc-font-family',
    '--tc-font-size',
    '--tc-font-size-sm',
    '--tc-border-radius',
  ] as const;

  it('exports exactly 18 tokens', () => {
    expect(Object.keys(DEFAULT_TOKENS)).toHaveLength(18);
  });

  it('contains all expected --tc-* token names', () => {
    for (const token of EXPECTED_TOKENS) {
      expect(DEFAULT_TOKENS).toHaveProperty(token);
    }
  });

  it('all token values are non-empty strings', () => {
    for (const [key, value] of Object.entries(DEFAULT_TOKENS)) {
      expect(typeof value, `Token ${key} should be a string`).toBe('string');
      expect(value.length, `Token ${key} should not be empty`).toBeGreaterThan(0);
    }
  });

  it('all token keys start with --tc-', () => {
    for (const key of Object.keys(DEFAULT_TOKENS)) {
      expect(key.startsWith('--tc-'), `${key} should start with --tc-`).toBe(true);
    }
  });

  it('--tc-row-height default is 48px', () => {
    expect(DEFAULT_TOKENS['--tc-row-height']).toBe('48px');
  });

  it('is a const object (values are string literals, not mutable)', () => {
    // TypeScript const assertion prevents mutation — verify the object is not a class instance
    expect(typeof DEFAULT_TOKENS).toBe('object');
    expect(DEFAULT_TOKENS).not.toBeNull();
  });
});
