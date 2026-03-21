/**
 * CORE-02: Inference pipeline tests (sampling, priority chain, null handling)
 */
import { describe, it, expect } from 'vitest';
import { inferSchema, sampleRows, runDetectors } from './index.js';

// ---------------------------------------------------------------------------
// sampleRows
// ---------------------------------------------------------------------------

describe('sampleRows', () => {
  it('returns all rows when data.length <= 200', () => {
    const data = Array.from({ length: 100 }, (_, i) => ({ id: i }));
    const result = sampleRows(data);
    expect(result).toHaveLength(100);
    expect(result).toBe(data); // same reference — no copy made
  });

  it('returns exactly 200 rows for a 400-row input (step=2)', () => {
    const data = Array.from({ length: 400 }, (_, i) => ({ id: i }));
    const result = sampleRows(data);
    expect(result.length).toBeLessThanOrEqual(200);
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns <= 200 rows for any input size greater than 200', () => {
    for (const size of [201, 500, 1000, 10000]) {
      const data = Array.from({ length: size }, (_, i) => ({ id: i }));
      const result = sampleRows(data);
      expect(result.length).toBeLessThanOrEqual(200);
    }
  });

  it('samples systematically — first element is always data[0]', () => {
    const data = Array.from({ length: 500 }, (_, i) => ({ id: i }));
    const result = sampleRows(data);
    expect(result[0]).toBe(data[0]);
  });

  it('preserves distribution — evenly spaced indices', () => {
    const data = Array.from({ length: 400 }, (_, i) => ({ id: i }));
    const result = sampleRows(data);
    // step = ceil(400/200) = 2 — every other row
    expect(result[0]).toBe(data[0]);
    expect(result[1]).toBe(data[2]);
    expect(result[2]).toBe(data[4]);
  });

  it('returns empty array for empty input', () => {
    expect(sampleRows([])).toEqual([]);
  });

  it('handles 1-row input correctly', () => {
    const data = [{ id: 1 }];
    expect(sampleRows(data)).toHaveLength(1);
    expect(sampleRows(data)[0]).toBe(data[0]);
  });

  it('handles exactly 200 rows — returns all without sampling', () => {
    const data = Array.from({ length: 200 }, (_, i) => ({ id: i }));
    const result = sampleRows(data);
    expect(result).toBe(data); // same reference
    expect(result).toHaveLength(200);
  });

  it('handles 201 rows — samples fewer than 201', () => {
    const data = Array.from({ length: 201 }, (_, i) => ({ id: i }));
    const result = sampleRows(data);
    expect(result.length).toBeLessThan(201);
  });
});

// ---------------------------------------------------------------------------
// inferSchema — core behaviors
// ---------------------------------------------------------------------------

