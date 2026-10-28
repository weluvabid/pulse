export interface Dependency {
  readonly observers: Set<Computation>;
  version?: number;
  refresh?: () => void;
}

export interface Computation extends Dependency {
  readonly dependencies: Set<Dependency>;
  nextDependencies: Set<Dependency> | undefined;
  nextDependencyVersions: Map<Dependency, number> | undefined;
  changedDuringEvaluation: boolean;
  dependencyVersions: Map<Dependency, number>;
  readonly onInvalidate: () => void;
  readonly onStale?: () => void;
}

let activeComputation: Computation | undefined;

export function trackDependency(dependency: Dependency): void {
  const computation = activeComputation;
  if (!computation?.nextDependencies) {
    return;
  }

  computation.nextDependencies.add(dependency);
  if (!computation.nextDependencyVersions?.has(dependency)) {
    computation.nextDependencyVersions?.set(dependency, dependency.version ?? 0);
  }
}

export function runTracked<T>(computation: Computation, callback: () => T): T {
  const previousComputation = activeComputation;
  const previousNextDependencies = computation.nextDependencies;
  const previousDependencyVersions = computation.nextDependencyVersions;
  const nextDependencies = new Set<Dependency>();
  const dependencyVersions = new Map<Dependency, number>();

  computation.nextDependencies = nextDependencies;
  computation.nextDependencyVersions = dependencyVersions;
  activeComputation = computation;

  try {
    const result = callback();
    computation.changedDuringEvaluation = [...dependencyVersions].some(
      ([dependency, version]) => (dependency.version ?? 0) !== version,
    );
    reconcileDependencies(computation, nextDependencies);
    computation.dependencyVersions = dependencyVersions;
    return result;
  } finally {
    computation.nextDependencies = previousNextDependencies;
    computation.nextDependencyVersions = previousDependencyVersions;
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
    observers: new Set<Computation>(),
    dependencies: new Set<Dependency>(),
    nextDependencies: undefined,
    nextDependencyVersions: undefined,
    changedDuringEvaluation: false,
    dependencyVersions: new Map(),
    onInvalidate,
  };
}

export function notifyObservers(dependency: Dependency): void {
  for (const observer of [...dependency.observers]) {
    observer.onInvalidate();
  }
}

export function markObserversStale(dependency: Dependency): void {
  for (const observer of [...dependency.observers]) {
    observer.onStale?.();
  }
}

export function refreshDependencies(computation: Computation): void {
  for (const dependency of computation.dependencies) {
    dependency.refresh?.();
  }
}

export function dependenciesChanged(computation: Computation): boolean {
  for (const [dependency, version] of computation.dependencyVersions) {
    if ((dependency.version ?? 0) !== version) {
      return true;
    }
  }
  return false;
}
