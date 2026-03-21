/**
 * @tablecraft/core — TcTable Custom Element (Lit 3, Light DOM)
 *
 * WC-01: Light DOM mode — createRenderRoot() returns this (the element itself).
 *   Shadow DOM is architecturally excluded. Tailwind/host CSS must cascade in.
 *
 * WC-02: static properties = {} NOT @property() decorators.
 *   Reason: tsconfig.base.json has useDefineForClassFields:true + target:ES2022.
 *   @property() decorators fail with that combination. static properties = {} works unconditionally.
 *   ALL properties initialized in constructor(), NOT as class field assignments.
 *
 * WC-05: SSR guard — customElements.define wrapped in typeof check.
 *   Importing this file in Node.js (SvelteKit SSR) must NOT throw.
 *
 * WC-04: renderCell(descriptor) mirrors Cell.svelte exactly — same CSS class
 *   names, same kind dispatch, same safety contract (html kind uses sanitized).
 */

import { LitElement, html, nothing } from 'lit';
import { isServer } from 'lit';
import { createTableEngine } from './engine/index.js';
import type {
  ResolvedColumn,
  ProcessedRow,
  CellDescriptor,
  ColumnOverrideShort,
  ColumnDefinition,
  ColumnInferenceMap,
} from './types.js';

// Row is not a named export — it's Record<string, unknown>
type Row = Record<string, unknown>;

export class TcTable extends LitElement {
  // -------------------------------------------------------------------------
  // WC-01: Light DOM — no shadow root.
  // Shadow DOM is architecturally excluded (Phase 1 irreversible decision).
  // -------------------------------------------------------------------------
  override createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  // -------------------------------------------------------------------------
  // WC-02: Static properties — NOT @property() decorators.
  // useDefineForClassFields:true + target:ES2022 breaks @property() decorators.
  // static properties = {} works unconditionally in all tsconfig combinations.
  // -------------------------------------------------------------------------
  static override properties = {
    // Complex data — no attribute reflection (cannot serialize objects to HTML attributes)
    data:         { attribute: false },
    columns:      { attribute: false },
    selectedRows: { attribute: false },
    // Scalar attributes — reflected to/from HTML attributes
    rowHeight:    { type: Number,  attribute: 'row-height' },
    sortBy:       { type: String,  attribute: 'sort-by' },
    sortDir:      { type: String,  attribute: 'sort-dir' },
    bordered:     { type: Boolean },
    striped:      { type: Boolean },
    loading:      { type: Boolean },
    pageSize:     { type: Number,  attribute: 'page-size' },
    filterable:   { type: Boolean },
    selectable:   { type: Boolean },
    caption:      { type: String },
    // Internal reactive state (no attribute, not serializable to HTML)
    _resolvedColumns: { state: true },
    _processedRows:   { state: true },
    _filterQuery:     { state: true },
  };

  // -------------------------------------------------------------------------
  // Property declarations (declare-only — initialized in constructor)
  // CRITICAL: Must use `declare` keyword, NOT class field assignments.
  // Class field assignments with useDefineForClassFields:true overwrite
  // Lit's getter/setter installed by static properties — breaking reactivity.
  // -------------------------------------------------------------------------

  // Public properties
  declare data: Row[];
  declare columns: ColumnOverrideShort | ColumnDefinition[] | undefined;
  declare selectedRows: Row[];
  declare rowHeight: number;
  declare sortBy: string;
  declare sortDir: string;
  declare bordered: boolean;
  declare striped: boolean;
  declare loading: boolean;
  declare pageSize: number;
  declare filterable: boolean;
  declare selectable: boolean;
  declare caption: string;

  // Internal reactive state
  declare private _resolvedColumns: ResolvedColumn[];
  declare private _processedRows: ProcessedRow[];
  declare private _filterQuery: string;

  // Non-reactive private fields (not in static properties)
  private _inferenceMap: ColumnInferenceMap | null = null;

