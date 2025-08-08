import type { Ref } from "vue";

import { useDesignGuides } from "./useDesignGuides";
import { useDesignInteraction } from "./useDesignInteraction";
import { useDesignState } from "./useDesignState";

/**
 * 设计系统主 Hook
 * 整合核心、交互和辅助线功能，提供统一接口
 *
 * 注意：
 * 1. 返回的所有状态对象都是响应式的 (ref)，可以直接用于模板中的双向绑定
 * 2. guides 模块仅在 interaction 内部使用，不直接暴露给外部
 */
export function useDesignSystem(designRef: Ref<HTMLElement | null>) {
    const core = useDesignState();
    const guides = useDesignGuides();
    const interaction = useDesignInteraction(designRef, core, guides);

    return {
        // 核心状态 - 这些都是响应式对象，可以用于双向绑定
        components: core.components,
        highlightArea: core.highlightArea,
        guideLines: core.guideLines,
        hasCollision: core.hasCollision,
        isDragging: core.isDragging,
        draggingComponentId: core.draggingComponentId,
        activeComponentId: core.activeComponentId,

        // 交互方法
        handleDragOver: interaction.handleDragOver,
        handleDragLeave: interaction.handleDragLeave,
        handleDrop: interaction.handleDrop,
        handleComponentMouseDown: interaction.handleComponentMouseDown,
        handleResizeStart: interaction.handleResizeStart,
    };
}
