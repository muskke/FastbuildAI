<script setup lang="ts">
import { WebDesigner } from "@fastbuildai/designer";

definePageMeta({ layout: "design" });
</script>

<template>
    <WebDesigner :design-id="''" terminal="web" />
</template>