  // -------------------------------------------------------------------------
  // Constructor — all properties initialized here, NOT as class fields
  // -------------------------------------------------------------------------
  constructor() {
    super();
    this.data = [];
    this.columns = undefined;
    this.selectedRows = [];
    this.rowHeight = 48;
    this.sortBy = '';
    this.sortDir = 'asc';
    this.bordered = false;
    this.striped = false;
    this.loading = false;
    this.pageSize = 50;
    this.filterable = false;
    this.selectable = false;
    this.caption = '';
    this._resolvedColumns = [];
    this._processedRows = [];
    this._filterQuery = '';
  }

  // -------------------------------------------------------------------------
  // Lit lifecycle — willUpdate runs before render when properties change
  // -------------------------------------------------------------------------
  override willUpdate(changed: Map<string, unknown>): void {
    if (changed.has('data') || changed.has('columns')) {
      // Recompute immediately with text fallback (no inference result yet).
      // Provides fast initial render — inference upgrades types asynchronously.
      const engine = createTableEngine({ data: this.data, columns: this.columns });
      this._resolvedColumns = engine.resolveColumns(this.data, this.columns, this._inferenceMap ?? undefined);
      this._processedRows = engine.processRows(this.data, this._resolvedColumns);
      // Schedule inference in idle time — re-renders with typed columns when done
      this._scheduleInference();
    }
    if (changed.has('sortBy') || changed.has('sortDir') || changed.has('_filterQuery')) {
      this._applySortFilter();
    }
  }

  // -------------------------------------------------------------------------
  // Inference scheduling — runs in requestIdleCallback so initial render
  // is never blocked. After inference completes, re-renders with typed columns.
  // -------------------------------------------------------------------------
  private _scheduleInference(): void {
    // WC-05: isServer guard — requestIdleCallback does not exist in Node.js
    if (isServer) return;
    if (typeof requestIdleCallback === 'undefined') return;
    if (!this.data.length) return;

    const data = this.data;
    const columns = this.columns;

    requestIdleCallback(() => {
      // Check element is still connected and data hasn't changed under us
      if (!this.isConnected) return;
      if (this.data !== data) return;

      const engine = createTableEngine({ data, columns });
      const inferenceMap = engine.inferSchema(data);
      this._inferenceMap = inferenceMap;

      // Re-resolve columns with inference result — triggers re-render via state
      const newEngine = createTableEngine({ data, columns });
      this._resolvedColumns = newEngine.resolveColumns(data, columns, inferenceMap);
      this._processedRows = newEngine.processRows(data, this._resolvedColumns);
      this.requestUpdate();
    });
  }

  // -------------------------------------------------------------------------
  // Sort + filter — applies current sortBy/sortDir/_filterQuery to processedRows
  // -------------------------------------------------------------------------
  private _applySortFilter(): void {
    if (!this.data.length || !this._resolvedColumns.length) return;

    const engine = createTableEngine({ data: this.data, columns: this.columns });
    let rows = engine.processRows(this.data, this._resolvedColumns);

    if (this._filterQuery) {
      const q = this._filterQuery.toLowerCase();
      rows = rows.filter((row) =>
        Object.values(row.cells).some((cell) => {
          if ('value' in cell) return String(cell.value).toLowerCase().includes(q);
          if ('label' in cell) return (cell as { label: string }).label.toLowerCase().includes(q);
          if ('formatted' in cell) return (cell as { formatted: string }).formatted.toLowerCase().includes(q);
          return false;
        }),
      );
    }

    if (this.sortBy) {
      const dir = this.sortDir === 'desc' ? -1 : 1;
      rows = [...rows].sort((a, b) => {
        const aVal = a._original[this.sortBy];
        const bVal = b._original[this.sortBy];
        if (aVal == null) return 1 * dir;
        if (bVal == null) return -1 * dir;
        return (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) * dir;
      });
    }

    this._processedRows = rows;
  }

