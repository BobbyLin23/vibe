<script setup lang="ts">
import { toast } from "vue-sonner";

const { $orpc } = useNuxtApp();

const queryCache = useQueryCache();

const value = ref("");

const {
  data: messages,
  error: loadError,
  isLoading,
  refetch,
} = useQuery($orpc.messages.getMany.queryOptions());

const {
  mutate: createMessage,
  error: createError,
  isLoading: isCreating,
} = useMutation(
  $orpc.messages.create.mutationOptions({
    onSuccess: async () => {
      value.value = "";
      toast.success("Message created");

      // The reply is written later by the durable function, so this only picks up the
      // stored prompt — `refetch` on the list is how the reply appears.
      await queryCache.invalidateQueries({ key: $orpc.messages.key() });
    },
  }),
);

/** `getMany` is newest first; a conversation reads oldest first. */
const conversation = computed(() => [...(messages.value ?? [])].reverse());

const inputClass =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-3";

function send() {
  const text = value.value.trim();

  if (text) {
    createMessage({ value: text });
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6 p-8">
    <header class="space-y-1">
      <NuxtLink to="/" class="text-muted-foreground text-sm hover:underline">← Examples</NuxtLink>
      <h1 class="text-2xl font-semibold tracking-tight">Messages</h1>
      <p class="text-muted-foreground text-sm">
        <code>messages.create</code> stores the prompt, then sends <code>code-agent/run</code>; the
        durable <code>code-agent-run</code> function runs the agent and records the reply as its own
        row. <code>messages.getMany</code> reads the conversation back from Postgres.
      </p>
    </header>

    <form class="space-y-3 rounded-lg border p-4" @submit.prevent="send">
      <label class="block space-y-1">
        <span class="text-sm font-medium">Message</span>
        <input
          v-model="value"
          :class="inputClass"
          placeholder="Write a TypeScript module that turns an ISO date into a weekday name"
        />
      </label>

      <div class="flex items-center gap-3">
        <Button type="submit" :disabled="isCreating || !value.trim()">
          {{ isCreating ? "Sending…" : "Send" }}
        </Button>
        <Button type="button" variant="outline" @click="refetch()">Refresh</Button>
        <p v-if="createError" class="text-destructive text-sm">{{ createError.message }}</p>
      </div>

      <p class="text-muted-foreground text-xs">
        The reply is written by the Inngest dev server (<code>pnpm dev:inngest</code>), so Refresh
        once the run finishes — or watch it at
        <a href="http://localhost:8288" target="_blank" class="underline">localhost:8288</a>.
      </p>
    </form>

    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <p class="text-sm font-medium">Conversation</p>
        <p v-if="messages?.length" class="text-muted-foreground text-xs">
          {{ messages.length }} {{ messages.length === 1 ? "message" : "messages" }}
        </p>
      </div>

      <p v-if="isLoading" class="text-muted-foreground text-sm">Loading…</p>
      <p v-else-if="loadError" class="text-destructive text-sm">{{ loadError.message }}</p>
      <p v-else-if="!conversation.length" class="text-muted-foreground text-sm">
        No messages yet — send one above.
      </p>

      <article
        v-for="message in conversation"
        :key="message.id"
        class="rounded-lg border p-4"
        :class="message.type === 'error' ? 'border-destructive/50' : ''"
      >
        <div class="flex items-center gap-2">
          <span
            class="rounded-md border px-1.5 py-0.5 text-xs font-medium capitalize"
            :class="
              message.role === 'assistant'
                ? 'bg-muted text-muted-foreground'
                : 'text-muted-foreground'
            "
          >
            {{ message.role }}
          </span>
          <span
            v-if="message.type === 'error'"
            class="text-destructive text-xs font-medium uppercase"
          >
            error
          </span>
          <span class="text-muted-foreground ml-auto text-xs">
            {{ message.createdAt.toLocaleTimeString() }}
          </span>
        </div>

        <p class="mt-2 text-sm whitespace-pre-wrap">{{ message.content }}</p>
      </article>
    </div>
  </div>
</template>
