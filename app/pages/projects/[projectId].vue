<script setup lang="ts">
import { z } from "zod";

const route = useRoute();
const projectId = computed(() => String(route.params.projectId));
const { $client } = useNuxtApp();

// Checks the project exists before rendering its message pane. `useAsyncData` is
// used instead of a cached query because the thrown oRPC error cannot be
// serialized into the query cache during SSR; the message string can.
const { data: notFound } = await useAsyncData(
  () => `project-exists:${projectId.value}`,
  async () => {
    if (!z.uuid().safeParse(projectId.value).success) return true;

    try {
      await $client.projects.getOne({ id: projectId.value });
      return false;
    } catch {
      return true;
    }
  },
);
</script>

<template>
  <div v-if="notFound" class="flex min-h-screen items-center justify-center p-8">
    <div class="space-y-3 text-center">
      <h1 class="text-2xl font-semibold tracking-tight">Project not found</h1>
      <NuxtLink to="/" class="text-sm underline">← New project</NuxtLink>
    </div>
  </div>

  <ProjectsView v-else :project-id="projectId" />
</template>
