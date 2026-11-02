<script setup lang="ts">
interface Props {
  text: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

withDefaults(defineProps<Props>(), {
  side: "top",
  align: "center",
});
</script>

<template>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger as-child>
        <slot />
      </TooltipTrigger>
      <TooltipContent :side="side" :align="align">
        <p>{{ text }}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
