/**
 * @tablecraft/svelte — Excel-Style 2D Range Selection
 *
 * Reactive selection state manager using Svelte 5 runes.
 * Supports single-cell, multi-cell ranges, keyboard navigation, and multi-select.
 * Handles shift-extend, cmd/ctrl-click for additional ranges, and arrow key navigation.
 *
 * Design: Google Sheets-like selection with smooth, responsive visual feedback.
 */

import type { Row } from './types.js';

// ─── Types ─────────────────────────────────────────────────────────

export interface CellPosition {
  row: number;
  col: number;
}

export interface SelectionRange {
  start: CellPosition;
  end: CellPosition;
}

export interface SelectedCell {
  row: number;
  col: number;
  value: unknown;
  rowData: Row;
}

export interface SelectionState {
  // Current active cell (cursor)
  activeCell: CellPosition | null;
  // Selection range (can be multi-cell)
  range: SelectionRange | null;
  // Is user currently dragging to select?
  isDragging: boolean;
  // Multiple non-contiguous selections (Cmd+click)
  additionalRanges: SelectionRange[];
}

export interface SelectionManager {
  // Reactive state
  state: SelectionState;
  // Methods
  startSelection(row: number, col: number, event: MouseEvent | KeyboardEvent): void;
  extendSelection(row: number, col: number): void;
  endSelection(): void;
  moveActive(direction: 'up' | 'down' | 'left' | 'right', extend: boolean): void;
  selectAll(rowCount: number, colCount: number): void;
  selectColumn(colIndex: number, rowCount: number): void;
  selectRow(rowIndex: number, colCount: number): void;
  isInSelection(row: number, col: number): boolean;
  getSelectedCells(data: Row[], columns: string[]): SelectedCell[][];
  clearSelection(): void;
  // Utilities
  hasSelection(): boolean;
  getCellCount(): number;
}

// ─── CSS Styles ────────────────────────────────────────────────────

export const selectionStyles = `
  /* Selected cell background */
  [data-selected="true"] {
    background-color: rgba(59, 130, 246, 0.08);
  }

  /* Active cell (current cursor) border */
  [data-active-cell="true"] {
    outline: 2px solid #3b82f6;
    outline-offset: -2px;
  }

  /* Selection range outer border */
  [data-selection-start="true"] {
    border-top: 2px solid rgba(59, 130, 246, 0.6);
    border-left: 2px solid rgba(59, 130, 246, 0.6);
  }

  [data-selection-end="true"] {
    border-bottom: 2px solid rgba(59, 130, 246, 0.6);
    border-right: 2px solid rgba(59, 130, 246, 0.6);
  }

  [data-selection-top="true"] {
    border-top: 2px solid rgba(59, 130, 246, 0.6);
  }

  [data-selection-bottom="true"] {
    border-bottom: 2px solid rgba(59, 130, 246, 0.6);
  }

  [data-selection-left="true"] {
    border-left: 2px solid rgba(59, 130, 246, 0.6);
  }

  [data-selection-right="true"] {
    border-right: 2px solid rgba(59, 130, 246, 0.6);
  }

  /* Dragging cursor */
  [data-dragging="true"] {
    cursor: crosshair;
  }

  /* Additional non-contiguous selection */
  [data-additional-selection="true"] {
    background-color: rgba(79, 172, 254, 0.12);
  }
`;

// ─── Helper functions ──────────────────────────────────────────────

/**
 * Normalize a range so start is always before end
 */
function normalizeRange(range: SelectionRange): SelectionRange {
  const { start, end } = range;
  const startRow = Math.min(start.row, end.row);
  const endRow = Math.max(start.row, end.row);
  const startCol = Math.min(start.col, end.col);
  const endCol = Math.max(start.col, end.col);

  return {
    start: { row: startRow, col: startCol },
    end: { row: endRow, col: endCol },
  };
}

/**
 * Check if a cell is within a range (after normalization)
 */
