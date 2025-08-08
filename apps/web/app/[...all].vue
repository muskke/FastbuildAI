<script setup lang="ts">
/**
 * 404页面 - 路由未找到
 * 使用国际化支持多语言显示
 */

const router = useRouter();
const { t } = useI18n();

// 设置页面元信息
definePageMeta({
    layout: "full-screen",
});

// SEO 设置
useSeoMeta({
    title: () => t("common.error.404.title"),
    description: () => t("common.error.404.description"),
    robots: "noindex, nofollow",
});
</script>

<template>
    <div
        class="dark:from-dark-800 dark:to-dark-900 flex min-h-screen w-full flex-col items-center justify-center transition-colors duration-300"
    >
        <!-- 404数字动画 -->
        <div class="relative">
            <div
                class="animate-float text-404 text-center font-bold text-gray-200/50 select-none dark:text-white"
            >
                404
            </div>
            <div
                class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform text-center"
            >
                <h1 class="text-primary dark:text-primary-400 animate-pulse text-4xl font-bold">
                    {{ $t("common.error.404.title") }}
                </h1>
                <p class="text-accent-foreground mt-4 text-lg dark:text-gray-400">
                    {{ $t("common.error.404.description") }}
                </p>
            </div>
        </div>

        <!-- 按钮组 -->
        <div class="mt-8 flex gap-4">
            <UButton severity="primary" raised @click="router.back()">
                {{ $t("common.error.404.goBack") }}
            </UButton>
            <UButton severity="secondary" raised @click="router.push('/')">
                {{ $t("common.error.404.goHome") }}
            </UButton>
        </div>

        <!-- 飘动的元素 -->
        <div class="pointer-events-none absolute inset-0 overflow-hidden">
            <div
                v-for="n in 20"
                :key="n"
                class="animate-float absolute"
                :style="{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${3 + Math.random() * 3}s`,
                }"
            >
                <i
                    class="i-carbon-code dark:text-dark-700/20 text-2xl text-gray-200/30 transition-colors duration-300"
                />
            </div>
        </div>
    </div>
</template>

<style scoped>
.text-404 {
    font-size: 15rem;
    line-height: 1;
    letter-spacing: 0.5rem;
}

@keyframes float {
    0%,
    100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-20px);
    }
}

.animate-float {
    animation: float 3s ease-in-out infinite;
}

.animate-bounce-slow {
    animation: bounce 2s infinite;
}

.animation-delay-100 {
    animation-delay: 100ms;
}
</style>
