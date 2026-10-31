<script lang="ts">
  import { ChevronDown } from '@lucide/svelte';
  import * as Badge from '$lib/components/ui/badge';
  import * as Button from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import * as Table from '$lib/components/ui/table';
  import {
    EVENT_FILTERS,
    formatEventDetails,
    type EventEntry,
    type EventFilter,
  } from '$lib/playground/model';

  let {
    events,
    eventFilter = $bindable('all'),
  }: {
    events: EventEntry[];
    eventFilter: EventFilter;
  } = $props();

  let visibleEvents = $derived(
    eventFilter === 'all' ? events : events.filter((item) => item.trigger === eventFilter),
  );
  let selectedFilterLabel = $derived(
    EVENT_FILTERS.find((filter) => filter.value === eventFilter)?.label ?? 'All events',
  );
</script>

<Card.Root class="border-border bg-card flex flex-col rounded-none shadow-none">
  <Card.Header class="shrink-0">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <Card.Title class="text-base">Runtime events</Card.Title>
        <Badge.Badge variant="secondary" class="rounded-none">{visibleEvents.length}</Badge.Badge>
      </div>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <Button.Root {...props} variant="outline" size="xs">
              {selectedFilterLabel}
              <ChevronDown />
            </Button.Root>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <DropdownMenu.RadioGroup bind:value={eventFilter}>
            {#each EVENT_FILTERS as filter (filter.value)}
              <DropdownMenu.RadioItem value={filter.value}>{filter.label}</DropdownMenu.RadioItem>
            {/each}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  </Card.Header>
  <Card.Content class="min-h-0">
    <div class="h-[min(28rem,55vh)] min-h-64 overflow-y-auto overscroll-contain">
      <Table.Root aria-label="Reactive runtime events">
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
              <Table.Cell class="text-muted-foreground">{formatEventDetails(item.event)}</Table.Cell
              >
              <Table.Cell class="text-muted-foreground text-right tabular-nums">
                {item.time}
              </Table.Cell>
            </Table.Row>
          {:else}
            <Table.Row>
              <Table.Cell colspan={4} class="text-muted-foreground h-64 text-center">
                Interact with the controls to inspect runtime events.
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </div>
  </Card.Content>
</Card.Root>
