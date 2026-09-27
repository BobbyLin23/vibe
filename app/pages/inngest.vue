<script setup lang="ts">
const { $orpc } = useNuxtApp();

// The event carries this message to the `hello-world` function.
const form = reactive({ message: "Hello World!", id: "" });

const {
  mutate: trigger,
  data: result,
  error,
  isLoading,
} = useMutation($orpc.inngest.trigger.mutationOptions());

const devServerUrl = "http://localhost:8288";

function send() {
  // An explicit event ID deduplicates sends for 24 hours; leave it empty for a new event.
  trigger({ message: form.message.trim(), id: form.id.trim() || undefined });
}

const inputClass =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-3";
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6 p-8">
    <header class="space-y-1">
      <NuxtLink to="/" class="text-muted-foreground text-sm hover:underline">← Examples</NuxtLink>
      <h1 class="text-2xl font-semibold tracking-tight">Inngest</h1>
      <p class="text-muted-foreground text-sm">
        The form mutates <code>inngest.trigger</code>, which sends the
        <code>test/hello.world</code> event from the server and returns the event IDs. The
        <code>hello-world</code> function sleeps one second, then finishes.
      </p>
    </header>

    <form class="space-y-3 rounded-lg border p-4" @submit.prevent="send">
      <label class="space-y-1">
        <span class="text-sm font-medium">Event data</span>
        <input v-model="form.message" :class="inputClass" placeholder="Message" />
      </label>

      <label class="space-y-1">
        <span class="text-sm font-medium">
          Event ID <span class="text-muted-foreground font-normal">(optional)</span>
        </span>
        <input v-model="form.id" :class="inputClass" placeholder="dedupe-key-1" />
        <span class="text-muted-foreground block text-xs">
          Events are deduplicated by ID for 24 hours: sending twice starts a single run.
        </span>
      </label>

      <div class="flex items-center gap-3">
        <Button type="submit" :disabled="isLoading || !form.message.trim()">
          {{ isLoading ? "Sending…" : "Send event" }}
        </Button>
        <p v-if="error" class="text-destructive text-sm">{{ error.message }}</p>
      </div>
    </form>

    <div v-if="result" class="rounded-lg border p-4">
      <p class="text-sm font-medium">Event accepted</p>
      <ul class="mt-2 space-y-1">
        <li v-for="id in result.ids" :key="id" class="text-muted-foreground font-mono text-xs">
          {{ id }}
        </li>
      </ul>
      <p class="text-muted-foreground mt-3 text-xs">
        Follow the run in the Inngest dev server:
        <a :href="devServerUrl" target="_blank" class="underline">{{ devServerUrl }}</a>
        — it must be running (<code>pnpm dev:inngest</code>).
      </p>
    </div>
  </div>
</template>
