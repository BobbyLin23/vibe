<script setup lang="ts">
import { RiCheckLine, RiFileCopyLine } from "@remixicon/vue";
import { convertFilesToTreeItems } from "@/lib/utils";

const props = defineProps<{ files: Record<string, string> }>();

const copied = ref(false);
const selectedFile = ref<string | null>(Object.keys(props.files)[0] ?? null);
let copyTimeout: ReturnType<typeof setTimeout> | undefined;

onBeforeUnmount(() => clearTimeout(copyTimeout));

const treeData = computed(() => convertFilesToTreeItems(props.files));
const selectedContent = computed(() =>
  selectedFile.value === null ? null : (props.files[selectedFile.value] ?? null),
);

// A different fragment may expose a different file set; keep the selection valid.
watch(
  () => Object.keys(props.files),
  (keys) => {
    if (!selectedFile.value || !keys.includes(selectedFile.value)) {
      selectedFile.value = keys[0] ?? null;
    }
  },
);

function getLanguageFromExtension(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase();
  return extension || "text";
}

function handleFileSelect(filePath: string) {
  if (filePath in props.files) {
    selectedFile.value = filePath;
  }
}

async function handleCopy() {
  if (selectedContent.value === null) return;

  await navigator.clipboard.writeText(selectedContent.value);
  copied.value = true;
  clearTimeout(copyTimeout);
  copyTimeout = setTimeout(() => {
    copied.value = false;
  }, 2000);
}
</script>

<template>
  <ResizablePanelGroup direction="horizontal" class="h-full">
    <ResizablePanel :default-size="30" :min-size="30" class="bg-sidebar">
      <ProjectsTreeView :data="treeData" :value="selectedFile" @select="handleFileSelect" />
    </ResizablePanel>

    <ResizableHandle class="hover:bg-primary transition-colors" />

    <ResizablePanel :default-size="70" :min-size="50">
      <div v-if="selectedFile && selectedContent !== null" class="flex h-full w-full flex-col">
        <div class="bg-sidebar flex items-center justify-between gap-x-2 border-b px-4 py-2">
          <ProjectsFileBreadcrumb :file-path="selectedFile" />
          <Hint text="Copy to clipboard" side="bottom">
            <Button
              variant="outline"
              size="icon"
              class="ml-auto"
              :disabled="copied"
              @click="handleCopy"
            >
              <RiCheckLine v-if="copied" />
              <RiFileCopyLine v-else />
            </Button>
          </Hint>
        </div>
        <div class="flex-1 overflow-auto">
          <ProjectsCodeView
            :code="selectedContent"
            :lang="getLanguageFromExtension(selectedFile)"
          />
        </div>
      </div>

      <div v-else class="text-muted-foreground flex h-full items-center justify-center">
        Select a file to view its content
      </div>
    </ResizablePanel>
  </ResizablePanelGroup>
</template>
