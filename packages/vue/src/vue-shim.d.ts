/**
 * Vue SFC module shim for TypeScript.
 *
 * When using plain tsc (not vue-tsc), TypeScript cannot resolve .vue imports
 * without this shim. It tells TypeScript to treat every .vue file as a module
 * that default-exports a Vue component with DefineComponent type.
 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>;
  export default component;
}
