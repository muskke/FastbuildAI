<script lang="ts" setup>
import { ProPaginaction, useMessage } from "@fastbuildai/ui";
import type { TabsItem } from "@nuxt/ui";
import { useDebounceFn } from "@vueuse/core";

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

/**
 * 插件管理页面
 * 用于管理已安装的插件，支持启用、禁用、卸载等操作
 */

/** 卡片模式常量 */
const CARD_MODE = {
    /** 市场模式 - 显示价格和安装按钮 */
    MARKET: "market",
    /** 管理模式 - 显示状态和管理按钮 */
    MANAGE: "manage",
} as const;

type CardMode = (typeof CARD_MODE)[keyof typeof CARD_MODE];

/** 插件状态常量 */
const PLUGIN_STATUS = {
    /** 已启用 */
    ENABLED: "enabled",
    /** 已禁用 */
    DISABLED: "disabled",
    /** 未安装 */
    UNINSTALLED: "uninstalled",
} as const;

type PluginStatus = (typeof PLUGIN_STATUS)[keyof typeof PLUGIN_STATUS];

const { t } = useI18n();
const toast = useMessage();
const route = useRoute();
const router = useRouter();

/** 响应式数据 */
const loading = ref(false);
const items = ref<PluginMarketItem[]>([]);

// 分类和类型数据
const categories = ref<PluginCategory[]>([]);
const types = ref<PluginType[]>([]);

// 当前选中的插件
const selectedPlugin = ref<PluginMarketItem | null>(null);

// 弹窗状态
const showPluginDetail = ref(false);
const showUpdateLog = ref(false);

/** 插件类型选项卡 */
const pluginTypeItems: TabsItem[] = [
    {
        label: t("console-plugins.manage.tabs.all"),
        value: "all",
    },
    {
        label: t("console-plugins.manage.tabs.enabled"),
        value: "enabled",
    },
    {
        label: t("console-plugins.manage.tabs.disabled"),
        value: "disabled",
    },
    {
        label: t("console-plugins.manage.tabs.official"),
        value: "official",
    },
];

/** 当前选中的插件类型 */
const activePluginType = computed<string>({
    get() {
        return (route.query.type as string) || "all";
    },
    set(type) {
        router.replace({
            path: route.path,
            query: { ...route.query, type },
        });
    },
});

/** 搜索表单 */
const searchForm = reactive<PluginMarketQueryRequest>({
    name: "",
    cid: undefined,
    type: undefined,
    price_type: undefined,
});

/** 分页配置 */
const pagination = reactive({
    page_no: 1,
    page_size: 12,
    total: 0,
});

/** 状态选项 */
const statusOptions = [
    { label: t("console-plugins.manage.status.all"), value: undefined },
    { label: t("console-plugins.manage.status.enabled"), value: PLUGIN_STATUS.ENABLED },
    { label: t("console-plugins.manage.status.disabled"), value: PLUGIN_STATUS.DISABLED },
];

/**
 * 获取插件列表
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
        let pluginList = response.lists || [];

        // 根据选中的类型筛选
        switch (activePluginType.value) {
            case "enabled":
                // 根据实际的插件状态字段进行筛选（状态为1表示启用）
                pluginList = pluginList.filter((item: PluginMarketItem) => item.status === 1);
                break;
            case "disabled":
                // 根据实际的插件状态字段进行筛选（状态为0表示禁用）
                pluginList = pluginList.filter((item: PluginMarketItem) => item.status === 0);
                break;
            case "official":
                // 根据实际的官方插件字段进行筛选
                pluginList = pluginList.filter((item: PluginMarketItem) => item.is_featured === 1);
                break;
            default:
                // "all" - 显示所有插件
                break;
        }

        items.value = pluginList;
        pagination.total = response.count || 0;

        // 更新分类和类型数据
        if (response.extend) {
            categories.value = response.extend.categories || [];
            types.value = response.extend.types || [];
        }
    } catch (error) {
        console.error("获取插件列表失败:", error);
        toast.error(t("console-plugins.manage.messages.fetchError"));
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
    () => [
        searchForm.name,
        searchForm.cid,
        searchForm.type,
        searchForm.price_type,
        activePluginType.value,
    ],
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
 * 安装插件
 */
async function handleInstallPlugin(plugin: PluginMarketItem) {
    console.log("安装插件:", plugin);
}

/**
 * 启用插件
 */
async function handleEnablePlugin(plugin: PluginMarketItem) {
    try {
        // TODO: 调用实际的API
        console.log("启用插件:", plugin);
        // 更新本地状态
        plugin.status = 1;
        toast.success(t("console-plugins.manage.messages.enableSuccess", { name: plugin.name }));
    } catch (error) {
        console.error("启用插件失败:", error);
        toast.error(t("console-plugins.manage.messages.enableError"));
    }
}

