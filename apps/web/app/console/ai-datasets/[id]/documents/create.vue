<script setup lang="ts">
import type { Dataset } from "@/models/ai-datasets";

const CreateDataset = defineAsyncComponent(() => import("../../_components/create/index.vue"));

const datasetId = computed(() => (useRoute().params as Record<string, string>).id);
const datasetDetail = inject<Dataset>("datasets");

// 设置layout
definePageMeta({ layout: "full-screen" });
</script>

<template>
    <CreateDataset class="h-full w-full" :id="datasetId" :datasetsDetail="datasetDetail" />
</template>
