/**
 * @tablecraft/core — Natural Language Filter Parser
 *
 * Parses human-readable search queries into structured filter specs.
 * Zero network calls. Runs in < 1ms. Works offline.
 *
 * Examples:
 *   "active users" → { status/boolean columns matching "active" }
 *   "salary above 100000" → { numeric comparison: salary > 100000 }
 *   "joined this year" → { date comparison: joined >= 2024-01-01 }
 *   "missing email" → { existence check: email is null/empty }
 *   "show alice" → { text match: any column contains "alice" }
 */

export interface NLFilterSpec {
  /** Original query string */
  raw: string;
  /** Human-readable interpretation shown to user */
  interpretation: string;
  /** Whether NL parsing was applied (vs fallback to text search) */
  parsed: boolean;
  /** Structured conditions extracted from the query */
  conditions: NLCondition[];
}

export interface NLCondition {
  type: 'comparison' | 'boolean' | 'existence' | 'temporal' | 'text' | 'status';
  /** Column key to filter on (null = search all columns) */
  column: string | null;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'empty' | 'not_empty';
  value: unknown;
  /** Human label for display */
  label: string;
}

/** Column metadata for smarter parsing */
export interface ColumnMeta {
  key: string;
  type: string; // ColumnType
  values?: unknown[]; // sample values for enum matching
}

// ─── Temporal patterns ─────────────────────────────────────────────

const TEMPORAL_PATTERNS: Array<{
  pattern: RegExp;
  resolve: () => { start: Date; end?: Date; label: string };
}> = [
  {
    pattern: /\bthis\s+year\b/i,
    resolve: () => {
      const now = new Date();
      return { start: new Date(now.getFullYear(), 0, 1), label: `this year (${now.getFullYear()})` };
    },
  },
  {
    pattern: /\blast\s+year\b/i,
    resolve: () => {
      const now = new Date();
      const y = now.getFullYear() - 1;
      return { start: new Date(y, 0, 1), end: new Date(y, 11, 31, 23, 59, 59), label: `last year (${y})` };
    },
  },
  {
    pattern: /\bthis\s+month\b/i,
    resolve: () => {
      const now = new Date();
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), label: 'this month' };
    },
  },
  {
    pattern: /\blast\s+month\b/i,
    resolve: () => {
      const now = new Date();
      const m = now.getMonth() - 1;
      const y = m < 0 ? now.getFullYear() - 1 : now.getFullYear();
      return { start: new Date(y, (m + 12) % 12, 1), end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59), label: 'last month' };
    },
  },
  {
    pattern: /\btoday\b/i,
    resolve: () => {
      const now = new Date();
      return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate()), label: 'today' };
    },
  },
  {
    pattern: /\blast\s+(\d+)\s+days?\b/i,
    resolve: () => {
      // Extract days from the original match
      return { start: new Date(), label: 'recently' };
    },
  },
  {
    pattern: /\bsince\s+(\d{4})\b/i,
    resolve: () => {
      return { start: new Date(), label: 'since year' };
    },
  },
  {
    pattern: /\bafter\s+(\d{4})\b/i,
    resolve: () => {
      return { start: new Date(), label: 'after year' };
    },
  },
  {
    pattern: /\bbefore\s+(\d{4})\b/i,
    resolve: () => {
      return { start: new Date(), label: 'before year' };
    },
  },
];

// ─── Comparison patterns ───────────────────────────────────────────

const COMPARISON_PATTERNS: Array<{
  pattern: RegExp;
  operator: NLCondition['operator'];
  label: (col: string, val: string) => string;
}> = [
  { pattern: /\b(?:above|over|more\s+than|greater\s+than|>)\s*(\d[\d,.]*)/i, operator: '>', label: (c, v) => `${c} > ${v}` },
  { pattern: /\b(?:below|under|less\s+than|fewer\s+than|<)\s*(\d[\d,.]*)/i, operator: '<', label: (c, v) => `${c} < ${v}` },
  { pattern: /\b(?:at\s+least|>=|minimum)\s*(\d[\d,.]*)/i, operator: '>=', label: (c, v) => `${c} >= ${v}` },
  { pattern: /\b(?:at\s+most|<=|maximum)\s*(\d[\d,.]*)/i, operator: '<=', label: (c, v) => `${c} <= ${v}` },
  { pattern: /\b(?:exactly|equals?|is)\s+(\d[\d,.]*)/i, operator: '=', label: (c, v) => `${c} = ${v}` },
];

// ─── Existence patterns ────────────────────────────────────────────

