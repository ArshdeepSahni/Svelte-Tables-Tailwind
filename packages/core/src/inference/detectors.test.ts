/**
 * CORE-03, CORE-04: Type detector tests
 * Wave 0 stubs — all tests are placeholders (it.todo) until detectors.ts exists.
 * Once detectors.ts is created, tests are replaced with real assertions.
 */
import { describe, it } from 'vitest';

// Imports activated in Task 2 once detectors.ts is implemented
// import { detectBoolean, detectCurrency, detectPercentage, detectInteger, detectNumber,
//   detectDatetime, detectDate, detectTime, detectEmail, detectPhone, detectImage,
//   detectUrl, detectStatus, detectCode, detectText, getBoostMap, DETECTORS } from './detectors.js';

describe('detectBoolean', () => {
  it.todo('returns boolean type for actual true/false values');
  it.todo('returns boolean type for "yes"/"no" strings (case-insensitive)');
  it.todo('returns boolean type for "on"/"off" strings');
  it.todo('returns boolean type for 1/0 numeric values');
  it.todo('returns null for mixed non-boolean values');
  it.todo('high confidence (>= 0.9) when all samples match');
});

describe('detectCurrency', () => {
  it.todo('detects $ prefixed values like "$42.00"');
  it.todo('detects euro sign € prefixed values');
  it.todo('detects pound sign £ prefixed values');
  it.todo('detects yen ¥ prefixed values');
  it.todo('detects rupee ₹ prefixed values');
  it.todo('detects "42 USD" / "42 EUR" suffix patterns');
  it.todo('returns null for plain numbers without currency markers');
  it.todo('returns null for non-numeric strings');
});

describe('detectPercentage', () => {
  it.todo('detects "42%" values');
  it.todo('detects "0.75" when column name contains "rate"');
  it.todo('detects "0.5" when column name contains "ratio"');
  it.todo('detects "0.1" when column name contains "pct"');
  it.todo('returns null for plain numbers without % or rate/ratio/pct/percent column name');
  it.todo('returns null for currency values that happen to contain %');
});

describe('detectInteger', () => {
  it.todo('detects whole numbers with no decimal part');
  it.todo('detects string "42" as integer');
  it.todo('detects negative integers like -7');
  it.todo('returns null for "42.5" (has decimal)');
  it.todo('returns null for currency strings like "$42"');
  it.todo('returns null for non-numeric strings');
});

describe('detectNumber', () => {
  it.todo('detects numeric values with decimal places like "3.14"');
  it.todo('detects negative numbers like -2.5');
  it.todo('detects whole numbers (but integer detector has higher priority)');
  it.todo('returns null for non-numeric strings');
  it.todo('returns null for currency strings');
});

describe('detectDatetime', () => {
  it.todo('detects ISO 8601 datetime with T separator "2024-01-15T10:30:00Z"');
  it.todo('detects ISO datetime with milliseconds "2024-01-15T10:30:00.000Z"');
  it.todo('detects datetime without Z suffix "2024-01-15T10:30:00"');
  it.todo('returns null for date-only strings like "2024-01-15"');
  it.todo('returns null for plain text');
});

describe('detectDate', () => {
  it.todo('detects "2024-01-15" ISO date format');
  it.todo('detects "2024-12-31" end of year date');
  it.todo('returns null for datetime strings (datetime has higher priority in chain)');
  it.todo('returns null for non-date strings');
  it.todo('returns null for time strings');
});

describe('detectTime', () => {
  it.todo('detects "14:30" HH:MM format');
  it.todo('detects "09:05:33" HH:MM:SS format');
  it.todo('detects "00:00" midnight');
  it.todo('returns null for date strings');
  it.todo('returns null for plain text');
});

describe('detectEmail', () => {
  it.todo('detects valid email "user@example.com"');
  it.todo('detects email with subdomain "user@mail.example.com"');
  it.todo('detects email with + "user+tag@example.com"');
  it.todo('returns null for strings without @');
  it.todo('returns null for strings missing domain');
  it.todo('returns null for plain text');
});

