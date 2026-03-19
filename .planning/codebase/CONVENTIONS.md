# Coding Conventions

**Analysis Date:** 2026-03-19

## Naming Patterns

**Files:**
- Svelte components use PascalCase: `Tables.svelte`
- JavaScript modules use camelCase: `index.js`
- Lowercase for config files: `rollup.config.js`

**Functions:**
- camelCase for all functions: `enterdatatypes()`, `returndatatype()`
- Arrow functions preferred: `let returndatatype = (key, value) => { ... }`
- Prefixed verbs for clarity: `enter*`, `return*` patterns

**Variables:**
- camelCase for all variables: `colname`, `rowdata`, `datatypelist`, `indexj`
- Descriptive names reflecting purpose: `datatypelist` for array of data types
- Abbreviated loop variables in iterations: `dt`, `j`, `i` (though not ideal practice)

**Types:**
- No TypeScript present; vanilla JavaScript/Svelte
- Props documented via export statements in script: `export let colname`, `export let rowdata`
- Object/Array prop shapes inferred from examples rather than formal typing

## Code Style

**Formatting:**
- No linter/formatter configuration present (no .eslintrc, .prettierrc, eslint.config.js, or biome.json)
- Inconsistent spacing and indentation throughout `Tables.svelte`
- Mixed quote styles: double quotes and single quotes used interchangeably
- String concatenation with + operator rather than template literals

**Linting:**
- Not detected - no linting rules enforced
- Manual code review required for consistency

## Import Organization

**Order:**
- Svelte imports come first (implicit in .svelte files)
- External packages follow standard import syntax
- No alias imports detected

**Path Aliases:**
- Not used in this codebase

**Example from `src/index.js`:**
```javascript
import Tables from './Tables.svelte';
export default Tables;
```

## Error Handling

**Patterns:**
- No explicit error handling present in the component
- No try-catch blocks
- No error boundaries or fallback UI
- Relies on browser's default error behavior

## Logging

**Framework:** `console` object

**Patterns:**
- Console.log for debugging: `console.log(datatypelist, "This is list of datatypes in table")` (line 14 in `Tables.svelte`)
- No structured logging
- No log levels (info/warn/error) differentiation
- Debug logging left in production code

## Comments

**When to Comment:**
- Minimal commenting in the codebase
- Code is largely self-documenting through variable names
- No comment blocks explaining complex logic (though present in `returndatatype` function which contains complex conditional chains)

**JSDoc/TSDoc:**
- Not used; no formal documentation strings present

## Function Design

**Size:**
- `returndatatype()` function is very large (112 lines, lines 15-122) with deeply nested ternary operators
- Should be broken into smaller functions for maintainability

**Parameters:**
- Keep parameters minimal: `returndatatype(key, value)`
- Use prop drilling through Svelte component context rather than extensive parameter passing

**Return Values:**
- HTML strings returned directly from `returndatatype()` function
- Strings used with `{@html ...}` to render as markup in template
- Inconsistent return style: sometimes explicit returns, sometimes implicit

## Module Design

**Exports:**
- Default export used: `export default Tables;` in `src/index.js`
- Named exports for component props: `export let colname`, `export let rowdata`, `export let url`, `export let click` in `Tables.svelte`

**Barrel Files:**
- Not used - codebase too small for this pattern

## Template and Markup Patterns (Svelte)

**Svelte-specific conventions:**
- Reactive logic executed at component load via `window.onload = enterdatatypes()`
- Two-way binding used: `bind:value={datatypelist[indexj]}`
- HTML injection with `{@html ...}` directive for rendering dynamic content
- Scoped styles in `<style>` blocks: CSS in `Tables.svelte` is component-scoped

**Class binding:**
- Inline Tailwind utility classes throughout markup
- No dynamic class binding; all classes are static
- Heavy reliance on Tailwind CSS for styling

---

*Convention analysis: 2026-03-19*
