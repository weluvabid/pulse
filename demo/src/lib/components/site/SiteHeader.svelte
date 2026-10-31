<script lang="ts">
  import { Moon, Sun } from '@lucide/svelte';
  import { SiGithub } from '@icons-pack/svelte-simple-icons';
  import * as Tooltip from '$lib/components/ui/tooltip';

  let { darkMode, onToggleTheme }: { darkMode: boolean; onToggleTheme: () => void } = $props();
</script>

<header
  class="border-border/80 bg-background/90 supports-[backdrop-filter]:bg-background/80 sticky top-3 z-40 mt-3 flex items-center justify-between rounded-full border px-4 py-2.5 shadow-lg shadow-black/10 backdrop-blur-xl transition-colors sm:px-5 dark:shadow-black/35"
>
  <a
    class="text-foreground focus-visible:outline-ring rounded-sm font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4"
    href={`${import.meta.env.BASE_URL}`}
    aria-label="Pulse home"
  >
    <span class="flex items-center gap-2">
      <img
        src={`${import.meta.env.BASE_URL}pulse.svg`}
        alt=""
        width="22"
        height="22"
        class="size-[22px] dark:invert"
      />
      pulse
    </span>
  </a>
  <nav class="flex items-center gap-1" aria-label="Site navigation">
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger
          class="text-muted-foreground surface-transition hover:bg-muted hover:text-foreground focus-visible:outline-ring inline-flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95"
          onclick={onToggleTheme}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {#if darkMode}<Sun size={20} aria-hidden="true" />{:else}<Moon
              size={20}
              aria-hidden="true"
            />{/if}
        </Tooltip.Trigger>
        <Tooltip.Content
          >{darkMode ? 'Switch to light mode' : 'Switch to dark mode'}</Tooltip.Content
        >
      </Tooltip.Root>
      <a
        class="text-muted-foreground surface-transition hover:bg-muted hover:text-foreground focus-visible:outline-ring inline-flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95"
        href="https://github.com/weluvabid/pulse"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Pulse on GitHub (opens in a new tab)"
        title="View source on GitHub"
      >
        <SiGithub size={20} aria-hidden="true" />
      </a>
    </Tooltip.Provider>
  </nav>
</header>
