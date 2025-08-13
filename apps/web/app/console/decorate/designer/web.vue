<script setup lang="ts">
// import { WebDesigner } from "@fastbuildai/designer";
const WebDesigner = defineAsyncComponent(() => import("@fastbuildai/designer/web-designer"));

const { query: URLQueryParams } = useRoute();
const designId = ref(URLQueryParams.id as string);

definePageMeta({ layout: "design" });
</script>

<template>
    <WebDesigner :design-id="designId" terminal="web" />
</template>
