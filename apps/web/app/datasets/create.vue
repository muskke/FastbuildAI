<script setup lang="ts">
const CreateDataset = defineAsyncComponent(() => import("./_components/create/index.vue"));

definePageMeta({ activePath: "/datasets" });
</script>

<template>
    <CreateDataset />
</template>
