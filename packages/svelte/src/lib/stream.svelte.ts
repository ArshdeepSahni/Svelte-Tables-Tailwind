/**
 * @tablecraft/svelte — Real-Time Stream Adapter
 *
 * Adapts various real-time data sources into a unified reactive interface.
 * Supports: AsyncIterable, ReadableStream, WebSocket, EventSource (SSE),
 * and custom push-based sources.
 *
 * Zero dependencies. Framework-agnostic core logic, Svelte-specific reactivity layer.
 */

import type { Row } from './types.js';

// ─── Types ─────────────────────────────────────────────────────────

export type StreamSource =
  | AsyncIterable<StreamMessage>
  | ReadableStream<StreamMessage>
  | WebSocket
  | EventSource
  | string; // URL for auto-detect (wss:// → WebSocket, http(s):// → SSE)

export type StreamStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'closed';

export interface StreamMessage {
  /** Operation type */
  type: 'append' | 'prepend' | 'update' | 'remove' | 'replace' | 'clear';
  /** Row(s) to add/update/remove */
  rows?: Row[];
  /** For 'update'/'remove': match rows by this key field */
  key?: string;
  /** For 'update': row identifiers to match */
  ids?: unknown[];
}

export interface StreamState {
  /** Current rows (reactive) */
  rows: Row[];
  /** Connection status */
  status: StreamStatus;
  /** Last error message */
  error: string;
  /** Total messages received */
  messageCount: number;
  /** Rows received per second (rolling 5s window) */
  throughput: number;
  /** Disconnect and clean up */
  disconnect: () => void;
}

// ─── Message parser ────────────────────────────────────────────────

function parseMessage(raw: unknown): StreamMessage | null {
  if (!raw) return null;

  // Already a StreamMessage
  if (typeof raw === 'object' && 'type' in (raw as Record<string, unknown>)) {
    return raw as StreamMessage;
  }

  // String → try JSON parse
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.type) return parsed as StreamMessage;
      // If it's an array, treat as append
      if (Array.isArray(parsed)) return { type: 'append', rows: parsed };
      // Single object → append
      if (typeof parsed === 'object') return { type: 'append', rows: [parsed] };
    } catch {
      return null;
    }
  }

  // Array → append
  if (Array.isArray(raw)) {
    return { type: 'append', rows: raw as Row[] };
  }

  return null;
}

// ─── Row operations ────────────────────────────────────────────────

function applyMessage(current: Row[], msg: StreamMessage): Row[] {
  switch (msg.type) {
    case 'append':
      return [...current, ...(msg.rows ?? [])];

    case 'prepend':
      return [...(msg.rows ?? []), ...current];

    case 'replace':
      return msg.rows ?? [];

    case 'clear':
      return [];

    case 'update': {
      if (!msg.rows || !msg.key) return current;
      const keyField = msg.key;
      const updateMap = new Map<unknown, Row>();
      for (const row of msg.rows) {
        updateMap.set(row[keyField], row);
      }
      return current.map(row => {
        const update = updateMap.get(row[keyField]);
        return update ? { ...row, ...update } : row;
      });
    }

    case 'remove': {
      if (!msg.key || !msg.ids) return current;
      const keyField = msg.key;
      const removeSet = new Set(msg.ids);
      return current.filter(row => !removeSet.has(row[keyField]));
    }

    default:
      return current;
  }
}

// ─── Source adapters ───────────────────────────────────────────────

interface StreamCallbacks {
  onMessage: (msg: StreamMessage) => void;
  onStatus: (status: StreamStatus) => void;
  onError: (error: string) => void;
}

function connectWebSocket(url: string, cb: StreamCallbacks): () => void {
  cb.onStatus('connecting');
  const ws = new WebSocket(url);

  ws.onopen = () => cb.onStatus('connected');
  ws.onclose = () => cb.onStatus('closed');
  ws.onerror = () => cb.onError('WebSocket connection error');

  ws.onmessage = (event) => {
    const msg = parseMessage(event.data);
    if (msg) cb.onMessage(msg);
  };

  return () => {
    ws.close();
    cb.onStatus('closed');
  };
}

