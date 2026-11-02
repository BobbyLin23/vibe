<script setup lang="ts">
const messages = [
  "Thinking...",
  "Loading...",
  "Generating...",
  "Analyzing your request...",
  "Building your website...",
  "Crafting components...",
  "Optimizing layout...",
  "Adding final touches...",
  "Almost ready...",
];

const currentMessageIndex = ref(0);

useIntervalFn(() => {
  currentMessageIndex.value = (currentMessageIndex.value + 1) % messages.length;
}, 2000);
</script>

<template>
  <div class="group flex flex-col px-2 pb-4">
    <div class="mb-2 flex items-center gap-2 pl-2">
      <img src="/logo.svg" alt="Vibe" width="18" height="18" class="shrink-0" />
      <span class="text-sm font-medium">Vibe</span>
    </div>
    <div class="flex flex-col gap-y-4 pl-8.5">
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground animate-pulse text-base">
          {{ messages[currentMessageIndex] }}
        </span>
      </div>
    </div>
  </div>
</template>
