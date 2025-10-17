<!--
使用示例：

```vue
<template>
  <ProScrollArea class="w-full h-full min-h-0">
    <ProInfiniteScroll
      :loading="loading"
      :has-more="hasMore"
      :threshold="200"
      loading-text="加载中..."
      no-more-text="没有更多数据了"
      @load-more="loadMore"
    >
      <div v-for="(item, index) in list" :key="index" class="p-4 border-b">
        {{ item.content }}
      </div>
    </ProInfiniteScroll>
  </ProScrollArea>
</template>

<script setup>
const loading = ref(false)
const hasMore = ref(true)
const list = ref([...初始数据...])
const page = ref(1)

// 加载更多数据
async function loadMore() {
  if (loading.value) return

  loading.value = true
  try {
    const newData = await fetchData(page.value)
    if (newData.length === 0) {
      hasMore.value = false
    } else {
      list.value.push(...newData)
      page.value++
    }
  } catch (error) {
    console.error('加载数据失败', error)
  } finally {
    loading.value = false
  }
}
</script>
```
-->

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";

interface ProInfiniteScrollProps {
    /** 是否正在加载中 */
    loading?: boolean;
    /** 是否还有更多数据可加载 */
    hasMore?: boolean;
    /** 触发加载的距离，单位为像素 */
    threshold?: number;
    /** 加载中显示的文本 */
    loadingText?: string;
    /** 没有更多数据时显示的文本 */
    noMoreText?: string;
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
    loadingText: "loading...",
    noMoreText: "No more data",
});

const emits = defineEmits<ProInfiniteScrollEmits>();

/** 容器元素引用 */
const containerRef = ref<HTMLDivElement | null>(null);

/** 加载指示器元素引用 */
const loadingRef = ref<HTMLDivElement | null>(null);

/** IntersectionObserver 实例 */
let observer: IntersectionObserver | null = null;

/**
 * 创建并初始化 IntersectionObserver
 * 当加载指示器元素进入视口时触发加载更多
 */
function createObserver() {
    if (!window.IntersectionObserver || !loadingRef.value || !props.hasMore || props.loading)
        return;

    observer = new IntersectionObserver(
        (entries) => {
            if (entries[0]?.isIntersecting) emits("loadMore");
        },
        {
            root: null,
            // 检测底部距离
            rootMargin: `${props.threshold}px`,
            threshold: 0,
        },
    );

    observer.observe(loadingRef.value);
}
/**
 * 清理并重新创建观察者
 */
function resetObserver() {
    if (observer) {
        observer.disconnect();
        observer = null;
    }

    // 等待下一个微任务，确保 DOM 更新完成
    Promise.resolve().then(() => {
        createObserver();
    });
}

// 监听 loading 和 hasMore 的变化，在需要时重置观察者
watch(
    () => [props.loading, props.hasMore],
    () => {
        resetObserver();
    },
);

// 组件挂载时初始化观察者
onMounted(() => {
    createObserver();
});

// 组件卸载时清理观察者
onUnmounted(() => {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
});
</script>

<template>
    <div ref="containerRef" v-bind="$attrs" class="h-full w-full">
        <!-- 内容区域 -->
        <slot />

        <!-- 加载指示器 -->
        <div ref="loadingRef" class="flex h-8 w-full items-center justify-center">
            <!-- 加载中状态 -->
            <div
                v-if="props.loading && props.hasMore"
                class="flex items-center justify-center gap-1"
            >
                <UIcon
                    name="i-lucide-loader-circle"
                    size="16"
                    class="text-secondary-foreground animate-spin"
                />
                <span class="text-secondary-foreground text-sm">{{ props.loadingText }}</span>
            </div>
            <!-- 无更多数据状态 -->
            <div v-else-if="!props.hasMore" class="text-secondary-foreground text-sm">
                {{ props.noMoreText }}
            </div>
        </div>
    </div>
</template>
