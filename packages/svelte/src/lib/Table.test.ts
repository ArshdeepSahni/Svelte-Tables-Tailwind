/**
 * @tablecraft/svelte — Table component stub tests
 *
 * Phase 1: Verify the component renders without errors.
 * Phase 3: Full behavior tests (sorting, filtering, pagination, accessibility).
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Table from './Table.svelte';

describe('Table component (Phase 1 stub)', () => {
  it('renders without throwing', () => {
    // Minimal render — no data, no columns
    const { container } = render(Table, {
      props: { data: [] },
    });
    expect(container).toBeTruthy();
  });

  it('shows empty state when data is empty', () => {
    const { getByText } = render(Table, {
      props: { data: [] },
    });
    expect(getByText('No data to display.')).toBeTruthy();
  });

  it('renders column headers from data keys', () => {
    const data = [{ name: 'Alice', age: 30 }];
    const { getByText } = render(Table, {
      props: { data },
    });
    // Column header derived from key "name" → "Name" (capitalized)
    expect(getByText('Name')).toBeTruthy();
    expect(getByText('Age')).toBeTruthy();
  });

  it('renders row data as text without {@html}', () => {
    const data = [{ name: 'Alice', age: 30 }];
    const { getByText } = render(Table, {
      props: { data },
    });
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('30')).toBeTruthy();
  });

  it('renders boolean values as Yes/No', () => {
    const data = [{ active: true, verified: false }];
    const { getByText } = render(Table, {
      props: { data },
    });
    expect(getByText('Yes')).toBeTruthy();
    expect(getByText('No')).toBeTruthy();
  });

  it('uses role="grid" for accessibility', () => {
    const { container } = render(Table, {
      props: { data: [{ id: 1 }] },
    });
    expect(container.querySelector('[role="grid"]')).toBeTruthy();
  });
});
