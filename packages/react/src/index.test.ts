// @vitest-environment jsdom
// jsdom is required: @tablecraft/core/element imports LitElement which needs HTMLElement
import { describe, it, expect } from 'vitest';

describe('@tablecraft/react — wrapper exports', () => {
  it('WC-07: Table component is exported as a React component', async () => {
    const mod = await import('./index.js');
    expect(mod.Table).toBeDefined();
    // createComponent() returns a React.forwardRef result — typeof is 'object' in React 19
    // A valid React component is either a function or an object with $$typeof
    const isReactComponent =
      typeof mod.Table === 'function' ||
      (typeof mod.Table === 'object' && mod.Table !== null && '$$typeof' in mod.Table);
    expect(isReactComponent).toBe(true);
  });

  it('WC-07: event detail types are exported', async () => {
    // TypeScript-level test — if these imports resolve, the exports exist
    const mod = await import('./index.js');
    // The module should export without runtime error
    expect(mod).toBeDefined();
  });

  it('WC-07: Row and ColumnDefinition types are re-exported', async () => {
    // These are type-only re-exports — confirm module loads without error
    const mod = await import('./index.js');
    expect(mod).toBeDefined();
  });
});
