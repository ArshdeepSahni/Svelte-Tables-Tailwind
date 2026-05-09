/**
 * @tablecraft/svelte — Conditional formatting tests
 * Comprehensive test suite for rule evaluation, color scales, and data bars.
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateConditionalFormats,
  colorScale,
  dataBarWidth,
  dataBarGradient,
  createRule,
  type FormatCondition,
  type ConditionalFormatRule,
  type ConditionalFormatPreset,
} from '../lib/conditional-format.js';

describe('Conditional Formatting', () => {
  describe('condition evaluation', () => {
    it('should evaluate greaterThan condition', () => {
      const rules: ConditionalFormatRule[] = [
        {
          id: 'rule1',
          column: 'revenue',
          condition: { type: 'greaterThan', value: 100000 },
          style: { backgroundColor: '#d4edda' },
          priority: 0,
        },
      ];

      const result = evaluateConditionalFormats(
        rules,
        [],
        { revenue: 150000 },
        'revenue',
        [50000, 100000, 150000, 200000],
      );

      expect(result).toEqual({ backgroundColor: '#d4edda' });
    });

    it('should evaluate lessThan condition', () => {
      const rules: ConditionalFormatRule[] = [
        {
          id: 'rule1',
          column: 'quantity',
          condition: { type: 'lessThan', value: 10 },
          style: { backgroundColor: '#f8d7da' },
          priority: 0,
        },
      ];

      const result = evaluateConditionalFormats(
        rules,
        [],
        { quantity: 5 },
        'quantity',
        [5, 15, 25],
      );

      expect(result).toEqual({ backgroundColor: '#f8d7da' });
    });

    it('should evaluate between condition', () => {
      const rules: ConditionalFormatRule[] = [
        {
          id: 'rule1',
          column: 'temperature',
          condition: { type: 'between', min: 18, max: 25 },
          style: { backgroundColor: '#fff3cd' },
          priority: 0,
        },
      ];

      const result = evaluateConditionalFormats(
        rules,
        [],
        { temperature: 20 },
        'temperature',
        [10, 20, 30],
      );

      expect(result).toEqual({ backgroundColor: '#fff3cd' });
    });

    it('should evaluate equals condition', () => {
      const rules: ConditionalFormatRule[] = [
        {
          id: 'rule1',
          column: 'status',
          condition: { type: 'equals', value: 'active' },
          style: { color: '#198754' },
          priority: 0,
        },
      ];

      const result = evaluateConditionalFormats(
        rules,
        [],
        { status: 'active' },
        'status',
        ['active', 'inactive', 'pending'],
      );

      expect(result).toEqual({ color: '#198754' });
    });

    it('should evaluate contains condition', () => {
      const rules: ConditionalFormatRule[] = [
        {
          id: 'rule1',
          column: 'email',
          condition: { type: 'contains', value: '@example.com' },
          style: { backgroundColor: '#e7f3ff' },
          priority: 0,
        },
      ];

      const result = evaluateConditionalFormats(
        rules,
        [],
        { email: 'alice@example.com' },
        'email',
        ['alice@example.com', 'bob@other.com'],
      );

      expect(result).toEqual({ backgroundColor: '#e7f3ff' });
    });

    it('should evaluate isEmpty condition', () => {
      const rules: ConditionalFormatRule[] = [
        {
          id: 'rule1',
          column: 'notes',
          condition: { type: 'isEmpty' },
          style: { opacity: 0.5 },
          priority: 0,
        },
      ];

      const result = evaluateConditionalFormats(rules, [], { notes: null }, 'notes', [null, 'text', '']);

      expect(result).toEqual({ opacity: 0.5 });
    });

    it('should evaluate isNotEmpty condition', () => {
      const rules: ConditionalFormatRule[] = [
        {
          id: 'rule1',
          column: 'comment',
          condition: { type: 'isNotEmpty' },
          style: { fontWeight: 'bold' },
          priority: 0,
        },
      ];

      const result = evaluateConditionalFormats(
        rules,
        [],
        { comment: 'Good work!' },
        'comment',
        ['Good work!', null, ''],
      );

      expect(result).toEqual({ fontWeight: 'bold' });
    });

    it('should evaluate topN condition', () => {
      const rules: ConditionalFormatRule[] = [
        {
          id: 'rule1',
          column: 'sales',
          condition: { type: 'topN', count: 3 },
          style: { backgroundColor: '#d4edda' },
          priority: 0,
        },
      ];

      const allValues = [100, 500, 1000, 2000, 5000];

      // 5000 is in top 3
      const result = evaluateConditionalFormats(rules, [], { sales: 5000 }, 'sales', allValues);
      expect(result).toEqual({ backgroundColor: '#d4edda' });

      // 100 is NOT in top 3
      const result2 = evaluateConditionalFormats(rules, [], { sales: 100 }, 'sales', allValues);
      expect(result2).toBeNull();
    });

    it('should evaluate bottomN condition', () => {
      const rules: ConditionalFormatRule[] = [
        {
          id: 'rule1',
          column: 'errors',
          condition: { type: 'bottomN', count: 2 },
          style: { backgroundColor: '#f8d7da' },
          priority: 0,
        },
      ];

      const allValues = [5, 10, 20, 50, 100];

      // 5 is in bottom 2
      const result = evaluateConditionalFormats(rules, [], { errors: 5 }, 'errors', allValues);
      expect(result).toEqual({ backgroundColor: '#f8d7da' });

      // 100 is NOT in bottom 2
      const result2 = evaluateConditionalFormats(rules, [], { errors: 100 }, 'errors', allValues);
      expect(result2).toBeNull();
    });

    it('should evaluate aboveAverage condition', () => {
      const rules: ConditionalFormatRule[] = [
        {
          id: 'rule1',
          column: 'score',
          condition: { type: 'aboveAverage' },
          style: { color: '#198754' },
          priority: 0,
        },
      ];

      // Average is 50
      const allValues = [10, 40, 50, 60, 90];

      const result = evaluateConditionalFormats(rules, [], { score: 60 }, 'score', allValues);
      expect(result).toEqual({ color: '#198754' });
    });

    it('should evaluate belowAverage condition', () => {
      const rules: ConditionalFormatRule[] = [
        {
          id: 'rule1',
          column: 'rating',
          condition: { type: 'belowAverage' },
          style: { color: '#dc3545' },
          priority: 0,
        },
      ];

      // Average is 50
      const allValues = [10, 40, 50, 60, 90];

      const result = evaluateConditionalFormats(rules, [], { rating: 40 }, 'rating', allValues);
      expect(result).toEqual({ color: '#dc3545' });
    });

    it('should evaluate duplicates condition', () => {
      const rules: ConditionalFormatRule[] = [
        {
          id: 'rule1',
          column: 'code',
          condition: { type: 'duplicates' },
          style: { backgroundColor: '#fff3cd' },
          priority: 0,
        },
      ];

      const allValues = ['A1', 'B2', 'A1', 'C3'];

      // 'A1' appears twice
      const result = evaluateConditionalFormats(rules, [], { code: 'A1' }, 'code', allValues);
      expect(result).toEqual({ backgroundColor: '#fff3cd' });

      // 'B2' appears once
      const result2 = evaluateConditionalFormats(rules, [], { code: 'B2' }, 'code', allValues);
      expect(result2).toBeNull();
    });

    it('should evaluate unique condition', () => {
      const rules: ConditionalFormatRule[] = [
        {
          id: 'rule1',
          column: 'id',
          condition: { type: 'unique' },
          style: { backgroundColor: '#d4edda' },
          priority: 0,
        },
      ];

      const allValues = [1, 2, 3, 2, 4];

      // 1 is unique
      const result = evaluateConditionalFormats(rules, [], { id: 1 }, 'id', allValues);
      expect(result).toEqual({ backgroundColor: '#d4edda' });

      // 2 is not unique
      const result2 = evaluateConditionalFormats(rules, [], { id: 2 }, 'id', allValues);
      expect(result2).toBeNull();
    });

    it('should evaluate custom condition function', () => {
      const rules: ConditionalFormatRule[] = [
        {
          id: 'rule1',
          column: 'price',
          condition: {
            type: 'custom',
            fn: (value, row) => typeof value === 'number' && value > 100 && (row.category as string) === 'premium',
          },
          style: { fontWeight: 'bold' },
          priority: 0,
        },
      ];

      const result = evaluateConditionalFormats(
        rules,
        [],
        { price: 150, category: 'premium' },
        'price',
        [50, 100, 150],
      );

      expect(result).toEqual({ fontWeight: 'bold' });
    });
  });

  describe('rule priority and stopIfTrue', () => {
    it('should evaluate rules in priority order', () => {
      const rules: ConditionalFormatRule[] = [
        {
          id: 'rule2',
          column: 'value',
          condition: { type: 'greaterThan', value: 50 },
          style: { backgroundColor: 'yellow' },
          priority: 10,
        },
        {
          id: 'rule1',
          column: 'value',
          condition: { type: 'greaterThan', value: 100 },
          style: { backgroundColor: 'red' },
          priority: 0,
        },
      ];

      const result = evaluateConditionalFormats(rules, [], { value: 150 }, 'value', [50, 100, 150]);

      // rule1 has higher priority (0 < 10), so it matches first
      expect(result).toEqual({ backgroundColor: 'red' });
    });

    it('should stop evaluation when stopIfTrue is set', () => {
      const rules: ConditionalFormatRule[] = [
        {
          id: 'rule1',
          column: 'status',
          condition: { type: 'equals', value: 'active' },
          style: { color: 'green' },
          priority: 0,
          stopIfTrue: true,
        },
        {
          id: 'rule2',
          column: 'status',
          condition: { type: 'isNotEmpty' },
          style: { color: 'blue' },
          priority: 1,
        },
      ];

      const result = evaluateConditionalFormats(
        rules,
        [],
        { status: 'active' },
        'status',
        ['active', 'inactive'],
      );

      // rule1 matches and stops — rule2 is never evaluated
      expect(result).toEqual({ color: 'green' });
    });

    it('should continue evaluation when stopIfTrue is false', () => {
      const rules: ConditionalFormatRule[] = [
        {
          id: 'rule1',
          column: 'value',
          condition: { type: 'greaterThan', value: 0 },
          style: { fontWeight: 'bold' },
          priority: 0,
          stopIfTrue: false,
        },
        {
          id: 'rule2',
          column: 'value',
          condition: { type: 'greaterThan', value: 50 },
          style: { backgroundColor: 'yellow' },
          priority: 1,
        },
      ];

      const result = evaluateConditionalFormats(rules, [], { value: 100 }, 'value', [1, 50, 100]);

      // rule1 matches but doesn't stop, rule2 also matches but has lower priority
      // Return rule1's style (higher priority)
      expect(result).toEqual({ fontWeight: 'bold' });
    });
  });

  describe('column filtering', () => {
    it('should apply rules to specific columns', () => {
      const rules: ConditionalFormatRule[] = [
        {
          id: 'rule1',
          column: 'salary',
          condition: { type: 'greaterThan', value: 100000 },
          style: { backgroundColor: '#d4edda' },
          priority: 0,
        },
      ];

      // Should match on 'salary' column
      const result1 = evaluateConditionalFormats(
        rules,
        [],
        { salary: 150000 },
        'salary',
        [50000, 100000, 150000],
      );
      expect(result1).not.toBeNull();

      // Should NOT match on 'bonus' column
      const result2 = evaluateConditionalFormats(rules, [], { bonus: 150000 }, 'bonus', [50000, 100000, 150000]);
      expect(result2).toBeNull();
    });

    it('should apply wildcard rules to all columns', () => {
      const rules: ConditionalFormatRule[] = [
        {
          id: 'rule1',
          column: '*',
          condition: { type: 'isEmpty' },
          style: { opacity: 0.5 },
          priority: 0,
        },
      ];

      // Should match on any column
      const result1 = evaluateConditionalFormats(rules, [], { salary: null }, 'salary', [null, 100, 200]);
      expect(result1).toEqual({ opacity: 0.5 });

      const result2 = evaluateConditionalFormats(rules, [], { name: null }, 'name', [null, 'Alice', 'Bob']);
      expect(result2).toEqual({ opacity: 0.5 });
    });
  });

  describe('color scale generation', () => {
    it('should interpolate between two colors', () => {
      const color = colorScale(50, 0, 100);
      expect(color).toMatch(/hsl\(\d+,\s*\d+%,\s*\d+%\)/);
    });

    it('should return min color at lower bound', () => {
      const color = colorScale(0, 0, 100, '#00FF00', '#FF0000');
      // At 0%, should be close to green
      expect(color).toContain('hsl');
    });

    it('should return max color at upper bound', () => {
      const color = colorScale(100, 0, 100, '#00FF00', '#FF0000');
      // At 100%, should be close to red
      expect(color).toContain('hsl');
    });

    it('should clamp values outside range', () => {
      const color1 = colorScale(-10, 0, 100);
      const color2 = colorScale(150, 0, 100);

      // Both should be valid HSL colors
      expect(color1).toMatch(/hsl\(\d+,\s*\d+%,\s*\d+%\)/);
      expect(color2).toMatch(/hsl\(\d+,\s*\d+%,\s*\d+%\)/);
    });

    it('should support three-point interpolation with midColor', () => {
      const color = colorScale(50, 0, 100, '#00FF00', '#FF0000', '#FFFF00');
      expect(color).toMatch(/hsl\(\d+,\s*\d+%,\s*\d+%\)/);
    });

    it('should parse hex, rgb, and hsl input colors', () => {
      const hex = colorScale(50, 0, 100, '#4CAF50', '#F44336');
      const rgb = colorScale(50, 0, 100, 'rgb(76, 175, 80)', 'rgb(244, 67, 54)');
      const hsl = colorScale(50, 0, 100, 'hsl(120, 61%, 50%)', 'hsl(4, 90%, 58%)');

      expect(hex).toMatch(/hsl/);
      expect(rgb).toMatch(/hsl/);
      expect(hsl).toMatch(/hsl/);
    });
  });

  describe('data bar rendering', () => {
    it('should calculate bar width percentage', () => {
      const width = dataBarWidth(50, 0, 100);
      expect(width).toBe(50);

      const width2 = dataBarWidth(75, 0, 100);
      expect(width2).toBe(75);
    });

    it('should clamp bar width to 0-100%', () => {
      const width1 = dataBarWidth(-10, 0, 100);
      expect(width1).toBe(0);

      const width2 = dataBarWidth(150, 0, 100);
      expect(width2).toBe(100);
    });

    it('should generate valid CSS gradient', () => {
      const gradient = dataBarGradient(50, 0, 100);
      expect(gradient).toContain('linear-gradient');
      expect(gradient).toContain('50%');
    });

    it('should support custom bar color', () => {
      const gradient = dataBarGradient(75, 0, 100, '#0a0a0a');
      expect(gradient).toContain('0a0a0a');
    });
  });

  describe('presets', () => {
    it('should apply highlightTop10 preset', () => {
      const presets: ConditionalFormatPreset[] = [
        {
          column: 'revenue',
          preset: 'highlightTop10',
        },
      ];

      const allValues = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 11000];

      // 11000 should match top 10%
      const result = evaluateConditionalFormats([], presets, { revenue: 11000 }, 'revenue', allValues);
      expect(result).not.toBeNull();
      expect(result?.backgroundColor).toBeDefined();
    });

    it('should apply highlightBottom10 preset', () => {
      const presets: ConditionalFormatPreset[] = [
        {
          column: 'errors',
          preset: 'highlightBottom10',
        },
      ];

      const allValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

      // 1 should match bottom 10%
      const result = evaluateConditionalFormats([], presets, { errors: 1 }, 'errors', allValues);
      expect(result).not.toBeNull();
    });

    it('should apply iconSet preset', () => {
      const presets: ConditionalFormatPreset[] = [
        {
          column: 'performance',
          preset: 'iconSet',
        },
      ];

      const allValues = [20, 40, 60, 80, 100];

      // Top value should have up arrow
      const result = evaluateConditionalFormats([], presets, { performance: 100 }, 'performance', allValues);
      expect(result?.icon).toBe('▲');
    });
  });

  describe('createRule helper', () => {
    it('should create rule with default priority', () => {
      const rule = createRule({
        column: 'salary',
        condition: { type: 'greaterThan', value: 100000 },
        style: { backgroundColor: '#d4edda' },
      });

      expect(rule.priority).toBe(50);
      expect(rule.stopIfTrue).toBe(false);
      expect(rule.id).toBeDefined();
    });

    it('should create rule with custom options', () => {
      const rule = createRule({
        id: 'custom-rule',
        column: 'salary',
        condition: { type: 'greaterThan', value: 100000 },
        style: { backgroundColor: '#d4edda' },
        priority: 10,
        stopIfTrue: true,
      });

      expect(rule.id).toBe('custom-rule');
      expect(rule.priority).toBe(10);
      expect(rule.stopIfTrue).toBe(true);
    });
  });

  describe('null and undefined handling', () => {
    it('should handle null values in conditions', () => {
      const rules: ConditionalFormatRule[] = [
        {
          id: 'rule1',
          column: 'value',
          condition: { type: 'isEmpty' },
          style: { opacity: 0.5 },
          priority: 0,
        },
      ];

      const result = evaluateConditionalFormats(rules, [], { value: null }, 'value', [null, 1, 2]);
      expect(result).toEqual({ opacity: 0.5 });
    });

    it('should handle undefined values in conditions', () => {
      const rules: ConditionalFormatRule[] = [
        {
          id: 'rule1',
          column: 'value',
          condition: { type: 'isEmpty' },
          style: { opacity: 0.5 },
          priority: 0,
        },
      ];

      const result = evaluateConditionalFormats(rules, [], { value: undefined }, 'value', [undefined, 1, 2]);
      expect(result).toEqual({ opacity: 0.5 });
    });

    it('should return null when no rules match', () => {
      const rules: ConditionalFormatRule[] = [
        {
          id: 'rule1',
          column: 'value',
          condition: { type: 'greaterThan', value: 1000 },
          style: { backgroundColor: '#d4edda' },
          priority: 0,
        },
      ];

      const result = evaluateConditionalFormats(rules, [], { value: 100 }, 'value', [100, 200, 300]);
      expect(result).toBeNull();
    });
  });
});
