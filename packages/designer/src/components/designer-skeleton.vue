<script setup lang="ts">
/**
 * 设计器页面骨架屏组件
 * 使用 Nuxt UI 的 USkeleton 组件
 */
</script>

<template>
    <div class="relative flex h-full w-full gap-3">
        <!-- 左侧组件面板骨架 -->
        <div class="bg-background border-muted flex w-[208px] flex-col rounded-md border p-2">
            <!-- 面板头部 -->
            <div class="flex h-10 items-center justify-between">
                <USkeleton class="h-6 w-20" />
                <USkeleton class="h-6 w-6" />
            </div>

            <!-- 组件分类 -->
            <div class="flex-1 space-y-6 p-2">
                <div v-for="category in 4" :key="category" class="space-y-3">
                    <!-- 分类标题 -->
                    <USkeleton class="h-5 w-24" />

                    <!-- 组件项 -->
                    <div class="grid grid-cols-3 gap-3">
                        <USkeleton v-for="item in 6" :key="item" class="h-12 rounded-lg" />
                    </div>
                </div>
            </div>
        </div>

        <!-- 中间工作区骨架 -->
        <div class="bg-background flex flex-1 flex-col rounded-md">
            <!-- 工具栏 -->
            <div class="flex h-14 items-center justify-between px-4">
                <div class="flex items-center space-x-4">
                    <USkeleton class="h-8 w-16" />
                    <USkeleton class="h-8 w-16" />
                    <USkeleton class="h-8 w-16" />
                </div>
                <div class="flex items-center space-x-2">
                    <USkeleton class="h-8 w-12" />
                    <USkeleton class="h-8 w-20" />
                </div>
            </div>

            <!-- 画布区域 -->
            <div class="relative flex-1 overflow-hidden p-8">
                <!-- 底部缩放控制器 -->
                <div class="absolute bottom-5 left-1/2 -translate-x-1/2">
                    <div class="flex items-center space-x-2 rounded-lg border px-4 py-2 shadow-lg">
                        <USkeleton class="h-6 w-8" />
                        <USkeleton class="h-6 w-8" />
                        <USkeleton class="h-6 w-12" />
                        <USkeleton class="h-6 w-8" />
                        <USkeleton class="h-6 w-8" />
                    </div>
                </div>
            </div>
        </div>

        <!-- 右侧属性面板骨架 -->
        <div class="bg-background border-muted flex w-[280px] flex-col rounded-md border">
            <!-- 面板头部 -->
            <div class="flex h-14 items-center justify-between px-4">
                <USkeleton class="h-6 w-16" />
                <USkeleton class="h-6 w-6" />
            </div>

            <!-- 属性内容 -->
            <div class="flex-1 space-y-6 overflow-y-auto p-4">
                <!-- 基础属性 -->
                <div class="space-y-4">
                    <USkeleton class="h-5 w-20" />
                    <div class="space-y-3">
                        <div v-for="prop in 4" :key="prop" class="space-y-2">
                            <USkeleton class="h-4 w-16" />
                            <USkeleton class="h-10 w-full" />
                        </div>
                    </div>
                </div>

                <!-- 样式属性 -->
                <div class="space-y-4">
                    <USkeleton class="h-5 w-16" />
                    <div class="space-y-3">
                        <div v-for="style in 4" :key="style" class="space-y-2">
                            <USkeleton class="h-4 w-20" />
                            <USkeleton class="h-10 w-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
