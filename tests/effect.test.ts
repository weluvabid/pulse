import { describe, expect, it, vi } from "vitest";
import { batch, computed, effect, signal, ReactiveCycleError } from "../src/index.js";

describe("effects and scheduling", () => {
  it("runs initially and responds to changes", () => {
    const value = signal(1);
    const run = vi.fn(() => value());
    const dispose = effect(run);

    value.set(2);
    expect(run).toHaveBeenCalledTimes(2);
    dispose();
    value.set(3);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("reconciles conditional dependencies", () => {
    const condition = signal(true);
    const left = signal(1);
    const right = signal(2);
    const run = vi.fn(() => condition() ? left() : right());
    effect(run);

    condition.set(false);
    left.set(3);
    right.set(4);
    expect(run).toHaveBeenCalledTimes(3);
  });

  it("runs cleanup before rerun and on disposal in reverse order", () => {
    const source = signal(0);
    const order: number[] = [];
    const dispose = effect(onCleanup => {
      source();
      onCleanup(() => order.push(1));
      onCleanup(() => order.push(2));
    });

    source.set(1);
    dispose();
    expect(order).toEqual([2, 1, 2, 1]);
  });

  it("disposes children when an owner reruns", () => {
    const enabled = signal(true);
    const source = signal(0);
    const childRun = vi.fn(() => source());
    effect(() => {
      if (enabled()) effect(childRun);
    });

    source.set(1);
    enabled.set(false);
    source.set(2);
    expect(childRun).toHaveBeenCalledTimes(2);
  });

  it("coalesces updates inside nested batches", () => {
    const left = signal(0);
    const right = signal(0);
    const run = vi.fn(() => [left(), right()]);
    effect(run);

    batch(() => {
      left.set(1);
      batch(() => {
        right.set(1);
        left.set(2);
      });
    });

    expect(run).toHaveBeenCalledTimes(2);
    expect(run.mock.results[1]?.value).toEqual([2, 1]);
  });

  it("does not rerun an effect when a computed result stays equal", () => {
    const source = signal(1);
    const parity = computed(() => source() % 2);
    const run = vi.fn(() => parity());
    effect(run);

    source.set(3);
    expect(run).toHaveBeenCalledTimes(1);
    source.set(4);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("bounds runaway synchronous effects", () => {
    const source = signal(0);
    expect(() => effect(() => source.set(source() + 1))).toThrow(ReactiveCycleError);
  });

  it("restores batch state when the callback throws", () => {
    const source = signal(0);
    const run = vi.fn(() => source());
    effect(run);

    expect(() => batch(() => {
      source.set(1);
      throw new Error("batch failed");
    })).toThrow("batch failed");
    expect(run).toHaveBeenCalledTimes(2);
    source.set(2);
    expect(run).toHaveBeenCalledTimes(3);
  });
});
