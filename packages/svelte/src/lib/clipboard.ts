/**
 * @tablecraft/svelte — Enhanced Clipboard with Multi-Format Support
 *
 * Handles copying and pasting of table data with automatic format detection.
 *
 * Copy formats:
 *   - text/plain: Tab-separated values (TSV)
 *   - text/html: HTML table with proper formatting
 *   - application/json: JSON array (embedded in HTML data attribute)
 *
 * Paste formats (auto-detected):
 *   - JSON: Parsed directly
 *   - TSV: Tab-separated
 *   - CSV: Comma-separated
 *   - HTML: Table extraction
 *
 * Zero dependencies. Works in modern browsers with Clipboard API support.
 */

import type { SelectedCell } from './selection.svelte.js';

// ─── Types ─────────────────────────────────────────────────────────

export interface ColumnDefinition {
  key: string;
  label: string;
  type: string;
}

export interface ClipboardOptions {
  columns: ColumnDefinition[];
  includeHeaders?: boolean;
  dateFormatter?: (value: Date) => string;
  numberFormatter?: (value: number) => string;
}

export interface PasteResult {
  rows: Record<string, unknown>[];
  format: 'json' | 'tsv' | 'csv' | 'html';
}

// ─── Format detection ──────────────────────────────────────────────

function detectFormat(text: string): 'json' | 'tsv' | 'csv' | 'html' | null {
  text = text.trim();

  // Try JSON first
  if ((text.startsWith('[') && text.endsWith(']')) || (text.startsWith('{') && text.endsWith('}'))) {
    try {
      JSON.parse(text);
      return 'json';
    } catch {
      // Not valid JSON, continue
    }
  }

  // Try HTML
  if (text.startsWith('<table') || text.includes('<thead') || text.includes('<tbody')) {
    return 'html';
  }

  // Try tab-separated (TSV) vs comma-separated (CSV)
  // Heuristic: if more tabs than commas, it's likely TSV
  const tabCount = (text.match(/\t/g) || []).length;
  const commaCount = (text.match(/,/g) || []).length;

  if (tabCount > commaCount && tabCount > 0) {
    return 'tsv';
  } else if (commaCount > 0) {
    return 'csv';
  }

  return null;
}

// ─── Parser implementations ────────────────────────────────────────

function parseJSON(text: string, _columns: ColumnDefinition[]): Record<string, unknown>[] {
  try {
    const data = JSON.parse(text);
    const isArray = Array.isArray(data);
    const items = isArray ? data : [data];

    return items.map(item => {
      if (typeof item !== 'object' || item === null) return {};
      return item as Record<string, unknown>;
    });
  } catch {
    return [];
  }
}

function parseTSV(text: string, columns: ColumnDefinition[]): Record<string, unknown>[] {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headerLine = lines[0];
  const headers = headerLine.split('\t').map(h => h.trim());

  // If first row looks like headers, use it; otherwise use column labels
  let dataStartIdx = 1;
  let columnKeys = headers;

  // Check if headers match column keys/labels
  const isHeaderRow = headers.some(h =>
    columns.some(col => col.key === h || col.label === h),
  );

  if (!isHeaderRow && lines.length > 1) {
    // First row is data, not headers
    dataStartIdx = 0;
    columnKeys = columns.map(col => col.key);
  }

  const rows: Record<string, unknown>[] = [];
  for (let i = dataStartIdx; i < lines.length; i++) {
    const values = lines[i].split('\t');
    const row: Record<string, unknown> = {};

    for (let j = 0; j < columnKeys.length && j < values.length; j++) {
      const key = columnKeys[j];
      row[key] = values[j].trim() || null;
    }

    if (Object.keys(row).some(k => row[k] !== null)) {
      rows.push(row);
    }
  }

  return rows;
}

