<script setup lang="ts">
import { RiCodeSLine, RiEyeLine, RiVipCrownLine } from "@remixicon/vue";
import type { Fragment } from "./types";

defineProps<{ projectId: string }>();

const activeFragment = ref<Fragment | null>(null);
const tabState = ref<"preview" | "code">("preview");

// `fragments.files` is stored as JSON, so narrow it before handing it to the explorer.
const activeFragmentFiles = computed<Record<string, string> | null>(() => {
  const files = activeFragment.value?.files;

  if (!files || typeof files !== "object" || Array.isArray(files)) return null;

  return files as Record<string, string>;
});
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
        <Tabs v-model="tabState" class="h-full gap-y-0">
          <div class="flex w-full items-center gap-x-2 border-b p-2">
            <TabsList class="h-8 rounded-md border p-0">
              <TabsTrigger value="preview" class="rounded-md">
                <RiEyeLine /> <span>Demo</span>
              </TabsTrigger>
              <TabsTrigger value="code" class="rounded-md">
                <RiCodeSLine /> <span>Code</span>
              </TabsTrigger>
            </TabsList>
            <div class="ml-auto flex items-center gap-x-2">
              <Button as-child size="sm" variant="default">
                <NuxtLink to="/pricing"> <RiVipCrownLine /> Upgrade </NuxtLink>
              </Button>
            </div>
          </div>

          <TabsContent value="preview" class="min-h-0 flex-1">
            <ProjectsFragmentWeb v-if="activeFragment" :data="activeFragment" />
          </TabsContent>

          <TabsContent value="code" class="min-h-0 flex-1">
            <ProjectsFileExplorer v-if="activeFragmentFiles" :files="activeFragmentFiles" />
          </TabsContent>
        </Tabs>
      </ResizablePanel>
    </ResizablePanelGroup>
  </div>
</template>
