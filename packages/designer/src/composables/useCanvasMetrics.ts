import type { CSSProperties } from "vue";
import { computed, getCurrentInstance, type Ref, ref, watch } from "vue";

import { useDesignStore } from "@/common/stores/design";

import { DESIGN_CONFIG } from "../config/design";

// 当前画布尺寸
const designWidth = ref<number>(DESIGN_CONFIG.value.DEFAULT_WIDTH);
const designHeight = ref<number>(DESIGN_CONFIG.value.DEFAULT_HEIGHT);

// 监听 DESIGN_CONFIG 的变化
watch(
    () => DESIGN_CONFIG.value,
    (newConfig) => {
        designWidth.value = newConfig.DEFAULT_WIDTH;
        designHeight.value = newConfig.DEFAULT_HEIGHT;
    },
    { immediate: true },
);

/**
 * 管理设计画布的尺寸计算和动态调整
 *
 * @remarks
 * 实现特性：
 * - 响应式容器尺寸跟踪
 * - 提供动态面板尺寸
 * - 支持 panzoom 缩放时的正确拖拽跟随
 * @param currentScale - panzoom 的当前缩放比例
 */
export function useCanvasMetrics(currentScale?: Ref<number>) {
    // 拖拽调整尺寸相关状态
    const isDraggingSize = ref<boolean>(false);
    const startPosition = ref<Position>({ x: 0, y: 0 });
    const startSize = ref<Size>({ width: designWidth.value, height: designHeight.value });

    /**
     * 处理开始拖拽调整尺寸
     * @param e 鼠标事件
     */
    function handleSizeDragStart(e: MouseEvent): void {
        isDraggingSize.value = true;
        startPosition.value = { x: e.clientX, y: e.clientY };
        startSize.value = { width: designWidth.value, height: designHeight.value };

        document.addEventListener("mousemove", handleSizeDragMove);
        document.addEventListener("mouseup", handleSizeDragEnd);
    }

    /**
     * 处理拖拽移动调整尺寸
     * @param e 鼠标事件
     */
    function handleSizeDragMove(e: MouseEvent): void {
        if (!isDraggingSize.value) return;

        // 获取当前缩放比例，如果没有传入则默认为 1
        const scale = currentScale?.value || 1;

        // 计算鼠标移动距离，并根据缩放比例调整
        const deltaY = (e.clientY - startPosition.value.y) / scale;

        // 获取所有组件的最大Y坐标（组件底部位置）
        const designStore = useDesignStore();
        const maxComponentBottom = designStore.components.reduce(
            (max: number, component: ComponentConfig) => {
                const componentBottom = component.position.y + component.size.height;
                return Math.max(max, componentBottom);
            },
            0,
        );

        // 计算最小允许高度：取默认最小高度和组件最大底部位置的较大值
        const minAllowedHeight = Math.max(DESIGN_CONFIG.value.DEFAULT_HEIGHT, maxComponentBottom);

        const newHeight = Math.max(
            minAllowedHeight,
            Math.min(DESIGN_CONFIG.value.MAX_HEIGHT, startSize.value.height + deltaY),
        );

        // 对高度取整，确保是整数值
        setDesignSize(startSize.value.width, Math.round(newHeight));
    }

    /**
     * 处理结束拖拽调整尺寸
     */
    function handleSizeDragEnd(): void {
        const designStore = useDesignStore();
        isDraggingSize.value = false;
        designStore.configs.pageHeight = designHeight.value;
        document.removeEventListener("mousemove", handleSizeDragMove);
        document.removeEventListener("mouseup", handleSizeDragEnd);
    }

    /**
     * 设置设计画布尺寸
     * @param width 宽度（像素）
     * @param height 高度（像素）
     */
    function setDesignSize(width: number, height: number): void {
        designWidth.value = width;
        designHeight.value = height;

        console.log(width, height);
    }

    /**
     * 改变画布尺寸
     */
    function changeDesignSize(): void {
        if (designHeight.value < DESIGN_CONFIG.value.DEFAULT_HEIGHT) {
            designHeight.value = DESIGN_CONFIG.value.DEFAULT_HEIGHT;
            const designStore = useDesignStore();
            designStore.configs.pageHeight = designHeight.value;
            return;
        }
    }

    /**
     * 重置设计画布尺寸为默认值
     */
    function resetDesignSize(): void {
        const designStore = useDesignStore();
        setDesignSize(DESIGN_CONFIG.value.DEFAULT_WIDTH, designStore.configs.pageHeight);
    }

    /**
     * 设计画布样式对象
     */
    const designStyle = computed<CSSProperties>(() => ({
        width: `${designWidth.value}px`,
        height: `${designHeight.value}px`,
    }));

    // 只在有活跃组件实例时注册 onUnmounted
    const instance = getCurrentInstance();
    if (instance) {
        // onUnmounted(resetDesignSize);
    }

    return {
        // 状态
        designWidth,
        designHeight,
        isDraggingSize,

        // 计算属性
        designStyle,

        // 方法
        setDesignSize,
        resetDesignSize,
        changeDesignSize,
        handleSizeDragStart,
    };
}
