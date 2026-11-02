<script setup lang="ts">
import { RiArrowRightSLine, RiCodeSLine } from "@remixicon/vue";
import { cn } from "@/lib/utils";
import type { Fragment, Message } from "./types";

const props = defineProps<{
  content: string;
  role: Message["role"];
  fragment: Fragment | null;
  createdAt: Date;
  isActiveFragment: boolean;
  type: Message["type"];
}>();

const emit = defineEmits<{ fragmentClick: [fragment: Fragment] }>();

const time = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const date = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

const formattedCreatedAt = computed(
  () => `${time.format(props.createdAt)} on ${date.format(props.createdAt)}`,
);
</script>

<template>
  <div v-if="role === 'user'" class="flex justify-end pr-2 pb-4 pl-10">
    <Card class="bg-muted max-w-[80%] rounded-lg border-none p-3 wrap-break-word shadow-none">
      {{ content }}
    </Card>
  </div>

  <div
    v-else
    :class="
      cn('group flex flex-col px-2 pb-4', type === 'error' && 'text-red-700 dark:text-red-500')
    "
  >
    <div class="mb-2 flex items-center gap-2 pl-2">
      <img src="/logo.svg" alt="Vibe" width="18" height="18" class="shrink-0" />
      <span class="text-sm font-medium">Vibe</span>
      <span
        class="text-muted-foreground text-xs opacity-0 transition-opacity group-hover:opacity-100"
      >
        {{ formattedCreatedAt }}
      </span>
    </div>
    <div class="flex flex-col gap-y-4 pl-8.5">
      <span>{{ content }}</span>
      <button
        v-if="fragment && type === 'result'"
        :class="
          cn(
            'bg-muted hover:bg-secondary flex w-fit items-start gap-2 rounded-lg border p-3 text-start transition-colors',
            isActiveFragment &&
              'bg-primary text-primary-foreground border-primary hover:bg-primary',
          )
        "
        @click="emit('fragmentClick', fragment)"
      >
        <RiCodeSLine class="mt-0.5 size-4" />
        <div class="flex flex-1 flex-col">
          <span class="line-clamp-1 text-sm font-medium">
            {{ fragment.title }}
          </span>
          <span class="text-sm">Preview</span>
        </div>
        <div class="mt-0.5 flex items-center justify-center">
          <RiArrowRightSLine class="size-4" />
        </div>
      </button>
    </div>
  </div>
</template>
