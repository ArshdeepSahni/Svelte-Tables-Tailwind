# History (Undo/Redo) and Conditional Formatting Guide

Time travel and intelligent cell styling for @tablecraft/svelte.

## History Manager — Undo/Redo Time Travel

The `createHistoryManager()` hook provides reactive undo/redo with per-action closure-based reversals. Perfect for cell edits, sort changes, filter toggles, and bulk operations.

### Quick Start

```svelte
<script>
  import { createHistoryManager, bindHistoryShortcuts } from '@tablecraft/svelte';

  let data = $state([
    { id: 1, name: 'Alice', salary: 50000 },
    { id: 2, name: 'Bob', salary: 60000 },
  ]);

  const history = createHistoryManager(50); // max 50 entries

  // Bind keyboard shortcuts (Cmd+Z / Ctrl+Z = undo, Cmd+Shift+Z = redo)
  $effect(() => {
    return bindHistoryShortcuts(history);
  });

  function updateCell(rowIndex, key, oldValue, newValue) {
    // Update the UI
    data[rowIndex][key] = newValue;

    // Record in history
    history.push({
      type: 'cell-edit',
      description: `Changed ${key} from '${oldValue}' to '${newValue}'`,
      undo: () => {
        data[rowIndex][key] = oldValue;
      },
      redo: () => {
        data[rowIndex][key] = newValue;
      },
    });
  }
</script>

<button disabled={!history.canUndo} onclick={() => history.undo()}>
  Undo
</button>

<button disabled={!history.canRedo} onclick={() => history.redo()}>
  Redo
</button>

<p>{history.current?.description || 'No changes'}</p>
```

### API Reference

#### `createHistoryManager(maxEntries?: number)`

Create a reactive history manager.

**Parameters:**
- `maxEntries` - Maximum stack size (default: 50). Oldest entries are dropped when limit is reached.

**Returns:** `HistoryManager` object with the following properties and methods:

```typescript
interface HistoryManager {
  // Read-only state
  readonly entries: HistoryEntry[];      // all history entries
  readonly position: number;              // current position (-1 = no history)
  readonly canUndo: boolean;              // whether undo is available
  readonly canRedo: boolean;              // whether redo is available
  readonly current: HistoryEntry | null;  // current entry, or null

  // Methods
  push(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): void;
  undo(): Promise<void>;
  redo(): Promise<void>;
  clear(): void;
}
```

#### `history.push(entry)`

Record a new action. If you're in the middle of history (position < entries.length - 1), all future entries are truncated.

```typescript
history.push({
  type: 'cell-edit',                    // required: action type
  description: "Changed name to 'Bob'", // required: human-readable description
  undo: () => { /* revert action */ },  // required: closure to undo
  redo: () => { /* re-apply action */ }, // required: closure to redo
});
```

**Action types:**
- `'cell-edit'` - Individual cell modification
- `'bulk-edit'` - Multiple cells modified at once
- `'sort'` - Column sort changed
- `'filter'` - Filter applied or removed
- `'column-hide'` - Column visibility toggled
- `'column-reorder'` - Columns reordered
- `'row-delete'` - Row(s) deleted

#### `await history.undo()`

Revert to the previous state. Calls the `undo` closure from the current entry, then moves position backward. No-op if `canUndo` is false.

```typescript
await history.undo(); // revert the last action
```

#### `await history.redo()`

Re-apply the next action. Moves position forward, then calls the `redo` closure. No-op if `canRedo` is false.

```typescript
await history.redo(); // re-apply the undone action
```

#### `history.clear()`

Delete all history entries and reset position to -1.

```typescript
history.clear(); // wipe history
```

#### `bindHistoryShortcuts(history, element?)`

Attach keyboard listeners for Cmd+Z (undo) and Cmd+Shift+Z (redo). Automatically detects platform (Mac vs. Windows/Linux).

```typescript
$effect(() => {
  return bindHistoryShortcuts(history, document);
});
```

