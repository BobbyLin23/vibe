<script setup lang="ts">
const { $orpc } = useNuxtApp();

const name = ref("World");

// Reactive input: the callback re-evaluates when `name` changes.
const {
  data: greeting,
  error,
  isLoading,
} = useQuery(() => $orpc.hello.greet.queryOptions({ input: { name: name.value } }));
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6 p-8">
    <header class="space-y-1">
      <NuxtLink to="/" class="text-muted-foreground text-sm hover:underline">← Examples</NuxtLink>
      <h1 class="text-2xl font-semibold tracking-tight">Hello</h1>
      <p class="text-muted-foreground text-sm">
        <code>hello.greet</code> validates its input with Zod on the server and returns a
        <code>Date</code>, which survives the wire as a real <code>Date</code>.
      </p>
    </header>

    <input
      v-model="name"
      placeholder="Your name"
      class="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-3"
    />

    <div class="rounded-lg border p-4">
      <p v-if="isLoading" class="text-muted-foreground text-sm">Loading…</p>
      <p v-else-if="error" class="text-destructive text-sm">{{ error.message }}</p>
      <template v-else-if="greeting">
        <p class="text-lg font-medium">{{ greeting.message }}</p>
        <p class="text-muted-foreground mt-1 text-xs">
          served at {{ greeting.servedAt.toLocaleTimeString() }}
        </p>
      </template>
    </div>
  </div>
</template>
