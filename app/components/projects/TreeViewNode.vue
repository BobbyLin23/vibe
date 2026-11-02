<script setup lang="ts">
import { RiArrowRightSLine, RiFileLine, RiFolderLine } from "@remixicon/vue";
import type { TreeItem } from "@/types";
import { cn } from "@/lib/utils";

const props = defineProps<{
  item: TreeItem;
  selectedValue?: string | null;
  parentPath: string;
}>();

const emit = defineEmits<{ select: [value: string] }>();

const name = computed(() => (Array.isArray(props.item) ? props.item[0] : props.item));
const children = computed<TreeItem[]>(() => (Array.isArray(props.item) ? props.item.slice(1) : []));
const currentPath = computed(() =>
  props.parentPath ? `${props.parentPath}/${name.value}` : name.value,
);
const isFile = computed(() => children.value.length === 0);
const isSelected = computed(() => props.selectedValue === currentPath.value);
</script>

<template>
  <button
    v-if="isFile"
    type="button"
    :class="
      cn(
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-8 w-full min-w-0 items-center gap-2 overflow-hidden rounded-md px-2 text-left text-sm',
        isSelected && 'bg-sidebar-accent text-sidebar-accent-foreground',
      )
    "
    @click="emit('select', currentPath)"
  >
    <RiFileLine class="size-4 shrink-0" />
    <span class="truncate">{{ name }}</span>
  </button>

  <Collapsible v-else default-open class="group/collapsible">
    <CollapsibleTrigger as-child>
      <button
        type="button"
        class="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-8 w-full min-w-0 items-center gap-2 overflow-hidden rounded-md px-2 text-left text-sm"
      >
        <RiArrowRightSLine
          class="size-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-90"
        />
        <RiFolderLine class="size-4 shrink-0" />
        <span class="truncate">{{ name }}</span>
      </button>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <ul class="border-sidebar-border ml-3 flex min-w-0 flex-col gap-0.5 border-l pl-2">
        <li v-for="(child, index) in children" :key="index">
          <ProjectsTreeViewNode
            :item="child"
            :selected-value="selectedValue"
            :parent-path="currentPath"
            @select="emit('select', $event)"
          />
        </li>
      </ul>
    </CollapsibleContent>
  </Collapsible>
</template>
