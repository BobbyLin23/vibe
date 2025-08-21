<script lang="ts" setup>
import { useQuery } from '@tanstack/vue-query'

const props = defineProps<{
  projectId: string
}>()

const bottomRef = ref<HTMLDivElement | null>(null)

const { $orpc } = useNuxtApp()

const { data: messages } = useQuery($orpc.messages.getMany.queryOptions({
  input: {
    projectId: props.projectId,
  },
}))

onMounted(() => {
  const lastAssistantMessage = messages.value?.findLast(message => message.message.role === 'assistant')

  if (lastAssistantMessage) {
    bottomRef.value?.scrollIntoView({ behavior: 'smooth' })
  }
})

watch(messages, () => {
  bottomRef.value?.scrollIntoView({ behavior: 'smooth' })
})
</script>

<template>
  <div class="flex flex-col min-h-0 flex-1">
    <div class="flex-1 min-h-0 overflow-y-auto">
      <div class="pt-2 pr-1">
        <MessageCard
          v-for="item in messages"
          :key="item.message.id"
          :content="item.message.content"
          :role="item.message.role"
          :fragment="item.fragment"
          :created-at="item.message.createdAt"
          :is-active-fragment="true"
          :type="item.message.type"
        />
        <div ref="bottomRef" />
      </div>
    </div>
    <div class="relative pt-1 p-3">
      <div class="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background pointer-events-none" />
      <MessageForm :project-id="projectId" />
    </div>
  </div>
</template>
