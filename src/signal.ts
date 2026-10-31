import { notifyObservers, trackDependency, type Dependency } from './internal/reactivity.js';
import { batchNotifications } from './internal/scheduler.js';
import { createReactiveId, emitReactiveEvent } from './instrumentation.js';

export interface SignalOptions<T> {
  readonly equals?: (previous: T, next: T) => boolean;
}

export interface SignalAccessor<T> {
  (): T;
  set(value: T): void;
  update(updater: (current: T) => T): void;
}

interface SignalNode<T> extends Dependency {
  readonly id: number;
  value: T;
  readonly equals: (previous: T, next: T) => boolean;
}

export function signal<T>(initialValue: T, options: SignalOptions<T> = {}): SignalAccessor<T> {
  const node: SignalNode<T> = {
    id: createReactiveId(),
    value: initialValue,
    version: 0,
    equals: options.equals ?? Object.is,
    observers: new Set(),
  };

  const read = (() => {
    trackDependency(node);
    return node.value;
  }) as SignalAccessor<T>;

  read.set = (value: T): void => {
    if (node.equals(node.value, value)) {
      return;
    }

    node.value = value;
    node.version = (node.version ?? 0) + 1;
    emitReactiveEvent({ type: 'signal:write', id: node.id, version: node.version });
    batchNotifications(() => notifyObservers(node));
  };

  read.update = (updater: (current: T) => T): void => {
    // Read the stored value directly: an update operation is a write, not a
    // reactive read, and therefore must not create a dependency by itself.
    read.set(updater(node.value));
  };

  return read;
}
