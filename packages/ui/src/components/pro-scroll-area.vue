<script setup lang="ts">
import {
    ScrollAreaCorner,
    ScrollAreaRoot,
    ScrollAreaScrollbar,
    ScrollAreaThumb,
    ScrollAreaViewport,
} from "reka-ui";
import { onMounted, useTemplateRef } from "vue";

/**
 * 组件属性接口
 */
interface ProScrollAreaProps {
    /**
     * 滚动条显示类型
     * @property {'auto'} auto - 当相应方向上的内容溢出时，滚动条可见
     * @property {'always'} always - 无论内容是否溢出，滚动条始终可见
     * @property {'scroll'} scroll - 当用户沿其相应的方向滚动时，滚动条可见
     * @property {'hover'} hover - 当用户沿其相应的方向滚动时以及当用户将鼠标悬停在上方时，滚动条可见
     */
    type?: "scroll" | "always" | "auto" | "hover";
    /** 滚动条隐藏延迟（毫秒） */
    scrollHideDelay?: number;
    /**
     * 滚动条颜色变体
     * @property {'default'} default - 滚动条颜色--默认
     * @property {'primary'} primary - 滚动条颜色--主题
     */
    variant?: "default" | "primary";
    /** 是否显示水平滚动条 */
    horizontal?: boolean;
    /** 是否显示垂直滚动条 */
    vertical?: boolean;
    /** 是否显示滚动阴影 */
    shadow?: boolean;
}

interface ProScrollAreaEmits {
    (e: "scroll", event: Event): void;
    (e: "in-view", event: void): void;
}

interface ProScrollAreaSlots {
    default: (props: Record<string, never>) => any;
}

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<ProScrollAreaProps>(), {
    type: "hover",
    scrollHideDelay: 0,
    scrollbarSize: 10,
    variant: "default",
    horizontal: false,
    vertical: true,
    shadow: true,
});

const emits = defineEmits<ProScrollAreaEmits>();

defineSlots<ProScrollAreaSlots>();

const state = reactive({
    top: true,
    bottom: false,
});
const rootRef = useTemplateRef("rootRef");
const viewportRef = useTemplateRef("viewportRef");

/** 滚动条背景样式 */
const scrollbarClass = computed(() => {
    return "flex select-none touch-none p-0.5 z-10 transition-colors duration-[160ms] ease-out scrollbar";
});

/** 滚动条位置按钮样式 */
const thumbClass = computed(() => {
    return "flex-1 !w-[4px] rounded-full relative thumb bg-red before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]";
});

/** 计算滚动阴影数据属性 */
const shadowAttrs = computed(() => {
    if (!props.shadow) {
        return { "data-shadow": "false" };
    }
    const { top, bottom } = state;
    return {
        "data-shadow": "true",
        "data-shadow-top": String(!top),
        "data-shadow-bottom": String(!bottom),
    };
});

const debouncedScroll = useDebounceFn(async (event: Event) => {
    const target = event.target as HTMLElement;
    const { scrollTop, scrollHeight, clientHeight } = target;

    // 判断是否到顶部
    const isAtTop = scrollTop === 0;
    // 判断是否到底部（scrollTop + clientHeight == scrollHeight）
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1; // 减去 1 避免浮点数误差

    state.top = !isAtBottom;
    state.bottom = !isAtTop;
}, 50);

/**
 * 处理滚动事件，获取当前滚动位置
 * @param {Event} event - 触发的滚动事件
 */
function handleScroll(event: Event) {
    props.shadow && debouncedScroll(event);
    emits("scroll", event);
}

/**
 * 绝对滚动到指定位置
 * 使用原生 `scrollTo` 方法
 * @param {ScrollToOptions} [options] - 滚动选项，默认滚动到顶部
 */
function scrollTo(options: ScrollToOptions = { top: 0 }) {
    if (viewportRef.value?.$el) {
        const viewport = viewportRef.value.viewportElement as HTMLElement;
        viewport.scrollTo(options);
    }
}

/**
 * 相对滚动
 * 使用原生 `scrollBy` 方法
 *
 * @param {ScrollToOptions} options - 滚动选项，相对于当前滚动位置
 */
function scrollBy(options: ScrollToOptions) {
    if (viewportRef.value?.$el) {
        const viewport = viewportRef.value.viewportElement as HTMLElement;
        viewport.scrollBy(options);
    }
}

/**
 * 滚动到顶部
 * 使用 reka-ui 提供的 scrollTop 方法
 */
function scrollToTop() {
    if (rootRef.value) {
        rootRef.value.scrollTop();
    }
}

/**
 * 滚动到底部
 * 使用原生找到元素进行滚动到底部
 */
function scrollToBottom(animation: boolean = false) {
    if (viewportRef.value?.$el) {
        const viewport = viewportRef.value.viewportElement as HTMLElement;
        const scrollHeight = viewport.scrollHeight;
        const clientHeight = viewport.clientHeight;

        // 使用scrollTo而不是scrollBy，并设置behavior为'auto'以避免触发额外的滚动事件
        viewport.scrollTo({
            top: scrollHeight - clientHeight,
            behavior: animation ? "smooth" : "auto",
        });
    }
}