function connectEventSource(url: string, cb: StreamCallbacks): () => void {
  cb.onStatus('connecting');
  const es = new EventSource(url);

  es.onopen = () => cb.onStatus('connected');
  es.onerror = () => cb.onError('EventSource connection error');

  es.onmessage = (event) => {
    const msg = parseMessage(event.data);
    if (msg) cb.onMessage(msg);
  };

  // Listen for custom event types too
  es.addEventListener('append', (e) => {
    const msg = parseMessage((e as MessageEvent).data);
    if (msg) cb.onMessage({ ...msg, type: 'append' });
  });

  es.addEventListener('update', (e) => {
    const msg = parseMessage((e as MessageEvent).data);
    if (msg) cb.onMessage({ ...msg, type: 'update' });
  });

  es.addEventListener('remove', (e) => {
    const msg = parseMessage((e as MessageEvent).data);
    if (msg) cb.onMessage({ ...msg, type: 'remove' });
  });

  return () => {
    es.close();
    cb.onStatus('closed');
  };
}

function connectExistingWebSocket(ws: WebSocket, cb: StreamCallbacks): () => void {
  if (ws.readyState === WebSocket.OPEN) {
    cb.onStatus('connected');
  } else if (ws.readyState === WebSocket.CONNECTING) {
    cb.onStatus('connecting');
  }

  const onOpen = () => cb.onStatus('connected');
  const onClose = () => cb.onStatus('closed');
  const onError = () => cb.onError('WebSocket error');
  const onMessage = (event: MessageEvent) => {
    const msg = parseMessage(event.data);
    if (msg) cb.onMessage(msg);
  };

  ws.addEventListener('open', onOpen);
  ws.addEventListener('close', onClose);
  ws.addEventListener('error', onError);
  ws.addEventListener('message', onMessage);

  return () => {
    ws.removeEventListener('open', onOpen);
    ws.removeEventListener('close', onClose);
    ws.removeEventListener('error', onError);
    ws.removeEventListener('message', onMessage);
  };
}

function connectExistingEventSource(es: EventSource, cb: StreamCallbacks): () => void {
  if (es.readyState === EventSource.OPEN) {
    cb.onStatus('connected');
  } else if (es.readyState === EventSource.CONNECTING) {
    cb.onStatus('connecting');
  }

  const onMessage = (event: MessageEvent) => {
    const msg = parseMessage(event.data);
    if (msg) cb.onMessage(msg);
  };

  es.addEventListener('message', onMessage);

  return () => {
    es.removeEventListener('message', onMessage);
  };
}

async function connectAsyncIterable(
  iter: AsyncIterable<StreamMessage>,
  cb: StreamCallbacks,
  signal: AbortSignal,
): Promise<void> {
  cb.onStatus('connected');
  try {
    for await (const msg of iter) {
      if (signal.aborted) break;
      const parsed = parseMessage(msg);
      if (parsed) cb.onMessage(parsed);
    }
    cb.onStatus('closed');
  } catch (err) {
    if (!signal.aborted) {
      cb.onError(err instanceof Error ? err.message : 'Stream error');
    }
  }
}