**Shortcuts:**
- **Cmd+Z** (Mac) / **Ctrl+Z** (Windows/Linux): Undo
- **Cmd+Shift+Z** (Mac) / **Ctrl+Shift+Z** (Windows/Linux): Redo
- **Ctrl+Y** / **Cmd+Y**: Alternate redo

### Example: Tracking Bulk Cell Edits

```svelte
<script>
  const history = createHistoryManager();

  function updateMultipleCells(updates) {
    // Track original values
    const originalValues = new Map();
    updates.forEach(({ row, key }) => {
      originalValues.set(key, row[key]);
    });

    // Apply changes
    updates.forEach(({ row, key, newValue }) => {
      row[key] = newValue;
    });

    // Record in history
    history.push({
      type: 'bulk-edit',
      description: `Updated ${updates.length} cells`,
      undo: () => {
        updates.forEach(({ row, key }) => {
          row[key] = originalValues.get(key);
        });
      },
      redo: () => {
        updates.forEach(({ row, key, newValue }) => {
          row[key] = newValue;
        });
      },
    });
  }
</script>
```

### Async Undo/Redo

Both `undo` and `redo` closures can be async. History manager automatically awaits them.

```typescript
history.push({
  type: 'cell-edit',
  description: 'Saved to database',
  undo: async () => {
    await fetch('/api/revert', { method: 'POST' });
    data[rowIndex].name = oldValue;
  },
  redo: async () => {
    await fetch('/api/apply', { method: 'POST' });
    data[rowIndex].name = newValue;
  },
});
```

---

## Conditional Formatting

Intelligent rule-based cell styling inspired by Excel/Google Sheets, built with quiet luxury aesthetic (pure white background, near-black accents, subtle borders).

### Quick Start

```svelte
<script>
  import { evaluateConditionalFormats, colorScale, createRule } from '@tablecraft/svelte';
  import type { ConditionalFormatRule } from '@tablecraft/svelte';

  const rules: ConditionalFormatRule[] = [
    // Highlight top earners
    createRule({
      column: 'salary',
      condition: { type: 'greaterThan', value: 100000 },
      style: { backgroundColor: '#d4edda', fontWeight: 'bold' },
      priority: 0,
    }),
    // Flag low inventory
    createRule({
      column: 'stock',
      condition: { type: 'lessThan', value: 10 },
      style: { backgroundColor: '#f8d7da', color: '#dc3545' },
      priority: 0,
    }),
  ];

  function getRowStyle(row, columnKey, allValues) {
    return evaluateConditionalFormats(rules, [], row, columnKey, allValues);
  }
</script>

{#each rows as row, i}
  <tr>
    {#each columns as col}
      {@const style = getRowStyle(row, col.key, allValues[col.key])}
      <td style={styleToString(style)}>
        {row[col.key]}
      </td>
    {/each}
  </tr>
{/each}
```

### API Reference

#### Conditions

The `FormatCondition` type supports 14 different condition types:

```typescript
type FormatCondition =
  | { type: 'greaterThan'; value: number }          // > value
  | { type: 'lessThan'; value: number }             // < value
  | { type: 'between'; min: number; max: number }   // min ≤ val ≤ max
  | { type: 'equals'; value: unknown }              // === value
  | { type: 'contains'; value: string }             // string includes substring
  | { type: 'isEmpty' }                             // null, undefined, or ''
  | { type: 'isNotEmpty' }                          // not empty
  | { type: 'topN'; count: number }                 // top N values in column
  | { type: 'bottomN'; count: number }              // bottom N values in column
  | { type: 'aboveAverage' }                        // value > column average
  | { type: 'belowAverage' }                        // value < column average
  | { type: 'duplicates' }                          // appears more than once
  | { type: 'unique' }                              // appears only once
  | { type: 'custom'; fn: (value, row) => boolean } // custom evaluation
```

#### Styles

Apply any of these CSS properties when a condition matches:

