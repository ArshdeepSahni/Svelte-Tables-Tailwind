/**
 * @tablecraft/core — Status renderer
 *
 * Auto-assigns semantic color variants based on common status string patterns.
 * This is a key differentiator — no other table lib does auto-semantic-coloring.
 *
 * Variant mapping:
 *   success: active, done, success, approved, complete, completed, enabled, open
 *   warning: pending, review, waiting, draft, processing, in-progress
 *   danger:  error, failed, failure, rejected, blocked, cancelled, canceled, critical
 *   info:    inactive, disabled, archived, closed, resolved
 *   default: everything else
 *
 * Self-registers on module initialization.
 *
 * CORE-07: Tree-shakable — importing only this file loads only this renderer.
 */

import type { CellDescriptor, ResolvedColumn, BadgeVariant } from '../types.js';
import { registerRenderer } from '../registry/index.js';

const SUCCESS_WORDS = new Set(['active', 'done', 'success', 'approved', 'complete', 'completed', 'enabled', 'open']);
const WARNING_WORDS = new Set(['pending', 'review', 'waiting', 'draft', 'processing', 'inprogress']);
const DANGER_WORDS = new Set(['error', 'failed', 'failure', 'rejected', 'blocked', 'cancelled', 'canceled', 'critical']);
const INFO_WORDS = new Set(['inactive', 'disabled', 'archived', 'closed', 'resolved']);

function getVariant(label: string): BadgeVariant {
  // Normalize: lowercase, strip whitespace/underscores/hyphens for fuzzy matching
  const normalized = label.toLowerCase().replace(/[\s_-]+/g, '');
  if (SUCCESS_WORDS.has(normalized)) return 'success';
  if (WARNING_WORDS.has(normalized)) return 'warning';
  if (DANGER_WORDS.has(normalized)) return 'danger';
  if (INFO_WORDS.has(normalized)) return 'info';
  return 'default';
}

export function statusRenderer(value: unknown, _column: ResolvedColumn): CellDescriptor {
  if (value === null || value === undefined) return { kind: 'raw', value };
  const label = String(value);
  return { kind: 'status', label, variant: getVariant(label) };
}

registerRenderer('status', statusRenderer);
