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
npm ci
npm run hooks:install
npm run check
```

The Git hooks enforce the repository's formatting, lint and type-check gates before commits, and validate Conventional Commit subjects.

Useful commands:

```sh
npm test
npm run test:watch
npm run test:hardening
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run benchmark
```

`npm run check` runs formatting, linting, type checking, the full test suite and a production build. CI runs this command on Node.js 22, 24 and 26; CodeQL analyzes the JavaScript and TypeScript code separately.

## Instrumentation playground

Build the package, then serve the repository root:

```sh
npm run build
python3 -m http.server 8000
```

Open `http://localhost:8000/playground/`. The playground shows signal and computed values alongside effect executions and the instrumentation event stream.

Subscribe to runtime events with `onReactiveEvent(listener)`. It returns an unsubscribe function. Events expose stable runtime IDs and state transitions, not application values.
