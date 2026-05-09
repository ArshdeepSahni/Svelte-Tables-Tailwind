/**
 * @tablecraft/svelte — Public API
 *
 * Table is the sole public component. Sub-components are internal.
 * Type helpers and ColumnType are re-exported for consumer type safety.
 * defineColumns is re-exported so consumers get full TypeScript generics
 * without importing from @tablecraft/core directly.
 */

export { default as Table } from './Table.svelte';
export { default as CellEditor } from './CellEditor.svelte';
export { default as CommandPalette } from './CommandPalette.svelte';
export type { ColumnType, ColumnDefinition, TableConfig, ActionDescriptor } from '@tablecraft/core';
export { defineColumns } from '@tablecraft/core';

// Phase 9: Stream utilities
export { connectStream, createSimulatedStream } from './stream.svelte.js';
export type { StreamSource, StreamState, StreamStatus, StreamMessage } from './stream.svelte.js';

// Phase 12: History and Conditional Formatting
export { createHistoryManager, bindHistoryShortcuts } from './history.svelte.js';
export type { HistoryEntry, HistoryManager } from './history.svelte.js';

export {
  evaluateConditionalFormats,
  colorScale,
  dataBarWidth,
  dataBarGradient,
  createRule,
} from './conditional-format.js';
export type {
  FormatCondition,
  FormatStyle,
  ConditionalFormatRule,
  ConditionalFormatPreset,
  FormatPreset,
} from './conditional-format.js';

// Phase 12: 2D Range Selection
export { createSelectionManager } from './selection.svelte.js';
export type {
  CellPosition,
  SelectionRange,
  SelectedCell,
  SelectionState,
  SelectionManager,
} from './selection.svelte.js';

// Phase 12: Enhanced Clipboard
export { copyToClipboard, pasteFromClipboard, pasteRichFromClipboard } from './clipboard.js';
export type { ClipboardOptions, PasteResult } from './clipboard.js';
