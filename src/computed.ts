import {
  createComputation,
  markObserversStale,
  notifyObservers,
  runTracked,
  trackDependency,
  type Computation,
} from './internal/reactivity.js';
import { createReactiveId, emitReactiveEvent } from './instrumentation.js';

export interface ComputedOptions<T> {
  readonly equals?: (previous: T, next: T) => boolean;
}

export interface ComputedAccessor<T> {
  (): T;
}

export class ComputedCycleError extends Error {
  constructor() {
    super('A computed value cannot depend on itself during evaluation.');
    this.name = 'ComputedCycleError';
  }
}

interface ComputedNode<T> extends Computation {
  readonly id: number;
  dirty: boolean;
  evaluating: boolean;
  hasValue: boolean;
  value: T | undefined;
  readonly derive: () => T;
  readonly equals: (previous: T, next: T) => boolean;
}

function refreshDependencies(computation: Computation): void {
  for (const dependency of computation.dependencies) {
    dependency.refresh?.();
  }
}

function refresh<T>(node: ComputedNode<T>): void {
  if (node.evaluating) {
    throw new ComputedCycleError();
  }

  refreshDependencies(node);

  if (!node.dirty) {
    return;
  }

  node.evaluating = true;

  try {
    const nextValue = runTracked(node, node.derive);
    const changed = !node.hasValue || !node.equals(node.value as T, nextValue);

    node.value = nextValue;
    node.hasValue = true;
    node.dirty = false;
    emitReactiveEvent({ type: 'computed:evaluate', id: node.id, changed });

    if (changed) {
      node.version = (node.version ?? 0) + 1;
      notifyObservers(node);
    }
  } catch (error) {
    emitReactiveEvent({ type: 'computed:error', id: node.id });
    throw error;
  } finally {
    node.evaluating = false;
  }
}

export function computed<T>(
  derive: () => T,
  options: ComputedOptions<T> = {},
): ComputedAccessor<T> {
  const node: ComputedNode<T> = {
    id: createReactiveId(),
    ...createComputation(() => {
      if (!node.dirty) {
        node.dirty = true;
        markObserversStale(node);
      }
    }),
    onStale: () => {
      if (!node.dirty) {
        node.dirty = true;
        markObserversStale(node);
      }
    },
    dirty: true,
    evaluating: false,
    hasValue: false,
    value: undefined,
    derive,
    equals: options.equals ?? Object.is,
  };

  node.refresh = () => refresh(node);

  const read = (() => {
    refresh(node);
    trackDependency(node);
    return node.value as T;
  }) as ComputedAccessor<T>;

  return read;
}
