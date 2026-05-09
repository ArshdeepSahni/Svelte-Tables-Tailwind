/**
 * @tablecraft/core — Actions renderer
 *
 * Renders action button descriptors for row-level actions (edit, delete, etc.).
 * The actual button rendering happens in the Svelte Cell component.
 * Self-registers on module initialization.
 *
 * CORE-07: Tree-shakable — importing only this file loads only this renderer.
 */

import type { ActionDescriptor, CellDescriptor, ResolvedColumn } from '../types.js';
import { registerRenderer } from '../registry/index.js';

/** Default actions when column value is not explicitly provided */
const DEFAULT_ACTIONS: ActionDescriptor[] = [
  { id: 'edit', label: 'Edit', variant: 'default' },
  { id: 'delete', label: 'Delete', variant: 'danger' },
];

export function actionsRenderer(value: unknown, _column: ResolvedColumn): CellDescriptor {
  // If value is an array of action descriptors, use them directly
  if (Array.isArray(value)) {
    const actions: ActionDescriptor[] = value
      .filter((a): a is Record<string, unknown> => typeof a === 'object' && a !== null)
      .map((a) => ({
        id: String(a.id ?? a.action ?? 'action'),
        label: String(a.label ?? a.text ?? a.id ?? 'Action'),
        variant: (['default', 'primary', 'danger'].includes(String(a.variant ?? ''))
          ? (a.variant as ActionDescriptor['variant'])
          : 'default'),
        disabled: Boolean(a.disabled ?? false),
      }));

    if (actions.length > 0) {
      return { kind: 'actions', actions };
    }
  }

  // Fall back to default edit/delete actions
  return { kind: 'actions', actions: DEFAULT_ACTIONS };
}

registerRenderer('actions', actionsRenderer);
