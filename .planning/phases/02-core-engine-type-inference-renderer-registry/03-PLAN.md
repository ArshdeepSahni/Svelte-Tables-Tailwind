---
phase: 02-core-engine-type-inference-renderer-registry
plan: 03
type: execute
wave: 2
depends_on:
  - 02-01
files_modified:
  - packages/core/src/registry/index.ts
  - packages/core/src/registry/registry.test.ts
autonomous: true
requirements:
  - CORE-06

must_haves:
  truths:
    - "registerRenderer('myType', fn) stores the function and getRenderer('myType') retrieves it"
    - "hasRenderer returns true for registered types and false for unregistered types"
    - "unregisterRenderer removes a type from the registry"
    - "Registering a type that already exists emits a console.warn and overwrites"
    - "Built-in renderers use registerRenderer — there is no special-case API for built-ins"
    - "All registry tests pass"
  artifacts:
    - path: "packages/core/src/registry/index.ts"
      provides: "Renderer plugin registry"
      exports: ["registerRenderer", "getRenderer", "hasRenderer", "unregisterRenderer", "clearRegistry"]
    - path: "packages/core/src/registry/registry.test.ts"
      provides: "Full registry test coverage (CORE-06)"
  key_links:
    - from: "packages/core/src/renderers/*.ts"
      to: "packages/core/src/registry/index.ts"
      via: "each renderer file calls registerRenderer() at module init (Wave 4)"
    - from: "packages/core/src/engine/index.ts"
      to: "packages/core/src/registry/index.ts"
      via: "engine calls getRenderer(column.type) to resolve cell renderers (Wave 5)"
---

<objective>
Build the renderer plugin registry — a global Map that stores RendererFn by type name. Built-in renderers and custom plugins use the same API with no special-casing. This is the extension point that makes the library open for customization without forking.

Purpose: CORE-06 requires a tested registry before Wave 4 (renderers) because each renderer file self-registers on import. Getting the registry right first prevents all 17 renderers from being blocked.
Output: registry/index.ts (Map + 5 API functions), registry.test.ts (Wave 0 + full tests).
</objective>

<execution_context>
@/Users/arshdeep.singh/.claude/get-shit-done/workflows/execute-plan.md
@/Users/arshdeep.singh/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/02-core-engine-type-inference-renderer-registry/02-CONTEXT.md
@.planning/phases/02-core-engine-type-inference-renderer-registry/02-RESEARCH.md

<interfaces>
<!-- From Wave 1 output — types this plan imports -->
From packages/core/src/types.ts:
```typescript
export type CellDescriptor = { kind: 'text'; value: string } | { kind: 'number'; value: number; formatted: string } | ... (10 variants total)
export type RendererFn = (value: unknown, column: ResolvedColumn) => CellDescriptor;
export interface ResolvedColumn extends ColumnDefinition { type: ColumnType; label: string; inferenceResult?: InferenceResult; }
```

