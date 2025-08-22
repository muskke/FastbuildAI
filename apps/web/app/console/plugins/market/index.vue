<script lang="ts" setup>
import { ProPaginaction, useMessage } from "@fastbuildai/ui";
import { useDebounceFn } from "@vueuse/core";
import { onMounted, reactive, ref, watch } from "vue";

import type {
    PluginCategory,
    PluginMarketItem,
    PluginMarketQueryRequest,
    PluginType,
} from "@/models/plugin-market";
import { apiGetPluginMarketList } from "@/services/console/plugin-market";

import PluginChangelogDrawer from "../_components/changelog-drawer.vue";
import PluginDetailDrawer from "../_components/detail-drawer.vue";
import PluginCard from "../_components/plugin-card.vue";
import PluginCardSkeleton from "../_components/plugin-card-skeleton.vue";

// 消息提示
const toast = useMessage();
const { t } = useI18n();

// 搜索表单
const searchForm = reactive<PluginMarketQueryRequest>({
    name: "",
    cid: undefined,
    type: undefined,
    price_type: undefined,
});

// 分页数据
const pagination = reactive({
    page_no: 1,
    page_size: 15,
    total: 0,
});

// 列表数据和状态
const items = ref<PluginMarketItem[]>([]);
const loading = ref(false);

// 分类和类型数据
const categories = ref<PluginCategory[]>([]);
const types = ref<PluginType[]>([]);

// 当前选中的插件
const selectedPlugin = ref<PluginMarketItem | null>(null);

// 弹窗状态
const showPluginDetail = ref(false);
const showUpdateLog = ref(false);

/**
 * 获取插件市场数据
 */
async function getPluginList() {
    loading.value = true;
    try {
        const params = {
            ...searchForm,
            page_no: pagination.page_no,
            page_size: pagination.page_size,
        };

        // 确保骨架屏至少显示500ms，提供更好的用户体验
        const [response] = await Promise.all([
            apiGetPluginMarketList(params),
            new Promise((resolve) => setTimeout(resolve, 200)),
        ]);

        // 更新列表数据
        items.value = response.lists || [];
        pagination.total = response.count || 0;

        // 更新分类和类型数据
        if (response.extend) {
            categories.value = response.extend.categories || [];
            types.value = response.extend.types || [];
        }
    } catch (error) {
        console.error("获取插件市场数据失败:", error);
        items.value = [];
        pagination.total = 0;
    } finally {
        loading.value = false;
    }
}

/**
 * 防抖搜索函数
 */
const debouncedSearch = useDebounceFn(() => {
    pagination.page_no = 1; // 重置到第一页
    getPluginList();
}, 300);

/**
 * 监听搜索条件变化，自动重新获取数据
 */
watch(
    () => [searchForm.name, searchForm.cid, searchForm.type, searchForm.price_type],
    () => {
        debouncedSearch();
    },
    { deep: true },
);

/**
 * 处理分页变化
 */
function handlePageChange() {
    getPluginList();
}

/**
 * 处理插件详情
 */
function handlePluginDetail(plugin: PluginMarketItem) {
    selectedPlugin.value = plugin;
    showPluginDetail.value = true;
}

/**
 * 处理更新日志
 */
function handleUpdateLog(plugin: PluginMarketItem) {
    selectedPlugin.value = plugin;
    showUpdateLog.value = true;
}

/**
 * 处理安装插件
 */
function handleInstallPlugin(plugin: PluginMarketItem) {
    // TODO: 实现安装插件逻辑
    toast.success(t("console-plugins.market.messages.installStart", { name: plugin.name }));
    console.log("安装插件:", plugin);
}

/**
 * 重置搜索
 */
function resetSearch() {
    searchForm.name = "";
    searchForm.cid = undefined;
    searchForm.type = undefined;
    searchForm.price_type = undefined;
    pagination.page_no = 1;

    getPluginList();
}

// 初始化
onMounted(() => {
    getPluginList();
});
</script>

