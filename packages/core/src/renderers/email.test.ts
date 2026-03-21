import { describe, it, expect, afterEach } from 'vitest';
import { emailRenderer } from './email.js';
import { clearRegistry } from '../registry/index.js';
import type { ResolvedColumn } from '../types.js';

const col = { key: 'email', type: 'email', label: 'Email' } as ResolvedColumn;

afterEach(() => clearRegistry());

describe('emailRenderer', () => {
  it('returns raw for null', () => {
    expect(emailRenderer(null, col).kind).toBe('raw');
  });
  it('returns raw for undefined', () => {
    expect(emailRenderer(undefined, col).kind).toBe('raw');
  });
  it('returns raw for empty string', () => {
    expect(emailRenderer('', col).kind).toBe('raw');
  });
  it('returns link with mailto: href', () => {
    const result = emailRenderer('user@example.com', col);
    expect(result).toEqual({ kind: 'link', href: 'mailto:user@example.com', label: 'user@example.com' });
  });
  it('trims whitespace from email', () => {
    const result = emailRenderer('  user@example.com  ', col);
    expect(result.kind).toBe('link');
    if (result.kind === 'link') {
      expect(result.href).toBe('mailto:user@example.com');
      expect(result.label).toBe('user@example.com');
    }
  });
  it('handles subdomain emails', () => {
    const result = emailRenderer('admin@mail.example.org', col);
    expect(result.kind).toBe('link');
    if (result.kind === 'link') expect(result.href).toBe('mailto:admin@mail.example.org');
  });
  it('converts non-string input to link', () => {
    // Edge case: some rows might have non-string values in email columns
    const result = emailRenderer(42, col);
    expect(result.kind).toBe('link');
    if (result.kind === 'link') expect(result.href).toBe('mailto:42');
  });
});
