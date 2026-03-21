/**
 * CORE-05: scheduleIdleWork scheduler tests
 * Wave 0 stubs — these are the acceptance criteria for the scheduler implementation.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { scheduleIdleWork } from './scheduler.js';

describe('scheduleIdleWork', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls the callback synchronously via setImmediate in Node environment', async () => {
    const fn = vi.fn();
    // In Node 20 test environment: setImmediate is available, requestIdleCallback is not
    scheduleIdleWork(fn);
    // setImmediate executes before the next event loop tick completes
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('calls the callback exactly once', async () => {
    const fn = vi.fn();
    scheduleIdleWork(fn);
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('schedules via requestIdleCallback when available', async () => {
    const mockRIC = vi.fn((cb: FrameRequestCallback) => { cb({} as IdleDeadline); return 0; });
    // Temporarily make requestIdleCallback available
    const originalRIC = (globalThis as Record<string, unknown>)['requestIdleCallback'];
    (globalThis as Record<string, unknown>)['requestIdleCallback'] = mockRIC;

    const fn = vi.fn();
    scheduleIdleWork(fn);

    // Restore before assertion
    (globalThis as Record<string, unknown>)['requestIdleCallback'] = originalRIC;

    expect(mockRIC).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledOnce();
  });

  it('falls back to setTimeout when neither requestIdleCallback nor setImmediate available', async () => {
    const originalRIC = (globalThis as Record<string, unknown>)['requestIdleCallback'];
    const originalSI = (globalThis as Record<string, unknown>)['setImmediate'];
    delete (globalThis as Record<string, unknown>)['requestIdleCallback'];
    delete (globalThis as Record<string, unknown>)['setImmediate'];

    const fn = vi.fn();
    scheduleIdleWork(fn);

    await new Promise<void>((resolve) => setTimeout(resolve, 10));
    expect(fn).toHaveBeenCalledOnce();

    // Restore globals
    (globalThis as Record<string, unknown>)['requestIdleCallback'] = originalRIC;
    (globalThis as Record<string, unknown>)['setImmediate'] = originalSI;
  });
});
