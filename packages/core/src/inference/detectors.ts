/**
 * @tablecraft/core — Type inference detector functions
 *
 * CORE-03: 15 detector functions in priority order.
 * CORE-04: Field-name keyword boosting (+0.15).
 *
 * Each detector receives sampled values for a single column and returns
 * { type, confidence } or null (= "this detector does not apply").
 * Returning null is preferred over returning low confidence — it keeps the
 * chain unambiguous and lets the next detector in priority order run.
 */

import type { ColumnType } from '../types.js';

/** Return type from a detector — null means "does not apply" */
export type DetectorResult = { type: ColumnType; confidence: number } | null;

/** All detector functions share this signature */
export type DetectorFn = (samples: unknown[], columnKey: string) => DetectorResult;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Normalize a value to a trimmed string, or null if empty/null/undefined */
function toStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  return String(value).trim();
}

/** Return non-null string samples only */
function nonNullStrings(samples: unknown[]): string[] {
  const result: string[] = [];
  for (const v of samples) {
    const s = toStringOrNull(v);
    if (s !== null) result.push(s);
  }
  return result;
}

/**
 * Compute ratio of samples that match a predicate.
 * Only counts non-null samples in denominator — null/empty values are skipped.
 */
function matchRatio(samples: unknown[], predicate: (s: string) => boolean): number {
  const strs = nonNullStrings(samples);
  if (strs.length === 0) return 0;
  return strs.filter(predicate).length / strs.length;
}

// ---------------------------------------------------------------------------
// Detector 1 — boolean (highest priority)
// ---------------------------------------------------------------------------

const BOOLEAN_TRUE_SET = new Set(['true', 'yes', 'on', '1']);
const BOOLEAN_FALSE_SET = new Set(['false', 'no', 'off', '0']);
const BOOLEAN_ALL = new Set([...BOOLEAN_TRUE_SET, ...BOOLEAN_FALSE_SET]);

/**
 * Detects boolean columns: true/false, yes/no, on/off, 1/0 (actual boolean or string).
 * Actual boolean values also match. Numeric 1/0 match only when the column does not
 * look like a plain integer (handled by the priority order — integer runs after boolean,
 * but boolean runs first, so a 1/0 column is captured here).
 */
export function detectBoolean(samples: unknown[], _columnKey: string): DetectorResult {
  const strs = nonNullStrings(samples);
  if (strs.length === 0) return null;

  // Also accept actual booleans that were already coerced to string
  const isBoolean = (s: string) => BOOLEAN_ALL.has(s.toLowerCase());
  const ratio = strs.filter(isBoolean).length / strs.length;

  if (ratio >= 0.9) return { type: 'boolean', confidence: 0.95 };
  if (ratio >= 0.7) return { type: 'boolean', confidence: 0.8 };
  return null;
}

// ---------------------------------------------------------------------------
// Detector 2 — currency
// ---------------------------------------------------------------------------

// Currency symbols and common ISO codes that appear inline
const CURRENCY_SYMBOL_RE = /^[$€£¥₹][\d,. ]+$|^[\d,. ]+[$€£¥₹]$|[\d,. ]+(USD|EUR|GBP|JPY|INR|CAD|AUD|CHF|CNY|MXN)\s*$/i;

export function detectCurrency(samples: unknown[], _columnKey: string): DetectorResult {
  const ratio = matchRatio(samples, (s) => CURRENCY_SYMBOL_RE.test(s));
  if (ratio >= 0.9) return { type: 'currency', confidence: 0.95 };
  if (ratio >= 0.7) return { type: 'currency', confidence: 0.8 };
  return null;
}

// ---------------------------------------------------------------------------
// Detector 3 — percentage
// ---------------------------------------------------------------------------

const PERCENTAGE_SUFFIX_RE = /^-?[\d,.]+\s*%$/;
// 0–1 decimal values — only triggered when column name hints at it (via boost)
const DECIMAL_FRACTION_RE = /^-?0?\.\d+$|^-?1\.0+$|^-?[01](\.\d+)?$/;

