export type ReactiveEvent =
  | { readonly type: "signal:write"; readonly id: number; readonly version: number }
  | { readonly type: "computed:evaluate"; readonly id: number; readonly changed: boolean }
  | { readonly type: "computed:error"; readonly id: number }
  | { readonly type: "effect:run"; readonly id: number }
  | { readonly type: "effect:error"; readonly id: number }
  | { readonly type: "batch:start"; readonly depth: number }
  | { readonly type: "batch:end"; readonly depth: number };

export type ReactiveEventListener = (event: ReactiveEvent) => void;

const listeners = new Set<ReactiveEventListener>();
let nextId = 1;

export function createReactiveId(): number {
  return nextId++;
}

export function emitReactiveEvent(event: ReactiveEvent): void {
  if (listeners.size === 0) return;

  for (const listener of [...listeners]) {
    try {
      listener(event);
    } catch {
      // Instrumentation must not change reactive runtime behavior.
    }
  }
}

export function onReactiveEvent(listener: ReactiveEventListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
