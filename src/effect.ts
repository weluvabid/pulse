import {
  createComputation,
  dependenciesChanged,
  refreshDependencies,
  runTracked,
  type Computation,
} from './internal/reactivity.js';
import { ReactiveCycleError, schedule, type ScheduledJob } from './internal/scheduler.js';
import { createReactiveId, emitReactiveEvent } from './instrumentation.js';

export type Cleanup = () => void;
export type CleanupRegistrar = (cleanup: Cleanup) => void;
export type Disposer = () => void;
export type EffectCallback = (onCleanup: CleanupRegistrar) => void;

export { ReactiveCycleError as EffectCycleError };

interface EffectNode extends Computation, ScheduledJob {
  readonly id: number;
  active: boolean;
  running: boolean;
  readonly callback: EffectCallback;
  readonly cleanups: Cleanup[];
  readonly children: EffectNode[];
  parent: EffectNode | undefined;
}

let activeOwner: EffectNode | undefined;

function runCleanups(node: EffectNode): void {
  const cleanups = node.cleanups.splice(0).reverse();
  const errors: unknown[] = [];

  for (const cleanup of cleanups) {
    try {
      cleanup();
    } catch (error) {
      errors.push(error);
    }
  }

  if (errors.length === 1) throw errors[0];

  if (errors.length > 1) throw new AggregateError(errors, 'Multiple effect cleanups failed.');
}

function disposeNode(node: EffectNode): void {
  if (!node.active) return;

  node.active = false;

  if (node.parent) {
    node.parent.children.splice(node.parent.children.indexOf(node), 1);
  }

  const errors: unknown[] = [];

  for (const child of [...node.children].reverse()) {
    try {
      disposeNode(child);
    } catch (error) {
      errors.push(error);
    }
  }

  node.children.length = 0;

  for (const dependency of node.dependencies) dependency.observers.delete(node);

  node.dependencies.clear();

  try {
    runCleanups(node);
  } catch (error) {
    errors.push(error);
  }

  if (errors.length === 1) throw errors[0];

  if (errors.length > 1) throw new AggregateError(errors, 'Effect disposal failed.');
}

function execute(node: EffectNode): void {
  if (!node.active || node.running) return;

  refreshDependencies(node);

  if (node.dependencyVersions.size > 0 && !dependenciesChanged(node)) return;

  emitReactiveEvent({ type: 'effect:run', id: node.id });
  node.running = true;
  const previousOwner = activeOwner;
  const errors: unknown[] = [];

  for (const child of [...node.children].reverse()) {
    try {
      disposeNode(child);
    } catch (error) {
      errors.push(error);
    }
  }

  node.children.length = 0;

  try {
    runCleanups(node);
  } catch (error) {
    errors.push(error);
  }

  activeOwner = node;

  try {
    runTracked(node, () => node.callback((cleanup) => node.cleanups.push(cleanup)));
  } catch (error) {
    errors.push(error);
  } finally {
    activeOwner = previousOwner;
    node.running = false;
  }

  if (node.changedDuringEvaluation && node.active) schedule(node);

  if (errors.length > 0) emitReactiveEvent({ type: 'effect:error', id: node.id });

  if (errors.length === 1) throw errors[0];

  if (errors.length > 1) throw new AggregateError(errors, 'Effect execution failed.');
}

export function effect(callback: EffectCallback): Disposer {
  const parent = activeOwner;
  const node: EffectNode = {
    id: createReactiveId(),
    ...createComputation(() => schedule(node)),
    onStale: () => schedule(node),
    active: true,
    running: false,
    callback,
    cleanups: [],
    children: [],
    parent,
    run: () => execute(node),
  };

  if (parent?.active) parent.children.push(node);

  execute(node);

  return () => disposeNode(node);
}
