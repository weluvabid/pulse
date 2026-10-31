<script lang="ts">
  import { onDestroy } from 'svelte';
  import { RotateCcw } from '@lucide/svelte';
  import {
    batch,
    computed,
    effect,
    onReactiveEvent,
    signal,
    type ReactiveEvent,
  } from '../../src/index.js';
  import SiteFooter from '$lib/components/site/SiteFooter.svelte';
  import SiteHeader from '$lib/components/site/SiteHeader.svelte';
  import * as Badge from '$lib/components/ui/badge';
  import * as Button from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Separator from '$lib/components/ui/separator';

  type EventEntry = { event: ReactiveEvent; time: string; id: number };

  const initialPrice = 24;
  const initialQuantity = 3;

  let darkMode = $state(document.documentElement.classList.contains('dark'));
  let events = $state<EventEntry[]>([]);
  let priceValue = $state(initialPrice);
  let quantityValue = $state(initialQuantity);
  let subtotalValue = $state(initialPrice * initialQuantity);
  let taxValue = $state(initialPrice * initialQuantity * 0.18);
  let totalValue = $state(initialPrice * initialQuantity * 1.18);
  let effectRuns = $state(0);
  let eventSequence = 0;

  const price = signal(initialPrice);
  const quantity = signal(initialQuantity);
  const subtotal = computed(() => price() * quantity());
  const tax = computed(() => subtotal() * 0.18);
  const total = computed(() => subtotal() + tax());

  function applyTheme(value: boolean): void {
    darkMode = value;
    document.documentElement.classList.toggle('dark', value);
    document.documentElement.style.colorScheme = value ? 'dark' : 'light';
    document.documentElement.style.backgroundColor = value ? '#0b0b0b' : '#ffffff';
    document
      .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute('content', value ? '#0b0b0b' : '#ffffff');

    try {
      localStorage.setItem('pulse-theme', value ? 'dark' : 'light');
    } catch {
      // Storage can be unavailable in restricted browser contexts.
    }
  }

  function toggleTheme(): void {
    applyTheme(!darkMode);
  }

  function recordEvent(event: ReactiveEvent): void {
    events = [
      { event, time: new Date().toLocaleTimeString(), id: eventSequence++ },
      ...events,
    ].slice(0, 40);
  }

  const stopEvents = onReactiveEvent(recordEvent);
  const stopPricingEffect = effect(() => {
    const currentPrice = price();
    const currentQuantity = quantity();
    const currentSubtotal = subtotal();
    const currentTax = tax();
    const currentTotal = total();

    priceValue = currentPrice;
    quantityValue = currentQuantity;
    subtotalValue = currentSubtotal;
    taxValue = currentTax;
    totalValue = currentTotal;
    effectRuns += 1;
  });

  function updatePrice(amount: number): void {
    price.update((value) => Math.max(0, value + amount));
  }

  function updateQuantity(amount: number): void {
    quantity.update((value) => Math.max(1, value + amount));
  }

  function batchUpdate(): void {
    batch(() => {
      price.update((value) => value + 6);
      quantity.update((value) => value + 1);
    });
  }

  function reset(): void {
    price.set(initialPrice);
    quantity.set(initialQuantity);
  }

  onDestroy(() => {
    stopPricingEffect();
    stopEvents();
  });
</script>

<svelte:head>
  <title>Pulse — Reactive runtime playground</title>
  <meta
    name="description"
    content="Explore Pulse signals, computed values and effects in a live playground."
  />
</svelte:head>

