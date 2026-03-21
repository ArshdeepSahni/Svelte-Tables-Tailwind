/**
 * delegation.test.ts — Unit tests for event delegation (PERF-04)
 * Wave 0 stubs: fail until tbody onclick delegation is implemented in Wave 3.
 */
import { describe, it } from 'vitest';
// render imported for Wave 3 — used once tests are implemented
import { render } from '@testing-library/svelte';
import Table from '../lib/Table.svelte';

// Wave 0 placeholder — Wave 3 will call render(Table, ...) directly in each test
// Reference here prevents noUnusedLocals error on stub imports
void [render, Table];

describe('Event delegation (PERF-04)', () => {
  it('TODO Wave 3 — tbody has a single onclick listener, not each tr', () => {
    // Wave 0 stub: real test goes in Wave 3 (04-03-PLAN)
    throw new Error('TODO: implement in Wave 3 — render Table, query tbody, assert getEventListeners(tbody).click.length === 1 and tr has none');
  });

  it('TODO Wave 3 — oncellclick fires via tbody delegation with correct row+col payload', () => {
    throw new Error('TODO: implement in Wave 3 — click a td, verify oncellclick payload via delegated handler');
  });

  it('TODO Wave 3 — onrowclick fires via tbody delegation with correct rowIndex', () => {
    throw new Error('TODO: implement in Wave 3 — click a tr (not td), verify onrowclick payload');
  });
});
