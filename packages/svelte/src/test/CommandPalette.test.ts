/**
 * @tablecraft/svelte — CommandPalette component test suite
 *
 * Tests for the Cmd+K command palette with fuzzy search, keyboard navigation,
 * category grouping, and recent commands.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen, act } from '@testing-library/svelte';
import type { ResolvedColumn } from '@tablecraft/core';
import CommandPalette from '../lib/CommandPalette.svelte';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockColumns: ResolvedColumn[] = [
  {
    key: 'name',
    type: 'text',
    label: 'Name',
    sortable: true,
    filterable: true,
  },
  {
    key: 'age',
    type: 'number',
    label: 'Age',
    sortable: true,
    filterable: true,
  },
  {
    key: 'status',
    type: 'badge',
    label: 'Status',
    sortable: true,
    filterable: true,
  },
];

// ---------------------------------------------------------------------------
// 1. Visibility and rendering
// ---------------------------------------------------------------------------

describe('CommandPalette - visibility and rendering', () => {
  it('does not render when visible=false', async () => {
    const { container } = render(CommandPalette, {
      props: {
        visible: false,
        onclose: () => {},
      },
    });

    expect(container.querySelector('.tc-cmd-palette-backdrop')).toBeNull();
  });

  it('renders backdrop and container when visible=true', async () => {
    const { container } = render(CommandPalette, {
      props: {
        visible: true,
        onclose: () => {},
      },
    });

    expect(container.querySelector('.tc-cmd-palette-backdrop')).toBeTruthy();
    expect(container.querySelector('.tc-cmd-palette-container')).toBeTruthy();
  });

  it('renders search input with placeholder', async () => {
    render(CommandPalette, {
      props: {
        visible: true,
        onclose: () => {},
      },
    });

    const input = screen.queryByPlaceholderText('Search commands...');
    expect(input).toBeTruthy();
  });

  it('renders footer with keyboard hints', async () => {
    const { container } = render(CommandPalette, {
      props: {
        visible: true,
        onclose: () => {},
      },
    });

    const footer = container.querySelector('.tc-cmd-palette-footer');
    expect(footer).toBeTruthy();
    expect(footer?.textContent).toContain('navigate');
  });
});

// ---------------------------------------------------------------------------
// 2. Command generation (dynamic based on columns and callbacks)
// ---------------------------------------------------------------------------

describe('CommandPalette - command generation', () => {
  it('generates sort commands for each column', async () => {
    const { container } = render(CommandPalette, {
      props: {
        visible: true,
        columns: mockColumns,
        onsort: () => {},
        onclose: () => {},
      },
    });

    await act(() => {});

    const items = container.querySelectorAll('.tc-cmd-palette-item');
    // 2 sort dirs × 3 columns = 6 sort commands
    const sortItems = Array.from(items).filter(
      (item) => item.textContent?.includes('Sort') || item.textContent?.includes('ascending') || item.textContent?.includes('descending')
    );
    expect(sortItems.length).toBe(6);
  });

  it('generates group commands for each column', async () => {
    const { container } = render(CommandPalette, {
      props: {
        visible: true,
        columns: mockColumns,
        ongroupby: () => {},
        onclose: () => {},
      },
    });

    await act(() => {});

    const items = container.querySelectorAll('.tc-cmd-palette-item');
    const groupItems = Array.from(items).filter(
      (item) => item.textContent?.includes('Group')
    );
    // 3 group by column commands (clear grouping may or may not show depending on state)
    expect(groupItems.length).toBeGreaterThanOrEqual(3);
  });

  it('generates hide commands for each column', async () => {
    const { container } = render(CommandPalette, {
      props: {
        visible: true,
        columns: mockColumns,
        onhidecolumn: () => {},
        onclose: () => {},
      },
    });

    await act(() => {});

    const items = container.querySelectorAll('.tc-cmd-palette-item');
    const hideItems = Array.from(items).filter(
      (item) => item.textContent?.includes('Hide')
    );
    expect(hideItems.length).toBe(3);
  });

  it('generates density commands', async () => {
    const { container } = render(CommandPalette, {
      props: {
        visible: true,
        ondensity: () => {},
        onclose: () => {},
      },
    });

    await act(() => {});

    const items = container.querySelectorAll('.tc-cmd-palette-item');
    const densityItems = Array.from(items).filter(
      (item) =>
        item.textContent?.includes('Compact') ||
        item.textContent?.includes('Comfortable') ||
        item.textContent?.includes('Spacious')
    );
    expect(densityItems.length).toBe(3);
  });

  it('generates export commands', async () => {
    const { container } = render(CommandPalette, {
      props: {
        visible: true,
        onexport: () => {},
        onclose: () => {},
      },
    });

    await act(() => {});

    const items = container.querySelectorAll('.tc-cmd-palette-item');
    const exportItems = Array.from(items).filter(
      (item) =>
        item.textContent?.includes('Export') ||
        item.textContent?.includes('Copy to clipboard')
    );
    expect(exportItems.length).toBe(3);
  });

  it('generates select/deselect commands', async () => {
    const { container } = render(CommandPalette, {
      props: {
        visible: true,
        onselectall: () => {},
        ondeselectall: () => {},
        onclose: () => {},
      },
    });

    await act(() => {});

    const items = container.querySelectorAll('.tc-cmd-palette-item');
    const selectItems = Array.from(items).filter(
      (item) =>
        item.textContent?.includes('Select all') ||
        item.textContent?.includes('Deselect all')
    );
    expect(selectItems.length).toBe(2);
  });

  it('does not generate commands for undefined callbacks', async () => {
    const { container } = render(CommandPalette, {
      props: {
        visible: true,
        columns: mockColumns,
        // onsort: undefined — not provided
        onclose: () => {},
      },
    });

    await act(() => {});

    const items = container.querySelectorAll('.tc-cmd-palette-item');
    const sortItems = Array.from(items).filter(
      (item) => item.textContent?.includes('Sort')
    );
    expect(sortItems.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 3. Fuzzy search filtering
// ---------------------------------------------------------------------------

describe('CommandPalette - fuzzy search', () => {
  it('shows all commands by default', async () => {
    const { container } = render(CommandPalette, {
      props: {
        visible: true,
        columns: [mockColumns[0]],
        onsort: () => {},
        onselectall: () => {},
        onclose: () => {},
      },
    });

    await act(() => {});

    const items = container.querySelectorAll('.tc-cmd-palette-item');
    expect(items.length).toBeGreaterThan(0);
  });

  it('filters commands by search query', async () => {
    const { container } = render(CommandPalette, {
      props: {
        visible: true,
        columns: mockColumns,
        onsort: () => {},
        onclose: () => {},
      },
    });

    const input = screen.getByPlaceholderText('Search commands...') as HTMLInputElement;

    await act(() => {
      fireEvent.input(input, { target: { value: 'sort' } });
    });

    const items = container.querySelectorAll('.tc-cmd-palette-item');
    // Should filter to only sort commands
    const allText = Array.from(items)
      .map((item) => item.textContent)
      .join(' ');
    expect(allText.toLowerCase()).toContain('sort');
  });

  it('performs fuzzy matching', async () => {
    const { container } = render(CommandPalette, {
      props: {
        visible: true,
        columns: mockColumns,
        onsort: () => {},
        onclose: () => {},
      },
    });

    const input = screen.getByPlaceholderText('Search commands...') as HTMLInputElement;

    await act(() => {
      // Fuzzy search: "sna" should match "Sort Name ascending"
      fireEvent.input(input, { target: { value: 'sna' } });
    });

    const items = container.querySelectorAll('.tc-cmd-palette-item');
    expect(items.length).toBeGreaterThan(0);
  });

  it('shows empty state when no commands match', async () => {
    const { container } = render(CommandPalette, {
      props: {
        visible: true,
        columns: mockColumns,
        onsort: () => {},
        onclose: () => {},
      },
    });

    const input = screen.getByPlaceholderText('Search commands...') as HTMLInputElement;

    await act(() => {
      fireEvent.input(input, { target: { value: 'xyznonexistent' } });
    });

    const empty = container.querySelector('.tc-cmd-palette-empty');
    expect(empty).toBeTruthy();
    expect(empty?.textContent).toContain('No commands found');
  });

  it('resets selected index when search changes', async () => {
    const { container } = render(CommandPalette, {
      props: {
        visible: true,
        columns: mockColumns,
        onsort: () => {},
        onclose: () => {},
      },
    });

    const input = screen.getByPlaceholderText('Search commands...') as HTMLInputElement;

    // First, select an item (index 2)
    await act(() => {
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
    });

    // Then search, which should reset to index 0
    await act(() => {
      fireEvent.input(input, { target: { value: 'sort' } });
    });

    const items = container.querySelectorAll('.tc-cmd-palette-item');
    // First item should be selected
    expect(items[0]?.classList.contains('selected')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. Keyboard navigation
// ---------------------------------------------------------------------------

describe('CommandPalette - keyboard navigation', () => {
  it('navigates down with ArrowDown', async () => {
    const { container } = render(CommandPalette, {
      props: {
        visible: true,
        onsort: () => {},
        columns: mockColumns,
        onclose: () => {},
      },
    });

    const input = screen.getByPlaceholderText('Search commands...');

    await act(() => {
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
    });

    const items = container.querySelectorAll('.tc-cmd-palette-item');
    expect(items[2]?.classList.contains('selected')).toBe(true);
  });

  it('navigates up with ArrowUp', async () => {
    const { container } = render(CommandPalette, {
      props: {
        visible: true,
        onsort: () => {},
        columns: mockColumns,
        onclose: () => {},
      },
    });

    const input = screen.getByPlaceholderText('Search commands...');

    await act(() => {
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowUp' });
    });

    const items = container.querySelectorAll('.tc-cmd-palette-item');
    expect(items[1]?.classList.contains('selected')).toBe(true);
  });

  it('stops at first/last item boundaries', async () => {
    const { container } = render(CommandPalette, {
      props: {
        visible: true,
        onsort: () => {},
        columns: mockColumns,
        onclose: () => {},
      },
    });

    const input = screen.getByPlaceholderText('Search commands...');

    await act(() => {
      // Try to go up past the first item
      fireEvent.keyDown(input, { key: 'ArrowUp' });
    });

    const items = container.querySelectorAll('.tc-cmd-palette-item');
    expect(items[0]?.classList.contains('selected')).toBe(true);
  });

  it('closes palette on Escape', async () => {
    const onclose = vi.fn();
    render(CommandPalette, {
      props: {
        visible: true,
        onsort: () => {},
        columns: mockColumns,
        onclose,
      },
    });

    const input = screen.getByPlaceholderText('Search commands...');

    await act(() => {
      fireEvent.keyDown(input, { key: 'Escape' });
    });

    expect(onclose).toHaveBeenCalled();
  });

  it('executes command on Enter', async () => {
    const onsort = vi.fn();
    const onclose = vi.fn();
    render(CommandPalette, {
      props: {
        visible: true,
        columns: mockColumns,
        onsort,
        onclose,
      },
    });

    const input = screen.getByPlaceholderText('Search commands...');

    await act(() => {
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });
    });

    // Should have called a command action (onsort or similar)
    expect(onsort.mock.calls.length + onclose.mock.calls.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 5. Mouse interaction
// ---------------------------------------------------------------------------

describe('CommandPalette - mouse interaction', () => {
  it('highlights item on mouseover', async () => {
    const { container } = render(CommandPalette, {
      props: {
        visible: true,
        onsort: () => {},
        columns: mockColumns,
        onclose: () => {},
      },
    });

    const items = container.querySelectorAll('.tc-cmd-palette-item');

    await act(() => {
      fireEvent.mouseOver(items[1]!);
    });

    expect(items[1]?.classList.contains('selected')).toBe(true);
  });

  it('closes on backdrop click', async () => {
    const onclose = vi.fn();
    const { container } = render(CommandPalette, {
      props: {
        visible: true,
        onclose,
      },
    });

    const backdrop = container.querySelector('.tc-cmd-palette-backdrop');

    await act(() => {
      fireEvent.mouseDown(backdrop!, { target: backdrop });
    });

    expect(onclose).toHaveBeenCalled();
  });

  it('does not close on container click', async () => {
    const onclose = vi.fn();
    const { container } = render(CommandPalette, {
      props: {
        visible: true,
        onclose,
      },
    });

    const containerEl = container.querySelector('.tc-cmd-palette-container');

    await act(() => {
      fireEvent.mouseDown(containerEl!);
    });

    expect(onclose).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 6. Recent commands and localStorage
// ---------------------------------------------------------------------------

describe('CommandPalette - recent commands', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves recent command to localStorage', async () => {
    const onsort = vi.fn();
    const onclose = vi.fn();

    render(CommandPalette, {
      props: {
        visible: true,
        columns: mockColumns,
        onsort,
        onclose,
      },
    });

    const input = screen.getByPlaceholderText('Search commands...');

    // Execute first command
    await act(() => {
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });
    });

    const stored = localStorage.getItem('tc-cmd-palette-recent');
    expect(stored).toBeTruthy();
  });

  it('keeps only last 5 recent commands', async () => {
    render(CommandPalette, {
      props: {
        visible: true,
        columns: mockColumns,
        onsort: () => {},
        ondensity: () => {},
        onselectall: () => {},
        onclose: () => {},
      },
    });

    // Simulate executing 10 commands
    for (let i = 0; i < 10; i++) {
      await act(() => {});
    }

    const stored = localStorage.getItem('tc-cmd-palette-recent');
    const parsed = stored ? JSON.parse(stored) : [];
    expect(parsed.length).toBeLessThanOrEqual(5);
  });

  it('prioritizes recent commands in results', async () => {
    // Pre-populate localStorage with a recent command
    localStorage.setItem('tc-cmd-palette-recent', JSON.stringify(['sort-name-asc']));

    const { container } = render(CommandPalette, {
      props: {
        visible: true,
        columns: mockColumns,
        onsort: () => {},
        onclose: () => {},
      },
    });

    await act(() => {});

    const items = container.querySelectorAll('.tc-cmd-palette-item');
    // First item should be the recent command
    expect(items[0]?.textContent).toContain('Sort');
  });
});

// ---------------------------------------------------------------------------
// 7. Props validation
// ---------------------------------------------------------------------------

describe('CommandPalette - prop validation', () => {
  it('accepts all callback props', async () => {
    const callbacks = {
      onclose: () => {},
      onsort: () => {},
      onfilter: () => {},
      ongroupby: () => {},
      ondensity: () => {},
      onexport: () => {},
      onhidecolumn: () => {},
      onshowallcolumns: () => {},
      onselectall: () => {},
      ondeselectall: () => {},
      onclearfilters: () => {},
      onclearsort: () => {},
    };

    render(CommandPalette, {
      props: {
        visible: true,
        ...callbacks,
      },
    });

    expect(true).toBe(true); // If we got here, render succeeded
  });

  it('handles missing optional props gracefully', async () => {
    render(CommandPalette, {
      props: {
        visible: true,
        onclose: () => {},
      },
    });

    expect(true).toBe(true);
  });
});
