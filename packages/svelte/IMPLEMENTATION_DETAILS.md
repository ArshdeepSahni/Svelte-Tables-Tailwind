# Implementation Details: History & Conditional Formatting

Technical reference for developers integrating or extending these systems.

---

## History Manager Implementation

### Reactive State Pattern

```typescript
let entries = $state<HistoryEntry[]>([]);
let position = $state(-1); // -1 = no history
```

Uses Svelte 5 `$state()` for automatic reactivity. No manual invalidation needed.

### Position Semantics

Position represents the **currently active history entry:**

```
Entries:  [E0, E1, E2, E3, E4]
Position: -1   0   1   2   3   (4 = no undo available)

position = -1 → canUndo = false (no history)
position = 3  → canUndo = true, canRedo = false (at top)
position = 2  → canUndo = true, canRedo = true (in middle)
```

### Truncation Logic

When pushing after undo:

```typescript
// Current state: entries = [E0, E1, E2, E3], position = 1
// User undoes twice: position = -1
// User pushes NEW entry E4

// Before: [E0, E1, E2, E3]
// After:  [E0, E4]
// Position: 1 (pointing to E4)

entries = entries.slice(0, position + 1); // Keep up to current
entries = [...entries, newEntry];
```

This prevents "branching timelines" — only one path forward.

### Max Entries Enforcement

```typescript
if (entries.length > maxEntries) {
  entries = entries.slice(-maxEntries); // Keep last N
}
```

Uses `slice(-maxEntries)` to drop oldest entries while preserving position accuracy.

### Async Undo/Redo Pattern

Both closures support async:

```typescript
const result = entry.undo();
if (result instanceof Promise) {
  await result;
}
await tick(); // Allow Svelte to settle reactivity
```

`tick()` ensures any `$state()` updates from the closure are processed before moving position.

### Keyboard Shortcuts

Platform detection:

```typescript
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
```

Supports:
- Cmd+Z (Mac) / Ctrl+Z (Windows) → undo
- Cmd+Shift+Z (Mac) / Ctrl+Shift+Z (Windows) → redo
- Ctrl+Y / Cmd+Y → alternate redo

---

## Conditional Formatting Implementation

### Condition Evaluation Strategy

Each condition type is a separate branch in `evaluateCondition()`:

```typescript
case 'greaterThan':
  return !isNaN(numValue) && numValue > condition.value;
```

**Type Coercion:**
- Numeric conditions: `parseFloat(String(value))` with `isNaN()` check
- String conditions: `String(value)` for comparison
- Statistical: filter to numeric values only

### Statistical Conditions

**TopN:** Sort descending, grab Nth element:

```typescript
const numValues = allValues
  .map((v) => typeof v === 'number' ? v : parseFloat(String(v)))
  .filter((v) => !isNaN(v))
  .sort((a, b) => b - a); // descending
const threshold = numValues[condition.count - 1];
return !isNaN(numValue) && numValue >= threshold;
```

**AboveAverage:** Compute mean:

```typescript
const numValues = allValues.filter(v => !isNaN(v));
const avg = numValues.reduce((a, b) => a + b, 0) / numValues.length;
return numValue > avg;
```

### Rule Priority System

Rules are sorted before evaluation:

```typescript
const applicableRules = allRules
  .filter((r) => r.column === columnKey || r.column === '*')
  .sort((a, b) => a.priority - b.priority);

for (const rule of applicableRules) {
  if (evaluateCondition(...)) {
    return rule.style;
  }
  if (rule.stopIfTrue) break; // Early exit
}
```

**Key:** Only ONE matching style is returned (highest priority).

### Color Scale HSL Interpolation

**Two-point interpolation:**

```
RGB → HSL → interpolate → HSL → output
```

