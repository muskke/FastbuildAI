<script lang="ts" setup>
import { useMessage } from "@fastbuildai/ui/composables/useMessage";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { apiGetPluginDetail } from "@/services/console/plugin";

import PluginDevelopForm from "./_components/_form.vue";

const apiUpdatePluginDevelop = async (id: string, formData: any) => {
    // 模拟更新API
    console.log("更新插件:", id, formData);
    return { success: true };
};

const route = useRoute();
const router = useRouter();
const message = useMessage();
const formRef = ref(null);

// 获取ID参数
const pluginId = computed(() => route.query.id as string);

// 初始数据
const initialData = ref({});
const loading = ref(false);

/**
 * 获取插件详情
 */
const getPluginDetail = async () => {
    if (!pluginId.value) {
        message.error("缺少插件ID参数");
        router.back();
        return;
    }

    loading.value = true;
    try {
        const response = await apiGetPluginDetail(pluginId.value);
        initialData.value = response;
    } catch (error) {
        console.error("获取插件详情失败:", error);
        message.error("获取插件详情失败");
        router.back();
    } finally {
        loading.value = false;
    }
};

/**
 * 处理表单提交
 */
const handleSubmit = async (formData: any) => {
    try {
        await apiUpdatePluginDevelop(pluginId.value, formData);
        message.success("更新成功");
        setTimeout(() => router.back(), 1000);
    } catch (error) {
        console.error("更新失败:", error);
        message.error("更新失败");
    }
};

/**
 * 处理取消操作
 */
const handleCancel = () => {
    router.back();
};

// 初始化
onMounted(() => {
    getPluginDetail();
});
</script>

<template>
    <div class="plugin-develop-edit-container">
        <div
            class="bg-background sticky top-0 z-10 mb-4 flex w-full items-center justify-baseline pb-2"
        >
            <UButton color="neutral" variant="soft" @click="router.back()">
                <UIcon name="i-lucide-arrow-left" class="size-5 cursor-pointer" />
                <span class="text-base font-medium">{{ $t("console-common.back") }}</span>
            </UButton>

            <h1 class="ml-4 text-xl font-bold">{{ $t("console-plugins.develop.editTips") }}</h1>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="flex justify-center py-12">
            <UIcon name="i-lucide-loader-2" class="text-primary-500 h-8 w-8 animate-spin" />
        </div>

        <!-- 表单 -->
        <PluginDevelopForm
            v-else
            ref="formRef"
            :is-edit="true"
            :id="pluginId"
            :initial-data="initialData"
            @submit-success="handleSubmit"
            @cancel="handleCancel"
        />
    </div>
</template>
