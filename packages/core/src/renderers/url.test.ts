import { describe, it, expect, afterEach } from 'vitest';
import { urlRenderer } from './url.js';
import { clearRegistry } from '../registry/index.js';
import type { ResolvedColumn } from '../types.js';

const col = { key: 'website', type: 'url', label: 'Website' } as ResolvedColumn;

afterEach(() => clearRegistry());

describe('urlRenderer', () => {
  it('returns raw for null', () => {
    expect(urlRenderer(null, col).kind).toBe('raw');
  });
  it('returns raw for undefined', () => {
    expect(urlRenderer(undefined, col).kind).toBe('raw');
  });
  it('returns raw for empty string', () => {
    expect(urlRenderer('', col).kind).toBe('raw');
  });
  it('returns link with hostname as label', () => {
    const result = urlRenderer('https://example.com/page?q=1', col);
    expect(result.kind).toBe('link');
    if (result.kind === 'link') {
      expect(result.label).toBe('example.com');
      expect(result.external).toBe(true);
      expect(result.href).toBe('https://example.com/page?q=1');
    }
  });
  it('falls back to text for invalid URLs', () => {
    const result = urlRenderer('not-a-url', col);
    expect(result).toEqual({ kind: 'text', value: 'not-a-url' });
  });
  it('handles http:// protocol', () => {
    const result = urlRenderer('http://example.com', col);
    expect(result.kind).toBe('link');
    if (result.kind === 'link') expect(result.label).toBe('example.com');
  });
  it('handles URLs with subdomains', () => {
    const result = urlRenderer('https://api.example.com/v1', col);
    expect(result.kind).toBe('link');
    if (result.kind === 'link') expect(result.label).toBe('api.example.com');
  });
  it('marks all links as external', () => {
    const result = urlRenderer('https://example.com', col);
    if (result.kind === 'link') expect(result.external).toBe(true);
  });
  it('falls back to text for bare domain without protocol', () => {
    const result = urlRenderer('example.com', col);
    expect(result.kind).toBe('text');
  });
});
