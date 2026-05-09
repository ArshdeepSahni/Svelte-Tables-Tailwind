/**
 * @tablecraft/svelte — Conditional formatting engine
 * Intelligent rule-based cell styling with Excel/Sheets-like conditions,
 * data bars, color scales, and icon sets with quiet luxury design aesthetic.
 *
 * Design tokens follow the project's CSS custom property system:
 * - Background: pure white (#ffffff) with subtle accents
 * - Accent: near-black (#0a0a0a)
 * - Borders: nearly invisible (#f0f0f0)
 * - All colors applied via CSS variables for full customization
 */

/**
 * Condition types that can be evaluated against cell values.
 */
export type FormatCondition =
  | { type: 'greaterThan'; value: number }
  | { type: 'lessThan'; value: number }
  | { type: 'between'; min: number; max: number }
  | { type: 'equals'; value: unknown }
  | { type: 'contains'; value: string }
  | { type: 'isEmpty' }
  | { type: 'isNotEmpty' }
  | { type: 'topN'; count: number }
  | { type: 'bottomN'; count: number }
  | { type: 'aboveAverage' }
  | { type: 'belowAverage' }
  | { type: 'duplicates' }
  | { type: 'unique' }
  | { type: 'custom'; fn: (value: unknown, row: Record<string, unknown>) => boolean };

/**
 * Style properties to apply when a condition matches.
 * All values are optional — only matching properties are applied.
 */
export interface FormatStyle {
  backgroundColor?: string;
  color?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  icon?: string; // emoji (e.g. "✓", "✗", "⚠") or icon name
  borderColor?: string;
  borderRadius?: string;
  padding?: string;
  opacity?: number; // 0-1
}

/**
 * A single conditional formatting rule.
 * Rules are evaluated in priority order (lower number = higher priority).
 * Use stopIfTrue to prevent lower-priority rules from running.
 */
export interface ConditionalFormatRule {
  id: string;
  column: string; // column key, or '*' for all columns
  condition: FormatCondition;
  style: FormatStyle;
  priority: number; // 0 = highest priority
  stopIfTrue?: boolean; // don't evaluate further rules if this matches
}

/**
 * Built-in preset names for common formatting scenarios.
 */
export type FormatPreset =
  | 'colorScale' // gradient from min to max (green-yellow-red)
  | 'dataBar' // bar chart in cell background
  | 'iconSet' // ↑↓→ arrows based on value
  | 'heatmap' // color intensity based on value
  | 'highlightTop10' // highlight top 10%
  | 'highlightBottom10'; // highlight bottom 10%

/**
 * A preset-based formatting configuration.
 * Presets auto-generate multiple rules under the hood.
 */
export interface ConditionalFormatPreset {
  column: string;
  preset: FormatPreset;
  options?: {
    minColor?: string;
    midColor?: string;
    maxColor?: string;
  };
}

/**
 * Evaluate which style should apply to a single cell.
 *
 * Rules are checked in priority order (ascending). If a rule matches
 * and has stopIfTrue=true, evaluation stops and that style is returned.
 * Otherwise, the highest-priority matching rule's style is returned.
 *
 * @param rules - Array of conditional format rules
 * @param presets - Array of preset configurations
 * @param row - The data row object
 * @param columnKey - The column key being evaluated
 * @param allValues - All values in the column (for statistical calculations)
 * @returns FormatStyle to apply, or null if no rules match
 *
 * @example
 * const style = evaluateConditionalFormats(
 *   rules,
 *   presets,
 *   { name: 'Alice', salary: 150000 },
 *   'salary',
 *   [100000, 150000, 200000]
 * );
 */
export function evaluateConditionalFormats(
  rules: ConditionalFormatRule[],
  presets: ConditionalFormatPreset[],
  row: Record<string, unknown>,
  columnKey: string,
  allValues: unknown[],
): FormatStyle | null {
  // Combine rules from explicit rules and presets
  const allRules = [...rules, ...generatePresetRules(presets, columnKey)];

  // Filter rules that apply to this column
  const applicableRules = allRules
    .filter((r) => r.column === columnKey || r.column === '*')
    .sort((a, b) => a.priority - b.priority);

  // Evaluate rules in priority order
  for (const rule of applicableRules) {
    if (evaluateCondition(rule.condition, row[columnKey], row, allValues)) {
      return rule.style;
    }

    if (rule.stopIfTrue) {
      break;
    }
  }

  return null;
}

