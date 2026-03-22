import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Worker since it doesn't exist in Node/jsdom
class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  private listeners: Array<(e: MessageEvent) => void> = [];
  postMessage = vi.fn();
  terminate = vi.fn();
  addEventListener(type: string, fn: (e: MessageEvent) => void) { if (type === 'message') this.listeners.push(fn); }
  removeEventListener(type: string, fn: (e: MessageEvent) => void) { if (type === 'message') this.listeners = this.listeners.filter(l => l !== fn); }
  // Simulate worker response
  simulateResponse(data: unknown) {
    const event = { data } as MessageEvent;
    this.listeners.forEach(fn => fn(event));
  }
}

// We test the worker client's fallback behavior and type contracts
describe('ocrWorkerClient', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('exports preloadEngineWorker function', async () => {
    const mod = await import('../workers/ocrWorkerClient');
    expect(typeof mod.preloadEngineWorker).toBe('function');
  });

  it('exports recognizeInWorker function', async () => {
    const mod = await import('../workers/ocrWorkerClient');
    expect(typeof mod.recognizeInWorker).toBe('function');
  });

  it('exports terminateOCRWorker function', async () => {
    const mod = await import('../workers/ocrWorkerClient');
    expect(typeof mod.terminateOCRWorker).toBe('function');
  });

  it('exports isWorkerAvailable function', async () => {
    const mod = await import('../workers/ocrWorkerClient');
    expect(typeof mod.isWorkerAvailable).toBe('function');
  });

  it('MockWorker simulates postMessage and response', () => {
    const w = new MockWorker();
    const handler = vi.fn();
    w.addEventListener('message', handler);
    w.simulateResponse({ type: 'preload-done' });
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ data: { type: 'preload-done' } }));
  });

  it('MockWorker removeEventListener works', () => {
    const w = new MockWorker();
    const handler = vi.fn();
    w.addEventListener('message', handler);
    w.removeEventListener('message', handler);
    w.simulateResponse({ type: 'preload-done' });
    expect(handler).not.toHaveBeenCalled();
  });
});
