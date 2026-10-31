import { describe, expect, it, vi } from 'vitest';
import { signal } from '../src/signal.js';
import { createComputation, runTracked } from '../src/internal/reactivity.js';

describe('signal', () => {
  it('returns its initial value and supports set and update', () => {
    const count = signal(2);

    expect(count()).toBe(2);
    count.set(5);
    expect(count()).toBe(5);
    count.update((current) => current * 2);
    expect(count()).toBe(10);
  });

  it('uses Object.is by default for equality', () => {
    const value = signal(Number.NaN);
    const invalidate = vi.fn();
    const computation = createComputation(invalidate);

    runTracked(computation, () => value());
    value.set(Number.NaN);
    expect(invalidate).not.toHaveBeenCalled();

    value.set(0);
    expect(invalidate).toHaveBeenCalledTimes(1);
    value.set(-0);
    expect(invalidate).toHaveBeenCalledTimes(2);
  });

  it('supports a custom equality function', () => {
    const value = signal('alpha', {
      equals: (previous, next) => previous.toLowerCase() === next.toLowerCase(),
    });
    const invalidate = vi.fn();
    const computation = createComputation(invalidate);

    runTracked(computation, () => value());
    value.set('ALPHA');
    expect(value()).toBe('alpha');
    expect(invalidate).not.toHaveBeenCalled();

    value.set('beta');
    expect(value()).toBe('beta');
    expect(invalidate).toHaveBeenCalledTimes(1);
  });

  it('does not create a dependency merely by calling update', () => {
    const value = signal(1);
    const invalidate = vi.fn();
    const computation = createComputation(invalidate);

    runTracked(computation, () => value.update((current) => current + 1));
    value.set(3);

    expect(invalidate).not.toHaveBeenCalled();
  });

  it('does not expose nested object mutations as reactive writes', () => {
    const value = signal({ count: 1 });
    const invalidate = vi.fn();
    const computation = createComputation(invalidate);

    runTracked(computation, () => value());
    value().count = 2;
    expect(invalidate).not.toHaveBeenCalled();

    value.set({ count: 2 });
    expect(invalidate).toHaveBeenCalledTimes(1);
  });

  it('evaluates updater functions before committing their result', () => {
    const value = signal(1);

    expect(() =>
      value.update(() => {
        throw new Error('updater failed');
      }),
    ).toThrow('updater failed');
    expect(value()).toBe(1);
  });
});

describe('dependency tracking internals', () => {
  it('tracks a dependency once despite repeated reads', () => {
    const value = signal(7);
    const invalidate = vi.fn();
    const computation = createComputation(invalidate);

    runTracked(computation, () => {
      value();
      value();
      value();
    });

    value.set(8);
    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(computation.dependencies.size).toBe(1);
  });

  it('reconciles conditional dependencies after successful runs', () => {
    const condition = signal(true);
    const left = signal('left');
    const right = signal('right');
    const invalidate = vi.fn();
    const computation = createComputation(invalidate);
    const evaluate = (): string => runTracked(computation, () => (condition() ? left() : right()));

    expect(evaluate()).toBe('left');
    left.set('LEFT');
    expect(invalidate).toHaveBeenCalledTimes(1);

    invalidate.mockClear();
    condition.set(false);
    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(evaluate()).toBe('right');

    invalidate.mockClear();
    left.set('obsolete');
    expect(invalidate).not.toHaveBeenCalled();
    right.set('RIGHT');
    expect(invalidate).toHaveBeenCalledTimes(1);
  });

  it('restores the previous tracking context after nested tracked execution', () => {
    const outer = signal('outer');
    const inner = signal('inner');
    const outerInvalidate = vi.fn();
    const innerInvalidate = vi.fn();
    const outerComputation = createComputation(outerInvalidate);
    const innerComputation = createComputation(innerInvalidate);

    runTracked(outerComputation, () => {
      outer();
      runTracked(innerComputation, () => inner());
      outer();
    });

    outer.set('changed outer');
    inner.set('changed inner');
    expect(outerInvalidate).toHaveBeenCalledTimes(1);
    expect(innerInvalidate).toHaveBeenCalledTimes(1);
    expect(outerComputation.dependencies.size).toBe(1);
    expect(innerComputation.dependencies.size).toBe(1);
  });

  it('preserves previous dependencies when a tracked run throws', () => {
    const condition = signal(true);
    const previous = signal('previous');
    const attempted = signal('attempted');
    const invalidate = vi.fn();
    const computation = createComputation(invalidate);

    runTracked(computation, () => {
      condition();
      previous();
    });

    expect(() =>
      runTracked(computation, () => {
        condition();
        attempted();
        throw new Error('evaluation failed');
      }),
    ).toThrow('evaluation failed');

    invalidate.mockClear();
    previous.set('still subscribed');
    expect(invalidate).toHaveBeenCalledTimes(1);
    invalidate.mockClear();
    attempted.set('not subscribed');
    expect(invalidate).not.toHaveBeenCalled();
  });

  it('continues notifying the snapshot when subscribers mutate their subscriptions', () => {
    const value = signal(0);
    const first = createComputation(() => {
      runTracked(first, () => undefined);
    });
    const secondInvalidate = vi.fn();
    const second = createComputation(secondInvalidate);

    runTracked(first, () => value());
    runTracked(second, () => value());
    value.set(1);
    expect(secondInvalidate).toHaveBeenCalledTimes(1);
  });

  it('does not leak tracking into reads made outside a tracked run', () => {
    const value = signal(0);
    const invalidate = vi.fn();
    const computation = createComputation(invalidate);

    value();
    value.set(1);
    expect(invalidate).not.toHaveBeenCalled();
    expect(computation.dependencies.size).toBe(0);
  });
});
