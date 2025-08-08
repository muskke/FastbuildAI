<script lang="ts" setup>
import { useMessage } from "@fastbuildai/ui/composables/useMessage";
import { ref } from "vue";
import { useRouter } from "vue-router";

import { apiCreateUser } from "@/services/console/user";

const UserForm = defineAsyncComponent(() => import("./_components/_form.vue"));

const router = useRouter();
const message = useMessage();
const formRef = ref(null);

/** 处理表单提交 */
const handleSubmit = async (formData: any) => {
    try {
        // 移除确认密码字段，后端不需要
        const { confirmPassword, ...submitData } = formData;

        await apiCreateUser(submitData);
        message.success(t("console-user.messages.createSuccess"));
        setTimeout(() => router.back(), 1000);
    } catch (error) {
        console.error("Create console-user failed:", error);
        message.error(t("console-user.messages.createFailed"));
    }
};

/** 处理取消操作 */
const handleCancel = () => {
    router.back();
};

const { t } = useI18n();
</script>

<template>
    <div class="user-add-container">
        <div
            class="bg-background sticky top-0 z-10 mb-4 flex w-full items-center justify-baseline pb-2"
        >
            <UButton color="neutral" variant="soft" @click="router.back()">
                <UIcon name="i-lucide-arrow-left" class="size-5 cursor-pointer" />
                <span class="text-base font-medium">{{ $t("console-common.back") }}</span>
            </UButton>

            <h1 class="ml-4 text-xl font-bold">{{ $t("console-user.addTitle") }}</h1>
        </div>

        <UserForm
            ref="formRef"
            :is-edit="false"
            @submit-success="handleSubmit"
            @cancel="handleCancel"
        />
    </div>
</template>
