<script lang="ts">
  import { SiGithub } from '@icons-pack/svelte-simple-icons';
  import { BookOpenText, CircleQuestionMark } from '@lucide/svelte';
</script>

<footer
  class="border-border/80 text-muted-foreground flex flex-wrap items-center justify-between gap-4 border-t py-6 text-sm"
>
  <span class="text-foreground inline-flex items-center gap-2 font-semibold">
    <img
      src={`${import.meta.env.BASE_URL}pulse.svg`}
      alt=""
      width="20"
      height="20"
      class="size-5 dark:invert"
    />
  </span>
  <nav class="flex items-center gap-1" aria-label="Project resources">
    <a
      class="text-muted-foreground surface-transition hover:bg-muted hover:text-foreground focus-visible:outline-ring inline-flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95"
      href="https://github.com/weluvabid/pulse"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Pulse source code on GitHub (opens in a new tab)"
      title="Source code"
    >
      <SiGithub size={19} aria-hidden="true" />
    </a>
    <a
      class="text-muted-foreground surface-transition hover:bg-muted hover:text-foreground focus-visible:outline-ring inline-flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95"
      href="https://github.com/weluvabid/pulse/tree/main/docs"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Pulse documentation (opens in a new tab)"
      title="Documentation"
    >
      <BookOpenText size={19} aria-hidden="true" />
    </a>
    <a
      class="text-muted-foreground surface-transition hover:bg-muted hover:text-foreground focus-visible:outline-ring inline-flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95"
      href="https://github.com/weluvabid/pulse/wiki"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Pulse project wiki (opens in a new tab)"
      title="Wiki"
    >
      <CircleQuestionMark size={19} aria-hidden="true" />
    </a>
  </nav>
</footer>
