<script setup lang="ts">
import { ProInfiniteScroll, ProScrollArea, useMessage } from "@fastbuildai/ui";
import { useDebounceFn } from "@vueuse/core";
import { reactive, ref } from "vue";

import type { Agent } from "@/models/ai-agent";
import { apiGetPublicAgents, type QueryPublicAgentParams } from "@/services/web/ai-agent";

import AgentSquareCard from "./_components/agent-square-card.vue";

const toast = useMessage();

// 搜索和筛选参数
const searchForm = reactive<QueryPublicAgentParams>({
    keyword: "",
    sortBy: "latest" as "latest" | "popular",
    page: 1,
    pageSize: 20,
});

// SSR 首次加载数据
const { data: initialData, pending: ssrLoading } = await useAsyncData("public-agents-initial", () =>
    apiGetPublicAgents({
        sortBy: searchForm.sortBy,
        page: searchForm.page,
        pageSize: searchForm.pageSize,
    }),
);

// 状态管理
const loading = ref(false);
const hasMore = ref(true);
const agents = ref<Agent[]>(initialData.value?.items || []);

// 设置初始分页状态
if (initialData.value) {
    hasMore.value = initialData.value.totalPages > searchForm.page!;
}

// 获取智能体列表（客户端搜索/筛选时使用）
const getAgentList = async (reset = false) => {
    if (loading.value) return;

    loading.value = true;

    if (reset) {
        searchForm.page = 1;
        agents.value = [];
        hasMore.value = true;
    }

    try {
        const response = await apiGetPublicAgents({
            keyword: searchForm.keyword,
            sortBy: searchForm.sortBy,
            page: searchForm.page,
            pageSize: searchForm.pageSize,
        });

        if (reset) {
            // 重置时替换整个列表
            agents.value = response.items || [];
        } else {
            // 加载更多时追加到现有列表
            agents.value.push(...(response.items || []));
        }

        hasMore.value = response.totalPages > searchForm.page!;
    } catch (error) {
        console.error("获取智能体列表失败:", error);
        hasMore.value = false;
    } finally {
        loading.value = false;
    }
};

// 加载更多
const loadMore = async () => {
    if (!hasMore.value || loading.value) return;
    searchForm.page!++;
    await getAgentList();
};

const handleSearch = useDebounceFn(() => getAgentList(true), 500);
watch(() => searchForm.keyword, handleSearch);

// 排序切换
const handleSortChange = (sortBy: "latest" | "popular") => {
    searchForm.sortBy = sortBy;
    getAgentList(true);
};

// 智能体卡片点击
const handleAgentClick = (agent: Agent) => {
    if (agent.publishToken) {
        window.open(`/public/agent/${agent.publishToken}`, "_blank");
    }
};

// 页面元信息
definePageMeta({
    layout: "default",
    title: "menu.square",
    auth: false,
    inSystem: true,
    inLinkSelector: true,
});
</script>

<template>
    <div
        class="dark:to-primary-950 flex h-full flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-neutral-900 dark:via-neutral-800"
    >
        <!-- Header -->
        <div class="container mx-auto w-full px-4 pt-16 pb-8">
            <div class="text-center">
                <h1 class="text-foreground mb-4 text-4xl font-bold">
                    {{ $t("square.title") }}
                </h1>
                <p class="text-md text-accent-foreground mb-8">
                    {{ $t("square.subtitle") }}
                </p>

                <!-- 搜索框 -->
                <div class="relative mx-auto w-full max-w-3xl">
                    <UInput
                        v-model="searchForm.keyword"
                        :placeholder="$t('square.searchPlaceholder')"
                        size="xl"
                        class="w-full"
                        @input="handleSearch"
                    >
                        <template #leading>
                            <UIcon name="i-lucide-search" />
                        </template>
                    </UInput>
                </div>
            </div>
        </div>

        <div class="container mx-auto h-full px-4 py-8">
            <section class="flex h-full flex-col">
                <div class="mb-6 flex items-center justify-between">
                    <h2 class="text-xl font-bold">
                        {{ $t("square.allAgents") }}
                    </h2>

                    <!-- 排序选择 -->
                    <div class="dark:bg-background/30 flex gap-2 rounded-lg bg-neutral-100 p-1">
                        <UButton
                            :color="searchForm.sortBy === 'latest' ? 'primary' : 'neutral'"
                            :variant="searchForm.sortBy === 'latest' ? 'solid' : 'ghost'"
                            size="sm"
                            @click="handleSortChange('latest')"
                        >
                            {{ $t("square.sortByLatest") }}
                        </UButton>
                        <UButton
                            :color="searchForm.sortBy === 'popular' ? 'primary' : 'neutral'"
                            :variant="searchForm.sortBy === 'popular' ? 'solid' : 'ghost'"
                            size="sm"
                            @click="handleSortChange('popular')"
                        >
                            {{ $t("square.sortByPopular") }}
                        </UButton>
                    </div>
                </div>

                <ProScrollArea class="h-full">
                    <ProInfiniteScroll
                        :loading="loading || ssrLoading"
                        :has-more="hasMore"
                        :no-more-text="searchForm.page === 1 ? ' ' : ''"
                        @load-more="loadMore"
                    >
                        <div
                            v-if="agents.length > 0"
                            class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        >
                            <AgentSquareCard
                                v-for="agent in agents"
                                :key="agent.id"
                                :agent="agent"
                                @click="handleAgentClick"
                            />
                        </div>
                        <div v-else>
                            <div class="flex h-full w-full items-center justify-center py-16">
                                <div class="flex items-center gap-3">
                                    <span class="text-muted-foreground">{{
                                        $t("square.noResults")
                                    }}</span>
                                </div>
                            </div>
                        </div>
                    </ProInfiniteScroll>
                </ProScrollArea>
            </section>
        </div>
    </div>
</template>