export function detectPercentage(samples: unknown[], columnKey: string): DetectorResult {
  const strs = nonNullStrings(samples);
  if (strs.length === 0) return null;

  // Hard signal: values with % suffix
  const withPercent = strs.filter((s) => PERCENTAGE_SUFFIX_RE.test(s)).length / strs.length;
  if (withPercent >= 0.9) return { type: 'percentage', confidence: 0.95 };
  if (withPercent >= 0.7) return { type: 'percentage', confidence: 0.8 };

  // Soft signal: 0–1 decimal values when column name is rate/ratio/pct/percent/percentage
  const lower = columnKey.toLowerCase();
  const hasRateKeyword = ['rate', 'ratio', 'pct', 'percent', 'percentage'].some((kw) =>
    lower.includes(kw)
  );
  if (hasRateKeyword) {
    const decimalRatio = strs.filter((s) => DECIMAL_FRACTION_RE.test(s)).length / strs.length;
    if (decimalRatio >= 0.9) return { type: 'percentage', confidence: 0.85 };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Detector 4 — integer
// ---------------------------------------------------------------------------

/** Integer: whole number, no decimal, no currency symbol */
const INTEGER_RE = /^-?\d+$/;

export function detectInteger(samples: unknown[], _columnKey: string): DetectorResult {
  const strs = nonNullStrings(samples);
  if (strs.length === 0) return null;

  // Reject if any sample looks like a currency value
  const hasCurrency = strs.some((s) => CURRENCY_SYMBOL_RE.test(s));
  if (hasCurrency) return null;

  const ratio = strs.filter((s) => INTEGER_RE.test(s.replace(/,/g, ''))).length / strs.length;
  if (ratio >= 0.9) return { type: 'integer', confidence: 0.95 };
  if (ratio >= 0.7) return { type: 'integer', confidence: 0.8 };
  return null;
}

// ---------------------------------------------------------------------------
// Detector 5 — number (generic decimal)
// ---------------------------------------------------------------------------

/** Numeric with optional decimal, no currency symbol */
const NUMBER_RE = /^-?[\d,]+\.?\d*$|^-?\.\d+$/;

export function detectNumber(samples: unknown[], _columnKey: string): DetectorResult {
  const strs = nonNullStrings(samples);
  if (strs.length === 0) return null;

  const hasCurrency = strs.some((s) => CURRENCY_SYMBOL_RE.test(s));
  if (hasCurrency) return null;

  const ratio = strs.filter((s) => NUMBER_RE.test(s.replace(/,/g, ''))).length / strs.length;
  if (ratio >= 0.9) return { type: 'number', confidence: 0.9 };
  if (ratio >= 0.7) return { type: 'number', confidence: 0.8 };
  return null;
}

// ---------------------------------------------------------------------------
// Detector 6 — datetime
// ---------------------------------------------------------------------------

/** ISO 8601 datetime with T separator (date + time component) */
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export function detectDatetime(samples: unknown[], _columnKey: string): DetectorResult {
  const ratio = matchRatio(samples, (s) => DATETIME_RE.test(s));
  if (ratio >= 0.9) return { type: 'datetime', confidence: 0.95 };
  if (ratio >= 0.7) return { type: 'datetime', confidence: 0.8 };
  return null;
}

// ---------------------------------------------------------------------------
// Detector 7 — date
// ---------------------------------------------------------------------------

/** ISO 8601 date-only YYYY-MM-DD — must not contain T (datetime has higher priority) */
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function detectDate(samples: unknown[], _columnKey: string): DetectorResult {
  const strs = nonNullStrings(samples);
  if (strs.length === 0) return null;

  // If any sample contains T, let detectDatetime handle it
  const hasDatetime = strs.some((s) => DATETIME_RE.test(s));
  if (hasDatetime) return null;

  const ratio = strs.filter((s) => DATE_ONLY_RE.test(s)).length / strs.length;
  if (ratio >= 0.9) return { type: 'date', confidence: 0.95 };
  if (ratio >= 0.7) return { type: 'date', confidence: 0.8 };
  return null;
}

// ---------------------------------------------------------------------------
// Detector 8 — time
// ---------------------------------------------------------------------------

/** HH:MM or HH:MM:SS pattern */
const TIME_RE = /^\d{1,2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;

export function detectTime(samples: unknown[], _columnKey: string): DetectorResult {
  const strs = nonNullStrings(samples);
  if (strs.length === 0) return null;

  // Exclude strings that look like dates or datetimes
  const hasDatePart = strs.some((s) => /\d{4}-\d{2}-\d{2}/.test(s));
  if (hasDatePart) return null;

  const ratio = strs.filter((s) => TIME_RE.test(s)).length / strs.length;
  if (ratio >= 0.9) return { type: 'time', confidence: 0.95 };
  if (ratio >= 0.7) return { type: 'time', confidence: 0.8 };
  return null;
}

// ---------------------------------------------------------------------------
// Detector 9 — email
// ---------------------------------------------------------------------------

/** Basic email pattern: local@domain.tld */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function detectEmail(samples: unknown[], _columnKey: string): DetectorResult {
  const ratio = matchRatio(samples, (s) => EMAIL_RE.test(s));
  if (ratio >= 0.9) return { type: 'email', confidence: 0.95 };
  if (ratio >= 0.7) return { type: 'email', confidence: 0.8 };
  return null;
}

// ---------------------------------------------------------------------------
// Detector 10 — phone
// ---------------------------------------------------------------------------

/** Phone: 7–15 digits, optional +, (), -, space separators */
const PHONE_DIGIT_RE = /\d/g;

function isPhoneNumber(s: string): boolean {
  // Must have 7–15 digits
  const digits = s.match(PHONE_DIGIT_RE);
  if (!digits || digits.length < 7 || digits.length > 15) return false;
  // Must consist only of digits, spaces, (), -, +, .
  return /^[+\d\s().\\-]+$/.test(s);
}

export function detectPhone(samples: unknown[], _columnKey: string): DetectorResult {
  const strs = nonNullStrings(samples);
  if (strs.length === 0) return null;

  // Exclude email addresses — they have an @ and would pass digit check
  const hasEmails = strs.some((s) => EMAIL_RE.test(s));
  if (hasEmails) return null;

  const ratio = strs.filter(isPhoneNumber).length / strs.length;
  if (ratio >= 0.9) return { type: 'phone', confidence: 0.9 };
  if (ratio >= 0.7) return { type: 'phone', confidence: 0.8 };
  return null;
}

// ---------------------------------------------------------------------------
// Detector 11 — image
// ---------------------------------------------------------------------------

const IMAGE_EXTENSION_RE = /\.(jpg|jpeg|png|gif|svg|webp|avif|bmp|ico|tiff?)(\?.*)?$/i;
const IMAGE_PATH_RE = /\/images?\/|\/img\/|\/photos?\/|\/avatars?\/|\/thumbnails?\/|cdn\./i;
// Known image CDN hostnames (no extension in URL but always serve images)
const IMAGE_CDN_RE =
  /(?:pravatar\.cc|dicebear\.com|gravatar\.com|ui-avatars\.com|randomuser\.me|picsum\.photos|unsplash\.com|images\.unsplash\.com|cloudinary\.com|imgix\.net|imagekit\.io|res\.cloudinary\.com|twimg\.com|pbs\.twimg\.com|github\.com\/identicons)/i;

function isImageUrl(s: string): boolean {
  if (s.startsWith('data:image/')) return true;
  return IMAGE_EXTENSION_RE.test(s) || IMAGE_PATH_RE.test(s) || IMAGE_CDN_RE.test(s);
}

export function detectImage(samples: unknown[], _columnKey: string): DetectorResult {
  const ratio = matchRatio(samples, isImageUrl);
  if (ratio >= 0.9) return { type: 'image', confidence: 0.9 };
  if (ratio >= 0.7) return { type: 'image', confidence: 0.8 };
  return null;
}

// ---------------------------------------------------------------------------
// Detector 12 — url
// ---------------------------------------------------------------------------

const URL_PROTOCOL_RE = /^https?:\/\//i;

export function detectUrl(samples: unknown[], _columnKey: string): DetectorResult {
  const strs = nonNullStrings(samples);
  if (strs.length === 0) return null;

  // Exclude email addresses
  const hasEmails = strs.some((s) => EMAIL_RE.test(s));
  if (hasEmails) return null;

  const ratio = strs.filter((s) => URL_PROTOCOL_RE.test(s)).length / strs.length;
  if (ratio >= 0.9) return { type: 'url', confidence: 0.9 };
  if (ratio >= 0.7) return { type: 'url', confidence: 0.8 };
  return null;
}

// ---------------------------------------------------------------------------
// Detector 13 — status
// ---------------------------------------------------------------------------

/**
 * Status: low-cardinality string column.
 * Fires when: <= 10 unique values, all strings, all values <= 20 chars.
 * Numeric columns are already captured by higher-priority detectors.
 */
export function detectStatus(samples: unknown[], _columnKey: string): DetectorResult {
  const strs = nonNullStrings(samples);
  if (strs.length === 0) return null;

  // All values must be short strings
  if (strs.some((s) => s.length > 20)) return null;

  // Reject if values look numeric (integer/number detectors have higher priority,
  // but explicit check guards against edge cases where the chain reaches here)
  if (strs.every((s) => NUMBER_RE.test(s.replace(/,/g, '')))) return null;

  const uniqueValues = new Set(strs.map((s) => s.toLowerCase()));
  if (uniqueValues.size > 10) return null;

  // Confidence is inversely proportional to cardinality
  const cardinalityScore = 1 - uniqueValues.size / 10;
  const confidence = 0.7 + cardinalityScore * 0.2; // range: 0.72–0.9
  if (confidence >= 0.8) return { type: 'status', confidence };
  return null;
}

// ---------------------------------------------------------------------------
// Detector 14 — code
// ---------------------------------------------------------------------------

/** Code patterns: braces, arrow functions, "function" keyword, multi-line */
const CODE_PATTERNS = [
  /[{}]/,
  /=>/,
  /\bfunction\b/,
  /\bconst\b|\blet\b|\bvar\b/,
  /\bif\s*\(/,
  /\breturn\b/,
];

export function detectCode(samples: unknown[], _columnKey: string): DetectorResult {
  const strs = nonNullStrings(samples);
  if (strs.length === 0) return null;

  // Require strings that have multiple lines or match code patterns
  function isCodeLike(s: string): boolean {
    const isMultiLine = s.includes('\n');
    const matchesPattern = CODE_PATTERNS.some((re) => re.test(s));
    return isMultiLine && matchesPattern;
  }

  const ratio = strs.filter(isCodeLike).length / strs.length;
  if (ratio >= 0.9) return { type: 'code', confidence: 0.9 };
  if (ratio >= 0.7) return { type: 'code', confidence: 0.8 };
  return null;
}

// ---------------------------------------------------------------------------
// Detector 15 — text (fallback, always returns 0.5)
// ---------------------------------------------------------------------------

/**
 * Text fallback — always returns type 'text' with confidence 0.5.
 * Never returns null. This is the final catch-all in the detector chain.
 */
export function detectText(_samples: unknown[], _columnKey: string): DetectorResult {
  return { type: 'text', confidence: 0.5 };
}

// ---------------------------------------------------------------------------
// CORE-04: Keyword boost map
// ---------------------------------------------------------------------------

/** Maps column key substrings to { ColumnType, boost amount } */
const KEYWORD_BOOSTS: ReadonlyArray<{
  keywords: readonly string[];
  type: ColumnType;
  boost: number;
}> = [
  { keywords: ['avatar', 'photo', 'image', 'img', 'picture', 'thumbnail'], type: 'image', boost: 0.15 },
  { keywords: ['email', 'mail'], type: 'email', boost: 0.15 },
  { keywords: ['phone', 'tel', 'mobile', 'cell'], type: 'phone', boost: 0.15 },
  { keywords: ['url', 'link', 'href', 'website'], type: 'url', boost: 0.15 },
  { keywords: ['price', 'cost', 'amount', 'fee', 'salary', 'revenue', 'income'], type: 'currency', boost: 0.15 },
  { keywords: ['date', 'created', 'updated', 'timestamp', 'born'], type: 'date', boost: 0.15 },
  { keywords: ['status', 'state', 'stage', 'phase'], type: 'status', boost: 0.15 },
  { keywords: ['rate', 'ratio', 'pct', 'percent', 'percentage'], type: 'percentage', boost: 0.15 },
];

/**
 * Compute the keyword boost map for a given column key.
 * Returns a partial record mapping ColumnType → boost amount (0.15).
 * Multiple matches accumulate (edge case: column named "email_rate" boosts both email and percentage).
 *
 * Special handling: "_at" suffix (created_at, updated_at) boosts 'date' — not matched as substring
 * to avoid false matches on words like "avatar" or "rate".
 */
export function getBoostMap(columnKey: string): Partial<Record<ColumnType, number>> {
  const lower = columnKey.toLowerCase();
  const boost: Partial<Record<ColumnType, number>> = {};
  for (const { keywords, type, boost: amount } of KEYWORD_BOOSTS) {
    if (keywords.some((kw) => lower.includes(kw))) {
      boost[type] = amount;
    }
  }
  // "_at" suffix boost for date (e.g. created_at, updated_at, published_at)
  if (/_at$/.test(lower) || lower === 'at') {
    boost['date'] = 0.15;
  }
  return boost;
}

// ---------------------------------------------------------------------------
// DETECTORS — priority-ordered array (CORE-03)
// ---------------------------------------------------------------------------

/**
 * Ordered detector chain — first entry has highest priority.
 * runDetectors() iterates this array and stops at the first detector that
 * returns a result with confidence >= CONFIDENCE_THRESHOLD.
 */
export const DETECTORS: readonly DetectorFn[] = [
  detectBoolean,     // 1 — highest priority
  detectCurrency,    // 2
  detectPercentage,  // 3
  detectInteger,     // 4
  detectNumber,      // 5
  detectDatetime,    // 6
  detectDate,        // 7
  detectTime,        // 8
  detectEmail,       // 9
  detectPhone,       // 10
  detectImage,       // 11
  detectUrl,         // 12
  detectStatus,      // 13
  detectCode,        // 14
  detectText,        // 15 — fallback, always matches
] as const;