```typescript
interface FormatStyle {
  backgroundColor?: string;     // hex, rgb, or hsl
  color?: string;               // text color
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  icon?: string;                // emoji: ✓, ✗, ⚠, etc.
  borderColor?: string;
  borderRadius?: string;
  padding?: string;
  opacity?: number;             // 0-1
}
```

#### `evaluateConditionalFormats(rules, presets, row, columnKey, allValues)`

Determine which style should apply to a cell. Rules are evaluated in priority order (lower number = higher priority). If a rule's `stopIfTrue` is true, no further rules are checked.

```typescript
const style = evaluateConditionalFormats(
  rules,           // ConditionalFormatRule[]
  presets,         // ConditionalFormatPreset[]
  row,             // { name: 'Alice', salary: 150000 }
  'salary',        // column key
  [50000, 100000, 150000, 200000] // all values in column
);

// Returns: { backgroundColor: '#d4edda', fontWeight: 'bold' } or null
```

#### `colorScale(value, min, max, minColor?, maxColor?, midColor?)`

Generate a perceptually-uniform color along a gradient. Uses HSL interpolation for smooth transitions.

```typescript
// Simple two-point gradient: green → red
const color = colorScale(75, 0, 100, '#4CAF50', '#F44336');
// Returns: hsl(47, 80%, 48%)

// Three-point gradient with midpoint: green → yellow → red
const color = colorScale(
  50,
  0,
  100,
  '#4CAF50',  // min (green)
  '#F44336',  // max (red)
  '#FFEB3B'   // mid (yellow)
);
```

Supports hex, rgb(), and hsl() input formats:

```typescript
colorScale(50, 0, 100, 'rgb(76, 175, 80)', 'rgb(244, 67, 54)');
colorScale(50, 0, 100, 'hsl(120, 61%, 50%)', 'hsl(4, 90%, 58%)');
```

#### `dataBarWidth(value, min, max)`

Calculate bar width percentage for data bar visualization.

```typescript
const width = dataBarWidth(75, 0, 100); // Returns: 75

// Use in CSS:
// background-size: ${width}% 100%;
// background-position: 0 0;
```

#### `dataBarGradient(value, min, max, barColor?)`

Generate a complete CSS `linear-gradient` for rendering data bars.

```typescript
const gradient = dataBarGradient(50, 0, 100, '#0a0a0a');
// Returns: "linear-gradient(to right, rgba(10, 10, 10, 0.15) 0%, rgba(10, 10, 10, 0.15) 50%, transparent 50%)"

// Use in CSS:
// style={`background-image: ${gradient};`}
```

#### `createRule(options)`

Helper to create a rule with sensible defaults:

```typescript
const rule = createRule({
  id: 'salary-highlight',        // optional, auto-generated if omitted
  column: 'salary',
  condition: { type: 'greaterThan', value: 100000 },
  style: { backgroundColor: '#d4edda', fontWeight: 'bold' },
  priority: 0,                   // optional, default: 50
  stopIfTrue: false,             // optional, default: false
});
```

### Presets

Pre-built formatting scenarios. Expand automatically into multiple rules.

```typescript
const presets: ConditionalFormatPreset[] = [
  {
    column: 'revenue',
    preset: 'highlightTop10', // highlight top 10% of values
  },
  {
    column: 'errors',
    preset: 'highlightBottom10', // highlight bottom 10%
  },
  {
    column: 'performance',
    preset: 'iconSet', // ▲ (top) → ▼ (bottom)
  },
  {
    column: 'temperature',
    preset: 'colorScale',
    options: {
      minColor: '#4CAF50',
      midColor: '#FFEB3B',
      maxColor: '#F44336',
    },
  },
];

evaluateConditionalFormats([], presets, row, 'revenue', allValues);
```

**Available presets:**
- `'colorScale'` — Gradient from min (green) to max (red), optional midpoint
- `'dataBar'` — Bar chart in cell background
- `'iconSet'` — ▲ ▼ → based on percentile
- `'heatmap'` — Color intensity by value
- `'highlightTop10'` — Subtle highlight for top 10%
- `'highlightBottom10'` — Subtle highlight for bottom 10%

