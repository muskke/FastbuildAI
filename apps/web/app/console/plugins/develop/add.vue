<script lang="ts" setup>
import { useMessage } from "@fastbuildai/ui/composables/useMessage";
import { ref } from "vue";
import { useRouter } from "vue-router";

import { apiPostPluginCreate } from "@/services/console/plugin";

import PluginDevelopForm from "./_components/_form.vue";

const router = useRouter();
const message = useMessage();
const formRef = ref(null);

/**
 * 处理表单提交
 */
const handleSubmit = async (formData: any) => {
    try {
        await apiPostPluginCreate(formData);
        message.success("创建成功");
        // setTimeout(() => router.back(), 1000);
    } catch (error) {
        console.error("创建失败:", error);
        message.error("创建失败");
    }
};

/**
 * 处理取消操作
 */
const handleCancel = () => {
    router.back();
};
</script>

<template>
    <div class="plugin-develop-add-container">
        <div
            class="bg-background sticky top-0 z-10 mb-4 flex w-full items-center justify-baseline pb-2"
        >
            <UButton color="neutral" variant="soft" @click="router.back()">
                <UIcon name="i-lucide-arrow-left" class="size-5 cursor-pointer" />
                <span class="text-base font-medium">{{ $t("console-common.back") }}</span>
            </UButton>

            <h1 class="ml-4 text-xl font-bold">{{ $t("console-plugins.develop.addTips") }}</h1>
        </div>

        <PluginDevelopForm
            ref="formRef"
            :is-edit="false"
            @submit-success="handleSubmit"
            @cancel="handleCancel"
        />
    </div>
</template>
