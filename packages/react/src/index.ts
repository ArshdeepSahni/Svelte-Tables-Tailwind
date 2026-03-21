/**
 * @tablecraft/react — React wrapper for the tc-table Web Component
 *
 * Uses @lit/react createComponent() to bridge the React reconciler to the
 * tc-table Custom Element. All CustomEvents are forwarded as React props.
 *
 * IMPORTANT: data and columns must be passed as React props (not HTML attributes).
 * @lit/react correctly assigns them as DOM properties (element.data = value),
 * not HTML attribute strings — so complex objects work correctly.
 *
 * IMPORTANT: Array mutations do NOT trigger re-render.
 * Correct:   <Table data={[...rows, newRow]} />
 * Incorrect: rows.push(newRow); (no re-render — Lit uses reference equality)
 */
import React from 'react';
import { createComponent } from '@lit/react';
import type { EventName } from '@lit/react';
import { TcTable } from '@tablecraft/core/element';
import type { ColumnOverrideShort, ColumnDefinition, ResolvedColumn } from '@tablecraft/core';

/** A single data row — mirrors the local definition in packages/core/src/element.ts */
export type Row = Record<string, unknown>;

// ---------------------------------------------------------------------------
// CustomEvent detail types — used in the React event handler prop types
// ---------------------------------------------------------------------------

export interface TcCellClickDetail {
  row: Row;
  column: ResolvedColumn;
  value: unknown;
  rowIndex: number;
}

export interface TcRowClickDetail {
  row: Row;
  rowIndex: number;
}

export interface TcSortChangeDetail {
  key: string;
  dir: 'asc' | 'desc' | null;
}

export interface TcFilterChangeDetail {
  query: string;
}

export interface TcSelectChangeDetail {
  rows: Row[];
  allSelected: boolean;
}

// ---------------------------------------------------------------------------
// React component — created via @lit/react adapter
// ---------------------------------------------------------------------------

export const Table = createComponent({
  react: React,
  tagName: 'tc-table',
  elementClass: TcTable,
  displayName: 'Table',
  events: {
    onCellClick:    'tc-cell-click'    as EventName<CustomEvent<TcCellClickDetail>>,
    onRowClick:     'tc-row-click'     as EventName<CustomEvent<TcRowClickDetail>>,
    onSortChange:   'tc-sort-change'   as EventName<CustomEvent<TcSortChangeDetail>>,
    onFilterChange: 'tc-filter-change' as EventName<CustomEvent<TcFilterChangeDetail>>,
    onSelectChange: 'tc-select-change' as EventName<CustomEvent<TcSelectChangeDetail>>,
  },
});

// Re-export types consumers need for typed event handlers
// Row is defined locally above; ColumnOverrideShort, ColumnDefinition, ResolvedColumn from @tablecraft/core
export type { ColumnOverrideShort, ColumnDefinition, ResolvedColumn };
