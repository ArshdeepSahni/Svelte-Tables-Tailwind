/**
 * @tablecraft/vue — package entry
 *
 * Exports the Table component (Vue 3 SFC wrapper around tc-table Web Component).
 * Also re-exports core types for TypeScript consumers.
 */
export { default as Table } from './Table.vue';
export type { ColumnOverrideShort, ColumnDefinition, ResolvedColumn } from '@tablecraft/core';