### Example: Dashboard with Statistical Formatting

```svelte
<script>
  import {
    evaluateConditionalFormats,
    dataBarGradient,
    createRule,
  } from '@tablecraft/svelte';

  const salesData = [
    { region: 'US', q1: 45000, q2: 52000, q3: 48000, q4: 61000 },
    { region: 'EU', q1: 38000, q2: 41000, q3: 39000, q4: 44000 },
    { region: 'APAC', q1: 62000, q2: 59000, q3: 65000, q4: 72000 },
  ];

  const rules = [
    createRule({
      column: '*',
      condition: { type: 'aboveAverage' },
      style: { fontWeight: 'bold' },
      priority: 1,
    }),
    createRule({
      column: '*',
      condition: { type: 'belowAverage' },
      style: { opacity: 0.7 },
      priority: 1,
    }),
  ];

  function getCellStyle(row, key, allValues) {
    const style = evaluateConditionalFormats(rules, [], row, key, allValues);

    // Add data bar
    if (typeof row[key] === 'number' && allValues.every(v => typeof v === 'number')) {
      const min = Math.min(...allValues);
      const max = Math.max(...allValues);
      const gradient = dataBarGradient(row[key], min, max, '#0a0a0a');
      return {
        ...style,
        backgroundImage: gradient,
        backgroundSize: '100% 100%',
      };
    }

    return style;
  }

  function styleToString(style) {
    return Object.entries(style || {})
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value}`;
      })
      .join('; ');
  }
</script>

<table>
  <thead>
    <tr>
      <th>Region</th>
      {#each ['Q1', 'Q2', 'Q3', 'Q4'] as quarter}
        <th>{quarter}</th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each salesData as row}
      <tr>
        <td>{row.region}</td>
        {#each ['q1', 'q2', 'q3', 'q4'] as quarter}
          {@const allValues = salesData.map(r => r[quarter])}
          {@const style = getCellStyle(row, quarter, allValues)}
          <td style={styleToString(style)}>
            ${row[quarter].toLocaleString()}
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>
```

### Design Tokens

All colors can be customized via CSS custom properties for full theme support:

```css
/* Default theme (quiet luxury) */
:root {
  --tc-color-preset-min: #d4edda;        /* green */
  --tc-color-preset-mid: #fff3cd;        /* yellow */
  --tc-color-preset-max: #f8d7da;        /* red */

  --tc-color-icon-good: #198754;         /* ▲ color */
  --tc-color-icon-neutral: #6c757d;      /* → color */
  --tc-color-icon-bad: #dc3545;          /* ▼ color */

  --tc-color-highlight-top: rgba(0, 0, 0, 0.05);      /* top 10% bg */
  --tc-color-highlight-bottom: rgba(220, 53, 69, 0.1); /* bottom 10% bg */
}
```

---

## Best Practices

### History

1. **Keep closures lightweight** — Don't capture large objects unnecessarily
2. **Use `stopIfTrue`** — For mutually-exclusive rules, prevent evaluation of lower priorities
3. **Clear history on major changes** — When loading new data, call `history.clear()`
4. **Handle async carefully** — Await undo/redo if they're async, but keep closures simple

### Conditional Formatting

1. **Priority matters** — Rules are evaluated top-to-bottom; put specific rules first (priority 0)
2. **Use presets for common patterns** — Don't reinvent color scales, data bars, or icon sets
3. **Wildcard columns** — Use `column: '*'` for rules that apply to all columns
4. **Test with real data** — Verify color scales and statistical conditions with actual datasets
5. **Accessibility** — Use `color` + `backgroundColor` contrasts that pass WCAG AA (4.5:1 minimum)

---

## See Also

- [History API reference](#history-manager--undoredo-time-travel)
- [Conditional Formatting API reference](#conditional-formatting)
- [CSS Containment & Performance](../../PERFORMANCE.md)
- [Design Tokens](../../DESIGN.md)
