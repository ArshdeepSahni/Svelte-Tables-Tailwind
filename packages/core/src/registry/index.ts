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