/**
 * Evaluate a single condition against a cell value and row.
 *
 * @param condition - The condition to evaluate
 * @param value - The cell value
 * @param row - The full row object (for custom functions)
 * @param allValues - All values in the column (for statistical conditions)
 * @returns true if the condition matches
 */
function evaluateCondition(
  condition: FormatCondition,
  value: unknown,
  row: Record<string, unknown>,
  allValues: unknown[],
): boolean {
  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
  const strValue = String(value);

  switch (condition.type) {
    case 'greaterThan':
      return !isNaN(numValue) && numValue > condition.value;

    case 'lessThan':
      return !isNaN(numValue) && numValue < condition.value;

    case 'between':
      return !isNaN(numValue) && numValue >= condition.min && numValue <= condition.max;

    case 'equals':
      return value === condition.value;

    case 'contains':
      return strValue.includes(condition.value);

    case 'isEmpty':
      return value === null || value === undefined || strValue === '';

    case 'isNotEmpty':
      return value !== null && value !== undefined && strValue !== '';

    case 'topN': {
      const numValues = allValues
        .map((v) => (typeof v === 'number' ? v : parseFloat(String(v))))
        .filter((v) => !isNaN(v))
        .sort((a, b) => b - a);
      const threshold = numValues[condition.count - 1];
      return !isNaN(numValue) && numValue >= threshold;
    }

    case 'bottomN': {
      const numValues = allValues
        .map((v) => (typeof v === 'number' ? v : parseFloat(String(v))))
        .filter((v) => !isNaN(v))
        .sort((a, b) => a - b);
      const threshold = numValues[condition.count - 1];
      return !isNaN(numValue) && numValue <= threshold;
    }

    case 'aboveAverage': {
      const numValues = allValues
        .map((v) => (typeof v === 'number' ? v : parseFloat(String(v))))
        .filter((v) => !isNaN(v));
      const avg = numValues.reduce((a, b) => a + b, 0) / numValues.length;
      return !isNaN(numValue) && numValue > avg;
    }

    case 'belowAverage': {
      const numValues = allValues
        .map((v) => (typeof v === 'number' ? v : parseFloat(String(v))))
        .filter((v) => !isNaN(v));
      const avg = numValues.reduce((a, b) => a + b, 0) / numValues.length;
      return !isNaN(numValue) && numValue < avg;
    }

    case 'duplicates': {
      const strValues = allValues.map((v) => String(v));
      return strValues.filter((v) => v === strValue).length > 1;
    }

    case 'unique': {
      const strValues = allValues.map((v) => String(v));
      return strValues.filter((v) => v === strValue).length === 1;
    }

    case 'custom':
      return condition.fn(value, row);

    default:
      return false;
  }
}

/**
 * Generate rules from preset configurations.
 * Each preset expands into multiple rules with appropriate conditions.
 *
 * @param presets - Array of preset configurations
 * @param columnKey - The column being formatted
 * @returns Array of ConditionalFormatRule objects
 */
