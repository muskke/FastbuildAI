<script setup lang="ts">
/**
 * 测试插件主页面
 * @description 一个简洁美观的测试页面，展示插件的基本功能和数据
 * @author AI Assistant
 */

// 导入测试API服务
import { apiGetHelloWord } from "../services/web/hello-word";

// 使用插件国际化
const { pt } = usePluginI18n();

// SSR请求方式 - 获取hello world数据
const { data, refresh, pending } = await useAsyncData(() => apiGetHelloWord());

// 定义页面元信息
definePageMeta({
    layout: "default",
    name: "测试插件",
    inLinkSelector: true,
});
</script>

<template>
    <div class="flex min-h-screen flex-col items-center justify-center">
        <!-- 主要内容区域 -->
        <div class="mx-auto max-w-7xl px-6 py-12">
            <!-- 页面头部 -->
            <div class="mb-12 text-center">
                <div class="mb-6 flex justify-center">
                    <div
                        class="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg"
                    >
                        <UIcon name="i-lucide-test-tube" class="h-10 w-10 text-white" />
                    </div>
                </div>

                <h1
                    class="mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-4xl font-bold text-transparent dark:from-white dark:to-gray-300"
                >
                    {{ pt("hello-word.title") }}
                </h1>

                <p class="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
                    {{ pt("hello-word.tips") }}
                </p>

                <div class="mt-6 flex justify-center">
                    <UButton
                        :loading="pending"
                        size="lg"
                        color="primary"
                        variant="solid"
                        icon="i-lucide-refresh-cw"
                        @click="refresh()"
                    >
                        {{ pt("hello-word.actions.refresh") }}
                    </UButton>
                </div>
            </div>

            <!-- API数据展示卡片 -->
            <div class="mb-12">
                <UCard class="shadow-xl">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <div class="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                                    <UIcon
                                        name="i-lucide-database"
                                        class="h-5 w-5 text-blue-600 dark:text-blue-400"
                                    />
                                </div>
                                <div>
                                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                                        {{ pt("hello-word.api.title") }}
                                    </h3>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">
                                        {{ pt("hello-word.api.subtitle") }}
                                    </p>
                                </div>
                            </div>
                            <UBadge color="success" variant="soft">{{
                                pt("hello-word.api.status")
                            }}</UBadge>
                        </div>
                    </template>

                    <div class="space-y-4">
                        <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
                            <div class="flex items-start space-x-3">
                                <UIcon name="i-lucide-info" class="mt-0.5 h-5 w-5 text-blue-500" />
                                <div class="flex-1">
                                    <h4 class="font-medium text-gray-900 dark:text-white">
                                        {{ pt("hello-word.api.dataTitle") }}
                                    </h4>
                                    <pre
                                        class="mt-2 overflow-x-auto rounded bg-white p-3 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                                        >{{ JSON.stringify(data, null, 2) }}</pre
                                    >
                                </div>
                            </div>
                        </div>
                    </div>
                </UCard>
            </div>
        </div>
    </div>
</template>
