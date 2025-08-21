<script lang="ts" setup>
defineProps<{
  content: string
  role: MessageRole
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
  <template v-if="role === 'assistant'">
    <AssistantMessage
      :content="content"
      :created-at="createdAt"
      :fragment="fragment"
      :is-active-fragment="isActiveFragment"
      :type="type"
    />
  </template>
  <template v-else>
    <UserMessage :content="content" />
  </template>
</template>
