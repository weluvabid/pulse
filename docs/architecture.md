# Architecture

Pulse is a small reactive runtime built around dependency tracking, lazy computed values, and a synchronous effect scheduler.

## Dependency graph

Signals and computations maintain observer sets. A tracked read registers the active computation as an observer. Each execution collects a fresh dependency set, then reconciles it with the previous set so conditional reads do not leave stale subscriptions behind.

Signal writes compare values with the configured equality function. A changed value increments its version and invalidates observers. `update` reads the stored value directly, so a write does not create a dependency.

## Computed values

Computed values are lazy. An upstream write marks them stale and propagates staleness to their observers. The next read refreshes dependencies and evaluates the derivation only when needed. Equality is checked before notifying downstream observers, avoiding unnecessary effect executions when the derived value is unchanged.

Recursive evaluation throws `ComputedCycleError`.

## Effects and scheduling

Effects execute immediately on creation and subscribe to the dependencies read during execution. Before a re-run, Pulse disposes child effects and runs registered cleanups in reverse registration order. Disposers are idempotent and remove the effect from its dependencies.

The scheduler deduplicates queued effects with a `Set` and flushes synchronously. `batch` delays the flush until the outermost batch completes. A bounded execution count prevents an unbounded synchronous effect cycle; failures are collected while remaining queued jobs are given a chance to run.

## Instrumentation

`onReactiveEvent` observes signal writes, computed evaluations and errors, effect runs and errors, and batch boundaries. Events contain runtime IDs and state transitions only. Instrumentation listener failures are intentionally isolated and do not change runtime behavior.
