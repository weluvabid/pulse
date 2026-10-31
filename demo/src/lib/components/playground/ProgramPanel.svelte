<script lang="ts">
  import { ChevronDown, RotateCcw } from '@lucide/svelte';
  import * as Badge from '$lib/components/ui/badge';
  import * as Button from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as CodeBlock from '$lib/components/ui/code-block';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import type { HighlightedLine } from '$lib/highlighter';
  import { QUANTITY_OPTIONS } from '$lib/playground/model';

  let {
    highlightedLines,
    selectedQuantity,
    onQuantityChange,
    onReset,
  }: {
    highlightedLines: HighlightedLine[];
    selectedQuantity: string;
    onQuantityChange: (value: string) => void;
    onReset: () => void;
  } = $props();
</script>

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

    <div class="flex flex-wrap items-center justify-between gap-4">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <Button.Root
              {...props}
              variant="outline"
              size="xs"
              class="min-w-28 justify-between"
              aria-label="Select quantity"
            >
              {selectedQuantity} items
              <ChevronDown size={14} />
            </Button.Root>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="start" class="w-36">
          <DropdownMenu.RadioGroup
            bind:value={() => selectedQuantity, (value) => onQuantityChange(value)}
          >
            {#each QUANTITY_OPTIONS as option (option)}
              <DropdownMenu.RadioItem value={option.toString()} closeOnSelect>
                {option}
                {option === 1 ? 'item' : 'items'}
              </DropdownMenu.RadioItem>
            {/each}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      <Button.Root variant="default" size="xs" onclick={onReset}>
        <RotateCcw size={14} />
        Reset
      </Button.Root>
    </div>
  </Card.Content>
</Card.Root>
