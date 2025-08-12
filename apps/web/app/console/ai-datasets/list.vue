<script lang="ts" setup>
import { ProInfiniteScroll, ProScrollArea, useMessage, useModal } from "@fastbuildai/ui";
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";

import type { Dataset, QueryDatasetParams } from "@/services/console/ai-datasets";
import {
    apiDeleteDataset,
    apiGetDatasetList,
    apiRetryDataset,
} from "@/services/console/ai-datasets";

import DatasetCard from "./_components/dataset-card.vue";

// 路由实例
const router = useRouter();
const toast = useMessage();
const { t } = useI18n();

// 列表查询参数
const searchForm = reactive<QueryDatasetParams>({
    keyword: "",
    showAll: false,
    page: 1,
    pageSize: 15,
});

// 无限滚动状态管理
const loading = ref(false);
const hasMore = ref(true);
const datasets = ref<Dataset[]>([]);

/**
 * 获取数据列表（第一页或重新加载）
 */
const getLists = async () => {
    if (loading.value) return;

    loading.value = true;
    searchForm.page = 1;

    try {
        const res = await apiGetDatasetList(searchForm);

        datasets.value = res.items || [];
        hasMore.value = res.totalPages > searchForm.page;
        searchForm.page = searchForm.page! + 1;
    } catch (error) {
        console.error("获取数据失败:", error);
        hasMore.value = false;
    } finally {
        loading.value = false;
    }
};

/**
 * 加载更多数据
 */
const loadMore = async () => {
    if (loading.value || !hasMore.value) return;

    loading.value = true;

    try {
        const res = await apiGetDatasetList(searchForm);

        if (res.items && res.items.length > 0) {
            datasets.value.push(...res.items);
            searchForm.page = searchForm.page! + 1;
            hasMore.value = res.totalPages > searchForm.page;
        } else {
            hasMore.value = false;
        }
    } catch (error) {
        console.error("加载更多数据失败:", error);
    } finally {
        loading.value = false;
    }
};

/** 删除数据 */
const handleDelete = async (dataset: Dataset) => {
    try {
        await useModal({
            title: t("datasets.list.delete.title"),
            description: t("datasets.list.delete.desc"),
            color: "error",
        });

        await apiDeleteDataset(dataset.id);

        const originalPage = searchForm.page;
        searchForm.page = 1;
        searchForm.pageSize = datasets.value.length;
        await getLists();

        searchForm.page = originalPage;
        searchForm.pageSize = 15;
        toast.success(t("datasets.list.delete.success"));
    } catch (error) {
        console.error("删除失败:", error);
    }
};

/** 处理知识库设置 */
const handleDatasetSettings = (dataset: Dataset) => {
    router.push(useRoutePath("ai-datasets:update", { id: dataset.id }));
};

/** 创建新知识库 */
const handleCreateDataset = () => {
    router.push(useRoutePath("ai-datasets:create"));
};

// 新增重试方法
const handleRetryDataset = async (dataset: Dataset) => {
    try {
        await useModal({
            title: t("datasets.dataset.retry.title"),
            description: t("datasets.dataset.retry.desc"),
            color: "warning",
        });
        const { success } = await apiRetryDataset(dataset.id);
        if (success) {
            toast.success(t("datasets.dataset.retry.success"));
        } else {
            toast.error(t("datasets.dataset.retry.failed"));
        }
    } catch (error) {
        toast.error(t("datasets.dataset.retry.failed"));
    }
};

// 初始化
onMounted(() => getLists());
</script>

<template>
    <div class="datasets-list-container flex flex-col items-center justify-center">
        <div class="datasets-list-container container">
            <!-- 搜索区域 -->
            <div class="bg-background sticky top-0 z-10 flex flex-wrap gap-4 pb-2">
                <UButton :label="$t('datasets.dataset.title')" color="primary" />

                <div class="flex items-center gap-2 md:ml-auto">
                    <UCheckbox
                        v-model="searchForm.showAll"
                        :label="$t('datasets.dataset.allDatasets')"
                    />

                    <UInput
                        v-model="searchForm.keyword"
                        :placeholder="$t('datasets.dataset.searchPlaceholder')"
                        class="w-80"
                        @change="getLists"
                    />
                </div>
            </div>

            <!-- 使用无限滚动 -->
            <ProScrollArea class="h-[calc(100vh-9rem)] min-h-0 w-full">
                <ProInfiniteScroll
                    :loading="loading"
                    :has-more="hasMore"
                    :threshold="200"
                    :loading-text="$t('common.loading')"
                    :no-more-text="$t('common.noMoreData')"
                    @load-more="loadMore"
                >
                    <div
                        class="grid grid-cols-1 gap-6 py-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    >
                        <!-- 创建知识库卡片 -->
                        <AccessControl :codes="['ai-datasets:create']">
                            <div
                                class="group border-default relative cursor-pointer rounded-lg border border-dashed p-4 transition-all duration-200 hover:shadow-lg"
                                @click="handleCreateDataset"
                            >
                                <!-- 左上角图标和标题 -->
                                <div
                                    class="group-hover:text-primary text-foreground mb-3 flex items-center gap-3"
                                >
                                    <div
                                        class="border-default flex size-10 flex-shrink-0 items-center justify-center rounded-lg border border-dashed"
                                    >
                                        <UIcon name="i-lucide-plus" class="h-6 w-6" />
                                    </div>

                                    <h3 class="truncate text-sm font-medium">
                                        {{ $t("datasets.dataset.create.title") }}
                                    </h3>
                                </div>

                                <!-- 描述文字 -->
                                <div class="text-muted-foreground mb-6 pr-8 text-xs">
                                    <p class="line-clamp-2 overflow-hidden">
                                        {{ $t("datasets.dataset.create.desc") }}
                                    </p>
                                </div>
                            </div>
                        </AccessControl>

                        <!-- 数据集卡片 -->
                        <DatasetCard
                            v-for="dataset in datasets"
                            :key="dataset.id"
                            :dataset="dataset"
                            @delete="handleDelete"
                            @settings="handleDatasetSettings"
                            @retry="handleRetryDataset"
                        />
                    </div>
                </ProInfiniteScroll>
            </ProScrollArea>
        </div>
    </div>
</template>