async function connectReadableStream(
  stream: ReadableStream<StreamMessage>,
  cb: StreamCallbacks,
  signal: AbortSignal,
): Promise<void> {
  cb.onStatus('connected');
  const reader = stream.getReader();
  try {
    while (true) {
      if (signal.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;
      const parsed = parseMessage(value);
      if (parsed) cb.onMessage(parsed);
    }
    cb.onStatus('closed');
  } catch (err) {
    if (!signal.aborted) {
      cb.onError(err instanceof Error ? err.message : 'Stream error');
    }
  } finally {
    reader.releaseLock();
  }
}

// ─── Throughput tracker ────────────────────────────────────────────

class ThroughputTracker {
  private timestamps: number[] = [];
  private windowMs = 5000;

  record(): void {
    this.timestamps.push(Date.now());
    this.prune();
  }

  get rate(): number {
    this.prune();
    if (this.timestamps.length < 2) return 0;
    const elapsed = (Date.now() - this.timestamps[0]) / 1000;
    return elapsed > 0 ? Math.round(this.timestamps.length / elapsed) : 0;
  }

  private prune(): void {
    const cutoff = Date.now() - this.windowMs;
    while (this.timestamps.length > 0 && this.timestamps[0] < cutoff) {
      this.timestamps.shift();
    }
  }
}

// ─── Main connect function ─────────────────────────────────────────

export function connectStream(
  source: StreamSource,
  initialRows: Row[] = [],
): StreamState {
  let rows = $state<Row[]>([...initialRows]);
  let status = $state<StreamStatus>('idle');
  let error = $state<string>('');
  let messageCount = $state<number>(0);
  let throughput = $state<number>(0);

  const tracker = new ThroughputTracker();
  let cleanup: (() => void) | null = null;
  const abortController = new AbortController();

  // Throughput update interval
  const throughputInterval = setInterval(() => {
    throughput = tracker.rate;
  }, 1000);

  const callbacks: StreamCallbacks = {
    onMessage: (msg) => {
      rows = applyMessage(rows, msg);
      messageCount++;
      tracker.record();
    },
    onStatus: (s) => { status = s; },
    onError: (e) => { error = e; status = 'error'; },
  };

  // Auto-detect and connect
  if (typeof source === 'string') {
    // URL string → auto-detect protocol
    if (source.startsWith('ws://') || source.startsWith('wss://')) {
      cleanup = connectWebSocket(source, callbacks);
    } else {
      cleanup = connectEventSource(source, callbacks);
    }
  } else if (source instanceof WebSocket) {
    cleanup = connectExistingWebSocket(source, callbacks);
  } else if (source instanceof EventSource) {
    cleanup = connectExistingEventSource(source, callbacks);
  } else if (Symbol.asyncIterator in (source as object)) {
    connectAsyncIterable(source as AsyncIterable<StreamMessage>, callbacks, abortController.signal);
  } else if ('getReader' in (source as object)) {
    connectReadableStream(source as ReadableStream<StreamMessage>, callbacks, abortController.signal);
  }

  const disconnect = () => {
    abortController.abort();
    cleanup?.();
    clearInterval(throughputInterval);
    status = 'closed';
  };

  return {
    get rows() { return rows; },
    get status() { return status; },
    get error() { return error; },
    get messageCount() { return messageCount; },
    get throughput() { return throughput; },
    disconnect,
  };
}

// ─── Simulated stream (for demos/testing) ──────────────────────────

export function createSimulatedStream(opts: {
  /** Rows to cycle through */
  pool: Row[];
  /** Interval in ms between messages */
  intervalMs?: number;
  /** How many rows per message */
  batchSize?: number;
  /** Max total rows before cycling/replacing */
  maxRows?: number;
  /** Key field for updates */
  keyField?: string;
  /** Mix of operations (default: append only) */
  operations?: StreamMessage['type'][];
}): AsyncIterable<StreamMessage> {
  const {
    pool,
    intervalMs = 1000,
    batchSize = 1,
    maxRows = 100,
    keyField = 'id',
    operations = ['append'],
  } = opts;

  let index = 0;

  async function* generate(): AsyncGenerator<StreamMessage> {
    let currentRows: Row[] = [];

    while (true) {
      await new Promise(r => setTimeout(r, intervalMs));

      const op = operations[Math.floor(Math.random() * operations.length)];

      switch (op) {
        case 'append': {
          const batch: Row[] = [];
          for (let i = 0; i < batchSize; i++) {
            const row = { ...pool[index % pool.length], [keyField]: `stream-${Date.now()}-${i}` };
            batch.push(row);
            index++;
          }
          currentRows = [...currentRows, ...batch];
          // Trim if over max
          if (currentRows.length > maxRows) {
            currentRows = currentRows.slice(-maxRows);
            yield { type: 'replace', rows: currentRows };
          } else {
            yield { type: 'append', rows: batch };
          }
          break;
        }

        case 'update': {
          if (currentRows.length === 0) continue;
          const targetIdx = Math.floor(Math.random() * currentRows.length);
          const target = currentRows[targetIdx];
          // Randomize a numeric field
          const numKeys = Object.keys(target).filter(k => typeof target[k] === 'number');
          if (numKeys.length > 0) {
            const field = numKeys[Math.floor(Math.random() * numKeys.length)];
            const updated = { ...target, [field]: (target[field] as number) * (0.9 + Math.random() * 0.2) };
            currentRows[targetIdx] = updated;
            yield { type: 'update', rows: [updated], key: keyField };
          }
          break;
        }

        case 'remove': {
          if (currentRows.length <= 5) continue;
          const removeIdx = Math.floor(Math.random() * currentRows.length);
          const removed = currentRows[removeIdx];
          currentRows.splice(removeIdx, 1);
          yield { type: 'remove', key: keyField, ids: [removed[keyField]] };
          break;
        }

        default:
          break;
      }
    }
  }

  return generate();
}
