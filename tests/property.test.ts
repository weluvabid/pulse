import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { batch, computed, effect, signal } from '../src/index.js';

describe('reactive properties', () => {
  it('keeps batched signal values and computed results consistent', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(fc.integer(), fc.integer()), { minLength: 1, maxLength: 100 }),
        (updates) => {
          const left = signal(0);
          const right = signal(0);
          const total = computed(() => left() + right());
          const observed: number[] = [];
          const dispose = effect(() => observed.push(total()));

          batch(() => {
            for (const [a, b] of updates) {
              left.set(a);
              right.set(b);
            }
          });

          const [lastLeft, lastRight] = updates[updates.length - 1]!;

          expect(left()).toBe(lastLeft);
          expect(right()).toBe(lastRight);
          expect(total()).toBe(lastLeft + lastRight);
          expect(observed.at(-1)).toBe(lastLeft + lastRight);
          expect(observed.length).toBeLessThanOrEqual(2);
          dispose();
        },
      ),
      { numRuns: 150 },
    );
  });

  it('removes obsolete dependencies after arbitrary branch changes', () => {
    fc.assert(
      fc.property(fc.array(fc.boolean(), { minLength: 1, maxLength: 50 }), (branches) => {
        const branch = signal(true);
        const left = signal(0);
        const right = signal(0);
        let runs = 0;
        const dispose = effect(() => {
          runs++;

          if (branch()) {
            left();
          } else {
            right();
          }
        });

        for (const next of branches) branch.set(next);

        const beforeStaleWrite = runs;
        const activeBranch = branches.at(-1)!;

        if (activeBranch) right.set(right() + 1);
        else left.set(left() + 1);

        expect(runs).toBe(beforeStaleWrite);

        if (activeBranch) left.set(left() + 1);
        else right.set(right() + 1);

        expect(runs).toBe(beforeStaleWrite + 1);
        dispose();
      }),
      { numRuns: 100 },
    );
  });
});
