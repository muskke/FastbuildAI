<script setup lang="ts">
// Nuxt UI 的 UButton 不需要额外引入样式，确保你已安装并配置 nuxt-ui
</script>

<template>
    <div class="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <div class="max-w-md">
            <h1 class="mb-4 text-6xl font-extrabold text-red-500">403</h1>
            <p class="mb-2 text-xl font-semibold text-gray-800">无权限访问</p>
            <p class="text-muted-foreground mb-6">您没有权限查看此页面，请联系管理员或返回首页。</p>

            <UButton to="/" color="primary" size="lg" icon="i-heroicons-arrow-left">
                返回首页
            </UButton>
        </div>
    </div>
</template>
