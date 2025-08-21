import { computed, ref } from "vue";

import { useDesignStore } from "@/common/stores/design";

/**
 * 设计核心 Hook
 * 提供设计面板的核心状态管理和基础操作
 */
export function useDesignState() {
    const store = useDesignStore();

    // 核心状态
    const highlightArea = ref<HighlightArea | null>(null);
    const guideLines = ref<GuideLine[]>([]);
    const hasCollision = ref(false);
    const isDragging = ref(false);
    const isResizing = ref(false);
    const resizeDirection = ref<ResizeDirection | "">("");
    const resizeStartPosition = ref<Position | null>(null);
    const resizeStartSize = ref<Size | null>(null);
    const draggingComponentId = ref<string | null>(null);
    const dragStartOffset = ref<Position | null>(null);

    // 从 store 获取组件列表和活动组件
    const components = computed(() => store.components);
    const activeComponentId = computed(() => store.activeComponent?.id);

    /**
     * 设置高亮区域
     */
    function setHighlightArea(area: HighlightArea | null) {
        // 确保 area 是有效的对象或 null
        if (area !== null && typeof area === "object") {
            // 创建一个新对象，避免引用问题
            highlightArea.value = { ...area };
        } else {
            highlightArea.value = null;
        }
    }

    /**
     * 设置辅助线
     */
    function setGuideLines(lines: GuideLine[]) {
        guideLines.value = lines;
    }

    /**
     * 设置碰撞状态
     */
    function setCollision(collision: boolean) {
        hasCollision.value = collision;
    }

    /**
     * 设置拖拽状态
     */
    function setDragging(dragging: boolean, componentId: string | null = null) {
        isDragging.value = dragging;
        if (componentId !== null) {
            draggingComponentId.value = componentId;
        }
    }

    /**
     * 设置调整大小状态
     */
    function setResizing(
        resizing: boolean,
        direction: ResizeDirection | "" = "",
        componentId: string | null = null,
    ) {
        isResizing.value = resizing;
        resizeDirection.value = direction;
        if (componentId !== null) {
            draggingComponentId.value = componentId;
        }
    }

    /**
     * 设置调整大小的起始位置和大小
     */
    function setResizeStart(position: Position | null, size: Size | null) {
        resizeStartPosition.value = position;
        resizeStartSize.value = size;
    }

    /**
     * 设置拖拽起始偏移量
     */
    function setDragStartOffset(offset: Position | null) {
        dragStartOffset.value = offset ? { ...offset } : null;
    }

    /**
     * 清除所有临时状态
     */
    function clearState() {
        highlightArea.value = null;
        guideLines.value = [];
        hasCollision.value = false;
        isDragging.value = false;
        isResizing.value = false;
        draggingComponentId.value = null;
        dragStartOffset.value = null;
        resizeStartPosition.value = null;
        resizeStartSize.value = null;
        resizeDirection.value = "";
    }

    /**
     * 添加组件
     */
    function addComponent(component: Omit<ComponentConfig, "id">) {
        return store.addComponent(component);
    }

    /**
     * 更新组件位置
     */
    function updatePosition(componentId: string, position: Position) {
        store.updatePosition(componentId, position);
    }

    /**
     * 更新组件大小
     */
    function updateSize(componentId: string, size: Size) {
        store.updateSize(componentId, size);
    }

    /**
     * 设置活动组件
     */
    function setActiveComponent(id: string) {
        store.setActiveComponent(id);
    }

    return {
        // 状态
        components,
        highlightArea,
        guideLines,
        hasCollision,
        isDragging,
        isResizing,
        resizeDirection,
        resizeStartPosition,
        resizeStartSize,
        draggingComponentId,
        dragStartOffset,
        activeComponentId,

        // 状态设置方法
        setHighlightArea,
        setGuideLines,
        setCollision,
        setDragging,
        setResizing,
        setResizeStart,
        setDragStartOffset,
        clearState,

        // 组件操作方法
        addComponent,
        updatePosition,
        updateSize,
        setActiveComponent,
    };
}

// 导出返回类型，方便其他模块引用
export type DesignCoreType = ReturnType<typeof useDesignState>;
