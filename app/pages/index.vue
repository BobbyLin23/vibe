<script lang="ts" setup>
import { useMutation } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'

const value = ref<string>('')

const router = useRouter()

const { $orpc } = useNuxtApp()

const { mutate } = useMutation($orpc.projects.create.mutationOptions({
  onSuccess: (data) => {
    router.push(`/projects/${data?.id}`)
  },
  onError: (error) => {
    toast.error(`Failed to create project: ${error.message}`)
  },
}))
</script>

<template>
  <div class="h-screen w-screen flex items-center justify-center">
    <div class="max-w-7xl mx-auto flex items-center flex-col gap-y-4 justify-center">
      <Input v-model="value" />
      <Button @click="mutate({ value })">
        Submit
      </Button>
    </div>
  </div>
</template>
