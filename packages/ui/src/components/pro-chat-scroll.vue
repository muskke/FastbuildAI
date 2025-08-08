<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";

interface ProInfiniteScrollProps {
    /** 是否正在加载中 */
    loading?: boolean;
    /** 是否还有更多数据可加载 */
    hasMore?: boolean;
    /** 触发加载的距离，单位为像素 */
    threshold?: number;
    /** 加载中显示的文本 */
    loadingText?: string;
    /** 内容样式风格 */
    contentClass?: string;
}

interface ProInfiniteScrollEmits {
    /** 加载更多事件 */
    (e: "loadMore"): void;
}

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<ProInfiniteScrollProps>(), {
    loading: false,
    hasMore: true,
    threshold: 200,
    loadingText: "加载中...",
});

const emits = defineEmits<ProInfiniteScrollEmits>();

/** 滚动容器元素引用 */
let scrollContainer: HTMLElement | null = null;

/** 加载指示器元素引用 */
const loadingRef = useTemplateRef<HTMLDivElement>("loadingRef");

/** IntersectionObserver 实例 */
let observer: IntersectionObserver | null = null;

/**
 * 查找滚动容器元素
 */
function findScrollContainer(element: HTMLElement | null): HTMLElement | null {
    if (!element) return null;

    let parent = element.parentElement;
    while (parent) {
        const { overflow, overflowY } = getComputedStyle(parent);
        if (["auto", "scroll"].includes(overflow) || ["auto", "scroll"].includes(overflowY)) {
            return parent;
        }
        parent = parent.parentElement;
    }

    return document.documentElement;
}

/**
 * 创建并初始化 IntersectionObserver
 * 当加载指示器元素进入视口时触发加载更多
 */
function createObserver() {
    // 如果不满足创建条件，直接返回
    if (!window.IntersectionObserver || !loadingRef.value || !props.hasMore || props.loading)
        return;

    // 在翻转模式下，我们需要监测顶部而不是底部
    // 由于内容是翻转的，所以我们设置顶部的 rootMargin
    observer = new IntersectionObserver(
        (entries) => {
            if (entries[0]?.isIntersecting) {
                // 触发加载更多事件
                emits("loadMore");
            }
        },
        {
            root: scrollContainer,
            // 在翻转模式下，顶部变成了视觉上的底部，所以设置顶部 margin
            rootMargin: `${props.threshold}px`,
            threshold: 0,
        },
    );

    observer.observe(loadingRef.value);
}

function resetObserver() {
    if (observer) {
        observer.disconnect();
        observer = null;
    }

    if (scrollContainer?.scrollTop == 0) {
        (scrollContainer as HTMLElement).scrollTop = 1;
    }

    nextTick(createObserver);
}

watch(
    () => [props.loading, props.hasMore],
    () => {
        resetObserver();
    },
);

onMounted(() => {
    createObserver();
    scrollContainer = findScrollContainer(loadingRef.value);
});
onUnmounted(() => {
    observer?.disconnect();
    observer = null;
});
</script>

<template>
    <div class="relative flex scale-y-[-1] flex-col items-center" v-bind="$attrs">
        <!-- 内容区域 -->
        <div class="flex scale-y-[-1] flex-col-reverse" :class="contentClass">
            <slot />
        </div>

        <!-- 加载指示器 -->
        <div
            v-if="!props.loading && props.hasMore"
            ref="loadingRef"
            class="absolute bottom-0 z-[-1] flex h-screen w-full scale-y-[-1] items-center justify-center"
        >
            <div class="flex items-center justify-center gap-1 opacity-0">
                <UIcon
                    name="i-ph-spinner-gap-bold"
                    size="16"
                    class="text-secondary-foreground animate-spin"
                />
                <span class="text-secondary-foreground ml-2 text-sm">
                    {{ props.loadingText }}
                </span>
            </div>
        </div>
    </div>
</template>