/**
 * 禁用插件
 */
async function handleDisablePlugin(plugin: PluginMarketItem) {
    try {
        // TODO: 调用实际的API
        console.log("禁用插件:", plugin);
        // 更新本地状态
        plugin.status = 0;
        toast.success(t("console-plugins.manage.messages.disableSuccess", { name: plugin.name }));
    } catch (error) {
        console.error("禁用插件失败:", error);
        toast.error(t("console-plugins.manage.messages.disableError"));
    }
}

/**
 * 卸载插件
 */
async function handleUninstallPlugin(plugin: PluginMarketItem) {
    try {
        // TODO: 调用实际的API
        console.log("卸载插件:", plugin);
        // 从列表中移除
        const index = items.value.findIndex((item) => item.id === plugin.id);
        if (index > -1) {
            items.value.splice(index, 1);
            pagination.total--;
        }
        toast.success(t("console-plugins.manage.messages.uninstallSuccess", { name: plugin.name }));
    } catch (error) {
        console.error("卸载插件失败:", error);
        toast.error(t("console-plugins.manage.messages.uninstallError"));
    }
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
    <div class="plugin-manage-container pb-5">
        <div class="header bg-background sticky top-0 z-10 pb-6">
            <!-- 页面标题 -->
            <div class="mb-6">
                <h1 class="text-secondary-foreground text-2xl font-bold">
                    {{ $t("console-plugins.manage.title") }}
                </h1>
                <p class="text-accent-foreground mt-1 text-sm dark:text-gray-400">
                    {{ $t("console-plugins.manage.description") }}
                </p>
            </div>

            <!-- 搜索和筛选区域 -->
            <div class="space-y-4">
                <!-- 左侧tabs和右侧搜索 -->
                <div class="flex w-full flex-wrap justify-between gap-4">
                    <div class="flex items-end justify-end">
                        <UTabs
                            v-model="activePluginType"
                            :items="pluginTypeItems"
                            class="block w-auto"
                        />
                    </div>

                    <div class="flex items-end gap-4">
                        <UInput
                            v-model="searchForm.name"
                            :placeholder="$t('console-plugins.manage.search')"
                            icon="i-lucide-search"
                        />

                        <USelect
                            v-model="searchForm.cid"
                            :items="[
                                {
                                    label: $t('console-plugins.manage.filters.allCategories'),
                                    value: undefined,
                                },
                                ...categories.map((cat) => ({ label: cat.name, value: cat.id })),
                            ]"
                            :placeholder="$t('console-plugins.market.category')"
                            class="w-40"
                        />

                        <USelect
                            v-model="searchForm.type"
                            :items="[
                                {
                                    label: $t('console-plugins.manage.filters.allTypes'),
                                    value: undefined,
                                },
                                ...types.map((type) => ({ label: type.label, value: type.value })),
                            ]"
                            :placeholder="$t('console-plugins.market.type')"
                            class="w-40"
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
        </div>

        <!-- 加载状态 - 骨架屏 -->
        <Transition name="skeleton">
            <div
                v-if="loading"
                key="loading"
                class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
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
            <div v-if="!loading && items.length > 0" key="content" class="space-y-4">
                <!-- 插件卡片列表 -->
                <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <TransitionGroup name="card" tag="div" class="contents">
                        <PluginCard
                            v-for="(plugin, index) in items"
                            :key="plugin.id"
                            :plugin="plugin"
                            :mode="CARD_MODE.MANAGE"
                            :style="{ transitionDelay: `${index * 100}ms` }"
                            @detail="handlePluginDetail"
                            @changelog="handleUpdateLog"
                            @enable="handleEnablePlugin"
                            @disable="handleDisablePlugin"
                            @uninstall="handleUninstallPlugin"
                        />
                    </TransitionGroup>
                </div>
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
                            name="i-lucide-package-x"
                            class="mx-auto mb-4 h-16 w-16 text-gray-400"
                        />
                        <h3 class="text-secondary-foreground mb-2 text-lg font-medium">
                            {{ $t("console-plugins.manage.empty.title") }}
                        </h3>
                        <p class="text-accent-foreground dark:text-gray-400">
                            {{ $t("console-plugins.manage.empty.description") }}
                        </p>
                        <UButton
                            color="primary"
                            class="mt-4"
                            @click="router.push('/console/plugins/market')"
                        >
                            {{ $t("console-plugins.manage.empty.action") }}
                        </UButton>
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
