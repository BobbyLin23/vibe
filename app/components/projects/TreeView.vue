<script setup lang="ts">
import type { TreeItem } from "@/types";

defineProps<{
  data: TreeItem[];
  value?: string | null;
}>();

const emit = defineEmits<{ select: [value: string] }>();
</script>

<template>
  <div class="bg-sidebar h-full w-full overflow-auto">
    <div class="p-2">
      <ul class="flex w-full min-w-0 flex-col gap-0.5">
        <li v-for="(item, index) in data" :key="index">
          <ProjectsTreeViewNode
            :item="item"
            :selected-value="value"
            parent-path=""
            @select="emit('select', $event)"
          />
        </li>
      </ul>
    </div>
  </div>
</template>