/**
 * 滚动到左侧
 * 使用 reka-ui 提供的 scrollTopLeft 方法
 */
function scrollToLeft() {
    if (rootRef.value) {
        rootRef.value.scrollTopLeft();
    }
}

/**
 * 获取视口元素
 * @returns 视口DOM元素
 */
function getViewportElement() {
    return viewportRef.value;
}

/**
 * 获取滚动区域元素
 * @returns 滚动区域DOM元素
 */
function getScrollAreaElement() {
    return rootRef.value;
}

onMounted(() => emits("in-view"));

defineExpose({
    scrollTo,
    scrollBy,
    scrollToTop,
    scrollToBottom,
    scrollToLeft,
    getViewportElement,
    getScrollAreaElement,
});
</script>

<template>
    <ScrollAreaRoot
        ref="rootRef"
        :type="props.type"
        :scroll-hide-delay="props.scrollHideDelay"
        class="pro-scroll-area relative overflow-hidden"
        v-bind="{ ...$attrs, ...shadowAttrs }"
        style="--scrollbar-size: 10px"
        :data-variant="props.variant"
    >
        <ScrollAreaViewport
            ref="viewportRef"
            class="scrollbar-hide h-full w-full overflow-auto rounded outline-none"
            @scroll="handleScroll"
        >
            <slot />
        </ScrollAreaViewport>

        <ScrollAreaScrollbar v-if="props.vertical" orientation="vertical" :class="scrollbarClass">
            <ScrollAreaThumb :class="thumbClass" />
        </ScrollAreaScrollbar>

        <ScrollAreaScrollbar
            v-if="props.horizontal"
            orientation="horizontal"
            :class="scrollbarClass"
        >
            <ScrollAreaThumb :class="thumbClass" />
        </ScrollAreaScrollbar>

        <ScrollAreaCorner
            v-if="props.horizontal && props.vertical"
            class="bg-gray-100 dark:bg-gray-800"
        />
    </ScrollAreaRoot>
</template>

<style scoped>
/* 定义 CSS 变量 */
.pro-scroll-area {
    --scrollbar-bg: var(--scrollbar-bg-default);
    --scrollbar-hover-bg: var(--scrollbar-hover-bg-default);
    --thumb-bg: var(--thumb-bg-default);
    --thumb-hover-bg: var(--thumb-hover-bg-default);
}

/* 滚动阴影效果 */
.pro-scroll-area[data-shadow="true"] {
    mask-image: linear-gradient(
        to bottom,
        transparent 0,
        #000 40px,
        #000 calc(100% - 40px),
        transparent 100%
    );
}

/* 根据滚动位置的阴影效果 */
.pro-scroll-area[data-shadow-bottom="true"] {
    mask-image: linear-gradient(to bottom, #000 0, #000 calc(100% - 40px), transparent 100%);
}

.pro-scroll-area[data-shadow-top="true"] {
    mask-image: linear-gradient(to bottom, transparent 0, #000 40px, #000 100%);
}

/* 默认变体 */
.pro-scroll-area[data-variant="default"] {
    /* --scrollbar-bg: rgba(0, 0, 0, 0.05); */
    --scrollbar-hover-bg: rgba(0, 0, 0, 0);
    --thumb-bg: rgba(0, 0, 0, 0.05);
    --thumb-hover-bg: rgba(0, 0, 0, 0.1);
}

.dark {
    .pro-scroll-area[data-variant="default"] {
        /* --scrollbar-bg: rgba(0, 0, 0, 0.05); */
        --scrollbar-hover-bg: rgba(0, 0, 0, 0);
        --thumb-bg: rgba(255, 255, 255, 0.05);
        --thumb-hover-bg: rgba(255, 255, 255, 0.15);
    }
}

/* primary 变体 */
.pro-scroll-area[data-variant="primary"] {
    /* --scrollbar-bg: rgba(59, 130, 246, 0.1); */
    --scrollbar-hover-bg: rgba(59, 130, 246, 0.2);
    --thumb-bg: rgba(59, 130, 246, 0.4);
    --thumb-hover-bg: rgba(59, 130, 246, 0.5);
}

/* 滚动条样式 */
.scrollbar {
    background-color: var(--scrollbar-bg);
}

.scrollbar:hover {
    background-color: var(--scrollbar-hover-bg);
}

.thumb {
    background-color: var(--thumb-bg);
}

.thumb:hover {
    background-color: var(--thumb-hover-bg);
}

/* .pro-scroll-area :deep(.scrollbar-hide) {
    scrollbar-width: thin;
} */

/* 隐藏默认滚动条 */
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}

.scrollbar-hide {
    /* IE 和 Edge */
    -ms-overflow-style: none;
    /* Firefox */
    scrollbar-width: thin;
}
</style>
