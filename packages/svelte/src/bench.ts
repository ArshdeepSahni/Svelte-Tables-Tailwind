import { mount } from 'svelte';
import Table from './lib/Table.svelte';

// Generate 100,000 rows programmatically — no fixture file needed
const ROWS = 100_000;
const data = Array.from({ length: ROWS }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  age: 18 + (i % 60),
  score: Math.round((i * 7.3) % 100 * 100) / 100,
  status: ['active', 'inactive', 'pending'][i % 3],
  joined: new Date(2020, i % 12, (i % 28) + 1).toISOString().slice(0, 10),
}));

mount(Table, {
  target: document.getElementById('app')!,
  props: { data, pageSize: 50, filterable: false },
});
