<script setup lang="ts">
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { toTypedSchema } from '@vee-validate/zod'
import { ArrowUpIcon, Loader2Icon } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { toast } from 'vue-sonner'
import { z } from 'zod'

const props = defineProps<{
  projectId: string
}>()

const formSchema = toTypedSchema(
  z.object({
    value: z.string().min(1, 'Value is required').max(10000, 'Value is too long'),
  }),
)

const form = useForm({
  validationSchema: formSchema,
})

const { $orpc } = useNuxtApp()

const queryClient = useQueryClient()

const createMessage = useMutation($orpc.messages.create.mutationOptions({
  onSuccess: () => {
    form.resetForm()
    queryClient.invalidateQueries($orpc.messages.getMany.queryOptions({
      input: {
        projectId: props.projectId,
      },
    }))
  },
  onError: (error) => {
    toast.error(error.message)
  },
}))

const onSubmit = form.handleSubmit(async (values) => {
  await createMessage.mutateAsync({
    projectId: props.projectId,
    value: values.value,
  })
})

const isPending = computed(() => createMessage.isPending)
const isDisabled = computed(() => !form.isFieldValid || isPending.value)
const isFocus = ref(false)
const showUsage = ref(false)
</script>

<template>
  <form :class="cn('relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all', isFocus && 'shadow-xs', showUsage && 'rounded-t-none')" project-id="message" @submit="onSubmit">
    <FormField v-slot="{ componentField }" name="value">
      <FormItem>
        <FormControl>
          <Textarea
            v-bind="componentField"
            :disabled="isPending"
            class="pt-4 resize-none border-none w-full outline-none bg-transparent"
            placeholder="What would you like to build"
            @focus="isFocus = true"
            @blur="isFocus = false"
            @keydown.enter="onSubmit"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
    <div class="flex gap-x-2 items-end justify-between pt-2">
      <div class="text-[10px] text-muted-foreground font-mono">
        <kbd class="ml-auto pointer-events-none inline-flex items-center h-5 select-none gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span>
            &#8984;
          </span>
        </kbd>
        &nbsp;to submit
      </div>
      <Button :class="cn('size-8 rounded-full', isDisabled && 'bg-muted-foreground border')" :disabled="isDisabled">
        <Loader2Icon v-if="isPending" class="size-4 animate-spin" />
        <ArrowUpIcon v-else />
      </Button>
    </div>
  </form>
</template>
