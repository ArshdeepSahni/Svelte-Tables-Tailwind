// This file runs on the server (Node.js) during SSR.
// Importing @tablecraft/core here proves that element.ts SSR guards work:
// no "window is not defined" or "customElements is not defined" errors should throw.
import type { PageServerLoad } from './$types';
import { createTableEngine } from '@tablecraft/core';

export const load: PageServerLoad = async () => {
  // Run a real engine call in SSR — confirms the import does not throw
  const engine = createTableEngine({ data: [{ name: 'Alice', age: 30 }] });
  const columns = engine.resolveColumns([{ name: 'Alice', age: 30 }]);
  return {
    columnCount: columns.length,
  };
};
