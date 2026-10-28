# Pulse

A small, framework-independent reactive runtime for JavaScript and TypeScript.

Pulse exposes four core primitives:

- `signal` — mutable reactive state.
- `computed` — lazily evaluated derived values.
- `effect` — tracked side effects with explicit disposal.
- `batch` — group related writes and flush effects at the outermost boundary.

The runtime uses a hybrid push-pull model: writes propagate invalidation, computed values refresh lazily, and effects execute through a synchronous scheduler. Devtools and the playground will remain separate from the core runtime.

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