describe('detectPhone', () => {
  it.todo('detects "+1 (555) 123-4567"');
  it.todo('detects "5551234567" (10 digits)');
  it.todo('detects "+447911123456" (international format)');
  it.todo('returns null for strings with too few digits (< 7)');
  it.todo('returns null for plain text without digits');
  it.todo('returns null for email addresses');
});

describe('detectImage', () => {
  it.todo('detects URLs ending in .jpg');
  it.todo('detects URLs ending in .jpeg');
  it.todo('detects URLs ending in .png');
  it.todo('detects URLs ending in .gif');
  it.todo('detects URLs ending in .svg');
  it.todo('detects URLs ending in .webp');
  it.todo('detects URLs containing /images/ path segment');
  it.todo('detects URLs containing /img/ path segment');
  it.todo('detects URLs containing cdn. subdomain');
  it.todo('returns null for non-image URLs (https://example.com)');
  it.todo('returns null for plain text');
});

describe('detectUrl', () => {
  it.todo('detects https:// URLs');
  it.todo('detects http:// URLs');
  it.todo('returns null for strings without protocol');
  it.todo('returns null for email addresses (email detector fires first)');
  it.todo('returns null for plain text');
});

describe('detectStatus', () => {
  it.todo('detects low-cardinality column with 3 unique string values');
  it.todo('detects low-cardinality column with exactly 10 unique values (boundary)');
  it.todo('returns null for high-cardinality columns with > 10 unique values');
  it.todo('returns null for columns with values longer than 20 chars');
  it.todo('returns null for numeric columns (integer detector fires first in chain)');
  it.todo('confidence is proportional to cardinality ratio');
});

describe('detectCode', () => {
  it.todo('detects multi-line strings with { } braces');
  it.todo('detects strings containing => arrow functions');
  it.todo('detects strings containing "function" keyword');
  it.todo('returns null for plain text paragraphs without code patterns');
  it.todo('returns null for short strings');
});

describe('detectText', () => {
  it.todo('always returns type "text" with confidence 0.5');
  it.todo('works for any input — never returns null');
  it.todo('works for empty samples array');
});

describe('getBoostMap', () => {
  it.todo('returns { image: 0.15 } for column key "avatar"');
  it.todo('returns { image: 0.15 } for column key "photo"');
  it.todo('returns { image: 0.15 } for column key "image"');
  it.todo('returns { image: 0.15 } for column key "thumbnail"');
  it.todo('returns { email: 0.15 } for column key "email"');
  it.todo('returns { email: 0.15 } for column key "user_email" (substring match)');
  it.todo('returns { email: 0.15 } for column key "mail"');
  it.todo('returns { phone: 0.15 } for column key "phone"');
  it.todo('returns { phone: 0.15 } for column key "mobile"');
  it.todo('returns { phone: 0.15 } for column key "tel"');
  it.todo('returns { url: 0.15 } for column key "website"');
  it.todo('returns { url: 0.15 } for column key "link"');
  it.todo('returns { url: 0.15 } for column key "href"');
  it.todo('returns { currency: 0.15 } for column key "price"');
  it.todo('returns { currency: 0.15 } for column key "salary"');
  it.todo('returns { currency: 0.15 } for column key "amount"');
  it.todo('returns { date: 0.15 } for column key "created_at" (contains "at")');
  it.todo('returns { date: 0.15 } for column key "updated_at"');
  it.todo('returns { date: 0.15 } for column key "birthdate" (contains "date")');
  it.todo('returns { status: 0.15 } for column key "status"');
  it.todo('returns { status: 0.15 } for column key "state"');
  it.todo('returns { percentage: 0.15 } for column key "rate"');
  it.todo('returns { percentage: 0.15 } for column key "ratio"');
  it.todo('returns { percentage: 0.15 } for column key "pct"');
  it.todo('returns {} for column key "foo" (no matching keyword)');
  it.todo('returns {} for empty string column key');
  it.todo('is case-insensitive — "EMAIL" matches email boost');
});

describe('DETECTORS array', () => {
  it.todo('has exactly 15 detector functions');
  it.todo('detectBoolean is first (index 0)');
  it.todo('detectText is last (index 14)');
  it.todo('detectCurrency is at index 1 (second)');
  it.todo('detectUrl is before detectStatus in priority order');
});
