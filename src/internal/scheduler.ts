export interface ScheduledJob {
  readonly active: boolean;
  run(): void;
}

const queue = new Set<ScheduledJob>();
let batchDepth = 0;
let flushing = false;
const maxExecutions = 10_000;

export function schedule(job: ScheduledJob): void {
  if (!job.active) return;
  queue.add(job);
  if (batchDepth === 0 && !flushing) flush();
}

export function batch<T>(callback: () => T): T {
  batchDepth++;
  let result!: T;
  let callbackError: unknown;
  let callbackFailed = false;

  try {
    result = callback();
  } catch (error) {
    callbackFailed = true;
    callbackError = error;
  } finally {
    batchDepth--;
  }

  let flushError: unknown;
  if (batchDepth === 0) {
    try {
      flush();
    } catch (error) {
      flushError = error;
    }
  }

  if (callbackFailed) throw callbackError;
  if (flushError !== undefined) throw flushError;
  return result;
}

function flush(): void {
  if (flushing || batchDepth > 0) return;
  flushing = true;
  const errors: unknown[] = [];
  let executions = 0;

  try {
    while (queue.size > 0) {
      const job = queue.values().next().value as ScheduledJob;
      queue.delete(job);
      if (!job.active) continue;
      executions++;
      if (executions > maxExecutions) {
        queue.clear();
        errors.push(new ReactiveCycleError());
        break;
      }

      try {
        job.run();
      } catch (error) {
        errors.push(error);
      }
    }
  } finally {
    flushing = false;
  }

  if (errors.length === 1) throw errors[0];
  if (errors.length > 1) throw new AggregateError(errors, "Multiple reactive jobs failed.");
}

export class ReactiveCycleError extends Error {
  constructor() {
    super("Reactive effects exceeded the synchronous execution limit.");
    this.name = "ReactiveCycleError";
  }
}