const EXISTENCE_PATTERNS: Array<{
  pattern: RegExp;
  operator: 'empty' | 'not_empty';
  label: (col: string) => string;
}> = [
  { pattern: /\b(?:missing|no|without|empty|blank)\s+(\w+)/i, operator: 'empty', label: (c) => `${c} is empty` },
  { pattern: /\b(?:has|with|have)\s+(\w+)/i, operator: 'not_empty', label: (c) => `${c} exists` },
];

// ─── Boolean patterns ──────────────────────────────────────────────

const BOOLEAN_TRUE_WORDS = new Set(['active', 'enabled', 'yes', 'true', 'on', 'verified', 'confirmed', 'paid', 'published']);
const BOOLEAN_FALSE_WORDS = new Set(['inactive', 'disabled', 'no', 'false', 'off', 'unverified', 'unpaid', 'draft']);

// ─── Status patterns ───────────────────────────────────────────────

const STATUS_WORDS = new Set([
  'active', 'inactive', 'pending', 'processing', 'shipped', 'delivered',
  'cancelled', 'completed', 'failed', 'approved', 'rejected', 'draft',
  'published', 'archived', 'suspended', 'blocked', 'open', 'closed',
  'in_progress', 'in-progress', 'low_stock', 'out_of_stock',
]);

// ─── Main parser ───────────────────────────────────────────────────

