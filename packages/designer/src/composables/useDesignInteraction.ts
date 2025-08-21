import type { Ref } from "vue";

import { useDesignStore } from "@/common/stores/design";
import type { DesignGuidesType } from "./useDesignGuides";
import type { DesignCoreType } from "./useDesignState";

interface InteractionState {
    animationFrameId: number | null;
    dragAnimationFrameId: number | null;
}

/**
 * 设计交互 Hook
 * 处理组件拖拽和调整大小的交互逻辑
 */
export function useDesignInteraction(
    designRef: Ref<HTMLElement | null>,
    core: DesignCoreType,
    guides: DesignGuidesType,
) {
    const gridStore = useDesignStore();
    const state: InteractionState = {
        animationFrameId: null,
        dragAnimationFrameId: null,
    };

    /**
     * 获取设计容器和缩放容器
     */
    function getContainers() {
        const design = designRef.value;
        if (!design) return null;

        // 优先从设计容器向上查找缩放容器
        let zoomContainer = design.closest(".zoom-content") as HTMLElement | null;
        // 兜底：如果未找到，尝试全局查询
        if (!zoomContainer) {
            zoomContainer = document.querySelector(".zoom-content") as HTMLElement | null;
        }
        // 再兜底：取父级作为缩放容器，按未缩放处理
        if (!zoomContainer) {
            return { design, zoomContainer: design.parentElement as HTMLElement } as const;
        }

        return { design, zoomContainer } as const;
    }

    /**
     * 获取鼠标在设计画布中的像素位置
     */
    function getDesignPosition(event: DragEvent | MouseEvent): Position {
        const containers = getContainers();
        if (!containers) return { x: 0, y: 0 };

        const { design, zoomContainer } = containers;

        // 获取缩放容器的变换信息
        const style = window.getComputedStyle(zoomContainer);
        const transformStr = style.transform;
        // 处理 transform 为 'none' 的情况
        const matrix =
            transformStr && transformStr !== "none" ? new DOMMatrix(transformStr) : new DOMMatrix();
        const scale = matrix.a || 1; // transform.a 是 x 轴缩放值

        // 计算鼠标相对于设计画布的实际位置
        const designRect = design.getBoundingClientRect();
        const rawX = (event.clientX - designRect.left) / scale;
        const rawY = (event.clientY - designRect.top) / scale;

        // 限制在设计区域范围内
        return {
            x: Math.max(0, Math.min(rawX, design.clientWidth)),
            y: Math.max(0, Math.min(rawY, design.clientHeight)),
        };
    }

    /**
     * 确保值为整数
     */
    function ensureInteger(value: number): number {
        return Math.round(value);
    }

    /**
     * 确保位置为整数
     */
    function ensureIntegerPosition(position: Position): Position {
        return {
            x: ensureInteger(position.x),
            y: ensureInteger(position.y),
        };
    }

    /**
     * 确保尺寸为整数
     */
    function ensureIntegerSize(size: Size): Size {
        return {
            width: Math.min(size.width, designRef.value?.clientWidth ?? Infinity),
            height: Math.min(size.height, designRef.value?.clientHeight ?? Infinity),
        };
    }

    /**
     * 取消待处理的动画帧
     */
    function cancelPendingFrames() {
        if (state.animationFrameId !== null) {
            cancelAnimationFrame(state.animationFrameId);
            state.animationFrameId = null;
        }
        if (state.dragAnimationFrameId !== null) {
            cancelAnimationFrame(state.dragAnimationFrameId);
            state.dragAnimationFrameId = null;
        }
    }

    /**
     * 处理拖拽经过
     */
    function handleDragOver(event: DragEvent) {
        event.preventDefault();
        cancelPendingFrames();

        state.animationFrameId = requestAnimationFrame(() => {
            const { draggedComponent } = gridStore;
            const design = designRef.value;
            if (!draggedComponent || !design) {
                core.clearState();
                return;
            }

            // 检查是否在设计区域内
            const rect = design.getBoundingClientRect();
            if (
                event.clientX < rect.left ||
                event.clientX > rect.right ||
                event.clientY < rect.top ||
                event.clientY > rect.bottom
            ) {
                core.clearState();
                return;
            }

            // 计算调整后的位置
            const position = getDesignPosition(event);
            const { size } = draggedComponent;
            const adjustedPosition = {
                x: Math.max(
                    0,
                    Math.min(position.x - size.width / 2, design.clientWidth - size.width),
                ),
                y: Math.max(
                    0,
                    Math.min(position.y - size.height / 2, design.clientHeight - size.height),
                ),
            };

            // 碰撞检测
            const hasCollision = guides.checkCollision(
                adjustedPosition,
                size,
                gridStore.components,
            );

            // 更新状态
            core.setHighlightArea({
                ...adjustedPosition,
                width: size.width,
                height: size.height,
            });
            core.setCollision(hasCollision);

            if (!hasCollision) {
                // 更新辅助线
                const guideLines: GuideLine[] = [
                    { type: "vertical", position: adjustedPosition.x },
                    { type: "vertical", position: adjustedPosition.x + size.width },
                    { type: "horizontal", position: adjustedPosition.y },
                    { type: "horizontal", position: adjustedPosition.y + size.height },
                ];
                core.setGuideLines(guideLines);
            }
        });
    }

    /**
     * 处理拖拽离开
     */
    function handleDragLeave() {
        cancelPendingFrames();
        core.clearState();
    }

    /**
     * 处理放置
     */
    function handleDrop(event: DragEvent) {
        cancelPendingFrames();

        const { draggedComponent } = gridStore;
        if (!draggedComponent || core.hasCollision.value) {
            core.clearState();
            return;
        }

        const position = getDesignPosition(event);
        const { type, title, size, props, isHidden } = draggedComponent;
        const design = designRef.value;

        // 计算初始位置
        let dropPosition = {
            x: position.x - size.width / 2,
            y: position.y - size.height / 2,
        };

        // 位置修正
        if (design) {
            dropPosition = guides.snapToGuideLines(dropPosition, size, core.guideLines.value);
            dropPosition = guides.ensureInBounds(
                dropPosition,
                size,
                design.clientWidth,
                design.clientHeight,
            );
        }

        // 添加新组件
        const newComponent = core.addComponent({
            type,
            title,
            position: dropPosition,
            isHidden,
            size,
            props,
        });

        // 设置新组件为激活状态
        if (newComponent) {
            core.setActiveComponent(newComponent.id);
        }

        // 清理状态
        core.clearState();
        gridStore.setDraggedComponent(null);
    }

    /**
     * 处理组件鼠标按下
     */
    function handleComponentMouseDown(component: ComponentConfig, event: MouseEvent) {
        if (event.button === 2) return; // 忽略右键点击

        core.setActiveComponent(component.id);
        core.setDragging(true, component.id);

        // 计算初始偏移
        const position = getDesignPosition(event);
        core.setDragStartOffset({
            x: position.x - component.position.x,
            y: position.y - component.position.y,
        });

        // 使用一次性事件监听器
        const mouseUpHandler = () => {
            document.removeEventListener("mousemove", mouseMoveHandler);
            document.removeEventListener("mouseup", mouseUpHandler);
            handleMouseUp();
        };

        const mouseMoveHandler = (e: MouseEvent) => handleMouseMove(e);

        document.addEventListener("mousemove", mouseMoveHandler);
        document.addEventListener("mouseup", mouseUpHandler);
    }

    /**
     * 根据调整方向计算新的位置和尺寸
     */
    function calculateNewPositionAndSize(
        direction: string,
        position: Position,
        size: Size,
        deltaX: number,
        deltaY: number,
    ) {
        // 将 delta 值转为整数
        deltaX = ensureInteger(deltaX);
        deltaY = ensureInteger(deltaY);

        const newPosition = { ...position };
        const newSize = { ...size };

        // 处理水平方向
        if (direction.includes("w")) {
            const newWidth = size.width - deltaX;
            if (newWidth >= 1) {
                newPosition.x = position.x + deltaX;
                newSize.width = newWidth;
            }
        } else if (direction.includes("e")) {
            const newWidth = size.width + deltaX;
            if (newWidth >= 1) {
                newSize.width = newWidth;
            }
        }

        // 处理垂直方向
        if (direction.includes("n")) {
            const newHeight = size.height - deltaY;
            if (newHeight >= 1) {
                newPosition.y = position.y + deltaY;
                newSize.height = newHeight;
            }
        } else if (direction.includes("s")) {
            const newHeight = size.height + deltaY;
            if (newHeight >= 1) {
                newSize.height = newHeight;
            }
        }

        // 确保所有值都是整数
        return {
            position: ensureIntegerPosition(newPosition),
            size: ensureIntegerSize(newSize),
        };
    }

    /**
     * 处理组件拖动
     */
    function handleDragging(component: ComponentConfig, position: Position) {
        if (!core.dragStartOffset.value) return;

        let newPosition = ensureIntegerPosition({
            x: ensureInteger(position.x - core.dragStartOffset.value.x),
            y: ensureInteger(position.y - core.dragStartOffset.value.y),
        });

        const design = designRef.value;
        if (design) {
            newPosition = ensureIntegerPosition(
                guides.ensureInBounds(
                    newPosition,
                    component.size,
                    design.clientWidth,
                    design.clientHeight,
                ),
            );
        }

        // 辅助线处理
        const guideLines = guides.calculateGuideLines(
            newPosition,
            component.size,
            gridStore.components,
            component.id,
            design?.clientWidth || 800,
            design?.clientHeight || 600,
        );

        if (guideLines.length > 0) {
            newPosition = ensureIntegerPosition(
                guides.snapToGuideLines(newPosition, component.size, guideLines),
            );
        }

        // 碰撞检测
        const hasCollision = guides.checkCollision(
            newPosition,
            component.size,
            gridStore.components,
            component.id,
        );

        core.setHighlightArea({
            ...newPosition,
            width: component.size.width,
            height: component.size.height,
        });
        core.setCollision(hasCollision);

        if (!hasCollision) {
            core.setGuideLines(guideLines);
            gridStore.updatePosition(component.id, newPosition);
        }
    }

    /**
     * 处理开始调整大小
     */
    function handleResizeStart(component: ComponentConfig, direction: string, event: MouseEvent) {
        event.stopPropagation();

        // 设置当前活动组件和调整大小状态
        core.setActiveComponent(component.id);
        core.setResizing(true, direction, component.id);

        // 记录初始位置和大小
        core.setResizeStart({ ...component.position }, { ...component.size });

        // 记录鼠标初始位置
        const mousePosition = getDesignPosition(event);
        core.setDragStartOffset(mousePosition);

        // 使用一次性事件监听器
        const mouseUpHandler = () => {
            document.removeEventListener("mousemove", mouseMoveHandler);
            document.removeEventListener("mouseup", mouseUpHandler);
            handleMouseUp();
        };

        const mouseMoveHandler = (e: MouseEvent) => handleMouseMove(e);

        document.addEventListener("mousemove", mouseMoveHandler);
        document.addEventListener("mouseup", mouseUpHandler);
    }

    /**
     * 处理鼠标移动
     */
    function handleMouseMove(event: MouseEvent) {
        if (!core.isDragging.value && !core.isResizing.value) return;

        state.dragAnimationFrameId = requestAnimationFrame(() => {
            const component = gridStore.components.find(
                (c) => c.id === core.draggingComponentId.value,
            );
            if (!component) return;

            const position = getDesignPosition(event);

            if (core.isDragging.value) {
                handleDragging(component, position);
            } else if (core.isResizing.value) {
                handleResizing(component, position);
            }
        });
    }

    /**
     * 处理组件调整大小
     */
    function handleResizing(component: ComponentConfig, position: Position) {
        if (
            !core.resizeStartPosition.value ||
            !core.resizeStartSize.value ||
            !core.resizeDirection.value ||
            !core.dragStartOffset.value
        ) {
            return;
        }

        const deltaX = position.x - core.dragStartOffset.value.x;
        const deltaY = position.y - core.dragStartOffset.value.y;

        // 计算新尺寸和位置
        const result = calculateNewPositionAndSize(
            core.resizeDirection.value,
            core.resizeStartPosition.value,
            core.resizeStartSize.value,
            deltaX,
            deltaY,
        );

        let newPosition = result.position;
        const newSize = result.size;

        // 拖动大小时限制大小不能超过设计面板
        const design = designRef.value;
        if (design) {
            newPosition = ensureIntegerPosition(
                guides.ensureInBounds(
                    newPosition,
                    newSize,
                    design.clientWidth,
                    design.clientHeight,
                ),
            );
        }

        // 辅助线处理
        const guideLines = guides.calculateGuideLines(
            newPosition,
            newSize,
            gridStore.components,
            component.id,
            design?.clientWidth || 800,
            design?.clientHeight || 600,
        );

        if (guideLines.length > 0) {
            newPosition = ensureIntegerPosition(
                guides.snapToGuideLines(newPosition, newSize, guideLines),
            );
        }

        // 碰撞检测
        const hasCollision = guides.checkCollision(
            newPosition,
            newSize,
            gridStore.components,
            component.id,
        );

        // 更新高亮区域
        core.setHighlightArea({
            ...newPosition,
            width: newSize.width,
            height: newSize.height,
        });

        core.setCollision(hasCollision);

        if (!hasCollision) {
            core.setGuideLines(guideLines);
            gridStore.updatePosition(component.id, newPosition);
            gridStore.updateSize(component.id, newSize);
        }
    }

    /**
     * 处理鼠标松开
     */
    function handleMouseUp() {
        cancelPendingFrames();
        core.clearState();
    }

    return {
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleComponentMouseDown,
        handleResizeStart,
    };
}
