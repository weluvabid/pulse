import { afterEach, describe, expect, it, vi } from 'vitest';
import { batch, computed, effect, onReactiveEvent, signal } from '../src/index.js';

describe('reactivity instrumentation', () => {
  let stop: (() => void) | undefined;

  afterEach(() => {
    stop?.();
    stop = undefined;
  });

  it('reports writes, computed evaluations, and effect runs', () => {
    const events: Array<{ type: string; id?: number; version?: number; changed?: boolean }> = [];

    stop = onReactiveEvent((event) => events.push(event));
    const count = signal(1);
    const doubled = computed(() => count() * 2);
    const dispose = effect(() => {
      doubled();
    });

    count.set(2);
    dispose();

    expect(events.map(({ type }) => type)).toContain('signal:write');
    expect(events.map(({ type }) => type)).toContain('computed:evaluate');
    expect(events.map(({ type }) => type)).toContain('effect:run');
    const ids = new Set(events.filter((event) => event.id !== undefined).map((event) => event.id));

    expect(ids.size).toBeGreaterThan(1);
  });

  it('reports explicit batch boundaries', () => {
    const events: string[] = [];

    stop = onReactiveEvent((event) => events.push(event.type));
    const count = signal(0);

    batch(() => {
      count.set(1);
      count.set(2);
    });

    expect(events.filter((type) => type.startsWith('batch:'))).toEqual([
      'batch:start',
      'batch:end',
    ]);
  });

  it('isolates the runtime from instrumentation listener errors', () => {
    stop = onReactiveEvent(() => {
      throw new Error('listener failed');
    });
    const count = signal(0);
    const observed = vi.fn(() => count());
    const dispose = effect(observed);

    expect(() => count.set(1)).not.toThrow();
    expect(observed).toHaveBeenCalledTimes(2);
    dispose();
  });

  it('reports computed failures without caching them', () => {
    const shouldFail = signal(true);
    const events: string[] = [];

    stop = onReactiveEvent((event) => events.push(event.type));
    const value = computed(() => {
      if (shouldFail()) throw new Error('derive failed');

      return 42;
    });

    expect(() => value()).toThrow('derive failed');
    shouldFail.set(false);
    expect(value()).toBe(42);
    expect(events).toContain('computed:error');
    expect(events).toContain('computed:evaluate');
  });
});