export function parseNaturalLanguage(
  query: string,
  columns: ColumnMeta[],
): NLFilterSpec {
  const raw = query;
  const conditions: NLCondition[] = [];
  let remaining = query.trim();

  if (!remaining) {
    return { raw, interpretation: '', parsed: false, conditions: [] };
  }

  // Strip common filler words
  remaining = remaining.replace(/\b(show|show me|display|find|get|list|filter|only)\b/gi, '').trim();

  // 1. Temporal patterns — match date/datetime columns
  const dateCols = columns.filter(c => ['date', 'datetime', 'time'].includes(c.type));
  for (const tp of TEMPORAL_PATTERNS) {
    const match = remaining.match(tp.pattern);
    if (match && dateCols.length > 0) {
      const resolved = tp.resolve();
      // Check if the query mentions a specific column name
      let targetCol = dateCols[0].key; // default to first date column
      for (const dc of dateCols) {
        if (remaining.toLowerCase().includes(dc.key.toLowerCase().replace(/_/g, ' '))) {
          targetCol = dc.key;
          break;
        }
      }

      // Handle specific temporal patterns with captured groups
      if (/since\s+(\d{4})/i.test(remaining)) {
        const yearMatch = remaining.match(/since\s+(\d{4})/i);
        if (yearMatch) {
          const year = parseInt(yearMatch[1]);
          conditions.push({
            type: 'temporal',
            column: targetCol,
            operator: '>=',
            value: new Date(year, 0, 1).toISOString(),
            label: `${targetCol} since ${year}`,
          });
          remaining = remaining.replace(/since\s+\d{4}/i, '').trim();
          continue;
        }
      }

      if (/after\s+(\d{4})/i.test(remaining)) {
        const yearMatch = remaining.match(/after\s+(\d{4})/i);
        if (yearMatch) {
          const year = parseInt(yearMatch[1]);
          conditions.push({
            type: 'temporal',
            column: targetCol,
            operator: '>=',
            value: new Date(year + 1, 0, 1).toISOString(),
            label: `${targetCol} after ${year}`,
          });
          remaining = remaining.replace(/after\s+\d{4}/i, '').trim();
          continue;
        }
      }

      if (/before\s+(\d{4})/i.test(remaining)) {
        const yearMatch = remaining.match(/before\s+(\d{4})/i);
        if (yearMatch) {
          const year = parseInt(yearMatch[1]);
          conditions.push({
            type: 'temporal',
            column: targetCol,
            operator: '<',
            value: new Date(year, 0, 1).toISOString(),
            label: `${targetCol} before ${year}`,
          });
          remaining = remaining.replace(/before\s+\d{4}/i, '').trim();
          continue;
        }
      }

      if (/last\s+(\d+)\s+days?/i.test(remaining)) {
        const daysMatch = remaining.match(/last\s+(\d+)\s+days?/i);
        if (daysMatch) {
          const days = parseInt(daysMatch[1]);
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - days);
          conditions.push({
            type: 'temporal',
            column: targetCol,
            operator: '>=',
            value: cutoff.toISOString(),
            label: `${targetCol} in last ${days} days`,
          });
          remaining = remaining.replace(/last\s+\d+\s+days?/i, '').trim();
          continue;
        }
      }

      // Generic temporal
      conditions.push({
        type: 'temporal',
        column: targetCol,
        operator: '>=',
        value: resolved.start.toISOString(),
        label: `${targetCol} ${resolved.label}`,
      });
      remaining = remaining.replace(tp.pattern, '').trim();
    }
  }

  // 2. Existence patterns — "missing email", "has phone"
  for (const ep of EXISTENCE_PATTERNS) {
    const match = remaining.match(ep.pattern);
    if (match) {
      const colName = match[1].toLowerCase();
      const col = columns.find(c => c.key.toLowerCase() === colName || c.key.toLowerCase().replace(/_/g, '') === colName);
      if (col) {
        conditions.push({
          type: 'existence',
          column: col.key,
          operator: ep.operator,
          value: null,
          label: ep.label(col.key),
        });
        remaining = remaining.replace(ep.pattern, '').trim();
      }
    }
  }

  // 3. Comparison patterns — "salary above 100000"
  const numericCols = columns.filter(c => ['number', 'integer', 'currency', 'percentage'].includes(c.type));
  for (const cp of COMPARISON_PATTERNS) {
    const match = remaining.match(cp.pattern);
    if (match && numericCols.length > 0) {
      const val = parseFloat(match[1].replace(/,/g, ''));
      // Find which numeric column is mentioned
      let targetCol = numericCols[0].key;
      for (const nc of numericCols) {
        if (remaining.toLowerCase().includes(nc.key.toLowerCase().replace(/_/g, ' '))) {
          targetCol = nc.key;
          break;
        }
      }
      conditions.push({
        type: 'comparison',
        column: targetCol,
        operator: cp.operator,
        value: val,
        label: cp.label(targetCol, String(val)),
      });
      remaining = remaining.replace(cp.pattern, '').trim();
    }
  }

  // 4. Boolean / status words — "active", "inactive", "pending"
  const words = remaining.split(/\s+/).filter(w => w.length > 1);
  for (const word of words) {
    const w = word.toLowerCase();

    // Check status columns first
    if (STATUS_WORDS.has(w)) {
      const statusCol = columns.find(c => c.type === 'status' || c.type === 'badge');
      if (statusCol) {
        conditions.push({
          type: 'status',
          column: statusCol.key,
          operator: '=',
          value: w,
          label: `${statusCol.key} = ${w}`,
        });
        remaining = remaining.replace(new RegExp(`\\b${word}\\b`, 'i'), '').trim();
        continue;
      }
    }

    // Check boolean columns
    if (BOOLEAN_TRUE_WORDS.has(w)) {
      const boolCol = columns.find(c => c.type === 'boolean');
      if (boolCol) {
        conditions.push({
          type: 'boolean',
          column: boolCol.key,
          operator: '=',
          value: true,
          label: `${boolCol.key} = true`,
        });
        remaining = remaining.replace(new RegExp(`\\b${word}\\b`, 'i'), '').trim();
        continue;
      }
    }

    if (BOOLEAN_FALSE_WORDS.has(w)) {
      const boolCol = columns.find(c => c.type === 'boolean');
      if (boolCol) {
        conditions.push({
          type: 'boolean',
          column: boolCol.key,
          operator: '=',
          value: false,
          label: `${boolCol.key} = false`,
        });
        remaining = remaining.replace(new RegExp(`\\b${word}\\b`, 'i'), '').trim();
        continue;
      }
    }
  }

  // 5. Remaining text — fallback to text search across all columns
  remaining = remaining.replace(/\band\b/gi, '').trim();
  if (remaining) {
    conditions.push({
      type: 'text',
      column: null,
      operator: 'contains',
      value: remaining,
      label: `contains "${remaining}"`,
    });
  }

  const parsed = conditions.some(c => c.type !== 'text');
  const interpretation = conditions.map(c => c.label).join(' + ');

  return { raw, interpretation, parsed, conditions };
}

// ─── Filter executor ───────────────────────────────────────────────

