import { performance } from "node:perf_hooks";
import { batch, computed, effect, signal } from "../dist/index.js";

const iterations = Number(process.env.PULSE_BENCH_ITERATIONS ?? 100_000);

function measure(name, run) {
  run(Math.min(1_000, iterations));
  const start = performance.now();
  run(iterations);
  const elapsed = performance.now() - start;
  console.log(
    `${name.padEnd(28)} ${elapsed.toFixed(2).padStart(10)} ms  ${(iterations / (elapsed / 1_000)).toFixed(0).padStart(12)} ops/s`,
  );
}

console.log(`Pulse benchmark (${iterations.toLocaleString()} iterations)`);
console.log("Warm-up is included; run on an otherwise idle machine.\n");

measure("untracked signal reads", (count) => {
  const value = signal(1);
  for (let i = 0; i < count; i++) value();
});

measure("signal writes", (count) => {
  const value = signal(0);
  for (let i = 1; i <= count; i++) value.set(i);
});

measure("computed cache reads", (count) => {
  const source = signal(1);
  const value = computed(() => source() + 1);
  value();
  for (let i = 0; i < count; i++) value();
});

measure("batched signal writes", (count) => {
  const value = signal(0);
  const dispose = effect(() => value());
  batch(() => {
    for (let i = 1; i <= count; i++) value.set(i);
  });
  dispose();
});

measure("effect create/dispose", (count) => {
  const source = signal(1);
  for (let i = 0; i < count; i++) {
    const dispose = effect(() => source());
    dispose();
  }
});
