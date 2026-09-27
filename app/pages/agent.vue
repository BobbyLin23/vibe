<script setup lang="ts">
import { subscribe } from "inngest/realtime";
import { codingAgentChannel } from "~~/inngest/channels";

type AgentProgress = typeof codingAgentChannel.$infer.progress;
type AgentResult = typeof codingAgentChannel.$infer.result;

const { $client, $orpc } = useNuxtApp();

const prompt = ref(
  "Write a TypeScript module that turns an ISO date string into the weekday name, plus a small test file.",
);

const runId = ref<string | null>(null);
const progress = ref<AgentProgress[]>([]);
const result = ref<AgentResult | null>(null);
const streamError = ref<string | null>(null);

let subscription: { close?: (reason?: string) => void } | undefined;

const {
  mutate: startRun,
  error,
  isLoading,
} = useMutation(
  $orpc.agent.run.mutationOptions({
    onSuccess: async (data) => {
      runId.value = data.runId;
      progress.value = [];
      result.value = null;
      streamError.value = null;

      // The run ID is the channel: subscribe before the function publishes anything.
      const channel = codingAgentChannel(data.runId);
      const token = await $client.agent.subscriptionToken({ runId: data.runId });

      subscription?.close?.("restart");

      try {
        // Callback as the second argument: the token overload that accepts `onError` gives
        // the callback an `any` parameter, so it is left out and connection failures are
        // caught here instead.
        subscription = await subscribe(
          {
            channel,
            topics: ["progress", "result"],
            key: token.key,
            apiBaseUrl: token.apiBaseUrl,
          },
          (message) => {
            if (message.topic === "progress") {
              progress.value = [...progress.value, message.data as AgentProgress];
            }

            if (message.topic === "result") {
              result.value = message.data as AgentResult;
            }
          },
        );
      } catch (cause) {
        streamError.value = cause instanceof Error ? cause.message : String(cause);
      }
    },
  }),
);

onBeforeUnmount(() => subscription?.close?.("unmount"));

const devServerUrl = "http://localhost:8288";

const textareaClass =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-3";
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6 p-8">
    <header class="space-y-1">
      <NuxtLink to="/" class="text-muted-foreground text-sm hover:underline">← Examples</NuxtLink>
      <h1 class="text-2xl font-semibold tracking-tight">Coding agent</h1>
      <p class="text-muted-foreground text-sm">
        An <code>@inngest/agent-kit</code> agent on <code>deepseek-flash</code>, running inside the
        durable <code>coding-agent</code> function. The mutation sends the event and returns a run
        ID; the page then streams the run's realtime channel. Tools write into a scratch workspace
        that is discarded when the run ends.
      </p>
    </header>

    <form class="space-y-3 rounded-lg border p-4" @submit.prevent="startRun({ prompt })">
      <label class="block space-y-1">
        <span class="text-sm font-medium">Task</span>
        <textarea v-model="prompt" :class="textareaClass" rows="3" />
      </label>

      <div class="flex items-center gap-3">
        <Button type="submit" :disabled="isLoading || !prompt.trim()">
          {{ isLoading ? "Starting…" : "Run agent" }}
        </Button>
        <p v-if="error" class="text-destructive text-sm">{{ error.message }}</p>
      </div>
    </form>

    <div v-if="runId" class="space-y-1 rounded-lg border p-4">
      <p class="text-sm font-medium">Run {{ runId }}</p>
      <p class="text-muted-foreground text-xs">
        Follow the steps in the Inngest dev server:
        <a :href="devServerUrl" target="_blank" class="underline">{{ devServerUrl }}</a>
        — it must be running (<code>pnpm dev:inngest</code>).
      </p>
    </div>

    <div v-if="progress.length" class="rounded-lg border p-4">
      <p class="text-sm font-medium">Progress</p>
      <ul class="mt-2 space-y-1">
        <li v-for="(entry, index) in progress" :key="index" class="text-muted-foreground text-xs">
          <span class="font-mono">{{ new Date(entry.ts).toLocaleTimeString() }}</span>
          {{ entry.message }}
        </li>
      </ul>
    </div>

    <p v-if="streamError" class="text-destructive text-sm">
      Live updates failed: {{ streamError }}
    </p>

    <div v-if="result" class="space-y-4 rounded-lg border p-4">
      <p class="text-sm font-medium">
        {{ result.status === "completed" ? "Answer" : "Run failed" }}
      </p>

      <p v-if="result.error" class="text-destructive text-sm">{{ result.error }}</p>
      <p v-if="result.text" class="text-sm whitespace-pre-wrap">{{ result.text }}</p>

      <div v-for="file in result.files" :key="file.path" class="space-y-1">
        <p class="font-mono text-xs font-medium">{{ file.path }}</p>
        <pre
          class="bg-muted overflow-x-auto rounded-md p-3 text-xs"
        ><code>{{ file.content }}</code></pre>
      </div>
    </div>
  </div>
</template>