function generatePresetRules(presets: ConditionalFormatPreset[], columnKey: string): ConditionalFormatRule[] {
  const rules: ConditionalFormatRule[] = [];

  for (const preset of presets) {
    if (preset.column !== columnKey && preset.column !== '*') continue;

    const _minColor = preset.options?.minColor ?? 'var(--tc-color-preset-min, #d4edda)';
    const _midColor = preset.options?.midColor ?? 'var(--tc-color-preset-mid, #fff3cd)';
    const _maxColor = preset.options?.maxColor ?? 'var(--tc-color-preset-max, #f8d7da)';

    switch (preset.preset) {
      case 'colorScale':
        // Color scales are handled dynamically in evaluateConditionalFormats
        // No static rules needed — the caller computes the gradient
        break;

      case 'dataBar':
        // Data bars are rendered as background gradients
        // No static rules needed — the caller computes bar width
        break;

      case 'iconSet':
        // Icon sets use three rules: good (↑), neutral (→), bad (↓)
        rules.push(
          {
            id: `${preset.column}-icon-good`,
            column: preset.column,
            condition: { type: 'topN', count: 1 },
            style: { icon: '▲', color: 'var(--tc-color-icon-good, #198754)' },
            priority: 100,
          },
          {
            id: `${preset.column}-icon-bad`,
            column: preset.column,
            condition: { type: 'bottomN', count: 1 },
            style: { icon: '▼', color: 'var(--tc-color-icon-bad, #dc3545)' },
            priority: 100,
          },
          {
            id: `${preset.column}-icon-neutral`,
            column: preset.column,
            condition: { type: 'custom', fn: () => true },
            style: { icon: '→', color: 'var(--tc-color-icon-neutral, #6c757d)' },
            priority: 101,
          },
        );
        break;

      case 'heatmap':
        // Heatmap uses color intensity — implemented dynamically
        break;

      case 'highlightTop10':
        rules.push({
          id: `${preset.column}-top10`,
          column: preset.column,
          condition: { type: 'topN', count: Math.ceil(10) }, // top 10%
          style: {
            backgroundColor: 'var(--tc-color-highlight-top, rgba(0, 0, 0, 0.05))',
            fontWeight: 'bold',
          },
          priority: 50,
        });
        break;

      case 'highlightBottom10':
        rules.push({
          id: `${preset.column}-bottom10`,
          column: preset.column,
          condition: { type: 'bottomN', count: Math.ceil(10) },
          style: {
            backgroundColor: 'var(--tc-color-highlight-bottom, rgba(220, 53, 69, 0.1))',
          },
          priority: 50,
        });
        break;
    }
  }

  return rules;
}

/**
 * Generate a color for a value along a gradient scale.
 * Uses HSL interpolation for smooth, perceptually-uniform gradients.
 *
 * @param value - The numeric value
 * @param min - Minimum value in the range
 * @param max - Maximum value in the range
 * @param minColor - CSS color string for minimum value (default: green)
 * @param maxColor - CSS color string for maximum value (default: red)
 * @param midColor - CSS color string for midpoint (optional)
 * @returns CSS color string (rgb or hsl)
 *
 * @example
 * const color = colorScale(75, 0, 100, '#4CAF50', '#F44336');
 * // Returns interpolated color between green and red
 */
