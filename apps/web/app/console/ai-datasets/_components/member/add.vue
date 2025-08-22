<script setup lang="ts">
import { ProModal, useLockFn, useMessage } from "@fastbuildai/ui";
import { refDebounced } from "@vueuse/core";
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import type { TeamRole } from "@/models/ai-datasets";
import type { UserInfo } from "@/models/user";
import { apiBatchAddTeamMembers } from "@/services/console/ai-datasets";
import { apiSearchUsers } from "@/services/web/user";

const { t } = useI18n();
const toast = useMessage();

const props = defineProps<{
    modelValue: boolean;
    datasetId: string;
}>();

const emits = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
    (e: "close", refresh?: boolean): void;
}>();

const isOpen = ref(false);
watch(
    () => props.modelValue,
    (val) => (isOpen.value = val),
    { immediate: true },
);
watch(
    () => isOpen.value,
    (val) => emits("update:modelValue", val),
);

// 表单数据
const formData = reactive({
    note: "",
});

// 用户搜索相关状态
const searchResults = ref<any[]>([]);
const selectedUsers = ref<UserInfo[]>([]);
const searchValue = ref<string>("");
const searchValueDebounced = refDebounced(searchValue, 200);

const roleOptions = [
    { label: "管理者", value: "manager" },
    { label: "编辑者", value: "editor" },
    { label: "查看者", value: "viewer" },
];

// 搜索用户函数
const searchUsers = async (keyword: string) => {
    if (!keyword.trim()) {
        searchResults.value = [];
    }
    try {
        const users = await apiSearchUsers({ keyword: keyword.trim(), limit: 20 });
        searchResults.value = users.map((user) => ({
            id: user.id,
            label: user.nickname || user.username,
            role: "viewer" as TeamRole,
            suffix: user.username,
            avatar: {
                src: user.avatar || "",
                alt: user.username,
            },
        }));
    } catch (error) {
        searchResults.value = [];
    }
};

// 动态分组，label根据搜索词变化
const groups = computed(() => [
    {
        id: "users",
        label: searchValue.value ? `用户匹配 “${searchValue.value}”...` : "用户",
        items: searchResults.value,
        ignoreFilter: true,
    },
]);

// 重置表单
const resetForm = () => {
    selectedUsers.value = [];
    formData.note = "";
    searchResults.value = [];
    searchValue.value = "";
};

// 提交表单
const { lockFn: submitForm, isLock } = useLockFn(async () => {
    try {
        if (selectedUsers.value.length === 0) {
            toast.error("请选择用户");
            return;
        }

        const members = selectedUsers.value.map((user) => ({
            userId: user.id,
            role: user.role as unknown as TeamRole,
            note: formData.note || undefined,
        }));

        await apiBatchAddTeamMembers({
            datasetId: props.datasetId,
            members,
        });

        toast.success(`成功添加 ${selectedUsers.value.length} 个成员`);
        isOpen.value = false;
        resetForm();
        emits("close", true);
    } catch (error) {
        console.error("添加成员失败:", error);
        toast.error("添加成员失败");
    }
});

// 关闭弹窗
const handleClose = () => {
    isOpen.value = false;
    resetForm();
    emits("close");
};

watch(
    () => searchValueDebounced.value,
    (val) => {
        searchUsers(val);
    },
    {
        immediate: true,
    },
);
</script>

<template>
    <ProModal
        v-model="isOpen"
        title="添加团队成员"
        description="搜索并选择要添加的团队成员，设置角色和备注信息"
        :ui="{ content: 'max-w-lg' }"
        @close="handleClose"
    >
        <UCommandPalette
            v-model:search-term="searchValue"
            v-model="selectedUsers"
            :groups="groups"
            class="min-h-64 pt-4"
            :multiple="true"
            empty-state="暂无用户"
            placeholder="搜索并选择用户..."
        >
            <template #item-trailing="{ item }">
                <div class="flex items-center gap-2">
                    <USelect
                        v-model="item.role"
                        :items="roleOptions"
                        label-key="label"
                        value-key="value"
                        @click.stop
                    />
                    <UInput v-model="formData.note" placeholder="备注信息（可选）" @click.stop />
                    <UButton
                        v-if="!selectedUsers.some((user) => user.id === item.id)"
                        color="primary"
                        size="sm"
                        class="flex-shrink-0"
                    >
                        添加
                    </UButton>
                </div>
            </template>
            <template #empty>
                <div class="flex h-full min-h-36 flex-col items-center justify-center gap-2">
                    <UIcon name="i-lucide-users" class="text-muted-foreground text-2xl" />
                    <div class="text-muted-foreground text-sm">请搜索用户并选择</div>
                </div>
            </template>
        </UCommandPalette>

        <!-- 底部按钮 -->
        <div class="mt-6 flex justify-end gap-2">
            <UButton color="neutral" variant="soft" size="lg" @click="handleClose"> 取消 </UButton>
            <UButton
                color="primary"
                size="lg"
                :loading="isLock"
                :disabled="selectedUsers.length === 0"
                @click="submitForm"
            >
                添加
            </UButton>
        </div>
    </ProModal>
</template>
