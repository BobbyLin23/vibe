<script setup lang="ts">
import { isDefinedError } from "@orpc/client";

const { $orpc } = useNuxtApp();
const queryCache = useQueryCache();

const {
  data: users,
  error: listError,
  isLoading: isLoadingUsers,
} = useQuery($orpc.user.list.queryOptions());

const form = reactive({ name: "", age: 25, email: "" });

const {
  mutate: createUser,
  error: createError,
  isLoading: isCreating,
} = useMutation(
  $orpc.user.create.mutationOptions({
    onSuccess: async () => {
      await queryCache.invalidateQueries({ key: $orpc.user.key() });
      form.name = "";
      form.email = "";
    },
  }),
);

const { mutate: removeUser } = useMutation(
  $orpc.user.remove.mutationOptions({
    onSuccess: () => queryCache.invalidateQueries({ key: $orpc.user.key() }),
  }),
);

const createErrorMessage = computed(() => {
  const error = createError.value;

  if (!error) {
    return null;
  }

  // `isDefinedError` narrows to the errors declared with `.errors({ ... })`.
  return isDefinedError(error) ? `${error.code}: ${error.message}` : error.message;
});

const inputClass =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-3";
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6 p-8">
    <header class="space-y-1">
      <NuxtLink to="/" class="text-muted-foreground text-sm hover:underline">← Examples</NuxtLink>
      <h1 class="text-2xl font-semibold tracking-tight">Users</h1>
      <p class="text-muted-foreground text-sm">
        Queries and mutations against the <code>users</code> table, with the list invalidated after
        every write. A duplicate email surfaces as the typed <code>CONFLICT</code> error.
      </p>
    </header>

    <form class="space-y-3 rounded-lg border p-4" @submit.prevent="createUser({ ...form })">
      <div class="grid gap-3 sm:grid-cols-3">
        <input v-model="form.name" :class="inputClass" placeholder="Name" />
        <input v-model.number="form.age" :class="inputClass" type="number" min="0" max="150" />
        <input
          v-model="form.email"
          :class="inputClass"
          type="email"
          placeholder="name@example.com"
        />
      </div>

      <div class="flex items-center gap-3">
        <Button type="submit" :disabled="isCreating">
          {{ isCreating ? "Creating…" : "Create user" }}
        </Button>
        <p v-if="createErrorMessage" class="text-destructive text-sm">{{ createErrorMessage }}</p>
      </div>
    </form>

    <p v-if="isLoadingUsers" class="text-muted-foreground text-sm">Loading…</p>
    <p v-else-if="listError" class="text-destructive text-sm">{{ listError.message }}</p>
    <p v-else-if="!users?.length" class="text-muted-foreground text-sm">No users yet.</p>
    <ul v-else class="divide-y rounded-lg border">
      <li v-for="user in users" :key="user.id" class="flex items-center justify-between gap-4 p-3">
        <div class="min-w-0">
          <p class="truncate text-sm font-medium">{{ user.name }}</p>
          <p class="text-muted-foreground truncate text-xs">{{ user.email }} · {{ user.age }}</p>
        </div>
        <Button variant="destructive" size="sm" @click="removeUser({ id: user.id })">
          Delete
        </Button>
      </li>
    </ul>
  </div>
</template>
