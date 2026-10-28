# Pulse

A small, framework-independent reactive runtime for JavaScript and TypeScript.

Pulse exposes four core primitives:

- `signal` — mutable reactive state.
- `computed` — lazily evaluated derived values.
- `effect` — tracked side effects with explicit disposal.
- `batch` — group related writes and flush effects at the outermost boundary.

The runtime uses a hybrid push-pull model: writes propagate invalidation, computed values refresh lazily, and effects execute through a synchronous scheduler. Optional instrumentation is exposed separately from the four core primitives; listener failures never affect runtime behavior.

## Development

Requires Node.js 22 or newer and npm 10 or newer.

```sh
npm install
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
```

## Instrumentation playground

Build the package, then serve the repository root:

```sh
npm run build
python3 -m http.server 8000
```

Open `http://localhost:8000/playground/`. The playground shows signal and computed values alongside effect executions and the instrumentation event stream.

Subscribe to runtime events with `onReactiveEvent(listener)`. It returns an unsubscribe function. Events expose stable runtime IDs and state transitions, not application values.
