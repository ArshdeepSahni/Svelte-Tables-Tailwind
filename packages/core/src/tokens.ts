/**
 * @tablecraft/core — CSS custom property design token defaults
 *
 * Comprehensive --tc-* token set covering every visual aspect of the table.
 * Consumers override via CSS: [data-theme="dark"] { --tc-color-bg: #0f172a; }
 * Or inline: <Table style="--tc-color-accent: #3b82f6" />
 */

export const DEFAULT_TOKENS = {
  // === COLORS ===
  '--tc-color-bg': '#ffffff',
  '--tc-color-bg-toolbar': '#fafafa',
  '--tc-color-bg-header': '#fafafa',
  '--tc-color-bg-row': '#ffffff',
  '--tc-color-bg-row-hover': '#fafafa',
  '--tc-color-bg-row-selected': '#f5f5f5',
  '--tc-color-bg-row-striped': '#fafafa',
  '--tc-color-bg-footer': '#fafafa',
  '--tc-color-bg-group-row': '#f7f7f7',
  '--tc-color-bg-aggregate': '#fafafa',
  '--tc-color-bg-code': '#f5f5f5',
  '--tc-color-bg-skeleton-from': '#f0f0f0',
  '--tc-color-bg-skeleton-to': '#f7f7f7',

  '--tc-color-text': '#0a0a0a',
  '--tc-color-text-secondary': '#737373',
  '--tc-color-text-muted': '#a3a3a3',
  '--tc-color-text-header': '#737373',
  '--tc-color-text-placeholder': '#a3a3a3',
  '--tc-color-text-group': '#525252',

  '--tc-color-border': '#f0f0f0',
  '--tc-color-border-header': '#f0f0f0',
  '--tc-color-border-row': '#f7f7f7',
  '--tc-color-border-footer': '#f0f0f0',
  '--tc-color-border-input': '#e5e5e5',
  '--tc-color-border-input-focus': '#0a0a0a',
  '--tc-color-border-btn': '#e5e5e5',
  '--tc-color-border-btn-hover': '#0a0a0a',

  '--tc-color-accent': '#0a0a0a',
  '--tc-color-accent-hover': '#525252',
  '--tc-color-focus-ring': 'rgba(10,10,10,0.15)',

  '--tc-color-pin-shadow': 'rgba(0,0,0,0.06)',
  '--tc-color-selection-accent': '#0a0a0a',

  // === SEMANTIC ===
  '--tc-color-success': '#15803d',
  '--tc-color-success-bg': '#f0fdf4',
  '--tc-color-warning': '#b45309',
  '--tc-color-warning-bg': '#fffbeb',
  '--tc-color-danger': '#be123c',
  '--tc-color-danger-bg': '#fff1f2',
  '--tc-color-info': '#1d4ed8',
  '--tc-color-info-bg': '#eff6ff',
  '--tc-color-neutral': '#525252',
  '--tc-color-neutral-bg': '#f5f5f5',

  // === TYPOGRAPHY ===
  '--tc-font-family': "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', system-ui, sans-serif",
  '--tc-font-family-mono': "ui-monospace, 'JetBrains Mono', 'Cascadia Code', Menlo, monospace",
  '--tc-font-size': '13px',
  '--tc-font-size-sm': '11px',
  '--tc-font-size-xs': '10px',
  '--tc-font-size-header': '11px',
  '--tc-font-weight-normal': '400',
  '--tc-font-weight-medium': '500',
  '--tc-font-weight-semibold': '600',
  '--tc-font-weight-bold': '700',
  '--tc-letter-spacing-header': '0.04em',
  '--tc-line-height': '1.5',

  // === SPACING ===
  '--tc-row-height': '44px',
  '--tc-cell-padding-x': '12px',
  '--tc-cell-padding-y': '8px',
  '--tc-header-padding-x': '12px',
  '--tc-header-padding-y': '10px',
  '--tc-toolbar-padding': '8px 12px',
  '--tc-footer-padding': '8px 12px',

  // === SIZING ===
  '--tc-border-radius': '12px',
  '--tc-border-radius-sm': '6px',
  '--tc-border-radius-xs': '4px',
  '--tc-border-radius-pill': '9999px',
  '--tc-border-width': '1px',
  '--tc-border-width-accent': '2px',
  '--tc-virtual-height': 'min(600px, 70vh)',
  '--tc-col-width-default': '150px',
  '--tc-col-width-min': '60px',
  '--tc-img-size': '28px',
  '--tc-img-border-radius': '50%',

  // === SHADOWS ===
  '--tc-shadow-wrapper': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
  '--tc-shadow-pin': '2px 0 4px rgba(0,0,0,0.06)',
  '--tc-shadow-drag': '0 4px 12px rgba(0,0,0,0.08)',
  '--tc-shadow-action-bar': '0 8px 24px rgba(0,0,0,0.12)',

  // === TRANSITIONS ===
  '--tc-transition-row': 'background 0.08s ease',
  '--tc-transition-btn': 'background 0.12s ease, border-color 0.12s ease',
  '--tc-transition-sort': '0.18s ease',

  // === BADGE VARIANTS ===
  '--tc-badge-padding': '2px 8px',
  '--tc-badge-font-size': '11px',
  '--tc-badge-font-weight': '500',
  '--tc-badge-border-radius': '9999px',

  // === SEARCH ===
  '--tc-search-border': 'none',
  '--tc-search-border-bottom': '1.5px solid #e5e5e5',
  '--tc-search-border-radius': '0',
  '--tc-search-focus-border': '1.5px solid #0a0a0a',
  '--tc-search-padding': '6px 0 6px 24px',
  '--tc-search-min-width': '180px',

  // Legacy aliases (kept for backward compat with any consumer CSS)
  '--tc-color-muted': '#a3a3a3',
  '--tc-color-primary': '#0a0a0a',
  '--tc-color-bg-hover': '#fafafa',
  '--tc-color-selected-bg': '#f5f5f5',
  '--tc-color-bg-alt': '#fafafa',
  '--tc-header-bg': '#fafafa',
  '--tc-header-color': '#737373',
  '--tc-header-border': '#f0f0f0',
  '--tc-toolbar-bg': '#fafafa',
  '--tc-border-color': '#f0f0f0',
} as const;

export type TokenName = keyof typeof DEFAULT_TOKENS;
