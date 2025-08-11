<script lang="ts" setup>
import { ProPaginaction, ProScrollArea, useMessage, useModal, usePaging } from "@fastbuildai/ui";
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";

import type { AiModelInfo, AiModelQueryRequest, ModelType } from "@/models/ai-provider";
import {
    apiBatchDeleteAiModel,
    apiDeleteAiModel,
    apiGetAiModelList,
    apiSetDefaultModel,
} from "@/services/console/ai-model";
import { apiGetAiProviderModelTypes } from "@/services/console/ai-provider";

const ModelCard = defineAsyncComponent(() => import("./_components/model-card.vue"));

// 路由实例
const router = useRouter();
const toast = useMessage();
const { t } = useI18n();
const { query: URLQueryParams } = useRoute();

// 列表查询参数
const searchForm = reactive<AiModelQueryRequest>({
    keyword: "",
    providerId: URLQueryParams.id as string,
    isActive: undefined,
    modelType: [],
});

// 选中的AI模型
const selectedModels = ref<Set<string>>(new Set());

const modelTypes = ref<ModelType[]>([]);

const { paging, getLists } = usePaging({
    fetchFun: apiGetAiModelList,
    params: searchForm,
});

/**
 * 获取模型类型
 */
const getModelTypes = async () => {
    const res = await apiGetAiProviderModelTypes();
    modelTypes.value = res;
};

onMounted(async () => {
    await getModelTypes();
});

/**
 * 处理AI模型选择
 */
const handleModelSelect = (model: AiModelInfo, selected: boolean | "indeterminate") => {
    if (typeof selected === "boolean") {
        const modelId = model.id as string;
        if (selected) {
            selectedModels.value.add(modelId);
        } else {
            selectedModels.value.delete(modelId);
        }
    }
};

/**
 * 全选/取消全选
 */
const handleSelectAll = (value: boolean | "indeterminate") => {
    const isSelected = value === true;
    if (isSelected) {
        paging.items.forEach((model: AiModelInfo) => {
            if (model.id) {
                selectedModels.value.add(model.id as string);
            }
        });
    } else {
        selectedModels.value.clear();
    }
};

/** 删除数据 */
const handleDelete = async (id: string | string[]) => {
    try {
        await useModal({
            title: t("console-ai-provider.model.messages.deleteTitle"),
            description: t("console-ai-provider.model.messages.deleteMsg"),
            color: "error",
        });

        if (Array.isArray(id)) {
            await apiBatchDeleteAiModel(id);
        } else {
            await apiDeleteAiModel(id);
        }

        // 清空选中状态
        selectedModels.value.clear();

        // 刷新列表
        getLists();
        toast.success(t("console-ai-provider.model.messages.success"));
    } catch (error) {
        console.error("Delete failed:", error);
    }
};

/**
 * 处理删除AI模型
 */
const handleDeleteModel = (model: AiModelInfo) => {
    if (model.id) {
        handleDelete(model.id);
    }
};

/**
 * 批量删除选中模型
 */
const handleBatchDelete = () => {
    const selectedIds = Array.from(selectedModels.value);
    if (selectedIds.length === 0) return;
    handleDelete(selectedIds);
};

/**
 * 设置默认模型
 */
const handleSetDefault = async (model: AiModelInfo) => {
    try {
        await apiSetDefaultModel(model.id as string);
        toast.success(t("console-ai-provider.model.messages.setDefaultSuccess"));
        getLists();
    } catch (error) {
        console.error("Set default failed:", error);
        toast.error(t("console-ai-provider.model.messages.setDefaultError"));
    }
};

/**
 * 计算选中状态
 */
const isAllSelected = computed(() => {
    return (
        paging.items.length > 0 &&
        paging.items.every(
            (model: AiModelInfo) => model.id && selectedModels.value.has(model.id as string),
        )
    );
});

const isIndeterminate = computed(() => {
    const selectedCount = paging.items.filter(
        (model: AiModelInfo) => model.id && selectedModels.value.has(model.id as string),
    ).length;
    return selectedCount > 0 && selectedCount < paging.items.length;
});

// 初始化
onMounted(async () => getLists());
</script>

