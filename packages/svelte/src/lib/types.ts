/**
 * @tablecraft/svelte — Svelte-layer type definitions
 * Types specific to the Svelte component layer (not in @tablecraft/core).
 */
export type {
  ColumnType,
  ColumnDefinition,
  ResolvedColumn,
  ProcessedRow,
  CellDescriptor,
  BadgeVariant,
} from '@tablecraft/core';

export type Row = Record<string, unknown>;
export type SortDir = 'asc' | 'desc' | null;

export interface SortState {
  key: string | null;
  dir: SortDir;
}

export interface FocusedCell {
  rowIndex: number;
  colIndex: number;
}
