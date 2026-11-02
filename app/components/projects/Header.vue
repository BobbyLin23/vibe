<script setup lang="ts">
import { RiArrowDownSLine, RiArrowLeftSLine, RiContrastLine } from "@remixicon/vue";

const props = defineProps<{ projectId: string }>();

const { $orpc } = useNuxtApp();
const colorMode = useColorMode();

const { data: project } = useQuery(() =>
  $orpc.projects.getOne.queryOptions({ input: { id: props.projectId } }),
);

function setPreference(value: unknown) {
  colorMode.preference = String(value);
}
</script>

<template>
  <header class="flex items-center justify-between border-b p-2">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          variant="ghost"
          size="sm"
          class="pl-2! transition-opacity hover:bg-transparent hover:opacity-75 focus-visible:ring-0"
        >
          <img src="/logo.svg" alt="Vibe" width="18" height="18" />
          <span class="text-sm font-medium">{{ project?.name }}</span>
          <RiArrowDownSLine />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="start">
        <DropdownMenuItem as-child>
          <NuxtLink to="/">
            <RiArrowLeftSLine />
            <span>Go to Dashboard</span>
          </NuxtLink>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger class="gap-2">
            <RiContrastLine class="text-muted-foreground size-4" />
            <span>Appearance</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                :model-value="colorMode.preference"
                @update:model-value="setPreference"
              >
                <DropdownMenuRadioItem value="light">
                  <span>Light</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  <span>Dark</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">
                  <span>System</span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  </header>
</template>
