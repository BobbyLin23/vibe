<script setup lang="ts">
import { format } from 'date-fns'

defineProps<{
  content: string
  fragment: Fragment | null
  createdAt: Date
  isActiveFragment: boolean
  type?: MessageType
}>()

defineEmits<{
  (e: 'fragment:click', fragment: Fragment): void
}>()
</script>

<template>
  <div :class="cn('flex flex-col group px-2 pb-4', type === 'error' && 'text-red-700 dark:text-red-500')">
    <div class="flex items-center gap-2 pl-2 mb-2">
      <NuxtImg src="/logo.svg" alt="Vibe" :width="18" :height="18" class="shrink-0" />
      <span class="text-sm font-medium">
        Vibe
      </span>
      <span class="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        {{ format(createdAt, "HH:mm 'on' MMM dd, yyyy") }}
      </span>
    </div>
    <div class="pl-8 flex flex-col gap-y-4">
      <span>
        {{ content }}
      </span>
    </div>
  </div>
</template>
