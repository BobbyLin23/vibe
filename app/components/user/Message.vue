<script setup lang="ts">
defineProps<{
  content: string
}>()
</script>

<template>
  <div class="flex justify-end pb-4 pr-2 pl-10">
    <Card class="rounded-lg bg-muted p-3 shadow-none border-none max-w-[80%] break-words">
      {{ content }}
    </Card>
  </div>
</template>
