<script setup lang="ts">
import type { Fragment } from "./types";

const props = defineProps<{ projectId: string }>();

// Two-way so `View` can hand the selected fragment to the preview pane.
const activeFragment = defineModel<Fragment | null>("activeFragment", { default: null });

const { $orpc } = useNuxtApp();

const bottomRef = ref<HTMLDivElement | null>(null);

// `isPending` (not `isLoading`) so the 5s poll below doesn't flash "Loading messages…"
// on every refetch — `isLoading` tracks every in-flight request, `isPending` only the
// initial load with no data yet.
const {
  data: messages,
  error,
  isPending,
  refetch,
} = useQuery(() => $orpc.messages.getMany.queryOptions({ input: { projectId: props.projectId } }));

// TODO: Temporary live message updates until realtime replaces polling.
useIntervalFn(() => void refetch(), 5000);

watch(
  () => messages.value?.length ?? 0,
  async () => {
    await nextTick();
    bottomRef.value?.scrollIntoView();
  },
  { immediate: true },
);

const isLastMessageUser = computed(() => messages.value?.at(-1)?.role === "user");
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div class="min-h-0 flex-1 overflow-y-auto">
      <div class="pt-2 pr-1">
        <p v-if="isPending" class="text-muted-foreground p-4 text-sm">Loading messages…</p>
        <p v-else-if="error" class="text-destructive p-4 text-sm">{{ error.message }}</p>

        <ProjectsMessageCard
          v-for="message in messages ?? []"
          :key="message.id"
          :content="message.content"
          :role="message.role"
          :fragment="message.fragment"
          :created-at="message.createdAt"
          :is-active-fragment="activeFragment?.id === message.fragment?.id"
          :type="message.type"
          @fragment-click="activeFragment = message.fragment"
        />
        <ProjectsMessageLoading v-if="isLastMessageUser" />
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