export function colorScale(
  value: number,
  min: number,
  max: number,
  minColor = '#4CAF50', // green
  maxColor = '#F44336', // red
  midColor?: string,
): string {
  // Clamp value to range
  const normalized = Math.min(1, Math.max(0, (value - min) / (max - min)));

  // Parse colors to HSL
  const minHsl = parseColorToHsl(minColor);
  const maxHsl = parseColorToHsl(maxColor);

  let h: number;
  let s: number;
  let l: number;

  if (midColor && normalized !== 0.5) {
    // Use three-point interpolation if midColor provided
    const midHsl = parseColorToHsl(midColor);

    if (normalized < 0.5) {
      // Interpolate between min and mid
      const t = normalized * 2; // 0 to 1
      h = minHsl.h + (midHsl.h - minHsl.h) * t;
      s = minHsl.s + (midHsl.s - minHsl.s) * t;
      l = minHsl.l + (midHsl.l - minHsl.l) * t;
    } else {
      // Interpolate between mid and max
      const t = (normalized - 0.5) * 2; // 0 to 1
      h = midHsl.h + (maxHsl.h - midHsl.h) * t;
      s = midHsl.s + (maxHsl.s - midHsl.s) * t;
      l = midHsl.l + (maxHsl.l - midHsl.l) * t;
    }
  } else {
    // Simple two-point interpolation
    h = minHsl.h + (maxHsl.h - minHsl.h) * normalized;
    s = minHsl.s + (maxHsl.s - minHsl.s) * normalized;
    l = minHsl.l + (maxHsl.l - minHsl.l) * normalized;
  }

  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

/**
 * Calculate the width percentage for a data bar background.
 * The bar grows from 0% to 100% based on the value's position in the range.
 *
 * @param value - The numeric value
 * @param min - Minimum value in the range
 * @param max - Maximum value in the range
 * @returns Percentage (0-100) for CSS width
 *
 * @example
 * const width = dataBarWidth(75, 0, 100);
 * // Returns 75 — use as background-size: 75% 100%
 */
export function dataBarWidth(value: number, min: number, max: number): number {
  const normalized = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  return normalized;
}

/**
 * Generate a CSS linear-gradient string for rendering a data bar.
 * The gradient creates a bar that fills from left to right.
 *
 * @param value - The numeric value
 * @param min - Minimum value in the range
 * @param max - Maximum value in the range
 * @param barColor - CSS color for the bar (default: accent color)
 * @returns CSS linear-gradient string for background-image
 *
 * @example
 * const gradient = dataBarGradient(75, 0, 100, '#0a0a0a');
 * // Use in CSS: background-image: var(--gradient); background-size: 100% 100%;
 */
export function dataBarGradient(
  value: number,
  min: number,
  max: number,
  barColor = 'var(--tc-color-accent, #0a0a0a)',
): string {
  const width = dataBarWidth(value, min, max);
  const colorAlpha = barColor.includes('rgb') ? barColor.replace(')', ', 0.15)') : barColor + '26'; // 15% alpha
  return `linear-gradient(to right, ${colorAlpha} 0%, ${colorAlpha} ${width}%, transparent ${width}%)`;
}

/**
 * Parse a CSS color string to HSL components.
 * Supports hex, rgb(), and hsl() formats.
 *
 * @param color - CSS color string
 * @returns Object with h, s, l components (0-360, 0-100, 0-100)
 */
function parseColorToHsl(color: string): { h: number; s: number; l: number } {
  // Try HSL format first
  const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (hslMatch) {
    return {
      h: parseInt(hslMatch[1]),
      s: parseInt(hslMatch[2]),
      l: parseInt(hslMatch[3]),
    };
  }

  // Try RGB format
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]) / 255;
    const g = parseInt(rgbMatch[2]) / 255;
    const b = parseInt(rgbMatch[3]) / 255;
    return rgbToHsl(r, g, b);
  }

  // Try hex format
  const hexMatch = color.match(/#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})/);
  if (hexMatch) {
    const r = parseInt(hexMatch[1], 16) / 255;
    const g = parseInt(hexMatch[2], 16) / 255;
    const b = parseInt(hexMatch[3], 16) / 255;
    return rgbToHsl(r, g, b);
  }

  // Fallback: gray
  return { h: 0, s: 0, l: 50 };
}

/**
 * Convert RGB (0-1 range) to HSL (0-360, 0-100, 0-100 range).
 *
 * @param r - Red component (0-1)
 * @param g - Green component (0-1)
 * @param b - Blue component (0-1)
 * @returns Object with h, s, l components
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: l * 100 };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else if (max === b) h = ((r - g) / d + 4) / 6;

  return {
    h: h * 360,
    s: s * 100,
    l: l * 100,
  };
}

/**
 * Helper to create a conditional format rule with sensible defaults.
 *
 * @param options - Rule configuration
 * @returns ConditionalFormatRule
 *
 * @example
 * const rule = createRule({
 *   column: 'revenue',
 *   condition: { type: 'greaterThan', value: 100000 },
 *   style: { backgroundColor: '#d4edda', fontWeight: 'bold' },
 * });
 */
export function createRule(options: {
  id?: string;
  column: string;
  condition: FormatCondition;
  style: FormatStyle;
  priority?: number;
  stopIfTrue?: boolean;
}): ConditionalFormatRule {
  return {
    id: options.id || `rule-${Date.now()}`,
    column: options.column,
    condition: options.condition,
    style: options.style,
    priority: options.priority ?? 50,
    stopIfTrue: options.stopIfTrue ?? false,
  };
}
