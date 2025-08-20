<script setup lang="ts">
import { ProPaginaction, ProScrollArea, useMessage, useModal, usePaging } from "@fastbuildai/ui";
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";

import type { AiProviderInfo, AiProviderQueryParams } from "@/models/ai-provider";
import {
    apiBatchDeleteAiProviders,
    apiDeleteAiProvider,
    apiGetAiProviderList,
    apiToggleAiProviderActive,
} from "@/services/console/ai-provider";

const ProviderCard = defineAsyncComponent(() => import("./_components/provider-card.vue"));
const ProviderEdit = defineAsyncComponent(() => import("./edit.vue"));

// 路由实例
const router = useRouter();
const toast = useMessage();
const { t } = useI18n();

// 列表查询参数（匹配后端支持的参数）
const searchForm: AiProviderQueryParams = reactive({
    keyword: "",
    isActive: undefined,
});

// 选中的供应商
const selectedProviders = ref<Set<string>>(new Set());

// 弹窗状态
const showProviderModal = ref(false);
const editingProviderId = ref("");
/**
 * 筛选状态
 */
const searchIsActive = ref();

const { paging, getLists } = usePaging({
    fetchFun: apiGetAiProviderList,
    params: searchForm,
});

/**
 * 处理供应商选择
 */
const handleProviderSelect = (provider: AiProviderInfo, selected: boolean | "indeterminate") => {
    if (typeof selected === "boolean") {
        const providerId = provider.id as string;
        if (selected) {
            selectedProviders.value.add(providerId);
        } else {
            selectedProviders.value.delete(providerId);
        }
    }
};

/**
 * 全选/取消全选
 */
const handleSelectAll = (value: boolean | "indeterminate") => {
    const isSelected = value === true;
    if (isSelected) {
        paging.items.forEach((provider: AiProviderInfo) => {
            if (provider.id) {
                selectedProviders.value.add(provider.id as string);
            }
        });
    } else {
        selectedProviders.value.clear();
    }
};

/** 删除数据 */
const handleDelete = async (id: string | string[]) => {
    try {
        await useModal({
            title: "删除供应商",
            description: "确定要删除选中的供应商吗？此操作不可恢复。",
            color: "error",
        });

        if (Array.isArray(id)) {
            await apiBatchDeleteAiProviders(id);
            toast.success("批量删除成功");
        } else {
            await apiDeleteAiProvider(id);
            toast.success("删除成功");
        }

        // 清空选中状态
        selectedProviders.value.clear();

        // 刷新列表
        getLists();
    } catch (error) {
        console.error("Delete failed:", error);
        toast.error("删除失败");
    }
};

/**
 * 处理删除供应商
 */
const handleDeleteProvider = (provider: AiProviderInfo) => {
    if (provider.id) {
        handleDelete(provider.id);
    }
};

/**
 * 批量删除选中供应商
 */
const handleBatchDelete = () => {
    const selectedIds = Array.from(selectedProviders.value);
    if (selectedIds.length === 0) return;
    handleDelete(selectedIds);
};

/**
 * 查看模型
 */
const handleViewModels = (providerId: string) => {
    router.push(`/console/ai-config/provider/model?providerId=${providerId}`);
};

/**
 * 新增供应商
 */
const handleAddProvider = () => {
    editingProviderId.value = "";
    showProviderModal.value = true;
};

/**
 * 编辑供应商
 */
const handleEditProvider = (provider: AiProviderInfo) => {
    editingProviderId.value = provider.id;
    showProviderModal.value = true;
};

/**
 * 弹窗操作成功回调
 */
const handleModalSuccess = () => {
    getLists();
};

/**
 * 处理启用/禁用供应商
 */
const handleToggleProviderActive = async (providerId: string, isActive: boolean) => {
    try {
        await apiToggleAiProviderActive(providerId, isActive);
        toast.success(isActive ? "供应商已启用" : "供应商已禁用");

        // 刷新列表
        getLists();
    } catch (error) {
        console.error("Toggle provider active failed:", error);
    }
};

/**
 * 计算选中状态
 */
const isAllSelected = computed(() => {
    return (
        paging.items.length > 0 &&
        paging.items.every(
            (provider: AiProviderInfo) =>
                provider.id && selectedProviders.value.has(provider.id as string),
        )
    );
});