<template>
    <div class="plugin-market-container pb-5">
        <div class="header bg-background sticky top-0 z-10 pb-6">
            <!-- 页面标题 -->
            <div class="mb-6">
                <h1 class="text-secondary-foreground text-2xl font-bold">
                    {{ $t("console-plugins.market.title") }}
                </h1>
                <p class="text-accent-foreground mt-1 text-sm dark:text-gray-400">
                    {{ $t("console-plugins.market.description") }}
                </p>
            </div>

            <!-- 搜索和筛选区域 -->
            <div class="space-y-4">
                <!-- 搜索框 -->
                <div class="flex flex-wrap gap-4">
                    <UInput
                        v-model="searchForm.name"
                        :placeholder="$t('console-plugins.market.search')"
                        icon="i-lucide-search"
                        class="min-w-64 flex-1"
                    />

                    <USelect
                        v-model="searchForm.cid"
                        :items="[
                            { label: $t('console-plugins.market.allCategories'), value: undefined },
                            ...categories.map((cat) => ({ label: cat.name, value: cat.id })),
                        ]"
                        :placeholder="$t('console-plugins.market.category')"
                        class="w-40"
                    />

                    <USelect
                        v-model="searchForm.type"
                        :items="[
                            { label: $t('console-plugins.market.allTypes'), value: undefined },
                            ...types.map((type) => ({ label: type.label, value: type.value })),
                        ]"
                        :placeholder="$t('console-plugins.market.type')"
                        class="w-40"
                    />

                    <USelect
                        v-model="searchForm.price_type"
                        :items="[
                            { label: $t('console-plugins.market.allPrices'), value: undefined },
                            { label: $t('console-plugins.market.free'), value: 'free' },
                            { label: $t('console-plugins.market.paid'), value: 'paid' },
                        ]"
                        :placeholder="$t('console-plugins.market.price')"
                        class="w-32"
                    />

                    <UButton
                        color="neutral"
                        variant="outline"
                        icon="i-lucide-refresh-cw"
                        @click="resetSearch"
                    >
                        {{ $t("console-common.reset") }}
                    </UButton>
                </div>
            </div>
        </div>

        <!-- 加载状态 - 骨架屏 -->
        <Transition name="skeleton">
            <div
                v-if="loading"
                key="loading"
                class="grid grid-cols-1 gap-6 py-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
                <TransitionGroup name="skeleton" tag="div" class="contents">
                    <PluginCardSkeleton
                        v-for="i in pagination.page_size"
                        :key="`skeleton-${i}`"
                        :style="{ transitionDelay: `${i * 50}ms` }"
                    />
                </TransitionGroup>
            </div>
        </Transition>

        <!-- 插件卡片网格 -->
        <Transition name="fade">
            <div
                v-if="!loading && items.length > 0"
                key="content"
                class="grid grid-cols-1 gap-6 py-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
                <TransitionGroup name="card" tag="div" class="contents">
                    <PluginCard
                        v-for="(plugin, index) in items"
                        :key="plugin.id"
                        :plugin="plugin"
                        :style="{ transitionDelay: `${index * 100}ms` }"
                        @detail="handlePluginDetail"
                        @changelog="handleUpdateLog"
                        @install="handleInstallPlugin"
                    />
                </TransitionGroup>
            </div>
        </Transition>

        <!-- 空状态 -->
        <Transition name="fade">
            <div
                v-if="!loading && items.length === 0"
                key="empty"
                class="flex min-h-[50vh] items-center justify-center py-12"
            >
                <Transition name="bounce" appear>
                    <div class="text-center">
                        <UIcon
                            name="i-lucide-package-search"
                            class="mx-auto mb-4 h-16 w-16 text-gray-400"
                        />
                        <h3 class="text-secondary-foreground mb-2 text-lg font-medium">
                            {{ $t("console-plugins.market.set") }}
                        </h3>
                        <p class="text-accent-foreground dark:text-gray-400">
                            {{ $t("console-plugins.market.sed") }}
                        </p>
                    </div>
                </Transition>
            </div>
        </Transition>

        <!-- 分页 -->
        <Transition name="slide-up">
            <div
                v-if="items.length > 0"
                class="bg-background sticky bottom-0 z-10 flex justify-end py-4"
            >
                <ProPaginaction
                    v-model:page="pagination.page_no"
                    v-model:size="pagination.page_size"
                    :total="pagination.total"
                    @change="handlePageChange"
                />
            </div>
        </Transition>

        <!-- 插件详情抽屉 -->
        <PluginDetailDrawer
            v-model="showPluginDetail"
            :plugin="selectedPlugin"
            @install="handleInstallPlugin"
        />

        <!-- 更新日志抽屉 -->
        <PluginChangelogDrawer v-model="showUpdateLog" :plugin="selectedPlugin" />
    </div>
</template>

<style scoped>
/* 淡入淡出过渡 */
.fade-enter-active,
.fade-leave-active {
    transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(10px);
}

/* 卡片进入/离开动画 */
.card-enter-active {
    transition: all 0.6s ease;
}

.card-leave-active {
    transition: all 0.3s ease;
}

.card-enter-from {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
}

.card-leave-to {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
}

.card-move {
    transition: transform 0.5s ease;
}

/* 骨架屏动画 */
.skeleton-enter-active {
    transition: all 0.4s ease;
}

.skeleton-enter-from {
    opacity: 0;
}

/* 弹跳动画 */
.bounce-enter-active {
    animation: bounce-in 0.8s ease;
}

@keyframes bounce-in {
    0% {
        opacity: 0;
    }
    50% {
        opacity: 0.8;
    }
    70% {
        opacity: 0.9;
    }
    100% {
        opacity: 1;
    }
}

/* 滑入动画 */
.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
    opacity: 0;
    transform: translateY(20px);
}
</style>
