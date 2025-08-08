<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { type LinkItem, LinkType, type RouteMeta } from "../types";

const { t } = useI18n();

// 组件属性
interface Props {
    /** 搜索查询 */
    searchQuery?: string;
    /** 当前选中的链接 */
    selected?: LinkItem | null;
}

const props = withDefaults(defineProps<Props>(), {
    searchQuery: "",
    selected: null,
});

// 组件事件
const emit = defineEmits<{
    (e: "select", link: LinkItem): void;
}>();

// 响应式状态
const pluginPages = ref<LinkItem[]>([]);

// 计算属性
const filteredPages = computed(() => {
    if (!props.searchQuery) return pluginPages.value;

    const query = props.searchQuery.toLowerCase();
    return pluginPages.value.filter(
        (page) =>
            page.name?.toLowerCase().includes(query) || page.path?.toLowerCase().includes(query),
    );
});

// 按插件分组的页面
const groupedPages = computed(() => {
    const groups: Record<string, LinkItem[]> = {};

    for (const page of filteredPages.value) {
        const pluginName = extractPluginName(page.path as string);
        if (!groups[pluginName]) {
            groups[pluginName] = [];
        }
        groups[pluginName].push(page);
    }

    return groups;
});

/**
 * 从路径中提取分组名称（第一个路径段）
 */
const extractPluginName = (path: string): string => {
    // 去掉开头的斜杠，然后取第一个路径段
    const segments = path.replace(/^\//, "").split("/");
    return segments[0] || t("console-common.linkPicker.emptyState.unknownGroup");
};

/**
 * 加载插件页面
 */
const getPluginPages = async () => {
    const routes = useRouter().getRoutes();

    const pages: LinkItem[] = [];

    for (const route of routes) {
        const meta = route.meta as RouteMeta;

        // 只显示允许在链接选择器中显示的页面
        if (!meta?.inLinkSelector) continue;

        // 只显示插件页面（非系统页面）
        if (meta?.inSystem) continue;

        pages.push({
            type: LinkType.PLUGIN,
            name: meta.title || route.name?.toString() || route.path,
            path: route.path,
            query: {},
        });
    }

    // 按名称排序
    pages.sort((a: LinkItem, b: LinkItem) => {
        const nameA = a.name || "";
        const nameB = b.name || "";
        return nameA.localeCompare(nameB);
    });

    pluginPages.value = pages;
};

/**
 * 选择页面
 */
const selectPage = (page: LinkItem) => {
    emit("select", page);
};

/**
 * 检查是否为选中状态
 */
const isSelected = (page: LinkItem) => {
    return props.selected?.path === page.path && props.selected?.type === LinkType.PLUGIN;
};

// 组件挂载时加载数据
onMounted(() => getPluginPages());
</script>

<template>
    <div class="plugin-page-provider flex h-full flex-col">
        <!-- 空状态 -->
        <div v-if="filteredPages.length === 0" class="flex flex-1 items-center justify-center">
            <div class="mx-auto max-w-md text-center">
                <div
                    class="from-muted/50 to-muted/20 mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br"
                >
                    <UIcon
                        name="i-heroicons-puzzle-piece"
                        class="text-muted-foreground h-12 w-12"
                    />
                </div>
                <h3 class="text-foreground mb-3 text-xl font-bold">
                    {{
                        searchQuery
                            ? t("console-common.linkPicker.emptyState.noMatchingPages")
                            : t("console-common.linkPicker.emptyState.noPluginPages")
                    }}
                </h3>
                <p class="text-muted-foreground text-base leading-relaxed">
                    {{
                        searchQuery
                            ? t("console-common.linkPicker.emptyState.tryOtherKeywords")
                            : t("console-common.linkPicker.emptyState.contactAdmin")
                    }}
                </p>
            </div>
        </div>

        <!-- 插件页面列表 -->
        <div v-else class="flex-1 overflow-y-auto p-6">
            <template v-for="(pages, pluginName) in groupedPages" :key="pluginName">
                <!-- 分组标题 -->
                <div class="mb-4 flex items-center gap-3">
                    <UIcon name="i-heroicons-puzzle-piece" class="text-primary h-5 w-5" />
                    <h4 class="text-foreground text-lg font-semibold">
                        {{ pluginName }}
                    </h4>
                    <span
                        class="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium"
                    >
                        {{ pages.length }} {{ t("console-common.linkPicker.pageCount") }}
                    </span>
                </div>

                <!-- 插件页面列表 -->
                <div class="mb-4 flex flex-wrap gap-2">
                    <div
                        v-for="page in pages"
                        :key="page.path"
                        :class="[
                            'group relative flex cursor-pointer items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200',
                            isSelected(page)
                                ? 'bg-primary/5 shadow-sm'
                                : 'bg-accent hover:bg-primary/5',
                        ]"
                        @click="selectPage(page)"
                    >
                        <!-- 页面图标 -->
                        <!-- <div class="flex-shrink-0">
                            <div
                                :class="[
                                    'flex h-12 w-12 items-center justify-center rounded-lg transition-colors',
                                    isSelected(page)
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-accent text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary',
                                ]"
                            >
                                <UIcon name="i-heroicons-document" class="h-6 w-6" />
                            </div>
                        </div> -->

                        <!-- 页面信息 -->
                        <div class="min-w-0 flex-1">
                            <div class="text-foreground mb-1 truncate text-base font-semibold">
                                {{ page.name }}
                            </div>
                            <!-- <p class="text-muted-foreground truncate text-sm">
                                {{ page.path }}
                            </p> -->
                        </div>

                        <!-- 选中标识 -->
                        <div v-if="isSelected(page)" class="absolute top-0 right-0 flex-shrink-0">
                            <div
                                class="bg-primary flex size-3 items-center justify-center rounded-full"
                            ></div>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>
