/**
 * @tablecraft/svelte — History manager (undo/redo)
 * Reactive undo/redo system using Svelte 5 runes.
 *
 * Each history entry stores a unique ID, timestamp, action type, and paired undo/redo
 * closures that can reverse or re-apply any table modification.
 *
 * Keyboard shortcuts:
 * - Cmd+Z (Mac) / Ctrl+Z (Windows/Linux): undo
 * - Cmd+Shift+Z (Mac) / Ctrl+Shift+Z (Windows/Linux): redo
 */

import { tick } from 'svelte';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  type: 'cell-edit' | 'sort' | 'filter' | 'column-hide' | 'column-reorder' | 'row-delete' | 'bulk-edit';
  description: string; // human-readable: "Changed 'Alice' to 'Bob' in Name column"
  undo: () => void | Promise<void>;
  redo: () => void | Promise<void>;
}

export interface HistoryManager {
  readonly entries: HistoryEntry[];
  readonly position: number;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly current: HistoryEntry | null;

  push(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): void;
  undo(): Promise<void>;
  redo(): Promise<void>;
  clear(): void;
}

/**
 * Create a reactive history manager for time-travel undo/redo.
 *
 * @param maxEntries - Maximum history stack size (default: 50)
 * @returns Reactive history manager with push/undo/redo methods
 *
 * @example
 * const history = createHistoryManager(50);
 *
 * history.push({
 *   type: 'cell-edit',
 *   description: "Changed price from $10 to $20",
 *   undo: () => { row.price = 10; },
 *   redo: () => { row.price = 20; },
 * });
 *
 * await history.undo();  // Revert to previous state
 * await history.redo();  // Re-apply the action
 */
export function createHistoryManager(maxEntries = 50): HistoryManager {
  let entries = $state<HistoryEntry[]>([]);
  let position = $state(-1); // -1 = no history

  return {
    get entries() {
      return entries;
    },

    get position() {
      return position;
    },

    get canUndo() {
      return position >= 0;
    },

    get canRedo() {
      return position < entries.length - 1;
    },

    get current() {
      return position >= 0 ? entries[position] : null;
    },

    /**
     * Push a new action onto the history stack.
     *
     * If we're in the middle of history (position < entries.length - 1),
     * truncate all future entries before pushing the new one.
     *
     * @param entry - The action to record (without id/timestamp)
     */
    push(entry: Omit<HistoryEntry, 'id' | 'timestamp'>) {
      // Truncate future entries if we're not at the top of the stack
      if (position < entries.length - 1) {
        entries = entries.slice(0, position + 1);
      }

      // Create the new history entry with generated id and timestamp
      const newEntry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        timestamp: Date.now(),
        ...entry,
      };

      // Push onto stack
      entries = [...entries, newEntry];

      // Maintain max size by dropping oldest entries
      if (entries.length > maxEntries) {
        entries = entries.slice(-maxEntries);
      }

      // Move position to the new entry
      position = entries.length - 1;
    },

    /**
     * Undo the current action and move back one step.
     * No-op if canUndo is false.
     */
    async undo() {
      if (!this.canUndo) return;

      const entry = entries[position];
      if (!entry) return;

      // Call the undo function
      const result = entry.undo();
      if (result instanceof Promise) {
        await result;
      }

      // Allow Svelte reactivity to settle
      await tick();

      // Move position backward
      position = Math.max(-1, position - 1);
    },

    /**
     * Redo the next action and move forward one step.
     * No-op if canRedo is false.
     */
    async redo() {
      if (!this.canRedo) return;

      // Move position forward first
      position = Math.min(entries.length - 1, position + 1);

      const entry = entries[position];
      if (!entry) return;

      // Call the redo function
      const result = entry.redo();
      if (result instanceof Promise) {
        await result;
      }

      // Allow Svelte reactivity to settle
      await tick();
    },

    /**
     * Clear all history entries and reset position.
     */
    clear() {
      entries = [];
      position = -1;
    },
  };
}

/**
 * Bind keyboard shortcuts for undo/redo.
 * Call this in a $effect in your component to enable global shortcuts.
 *
 * @param history - The history manager instance
 * @param element - Optional DOM element to attach listener to (default: document)
 *
 * @example
 * $effect(() => {
 *   bindHistoryShortcuts(history);
 *   return () => unbindHistoryShortcuts(history);
 * });
 */
export function bindHistoryShortcuts(
  history: HistoryManager,
  element?: Document | HTMLElement | null,
) {
  // Explicit null means "no element" — don't fall back to document
  if (element === null) return;
  const el = element ?? (typeof document !== 'undefined' ? document : undefined);
  if (!el) return;

  const handleKeyDown = (e: Event) => {
    if (!(e instanceof KeyboardEvent)) return;
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

    // Cmd+Z / Ctrl+Z = undo
    if (isCtrlOrCmd && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      history.undo().catch(() => {});
      return;
    }

    // Cmd+Shift+Z / Ctrl+Shift+Z = redo
    if (isCtrlOrCmd && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      history.redo().catch(() => {});
      return;
    }

    // Also support Ctrl+Y / Cmd+Y as alternate redo
    if (isCtrlOrCmd && e.key === 'y') {
      e.preventDefault();
      history.redo().catch(() => {});
      return;
    }
  };

  el.addEventListener('keydown', handleKeyDown);

  return () => {
    el.removeEventListener('keydown', handleKeyDown);
  };
}
