<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
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
  import ProgramPanel from '$lib/components/playground/ProgramPanel.svelte';
  import ReceiptPanel from '$lib/components/playground/ReceiptPanel.svelte';
  import RuntimeEventsPanel from '$lib/components/playground/RuntimeEventsPanel.svelte';
  import * as Badge from '$lib/components/ui/badge';
  import { highlightCode, type HighlightedLine } from '$lib/highlighter';
  import {
    INITIAL_PRICE,
    INITIAL_QUANTITY,
    MAX_STORED_EVENTS,
    PROGRAM,
    formatEventTime,
    getPriceForQuantity,
    isQuantityOption,
    type EventEntry,
    type Trigger,
  } from '$lib/playground/model';

  let darkMode = $state(document.documentElement.classList.contains('dark'));
  let events = $state<EventEntry[]>([]);
  let selectedQuantity = $state(INITIAL_QUANTITY.toString());
  let eventFilter = $state<'all' | Trigger>('all');
  let highlightedLines = $state<HighlightedLine[]>([]);
  let priceValue = $state(INITIAL_PRICE);
  let quantityValue = $state(INITIAL_QUANTITY);
  let subtotalValue = $state(INITIAL_PRICE * INITIAL_QUANTITY);
  let taxValue = $state(INITIAL_PRICE * INITIAL_QUANTITY * 0.18);
  let totalValue = $state(INITIAL_PRICE * INITIAL_QUANTITY * 1.18);
  let effectRuns = $state(0);
  let eventSequence = 0;
  let activeTrigger: Trigger = 'Batch';
  let badgeSentinel: HTMLDivElement;
  let badgePinned = $state(false);

  const price = signal(INITIAL_PRICE);
  const quantity = signal(INITIAL_QUANTITY);
  const subtotal = computed(() => price() * quantity());
  const tax = computed(() => subtotal() * 0.18);
  const total = computed(() => subtotal() + tax());

  async function highlightProgram(): Promise<void> {
    try {
      const lines = await highlightCode(PROGRAM);
      highlightedLines = lines ?? PROGRAM.split('\n');
    } catch {
      highlightedLines = PROGRAM.split('\n');
    }
  }

  onMount(() => {
    void highlightProgram();

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) badgePinned = !entry.isIntersecting;
      },
      { rootMargin: '-84px 0px 0px 0px', threshold: 0 },
    );

    observer.observe(badgeSentinel);
    return () => observer.disconnect();
  });

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

  function withTrigger(trigger: Trigger, update: () => void): void {
    const previousTrigger = activeTrigger;
    activeTrigger = trigger;

    try {
      update();
    } finally {
      activeTrigger = previousTrigger;
    }
  }

  function recordEvent(event: ReactiveEvent): void {
    const trigger: Trigger =
      event.type === 'batch:start' || event.type === 'batch:end' ? 'Batch' : activeTrigger;

    events = [
      { event, trigger, time: formatEventTime(new Date()), id: eventSequence++ },
      ...events,
    ].slice(0, MAX_STORED_EVENTS);
  }

  const stopPricingEffect = effect(() => {
    priceValue = price();
    quantityValue = quantity();
    subtotalValue = subtotal();
    taxValue = tax();
    totalValue = total();
    effectRuns += 1;
  });
  // Subscribe after the initial effect so the event table starts empty.
  const stopEvents = onReactiveEvent(recordEvent);

  function selectQuantity(value: string): void {
    const nextQuantity = Number(value);
    if (!Number.isSafeInteger(nextQuantity) || !isQuantityOption(nextQuantity)) return;
    if (nextQuantity === quantity()) return;

    selectedQuantity = value;

    withTrigger('Batch', () => {
      batch(() => {
        withTrigger('Quantity', () => quantity.set(nextQuantity));
        withTrigger('Price', () => price.set(getPriceForQuantity(nextQuantity)));
      });
    });
  }

  function reset(): void {
    selectedQuantity = INITIAL_QUANTITY.toString();
    withTrigger('Batch', () => {
      batch(() => {
        withTrigger('Quantity', () => quantity.set(INITIAL_QUANTITY));
        withTrigger('Price', () => price.set(INITIAL_PRICE));
      });
    });
    events = [];
    eventFilter = 'all';
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

<div class="mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col px-4 sm:px-6">
  <SiteHeader {darkMode} onToggleTheme={toggleTheme} />

  <main class="flex min-h-0 flex-1 flex-col py-8 sm:py-10">
    <div bind:this={badgeSentinel} class="h-px" aria-hidden="true"></div>
    <div class="sticky top-[5.25rem] z-30 mb-8 flex justify-center py-2">
      <Badge.Badge
        variant="outline"
        class={`border-border/80 bg-card/95 text-muted-foreground rounded-full font-medium tracking-[0.14em] shadow-sm backdrop-blur-xl transition-[padding,font-size] duration-200 ${badgePinned ? 'h-7 px-3 text-[10px] sm:text-[11px]' : 'h-auto px-4 py-2 text-[11px] sm:text-xs'}`}
      >
        <span class="status-indicator" aria-hidden="true">
          <span class="status-dot"></span>
        </span>
        REACTIVE RUNTIME
      </Badge.Badge>
    </div>

    <div class="flex min-h-0 flex-1 flex-col gap-4">
      <section class="grid shrink-0 items-stretch gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <ProgramPanel
          {highlightedLines}
          {selectedQuantity}
          onQuantityChange={selectQuantity}
          onReset={reset}
        />
        <ReceiptPanel
          price={priceValue}
          quantity={quantityValue}
          subtotal={subtotalValue}
          tax={taxValue}
          total={totalValue}
          {effectRuns}
        />
      </section>

      <RuntimeEventsPanel {events} bind:eventFilter />
    </div>
  </main>

  <SiteFooter />
</div>