Registry API (from CONTEXT.md decisions):
```typescript
registerRenderer(type: string, fn: RendererFn): void  // register; warn on duplicate
getRenderer(type: string): RendererFn | undefined      // retrieve or undefined
hasRenderer(type: string): boolean                      // check existence
unregisterRenderer(type: string): void                  // remove (testing/cleanup)
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Implement registry/index.ts + registry.test.ts</name>
  <files>
    packages/core/src/registry/index.ts
    packages/core/src/registry/registry.test.ts
  </files>
  <read_first>
    - packages/core/src/types.ts — RendererFn, ResolvedColumn, CellDescriptor types (needed for import paths)
    - .planning/phases/02-core-engine-type-inference-renderer-registry/02-CONTEXT.md — Renderer Plugin Registry section
    - .planning/phases/02-core-engine-type-inference-renderer-registry/02-RESEARCH.md — Gotcha #4 "Renderer Auto-Registration Side Effect" section
  </read_first>
  <behavior>
    - Registry is a module-level Map<string, RendererFn> singleton
    - clearRegistry() is exported for test isolation (unregisters all entries)
    - registerRenderer warns with console.warn when type is already registered, then overwrites
    - getRenderer returns undefined (not throws) for unknown types
    - All imports use .js extension (NodeNext resolution)
    - Tests use afterEach(() => clearRegistry()) to prevent cross-test pollution
    - Duplicate registration test: spy on console.warn, verify it is called once
  </behavior>
  <action>
Create packages/core/src/registry/index.ts:

```typescript
/**
 * @tablecraft/core — Renderer plugin registry
 *
 * CORE-06: Global Map<string, RendererFn> registry for all cell renderers.
 * Built-in Tier 1 renderers use the SAME API as external plugins — no special-casing.
 *
 * Design decisions:
 * - Module-level singleton Map (not a class) — simple, no instantiation needed
 * - clearRegistry() exported for test isolation — DO NOT call in production code
 * - Duplicate registration warns + overwrites (not throws) — intentional override support
 * - getRenderer returns undefined for unknown types — engine falls back to text renderer
 *
 * Tree-shaking note (CORE-07):
 * Importing @tablecraft/core/renderers/currency triggers ONLY the currency module's
 * registerRenderer() call. The registry Map itself is shared across all renderer modules
 * because it is a singleton in the same package — tree-shaking removes unused RENDERERS,
 * not the registry structure.
 */

import type { RendererFn } from '../types.js';

/** The global renderer registry. Module-level singleton — shared across all imports. */
const registry = new Map<string, RendererFn>();

/**
 * Register a renderer function for a named type.
 * If the type is already registered, emits a console.warn and overwrites.
 *
 * CORE-06: Built-in renderers call this on module initialization.
 * Custom renderers call this to extend or replace built-ins.
 *
 * @param type - The column type name (e.g., 'currency', 'myCustomType')
 * @param fn - The renderer function: (value, column) => CellDescriptor
 */
export function registerRenderer(type: string, fn: RendererFn): void {
  if (registry.has(type)) {
    console.warn(
      `[tablecraft] Renderer "${type}" is already registered and will be overwritten. ` +
      `This is intentional if you are replacing a built-in. If not, check for duplicate imports.`,
    );
  }
  registry.set(type, fn);
}

/**
 * Retrieve a renderer function by type name.
 * Returns undefined if no renderer is registered for the given type.
 * The engine falls back to the 'text' renderer when undefined is returned.
 *
 * @param type - The column type name to look up
 */
export function getRenderer(type: string): RendererFn | undefined {
  return registry.get(type);
}

/**
 * Check whether a renderer is registered for a given type.
 *
 * @param type - The column type name to check
 */
export function hasRenderer(type: string): boolean {
  return registry.has(type);
}

/**
 * Remove a renderer from the registry.
 * Silently does nothing if the type is not registered.
 * Primarily used in tests and for dynamic plugin lifecycle management.
 *
 * @param type - The column type name to remove
 */
export function unregisterRenderer(type: string): void {
  registry.delete(type);
}

/**
 * Remove ALL renderers from the registry.
 * WARNING: FOR TEST USE ONLY. Calling this in production will break all rendering.
 * Use in afterEach() to prevent cross-test pollution from renderer auto-registration.
 */
export function clearRegistry(): void {
  registry.clear();
}

/**
 * Return a snapshot of all currently registered type names.
 * Useful for debugging and testing — returns a new array, not the internal Set.
 */
