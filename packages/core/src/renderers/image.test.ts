import { describe, it, expect, afterEach } from 'vitest';
import { imageRenderer } from './image.js';
import { clearRegistry } from '../registry/index.js';
import type { ResolvedColumn } from '../types.js';

const col = { key: 'avatar', type: 'image', label: 'Avatar' } as ResolvedColumn;

afterEach(() => clearRegistry());

describe('imageRenderer', () => {
  it('returns raw for null', () => {
    expect(imageRenderer(null, col).kind).toBe('raw');
  });
  it('returns raw for undefined', () => {
    expect(imageRenderer(undefined, col).kind).toBe('raw');
  });
  it('returns raw for empty string', () => {
    expect(imageRenderer('', col).kind).toBe('raw');
  });
  it('returns image with src and alt from column label', () => {
    const result = imageRenderer('https://example.com/avatar.jpg', col);
    expect(result).toEqual({ kind: 'image', src: 'https://example.com/avatar.jpg', alt: 'Avatar' });
  });
  it('uses empty string for alt when label is empty', () => {
    const colNoLabel = { key: 'img', type: 'image', label: '' } as ResolvedColumn;
    const result = imageRenderer('https://example.com/pic.png', colNoLabel);
    expect(result.kind).toBe('image');
    if (result.kind === 'image') expect(result.alt).toBe('');
  });
  it('trims whitespace from src', () => {
    const result = imageRenderer('  https://example.com/img.png  ', col);
    expect(result.kind).toBe('image');
    if (result.kind === 'image') expect(result.src).toBe('https://example.com/img.png');
  });
  it('accepts relative URLs', () => {
    const result = imageRenderer('/images/avatar.png', col);
    expect(result.kind).toBe('image');
    if (result.kind === 'image') expect(result.src).toBe('/images/avatar.png');
  });
});