  // -------------------------------------------------------------------------
  // Render — lit-html template for the full table
  // WC-05: isServer guard prevents rendering in Node.js SSR
  // -------------------------------------------------------------------------
  override render() {
    if (isServer) return nothing;

    const tableClass = [
      'tc-table',
      this.bordered ? 'tc-table--bordered' : '',
      this.striped ? 'tc-table--striped' : '',
    ].filter(Boolean).join(' ');

    return html`
      <table
        class=${tableClass}
        role="grid"
        aria-busy=${this.loading ? 'true' : 'false'}
      >
        ${this.caption ? html`<caption>${this.caption}</caption>` : nothing}
        <thead>
          <tr role="row">
            ${this._resolvedColumns.map((col) => html`
              <th
                role="columnheader"
                scope="col"
                class="tc-th"
                aria-sort=${this.sortBy === col.key
                  ? (this.sortDir === 'asc' ? 'ascending' : 'descending')
                  : 'none'}
                style="cursor: pointer;"
                @click=${() => this._handleSort(col)}
              >
                ${col.label}
              </th>
            `)}
          </tr>
        </thead>
        <tbody @click=${this._handleBodyClick}>
          ${this._processedRows.map((row, rowIndex) => this._renderRow(row, rowIndex))}
        </tbody>
      </table>
      ${this.filterable ? html`
        <div class="tc-filter-bar">
          <input
            type="search"
            class="tc-filter-input"
            placeholder="Filter..."
            .value=${this._filterQuery}
            @input=${this._handleFilterInput}
            aria-label="Filter table rows"
          />
        </div>
      ` : nothing}
    `;
  }

  // -------------------------------------------------------------------------
  // Row renderer
  // -------------------------------------------------------------------------
  private _renderRow(row: ProcessedRow, rowIndex: number) {
    const isSelected = this.selectedRows.some((r) => r === row._original);
    return html`
      <tr
        role="row"
        class="tc-tr${isSelected ? ' tc-tr--selected' : ''}"
        data-row=${rowIndex}
        style="height: ${this.rowHeight}px;"
        aria-selected=${this.selectable ? String(isSelected) : nothing}
      >
        ${this.selectable ? html`
          <td role="gridcell" class="tc-td tc-td--checkbox">
            <input
              type="checkbox"
              .checked=${isSelected}
              @change=${() => this._handleRowSelect(row)}
              aria-label="Select row"
            />
          </td>
        ` : nothing}
        ${this._resolvedColumns.map((col, colIndex) => html`
          <td role="gridcell" class="tc-td" data-col=${colIndex}>
            ${this._renderCell(row.cells[col.key] ?? { kind: 'text', value: '' })}
          </td>
        `)}
      </tr>
    `;
  }

  // -------------------------------------------------------------------------
  // Cell renderer — exact mirror of Cell.svelte
  // WC-04: Same CSS class names, same kind dispatch, same safety contract.
  // FOUND-07: Only 'html' kind uses innerHTML — descriptor.sanitized is
  //   DOMPurify-processed by the html renderer. All other kinds use text nodes.
  // Note: No Svelte at-html directive used here — this is a TypeScript file.
  // -------------------------------------------------------------------------
  private _renderCell(descriptor: CellDescriptor) {
    switch (descriptor.kind) {
      case 'text':
        return html`<span>${descriptor.value}</span>`;

      case 'number':
        return html`<span class="tc-num">${descriptor.formatted}</span>`;

      case 'link':
        return html`<a
          class="tc-link"
          href=${descriptor.href}
          target=${descriptor.external ? '_blank' : nothing}
          rel=${descriptor.external ? 'noopener noreferrer' : nothing}
        >${descriptor.label}</a>`;

      case 'image':
        return html`<img
          src=${descriptor.src}
          alt=${descriptor.alt}
          class="tc-img"
          loading="lazy"
        />`;

      case 'badge':
        return html`<span class="tc-badge tc-badge--${descriptor.variant}">${descriptor.label}</span>`;

      case 'status':
        return html`<span class="tc-status tc-status--${descriptor.variant}" role="status">${descriptor.label}</span>`;

      case 'boolean':
        return html`<span
          class="tc-bool ${descriptor.value ? 'tc-bool--true' : 'tc-bool--false'}"
          aria-label=${descriptor.value ? 'Yes' : 'No'}
        >${descriptor.value ? '✓' : '✗'}</span>`;

      case 'code':
        return html`<code class="tc-code">${descriptor.value}</code>`;

      case 'html': {
        // FOUND-07: descriptor.sanitized is already DOMPurify-processed by the html
        // renderer — safe to inject. This is the ONLY innerHTML usage in the element.
        // Mirrors the Svelte at-html directive pattern in Cell.svelte (sanitized only).
        const span = document.createElement('span');
        span.innerHTML = descriptor.sanitized;
        return span;
      }

      default:
        // 'raw' kind and any unknown kinds — safely stringify
        return html`<span>${String((descriptor as { value: unknown }).value ?? '')}</span>`;
    }
  }

