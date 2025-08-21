<script setup lang="ts">
import { ChevronRightIcon, Code2Icon } from 'lucide-vue-next'

defineProps<{
  fragment: Fragment
  isActiveFragment: boolean
}>()

defineEmits<{
  (e: 'fragmentClick', fragment: Fragment): void
}>()
</script>

<template>
  <button
    :class="cn('flex items-start text-start gap-2 border rounded-lg bg-muted w-fit p-3 hover:bg-secondary transition-colors', isActiveFragment && 'bg-primary text-primary-foreground border-primary hover:bg-primary')"
    @click="$emit('fragmentClick', fragment)"
  >
    <Code2Icon />
    <div class="flex flex-col flex-1">
      <span class="text-sm font-medium line-clamp-1">
        {{ fragment.title }}
      </span>
      <span class="text-sm">
        Preview
      </span>
    </div>
    <div class="flex items-center justify-center mt-0.5">
      <ChevronRightIcon class="size-4" />
    </div>
  </button>
</template>
