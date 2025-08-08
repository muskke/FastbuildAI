<script setup lang="ts">
import { DotLottieVue } from "@lottiefiles/dotlottie-vue";

// 暴露插件元数据给父组件
const emits = defineEmits<{
    (e: "updateStyle", style: { width: string; height: string }): void;
}>();

// 在组件挂载时设置容器样式
onMounted(() => {
    emits("updateStyle", { width: "360px", height: "320px" });
});
</script>

<template>
    <Motion
        :initial="{ opacity: 0, y: 10 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{
            type: 'tween',
            stiffness: 300,
            damping: 30,
            delay: 0.2,
        }"
        class="flex h-full flex-col items-center justify-center p-8 text-center"
    >
        <div class="flex h-[150px] w-[150px] items-center justify-center">
            <DotLottieVue class="h-[150px] w-[150px]" autoplay src="assets/lottie/success.lottie" />
        </div>
        <h2 class="mb-2 text-2xl font-bold">登录成功</h2>
        <p class="text-muted-foreground text-sm">正在为您跳转...</p>
    </Motion>
</template>