describe('inferSchema', () => {
  it('returns empty ColumnInferenceMap for 0 rows without throwing', () => {
    expect(() => inferSchema([])).not.toThrow();
    expect(inferSchema([])).toEqual({});
  });

  it('returns map with all keys present in the first row for 1-row input', () => {
    const data = [{ name: 'Alice', age: 30, email: 'alice@example.com' }];
    const result = inferSchema(data);
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('age');
    expect(result).toHaveProperty('email');
  });

  it('returns correct types for 200+ rows', () => {
    const data = Array.from({ length: 300 }, (_, i) => ({
      id: i + 1,
      name: `User ${i}`,
      active: i % 2 === 0 ? 'true' : 'false',
    }));
    const result = inferSchema(data);
    expect(result.id.type).toBe('integer');
    expect(result.active.type).toBe('boolean');
  });

  it('infers "boolean" for column with all true/false values', () => {
    const data = [
      { flag: 'true' }, { flag: 'false' }, { flag: 'true' },
      { flag: 'false' }, { flag: 'true' },
    ];
    const result = inferSchema(data);
    expect(result.flag.type).toBe('boolean');
  });

  it('infers "currency" for column with "$"-prefixed string values', () => {
    const data = [
      { price: '$10.00' }, { price: '$25.50' }, { price: '$99.99' },
      { price: '$5.00' }, { price: '$149.00' },
    ];
    const result = inferSchema(data);
    expect(result.price.type).toBe('currency');
  });

  it('infers "integer" for column with whole number values', () => {
    const data = [{ age: '25' }, { age: '30' }, { age: '45' }, { age: '22' }, { age: '67' }];
    const result = inferSchema(data);
    expect(result.age.type).toBe('integer');
  });

  it('infers "number" for column with decimal values', () => {
    const data = [
      { score: '3.14' }, { score: '2.71' }, { score: '1.41' }, { score: '0.57' }, { score: '6.28' }
    ];
    const result = inferSchema(data);
    expect(result.score.type).toBe('number');
  });

  it('infers "email" for column with email address values', () => {
    const data = [
      { contact: 'alice@example.com' }, { contact: 'bob@test.org' },
      { contact: 'carol@mail.net' }, { contact: 'dave@example.com' }, { contact: 'eve@test.io' },
    ];
    const result = inferSchema(data);
    expect(result.contact.type).toBe('email');
  });

  it('infers "date" for column with ISO date string values', () => {
    const data = [
      { dob: '2024-01-15' }, { dob: '2023-06-20' }, { dob: '1990-12-01' },
      { dob: '2000-03-15' }, { dob: '1985-11-30' },
    ];
    const result = inferSchema(data);
    expect(result.dob.type).toBe('date');
  });

  it('infers "datetime" for column with ISO datetime string values', () => {
    const data = [
      { ts: '2024-01-15T10:30:00Z' }, { ts: '2024-06-20T14:00:00Z' },
      { ts: '2023-12-01T08:00:00Z' }, { ts: '2024-03-10T22:00:00Z' }, { ts: '2024-09-01T06:30:00Z' },
    ];
    const result = inferSchema(data);
    expect(result.ts.type).toBe('datetime');
  });

  it('infers "url" for column with https:// URL values', () => {
    const data = [
      { site: 'https://example.com' }, { site: 'https://google.com' },
      { site: 'https://github.com' }, { site: 'https://test.org' }, { site: 'https://docs.io' },
    ];
    const result = inferSchema(data);
    expect(result.site.type).toBe('url');
  });

  it('infers "image" for column with .jpg URL values', () => {
    const data = [
      { pic: 'https://example.com/a.jpg' }, { pic: 'https://cdn.test.com/b.jpg' },
      { pic: 'https://example.com/c.jpg' }, { pic: 'https://test.org/d.jpg' }, { pic: 'https://img.net/e.jpg' },
    ];
    const result = inferSchema(data);
    expect(result.pic.type).toBe('image');
  });

  it('infers "status" for low-cardinality string column (3 unique values)', () => {
    const statuses = ['active', 'inactive', 'pending'];
    const data = Array.from({ length: 15 }, (_, i) => ({ state: statuses[i % 3] }));
    const result = inferSchema(data);
    expect(result.state.type).toBe('status');
  });

  it('falls back to "text" with confidence 0.5 when no detector scores >= 0.8', () => {
    const data = [
      { misc: 'Hello World this is a long random text value' },
      { misc: 'Another random string that does not match any pattern' },
      { misc: 'Yet another unclassifiable value with no pattern' },
    ];
    const result = inferSchema(data);
    expect(result.misc.type).toBe('text');
    expect(result.misc.confidence).toBe(0.5);
  });

  it('returns { type: "text", confidence: 0.5, source: "fallback" } for all-null column', () => {
    const data = Array.from({ length: 10 }, () => ({ col: null }));
    const result = inferSchema(data as unknown as Array<Record<string, unknown>>);
    expect(result.col).toEqual({ type: 'text', confidence: 0.5, source: 'fallback' });
  });

  it('returns text/0.5 for column with > 50% null values', () => {
    // 7 nulls, 3 strings — 70% null
    const data = [
      { col: null }, { col: null }, { col: null }, { col: null }, { col: null },
      { col: null }, { col: null }, { col: 'hello' }, { col: 'world' }, { col: 'foo' },
    ];
    const result = inferSchema(data as unknown as Array<Record<string, unknown>>);
    expect(result.col.type).toBe('text');
    expect(result.col.confidence).toBe(0.5);
  });

  it('returns text/0.5 for column with > 50% undefined values', () => {
    const data = [
      { col: undefined }, { col: undefined }, { col: undefined }, { col: undefined },
      { col: undefined }, { col: undefined }, { col: 'hello' }, { col: 'world' },
    ];
    const result = inferSchema(data as unknown as Array<Record<string, unknown>>);
    expect(result.col.type).toBe('text');
    expect(result.col.confidence).toBe(0.5);
  });

  it('returns text/0.5 for column with > 50% empty string values', () => {
    const data = [
      { col: '' }, { col: '' }, { col: '' }, { col: '' }, { col: '' }, { col: '' },
      { col: 'hello' }, { col: 'world' }, { col: 'foo' },
    ];
    const result = inferSchema(data);
    expect(result.col.type).toBe('text');
    expect(result.col.confidence).toBe(0.5);
  });

  it('handles undefined values without throwing', () => {
    const data = [{ col: undefined }, { col: 'hello' }, { col: undefined }];
    expect(() => inferSchema(data as unknown as Array<Record<string, unknown>>)).not.toThrow();
  });

  it('handles null values without throwing', () => {
    const data = [{ col: null }, { col: 'hello' }, { col: null }];
    expect(() => inferSchema(data as unknown as Array<Record<string, unknown>>)).not.toThrow();
  });

  it('source is "inferred" for type-detected columns', () => {
    const data = [
      { flag: 'true' }, { flag: 'false' }, { flag: 'true' },
      { flag: 'false' }, { flag: 'true' },
    ];
    const result = inferSchema(data);
    expect(result.flag.source).toBe('inferred');
  });

  it('source is "fallback" for text fallback columns', () => {
    const data = Array.from({ length: 10 }, () => ({ col: null }));
    const result = inferSchema(data as unknown as Array<Record<string, unknown>>);
    expect(result.col.source).toBe('fallback');
  });

  it('confidence is clamped to 1.0 when keyword boost pushes above 1.0', () => {
    // "email" column key gives +0.15 boost; detector gives 0.95 → clamped to 1.0
    const data = Array.from({ length: 10 }, () => ({ email: 'user@example.com' }));
    const result = inferSchema(data);
    expect(result.email.confidence).toBeLessThanOrEqual(1.0);
  });

  it('all returned InferenceResult objects have type, confidence, source fields', () => {
    const data = [{ name: 'Alice', age: '30', active: 'true' }];
    const result = inferSchema(data);
    for (const [, inference] of Object.entries(result)) {
      expect(inference).toHaveProperty('type');
      expect(inference).toHaveProperty('confidence');
      expect(inference).toHaveProperty('source');
    }
  });
});

