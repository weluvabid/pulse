# Pulse

A small, framework-independent reactive runtime for JavaScript and TypeScript.

Pulse provides four primitives:

- `signal` for mutable reactive state.
- `computed` for lazily evaluated derived values.
- `effect` for tracked side effects with explicit disposal.
- `batch` for grouping writes and flushing effects at the outermost boundary.

The runtime uses a hybrid push-pull model. Writes invalidate dependents, computed values refresh on demand, and effects run through a synchronous scheduler. Optional instrumentation exposes runtime events without exposing application values or affecting runtime behavior.

## Usage

```ts
import { batch, computed, effect, signal } from '@weluvabid/pulse';

const count = signal(0);
const doubled = computed(() => count() * 2);

const dispose = effect(() => {
  console.log(doubled());
});

batch(() => {
  count.set(1);
  count.set(2);
});

// Stop the effect and run its registered cleanups.
dispose();
```

Effects run immediately when created. They re-run synchronously when tracked dependencies change. Call the returned disposer to stop an effect; cleanups registered with `onCleanup` run before the next execution and on disposal.

## Instrumentation

Subscribe to runtime events with `onReactiveEvent(listener)`. The returned function unsubscribes the listener.

```ts
import { onReactiveEvent } from '@weluvabid/pulse';

const unsubscribe = onReactiveEvent((event) => {
  console.log(event.type, event.id);
});

// Later, when instrumentation is no longer needed:
unsubscribe();
```

Events contain runtime IDs and state transitions, not application values. Listener exceptions are isolated from the reactive runtime.

## Development

Requires Node.js 22 or newer and npm 10 or newer.

```sh
npm ci
npm run hooks:install
npm run check
```

Useful commands:

```sh
npm test
npm run test:watch
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run benchmark
```

`npm run check` runs linting, formatting checks, type checking, tests, and a production build. CI runs the checks on Node.js 22, 24, and 26. CodeQL analyzes the JavaScript and TypeScript code separately.
