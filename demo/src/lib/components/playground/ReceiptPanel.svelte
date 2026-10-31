<script lang="ts">
  import * as Badge from '$lib/components/ui/badge';
  import * as Card from '$lib/components/ui/card';
  import * as Separator from '$lib/components/ui/separator';

  let {
    price,
    quantity,
    subtotal,
    tax,
    total,
    effectRuns,
  }: {
    price: number;
    quantity: number;
    subtotal: number;
    tax: number;
    total: number;
    effectRuns: number;
  } = $props();

  const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });
</script>

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
        <p class="text-sm font-medium tabular-nums">{currency.format(price)}</p>
      </div>
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-sm font-medium">Quantity</p>
          <p class="text-muted-foreground mt-1 text-xs">Items</p>
        </div>
        <p class="text-sm font-medium tabular-nums">{quantity}</p>
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
        <p class="text-sm font-medium tabular-nums">{currency.format(subtotal)}</p>
      </div>
      <div class="flex items-start justify-between gap-4">
        <p class="text-sm font-medium">Tax (18%)</p>
        <p class="text-sm font-medium tabular-nums">{currency.format(tax)}</p>
      </div>
    </div>

    <Separator.Root />

    <div class="flex items-end justify-between gap-4">
      <div>
        <p class="text-sm font-semibold">Total</p>
        <p class="text-muted-foreground mt-1 text-xs">Including 18% tax</p>
      </div>
      <p class="text-2xl font-semibold tracking-tight tabular-nums">{currency.format(total)}</p>
    </div>

    <Separator.Root />

    <div class="text-muted-foreground flex items-center justify-between gap-3 text-sm">
      <span>Reactive effect runs</span>
      <span class="tabular-nums">{effectRuns}</span>
    </div>
  </Card.Content>
</Card.Root>
