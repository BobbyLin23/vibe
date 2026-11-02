<script setup lang="ts">
import { RiExternalLinkLine, RiRefreshLine } from "@remixicon/vue";
import type { Fragment } from "./types";

const props = defineProps<{ data: Fragment }>();

const copied = ref(false);
const fragmentKey = ref(0);
let copyTimeout: ReturnType<typeof setTimeout> | undefined;

onBeforeUnmount(() => clearTimeout(copyTimeout));

function onRefresh() {
  fragmentKey.value += 1;
}

async function handleCopy() {
  await navigator.clipboard.writeText(props.data.sandboxUrl);
  copied.value = true;
  clearTimeout(copyTimeout);
  copyTimeout = setTimeout(() => {
    copied.value = false;
  }, 2000);
}

function openInNewTab() {
  if (!props.data.sandboxUrl) return;
  window.open(props.data.sandboxUrl, "_blank");
}
</script>

<template>
  <div class="flex h-full w-full flex-col">
    <div class="bg-sidebar flex items-center gap-x-2 border-b p-2">
      <Hint text="Refresh" side="bottom" align="start">
        <Button size="sm" variant="outline" @click="onRefresh">
          <RiRefreshLine />
        </Button>
      </Hint>
      <Hint text="Click to copy" side="bottom">
        <Button
          size="sm"
          variant="outline"
          class="flex-1 justify-start text-start font-normal"
          :disabled="!data.sandboxUrl || copied"
          @click="handleCopy"
        >
          <span class="truncate">{{ data.sandboxUrl }}</span>
        </Button>
      </Hint>
      <Hint text="Open in a new tab" side="bottom" align="start">
        <Button size="sm" variant="outline" :disabled="!data.sandboxUrl" @click="openInNewTab">
          <RiExternalLinkLine />
        </Button>
      </Hint>
    </div>
    <iframe
      :key="fragmentKey"
      class="h-full w-full"
      sandbox="allow-forms allow-scripts allow-same-origin"
      loading="lazy"
      :src="data.sandboxUrl"
    />
  </div>
</template>
