<script setup lang="ts">
const props = defineProps<{ projectId: string }>();

const { $orpc } = useNuxtApp();

const bottomRef = ref<HTMLDivElement | null>(null);

const {
  data: messages,
  error,
  isLoading,
} = useQuery(() => $orpc.messages.getMany.queryOptions({ input: { projectId: props.projectId } }));

// TODO: set the active fragment from the last assistant message.
watch(
  () => messages.value?.length ?? 0,
  async () => {
    await nextTick();
    bottomRef.value?.scrollIntoView();
  },
  { immediate: true },
);
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div class="min-h-0 flex-1 overflow-y-auto">
      <div class="pt-2 pr-1">
        <p v-if="isLoading" class="text-muted-foreground p-4 text-sm">Loading messages…</p>
        <p v-else-if="error" class="text-destructive p-4 text-sm">{{ error.message }}</p>

        <ProjectsMessageCard
          v-for="message in messages ?? []"
          :key="message.id"
          :content="message.content"
          :role="message.role"
          :fragment="message.fragment"
          :created-at="message.createdAt"
          :is-active-fragment="false"
          :type="message.type"
        />
        <div ref="bottomRef" />
      </div>
    </div>

    <div class="relative p-3 pt-1">
      <div
        class="to-background pointer-events-none absolute -top-6 right-0 left-0 h-6 bg-linear-to-b from-transparent"
      />
      <ProjectsMessageForm :project-id="projectId" />
    </div>
  </div>
</template>