const isIndeterminate = computed(() => {
    const selectedCount = paging.items.filter(
        (provider: AiProviderInfo) =>
            provider.id && selectedProviders.value.has(provider.id as string),
    ).length;
    return selectedCount > 0 && selectedCount < paging.items.length;
});

/**
 * 处理状态筛选变化
 */
const handleIsActiveChange = () => {
    if (searchIsActive.value === "all") {
        searchForm.isActive = undefined;
    } else {
        searchForm.isActive = searchIsActive.value === true;
    }
    getLists();
};

// 初始化
onMounted(() => getLists());
</script>

<template>
    <div class="provider-list-container pb-5">
        <!-- 搜索区域 -->
        <div class="bg-background sticky top-0 z-10 flex flex-wrap gap-4 pb-2">
            <UInput
                v-model="searchForm.keyword"
                :placeholder="t('console-ai-provider.search.placeholder')"
                @change="getLists"
            />

            <USelect
                v-model="searchIsActive"
                :items="[
                    { label: t('console-ai-provider.search.all'), value: 'all' },
                    { label: t('console-ai-provider.search.enabled'), value: true },
                    { label: t('console-ai-provider.search.disabled'), value: false },
                ]"
                class="w-fit"
                label-key="label"
                value-key="value"
                :placeholder="t('console-ai-provider.search.status')"
                @change="handleIsActiveChange"
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
                        {{ selectedProviders.size }} / {{ paging.items.length }}
                        {{ t("console-common.selected") }}
                    </span>
                </div>

                <AccessControl :codes="['ai-providers:delete']">
                    <UButton
                        color="error"
                        variant="subtle"
                        :label="t('console-common.batchDelete')"
                        icon="i-heroicons-trash"
                        :disabled="selectedProviders.size === 0"
                        @click="handleBatchDelete"
                    >
                        <template #trailing>
                            <UKbd>{{ selectedProviders.size }}</UKbd>
                        </template>
                    </UButton>
                </AccessControl>

                <AccessControl :codes="['ai-providers:create']">
                    <UButton icon="i-heroicons-plus" color="primary" @click="handleAddProvider">
                        {{ t("console-ai-provider.addTitle") }}
                    </UButton>
                </AccessControl>
            </div>
        </div>

        <!-- 卡片网格 -->
        <template v-if="!paging.loading && paging.items.length > 0">
            <ProScrollArea class="h-[calc(100vh-13rem)]" :shadow="false">
                <div
                    class="mt-2 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
                >
                    <ProviderCard
                        v-for="provider in paging.items"
                        :key="provider.id"
                        :provider="provider"
                        :selected="selectedProviders.has(provider.id as string)"
                        @select="handleProviderSelect"
                        @delete="handleDeleteProvider"
                        @edit="handleEditProvider"
                        @view-models="handleViewModels"
                        @toggle-active="handleToggleProviderActive"
                    />
                </div>
            </ProScrollArea>
        </template>

        <!-- 加载状态 -->
        <div
            v-else-if="paging.loading"
            class="flex h-[calc(100vh-13rem)] items-center justify-center"
        >
            <div class="flex items-center gap-3">
                <UIcon name="i-lucide-loader-2" class="text-primary-500 h-6 w-6 animate-spin" />
                <span class="text-accent-foreground">{{ $t("console-common.loading") }}</span>
            </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="flex h-[calc(100vh-13rem)] flex-col items-center justify-center">
            <UIcon name="i-lucide-building" class="text-muted-foreground mb-4 h-16 w-16" />
            <h3 class="text-secondary-foreground mb-2 text-lg font-medium">暂无供应商</h3>
            <p class="text-accent-foreground">还没有配置任何AI服务供应商</p>
            <UButton
                class="mt-4"
                icon="i-heroicons-plus"
                color="primary"
                @click="handleAddProvider"
            >
                添加第一个供应商
            </UButton>
        </div>

        <!-- 分页 -->
        <div
            v-if="paging.total > 0"
            class="bg-background sticky bottom-0 z-10 flex items-center justify-between gap-3 py-4"
        >
            <div class="text-muted text-sm">
                {{ selectedProviders.size }} {{ $t("console-common.selected") }}
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

        <!-- 供应商弹窗 -->
        <ProviderEdit
            v-if="showProviderModal"
            :id="editingProviderId"
            @close="
                (refresh) => {
                    showProviderModal = false;
                    if (refresh) handleModalSuccess();
                }
            "
        />
    </div>
</template>