  // -------------------------------------------------------------------------
  // Sort handler — toggles sort direction on same column, resets on new column
  // -------------------------------------------------------------------------
  private _handleSort(col: ResolvedColumn): void {
    if (this.sortBy === col.key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = col.key;
      this.sortDir = 'asc';
    }
    // WC-03: tc-sort-change CustomEvent with bubbles:true, composed:true
    this.dispatchEvent(new CustomEvent('tc-sort-change', {
      detail: { key: this.sortBy, dir: this.sortDir },
      bubbles: true,
      composed: true,
    }));
  }

  // -------------------------------------------------------------------------
  // Filter input handler
  // -------------------------------------------------------------------------
  private _handleFilterInput = (e: Event): void => {
    const input = e.target as HTMLInputElement;
    this._filterQuery = input.value;
    // WC-03: tc-filter-change CustomEvent
    this.dispatchEvent(new CustomEvent('tc-filter-change', {
      detail: { query: this._filterQuery },
      bubbles: true,
      composed: true,
    }));
  };

  // -------------------------------------------------------------------------
  // Body click handler — single delegated listener for both row and cell clicks.
  // Uses data-row / data-col attributes to identify target — no per-cell listeners.
  // -------------------------------------------------------------------------
  private _handleBodyClick = (e: Event): void => {
    const target = e.target as HTMLElement;
    const td = target.closest('[data-col]') as HTMLElement | null;
    const tr = target.closest('[data-row]') as HTMLElement | null;
    if (!tr) return;

    const rowIndex = Number(tr.dataset['row']);
    const row = this._processedRows[rowIndex];
    if (!row) return;

    // WC-03: tc-row-click CustomEvent
    this.dispatchEvent(new CustomEvent('tc-row-click', {
      detail: { row: row._original, rowIndex },
      bubbles: true,
      composed: true,
    }));

    if (td) {
      const colIndex = Number(td.dataset['col']);
      const col = this._resolvedColumns[colIndex];
      if (col) {
        // WC-03: tc-cell-click CustomEvent
        this.dispatchEvent(new CustomEvent('tc-cell-click', {
          detail: {
            row: row._original,
            column: col,
            value: row._original[col.key],
            rowIndex,
          },
          bubbles: true,
          composed: true,
        }));
      }
    }
  };

  // -------------------------------------------------------------------------
  // Selection handler
  // -------------------------------------------------------------------------
  private _handleRowSelect(row: ProcessedRow): void {
    const original = row._original;
    const alreadySelected = this.selectedRows.some((r) => r === original);

    // Assign new array — mutations do NOT trigger Lit re-render (reference equality)
    if (alreadySelected) {
      this.selectedRows = this.selectedRows.filter((r) => r !== original);
    } else {
      this.selectedRows = [...this.selectedRows, original];
    }

    const allSelected = this._processedRows.length > 0 &&
      this._processedRows.every((r) => this.selectedRows.some((s) => s === r._original));

    // WC-03: tc-select-change CustomEvent
    this.dispatchEvent(new CustomEvent('tc-select-change', {
      detail: { rows: this.selectedRows, allSelected },
      bubbles: true,
      composed: true,
    }));
  }
}

// -------------------------------------------------------------------------
// WC-05: SSR guard — customElements is not available in Node.js / SvelteKit SSR.
// This is the ONLY place customElements.define is called for tc-table.
// Importing this module in a server context must NOT throw.
//
// Double-registration guard: Lit's ssr-dom-shim shims customElements in Node.js,
// so typeof customElements !== 'undefined' is true even in Node.js with Lit.
// We also check get() to avoid "already used with this registry" errors when
// the module is imported multiple times in tests (vi.resetModules() path).
// -------------------------------------------------------------------------
if (typeof customElements !== 'undefined' && !customElements.get('tc-table')) {
  customElements.define('tc-table', TcTable);
}
