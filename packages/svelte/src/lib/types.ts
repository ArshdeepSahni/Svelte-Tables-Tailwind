/**
 * @tablecraft/svelte — Svelte-layer type definitions
 * Types specific to the Svelte component layer (not in @tablecraft/core).
 */
import type { ProcessedRow } from '@tablecraft/core';

export type {
  ColumnType,
  ColumnDefinition,
  AggregateFunction,
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

/** A synthetic group header row inserted by the groupBy pipeline step */
export interface ProcessedGroupRow {
  isGroup: true;
  key: string;       // groupBy column key
  label: string;     // display value of the group (e.g. "active")
  count: number;     // number of data rows in this group
  rows: ProcessedRow[];
}
