export interface Dependency {
  readonly observers: Set<Computation>;
}

export interface Computation {
  readonly dependencies: Set<Dependency>;
  nextDependencies: Set<Dependency> | undefined;
  readonly onInvalidate: () => void;
}

let activeComputation: Computation | undefined;

export function trackDependency(dependency: Dependency): void {
  activeComputation?.nextDependencies?.add(dependency);
}

export function runTracked<T>(computation: Computation, callback: () => T): T {
  const previousComputation = activeComputation;
  const previousNextDependencies = computation.nextDependencies;
  const nextDependencies = new Set<Dependency>();

  computation.nextDependencies = nextDependencies;
  activeComputation = computation;

  try {
    const result = callback();
    reconcileDependencies(computation, nextDependencies);
    return result;
  } finally {
    computation.nextDependencies = previousNextDependencies;
    activeComputation = previousComputation;
  }
}

function reconcileDependencies(computation: Computation, nextDependencies: Set<Dependency>): void {
  for (const dependency of computation.dependencies) {
    if (!nextDependencies.has(dependency)) {
      dependency.observers.delete(computation);
    }
  }

  for (const dependency of nextDependencies) {
    if (!computation.dependencies.has(dependency)) {
      dependency.observers.add(computation);
    }
  }

  computation.dependencies.clear();
  for (const dependency of nextDependencies) {
    computation.dependencies.add(dependency);
  }
}

export function createComputation(onInvalidate: () => void): Computation {
  return {
    dependencies: new Set<Dependency>(),
    nextDependencies: undefined,
    onInvalidate,
  };
}

export function notifyObservers(dependency: Dependency): void {
  for (const observer of [...dependency.observers]) {
    observer.onInvalidate();
  }
}
