import { describe, expect, it, vi } from "vitest";
import { batch, computed, effect, signal } from "../src/index.js";

describe("reactivity hardening", () => {
  it("does not retain subscriptions after repeated effect disposal", () => {
    const source = signal(0);
    const disposers = Array.from({ length: 2_000 }, () => effect(() => source()));

    expect(source()).toBe(0);
    for (const dispose of disposers) dispose();
    source.set(1);

    const next = vi.fn(() => source());
    const dispose = effect(next);
    source.set(2);

    expect(next).toHaveBeenCalledTimes(2);
    dispose();
  });

  it("handles a wide graph without duplicate effect executions", () => {
    const source = signal(1);
    const branches = Array.from({ length: 250 }, (_, index) => computed(() => source() + index));
    const total = computed(() => branches.reduce((sum, branch) => sum + branch(), 0));
    const observed = vi.fn(() => total());
    const dispose = effect(observed);

    source.set(2);

    expect(observed).toHaveBeenCalledTimes(2);
    expect(total()).toBe(2 * 250 + (249 * 250) / 2);
    dispose();
  });

  it("keeps independent effects running when another effect throws", () => {
    const source = signal(0);
    const failed = effect(() => {
      if (source() > 0) throw new Error("effect failed");
    });
    const observed = vi.fn(() => source());
    const disposeObserved = effect(observed);

    expect(() => source.set(1)).toThrow("effect failed");
    expect(observed).toHaveBeenCalledTimes(2);
    expect(() => source.set(2)).toThrow("effect failed");
    expect(observed).toHaveBeenCalledTimes(3);

    failed();
    disposeObserved();
  });

  it("flushes once after a large batch and exposes final state", () => {
    const source = signal(0);
    const doubled = computed(() => source() * 2);
    const observed = vi.fn(() => doubled());
    const dispose = effect(observed);

    batch(() => {
      for (let value = 1; value <= 5_000; value++) source.set(value);
    });

    expect(observed).toHaveBeenCalledTimes(2);
    expect(observed.mock.results[1]?.value).toBe(10_000);
    dispose();
  });

  it("does not run a queued effect after its disposal", () => {
    const source = signal(0);
    const first = effect(() => {
      if (source() === 1) disposeSecond();
    });
    const secondRun = vi.fn(() => source());
    const disposeSecond = effect(secondRun);

    source.set(1);
    expect(secondRun).toHaveBeenCalledTimes(1);
    first();
  });
});
