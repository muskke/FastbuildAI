<script setup lang="ts">
/**
 * 页面刷新容器组件
 * 为子元素添加页面刷新功能
 */

/** 刷新页面 */
function reloadPage() {
    reloadNuxtApp();
}
</script>

<template>
    <div @click="reloadPage">
        <UTooltip text="重新加载" :delay-duration="0">
            <UButton
                data-sidebar="trigger"
                variant="ghost"
                color="neutral"
                size="xs"
                :ui="{ base: 'py-2' }"
            >
                <span class="sr-only">Page Refresh</span>
                <UIcon name="i-lucide-rotate-ccw" class="size-4" />
            </UButton>
        </UTooltip>
    </div>
</template>
