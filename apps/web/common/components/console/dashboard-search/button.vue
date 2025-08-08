<script setup lang="ts">
const controlsStore = useControlsStore();

// 打开搜索对话框
const openSearchDialog = () => {
    controlsStore.toggleGlobalSearch();
};

// 使用 Nuxt UI defineShortcuts 统一管理键盘快捷键（⌘K / Ctrl+K）
defineShortcuts({
    meta_k: openSearchDialog,
});
</script>

<template>
    <UTooltip :text="$t('console-common.search')" :kbds="['meta', 'K']" :delay-duration="0">
        <UButton
            icon="i-heroicons-magnifying-glass-20-solid"
            color="neutral"
            :padded="false"
            variant="outline"
            size="sm"
            :ui="{ base: 'w-full justify-between bg-transparent overflow-hidden flex-none' }"
            @click="openSearchDialog"
        >
            <div class="w-full text-left text-sm">
                <span class="w-0 whitespace-nowrap">{{ $t("console-common.search") }}...</span>
            </div>
            <UKbd>⌘</UKbd>
            <UKbd>K</UKbd>
        </UButton>
    </UTooltip>
</template>
