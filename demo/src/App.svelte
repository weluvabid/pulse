<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { ChevronDown, Minus, Plus, RotateCcw } from '@lucide/svelte';
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
  import * as CodeBlock from '$lib/components/ui/code-block';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import * as Separator from '$lib/components/ui/separator';
  import * as Table from '$lib/components/ui/table';
  import { highlightCode, type HighlightedLine } from '$lib/highlighter';

  type Trigger = 'Initialisation' | 'Price' | 'Quantity' | 'Batch';
  type EventEntry = { event: ReactiveEvent; time: string; id: number; trigger: Trigger };
  type EventFilter = 'all' | Exclude<Trigger, 'Initialisation'>;

  const initialPrice = 24;
  const initialQuantity = 3;
  const program = `const price = signal(24);\nconst quantity = signal(3);\n\nconst subtotal = computed(() => price() * quantity());\nconst tax = computed(() => subtotal() * 0.18);\nconst total = computed(() => subtotal() + tax());\n\neffect(() => render(total()));\n\nbatch(() => {\n  price.update((value) => value + 6);\n  quantity.update((value) => value + 1);\n});`;
  const eventFilters: { value: EventFilter; label: string }[] = [
    { value: 'all', label: 'All events' },
    { value: 'Price', label: 'Price' },
    { value: 'Quantity', label: 'Quantity' },
    { value: 'Batch', label: 'Batch' },
  ];

  let darkMode = $state(document.documentElement.classList.contains('dark'));
  let events = $state<EventEntry[]>([]);
  let eventFilter = $state<EventFilter>('all');
  let highlightedLines = $state<HighlightedLine[]>([]);
  let priceValue = $state(initialPrice);
  let quantityValue = $state(initialQuantity);
  let subtotalValue = $state(initialPrice * initialQuantity);
  let taxValue = $state(initialPrice * initialQuantity * 0.18);
  let totalValue = $state(initialPrice * initialQuantity * 1.18);
  let effectRuns = $state(0);
  let eventSequence = 0;
  let activeTrigger: Trigger = 'Initialisation';
  let badgeSentinel: HTMLDivElement;
  let badgePinned = $state(false);

  const price = signal(initialPrice);
  const quantity = signal(initialQuantity);
  const subtotal = computed(() => price() * quantity());
  const tax = computed(() => subtotal() * 0.18);
  const total = computed(() => subtotal() + tax());

  async function highlightProgram(): Promise<void> {
    const lines = await highlightCode(program, 'typescript');
    if (lines) highlightedLines = lines;
  }

  onMount(() => {
    void highlightProgram();

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
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
    events = [
      { event, trigger: activeTrigger, time: new Date().toLocaleTimeString(), id: eventSequence++ },
      ...events,
    ].slice(0, 100);
  }

  const stopEvents = onReactiveEvent(recordEvent);
  const stopPricingEffect = effect(() => {
    priceValue = price();
    quantityValue = quantity();
    subtotalValue = subtotal();
    taxValue = tax();
    totalValue = total();
    effectRuns += 1;
  });

  function updatePrice(amount: number): void {
    withTrigger('Price', () => price.update((value) => Math.max(0, value + amount)));
  }

  function updateQuantity(amount: number): void {
    withTrigger('Quantity', () => quantity.update((value) => Math.max(1, value + amount)));
  }

  function batchUpdate(): void {
    withTrigger('Batch', () => {
      batch(() => {
        price.update((value) => value + 6);
        quantity.update((value) => value + 1);
      });
    });
  }

  function reset(): void {
    withTrigger('Initialisation', () => {
      batch(() => {
        price.set(initialPrice);
        quantity.set(initialQuantity);
      });
    });
    events = [];
    eventFilter = 'all';
    effectRuns = 1;
  }

  function eventDetails(event: ReactiveEvent): string {
    if ('id' in event) {
      if ('changed' in event)
        return `Node ${event.id} · ${event.changed ? 'changed' : 'unchanged'}`;
      if ('version' in event) return `Node ${event.id} · version ${event.version}`;
      return `Node ${event.id}`;
    }
    return `Depth ${event.depth}`;
  }

  const visibleEvents = $derived(
    eventFilter === 'all' ? events : events.filter((item) => item.trigger === eventFilter),
  );

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
    <div bind:this={badgeSentinel} class="h-px" aria-hidden="true"></div>
    <div class="sticky top-[5.25rem] z-30 mb-8 flex justify-center py-2">
      <Badge.Badge
        variant="outline"
        class={`border-border/80 bg-card/95 text-muted-foreground rounded-full font-medium tracking-[0.14em] shadow-sm backdrop-blur-xl transition-[padding,font-size] duration-200 ${badgePinned ? 'h-7 px-3 text-[10px] sm:text-[11px]' : 'h-auto px-4 py-2 text-[11px] sm:text-xs'}`}
      >
        <span class="status-indicator" aria-hidden="true">
          <span class="status-dot"></span>
        </span>
        FRAMEWORK-INDEPENDENT RUNTIME
      </Badge.Badge>
    </div>

    <div class="space-y-4">
      <section class="grid items-stretch gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card.Root class="border-border bg-card h-full rounded-none shadow-none">
          <Card.Header>
            <Card.Title class="text-base">Reactive playground</Card.Title>
          </Card.Header>

          <Card.Content class="flex h-full flex-col justify-between gap-6">
            <div class="space-y-3">
              <h2 class="text-sm font-semibold">Program</h2>
              <CodeBlock.Root class="rounded-none">
                <CodeBlock.Content class="p-4 text-sm leading-7">
                  {#each highlightedLines as line, index (index)}
                    <CodeBlock.Line code={line} />
                  {/each}
                </CodeBlock.Content>
              </CodeBlock.Root>
            </div>

            <div class="flex flex-wrap items-center gap-5">
              <div class="flex items-center gap-2">
                <Button.Root
                  variant="outline"
                  size="icon-xs"
                  aria-label="Decrease price"
                  onclick={() => updatePrice(-1)}><Minus /></Button.Root
                >
                <span class="min-w-12 text-center text-sm font-medium">Price</span>
                <Button.Root
                  size="icon-xs"
                  aria-label="Increase price"
                  onclick={() => updatePrice(1)}><Plus /></Button.Root
                >
              </div>

              <div class="flex items-center gap-2">
                <Button.Root
                  variant="outline"
                  size="icon-xs"
                  aria-label="Decrease quantity"
                  onclick={() => updateQuantity(-1)}><Minus /></Button.Root
                >
                <span class="min-w-16 text-center text-sm font-medium">Quantity</span>
                <Button.Root
                  size="icon-xs"
                  aria-label="Increase quantity"
                  onclick={() => updateQuantity(1)}><Plus /></Button.Root
                >
              </div>

              <Button.Root variant="secondary" size="xs" onclick={batchUpdate}>
                Batch update
              </Button.Root>

              <Button.Root
                variant="ghost"
                size="icon-xs"
                class="ml-auto"
                aria-label="Reset playground"
                onclick={reset}
              >
                <RotateCcw />
              </Button.Root>
            </div>
          </Card.Content>
        </Card.Root>

        <Card.Root class="border-border bg-card h-full rounded-none shadow-none">
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
                <p class="text-sm font-medium">Tax (18%)</p>
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
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <Card.Title class="text-base">Runtime events</Card.Title>
              <Badge.Badge variant="secondary" class="rounded-none"
                >{visibleEvents.length}</Badge.Badge
              >
            </div>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                {#snippet child({ props })}
                  <Button.Root {...props} variant="outline" size="xs">
                    {eventFilters.find((filter) => filter.value === eventFilter)?.label}
                    <ChevronDown />
                  </Button.Root>
                {/snippet}
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end">
                <DropdownMenu.RadioGroup bind:value={eventFilter}>
                  {#each eventFilters as filter (filter.value)}
                    <DropdownMenu.RadioItem value={filter.value}
                      >{filter.label}</DropdownMenu.RadioItem
                    >
                  {/each}
                </DropdownMenu.RadioGroup>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        </Card.Header>
        <Card.Content>
          <div class="h-96 overflow-y-auto">
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Event</Table.Head>
                  <Table.Head>Trigger</Table.Head>
                  <Table.Head>Details</Table.Head>
                  <Table.Head class="text-right">Time</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {#each visibleEvents as item (item.id)}
                  <Table.Row>
                    <Table.Cell class="font-medium">{item.event.type}</Table.Cell>
                    <Table.Cell class="text-muted-foreground">{item.trigger}</Table.Cell>
                    <Table.Cell class="text-muted-foreground">{eventDetails(item.event)}</Table.Cell
                    >
                    <Table.Cell class="text-muted-foreground text-right tabular-nums"
                      >{item.time}</Table.Cell
                    >
                  </Table.Row>
                {:else}
                  <Table.Row>
                    <Table.Cell colspan={4} class="text-muted-foreground h-96 text-center">
                      Interact with the controls to inspect runtime events.
                    </Table.Cell>
                  </Table.Row>
                {/each}
              </Table.Body>
            </Table.Root>
          </div>
        </Card.Content>
      </Card.Root>
    </div>
  </main>

  <SiteFooter />
</div>
