<script setup lang="ts">
import { RiArrowUpLine, RiLoader4Line } from "@remixicon/vue";
import { toast } from "vue-sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";

const props = defineProps<{ projectId: string }>();

const { $orpc } = useNuxtApp();
const queryCache = useQueryCache();

const formSchema = z.object({
  value: z
    .string()
    .trim()
    .min(1, { message: "Value is required" })
    .max(10000, { message: "Value is too long" }),
});

const value = ref("");
const isFocused = ref(false);

// Grows with the content, like `react-textarea-autosize` in the original app.
const { textarea } = useTextareaAutosize({ input: value, maxHeight: 208 });

const { mutateAsync: createMessage, isLoading } = useMutation(
  $orpc.messages.create.mutationOptions({
    onSuccess: () => {
      value.value = "";
      void queryCache.invalidateQueries({ key: $orpc.messages.getMany.key() });
    },
    onError: (error) => toast.error(error.message),
  }),
);

const isValid = computed(() => formSchema.safeParse({ value: value.value }).success);
const isButtonDisabled = computed(() => isLoading.value || !isValid.value);

async function onSubmit() {
  const parsed = formSchema.safeParse({ value: value.value });

  if (!parsed.success) return;

  try {
    await createMessage({ value: parsed.data.value, projectId: props.projectId });
  } catch {
    // `onError` already surfaced the failure.
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    void onSubmit();
  }
}
</script>

<template>
  <form
    :class="
      cn(
        'bg-sidebar dark:bg-sidebar relative rounded-xl border p-4 pt-1 transition-all',
        isFocused && 'shadow-xs',
      )
    "
    @submit.prevent="onSubmit"
  >
    <textarea
      ref="textarea"
      v-model="value"
      :disabled="isLoading"
      rows="2"
      class="w-full resize-none border-none bg-transparent pt-4 outline-none"
      placeholder="What would you like to build?"
      @focus="isFocused = true"
      @blur="isFocused = false"
      @keydown="onKeydown"
    />

    <div class="flex items-end justify-between gap-x-2 pt-2">
      <div class="text-muted-foreground font-mono text-[10px]">
        <kbd
          class="bg-muted text-muted-foreground pointer-events-none ml-auto inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium select-none"
        >
          <span>&#8984;</span>Enter
        </kbd>
        &nbsp;to submit
      </div>
      <Button
        type="submit"
        :disabled="isButtonDisabled"
        :class="cn('size-8 rounded-full', isButtonDisabled && 'bg-muted-foreground border')"
      >
        <RiLoader4Line v-if="isLoading" class="size-4 animate-spin" />
        <RiArrowUpLine v-else />
      </Button>
    </div>
  </form>
</template>
