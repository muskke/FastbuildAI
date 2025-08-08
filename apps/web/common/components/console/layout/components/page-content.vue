<script setup lang="ts">
defineProps<{ layout: "mixture" | "sidebar" }>();
</script>

<template>
    <!-- 主要内容区域 -->
    <main
        class="w-full overflow-auto px-4 lg:px-6"
        :class="layout === 'sidebar' ? 'pt-0' : 'my-4 lg:my-6'"
    >
        <NuxtPage />
    </main>
</template>
