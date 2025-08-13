<script setup lang="ts">
// import { WebDesigner } from "@fastbuildai/designer";
const WebDesigner = defineAsyncComponent(() => import("@fastbuildai/designer/web-designer"));

definePageMeta({ layout: "design" });
</script>

<template>
    <WebDesigner :design-id="''" terminal="web" />
</template>
