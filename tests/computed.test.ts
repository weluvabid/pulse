import { describe, expect, it, vi } from "vitest";
import { computed, ComputedCycleError } from "../src/computed.js";
import { signal } from "../src/signal.js";
import { createComputation, runTracked } from "../src/internal/reactivity.js";

describe("computed", () => {
  it("evaluates lazily and caches successful results", () => {
    const source = signal(2);
    const derive = vi.fn(() => source() * 2);
    const doubled = computed(derive);

    expect(derive).not.toHaveBeenCalled();
    expect(doubled()).toBe(4);
    expect(doubled()).toBe(4);
    expect(derive).toHaveBeenCalledTimes(1);

    source.set(3);
    expect(derive).toHaveBeenCalledTimes(1);
    expect(doubled()).toBe(6);
    expect(derive).toHaveBeenCalledTimes(2);
  });

  it("tracks dependencies dynamically", () => {
    const condition = signal(true);
    const left = signal("left");
    const right = signal("right");
    const selected = computed(() => (condition() ? left() : right()));

    expect(selected()).toBe("left");
    condition.set(false);
    expect(selected()).toBe("right");

    left.set("obsolete");
    expect(selected()).toBe("right");
    right.set("current");
    expect(selected()).toBe("current");
  });

  it("supports computed chains and refreshes upstream values first", () => {
    const source = signal(2);
    const doubled = computed(() => source() * 2);
    const total = computed(() => doubled() + 1);

    expect(total()).toBe(5);
    source.set(5);
    expect(total()).toBe(11);
  });

  it("does not notify dependents when the recomputed value is equal", () => {
    const source = signal(1);
    const parity = computed(() => source() % 2);
    const observer = vi.fn();
    const computation = createComputation(observer);

    runTracked(computation, () => parity());
    source.set(3);
    expect(observer).not.toHaveBeenCalled();

    source.set(4);
    expect(observer).not.toHaveBeenCalled();
    expect(parity()).toBe(0);
    expect(observer).toHaveBeenCalledTimes(1);
  });

  it("supports custom equality", () => {
    const source = signal("alpha");
    const value = computed(() => source().toLowerCase(), {
      equals: (previous, next) => previous === next,
    });

    expect(value()).toBe("alpha");
    source.set("ALPHA");
    expect(value()).toBe("alpha");
  });

  it("detects direct and indirect cycles", () => {
    const direct: () => number = computed(() => direct());
    expect(() => direct()).toThrow(ComputedCycleError);

    const first: () => number = computed(() => second());
    const second: () => number = computed(() => first());
    expect(() => first()).toThrow(ComputedCycleError);
  });

  it("does not cache a failed evaluation and retries on the next read", () => {
    const source = signal(1);
    let shouldThrow = true;
    const value = computed(() => {
      const current = source();
      if (shouldThrow) {
        throw new Error("derive failed");
      }
      return current * 2;
    });

    expect(() => value()).toThrow("derive failed");
    shouldThrow = false;
    expect(value()).toBe(2);
  });

  it("preserves prior dependencies when evaluation fails", () => {
    const condition = signal(true);
    const previous = signal(1);
    const attempted = signal(2);
    let shouldThrow = false;
    const value = computed(() => {
      condition();
      if (shouldThrow) {
        attempted();
        throw new Error("derive failed");
      }
      return previous();
    });

    expect(value()).toBe(1);
    shouldThrow = true;
    condition.set(false);
    expect(() => value()).toThrow("derive failed");

    shouldThrow = false;
    previous.set(3);
    expect(value()).toBe(3);
    attempted.set(4);
    expect(value()).toBe(3);
  });

  it("does not evaluate when an upstream signal changes until read", () => {
    const source = signal(1);
    const derive = vi.fn(() => source() * 2);
    const value = computed(derive);

    expect(value()).toBe(2);
    source.set(2);
    expect(derive).toHaveBeenCalledTimes(1);
    expect(value()).toBe(4);
    expect(derive).toHaveBeenCalledTimes(2);
  });
});