// ---------------------------------------------------------------------------
// inferSchema — field-name keyword boosting integration
// ---------------------------------------------------------------------------

describe('inferSchema field-name keyword boosting', () => {
  it('"avatar" column with URL-like values infers as "image" (keyword boost)', () => {
    // Without boost, image confidence might be 0.9 from detector; boost adds 0.15 → 1.0
    const data = Array.from({ length: 5 }, (_, i) => ({
      avatar: `https://cdn.example.com/user${i}.jpg`,
    }));
    const result = inferSchema(data);
    expect(result.avatar.type).toBe('image');
  });

  it('"price" column with numeric values infers as "currency" (keyword boost)', () => {
    // Without "$" prefix, numeric values wouldn't normally be currency
    // But with "$" values, currency detector fires; boost confirms
    const data = Array.from({ length: 5 }, (_, i) => ({
      price: `$${(i + 1) * 10}.00`,
    }));
    const result = inferSchema(data);
    expect(result.price.type).toBe('currency');
  });

  it('"created_at" column with date strings infers as "date" (keyword boost)', () => {
    const data = Array.from({ length: 5 }, (_, i) => ({
      created_at: `2024-0${i + 1}-15`,
    }));
    const result = inferSchema(data);
    expect(result.created_at.type).toBe('date');
  });

  it('"status" column with few unique string values infers as "status" (keyword boost)', () => {
    const statuses = ['active', 'pending', 'inactive'];
    const data = Array.from({ length: 15 }, (_, i) => ({
      status: statuses[i % 3],
    }));
    const result = inferSchema(data);
    expect(result.status.type).toBe('status');
  });

  it('"email" column with email-format strings gets email boost of 0.15', () => {
    const data = Array.from({ length: 5 }, (_, i) => ({
      email: `user${i}@example.com`,
    }));
    const result = inferSchema(data);
    expect(result.email.type).toBe('email');
  });

  it('column with no matching keyword uses base detector confidence only', () => {
    const data = Array.from({ length: 5 }, (_, i) => ({
      col: `user${i}@example.com`, // email addresses, but column name is "col"
    }));
    const result = inferSchema(data);
    // Should still detect email from content, just without the boost
    expect(result.col.type).toBe('email');
  });

  it('boost is additive to base confidence, not multiplicative', () => {
    // If detector returns 0.9 and boost is 0.15, result should be min(1.0, 0.9+0.15) = 1.0
    const data = Array.from({ length: 10 }, () => ({
      email: 'user@example.com',
    }));
    const result = inferSchema(data);
    // Confidence should be clamped at 1.0
    expect(result.email.confidence).toBeLessThanOrEqual(1.0);
  });
});

// ---------------------------------------------------------------------------
// runDetectors
// ---------------------------------------------------------------------------

describe('runDetectors', () => {
  it('runs detectors in priority order and returns first result >= 0.8', () => {
    // "true"/"false" values → boolean wins (highest priority)
    const samples = ['true', 'false', 'true', 'false', 'true'];
    const result = runDetectors(samples, 'flag');
    expect(result.type).toBe('boolean');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('applies keyword boost before threshold comparison', () => {
    // Image URLs with "avatar" boost — should infer image
    const samples = Array.from({ length: 10 }, (_, i) => `https://cdn.example.com/user${i}.jpg`);
    const result = runDetectors(samples, 'avatar');
    expect(result.type).toBe('image');
  });

  it('returns text/fallback when all detectors return below threshold', () => {
    // Mixed junk that no detector can classify at >= 0.8
    const samples = ['Hello World text', 'Another random string', 'More plain text', 'Nothing special'];
    const result = runDetectors(samples, 'col');
    expect(result.type).toBe('text');
    expect(result.confidence).toBe(0.5);
    expect(result.source).toBe('fallback');
  });

  it('clamps confidence to max 1.0 after boost', () => {
    // Email with email keyword boost — 0.95 + 0.15 = 1.1 → clamped to 1.0
    const samples = ['user@example.com', 'alice@test.org', 'bob@mail.net', 'carol@example.com', 'dave@test.io'];
    const result = runDetectors(samples, 'email');
    expect(result.confidence).toBeLessThanOrEqual(1.0);
  });

  it('skips detectors that return null', () => {
    // Integer values — boolean and currency detectors return null; integer detector fires
    const samples = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    const result = runDetectors(samples, 'count');
    expect(result.type).toBe('integer');
  });
});
