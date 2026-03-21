/**
 * @tablecraft/core — CSS custom property design token defaults
 *
 * CORE-09: 18 --tc-* tokens exported as a plain object.
 * The Svelte package (Phase 3) injects these in :root or [data-tc] scope.
 * Consumers override via CSS: [data-theme="dark"] { --tc-color-bg: #0f172a; }
 */

export const DEFAULT_TOKENS = {
  // Colors
  '--tc-color-text': '#111827',
  '--tc-color-text-muted': '#6B7280',
  '--tc-color-bg': '#FFFFFF',
  '--tc-color-bg-hover': '#F9FAFB',
  '--tc-color-border': '#E5E7EB',
  '--tc-color-accent': '#3B82F6',
  // Status colors
  '--tc-color-success': '#10B981',
  '--tc-color-warning': '#F59E0B',
  '--tc-color-danger': '#EF4444',
  '--tc-color-info': '#6366F1',
  // Spacing
  '--tc-row-height': '48px',
  '--tc-cell-padding-x': '12px',
  '--tc-cell-padding-y': '8px',
  '--tc-header-height': '40px',
  // Typography
  '--tc-font-family': 'inherit',
  '--tc-font-size': '14px',
  '--tc-font-size-sm': '12px',
  // Borders
  '--tc-border-radius': '4px',
} as const;

export type TokenName = keyof typeof DEFAULT_TOKENS;
