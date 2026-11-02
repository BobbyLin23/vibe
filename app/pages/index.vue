<script setup lang="ts">
import { toast } from "vue-sonner";

const { $orpc } = useNuxtApp();
const router = useRouter();

const value = ref("");

const { mutate: createProject, isLoading } = useMutation(
  $orpc.projects.create.mutationOptions({
    onError: (cause) => toast.error(cause.message),
    onSuccess: (project) => router.push(`/projects/${project.id}`),
  }),
);

function submit() {
  if (!value.value.trim()) return;

  createProject({ value: value.value });
}

const textareaClass =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-3";
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-8">
    <div class="mx-auto flex w-full max-w-xl flex-col items-center gap-6">
      <header class="space-y-2 text-center">
        <h1 class="text-2xl font-semibold tracking-tight">What do you want to build?</h1>
        <p class="text-muted-foreground text-sm">
          Your prompt creates a project and starts the coding agent. You can return to it later.
        </p>
      </header>

      <form class="flex w-full flex-col gap-3" @submit.prevent="submit">
        <textarea
          v-model="value"
          :class="textareaClass"
          rows="3"
          placeholder="Build a landing page for a coffee shop…"
        />

        <Button type="submit" :disabled="isLoading || !value.trim()">
          {{ isLoading ? "Creating…" : "Submit" }}
        </Button>
      </form>

      <p class="text-muted-foreground text-xs">
        Demos:
        <NuxtLink to="/hello" class="underline">Hello</NuxtLink>
        ·
        <NuxtLink to="/inngest" class="underline">Inngest</NuxtLink>
        ·
        <NuxtLink to="/agent" class="underline">Agent</NuxtLink>
      </p>
    </div>
  </div>
</template>