export function applyNLFilter(
  rows: Array<Record<string, unknown>>,
  spec: NLFilterSpec,
): Array<Record<string, unknown>> {
  if (!spec.parsed && spec.conditions.length === 0) return rows;

  return rows.filter(row => {
    return spec.conditions.every(cond => {
      if (cond.type === 'text' && cond.column === null) {
        // Global text search fallback
        const q = String(cond.value).toLowerCase();
        return Object.values(row).some(v =>
          v != null && String(v).toLowerCase().includes(q),
        );
      }

      if (!cond.column) return true;
      const val = row[cond.column];

      switch (cond.type) {
        case 'comparison': {
          const num = typeof val === 'number' ? val : parseFloat(String(val));
          if (isNaN(num)) return false;
          const target = cond.value as number;
          switch (cond.operator) {
            case '>': return num > target;
            case '<': return num < target;
            case '>=': return num >= target;
            case '<=': return num <= target;
            case '=': return num === target;
            default: return true;
          }
        }

        case 'boolean': {
          if (typeof val === 'boolean') return val === cond.value;
          const s = String(val).toLowerCase();
          const expected = cond.value as boolean;
          return expected
            ? ['true', 'yes', '1', 'active'].includes(s)
            : ['false', 'no', '0', 'inactive'].includes(s);
        }

        case 'status': {
          const s = String(val).toLowerCase().replace(/[-_\s]/g, '');
          const target = String(cond.value).toLowerCase().replace(/[-_\s]/g, '');
          return s === target || s.includes(target);
        }

        case 'temporal': {
          const dateVal = val instanceof Date ? val : new Date(String(val));
          if (isNaN(dateVal.getTime())) return false;
          const target = new Date(String(cond.value));
          switch (cond.operator) {
            case '>=': return dateVal >= target;
            case '<': return dateVal < target;
            case '<=': return dateVal <= target;
            case '>': return dateVal > target;
            default: return true;
          }
        }

        case 'existence': {
          const isEmpty = val == null || String(val).trim() === '';
          return cond.operator === 'empty' ? isEmpty : !isEmpty;
        }

        default:
          return true;
      }
    });
  });
}

// ─── Column summary generator ──────────────────────────────────────

export interface ColumnSummary {
  key: string;
  type: string;
  summary: string;
  details: Record<string, unknown>;
}

export function generateColumnSummary(
  key: string,
  type: string,
  values: unknown[],
): ColumnSummary {
  const nonNull = values.filter(v => v != null);
  const completeness = Math.round((nonNull.length / values.length) * 100);

  if (['number', 'integer', 'currency', 'percentage'].includes(type)) {
    const nums = nonNull.map(v => typeof v === 'number' ? v : parseFloat(String(v))).filter(n => !isNaN(n));
    if (nums.length === 0) return { key, type, summary: 'No numeric data', details: {} };

    const sorted = [...nums].sort((a, b) => a - b);
    const sum = nums.reduce((a, b) => a + b, 0);
    const avg = sum / nums.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    // Detect outliers (> 3x median)
    const outliers = nums.filter(n => n > median * 3 || n < median / 3).length;

    const fmt = type === 'currency' ? (n: number) => `$${n.toLocaleString()}` :
                type === 'percentage' ? (n: number) => `${(n * 100).toFixed(0)}%` :
                (n: number) => n.toLocaleString();

    return {
      key, type,
      summary: `avg ${fmt(avg)}, median ${fmt(median)}, range ${fmt(min)}–${fmt(max)}${outliers > 0 ? `, ${outliers} outlier${outliers > 1 ? 's' : ''}` : ''}`,
      details: { avg, median, min, max, sum, count: nums.length, outliers, completeness },
    };
  }

  if (type === 'boolean') {
    const trueCount = nonNull.filter(v => v === true || String(v).toLowerCase() === 'true').length;
    const falseCount = nonNull.length - trueCount;
    const pct = Math.round((trueCount / nonNull.length) * 100);
    return {
      key, type,
      summary: `${pct}% true, ${100 - pct}% false`,
      details: { trueCount, falseCount, completeness },
    };
  }

  if (['status', 'badge'].includes(type)) {
    const counts = new Map<string, number>();
    nonNull.forEach(v => {
      const s = String(v);
      counts.set(s, (counts.get(s) ?? 0) + 1);
    });
    const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const parts = entries.slice(0, 4).map(([k, v]) => `${Math.round((v / nonNull.length) * 100)}% ${k}`);
    return {
      key, type,
      summary: parts.join(', '),
      details: { distribution: Object.fromEntries(counts), completeness },
    };
  }

  if (['date', 'datetime'].includes(type)) {
    const dates = nonNull.map(v => new Date(String(v))).filter(d => !isNaN(d.getTime())).sort((a, b) => a.getTime() - b.getTime());
    if (dates.length === 0) return { key, type, summary: 'No valid dates', details: {} };
    const earliest = dates[0];
    const latest = dates[dates.length - 1];
    return {
      key, type,
      summary: `${earliest.toLocaleDateString()} to ${latest.toLocaleDateString()} (${dates.length} entries)`,
      details: { earliest: earliest.toISOString(), latest: latest.toISOString(), count: dates.length, completeness },
    };
  }

  // Default: text/email/url/phone
  const unique = new Set(nonNull.map(String)).size;
  return {
    key, type,
    summary: `${unique} unique values, ${completeness}% complete`,
    details: { unique, total: values.length, completeness },
  };
}
