<script setup lang="ts">
/**
 * 测试插件后台页面
 * @description 极简风格的展示页面
 */

import { ref } from "vue";

// 引入插件国际化
const { pt } = usePluginI18n();

// 按钮交互状态
const quickStartLoading = ref(false);
const advancedLoading = ref(false);

/**
 * 快速开始操作
 */
const handleQuickStart = async () => {
    quickStartLoading.value = true;
    // 模拟操作
    setTimeout(() => {
        quickStartLoading.value = false;
        // 可以在这里添加具体的快速开始逻辑
        console.log("快速开始操作");
    }, 1000);
};

/**
 * 进阶学习操作
 */
const handleAdvancedLearning = () => {
    advancedLoading.value = true;
    setTimeout(() => {
        advancedLoading.value = false;
        // 可以在这里添加具体的进阶学习逻辑
        console.log("进阶学习操作");
    }, 800);
};
</script>

<template>
    <div class="flex flex-col items-center justify-center" style="height: 70vh">
        <!-- 主标题 -->
        <h1
            class="mb-12 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white"
        >
            {{ pt("console-hello-word.main.title") }}
        </h1>

        <!-- 副标题 -->
        <p class="mx-auto mb-12 max-w-2xl text-lg text-gray-600 md:text-xl dark:text-gray-300">
            {{ pt("console-hello-word.main.subtitle") }}
        </p>

        <!-- 操作按钮 -->
        <div class="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <!-- 快速开始按钮 -->
            <UButton
                size="lg"
                :loading="quickStartLoading"
                class="w-full text-base font-medium sm:w-auto"
                @click="handleQuickStart"
            >
                <template #trailing>
                    <UIcon name="i-lucide-arrow-right" class="h-4 w-4" />
                </template>
                {{ pt("console-hello-word.main.quickStart") }}
            </UButton>

            <!-- 进阶学习按钮 -->
            <UButton
                size="lg"
                variant="outline"
                :loading="advancedLoading"
                class="w-full text-base font-medium sm:w-auto"
                @click="handleAdvancedLearning"
            >
                {{ pt("console-hello-word.main.advancedLearning") }}
            </UButton>
        </div>
    </div>
</template>