export function getRegisteredTypes(): string[] {
  return Array.from(registry.keys());
}
```

Create packages/core/src/registry/registry.test.ts:

```typescript
/**
 * CORE-06: Renderer plugin registry tests
 * Tests: register, retrieve, override, unregister, duplicate registration warning.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
  registerRenderer,
  getRenderer,
  hasRenderer,
  unregisterRenderer,
  clearRegistry,
  getRegisteredTypes,
} from './index.js';
import type { CellDescriptor, ResolvedColumn } from '../types.js';

// Minimal RendererFn implementation for tests
function makeRenderer(kind: string): (value: unknown, column: ResolvedColumn) => CellDescriptor {
  return (value, _column) => ({
    kind: 'text',
    value: `${kind}:${String(value)}`,
  } as CellDescriptor);
}

const testRenderer = makeRenderer('test');
const altRenderer = makeRenderer('alt');

afterEach(() => {
  // Prevent cross-test pollution from auto-registration side effects
  clearRegistry();
  vi.restoreAllMocks();
});

describe('registerRenderer', () => {
  it('stores a renderer function', () => {
    registerRenderer('myType', testRenderer);
    expect(hasRenderer('myType')).toBe(true);
  });

  it('allows registration of multiple different types', () => {
    registerRenderer('typeA', testRenderer);
    registerRenderer('typeB', altRenderer);
    expect(hasRenderer('typeA')).toBe(true);
    expect(hasRenderer('typeB')).toBe(true);
  });

  it('emits console.warn on duplicate registration', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    registerRenderer('duplicate', testRenderer);
    registerRenderer('duplicate', altRenderer);
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0][0]).toContain('duplicate');
  });

  it('overwrites the previous renderer on duplicate registration', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    registerRenderer('overwrite', testRenderer);
    registerRenderer('overwrite', altRenderer);
    expect(getRenderer('overwrite')).toBe(altRenderer);
  });
});

describe('getRenderer', () => {
  it('retrieves a registered renderer', () => {
    registerRenderer('myType', testRenderer);
    expect(getRenderer('myType')).toBe(testRenderer);
  });

  it('returns undefined for unregistered types', () => {
    expect(getRenderer('nonexistent')).toBeUndefined();
  });

  it('returns the correct renderer when multiple are registered', () => {
    registerRenderer('typeA', testRenderer);
    registerRenderer('typeB', altRenderer);
    expect(getRenderer('typeA')).toBe(testRenderer);
    expect(getRenderer('typeB')).toBe(altRenderer);
  });
});

describe('hasRenderer', () => {
  it('returns true for registered type', () => {
    registerRenderer('myType', testRenderer);
    expect(hasRenderer('myType')).toBe(true);
  });

  it('returns false for unregistered type', () => {
    expect(hasRenderer('nope')).toBe(false);
  });

  it('returns false after unregisterRenderer is called', () => {
    registerRenderer('myType', testRenderer);
    unregisterRenderer('myType');
    expect(hasRenderer('myType')).toBe(false);
  });
});

describe('unregisterRenderer', () => {
  it('removes a registered renderer', () => {
    registerRenderer('myType', testRenderer);
    unregisterRenderer('myType');
    expect(hasRenderer('myType')).toBe(false);
    expect(getRenderer('myType')).toBeUndefined();
  });

  it('does nothing when type is not registered (no throw)', () => {
    expect(() => unregisterRenderer('nonexistent')).not.toThrow();
  });

  it('does not affect other registered renderers', () => {
    registerRenderer('typeA', testRenderer);
    registerRenderer('typeB', altRenderer);
    unregisterRenderer('typeA');
    expect(hasRenderer('typeB')).toBe(true);
    expect(getRenderer('typeB')).toBe(altRenderer);
  });
});

describe('clearRegistry', () => {
  it('removes all registered renderers', () => {
    registerRenderer('a', testRenderer);
    registerRenderer('b', altRenderer);
    clearRegistry();
    expect(hasRenderer('a')).toBe(false);
    expect(hasRenderer('b')).toBe(false);
  });

  it('results in empty registered types list', () => {
    registerRenderer('x', testRenderer);
    clearRegistry();
    expect(getRegisteredTypes()).toHaveLength(0);
  });
});

describe('getRegisteredTypes', () => {
  it('returns empty array when registry is empty', () => {
    expect(getRegisteredTypes()).toHaveLength(0);
  });

  it('returns all registered type names', () => {
    registerRenderer('typeA', testRenderer);
    registerRenderer('typeB', altRenderer);
    const types = getRegisteredTypes();
    expect(types).toContain('typeA');
    expect(types).toContain('typeB');
    expect(types).toHaveLength(2);
  });

  it('returns a new array (not the internal reference)', () => {
    registerRenderer('typeA', testRenderer);
    const types = getRegisteredTypes();
    types.push('injected');
    expect(getRegisteredTypes()).not.toContain('injected');
  });
});

describe('custom renderer invocation', () => {
  it('custom renderer is invoked by the retrieved function', () => {
    const customFn = vi.fn((_value: unknown, _col: ResolvedColumn): CellDescriptor => ({
      kind: 'text',
      value: 'custom-output',
    }));
    registerRenderer('sparkline', customFn);
    const retrieved = getRenderer('sparkline');
    expect(retrieved).toBeDefined();

    // Simulate engine calling the renderer
    const fakeColumn = { key: 'data', type: 'text', label: 'Data' } as ResolvedColumn;
    retrieved!([1, 2, 3], fakeColumn);

    expect(customFn).toHaveBeenCalledOnce();
    expect(customFn).toHaveBeenCalledWith([1, 2, 3], fakeColumn);
  });

  it('custom renderer output is returned verbatim', () => {
    const customOutput: CellDescriptor = { kind: 'badge', label: 'custom', variant: 'success' };
    registerRenderer('myBadge', () => customOutput);
    const retrieved = getRenderer('myBadge')!;
    const fakeColumn = { key: 'x', type: 'text', label: 'X' } as ResolvedColumn;
    expect(retrieved(null, fakeColumn)).toBe(customOutput);
  });
});

describe('built-in override pattern (CORE-06)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('consumer can replace built-in currency renderer without touching core files', () => {
    // Simulate a built-in being registered first
    const builtInCurrency = makeRenderer('builtin-currency');
    registerRenderer('currency', builtInCurrency);

    // Consumer overrides
    const customCurrency = makeRenderer('custom-currency');
    registerRenderer('currency', customCurrency);

    expect(getRenderer('currency')).toBe(customCurrency);
  });

  it('override emits deprecation-style warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    registerRenderer('html', makeRenderer('html1'));
    registerRenderer('html', makeRenderer('html2'));
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toMatch(/html.*already registered/i);
  });
});
```
  </action>
  <verify>
    <automated>cd /Users/arshdeep.singh/Desktop/Svelte-Tables-Tailwind && pnpm --filter @tablecraft/core test --reporter=verbose 2>&1 | grep -E "(registry|PASS|FAIL)" | head -20</automated>
  </verify>
  <acceptance_criteria>
    - packages/core/src/registry/index.ts exists
    - grep "export function registerRenderer" packages/core/src/registry/index.ts returns a match
    - grep "export function getRenderer" packages/core/src/registry/index.ts returns a match
    - grep "export function clearRegistry" packages/core/src/registry/index.ts returns a match
    - pnpm --filter @tablecraft/core test exits 0
    - All registry.test.ts tests pass (no .todo stubs, all assertions active)
    - pnpm --filter @tablecraft/core typecheck exits 0
  </acceptance_criteria>
  <done>registry/index.ts has 6 exported functions (register, get, has, unregister, clear, getRegisteredTypes). All registry tests pass. TypeScript strict mode satisfied.</done>
</task>

</tasks>

<verification>
After task completes:
1. `pnpm --filter @tablecraft/core test` — all tests pass
2. `pnpm --filter @tablecraft/core typecheck` — zero errors
3. `grep -c "export function" packages/core/src/registry/index.ts` — returns 6
4. Verify duplicate registration warning test passes (spy on console.warn)
5. Verify clearRegistry() clears all entries (prevents cross-test pollution in Wave 4)
</verification>

<success_criteria>
- registerRenderer('x', fn) + getRenderer('x') === fn
- hasRenderer('y') === false before registration, true after
- unregisterRenderer('x') makes hasRenderer('x') === false
- Duplicate registration calls console.warn once and overwrites
- clearRegistry() makes getRegisteredTypes() return []
- All 20+ registry tests pass
- TypeScript strict mode: zero errors
</success_criteria>

<output>
After completion, create `.planning/phases/02-core-engine-type-inference-renderer-registry/02-03-SUMMARY.md`
</output>
