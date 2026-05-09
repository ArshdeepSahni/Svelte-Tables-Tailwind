/**
 * @tablecraft/svelte — History manager tests
 * Comprehensive test suite for undo/redo time travel functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createHistoryManager, bindHistoryShortcuts } from '../lib/history.svelte.js';

describe('History Manager', () => {
  describe('createHistoryManager', () => {
    it('should initialize with empty state', () => {
      const history = createHistoryManager();
      expect(history.entries).toHaveLength(0);
      expect(history.position).toBe(-1);
      expect(history.canUndo).toBe(false);
      expect(history.canRedo).toBe(false);
      expect(history.current).toBeNull();
    });

    it('should push a new entry and update position', () => {
      const history = createHistoryManager();
      let value = 'Alice';

      history.push({
        type: 'cell-edit',
        description: "Changed name to 'Alice'",
        undo: () => {
          value = '';
        },
        redo: () => {
          value = 'Alice';
        },
      });

      expect(history.entries).toHaveLength(1);
      expect(history.position).toBe(0);
      expect(history.canUndo).toBe(true);
      expect(history.canRedo).toBe(false);
      expect(history.current?.description).toContain('Alice');
    });

    it('should generate unique IDs and timestamps', () => {
      const history = createHistoryManager();
      const now = Date.now();

      history.push({
        type: 'cell-edit',
        description: 'Change 1',
        undo: () => {},
        redo: () => {},
      });

      history.push({
        type: 'cell-edit',
        description: 'Change 2',
        undo: () => {},
        redo: () => {},
      });

      expect(history.entries[0].id).not.toBe(history.entries[1].id);
      expect(history.entries[0].timestamp).toBeGreaterThanOrEqual(now);
      expect(history.entries[1].timestamp).toBeGreaterThanOrEqual(history.entries[0].timestamp);
    });
  });

  describe('undo/redo mechanics', () => {
    it('should undo to previous state', async () => {
      const history = createHistoryManager();
      let value = 'initial';

      history.push({
        type: 'cell-edit',
        description: 'Change to Alice',
        undo: () => {
          value = 'initial';
        },
        redo: () => {
          value = 'Alice';
        },
      });

      // Apply the redo to simulate the action
      value = 'Alice';
      expect(value).toBe('Alice');

      // Now undo
      await history.undo();
      expect(value).toBe('initial');
      expect(history.position).toBe(-1);
    });

    it('should redo after undo', async () => {
      const history = createHistoryManager();
      let value = 'initial';

      history.push({
        type: 'cell-edit',
        description: 'Change to Alice',
        undo: () => {
          value = 'initial';
        },
        redo: () => {
          value = 'Alice';
        },
      });

      value = 'Alice';
      await history.undo();
      expect(value).toBe('initial');

      await history.redo();
      expect(value).toBe('Alice');
      expect(history.position).toBe(0);
    });

    it('should support multiple undo/redo cycles', async () => {
      const history = createHistoryManager();
      let value = 'start';

      history.push({
        type: 'cell-edit',
        description: 'Step 1',
        undo: () => {
          value = 'start';
        },
        redo: () => {
          value = 'step1';
        },
      });

      history.push({
        type: 'cell-edit',
        description: 'Step 2',
        undo: () => {
          value = 'step1';
        },
        redo: () => {
          value = 'step2';
        },
      });

      value = 'step1';
      value = 'step2';

      // Undo twice
      await history.undo();
      expect(value).toBe('step1');
      await history.undo();
      expect(value).toBe('start');

      // Redo twice
      await history.redo();
      expect(value).toBe('step1');
      await history.redo();
      expect(value).toBe('step2');
    });

    it('should truncate future entries when pushing after undo', async () => {
      const history = createHistoryManager();

      // Add 3 entries
      for (let i = 0; i < 3; i++) {
        history.push({
          type: 'cell-edit',
          description: `Entry ${i}`,
          undo: () => {},
          redo: () => {},
        });
      }

      expect(history.entries).toHaveLength(3);

      // Undo twice
      await history.undo();
      await history.undo();
      expect(history.position).toBe(0);

      // Push a new entry — should truncate entries 1 and 2
      history.push({
        type: 'cell-edit',
        description: 'New branch',
        undo: () => {},
        redo: () => {},
      });

      expect(history.entries).toHaveLength(2);
      expect(history.entries[1].description).toBe('New branch');
      expect(history.position).toBe(1);
    });

    it('should respect maxEntries limit', () => {
      const history = createHistoryManager(5); // max 5 entries

      for (let i = 0; i < 10; i++) {
        history.push({
          type: 'cell-edit',
          description: `Entry ${i}`,
          undo: () => {},
          redo: () => {},
        });
      }

      expect(history.entries).toHaveLength(5);
      // Should keep the last 5 entries (5-9)
      expect(history.entries[0].description).toContain('Entry 5');
      expect(history.entries[4].description).toContain('Entry 9');
    });

    it('should not undo when canUndo is false', async () => {
      const history = createHistoryManager();
      const undoSpy = vi.fn();

      // Try to undo with empty history
      await history.undo();
      expect(history.position).toBe(-1);
      expect(undoSpy).not.toHaveBeenCalled();
    });

    it('should not redo when canRedo is false', async () => {
      const history = createHistoryManager();
      const redoSpy = vi.fn();

      history.push({
        type: 'cell-edit',
        description: 'Entry',
        undo: redoSpy,
        redo: redoSpy,
      });

      // Try to redo at top of stack
      await history.redo();
      expect(history.position).toBe(0);
    });
  });

  describe('bulk edit actions', () => {
    it('should support bulk-edit type with multiple rows', async () => {
      const history = createHistoryManager();
      const rows = [
        { id: 1, name: 'Alice', status: 'active' },
        { id: 2, name: 'Bob', status: 'active' },
        { id: 3, name: 'Charlie', status: 'active' },
      ];

      const originalStatus = rows.map((r) => r.status);

      history.push({
        type: 'bulk-edit',
        description: 'Changed 3 rows status to inactive',
        undo: () => {
          rows.forEach((r, i) => {
            r.status = originalStatus[i];
          });
        },
        redo: () => {
          rows.forEach((r) => {
            r.status = 'inactive';
          });
        },
      });

      // Apply redo
      rows.forEach((r) => {
        r.status = 'inactive';
      });

      await history.undo();
      expect(rows.every((r) => r.status === 'active')).toBe(true);

      await history.redo();
      expect(rows.every((r) => r.status === 'inactive')).toBe(true);
    });
  });

  describe('async undo/redo', () => {
    it('should handle async undo operations', async () => {
      const history = createHistoryManager();
      let value = 'initial';

      history.push({
        type: 'cell-edit',
        description: 'Async change',
        undo: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          value = 'initial';
        },
        redo: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          value = 'changed';
        },
      });

      value = 'changed';
      await history.undo();
      expect(value).toBe('initial');

      await history.redo();
      expect(value).toBe('changed');
    });
  });

  describe('clear', () => {
    it('should clear all entries and reset position', () => {
      const history = createHistoryManager();

      history.push({
        type: 'cell-edit',
        description: 'Entry 1',
        undo: () => {},
        redo: () => {},
      });

      history.push({
        type: 'cell-edit',
        description: 'Entry 2',
        undo: () => {},
        redo: () => {},
      });

      expect(history.entries).toHaveLength(2);

      history.clear();
      expect(history.entries).toHaveLength(0);
      expect(history.position).toBe(-1);
      expect(history.canUndo).toBe(false);
      expect(history.canRedo).toBe(false);
    });
  });

  describe('entry types and descriptions', () => {
    it('should support all action types', () => {
      const history = createHistoryManager();
      const types: Array<'cell-edit' | 'sort' | 'filter' | 'column-hide' | 'column-reorder' | 'row-delete' | 'bulk-edit'> = [
        'cell-edit',
        'sort',
        'filter',
        'column-hide',
        'column-reorder',
        'row-delete',
        'bulk-edit',
      ];

      types.forEach((type) => {
        history.push({
          type,
          description: `Action: ${type}`,
          undo: () => {},
          redo: () => {},
        });
      });

      expect(history.entries).toHaveLength(types.length);
      types.forEach((type, i) => {
        expect(history.entries[i].type).toBe(type);
      });
    });

    it('should preserve human-readable descriptions', () => {
      const history = createHistoryManager();
      const descriptions = [
        "Changed 'Alice' to 'Bob' in Name column",
        'Sorted by Price (ascending)',
        "Applied filter: Status = 'active'",
      ];

      descriptions.forEach((desc) => {
        history.push({
          type: 'cell-edit',
          description: desc,
          undo: () => {},
          redo: () => {},
        });
      });

      descriptions.forEach((desc, i) => {
        expect(history.entries[i].description).toBe(desc);
      });
    });
  });

  describe('reactive state', () => {
    it('should track canUndo and canRedo state changes', async () => {
      const history = createHistoryManager();

      expect(history.canUndo).toBe(false);
      expect(history.canRedo).toBe(false);

      history.push({
        type: 'cell-edit',
        description: 'Change',
        undo: () => {},
        redo: () => {},
      });

      expect(history.canUndo).toBe(true);
      expect(history.canRedo).toBe(false);

      await history.undo();

      expect(history.canUndo).toBe(false);
      expect(history.canRedo).toBe(true);

      await history.redo();

      expect(history.canUndo).toBe(true);
      expect(history.canRedo).toBe(false);
    });

    it('should update current entry reference', async () => {
      const history = createHistoryManager();

      expect(history.current).toBeNull();

      history.push({
        type: 'cell-edit',
        description: 'First',
        undo: () => {},
        redo: () => {},
      });

      expect(history.current?.description).toBe('First');

      history.push({
        type: 'cell-edit',
        description: 'Second',
        undo: () => {},
        redo: () => {},
      });

      expect(history.current?.description).toBe('Second');

      await history.undo();
      expect(history.current?.description).toBe('First');

      await history.undo();
      expect(history.current).toBeNull();
    });
  });
});

describe('bindHistoryShortcuts', () => {
  it('should register keyboard event listener', () => {
    const history = createHistoryManager();
    const mockElement = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    const unbind = bindHistoryShortcuts(history, mockElement as any);

    expect(mockElement.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));

    unbind?.();
    expect(mockElement.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should handle null element gracefully', () => {
    const history = createHistoryManager();
    const unbind = bindHistoryShortcuts(history, null as any);
    expect(unbind).toBeUndefined();
  });
});
