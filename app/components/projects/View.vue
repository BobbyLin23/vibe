<script setup lang="ts">
defineProps<{ projectId: string }>();
</script>

<template>
  <div class="h-screen">
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel :default-size="35" :min-size="20" class="flex min-h-0 flex-col">
        <ProjectsMessagesContainer :project-id="projectId" />
      </ResizablePanel>
      <ResizableHandle with-handle />
      <ResizablePanel :default-size="65" :min-size="50"> TODO: Preview </ResizablePanel>
    </ResizablePanelGroup>
  </div>
</template>
