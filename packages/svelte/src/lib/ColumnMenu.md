# ColumnMenu Component

## Overview

`ColumnMenu` is a sophisticated context menu for column operations in @tablecraft tables. It provides a Notion-inspired floating popover UI with advanced features like sorting, filtering, type changes, column freezing, and more.

**Design Philosophy:** Apple/Notion/Linear aesthetic with "quiet luxury" — minimal visual noise, maximum clarity.

## Features

### 1. **Sort Operations**
- Sort ascending (↑ icon)
- Sort descending (↓ icon)
- Visual checkmark (✓) indicator for active sort
- Single-column sorting

### 2. **Filter Operations**
- Inline filter input with placeholder
- Enter key or button (⏎) to apply
- Debounce-ready for integration with table filter logic

### 3. **Column Operations**
- **Group by** — Group table rows by this column value
- **Calculate** — Submenu with: Sum, Average, Count, Min, Max, Median
- **Freeze Left** — Pin column to left edge
- **Freeze Right** — Pin column to right edge
- Unfreeze by re-clicking the freeze option

### 4. **Visibility & Type**
- **Hide Column** — Remove from visible columns
- **Change Type** — Submenu with all 23 column types:
  - text, number, integer, currency, percentage, boolean
  - date, datetime, time, email, url, phone
  - image, badge, status, code, html
  - rating, progress, relative-time, color, sparkline, actions

### 5. **Column Management**
- Insert column left
- Insert column right
- Duplicate column

## Props

```typescript
interface Props {
  // Required
  column: ResolvedColumn;                          // Column this menu is for
  position: { x: number; y: number };              // Menu position (auto-adjusted)
  visible: boolean;                                // Show/hide menu
  sortState: { key: string | null; dir: 'asc' | 'desc' | null };

  // Optional state
  freezeState?: { key: string | null; side: 'left' | 'right' | null };
  groupByColumn?: string | null;

  // Callbacks
  onsort?: (key: string, dir: 'asc' | 'desc') => void;
  onhide?: (key: string) => void;
  onfreeze?: (key: string, side: 'left' | 'right' | null) => void;
  ongroupby?: (key: string) => void;
  onchangetype?: (key: string, type: string) => void;
  oncalculate?: (key: string, fn: string) => void;  // fn is lowercase: 'sum', 'average', etc.
  onfiltercolumn?: (key: string, value: string) => void;
  oninsertleft?: (key: string) => void;
  oninsertright?: (key: string) => void;
  onduplicate?: (key: string) => void;
  onclose?: () => void;                             // Called when menu should close
}
```

## Design Specifications

| Property | Value |
|----------|-------|
| **Width** | 240px |
| **Background** | #ffffff (`--tc-color-bg-menu`) |
| **Border** | 1px solid #f0f0f0 (`--tc-color-border-menu`) |
| **Border Radius** | 12px |
| **Box Shadow** | `0 8px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)` |
| **Z-Index** | 1000 (submenus: 1001) |
| **Menu Items** | 32px height, 12px horizontal padding |
| **Icons** | Unicode characters or inline SVGs |
| **Hover State** | #f8f8f8 background |
| **Active State** | #f0f0f0 background with checkmark indicator |
| **Group Dividers** | 1px #f0f0f0 line with 6px margin |
| **Animation** | Fade-in 0.15s ease-out (opacity 0→1, translateY -4px→0) |
| **Submenu Animation** | Slide-in 0.15s ease-out (opacity 0→1, translateX -4px→0) |

## Behavior

### Position & Viewport
- Menu automatically adjusts position to avoid viewport overflow
- Submenus flip to the left if they would overflow the right edge
- 8px padding from viewport edges

### Keyboard Navigation
- **Escape** — Close menu
- **Enter** — Apply filter or active action
- Tab navigation supported via native browser behavior

### Click Outside
- Clicking outside the menu closes it
- Callbacks receive updated state

### Submenus
- **Calculate** and **Change Type** have scrollable submenus
- Submenus slide in from the right
- Hover on trigger item to reveal submenu

## CSS Custom Properties

The component uses these token variables (all with fallbacks):

