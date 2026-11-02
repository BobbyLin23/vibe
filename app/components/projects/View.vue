<script setup lang="ts">
import type { Fragment } from "./types";

defineProps<{ projectId: string }>();

const activeFragment = ref<Fragment | null>(null);
</script>

<template>
  <div class="h-screen">
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel :default-size="35" :min-size="20" class="flex min-h-0 flex-col">
        <ProjectsHeader :project-id="projectId" />
        <ProjectsMessagesContainer
          v-model:active-fragment="activeFragment"
          :project-id="projectId"
        />
      </ResizablePanel>
      <ResizableHandle with-handle />
      <ResizablePanel :default-size="65" :min-size="50" class="min-h-0">
        <ProjectsFragmentWeb v-if="activeFragment" :data="activeFragment" />
      </ResizablePanel>
    </ResizablePanelGroup>
  </div>
</template>
