/**
 * @tablecraft/core — Code renderer
 *
 * Passes code strings through as-is for display in a <code> element.
 * NO sanitization — XSS prevention is the responsibility of the Svelte component
 * which renders this via text binding, NOT {&#64;html}.
 *
 * FOUND-07: No @html. The Svelte component (Phase 3) uses text binding for code content.
 * Self-registers on module initialization.
 *
 * CORE-07: Tree-shakable — importing only this file loads only this renderer.
 */

import type { CellDescriptor, ResolvedColumn } from '../types.js';
import { registerRenderer } from '../registry/index.js';

export function codeRenderer(value: unknown, _column: ResolvedColumn): CellDescriptor {
  if (value === null || value === undefined) return { kind: 'raw', value };
  // Raw string — rendered in <code> element by Svelte component (Phase 3). NO sanitization here.
  // FOUND-07: No at-html. The Svelte component uses text binding, not the at-html directive.
  return { kind: 'code', value: String(value) };
}

registerRenderer('code', codeRenderer);
