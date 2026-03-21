/**
 * @tablecraft/svelte — Public API
 *
 * Table is the sole public component. Sub-components are internal.
 * Type helpers and ColumnType are re-exported for consumer type safety.
 * defineColumns is re-exported so consumers get full TypeScript generics
 * without importing from @tablecraft/core directly.
 */

export { default as Table } from './Table.svelte';
export type { ColumnType, ColumnDefinition, TableConfig } from '@tablecraft/core';
export { defineColumns } from '@tablecraft/core';
