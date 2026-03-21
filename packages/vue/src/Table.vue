<script setup lang="ts">
/**
 * @tablecraft/vue — Table.vue
 *
 * Vue 3 SFC wrapper around the <tc-table> Web Component.
 * Uses imperative ref + watch pattern to set complex properties (data, columns)
 * as DOM properties — NOT HTML attributes. This is required because Custom Elements
 * cannot receive arrays/objects via HTML attributes.
 *
 * Events: All 5 tc-* CustomEvents are forwarded as Vue emit events.
 * The consuming component can listen with @tc-cell-click="handler" etc.
 */
import { ref, onMounted, onUnmounted, watch } from 'vue';
import type { ColumnOverrideShort, ColumnDefinition } from '@tablecraft/core';
// Import element side-effect to register <tc-table> in the Custom Element registry
import '@tablecraft/core/element';

// Row is Record<string, unknown> — not a named export from @tablecraft/core
type Row = Record<string, unknown>;

// TypeScript interface for the tc-table DOM element
interface TcTableElement extends HTMLElement {
  data: Row[];
  columns?: ColumnOverrideShort | ColumnDefinition[];
  selectedRows: Row[];
  rowHeight: number;
  sortBy: string;
  sortDir: string;
  bordered: boolean;
  striped: boolean;
  loading: boolean;
  pageSize: number;
  filterable: boolean;
  selectable: boolean;
  caption: string;
}

const props = withDefaults(defineProps<{
  data?: Row[];
  columns?: ColumnOverrideShort | ColumnDefinition[];
  rowHeight?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  bordered?: boolean;
  striped?: boolean;
  loading?: boolean;
  pageSize?: number;
  filterable?: boolean;
  selectable?: boolean;
  caption?: string;
}>(), {
  data: () => [],
  rowHeight: 48,
  sortBy: '',
  sortDir: 'asc',
  bordered: false,
  striped: false,
  loading: false,
  pageSize: 50,
  filterable: false,
  selectable: false,
  caption: '',
});

const emit = defineEmits<{
  'tc-cell-click': [event: CustomEvent];
  'tc-row-click': [event: CustomEvent];
  'tc-sort-change': [event: CustomEvent];
  'tc-filter-change': [event: CustomEvent];
  'tc-select-change': [event: CustomEvent];
}>();

// Template ref — points to the tc-table DOM element
const tcTableRef = ref<TcTableElement | null>(null);

// Event forwarding handlers — created once, stored for cleanup
const handlers: Record<string, EventListener> = {
  'tc-cell-click':    (e) => emit('tc-cell-click', e as CustomEvent),
  'tc-row-click':     (e) => emit('tc-row-click', e as CustomEvent),
  'tc-sort-change':   (e) => emit('tc-sort-change', e as CustomEvent),
  'tc-filter-change': (e) => emit('tc-filter-change', e as CustomEvent),
  'tc-select-change': (e) => emit('tc-select-change', e as CustomEvent),
};

onMounted(() => {
  const el = tcTableRef.value;
  if (!el) return;

  // Assign complex properties as DOM properties (not HTML attributes)
  // IMPORTANT: must use el.data = [...] NOT el.setAttribute('data', ...)
  el.data = props.data;
  if (props.columns !== undefined) el.columns = props.columns;

  // Register event forwarding listeners
  for (const [name, handler] of Object.entries(handlers)) {
    el.addEventListener(name, handler);
  }
});

onUnmounted(() => {
  const el = tcTableRef.value;
  if (!el) return;
  for (const [name, handler] of Object.entries(handlers)) {
    el.removeEventListener(name, handler);
  }
});

// Watch complex props for changes — reassign as DOM properties
// IMPORTANT: Must assign a NEW array reference (Lit uses reference equality for change detection)
watch(() => props.data, (newData) => {
  const el = tcTableRef.value;
  if (el) el.data = newData;
}, { deep: false }); // shallow watch — caller must pass new array reference

watch(() => props.columns, (newColumns) => {
  const el = tcTableRef.value;
  if (el && newColumns !== undefined) el.columns = newColumns;
});
</script>

<template>
  <!--
    Scalar attributes are safe to bind via v-bind — they are strings/booleans/numbers
    that correctly serialize to HTML attributes. Only data/columns need imperative assignment.

    :row-height, :sort-by, :sort-dir, :bordered, :striped, :loading, :page-size,
    :filterable, :selectable, :caption are scalar — safe to pass as attributes.
  -->
  <tc-table
    ref="tcTableRef"
    :row-height="rowHeight"
    :sort-by="sortBy"
    :sort-dir="sortDir"
    :bordered="bordered || undefined"
    :striped="striped || undefined"
    :loading="loading || undefined"
    :page-size="pageSize"
    :filterable="filterable || undefined"
    :selectable="selectable || undefined"
    :caption="caption || undefined"
  />
</template>
