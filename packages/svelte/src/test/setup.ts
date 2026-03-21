import 'vitest-axe/extend-expect';
import { vi } from 'vitest';

// Stub requestIdleCallback so tests run synchronously
vi.stubGlobal('requestIdleCallback', (cb: IdleRequestCallback) => {
  cb({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline);
  return 0 as unknown as ReturnType<typeof requestIdleCallback>;
});
vi.stubGlobal('cancelIdleCallback', () => {});
