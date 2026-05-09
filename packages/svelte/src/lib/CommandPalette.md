# CommandPalette Component

A Linear/Notion/Raycast-style command palette for @tablecraft/svelte with fuzzy search, keyboard navigation, and dynamic commands.

## Features

- **Cmd+K / Ctrl+K trigger** — Global keyboard shortcut
- **Fuzzy search** — Fast, instant filtering with no special syntax
- **Dynamic commands** — Auto-populated from columns and callbacks
- **Category grouping** — Sort, Filter, Group, View, Density, Export, Navigate, Select, Edit
- **Keyboard navigation** — Arrow up/down, Enter to execute, Escape to close
- **Recent commands** — Persists last 5 used commands to localStorage
- **Smooth animations** — Fade-in backdrop, slide-down container
- **Responsive design** — Works on mobile with adjusted sizing

## Usage

```svelte
<script>
  import { CommandPalette } from '@tablecraft/svelte';

  let paletteVisible = false;

  function handleSort(key: string, dir: 'asc' | 'desc') {
    // Handle sort
  }

  function handleDensity(density: 'compact' | 'comfortable' | 'spacious') {
    // Handle density change
  }
</script>

<CommandPalette
  visible={paletteVisible}
  columns={resolvedColumns}
  onclose={() => (paletteVisible = false)}
  onsort={handleSort}
  ondensity={handleDensity}
  onexport={(format) => {
    // Handle export
  }}
  onselectall={selectAll}
  ondeselectall={deselectAll}
/>
```

## Props

### `visible: boolean` (required)
Controls whether the palette is shown.

### `onclose: () => void` (required)
Called when palette should close (Escape pressed or backdrop clicked).

### `columns?: ResolvedColumn[]`
Column definitions. Used to generate sort, group, and hide commands.

### Optional Callbacks
- `onsort?: (key: string, dir: 'asc' | 'desc') => void`
- `onfilter?: (query: string) => void`
- `ongroupby?: (key: string | null) => void`
- `ondensity?: (density: 'compact' | 'comfortable' | 'spacious') => void`
- `onexport?: (format: 'csv' | 'json' | 'clipboard') => void`
- `onhidecolumn?: (key: string) => void`
- `onshowallcolumns?: () => void`
- `onselectall?: () => void`
- `ondeselectall?: () => void`
- `onclearfilters?: () => void`
- `onclearsort?: () => void`

Each callback is optional. Commands are only generated for callbacks that are provided.

## Command Categories

### Sort (if `onsort` provided)
- `Sort [column] ascending`
- `Sort [column] descending`

### Filter (if `onfilter` or `onclearfilters` provided)
- `Open filter`
- `Clear all filters`

### Group (if `ongroupby` provided)
- `Group by [column]`
- `Clear grouping`

### View (if `onhidecolumn` or `onshowallcolumns` provided)
- `Hide [column]`
- `Show all columns`

### Density (if `ondensity` provided)
- `Compact view`
- `Comfortable view`
- `Spacious view`

### Export (if `onexport` provided)
- `Export as CSV`
- `Export as JSON`
- `Copy to clipboard`

### Select (if `onselectall` or `ondeselectall` provided)
- `Select all`
- `Deselect all`

### Edit (if `onclearsort` provided)
- `Clear sort`

## Keyboard Shortcuts

| Key       | Action                    |
|-----------|---------------------------|
| Cmd+K     | Open palette (on Mac)     |
| Ctrl+K    | Open palette (on Windows) |
| ↑/↓       | Navigate commands         |
| ↵         | Execute selected command  |
| Esc       | Close palette             |

## Recent Commands

The palette automatically tracks the last 5 executed commands in localStorage under the key `tc-cmd-palette-recent`. Recent commands appear first in search results.

## Styling

The component uses CSS custom properties (--tc-*) for theming:

```css
--tc-color-background   /* Default: #ffffff */
--tc-color-text         /* Default: #0a0a0a */
--tc-color-text-muted   /* Default: #a3a3a3 */
--tc-border-color       /* Default: 1px solid #f0f0f0 */
--tc-font-size          /* Default: 13px */
--tc-spacing            /* Default: 12px */
```

## Design Principles

- **Clean, minimal UI** — No clutter, maximum signal
- **Fast search** — Fuzzy matching with no lag
- **Keyboard-first** — Mouse optional, fully keyboard navigable
- **Appearance** — Linear/Notion aesthetic with subtle shadows and smooth animations
- **Accessibility** — Full ARIA support (role=dialog, aria-modal, aria-selected, etc.)

## Implementation Notes

- Component is Svelte 5 runes-only ($state, $derived, $effect)
- Uses CSS custom properties exclusively (no Tailwind)
- Integrates with @tablecraft/core types (ResolvedColumn)
- localStorage access is guarded for SSR environments
- Animations use pure CSS, no transition directives
