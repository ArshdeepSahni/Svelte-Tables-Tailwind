/**
 * CORE-03, CORE-04: Type detector tests
 * Tests all 15 detectors and keyword boost map.
 */
import { describe, it, expect } from 'vitest';
import {
  detectBoolean,
  detectCurrency,
  detectPercentage,
  detectInteger,
  detectNumber,
  detectDatetime,
  detectDate,
  detectTime,
  detectEmail,
  detectPhone,
  detectImage,
  detectUrl,
  detectStatus,
  detectCode,
  detectText,
  getBoostMap,
  DETECTORS,
} from './detectors.js';

// ---------------------------------------------------------------------------
// Helper: fill an array to simulate a full column sample
// ---------------------------------------------------------------------------
function col(values: unknown[]): unknown[] {
  return values;
}

// ---------------------------------------------------------------------------
// detectBoolean
// ---------------------------------------------------------------------------

describe('detectBoolean', () => {
  it('returns boolean type for actual true/false values', () => {
    const result = detectBoolean(col(['true', 'false', 'true', 'false', 'true']), 'active');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('boolean');
    expect(result!.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('returns boolean type for "yes"/"no" strings (case-insensitive)', () => {
    const result = detectBoolean(col(['Yes', 'No', 'YES', 'NO', 'yes']), 'subscribed');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('boolean');
  });

  it('returns boolean type for "on"/"off" strings', () => {
    const result = detectBoolean(col(['on', 'off', 'on', 'on', 'off']), 'toggle');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('boolean');
  });

  it('returns boolean type for 1/0 numeric values (as strings)', () => {
    const result = detectBoolean(col(['1', '0', '1', '1', '0']), 'flag');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('boolean');
  });

  it('returns null for mixed non-boolean values', () => {
    const result = detectBoolean(col(['hello', 'world', 'foo', 'bar', 'baz']), 'name');
    expect(result).toBeNull();
  });

  it('high confidence (>= 0.9) when all samples match', () => {
    const result = detectBoolean(
      col(Array(20).fill('true').concat(Array(20).fill('false'))),
      'flag'
    );
    expect(result).not.toBeNull();
    expect(result!.confidence).toBeGreaterThanOrEqual(0.9);
  });
});

// ---------------------------------------------------------------------------
// detectCurrency
// ---------------------------------------------------------------------------

describe('detectCurrency', () => {
  it('detects $ prefixed values like "$42.00"', () => {
    const result = detectCurrency(col(['$42.00', '$10.50', '$99.99', '$0.01', '$1000.00']), 'price');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('currency');
  });

  it('detects euro sign € prefixed values', () => {
    const result = detectCurrency(col(['€42.00', '€10.50', '€99.99', '€0.01', '€200.00']), 'price');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('currency');
  });

  it('detects pound sign £ prefixed values', () => {
    const result = detectCurrency(col(['£100', '£250', '£75.50', '£1000', '£50']), 'amount');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('currency');
  });

  it('detects yen ¥ prefixed values', () => {
    const result = detectCurrency(col(['¥1000', '¥500', '¥2500', '¥100', '¥800']), 'price');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('currency');
  });

  it('detects rupee ₹ prefixed values', () => {
    const result = detectCurrency(col(['₹500', '₹1200', '₹750', '₹300', '₹600']), 'price');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('currency');
  });

  it('detects USD suffix patterns like "42 USD"', () => {
    const result = detectCurrency(col(['42 USD', '10.50 USD', '99.99 USD', '0.01 USD', '1000 USD']), 'col');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('currency');
  });

  it('returns null for plain numbers without currency markers', () => {
    const result = detectCurrency(col(['42.00', '10.50', '99.99', '0.01', '1000.00']), 'col');
    expect(result).toBeNull();
  });

  it('returns null for non-numeric strings', () => {
    const result = detectCurrency(col(['hello', 'world', 'foo', 'bar', 'baz']), 'col');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// detectPercentage
// ---------------------------------------------------------------------------

describe('detectPercentage', () => {
  it('detects "42%" values', () => {
    const result = detectPercentage(col(['42%', '15%', '80%', '7%', '100%']), 'discount');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('percentage');
  });

  it('detects "0.75" when column name contains "rate"', () => {
    const result = detectPercentage(col(['0.75', '0.5', '0.25', '0.9', '0.1']), 'rate');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('percentage');
  });

  it('detects "0.5" when column name contains "ratio"', () => {
    const result = detectPercentage(col(['0.5', '0.3', '0.8', '0.2', '0.6']), 'ratio');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('percentage');
  });

  it('detects values when column name contains "pct"', () => {
    const result = detectPercentage(col(['0.1', '0.2', '0.3', '0.4', '0.5']), 'tax_pct');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('percentage');
  });

  it('returns null for plain numbers without % or rate/ratio column name', () => {
    const result = detectPercentage(col(['0.75', '0.5', '0.25', '0.9', '0.1']), 'amount');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// detectInteger
// ---------------------------------------------------------------------------

describe('detectInteger', () => {
  it('detects whole numbers with no decimal part', () => {
    const result = detectInteger(col([42, 7, 100, 0, 999]), 'count');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('integer');
  });

  it('detects string "42" as integer', () => {
    const result = detectInteger(col(['42', '7', '100', '0', '999']), 'id');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('integer');
  });

  it('detects negative integers like -7', () => {
    const result = detectInteger(col(['-7', '-42', '-100', '0', '1']), 'delta');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('integer');
  });

  it('returns null for "42.5" (has decimal)', () => {
    const result = detectInteger(col(['42.5', '7.3', '100.1', '0.0', '999.9']), 'col');
    expect(result).toBeNull();
  });

  it('returns null for currency strings like "$42"', () => {
    const result = detectInteger(col(['$42', '$7', '$100', '$0', '$999']), 'col');
    expect(result).toBeNull();
  });

  it('returns null for non-numeric strings', () => {
    const result = detectInteger(col(['hello', 'world', 'foo', 'bar', 'baz']), 'col');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// detectNumber
// ---------------------------------------------------------------------------

describe('detectNumber', () => {
  it('detects numeric values with decimal places like "3.14"', () => {
    const result = detectNumber(col(['3.14', '2.71', '1.41', '0.57', '6.28']), 'value');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('number');
  });

  it('detects negative numbers like -2.5', () => {
    const result = detectNumber(col(['-2.5', '-7.3', '-0.5', '1.2', '0.0']), 'delta');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('number');
  });

  it('returns null for non-numeric strings', () => {
    const result = detectNumber(col(['hello', 'world', 'foo', 'bar', 'baz']), 'col');
    expect(result).toBeNull();
  });

  it('returns null for currency strings', () => {
    const result = detectNumber(col(['$42.00', '$10.50', '$99.99']), 'col');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// detectDatetime
// ---------------------------------------------------------------------------

describe('detectDatetime', () => {
  it('detects ISO 8601 datetime with T separator "2024-01-15T10:30:00Z"', () => {
    const result = detectDatetime(
      col(['2024-01-15T10:30:00Z', '2024-06-20T14:00:00Z', '2023-12-01T08:00:00Z']),
      'created_at'
    );
    expect(result).not.toBeNull();
    expect(result!.type).toBe('datetime');
  });

  it('detects ISO datetime with milliseconds "2024-01-15T10:30:00.000Z"', () => {
    const result = detectDatetime(
      col(['2024-01-15T10:30:00.000Z', '2024-06-20T14:00:00.123Z']),
      'timestamp'
    );
    expect(result).not.toBeNull();
    expect(result!.type).toBe('datetime');
  });

  it('detects datetime without Z suffix', () => {
    const result = detectDatetime(
      col(['2024-01-15T10:30:00', '2024-06-20T14:00:00', '2023-12-01T08:15:00']),
      'at'
    );
    expect(result).not.toBeNull();
    expect(result!.type).toBe('datetime');
  });

  it('returns null for date-only strings like "2024-01-15"', () => {
    const result = detectDatetime(col(['2024-01-15', '2024-06-20', '2023-12-01']), 'date');
    expect(result).toBeNull();
  });

  it('returns null for plain text', () => {
    const result = detectDatetime(col(['hello', 'world', 'foo']), 'col');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// detectDate
// ---------------------------------------------------------------------------

describe('detectDate', () => {
  it('detects "2024-01-15" ISO date format', () => {
    const result = detectDate(col(['2024-01-15', '2024-06-20', '2023-12-01']), 'dob');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('date');
  });

  it('detects "2024-12-31" end of year date', () => {
    const result = detectDate(col(['2024-12-31', '2023-01-01', '2025-07-04']), 'date');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('date');
  });

  it('returns null when any sample has datetime format (datetime has higher priority in chain)', () => {
    // detectDate itself defers when it sees a T in any sample
    const result = detectDate(col(['2024-01-15T10:30:00Z', '2024-06-20T14:00:00Z']), 'col');
    expect(result).toBeNull();
  });

  it('returns null for non-date strings', () => {
    const result = detectDate(col(['hello', 'world', 'foo']), 'col');
    expect(result).toBeNull();
  });

  it('returns null for time strings', () => {
    const result = detectDate(col(['14:30', '09:00', '23:59']), 'col');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// detectTime
// ---------------------------------------------------------------------------

describe('detectTime', () => {
  it('detects "14:30" HH:MM format', () => {
    const result = detectTime(col(['14:30', '09:05', '23:59', '00:00', '12:45']), 'hour');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('time');
  });

  it('detects "09:05:33" HH:MM:SS format', () => {
    const result = detectTime(col(['09:05:33', '14:30:00', '23:59:59', '00:00:01']), 'time');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('time');
  });

  it('detects "00:00" midnight', () => {
    const result = detectTime(col(['00:00', '00:30', '01:00', '06:00', '12:00']), 'col');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('time');
  });

  it('returns null for date strings', () => {
    const result = detectTime(col(['2024-01-15', '2024-06-20']), 'col');
    expect(result).toBeNull();
  });

  it('returns null for plain text', () => {
    const result = detectTime(col(['hello', 'world', 'foo']), 'col');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// detectEmail
// ---------------------------------------------------------------------------

describe('detectEmail', () => {
  it('detects valid email "user@example.com"', () => {
    const result = detectEmail(col(['user@example.com', 'alice@test.org', 'bob@mail.net']), 'email');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('email');
  });

  it('detects email with subdomain "user@mail.example.com"', () => {
    const result = detectEmail(
      col(['user@mail.example.com', 'admin@sub.domain.org', 'info@a.b.co']),
      'email'
    );
    expect(result).not.toBeNull();
    expect(result!.type).toBe('email');
  });

  it('detects email with + in local part', () => {
    const result = detectEmail(
      col(['user+tag@example.com', 'alice+work@test.org', 'bob+personal@mail.net']),
      'email'
    );
    expect(result).not.toBeNull();
    expect(result!.type).toBe('email');
  });

  it('returns null for strings without @', () => {
    const result = detectEmail(col(['hello', 'world', 'notanemail']), 'col');
    expect(result).toBeNull();
  });

  it('returns null for plain text', () => {
    const result = detectEmail(col(['hello world', 'foo bar', 'baz qux']), 'col');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// detectPhone
// ---------------------------------------------------------------------------

describe('detectPhone', () => {
  it('detects "+1 (555) 123-4567"', () => {
    const result = detectPhone(
      col(['+1 (555) 123-4567', '+1 (555) 987-6543', '+1 (800) 555-0100']),
      'phone'
    );
    expect(result).not.toBeNull();
    expect(result!.type).toBe('phone');
  });

  it('detects "5551234567" (10 digits)', () => {
    const result = detectPhone(col(['5551234567', '8005551212', '9875554321']), 'mobile');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('phone');
  });

  it('detects "+447911123456" international format', () => {
    const result = detectPhone(col(['+447911123456', '+447700900000', '+447911111111']), 'tel');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('phone');
  });

  it('returns null for strings with too few digits (< 7)', () => {
    const result = detectPhone(col(['123', '4567', '12-34']), 'col');
    expect(result).toBeNull();
  });

  it('returns null for plain text without digits', () => {
    const result = detectPhone(col(['hello', 'world', 'foo']), 'col');
    expect(result).toBeNull();
  });

  it('returns null for email addresses', () => {
    const result = detectPhone(
      col(['user@example.com', 'alice@test.org', 'bob@mail.net']),
      'col'
    );
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// detectImage
// ---------------------------------------------------------------------------

describe('detectImage', () => {
  it('detects URLs ending in .jpg', () => {
    const result = detectImage(
      col(['https://example.com/photo.jpg', 'https://cdn.test.com/img.jpg']),
      'avatar'
    );
    expect(result).not.toBeNull();
    expect(result!.type).toBe('image');
  });

  it('detects URLs ending in .png', () => {
    const result = detectImage(col(['https://example.com/logo.png', 'https://test.com/img.png']), 'col');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('image');
  });

  it('detects URLs ending in .gif', () => {
    const result = detectImage(col(['https://example.com/anim.gif', 'https://test.com/test.gif']), 'col');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('image');
  });

  it('detects URLs ending in .svg', () => {
    const result = detectImage(col(['https://example.com/icon.svg', 'https://test.com/logo.svg']), 'col');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('image');
  });

  it('detects URLs ending in .webp', () => {
    const result = detectImage(col(['https://example.com/img.webp', 'https://test.com/img.webp']), 'col');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('image');
  });

  it('detects URLs containing /images/ path segment', () => {
    const result = detectImage(
      col(['https://example.com/images/user/123', 'https://test.com/images/product/456']),
      'col'
    );
    expect(result).not.toBeNull();
    expect(result!.type).toBe('image');
  });

  it('detects URLs containing /img/ path segment', () => {
    const result = detectImage(
      col(['https://example.com/img/user/123', 'https://test.com/img/product/456']),
      'col'
    );
    expect(result).not.toBeNull();
    expect(result!.type).toBe('image');
  });

  it('detects URLs containing cdn. subdomain', () => {
    const result = detectImage(
      col(['https://cdn.example.com/user/photo', 'https://cdn.test.com/img/456']),
      'col'
    );
    expect(result).not.toBeNull();
    expect(result!.type).toBe('image');
  });

  it('returns null for non-image URLs', () => {
    const result = detectImage(col(['https://example.com/page', 'https://test.com/api']), 'col');
    expect(result).toBeNull();
  });

  it('returns null for plain text', () => {
    const result = detectImage(col(['hello', 'world', 'foo']), 'col');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// detectUrl
// ---------------------------------------------------------------------------

describe('detectUrl', () => {
  it('detects https:// URLs', () => {
    const result = detectUrl(
      col(['https://example.com', 'https://google.com', 'https://github.com']),
      'website'
    );
    expect(result).not.toBeNull();
    expect(result!.type).toBe('url');
  });

  it('detects http:// URLs', () => {
    const result = detectUrl(
      col(['http://example.com', 'http://old.site.org', 'http://legacy.net']),
      'link'
    );
    expect(result).not.toBeNull();
    expect(result!.type).toBe('url');
  });

  it('returns null for strings without protocol', () => {
    const result = detectUrl(col(['example.com', 'google.com', 'github.com']), 'col');
    expect(result).toBeNull();
  });

  it('returns null for email addresses', () => {
    const result = detectUrl(
      col(['user@example.com', 'alice@test.org', 'bob@mail.net']),
      'col'
    );
    expect(result).toBeNull();
  });

  it('returns null for plain text', () => {
    const result = detectUrl(col(['hello', 'world', 'foo']), 'col');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// detectStatus
// ---------------------------------------------------------------------------

describe('detectStatus', () => {
  it('detects low-cardinality column with 3 unique string values', () => {
    const result = detectStatus(
      col(['active', 'inactive', 'pending', 'active', 'inactive', 'active', 'pending', 'active',
        'active', 'inactive']),
      'status'
    );
    expect(result).not.toBeNull();
    expect(result!.type).toBe('status');
  });

  it('detects column with exactly 2 unique values (high confidence)', () => {
    const result = detectStatus(
      col(Array(10).fill('open').concat(Array(10).fill('closed'))),
      'state'
    );
    expect(result).not.toBeNull();
    expect(result!.type).toBe('status');
    expect(result!.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('returns null for high-cardinality columns with > 10 unique values', () => {
    const result = detectStatus(
      col(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k']),
      'col'
    );
    expect(result).toBeNull();
  });

  it('returns null for columns with values longer than 20 chars', () => {
    const result = detectStatus(
      col(['this is a very long status value', 'another very long status value']),
      'col'
    );
    expect(result).toBeNull();
  });

  it('returns null for numeric columns', () => {
    const result = detectStatus(col(['1', '2', '3', '1', '2']), 'col');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// detectCode
// ---------------------------------------------------------------------------

describe('detectCode', () => {
  it('detects multi-line strings with { } braces', () => {
    const codeValue = 'function add(a, b) {\n  return a + b;\n}';
    const result = detectCode(col([codeValue, codeValue, codeValue]), 'snippet');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('code');
  });

  it('detects strings containing => arrow functions', () => {
    const codeValue = 'const fn = (x) => {\n  return x * 2;\n}';
    const result = detectCode(col([codeValue, codeValue, codeValue]), 'handler');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('code');
  });

  it('detects strings containing "function" keyword', () => {
    const codeValue = 'function hello() {\n  console.log("hi");\n}';
    const result = detectCode(col([codeValue, codeValue, codeValue]), 'code');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('code');
  });

  it('returns null for plain text paragraphs without code patterns', () => {
    const text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
    const result = detectCode(col([text, text, text]), 'description');
    expect(result).toBeNull();
  });

  it('returns null for short strings', () => {
    const result = detectCode(col(['hello', 'world', 'short']), 'col');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// detectText
// ---------------------------------------------------------------------------

describe('detectText', () => {
  it('always returns type "text" with confidence 0.5', () => {
    const result = detectText(['anything', 42, null, true], 'col');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('text');
    expect(result!.confidence).toBe(0.5);
  });

  it('works for any input — never returns null', () => {
    expect(detectText([], 'col')).not.toBeNull();
    expect(detectText([null, undefined, ''], 'col')).not.toBeNull();
    expect(detectText([1, 2, 3], 'col')).not.toBeNull();
  });

  it('works for empty samples array', () => {
    const result = detectText([], 'col');
    expect(result!.type).toBe('text');
    expect(result!.confidence).toBe(0.5);
  });
});

// ---------------------------------------------------------------------------
// CORE-04: getBoostMap
// ---------------------------------------------------------------------------

describe('getBoostMap', () => {
  it('returns { image: 0.15 } for column key "avatar"', () => {
    expect(getBoostMap('avatar')).toEqual({ image: 0.15 });
  });

  it('returns { image: 0.15 } for column key "photo"', () => {
    expect(getBoostMap('photo')).toEqual({ image: 0.15 });
  });

  it('returns { image: 0.15 } for column key "image"', () => {
    expect(getBoostMap('image')).toEqual({ image: 0.15 });
  });

  it('returns { image: 0.15 } for column key "thumbnail"', () => {
    expect(getBoostMap('thumbnail')).toEqual({ image: 0.15 });
  });

  it('returns { email: 0.15 } for column key "email"', () => {
    expect(getBoostMap('email')).toEqual({ email: 0.15 });
  });

  it('returns { email: 0.15 } for column key "user_email" (substring match)', () => {
    expect(getBoostMap('user_email')).toEqual({ email: 0.15 });
  });

  it('returns { email: 0.15 } for column key "mail"', () => {
    expect(getBoostMap('mail')).toEqual({ email: 0.15 });
  });

  it('returns { phone: 0.15 } for column key "phone"', () => {
    expect(getBoostMap('phone')).toEqual({ phone: 0.15 });
  });

  it('returns { phone: 0.15 } for column key "mobile"', () => {
    expect(getBoostMap('mobile')).toEqual({ phone: 0.15 });
  });

  it('returns { phone: 0.15 } for column key "tel"', () => {
    expect(getBoostMap('tel')).toEqual({ phone: 0.15 });
  });

  it('returns { url: 0.15 } for column key "website"', () => {
    expect(getBoostMap('website')).toEqual({ url: 0.15 });
  });

  it('returns { url: 0.15 } for column key "link"', () => {
    expect(getBoostMap('link')).toEqual({ url: 0.15 });
  });

  it('returns { url: 0.15 } for column key "href"', () => {
    expect(getBoostMap('href')).toEqual({ url: 0.15 });
  });

  it('returns { currency: 0.15 } for column key "price"', () => {
    expect(getBoostMap('price')).toEqual({ currency: 0.15 });
  });

  it('returns { currency: 0.15 } for column key "salary"', () => {
    expect(getBoostMap('salary')).toEqual({ currency: 0.15 });
  });

  it('returns { currency: 0.15 } for column key "amount"', () => {
    expect(getBoostMap('amount')).toEqual({ currency: 0.15 });
  });

  it('returns { date: 0.15 } for column key "created_at" (contains "at")', () => {
    expect(getBoostMap('created_at')).toMatchObject({ date: 0.15 });
  });

  it('returns { date: 0.15 } for column key "updated_at"', () => {
    expect(getBoostMap('updated_at')).toMatchObject({ date: 0.15 });
  });

  it('returns { date: 0.15 } for column key "birthdate"', () => {
    expect(getBoostMap('birthdate')).toMatchObject({ date: 0.15 });
  });

  it('returns { status: 0.15 } for column key "status"', () => {
    expect(getBoostMap('status')).toMatchObject({ status: 0.15 });
  });

  it('returns { status: 0.15 } for column key "state"', () => {
    expect(getBoostMap('state')).toMatchObject({ status: 0.15 });
  });

  it('returns { percentage: 0.15 } for column key "rate"', () => {
    expect(getBoostMap('rate')).toMatchObject({ percentage: 0.15 });
  });

  it('returns { percentage: 0.15 } for column key "ratio"', () => {
    expect(getBoostMap('ratio')).toMatchObject({ percentage: 0.15 });
  });

  it('returns { percentage: 0.15 } for column key "pct"', () => {
    expect(getBoostMap('pct')).toMatchObject({ percentage: 0.15 });
  });

  it('returns {} for column key "foo" (no matching keyword)', () => {
    expect(getBoostMap('foo')).toEqual({});
  });

  it('returns {} for empty string column key', () => {
    expect(getBoostMap('')).toEqual({});
  });

  it('is case-insensitive — "EMAIL" matches email boost', () => {
    expect(getBoostMap('EMAIL')).toEqual({ email: 0.15 });
  });
});

// ---------------------------------------------------------------------------
// DETECTORS array
// ---------------------------------------------------------------------------

describe('DETECTORS array', () => {
  it('has exactly 15 detector functions', () => {
    expect(DETECTORS.length).toBe(15);
  });

  it('detectBoolean is first (index 0)', () => {
    expect(DETECTORS[0]).toBe(detectBoolean);
  });

  it('detectText is last (index 14)', () => {
    expect(DETECTORS[14]).toBe(detectText);
  });

  it('detectCurrency is at index 1 (second)', () => {
    expect(DETECTORS[1]).toBe(detectCurrency);
  });

  it('detectUrl is before detectStatus in priority order', () => {
    const urlIdx = DETECTORS.indexOf(detectUrl);
    const statusIdx = DETECTORS.indexOf(detectStatus);
    expect(urlIdx).toBeLessThan(statusIdx);
  });
});
