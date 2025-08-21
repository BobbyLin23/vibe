<script lang="ts" setup>
import { useQuery } from '@tanstack/vue-query'

const { $orpc } = useNuxtApp()

const route = useRoute()

const queryMessages = useQuery($orpc.messages.getMany.queryOptions({
  input: {
    projectId: route.params.projectId as string,
  },
}))

const queryProject = useQuery($orpc.projects.getOne.queryOptions({
  input: {
    id: route.params.projectId as string,
  },
}))

await queryMessages.suspense()
await queryProject.suspense()
</script>

<template>
  <div class="h-screen">
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel :default-size="35" :min-size="20" class="flex flex-col min-h-0">
        <Suspense>
          <MessagesContainer :project-id="route.params.projectId as string" />
          <template #fallback>
            <p>Loading messages...</p>
          </template>
        </Suspense>
      </ResizablePanel>
      <ResizableHandle with-handle />
      <ResizablePanel :default-size="65" :min-size="50">
        123
      </ResizablePanel>
    </ResizablePanelGroup>
  </div>
</template>
