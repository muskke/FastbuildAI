<script setup lang="ts">
import { provide } from "vue";

import { useDesignStore } from "@/common/stores/design";

// import { WebDesigner } from "@fastbuildai/designer";
const WebDesigner = defineAsyncComponent(() => import("@fastbuildai/designer/web-designer"));

const { query: URLQueryParams } = useRoute();
const designId = ref(URLQueryParams.id as string);

// 提供 design store 给 designer 组件
const designStore = useDesignStore();
provide("designStore", designStore);

definePageMeta({ layout: "design" });
</script>

<template>
    <WebDesigner :design-id="designId" terminal="web" :design-store="designStore" />
</template>