<div class="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 sm:px-6">
  <SiteHeader {darkMode} onToggleTheme={toggleTheme} />

  <main class="flex-1 py-8 sm:py-10">
    <div class="mb-8 flex justify-center">
      <div
        class="bg-muted text-foreground inline-flex items-center rounded-full px-4 py-2 text-sm font-medium sm:text-base"
      >
        <span class="status-indicator"><span class="status-dot"></span></span>
        Framework independent
      </div>
    </div>

    <div class="space-y-4">
      <section class="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card.Root class="border-border bg-card rounded-none shadow-none">
          <Card.Header>
            <Card.Title class="text-base">Reactive playground</Card.Title>
          </Card.Header>

          <Card.Content class="space-y-6">
            <div class="space-y-3">
              <h2 class="text-sm font-semibold">Program</h2>

              <pre
                class="border-border bg-muted/50 text-foreground overflow-x-auto border p-4 text-sm leading-7"><code
                  >{`const price = signal(24)
const quantity = signal(3)

const subtotal = computed(() => price() * quantity())
const tax = computed(() => subtotal() * 0.18)
const total = computed(() => subtotal() + tax())

effect(() => render(total()))

batch(() => {
  price.update((value) => value + 6)
  quantity.update((value) => value + 1)
})`}</code
                ></pre>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <Button.Root variant="outline" size="sm" onclick={() => updatePrice(-1)}
                >Price −</Button.Root
              >
              <Button.Root size="sm" onclick={() => updatePrice(1)}>Price +</Button.Root>
              <Button.Root variant="outline" size="sm" onclick={() => updateQuantity(-1)}
                >Quantity −</Button.Root
              >
              <Button.Root size="sm" onclick={() => updateQuantity(1)}>Quantity +</Button.Root>
              <Button.Root variant="secondary" onclick={batchUpdate}>Batch update</Button.Root>
              <Button.Root variant="ghost" class="ml-auto" onclick={reset}>
                <RotateCcw size={15} /> Reset
              </Button.Root>
            </div>
          </Card.Content>
        </Card.Root>

        <Card.Root class="border-border bg-card rounded-none shadow-none">
          <Card.Header>
            <div class="flex items-center justify-between gap-3">
              <Card.Title class="text-base">Receipt</Card.Title>
              <Badge.Badge variant="secondary" class="rounded-none">Order summary</Badge.Badge>
            </div>
            <Card.Description>Live values derived from the reactive graph.</Card.Description>
          </Card.Header>

          <Card.Content class="space-y-5">
            <div class="space-y-4">
              <p class="text-muted-foreground text-xs font-medium">Inputs</p>
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-sm font-medium">Price</p>
                  <p class="text-muted-foreground mt-1 text-xs">Per item</p>
                </div>
                <p class="text-sm font-medium tabular-nums">${priceValue.toFixed(2)}</p>
              </div>
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-sm font-medium">Quantity</p>
                  <p class="text-muted-foreground mt-1 text-xs">Items</p>
                </div>
                <p class="text-sm font-medium tabular-nums">{quantityValue}</p>
              </div>
            </div>

            <Separator.Root />

            <div class="space-y-4">
              <p class="text-muted-foreground text-xs font-medium">Calculated</p>
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-sm font-medium">Subtotal</p>
                  <p class="text-muted-foreground mt-1 text-xs">Price × quantity</p>
                </div>
                <p class="text-sm font-medium tabular-nums">${subtotalValue.toFixed(2)}</p>
              </div>
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-sm font-medium">Tax (18%)</p>
                </div>
                <p class="text-sm font-medium tabular-nums">${taxValue.toFixed(2)}</p>
              </div>
            </div>

            <Separator.Root />

            <div class="flex items-end justify-between gap-4">
              <div>
                <p class="text-sm font-semibold">Total</p>
                <p class="text-muted-foreground mt-1 text-xs">Including 18% tax</p>
              </div>
              <p class="text-2xl font-semibold tracking-tight tabular-nums">
                ${totalValue.toFixed(2)}
              </p>
            </div>

            <Separator.Root />

            <div class="text-muted-foreground flex items-center justify-between gap-3 text-sm">
              <span>Reactive effect runs</span>
              <span class="tabular-nums">{effectRuns}</span>
            </div>
          </Card.Content>
        </Card.Root>
      </section>

      <Card.Root class="border-border bg-card rounded-none shadow-none">
        <Card.Header>
          <div class="flex items-center justify-between gap-3">
            <Card.Title class="text-base">Runtime events</Card.Title>
            <Badge.Badge variant="secondary" class="rounded-none"
              >{events.length} events</Badge.Badge
            >
          </div>
          <Card.Description>Events emitted by Pulse instrumentation.</Card.Description>
        </Card.Header>
        <Card.Content>
          <div class="text-muted-foreground mb-4 flex items-center gap-2 text-xs">
            <span class="size-2 rounded-full bg-emerald-500"></span>
            Listening
            <span class="ml-auto">Newest first</span>
          </div>
          <div class="grid max-h-[34rem] gap-2 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3">
            {#each events as item (item.id)}
              <div class="border-border flex items-start justify-between gap-3 border p-3">
                <div class="min-w-0">
                  <p class="text-sm font-medium break-all">{item.event.type}</p>
                  <p class="text-muted-foreground mt-1 text-xs">
                    {'id' in item.event
                      ? `node ${item.event.id}`
                      : 'depth' in item.event
                        ? `depth ${item.event.depth}`
                        : ''}
                    {'changed' in item.event
                      ? ` · ${item.event.changed ? 'changed' : 'unchanged'}`
                      : ''}
                  </p>
                </div>
                <time class="text-muted-foreground shrink-0 text-xs">{item.time}</time>
              </div>
            {:else}
              <div
                class="border-border text-muted-foreground border border-dashed px-4 py-10 text-center text-sm sm:col-span-2 xl:col-span-3"
              >
                Interact with the controls to inspect runtime events.
              </div>
            {/each}
          </div>
          <div class="mt-3 flex justify-end">
            <Button.Root variant="ghost" size="sm" onclick={() => (events = [])}
              >Clear events</Button.Root
            >
          </div>
        </Card.Content>
      </Card.Root>
    </div>
  </main>

  <SiteFooter />
</div>