function cellInRange(cell: CellPosition, range: SelectionRange): boolean {
  const norm = normalizeRange(range);
  return (
    cell.row >= norm.start.row &&
    cell.row <= norm.end.row &&
    cell.col >= norm.start.col &&
    cell.col <= norm.end.col
  );
}

/**
 * Check if position is on the edge of a range (for border rendering)
 */
function isRangeEdge(
  cell: CellPosition,
  range: SelectionRange,
  edge: 'top' | 'bottom' | 'left' | 'right',
): boolean {
  const norm = normalizeRange(range);
  switch (edge) {
    case 'top':
      return cell.row === norm.start.row && cellInRange(cell, range);
    case 'bottom':
      return cell.row === norm.end.row && cellInRange(cell, range);
    case 'left':
      return cell.col === norm.start.col && cellInRange(cell, range);
    case 'right':
      return cell.col === norm.end.col && cellInRange(cell, range);
  }
}

// ─── Selection Manager Factory ─────────────────────────────────────

export function createSelectionManager(): SelectionManager {
  // Reactive state
  let state = $state<SelectionState>({
    activeCell: null,
    range: null,
    isDragging: false,
    additionalRanges: [],
  });

  // Temporary state during drag
  let dragStart: CellPosition | null = null;

  // ─── Public API ────────────────────────────────────────────────

  function startSelection(row: number, col: number, event: MouseEvent | KeyboardEvent): void {
    const isShift = event.shiftKey;
    const isCmd = event.ctrlKey || (event as any).metaKey;

    const newCell = { row, col };

    if (isShift && state.activeCell) {
      // Shift: extend from active cell to new cell
      state.range = {
        start: state.activeCell,
        end: newCell,
      };
    } else if (isCmd && state.range) {
      // Cmd/Ctrl: add another range to additionalRanges
      state.additionalRanges = [...state.additionalRanges, state.range];
      state.range = null;
      state.activeCell = newCell;
    } else {
      // Normal click: new selection
      state.activeCell = newCell;
      state.range = null;
      state.additionalRanges = [];
    }

    // Start drag tracking
    dragStart = newCell;
    state.isDragging = true;
  }

  function extendSelection(row: number, col: number): void {
    if (!dragStart) return;

    state.range = {
      start: dragStart,
      end: { row, col },
    };
  }

  function endSelection(): void {
    state.isDragging = false;
    dragStart = null;
  }

  function moveActive(direction: 'up' | 'down' | 'left' | 'right', extend: boolean): void {
    if (!state.activeCell) return;

    const { row, col } = state.activeCell;
    let newCell: CellPosition | null = null;

    switch (direction) {
      case 'up':
        newCell = row > 0 ? { row: row - 1, col } : null;
        break;
      case 'down':
        newCell = { row: row + 1, col };
        break;
      case 'left':
        newCell = col > 0 ? { row, col: col - 1 } : null;
        break;
      case 'right':
        newCell = { row, col: col + 1 };
        break;
    }

    if (!newCell) return;

    if (extend) {
      // Shift+arrow: extend range
      if (!state.range) {
        state.range = { start: state.activeCell, end: newCell };
      } else {
        // Extend existing range
        state.range.end = newCell;
      }
    } else {
      // Normal arrow: new selection
      state.activeCell = newCell;
      state.range = null;
      state.additionalRanges = [];
    }
  }

  function selectAll(rowCount: number, colCount: number): void {
    state.activeCell = { row: 0, col: 0 };
    state.range = {
      start: { row: 0, col: 0 },
      end: { row: rowCount - 1, col: colCount - 1 },
    };
    state.additionalRanges = [];
  }

  function selectColumn(colIndex: number, rowCount: number): void {
    state.activeCell = { row: 0, col: colIndex };
    state.range = {
      start: { row: 0, col: colIndex },
      end: { row: rowCount - 1, col: colIndex },
    };
    state.additionalRanges = [];
  }

  function selectRow(rowIndex: number, colCount: number): void {
    state.activeCell = { row: rowIndex, col: 0 };
    state.range = {
      start: { row: rowIndex, col: 0 },
      end: { row: rowIndex, col: colCount - 1 },
    };
    state.additionalRanges = [];
  }

  function isInSelection(row: number, col: number): boolean {
    const cell = { row, col };

    // Check if in main range
    if (state.range && cellInRange(cell, state.range)) {
      return true;
    }

    // Check if in additional ranges
    return state.additionalRanges.some(range => cellInRange(cell, range));
  }

  function getSelectedCells(data: Row[], columns: string[]): SelectedCell[][] {
    const result: SelectedCell[][] = [];

    const addRangeCells = (range: SelectionRange) => {
      const norm = normalizeRange(range);
      for (let r = norm.start.row; r <= norm.end.row; r++) {
        const rowCells: SelectedCell[] = [];
        for (let c = norm.start.col; c <= norm.end.col; c++) {
          const rowData = data[r];
          if (rowData && columns[c]) {
            const value = rowData[columns[c]];
            rowCells.push({
              row: r,
              col: c,
              value,
              rowData,
            });
          }
        }
        if (rowCells.length > 0) {
          result.push(rowCells);
        }
      }
    };

    // Add cells from main range
    if (state.range) {
      addRangeCells(state.range);
    }

    // Add cells from additional ranges
    for (const range of state.additionalRanges) {
      addRangeCells(range);
    }

    return result;
  }

  function clearSelection(): void {
    state.activeCell = null;
    state.range = null;
    state.additionalRanges = [];
    state.isDragging = false;
    dragStart = null;
  }

  function hasSelection(): boolean {
    return state.activeCell !== null || state.range !== null || state.additionalRanges.length > 0;
  }

  function getCellCount(): number {
    let count = 0;

    const countRange = (range: SelectionRange) => {
      const norm = normalizeRange(range);
      const rows = norm.end.row - norm.start.row + 1;
      const cols = norm.end.col - norm.start.col + 1;
      return rows * cols;
    };

    if (state.range) {
      count += countRange(state.range);
    }

    for (const range of state.additionalRanges) {
      count += countRange(range);
    }

    return count;
  }

  // ─── Return manager ────────────────────────────────────────────

  return {
    get state() {
      return state;
    },
    startSelection,
    extendSelection,
    endSelection,
    moveActive,
    selectAll,
    selectColumn,
    selectRow,
    isInSelection,
    getSelectedCells,
    clearSelection,
    hasSelection,
    getCellCount,
  };
}

// ─── Exported utilities ────────────────────────────────────────────

/**
 * Check if a cell should display a specific selection border edge
 * Useful for rendering the selection border outline
 */
export function getSelectionEdges(
  cell: CellPosition,
  manager: SelectionManager,
): {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
} {
  const { range, additionalRanges } = manager.state;

  let top = false;
  let bottom = false;
  let left = false;
  let right = false;

  const checkRange = (r: SelectionRange) => {
    if (isRangeEdge(cell, r, 'top')) top = true;
    if (isRangeEdge(cell, r, 'bottom')) bottom = true;
    if (isRangeEdge(cell, r, 'left')) left = true;
    if (isRangeEdge(cell, r, 'right')) right = true;
  };

  if (range) checkRange(range);
  for (const r of additionalRanges) checkRange(r);

  return { top, bottom, left, right };
}

/**
 * Get the visible selection rectangle bounds (for visual indicator)
 */
export function getSelectionBounds(
  manager: SelectionManager,
): { top: number; left: number; right: number; bottom: number } | null {
  const { range } = manager.state;
  if (!range) return null;

  const norm = normalizeRange(range);
  return {
    top: norm.start.row,
    left: norm.start.col,
    bottom: norm.end.row,
    right: norm.end.col,
  };
}
