/**
 * @tablecraft/core — Isomorphic idle work scheduler
 *
 * CORE-05: Type inference runs in requestIdleCallback (browser) or setImmediate (Node.js 20+).
 * The table renders immediately with text fallback; inference updates the column types once idle.
 *
 * Environment detection:
 *   - requestIdleCallback: present in browser environments
 *   - setImmediate: present in Node.js 20+ (executes after I/O, before setTimeout)
 *   - setTimeout(fn, 0): universal fallback for edge runtimes and old Node
 *
 * DO NOT check `typeof navigator` to detect environment — Node 20 ships a partial
 * navigator global that makes the check unreliable. Use requestIdleCallback presence instead.
 */

type Callback = () => void;

/**
 * Schedule a function to run when the thread is idle.
 * Uses requestIdleCallback in browser, setImmediate in Node 20+, setTimeout fallback elsewhere.
 */
export function scheduleIdleWork(fn: Callback): void {
  if (typeof requestIdleCallback !== 'undefined') {
    // Browser: defer until the browser has no pending work
    requestIdleCallback(fn);
  } else if (typeof setImmediate !== 'undefined') {
    // Node.js 20+: after I/O phase, before setTimeout — better inference semantics
    setImmediate(fn);
  } else {
    // Edge runtimes, old Node, Cloudflare Workers
    setTimeout(fn, 0);
  }
}
