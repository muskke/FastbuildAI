<script setup lang="ts">
import ProScrollArea from "@fastbuildai/ui/components/pro-scroll-area.vue";
import { useColorMode } from "@vueuse/core";
import { computed, ref, toRef } from "vue";
import { useRouter } from "vue-router";

import { buildSearchItems, type SearchMenuItem } from "@/common/utils/menu-helper";

// 主题类型
interface ThemeOption {
    id: "light" | "dark" | "auto";
    label: string;
    icon: string;
}

const { t } = useI18n();
const router = useRouter();
const { store } = useColorMode();
const controlsStore = useControlsStore();

// 搜索框是否打开 - 使用全局状态
defineShortcuts({
    o: () => controlsStore.toggleGlobalSearch(),
});

// 搜索查询
const searchQuery = ref("");

// 主题选项
const themeOptions = computed<ThemeOption[]>(() => [
    {
        id: "auto",
        label: t("console-common.theme.system"),
        icon: "i-heroicons-computer-desktop-20-solid",
    },
    {
        id: "light",
        label: t("console-common.theme.light"),
        icon: "i-heroicons-sun-20-solid",
    },
    {
        id: "dark",
        label: t("console-common.theme.dark"),
        icon: "i-heroicons-moon-20-solid",
    },
]);

/**
 * 将菜单数据转换为可搜索的工具列表
 */
const menuTools = computed<SearchMenuItem[]>(() => {
    return buildSearchItems();
});

/**
 * 所有可搜索的工具列表
 */
const allTools = computed(() => {
    return menuTools.value;
});

/**
 * 过滤后的工具列表，根据搜索词匹配name或path
 */
const filteredTools = computed(() => {
    if (!searchQuery.value) return allTools.value;

    const query = searchQuery.value.toLowerCase().trim();

    return allTools.value.filter(
        (tool) =>
            t(tool.name).toLowerCase().includes(query) ||
            (tool.parentName && tool.parentName.toLowerCase().includes(query)) ||
            (tool.path && tool.path.toLowerCase().includes(query)),
    );
});

/**
 * 分组后的搜索结果
 */
const groupedResults = computed(() => {
    const menus = filteredTools.value.filter((tool) => tool.type === "menu");

    return {
        menus,
    };
});

/**
 * 是否有搜索结果
 */
const hasSearchResults = computed(() => {
    return searchQuery.value.trim() === "" || filteredTools.value.length > 0;
});

/**
 * 处理搜索操作
 */
const handleSearch = () => {
    // 如果只有一个结果，直接导航到该工具
    if (filteredTools.value.length === 1 && filteredTools.value[0]?.path) {
        // 使用非空断言确保类型安全
        handleItemClick(filteredTools.value[0]!);
    }
};

/**
 * 处理工具项点击
 * @param tool 点击的工具项
 */
const handleItemClick = (tool: SearchMenuItem) => {
    if (tool.path) {
        router.push(tool.path);
    }
    searchQuery.value = "";
    controlsStore.toggleGlobalSearch();
};

/**
 * 处理主题切换
 * @param mode 主题模式
 */
const handleThemeChange = (mode: "light" | "dark" | "auto") => {
    store.value = mode;
    // 保存到localStorage
    localStorage.setItem("nuxt-ui-color-mode", mode);
    controlsStore.toggleGlobalSearch();
};

// 移除基于 window 事件的监听逻辑
</script>

<template>
    <UModal
        v-model:open="controlsStore.globalSearchVisible"
        :title="t('console-common.search')"
        :description="t('console-common.searchPlaceholder')"
        :ui="{ content: 'z-999' }"
    >
        <template #header>
            <span class="sr-only">{{ t("console-common.search") }}</span>
        </template>
        <template #content>
            <div class="py-2">
                <!-- 搜索输入框 -->
                <div
                    class="border-default relative flex items-center gap-2 border-b border-solid px-2 pb-2"
                >
                    <UInput
                        v-model="searchQuery"
                        :placeholder="t('console-common.searchPlaceholder')"
                        icon="i-heroicons-magnifying-glass-20-solid"
                        class="w-full"
                        variant="none"
                        autofocus
                        @keydown.esc="controlsStore.toggleGlobalSearch()"
                        @keydown.enter="handleSearch"
                    >
                    </UInput>
                    <UButton
                        color="neutral"
                        variant="ghost"
                        size="sm"
                        icon="i-lucide-x"
                        aria-label="关闭搜索"
                        @click="controlsStore.toggleGlobalSearch()"
                    />
                </div>

                <ProScrollArea class="h-90" type="auto">
                    <!-- 工具列表 -->
                    <div
                        class="px-2 pt-4"
                        v-if="hasSearchResults && groupedResults.menus.length > 0"
                    >
                        <div class="text-foreground mb-2 pl-2 text-xs font-medium">
                            {{
                                searchQuery
                                    ? t("console-common.searchResult")
                                    : t("console-common.menu")
                            }}
                        </div>

                        <div
                            v-for="tool in groupedResults.menus"
                            :key="tool.id"
                            class="hover:bg-muted flex cursor-pointer items-center justify-between rounded-md p-3 transition-colors"
                            @click="handleItemClick(tool)"
                        >
                            <div class="flex items-center">
                                <div
                                    class="bg-primary text-background flex h-8 w-8 items-center justify-center rounded-md"
                                    :class="tool.iconClass"
                                >
                                    <UIcon :name="tool.icon" class="text-lg" />
                                </div>
                                <div class="ml-3 text-xs">
                                    <div>{{ t(tool.name) }}</div>
                                    <div
                                        v-if="tool.parentName"
                                        class="text-muted-foreground mt-0.5 text-xs"
                                    >
                                        {{ tool.parentName }}
                                    </div>
                                </div>
                            </div>
                            <div class="bg-secondary rounded-md px-2 py-1 text-xs">
                                {{ t("console-common.menu") }}
                            </div>
                        </div>
                    </div>

                    <!-- 没有搜索结果 -->
                    <div
                        class="flex h-46 items-center justify-center px-4"
                        v-if="searchQuery && !hasSearchResults"
                    >
                        <div class="text-muted-foreground text-center text-sm">
                            {{ t("console-common.searchNoResult", { query: searchQuery }) }}
                        </div>
                    </div>

                    <div class="border-default mt-4 border-t border-solid px-2 pt-4">
                        <div class="text-foreground mb-2 pl-2 text-xs font-medium">
                            {{ t("console-common.theme.theme") }}
                        </div>
                        <div class="flex flex-col gap-2 text-xs">
                            <div
                                v-for="option in themeOptions"
                                :key="option.id"
                                class="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 transition-all duration-150"
                                :class="[
                                    store === option.id
                                        ? 'bg-secondary text-primary'
                                        : 'text-foreground-lighter',
                                ]"
                                @click="handleThemeChange(option.id)"
                            >
                                <UIcon :name="option.icon" class="text-lg" />
                                <div>{{ option.label }}</div>
                            </div>
                        </div>
                    </div>
                </ProScrollArea>
            </div>
        </template>
    </UModal>
</template>
