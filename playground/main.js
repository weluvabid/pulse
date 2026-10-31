import { batch, computed, effect, onReactiveEvent, signal } from '../dist/index.js';

const count = signal(0);
const doubled = computed(() => count() * 2);
const countOutput = document.querySelector('#count');
const doubledOutput = document.querySelector('#doubled');
const runsOutput = document.querySelector('#runs');
const eventsList = document.querySelector('#events');
let runs = 0;

function renderEvent(event) {
  const item = document.createElement('li');

  item.textContent = JSON.stringify(event);
  eventsList.prepend(item);
}

const stopInstrumentation = onReactiveEvent(renderEvent);
const dispose = effect(() => {
  countOutput.textContent = String(count());
  doubledOutput.textContent = String(doubled());
  runsOutput.textContent = String(++runs);
});

document
  .querySelector('#decrement')
  .addEventListener('click', () => count.update((value) => value - 1));
document
  .querySelector('#increment')
  .addEventListener('click', () => count.update((value) => value + 1));
document.querySelector('#batch').addEventListener('click', () =>
  batch(() => {
    count.update((value) => value + 1);
    count.update((value) => value + 1);
  }),
);
document.querySelector('#reset').addEventListener('click', () => count.set(0));
document.querySelector('#clear').addEventListener('click', () => {
  eventsList.replaceChildren();
});

window.addEventListener(
  'pagehide',
  () => {
    stopInstrumentation();
    dispose();
  },
  { once: true },
);