function parseCSV(text: string, columns: ColumnDefinition[]): Record<string, unknown>[] {
  // Simple CSV parser (handles basic cases; doesn't support escaped quotes)
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headerLine = lines[0];
  const headers = headerLine
    .split(',')
    .map(h => h.trim().replace(/^["']|["']$/g, ''));

  // If first row looks like headers, use it; otherwise use column labels
  let dataStartIdx = 1;
  let columnKeys = headers;

  const isHeaderRow = headers.some(h =>
    columns.some(col => col.key === h || col.label === h),
  );

  if (!isHeaderRow && lines.length > 1) {
    // First row is data, not headers
    dataStartIdx = 0;
    columnKeys = columns.map(col => col.key);
  }

  const rows: Record<string, unknown>[] = [];
  for (let i = dataStartIdx; i < lines.length; i++) {
    const values = lines[i]
      .split(',')
      .map(v => v.trim().replace(/^["']|["']$/g, ''));
    const row: Record<string, unknown> = {};

    for (let j = 0; j < columnKeys.length && j < values.length; j++) {
      const key = columnKeys[j];
      row[key] = values[j] || null;
    }

    if (Object.keys(row).some(k => row[k] !== null)) {
      rows.push(row);
    }
  }

  return rows;
}

function parseHTML(text: string, columns: ColumnDefinition[]): Record<string, unknown>[] {
  // Extract table rows from HTML
  const tableMatch = text.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) return [];

  const tableContent = tableMatch[1];

  // Extract headers from thead or first tr
  let headers: string[] = [];
  const theadMatch = tableContent.match(/<thead[^>]*>([\s\S]*?)<\/thead>/i);
  if (theadMatch) {
    const headerCells = theadMatch[1].match(/<th[^>]*>([\s\S]*?)<\/th>/gi);
    headers = headerCells
      ? headerCells.map(cell => cell.replace(/<[^>]*>/g, '').trim())
      : [];
  }

  // If no headers found, use column labels
  if (headers.length === 0) {
    headers = columns.map(col => col.key);
  }

  // Extract body rows
  const rowMatches = tableContent.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
  const rows: Record<string, unknown>[] = [];

  for (const rowMatch of rowMatches) {
    const cellMatches = rowMatch.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
    if (!cellMatches) continue;

    const row: Record<string, unknown> = {};
    const values = cellMatches.map(cell => cell.replace(/<[^>]*>/g, '').trim());

    for (let i = 0; i < headers.length && i < values.length; i++) {
      row[headers[i]] = values[i] || null;
    }

    if (Object.keys(row).some(k => row[k] !== null)) {
      rows.push(row);
    }
  }

  return rows;
}

// ─── Format detection helpers ──────────────────────────────────────

function formatValue(
  value: unknown,
  columnType: string,
  options: ClipboardOptions,
): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    // Escape special characters for TSV/CSV
    if (value.includes('\t') || value.includes('\n') || value.includes(',')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'number') {
    if (options.numberFormatter && (columnType === 'currency' || columnType === 'number')) {
      return options.numberFormatter(value);
    }
    return String(value);
  }

  if (value instanceof Date) {
    if (options.dateFormatter) {
      return options.dateFormatter(value);
    }
    return value.toISOString();
  }

  return String(value);
}

function escapeHTML(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ─── Public API ────────────────────────────────────────────────────

/**
 * Copy selected cells to clipboard in multiple formats
 * Writes text/plain (TSV), text/html, and application/json simultaneously
 */
export async function copyToClipboard(
  selectedCells: SelectedCell[][],
  options: ClipboardOptions,
): Promise<void> {
  if (selectedCells.length === 0) {
    throw new Error('No cells selected');
  }

  // Build data arrays
  const plainLines: string[] = [];
  const htmlRows: string[] = [];
  const jsonData: Record<string, unknown>[] = [];

  // Add headers if requested
  if (options.includeHeaders !== false) {
    const headerCells: string[] = [];
    for (const col of options.columns) {
      headerCells.push(col.label);
    }
    plainLines.push(headerCells.join('\t'));

    // HTML header
    const headerHTML = headerCells
      .map(h => `<th>${escapeHTML(h)}</th>`)
      .join('');
    htmlRows.push(`<thead><tr>${headerHTML}</tr></thead>`);
  }

  // Add data rows
  const tbody: string[] = [];
  for (const rowCells of selectedCells) {
    const rowValues: string[] = [];
    const rowData: Record<string, unknown> = {};

    for (const cell of rowCells) {
      const col = options.columns[cell.col];
      const formatted = formatValue(cell.value, col?.type || 'text', options);
      rowValues.push(formatted);
      if (col) {
        rowData[col.key] = cell.value;
      }
    }

    plainLines.push(rowValues.join('\t'));
    jsonData.push(rowData);

    // HTML row
    const cellsHTML = rowValues
      .map(v => `<td>${escapeHTML(v)}</td>`)
      .join('');
    tbody.push(`<tr>${cellsHTML}</tr>`);
  }

  // Build HTML table
  const htmlTable = `<table>${options.includeHeaders !== false ? htmlRows.join('') : ''}<tbody>${tbody.join('')}</tbody></table>`;

  // Plain text (TSV)
  const plainText = plainLines.join('\n');

  // JSON
  const jsonText = JSON.stringify(jsonData, null, 2);

  // Copy to clipboard using Clipboard API with multiple formats
  try {
    const blob1 = new Blob([plainText], { type: 'text/plain' });
    const blob2 = new Blob([htmlTable], { type: 'text/html' });
    const blob3 = new Blob([jsonText], { type: 'application/json' });

    const data = [
      new ClipboardItem({
        'text/plain': blob1,
        'text/html': blob2,
        'application/json': blob3,
      }),
    ];

    await navigator.clipboard.write(data);
  } catch {
    // Fallback: write only plain text if full API fails
    try {
      await navigator.clipboard.writeText(plainText);
    } catch (err) {
      throw new Error('Failed to copy to clipboard');
    }
  }
}

/**
 * Paste from clipboard with automatic format detection
 * Returns parsed rows and detected format
 */
export async function pasteFromClipboard(
  columns: ColumnDefinition[],
): Promise<PasteResult> {
  try {
    const text = await navigator.clipboard.readText();
    const format = detectFormat(text);

    if (!format) {
      throw new Error('Could not detect clipboard format');
    }

    let rows: Record<string, unknown>[] = [];

    switch (format) {
      case 'json':
        rows = parseJSON(text, columns);
        break;
      case 'tsv':
        rows = parseTSV(text, columns);
        break;
      case 'csv':
        rows = parseCSV(text, columns);
        break;
      case 'html':
        rows = parseHTML(text, columns);
        break;
    }

    return { rows, format };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'NotAllowedError') {
      throw new Error('Clipboard access denied. Please allow clipboard access in browser permissions.');
    }
    throw err;
  }
}

/**
 * Try to read from clipboard with HTML format support
 * Used for detecting rich format pastes (e.g., from Excel)
 */
export async function pasteRichFromClipboard(
  columns: ColumnDefinition[],
): Promise<PasteResult> {
  try {
    const items = await navigator.clipboard.read();

    for (const item of items) {
      // Try HTML first (from Excel, Google Sheets)
      if (item.types.includes('text/html')) {
        const blob = await item.getType('text/html');
        const text = await blob.text();
        const rows = parseHTML(text, columns);
        if (rows.length > 0) {
          return { rows, format: 'html' };
        }
      }

      // Fall back to plain text
      if (item.types.includes('text/plain')) {
        return pasteFromClipboard(columns);
      }
    }

    throw new Error('No compatible clipboard format found');
  } catch (err) {
    if (err instanceof DOMException && err.name === 'NotAllowedError') {
      throw new Error('Clipboard access denied');
    }
    throw err;
  }
}

/**
 * Check if clipboard read is supported
 */
export function isClipboardReadSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.clipboard?.readText;
}

/**
 * Check if clipboard write is supported
 */
export function isClipboardWriteSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.clipboard?.write;
}
