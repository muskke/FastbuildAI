<script lang="ts" setup>
import { ProScrollArea, useMessage, useModal, usePaging } from "@fastbuildai/ui";
import { ProDateRangePicker, ProPaginaction } from "@fastbuildai/ui";
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";

import type { UserInfo, UserQueryRequest } from "@/models/user";
import { apiBatchDeleteUser, apiDeleteUser, apiGetUserList } from "@/services/console/user";

const UserCard = defineAsyncComponent(() => import("./_components/user-card.vue"));

// 路由实例
const router = useRouter();
const toast = useMessage();
const { t } = useI18n();

// 列表查询参数
const searchForm = reactive<UserQueryRequest>({
    keyword: "",
    startTime: "",
    endTime: "",
});

// 选中的用户
const selectedUsers = ref<Set<string>>(new Set());

const { paging, getLists } = usePaging({
    fetchFun: apiGetUserList,
    params: searchForm,
});

/** 处理用户选择 */
const handleUserSelect = (user: UserInfo, selected: boolean | "indeterminate") => {
    if (typeof selected === "boolean") {
        const userId = user.id as string;
        if (selected) {
            selectedUsers.value.add(userId);
        } else {
            selectedUsers.value.delete(userId);
        }
    }
};

/** 全选/取消全选 */
const handleSelectAll = (value: boolean | "indeterminate") => {
    const isSelected = value === true;
    if (isSelected) {
        paging.items.forEach((user: UserInfo) => {
            if (user.id) {
                selectedUsers.value.add(user.id as string);
            }
        });
    } else {
        selectedUsers.value.clear();
    }
};

/** 删除数据 */
const handleDelete = async (id: number | string | number[] | string[]) => {
    try {
        await useModal({
            title: t("console-user.deleteTitle"),
            description: t("console-user.deleteMsg"),
            color: "error",
        });

        if (Array.isArray(id)) {
            await apiBatchDeleteUser(id.map(String));
        } else {
            await apiDeleteUser(String(id));
        }

        // 清空选中状态
        selectedUsers.value.clear();

        // 刷新列表
        getLists();
        toast.success(t("console-user.success"));
    } catch (error) {
        console.error("Delete failed:", error);
        toast.error(t("console-user.error"));
    }
};

/** 处理删除用户 */
const handleDeleteUser = (user: UserInfo) => {
    if (user.id) {
        handleDelete(user.id);
    }
};

/**
 * 批量删除选中用户
 */
const handleBatchDelete = () => {
    const selectedIds = Array.from(selectedUsers.value);
    if (selectedIds.length === 0) return;
    handleDelete(selectedIds);
};

/** 计算选中状态 */
const isAllSelected = computed(() => {
    return (
        paging.items.length > 0 &&
        paging.items.every(
            (user: UserInfo) => user.id && selectedUsers.value.has(user.id as string),
        )
    );
});

const isIndeterminate = computed(() => {
    const selectedCount = paging.items.filter(
        (user: UserInfo) => user.id && selectedUsers.value.has(user.id as string),
    ).length;
    return selectedCount > 0 && selectedCount < paging.items.length;
});

// 初始化
onMounted(() => getLists());
</script>

<template>
    <div class="user-list-container pb-5">
        <!-- 搜索区域 -->
        <div class="bg-background sticky top-0 z-10 flex flex-wrap gap-4 pb-2">
            <UInput
                v-model="searchForm.keyword"
                :placeholder="t('console-user.keywordInput')"
                class="w-80"
                @change="getLists"
            />

            <ProDateRangePicker
                v-model:start="searchForm.startTime"
                v-model:end="searchForm.endTime"
                :show-time="true"
                :ui="{ root: 'w-auto sm:w-xs' }"
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
                    <span class="text-accent-foreground text-sm">
                        {{ selectedUsers.size }} / {{ paging.items.length }}
                        {{ t("console-common.selected") }}
                    </span>
                </div>

                <AccessControl :codes="['users:batch-delete']">
                    <UButton
                        color="error"
                        variant="subtle"
                        :label="t('console-common.batchDelete')"
                        icon="i-heroicons-trash"
                        :disabled="selectedUsers.size === 0"
                        @click="handleBatchDelete"
                    >
                        <template #trailing>
                            <UKbd>{{ selectedUsers.size }}</UKbd>
                        </template>
                    </UButton>
                </AccessControl>

                <AccessControl :codes="['users:create']">
                    <UButton
                        icon="i-heroicons-plus"
                        color="primary"
                        @click="router.push(useRoutePath('users:create'))"
                    >
                        {{ t("console-user.add") }}
                    </UButton>
                </AccessControl>
            </div>
        </div>

        <!-- 卡片网格 -->
        <template v-if="!paging.loading && paging.items.length > 0">
            <ProScrollArea class="h-[calc(100vh-13rem)]" :shadow="false">
                <div
                    class="mt-2 grid grid-cols-1 gap-6 px-1 py-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                    <UserCard
                        v-for="user in paging.items"
                        :key="user.id"
                        :user="user"
                        :selected="selectedUsers.has(user.id as string)"
                        @select="handleUserSelect"
                        @delete="handleDeleteUser"
                    />
                </div>
            </ProScrollArea>
        </template>

        <!-- 加载状态 -->
        <div
            v-else-if="paging.loading"
            class="flex h-[calc(100vh-10rem)] items-center justify-center"
        >
            <div class="flex items-center gap-3">
                <UIcon name="i-lucide-loader-2" class="text-primary-500 h-6 w-6 animate-spin" />
                <span class="text-accent-foreground dark:text-gray-400">{{
                    $t("console-common.loading")
                }}</span>
            </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="flex h-[calc(100vh-10rem)] flex-col items-center justify-center">
            <UIcon name="i-lucide-users" class="mb-4 h-16 w-16 text-gray-400" />

            <p class="text-accent-foreground dark:text-gray-400">
                {{ $t("console-user.noUsers") }}
            </p>
        </div>

        <!-- 分页 -->
        <div
            v-if="paging.total > 0"
            class="bg-background sticky bottom-0 z-10 flex items-center justify-between gap-3 py-4"
        >
            <div class="text-muted text-sm">
                {{ selectedUsers.size }} {{ $t("console-common.selected") }}
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
