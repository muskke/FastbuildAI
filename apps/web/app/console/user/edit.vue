<script lang="ts" setup>
import { useLockFn } from "@fastbuildai/ui/composables/useLockFn";
import { useMessage } from "@fastbuildai/ui/composables/useMessage";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { getDefaultAreaCode } from "@/common/config/phone-area";
import { apiGetUserDetail, apiUpdateUser } from "@/services/console/user";

const UserForm = defineAsyncComponent(() => import("./_components/_form.vue"));

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const message = useMessage();

// 获取ID参数
const userId = computed(() => route.query.id as string);

// 初始数据
const initialData = ref({});

/** 获取用户详情 */
const { lockFn: getUserDetail, isLock } = useLockFn(async () => {
    if (!userId.value) {
        message.error(t("console-user.messages.missingUserId"));
        router.back();
        return;
    }

    try {
        const { id, createdAt, updatedAt, lastLoginAt, role, ...response } = await apiGetUserDetail(
            userId.value,
        );
        if (!response.phone) {
            response.phoneAreaCode = getDefaultAreaCode();
        }
        // 转换数据格式以适配表单
        initialData.value = {
            ...response,
            roleId: role?.id || undefined,
        };
    } catch (error) {
        console.error("Get user detail failed:", error);
        message.error(t("console-user.messages.getUserDetailFailed"));
        router.back();
    }
});

/** 处理表单提交 */
const handleSubmit = async (formData: any) => {
    try {
        // 移除更新时不需要的字段
        const { username, password, isRoot, totalRechargeAmount, ...submitData } = formData;

        await apiUpdateUser(userId.value, submitData);
        message.success(t("console-user.messages.updateSuccess"));
        setTimeout(() => router.back(), 1000);
    } catch (error) {
        console.error("Update user failed:", error);
        message.error(t("console-user.messages.updateFailed"));
    }
};

/** 处理取消操作 */
const handleCancel = () => {
    router.back();
};

// 初始化
onMounted(() => getUserDetail());
</script>

<template>
    <div class="user-edit-container">
        <div
            class="bg-background sticky top-0 z-10 mb-4 flex w-full items-center justify-baseline pb-2"
        >
            <UButton color="neutral" variant="soft" @click="router.back()">
                <UIcon name="i-lucide-arrow-left" class="size-5 cursor-pointer" />
                <span class="text-base font-medium">{{ $t("console-common.back") }}</span>
            </UButton>

            <h1 class="ml-4 text-xl font-bold">{{ $t("console-user.editTitle") }}</h1>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLock" class="flex justify-center py-12">
            <UIcon name="i-lucide-loader-2" class="text-primary-500 h-8 w-8 animate-spin" />
        </div>

        <!-- 表单 -->
        <UserForm
            v-else
            :is-edit="true"
            :id="userId"
            :initial-data="initialData"
            @submit-success="handleSubmit"
            @cancel="handleCancel"
        />
    </div>
</template>
