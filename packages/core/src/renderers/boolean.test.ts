import { describe, it, expect, afterEach } from 'vitest';
import { booleanRenderer } from './boolean.js';
import { clearRegistry } from '../registry/index.js';
import type { ResolvedColumn } from '../types.js';

const col = { key: 'active', type: 'boolean', label: 'Active' } as ResolvedColumn;

afterEach(() => clearRegistry());

describe('booleanRenderer', () => {
  it('returns raw for null', () => {
    expect(booleanRenderer(null, col).kind).toBe('raw');
  });
  it('returns raw for undefined', () => {
    expect(booleanRenderer(undefined, col).kind).toBe('raw');
  });
  it('passes through actual boolean true', () => {
    expect(booleanRenderer(true, col)).toEqual({ kind: 'boolean', value: true });
  });
  it('passes through actual boolean false', () => {
    expect(booleanRenderer(false, col)).toEqual({ kind: 'boolean', value: false });
  });
  it('"yes" string → true', () => {
    const result = booleanRenderer('yes', col);
    expect(result.kind).toBe('boolean');
    if (result.kind === 'boolean') expect(result.value).toBe(true);
  });
  it('"no" string → false', () => {
    const result = booleanRenderer('no', col);
    expect(result.kind).toBe('boolean');
    if (result.kind === 'boolean') expect(result.value).toBe(false);
  });
  it('"true" string → true', () => {
    const result = booleanRenderer('true', col);
    if (result.kind === 'boolean') expect(result.value).toBe(true);
  });
  it('"false" string → false', () => {
    const result = booleanRenderer('false', col);
    if (result.kind === 'boolean') expect(result.value).toBe(false);
  });
  it('"on" string → true', () => {
    const result = booleanRenderer('on', col);
    if (result.kind === 'boolean') expect(result.value).toBe(true);
  });
  it('"1" string → true', () => {
    const result = booleanRenderer('1', col);
    if (result.kind === 'boolean') expect(result.value).toBe(true);
  });
  it('number 1 → true', () => {
    const result = booleanRenderer(1, col);
    expect(result.kind).toBe('boolean');
    if (result.kind === 'boolean') expect(result.value).toBe(true);
  });
  it('number 0 → false', () => {
    const result = booleanRenderer(0, col);
    expect(result.kind).toBe('boolean');
    if (result.kind === 'boolean') expect(result.value).toBe(false);
  });
  it('case-insensitive: "YES" → true', () => {
    const result = booleanRenderer('YES', col);
    if (result.kind === 'boolean') expect(result.value).toBe(true);
  });
  it('unknown string → false', () => {
    const result = booleanRenderer('maybe', col);
    if (result.kind === 'boolean') expect(result.value).toBe(false);
  });
});
