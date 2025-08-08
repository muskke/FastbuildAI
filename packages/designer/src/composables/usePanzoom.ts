import panzoom from "panzoom";
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";

export type InteractionMode = "mouse" | "touchpad";

interface UsePanzoomOptions {
    maxZoom?: number;
    minZoom?: number;
    zoomSpeed?: number;
    modelValue: InteractionMode;
    onUpdateMode?: (mode: InteractionMode) => void;
}

interface UsePanzoomReturn {
    contentRef: ReturnType<typeof ref<HTMLElement | null>>;
    containerRef: ReturnType<typeof ref<HTMLElement | null>>;
    currentScale: ReturnType<typeof ref<number>>;
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
    focusContent: () => void;
    updateInteractionMode: (mode: InteractionMode) => void;
}

/**
 * 提供画布缩放和平移功能的 Hook
 * @param options - 配置选项
 * @returns - 返回缩放和平移相关的状态和方法
 */
export function usePanzoom(options: UsePanzoomOptions): UsePanzoomReturn {
    const { maxZoom = 2, minZoom = 0.2, modelValue = "mouse", onUpdateMode } = options;

    const contentRef = ref<HTMLElement | null>(null);
    const containerRef = ref<HTMLElement | null>(null);
    let panzoomInstance: ReturnType<typeof panzoom> | null = null;

    const currentScale = ref(1);
    const isSpacePressed = ref(false);
    const currentMode = ref(modelValue);

    /**
     * 初始化缩放以适应容器
     */
    function initializeZoom() {
        if (!containerRef.value || !contentRef.value || !panzoomInstance) return;

        const containerRect = containerRef.value.getBoundingClientRect();
        const contentRect = contentRef.value.getBoundingClientRect();

        // 计算水平和垂直方向的缩放比例
        // 水平方向预留 40px 的边距（两边各 20px）
        // 垂直方向预留 40px 的边距（上下各 20px）
        const scaleX = (containerRect.width - 40) / contentRect.width;
        const scaleY = (containerRect.height - 40) / contentRect.height;

        // 选择较小的缩放比例，确保内容完全可见
        const scale = Math.min(scaleX, scaleY);

        // 确保缩放比例在允许的范围内
        const finalScale =
            contentRect.width === 375 ? 1.2 : Math.min(Math.max(scale, minZoom), maxZoom);

        // 计算居中位置
        const centerX = (containerRect.width - contentRect.width * finalScale) / 2;
        const centerY = (containerRect.height - contentRect.height * finalScale) / 2;

        panzoomInstance.zoomAbs(0, 0, finalScale);
        panzoomInstance.moveTo(centerX, centerY);
        currentScale.value = finalScale;
    }

    /**
     * 创建 panzoom 实例
     */
    function createPanzoomInstance() {
        if (!contentRef.value) return null;

        const instance = panzoom(contentRef.value, {
            maxZoom,
            minZoom,
            // 是否限制平移范围。true 表示启用边界限制，false 表示禁用，Bounds 类型则允许你自定义边界的具体值。
            bounds: true,
            smoothScroll: true,
            // 在鼠标模式下直接可以拖动
            beforeMouseDown: () => {
                // 返回 true 会阻止拖动
                // 返回 false 会允许拖动
                if (currentMode.value === "touchpad") {
                    return !isSpacePressed.value; // 没按空格时阻止拖动
                }
                return false; // 鼠标模式下允许拖动
            },
            // 在触控板模式下：
            // - 不按 Ctrl/Cmd 时用滚轮平移
            // - 按住 Ctrl/Cmd 时用滚轮缩放
            // 在鼠标模式下直接用滚轮缩放
            beforeWheel: (e: any) => {
                if (currentMode.value === "touchpad") {
                    e.preventDefault();
                    // 按住 Ctrl/Cmd 时缩放
                    if (e.metaKey || e.ctrlKey) {
                        return false;
                    }
                    // 否则平移
                    if (instance) {
                        // deltaMode === 0 表示像素，1 表示行，2 表示页
                        const multiplier = e.deltaMode === 1 ? 20 : e.deltaMode === 2 ? 100 : 1;
                        instance.moveBy(-e.deltaX * multiplier, -e.deltaY * multiplier, false);
                    }
                    return true;
                }
                // 鼠标模式下缩放
                return false;
            },
        });

        // 绑定缩放事件
        instance.on("zoom", (e: any) => {
            currentScale.value = e.getTransform().scale;
        });

        return instance;
    }

    /**
     * 放大画布
     */
    function zoomIn() {
        if (!panzoomInstance) return;

        const transform = panzoomInstance.getTransform();
        const newScale = transform.scale * 1.2;

        // 确保不超过最大缩放
        if (newScale > maxZoom) return;

        // 获取当前视口中心点
        const containerRect = containerRef.value?.getBoundingClientRect();
        if (!containerRect) return;

        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;

        panzoomInstance.smoothZoom(centerX, centerY, 1.2);
    }

    /**
     * 缩小画布
     */
    function zoomOut() {
        if (!panzoomInstance) return;

        const transform = panzoomInstance.getTransform();
        const newScale = transform.scale * 0.8;

        // 确保不低于最小缩放
        if (newScale < minZoom) return;

        // 获取当前视口中心点
        const containerRect = containerRef.value?.getBoundingClientRect();
        if (!containerRect) return;

        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;

        panzoomInstance.smoothZoom(centerX, centerY, 0.8);
    }

    /**
     * 重置画布缩放
     */
    function resetZoom() {
        if (!panzoomInstance) return;

        initializeZoom();
    }

    /**
     * 聚焦当前页面内容 - 显示完整画布
     */
    function focusContent() {
        if (!panzoomInstance || !containerRef.value || !contentRef.value) return;

        // 获取容器尺寸
        const containerRect = containerRef.value.getBoundingClientRect();

        // 获取内容的原始尺寸（使用scrollWidth/Height，不受当前变换影响）
        const contentElement = contentRef.value;
        const contentWidth = Math.max(contentElement.scrollWidth, contentElement.offsetWidth, 375); // 最小375px
        const contentHeight = Math.max(
            contentElement.scrollHeight,
            contentElement.offsetHeight,
            600,
        ); // 最小600px

        // 计算适合显示的缩放比例，预留40px边距
        const scaleX = (containerRect.width - 40) / contentWidth;
        const scaleY = (containerRect.height - 40) / contentHeight;
        const targetScale = Math.min(scaleX, scaleY);

        // 确保缩放比例在允许范围内
        const finalScale = Math.min(Math.max(targetScale, minZoom), maxZoom);

        // 计算居中位置
        const centerX = (containerRect.width - contentWidth * finalScale) / 2;
        const centerY = (containerRect.height - contentHeight * finalScale) / 2;

        // 直接使用平滑缩放和移动，不再分步骤
        const containerCenterX = containerRect.width / 2;
        const containerCenterY = containerRect.height / 2;

        // 先平滑缩放到目标比例
        panzoomInstance.smoothZoomAbs(containerCenterX, containerCenterY, finalScale);

        // 延迟后平滑移动到居中位置
        setTimeout(() => {
            if (panzoomInstance) {
                panzoomInstance.smoothMoveTo(centerX, centerY);
            }
        }, 250);
    }

    /**
     * 更新交互模式，并重建 panzoom 实例
     */
    function updateInteractionMode(mode: InteractionMode) {
        // 更新模式
        currentMode.value = mode;
        onUpdateMode?.(mode);

        // 如果实例不存在，不需要重建
        if (!contentRef.value) return;

        recreatePanzoomInstance();
    }

    /**
     * 重新创建 panzoom 实例，保持当前的变换状态
     */
    function recreatePanzoomInstance() {
        // 保存当前状态
        const transform = panzoomInstance?.getTransform();

        // 销毁旧实例
        panzoomInstance?.dispose();

        // 创建新实例
        panzoomInstance = createPanzoomInstance();

        // 如果有之前的状态，恢复它
        if (transform && panzoomInstance) {
            panzoomInstance.moveTo(transform.x, transform.y);
            panzoomInstance.zoomAbs(transform.x, transform.y, transform.scale);
        }
    }

    // 监听交互模式变化
    watch(
        () => modelValue,
        (newMode) => {
            if (newMode !== currentMode.value) {
                updateInteractionMode(newMode);
            }
        },
        { immediate: true },
    );

    // 键盘事件处理
    function handleKeyDown(e: KeyboardEvent) {
        if (e.code === "Space" && !isSpacePressed.value) {
            isSpacePressed.value = true;
            e.preventDefault();
        }
    }

    function handleKeyUp(e: KeyboardEvent) {
        if (e.code === "Space" && isSpacePressed.value) {
            isSpacePressed.value = false;
        }
    }

    onMounted(() => {
        if (!contentRef.value) return;

        // 创建 panzoom 实例
        panzoomInstance = createPanzoomInstance();

        // 等待内容渲染完成后初始化缩放
        const observer = new ResizeObserver(() => {
            if (contentRef.value && containerRef.value) {
                observer.disconnect();
                nextTick(() => {
                    initializeZoom();
                });
            }
        });

        observer.observe(contentRef.value);

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
    });

    onUnmounted(() => {
        panzoomInstance?.dispose();
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
    });

    return {
        contentRef,
        containerRef,
        currentScale,
        zoomIn,
        zoomOut,
        resetZoom,
        focusContent,
        updateInteractionMode,
    };
}
