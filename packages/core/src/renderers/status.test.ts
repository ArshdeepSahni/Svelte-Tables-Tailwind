import { describe, it, expect, afterEach } from 'vitest';
import { statusRenderer } from './status.js';
import { clearRegistry } from '../registry/index.js';
import type { ResolvedColumn } from '../types.js';

const col = { key: 'status', type: 'status', label: 'Status' } as ResolvedColumn;

afterEach(() => clearRegistry());

describe('statusRenderer', () => {
  it('returns raw for null', () => {
    expect(statusRenderer(null, col).kind).toBe('raw');
  });
  it('returns raw for undefined', () => {
    expect(statusRenderer(undefined, col).kind).toBe('raw');
  });

  // Success variants
  it('"active" → success variant', () => {
    const result = statusRenderer('active', col);
    expect(result).toEqual({ kind: 'status', label: 'active', variant: 'success' });
  });
  it('"done" → success variant', () => {
    const result = statusRenderer('done', col);
    if (result.kind === 'status') expect(result.variant).toBe('success');
  });
  it('"approved" → success variant', () => {
    const result = statusRenderer('approved', col);
    if (result.kind === 'status') expect(result.variant).toBe('success');
  });
  it('"completed" → success variant', () => {
    const result = statusRenderer('completed', col);
    if (result.kind === 'status') expect(result.variant).toBe('success');
  });
  it('"open" → success variant', () => {
    const result = statusRenderer('open', col);
    if (result.kind === 'status') expect(result.variant).toBe('success');
  });

  // Warning variants
  it('"pending" → warning variant', () => {
    const result = statusRenderer('pending', col);
    if (result.kind === 'status') expect(result.variant).toBe('warning');
  });
  it('"review" → warning variant', () => {
    const result = statusRenderer('review', col);
    if (result.kind === 'status') expect(result.variant).toBe('warning');
  });
  it('"draft" → warning variant', () => {
    const result = statusRenderer('draft', col);
    if (result.kind === 'status') expect(result.variant).toBe('warning');
  });
  it('"in-progress" → warning variant (normalized)', () => {
    const result = statusRenderer('in-progress', col);
    if (result.kind === 'status') expect(result.variant).toBe('warning');
  });

  // Danger variants
  it('"error" → danger variant', () => {
    const result = statusRenderer('error', col);
    if (result.kind === 'status') expect(result.variant).toBe('danger');
  });
  it('"failed" → danger variant', () => {
    const result = statusRenderer('failed', col);
    if (result.kind === 'status') expect(result.variant).toBe('danger');
  });
  it('"blocked" → danger variant', () => {
    const result = statusRenderer('blocked', col);
    if (result.kind === 'status') expect(result.variant).toBe('danger');
  });
  it('"rejected" → danger variant', () => {
    const result = statusRenderer('rejected', col);
    if (result.kind === 'status') expect(result.variant).toBe('danger');
  });

  // Info variants
  it('"inactive" → info variant', () => {
    const result = statusRenderer('inactive', col);
    if (result.kind === 'status') expect(result.variant).toBe('info');
  });
  it('"disabled" → info variant', () => {
    const result = statusRenderer('disabled', col);
    if (result.kind === 'status') expect(result.variant).toBe('info');
  });
  it('"archived" → info variant', () => {
    const result = statusRenderer('archived', col);
    if (result.kind === 'status') expect(result.variant).toBe('info');
  });

  // Default variant
  it('unknown status → default variant', () => {
    const result = statusRenderer('custom-state', col);
    if (result.kind === 'status') expect(result.variant).toBe('default');
  });
  it('"shipped" (not in any set) → default variant', () => {
    const result = statusRenderer('shipped', col);
    if (result.kind === 'status') expect(result.variant).toBe('default');
  });

  // Case insensitivity
  it('case-insensitive: "ACTIVE" → success', () => {
    const result = statusRenderer('ACTIVE', col);
    if (result.kind === 'status') expect(result.variant).toBe('success');
  });
  it('case-insensitive: "PENDING" → warning', () => {
    const result = statusRenderer('PENDING', col);
    if (result.kind === 'status') expect(result.variant).toBe('warning');
  });

  // Label preservation
  it('preserves original label casing', () => {
    const result = statusRenderer('In Progress', col);
    expect(result.kind).toBe('status');
    if (result.kind === 'status') expect(result.label).toBe('In Progress');
  });
  it('preserves label for unknown values', () => {
    const result = statusRenderer('My Custom Status', col);
    if (result.kind === 'status') expect(result.label).toBe('My Custom Status');
  });
});
