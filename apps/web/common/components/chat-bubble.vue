<script setup lang="ts">
import { computed } from "vue";

interface ChatBubbleProps {
    /** 消息类型：用户消息或系统/AI消息 */
    type?: "user" | "system";
    /** 自定义气泡样式类 */
    bubbleClass?: string;
}

const props = withDefaults(defineProps<ChatBubbleProps>(), {
    type: "system",
    bubbleClass: "",
});

/**
 * 计算气泡的样式类
 */
const bubbleClasses = computed(() => {
    const baseClasses = "rounded-lg text-sm max-w-full break-words";

    // 根据类型应用不同的样式
    const typeClasses =
        props.type === "user" ? "bg-primary-400 text-background px-4 py-3" : "text-foreground";

    return [baseClasses, typeClasses, props.bubbleClass];
});
</script>

<template>
    <div :class="bubbleClasses">
        <slot />
    </div>
</template>
