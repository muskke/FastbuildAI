<script setup lang="ts">
import { WebDesigner } from "@fastbuildai/designer";

const { query: URLQueryParams } = useRoute();
const designId = ref(URLQueryParams.id as string);

definePageMeta({ layout: "design" });
</script>

<template>
    <WebDesigner :design-id="designId" terminal="web" />
</template>