<template>
    <div class="ai-model-list-container pb-5">
        <div
            class="bg-background sticky top-0 z-10 mb-4 flex w-full items-center justify-baseline pb-2"
        >
            <UButton color="neutral" variant="soft" @click="router.back()">
                <UIcon name="i-lucide-arrow-left" class="size-5 cursor-pointer" />
                <span class="text-base font-medium">{{ $t("console-common.back") }}</span>
            </UButton>

            <h1 class="ml-4 text-xl font-bold">
                {{ $t("console-ai-provider.model.title") }}
            </h1>
        </div>

        <!-- 搜索区域 -->
        <div class="bg-background sticky top-0 z-10 flex flex-wrap gap-4 pb-2">
            <UInput
                v-model="searchForm.keyword"
                :placeholder="t('console-ai-provider.model.keywordInput')"
                @change="getLists"
            />

            <USelect
                v-model="searchForm.isActive"
                :items="[
                    { label: t('console-common.all'), value: undefined },
                    { label: t('console-common.active'), value: true },
                    { label: t('console-common.inactive'), value: false },
                ]"
                label-key="label"
                value-key="value"
                :placeholder="t('console-ai-provider.model.statusFilter')"
                @change="getLists"
            />
            <USelect
                v-model="searchForm.modelType"
                :items="modelTypes"
                multiple
                label-key="label"
                value-key="value"
                class="max-w-60 min-w-36"
                :placeholder="t('console-ai-provider.model.modelTypeFilter')"
                @change="getLists"
            />

            <div class="flex items-center gap-2 md:ml-auto">
                <!-- 全选控制 -->
                <div class="flex items-center gap-2">
                    <UCheckbox
                        :model-value="
                            isAllSelected ? true : isIndeterminate ? 'indeterminate' : false
                        "
                        @update:model-value="handleSelectAll"
                    />
                    <span class="text-accent-foreground text-sm dark:text-gray-400">
                        {{ selectedModels.size }} / {{ paging.items.length }}
                        {{ t("console-common.selected") }}
                    </span>
                </div>

                <AccessControl :codes="['ai-models:delete']">
                    <UButton
                        color="error"
                        variant="subtle"
                        :label="t('console-common.batchDelete')"
                        icon="i-heroicons-trash"
                        :disabled="selectedModels.size === 0"
                        @click="handleBatchDelete"
                    >
                        <template #trailing>
                            <UKbd>{{ selectedModels.size }}</UKbd>
                        </template>
                    </UButton>
                </AccessControl>

                <AccessControl :codes="['ai-models:create']">
                    <UButton
                        icon="i-heroicons-plus"
                        color="primary"
                        @click="
                            router.push({
                                path: useRoutePath('ai-models:create'),
                                query: { providerId: searchForm.providerId },
                            })
                        "
                    >
                        {{ t("console-ai-provider.model.add") }}
                    </UButton>
                </AccessControl>
            </div>
        </div>

        <!-- 卡片网格 -->
        <template v-if="!paging.loading && paging.items.length > 0">
            <ProScrollArea class="h-[calc(100vh-17rem)]" :shadow="false">
                <div
                    class="mt-2 grid grid-cols-1 gap-6 px-1 py-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                    <ModelCard
                        v-for="model in paging.items"
                        :key="model.id"
                        :model="model"
                        :provider-id="URLQueryParams.id as string"
                        :selected="selectedModels.has(model.id as string)"
                        @select="handleModelSelect"
                        @delete="handleDeleteModel"
                        @set-default="handleSetDefault"
                    />
                </div>
            </ProScrollArea>
        </template>

        <!-- 加载状态 -->
        <div
            v-else-if="paging.loading"
            class="flex h-[calc(100vh-17rem)] items-center justify-center"
        >
            <div class="flex items-center gap-3">
                <UIcon name="i-lucide-loader-2" class="text-primary-500 h-6 w-6 animate-spin" />
                <span class="text-accent-foreground">{{ $t("console-common.loading") }}</span>
            </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="flex h-[calc(100vh-17rem)] flex-col items-center justify-center">
            <UIcon name="i-lucide-brain" class="text-muted-foreground mb-4 h-16 w-16" />
            <h3 class="text-secondary-foreground mb-2 text-lg font-medium">
                {{ $t("console-common.noData") }}
            </h3>
            <p class="text-accent-foreground">
                {{ $t("console-ai-provider.model.noModels") }}
            </p>
        </div>

        <!-- 分页 -->
        <div
            v-if="paging.total > 0"
            class="bg-background sticky bottom-0 z-10 flex items-center justify-between gap-3 py-4"
        >
            <div class="text-muted text-sm">
                {{ selectedModels.size }} {{ $t("console-common.selected") }}
            </div>

            <div class="flex items-center gap-1.5">
                <ProPaginaction
                    v-model:page="paging.page"
                    v-model:size="paging.pageSize"
                    :total="paging.total"
                    @change="getLists"
                />
            </div>
        </div>
    </div>
</template>
