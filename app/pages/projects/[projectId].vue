<script setup lang="ts">
const route = useRoute();
const projectId = computed(() => String(route.params.projectId));
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6 p-8">
    <header class="space-y-1">
      <NuxtLink to="/" class="text-muted-foreground text-sm hover:underline"
        >← New project</NuxtLink
      >
      <h1 class="text-2xl font-semibold tracking-tight">Project</h1>
      <p class="text-muted-foreground text-sm">
        The project's messages and the coding agent's output are rendered here.
      </p>
    </header>

    <div class="rounded-lg border p-4">
      <p class="text-muted-foreground text-xs">Project ID</p>
      <p class="font-mono text-sm">{{ projectId }}</p>
    </div>
  </div>
</template>