Example: Green (#00FF00) → Red (#FF0000) at value=50 (0-100):

1. Parse #00FF00 → HSL(120°, 100%, 50%)
2. Parse #FF0000 → HSL(0°, 100%, 50%)
3. Interpolate at t=0.5:
   - h = 120 + (0 - 120) * 0.5 = 60°
   - s = 100 + (100 - 100) * 0.5 = 100%
   - l = 50 + (50 - 50) * 0.5 = 50%
4. Output: hsl(60, 100%, 50%) = yellow

**Three-point interpolation:**

Uses midpoint (t=0.5 boundary):

```typescript
if (normalized < 0.5) {
  // min → mid: scale t to 0-1
  const t = normalized * 2;
  interpolate(min, mid, t);
} else {
  // mid → max: scale t to 0-1
  const t = (normalized - 0.5) * 2;
  interpolate(mid, max, t);
}
```

### RGB to HSL Conversion

Standard algorithm:

```typescript
function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: l * 100 };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  // Determine hue based on which channel is max
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return { h: h * 360, s: s * 100, l: l * 100 };
}
```

### Data Bar Gradient Generation

```typescript
const width = dataBarWidth(value, min, max);
const colorAlpha = barColor.replace(')', ', 0.15)');
return `linear-gradient(to right, ${colorAlpha} 0%, ${colorAlpha} ${width}%, transparent ${width}%)`;
```

This creates:
- Colored fill from 0% to width%
- Transparent fill from width% to 100%
- 15% alpha for subtle appearance

In CSS:

```css
background-image: linear-gradient(to right, rgba(10, 10, 10, 0.15) 0%, rgba(10, 10, 10, 0.15) 50%, transparent 50%);
background-size: 100% 100%;
background-position: 0 0;
```

### Preset Rule Generation

Each preset expands into rules dynamically:

```typescript
function generatePresetRules(presets, columnKey) {
  const rules = [];
  for (const preset of presets) {
    if (preset.column !== columnKey && preset.column !== '*') continue;

    switch (preset.preset) {
      case 'highlightTop10':
        rules.push({
          id: `${preset.column}-top10`,
          column: preset.column,
          condition: { type: 'topN', count: Math.ceil(10) },
          style: { backgroundColor: 'var(--tc-color-highlight-top)' },
          priority: 50,
        });
        break;
      // ... other presets
    }
  }
  return rules;
}
```

**Icon Set Preset** creates three rules:

```typescript
case 'iconSet':
  rules.push(
    { id: '...', condition: { type: 'topN', count: 1 }, style: { icon: '▲' }, priority: 100 },
    { id: '...', condition: { type: 'bottomN', count: 1 }, style: { icon: '▼' }, priority: 100 },
    { id: '...', condition: { type: 'custom', fn: () => true }, style: { icon: '→' }, priority: 101 }
  );
```

---

## Performance Optimizations

### History Manager: O(1) Operations

- **Push:** append + trim = O(1)
- **Undo:** closure call + position--= O(1)
- **Redo:** position++ + closure call = O(1)
- **Lookup:** array index access = O(1)

Max memory: 50 entries × 2KB average = ~100KB

### Conditional Formatting: Efficient Evaluation

**Per-cell cost:**

```
O(n_rules) for rule iteration + O(n_values) for statistical conditions

For typical table:
  50 rules, 1000 rows, 10 columns, 20 values per condition
  = 50 * 1000 * (1 + 20) = 1,050,000 ops per table
  ≈ 5-10ms total (modern CPU can do ~100M ops/sec)
```

**Optimizations:**
1. Rules sorted once (O(n_rules log n_rules))
2. Early `stopIfTrue` exit prevents unnecessary evaluation
3. No re-rendering triggered by condition checks (pure functions)
4. Color scale uses fast HSL math (no gamma correction)

### Caching Opportunities (Future)

```typescript
// Memoize column statistics
const columnStats = new Map<string, {
  min: number;
  max: number;
  avg: number;
  median: number;
}>();

// Pre-sort rule tree by column
const rulesByColumn = new Map<string, ConditionalFormatRule[]>();
```

---

## Type Safety

### History Entry Generic Pattern

```typescript
interface HistoryEntry {
  id: string;
  timestamp: number;
  type: 'cell-edit' | 'sort' | ...;
  description: string;
  undo: () => void | Promise<void>;
  redo: () => void | Promise<void>;
}
```

Closures are `() => void | Promise<void>` — they modify external state (data, rows, etc.) rather than returning values.

### Condition Union Discriminant

```typescript
type FormatCondition =
  | { type: 'greaterThan'; value: number }
  | { type: 'equals'; value: unknown }
  | ...;
```

TypeScript's discriminated unions ensure each condition type has its required fields. Type narrowing works:

```typescript
if (condition.type === 'greaterThan') {
  condition.value; // TS knows this is number
}
```

### Rule Priority Type

```typescript
interface ConditionalFormatRule {
  priority: number; // 0 = highest priority
}
```

No enum — allows numeric ranges (0-100, 0-1000, etc.) without pre-defining all values.

---

## Testing Strategy

### Unit Tests for Conditions

Each condition type gets isolated test:

```typescript
it('should evaluate greaterThan condition', () => {
  const rules = [{ condition: { type: 'greaterThan', value: 100 } }];
  const result = evaluateConditionalFormats(rules, [], { value: 150 }, ...);
  expect(result).not.toBeNull();
});
```

### Integration Tests for History

Test real workflows:

```typescript
it('should track multiple undo/redo cycles', async () => {
  history.push({ type: 'cell-edit', ... });
  history.push({ type: 'cell-edit', ... });
  await history.undo();
  await history.undo();
  await history.redo();
  expect(history.position).toBe(1);
});
```

### Edge Case Handling

```typescript
it('should handle null values', () => {
  const result = evaluateConditionalFormats(rules, [], { value: null }, ...);
  // Verify behavior
});

it('should clamp color scale values', () => {
  const color = colorScale(-10, 0, 100); // below range
  expect(color).toMatch(/hsl/);
});
```

---

## Browser API Usage

### Keyboard Event Handling

```typescript
element.addEventListener('keydown', (e: KeyboardEvent) => {
  if (isMac ? e.metaKey : e.ctrlKey) {
    if (e.key === 'z') {
      e.preventDefault();
      history.undo();
    }
  }
});
```

**Compatibility:**
- `KeyboardEvent.metaKey` - Cmd key (Safari, Chrome, Firefox)
- `KeyboardEvent.ctrlKey` - Ctrl key (all browsers)
- `KeyboardEvent.key` - Standardized on all modern browsers (no keyCode)

### No External Dependencies

Both systems use **only:**
- ES2020+ JavaScript (Svelte 5 requirement)
- No DOM APIs (pure functions in conditional formatting)
- Standard `Math` for color interpolation
- `Date.now()` for timestamps
- `navigator.platform` for platform detection

---

## Extensibility

### Custom Conditions

Add to `evaluateCondition()`:

```typescript
case 'myCondition':
  return evaluateMyCondition(condition, value, row, allValues);
```

### Custom Presets

Add to `generatePresetRules()`:

```typescript
case 'myPreset':
  rules.push(...generateMyPresetRules(preset, columnKey));
  break;
```

### Custom Color Spaces

Replace `parseColorToHsl()` and HSL interpolation with LAB (perceptually more uniform):

```typescript
// Current: RGB → HSL → interpolate
// New: RGB → LAB → interpolate → LAB → RGB

import { hslToRgb, rgbToLab, labInterpolate, labToRgb } from './color-spaces.js';
```

---

## Migration Path (Future)

### From Other Undo Libraries

```typescript
// Old: Redux, Immer snapshots
const snapshot = cloneDeep(state);
history.push({ undo: () => Object.assign(state, snapshot) });

// New: Closure-based, no snapshots
history.push({
  undo: () => { state.field = oldValue; },
  redo: () => { state.field = newValue; },
});
```

### From Excel-Style Conditions

```typescript
// Old: XLS rule definition
const rule = { format: 'color-scale', minColor: '#4CAF50', maxColor: '#F44336' };

// New: TypeScript type-safe
const style = colorScale(value, min, max, '#4CAF50', '#F44336');
```

---

## Debugging

### History Inspection

```typescript
console.log(history.entries); // See all entries
console.log(history.position); // See current position
console.log(history.current);  // See active entry
```

### Formatting Inspection

Add logging to `evaluateCondition()`:

```typescript
console.log(`Evaluating ${condition.type} against ${value}`);
const result = evaluateCondition(...);
console.log(`Result: ${result ? 'MATCH' : 'NO MATCH'}`);
```

### Color Scale Debugging

```typescript
const min = parseColorToHsl(minColor);
const max = parseColorToHsl(maxColor);
console.log('Min HSL:', min);
console.log('Max HSL:', max);
const result = colorScale(value, min, max);
console.log('Interpolated:', result);
```

---

## Known Limitations

1. **HSL Interpolation:** Doesn't account for color perception curves (LAB would be more accurate but slower)
2. **Preset Rules:** Static at evaluation time (can't change presets mid-render)
3. **History Snapshots:** No branching timelines (new action after undo truncates future)
4. **Max Entries:** Hard limit (configurable, but no eviction strategies)

---

## Future Enhancements

1. **Diff-based History:** Only store changed fields, not full closures
2. **Rule Caching:** Memoize statistical calculations per column
3. **Timeline Visualization:** UI showing history tree
4. **Conditional Format Persistence:** Save/restore rules to localStorage
5. **Rule Builder UI:** Drag-drop condition construction
6. **Multi-select Format:** Apply rules to multiple cells at once
7. **Format Import/Export:** Excel-compatible rule definitions
