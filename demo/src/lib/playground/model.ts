import type { ReactiveEvent } from '../../../../src/index.js';

export type Trigger = 'Price' | 'Quantity' | 'Batch';
export type EventFilter = 'all' | Trigger;

export type EventEntry = {
  event: ReactiveEvent;
  time: string;
  id: number;
  trigger: Trigger;
};

export const INITIAL_PRICE = 24;
export const INITIAL_QUANTITY = 3;
export const MAX_STORED_EVENTS = 100;
export const QUANTITY_OPTIONS = [1, 2, 3, 5, 10, 20, 25] as const;

export const PROGRAM = `const price = signal(24);\nconst quantity = signal(3);\n\nconst subtotal = computed(() => price() * quantity());\nconst tax = computed(() => subtotal() * 0.18);\nconst total = computed(() => subtotal() + tax());\n\neffect(() => render(total()));\n\nbatch(() => {\n  const nextQuantity = Number(selectedQuantity);\n  quantity.set(nextQuantity);\n  price.set(nextQuantity >= 10 ? 20 : 24);\n});`;

export const EVENT_FILTERS: { value: EventFilter; label: string }[] = [
  { value: 'all', label: 'All events' },
  { value: 'Price', label: 'Price' },
  { value: 'Quantity', label: 'Quantity' },
  { value: 'Batch', label: 'Batch' },
];

export function isQuantityOption(value: number): boolean {
  return QUANTITY_OPTIONS.some((option) => option === value);
}

export function getPriceForQuantity(quantity: number): number {
  return quantity >= 10 ? 20 : INITIAL_PRICE;
}

export function formatEventDetails(event: ReactiveEvent): string {
  if ('id' in event) {
    if ('changed' in event) {
      return `Node ${event.id} · ${event.changed ? 'changed' : 'unchanged'}`;
    }

    if ('version' in event) {
      return `Node ${event.id} · version ${event.version}`;
    }

    return `Node ${event.id}`;
  }

  return `Depth ${event.depth}`;
}

export function formatEventTime(date: Date): string {
  return date.toLocaleTimeString();
}
