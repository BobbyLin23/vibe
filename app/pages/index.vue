<script setup lang="ts">
const examples = [
  {
    to: "/hello",
    title: "Hello",
    description: "One query with a reactive input — no database, shows typed input and output.",
  },
  {
    to: "/users",
    title: "Users",
    description:
      "List, create and delete rows via Drizzle — queries, mutations and cache invalidation.",
  },
  {
    to: "/inngest",
    title: "Inngest",
    description:
      "Send a durable-function event through a mutation — the run finishes on the Inngest dev server.",
  },
  {
    to: "/agent",
    title: "Coding agent",
    description:
      "An AgentKit agent on DeepSeek inside a durable function — start a run, then stream its progress.",
  },
];
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-8 p-8">
    <header class="flex items-start justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-2xl font-semibold tracking-tight">oRPC + Pinia Colada</h1>
        <p class="text-muted-foreground text-sm">
          Procedures live in <code>server/router</code>, are called through <code>$client</code>,
          and cached with <code>useQuery</code> / <code>useMutation</code>.
        </p>
      </div>
      <ModeToggle />
    </header>

    <div class="grid gap-4">
      <NuxtLink
        v-for="example in examples"
        :key="example.to"
        :to="example.to"
        class="hover:bg-accent/50 rounded-lg border p-4 transition-colors"
      >
        <p class="font-medium">{{ example.title }}</p>
        <p class="text-muted-foreground text-sm">{{ example.description }}</p>
      </NuxtLink>
    </div>
  </div>
</template>
