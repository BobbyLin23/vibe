<script setup lang="ts">
const props = defineProps<{ filePath: string }>();

const maxSegments = 4;

const pathSegments = computed(() => props.filePath.split("/"));
const isTruncated = computed(() => pathSegments.value.length > maxSegments);
const firstSegment = computed(() => pathSegments.value[0]);
const lastSegment = computed(() => pathSegments.value[pathSegments.value.length - 1]);
</script>

<template>
  <Breadcrumb>
    <BreadcrumbList>
      <template v-if="!isTruncated">
        <template v-for="(segment, index) in pathSegments" :key="index">
          <BreadcrumbItem>
            <BreadcrumbPage v-if="index === pathSegments.length - 1" class="font-medium">
              {{ segment }}
            </BreadcrumbPage>
            <span v-else class="text-muted-foreground">{{ segment }}</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator v-if="index < pathSegments.length - 1" />
        </template>
      </template>

      <template v-else>
        <BreadcrumbItem>
          <span class="text-muted-foreground">{{ firstSegment }}</span>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage class="font-medium">{{ lastSegment }}</BreadcrumbPage>
        </BreadcrumbItem>
      </template>
    </BreadcrumbList>
  </Breadcrumb>
</template>
