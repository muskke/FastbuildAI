<script lang="ts" setup>
/**
 * 插件卡片骨架屏组件
 * 用于在加载插件数据时显示占位效果
 */
</script>

<template>
    <div
        class="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
    >
        <!-- 插件封面骨架 -->
        <div class="relative h-48 bg-gray-100 dark:bg-gray-700">
            <USkeleton class="h-full w-full" />

            <!-- 右上角按钮骨架 -->
            <div class="absolute top-3 right-3 flex items-center gap-2">
                <USkeleton class="h-8 w-16 rounded-md" />
                <USkeleton class="h-8 w-8 rounded-md" />
            </div>
        </div>

        <!-- 插件信息骨架 -->
        <div class="p-4">
            <!-- 插件图标和名称骨架 -->
            <div class="mb-3 flex items-start gap-3">
                <USkeleton class="h-10 w-10 rounded-lg" />
                <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                        <USkeleton class="h-5 w-32" />
                        <USkeleton class="h-4 w-8 rounded-full" />
                    </div>
                    <USkeleton class="mt-1 h-4 w-24" />
                </div>
            </div>

            <!-- 插件描述骨架 -->
            <div class="mb-3 space-y-2">
                <USkeleton class="h-4 w-full" />
            </div>

            <!-- 终端支持标签骨架 -->
            <div class="mb-3 flex flex-wrap gap-1">
                <USkeleton class="h-5 w-12 rounded-full" />
                <USkeleton class="h-5 w-16 rounded-full" />
                <USkeleton class="h-5 w-14 rounded-full" />
            </div>

            <!-- 底部信息和操作按钮骨架 -->
            <div class="flex items-center justify-between">
                <!-- 左侧：时间和版本信息骨架 -->
                <div class="flex items-center gap-2">
                    <USkeleton class="h-3 w-20" />
                    <USkeleton class="h-3 w-1" />
                    <USkeleton class="h-3 w-12" />
                </div>

                <!-- 右侧：操作按钮骨架 -->
                <div class="flex items-center gap-1">
                    <USkeleton class="h-6 w-12 rounded-md" />
                </div>
            </div>
        </div>
    </div>
</template>