```css
--tc-color-bg-menu: #ffffff
--tc-color-border-menu: #f0f0f0
--tc-color-border-menu-divider: #f0f0f0
--tc-color-bg-menu-hover: #f8f8f8
--tc-color-bg-menu-active: #f0f0f0
--tc-color-text: #0a0a0a
--tc-color-text-muted: #a3a3a3
--tc-color-text-placeholder: #a3a3a3
--tc-color-border-input: #e5e5e5
--tc-color-border-input-focus: #0a0a0a
--tc-color-bg-input: #ffffff
--tc-menu-border-radius: 12px
--tc-menu-padding: 8px 0
--tc-menu-font-size: 13px
--tc-menu-shadow: 0 8px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)
```

## Usage Example

```svelte
<script lang="ts">
  import ColumnMenu from './ColumnMenu.svelte';
  import type { ResolvedColumn } from '@tablecraft/core';

  // State
  let menuVisible = $state(false);
  let menuPos = $state({ x: 0, y: 0 });
  let selectedColumn: ResolvedColumn | null = $state(null);
  let sortState = $state({ key: null, dir: null });
  let freezeState = $state({ key: null, side: null });

  // Handlers
  function openColumnMenu(col: ResolvedColumn, event: MouseEvent) {
    selectedColumn = col;
    menuPos = { x: event.clientX, y: event.clientY };
    menuVisible = true;
  }

  function handleSort(key: string, dir: 'asc' | 'desc') {
    sortState = { key, dir };
    console.log(`Sort ${key} ${dir}`);
  }

  function handleHide(key: string) {
    console.log(`Hide column ${key}`);
  }

  function handleFreeze(key: string, side: 'left' | 'right' | null) {
    freezeState = { key, side };
    console.log(`Freeze ${key} ${side}`);
  }
</script>

<!-- Column header with menu trigger -->
<button onclick={(e) => openColumnMenu(column, e)}>
  {column.label}
  <span class="menu-trigger">⋮</span>
</button>

<!-- The menu component -->
{#if selectedColumn}
  <ColumnMenu
    column={selectedColumn}
    position={menuPos}
    visible={menuVisible}
    {sortState}
    {freezeState}
    onsort={handleSort}
    onhide={handleHide}
    onfreeze={handleFreeze}
    onclose={() => (menuVisible = false)}
  />
{/if}
```

## Styling & Customization

### Colors
Override the CSS custom properties to match your design system:

```css
:root {
  --tc-color-bg-menu: #ffffff;
  --tc-color-text: #000000;
  --tc-color-border-menu: #e5e5e5;
}
```

### Border Radius
```css
:root {
  --tc-menu-border-radius: 8px; /* for more angular */
}
```

### Shadow
For a more pronounced shadow:
```css
:root {
  --tc-menu-shadow: 0 12px 40px rgba(0,0,0,0.12);
}
```

## Integration with Table Component

The ColumnMenu is designed to be integrated with the main Table component:

```svelte
<Table
  {data}
  {columns}
  oncolumnmenu={(col, pos) => openColumnMenu(col, pos)}
  {onSort}
  {onHide}
  {onFreeze}
  {onGroupBy}
  // ... other props
>
  <!-- ColumnMenu managed by Table parent -->
</Table>
```

## Accessibility

- **ARIA Roles:** `role="menu"` on menu containers, `role="menuitem"` on items
- **Keyboard Support:** Escape to close, Tab to navigate
- **Contrast:** All text meets WCAG AA standards (#0a0a0a on #ffffff = 14:1 ratio)
- **Focus Indicators:** Built-in focus-visible styling
- **No Nested Interactions:** All interactions are flat, no deep nesting

## Performance

- **Position Calculation:** O(1) viewport adjustment on mount
- **State Updates:** Minimal reactivity — only affected items re-render
- **DOM Size:** ~80 nodes (menu + submenus)
- **Animation:** GPU-accelerated transforms (translateY, translateX)
- **Event Delegation:** Efficient click-outside detection with cleanup

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Files

- **Component:** `/packages/svelte/src/lib/ColumnMenu.svelte`
- **Types:** Inline in component (Props interface)
- **Styles:** Scoped CSS with custom property tokens
- **No External Dependencies:** Uses only Svelte 5 runes and vanilla DOM APIs
