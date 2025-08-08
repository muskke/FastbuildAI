<script lang="ts" setup>
/**
 * 图片组件
 * @description 支持懒加载、链接跳转的图片组件
 */
import { computed, type CSSProperties, onMounted, ref } from "vue";

import { navigateToWeb } from "@/common/utils/helper";

import WidgetsBaseContent from "../../base/widgets-base-content.vue";
import type { Props } from "./config";

const props = defineProps<Props>();

const imageRef = ref<HTMLImageElement>();
const isLoaded = ref(false);
const hasError = ref(false);

/**
 * 图片样式计算
 */
const imageStyle = computed<CSSProperties>(() => ({
    width: "100%",
    height: "100%",
    objectFit: props.objectFit,
    borderRadius: `${props.borderRadius}px`,
    opacity: props.opacity,
    transition: "opacity 0.3s ease",
}));

/**
 * 占位图样式
 */
const placeholderStyle = computed<CSSProperties>(() => ({
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: `${props.borderRadius}px`,
    color: "#999",
    fontSize: "14px",
}));

/**
 * 处理图片加载完成
 */
const handleLoad = () => {
    isLoaded.value = true;
};

/**
 * 处理图片加载错误
 */
const handleError = () => {
    hasError.value = true;
};

/**
 * 是否显示占位图
 */
const showPlaceholder = computed(() => {
    return !props.src || !isLoaded.value || hasError.value;
});

onMounted(() => {
    // 如果不启用懒加载，直接开始加载图片
    if (!props.lazy && props.src) {
        const img = new Image();
        img.onload = handleLoad;
        img.onerror = handleError;
        img.src = props.src;
    }
});
</script>

<template>
    <WidgetsBaseContent :style="props.style" :override-bg-color="true" custom-class="image-content">
        <template #default="{ style }">
            <div
                class="image-wrapper"
                :class="{ 'cursor-pointer': props.to.path }"
                @click="navigateToWeb(props.to)"
            >
                <!-- 占位图或加载状态 -->
                <div v-if="showPlaceholder" :style="placeholderStyle">
                    <UIcon name="i-heroicons-photo" class="text-muted-foreground h-8 w-8" />
                </div>

                <!-- 实际图片 -->
                <img
                    v-else
                    ref="imageRef"
                    :src="props.src"
                    :alt="props.alt"
                    :title="props.title"
                    :style="imageStyle"
                    :loading="props.lazy ? 'lazy' : 'eager'"
                    @load="handleLoad"
                    @error="handleError"
                    class="block"
                />
            </div>
        </template>
    </WidgetsBaseContent>
</template>

<style lang="scss" scoped>
.image-content {
    overflow: hidden;

    .image-wrapper {
        width: 100%;
        height: 100%;
        position: relative;

        &.cursor-pointer:hover {
            opacity: 0.9;
            transition: opacity 0.2s ease;
        }
    }
}
</style>
