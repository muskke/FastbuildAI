/**
 * @fastbuildai/designer 包的主入口文件
 * 导出设计器的核心功能模块
 */

// 导出 stores
export { useDesignStore } from "./stores/design";

// 导出 composables
export { useCanvasMetrics } from "./composables/useCanvasMetrics";
export { useDesignGuides } from "./composables/useDesignGuides";
export { useDesignInteraction } from "./composables/useDesignInteraction";
export { useDesignState } from "./composables/useDesignState";
export { useDesignSystem } from "./composables/useDesignSystem";
export { usePanzoom } from "./composables/usePanzoom";

// 导出组件
// export { DesignerSkeleton } from "./components/designer-skeleton.vue";
// export { WebDesigner } from "./components/web-designer.vue";
// export { WebPreview } from "./components/web-preview.vue";
export const WebDesigner = defineAsyncComponent(() => import("./components/web-designer.vue"));
export const WebPreview = defineAsyncComponent(() => import("./components/web-preview.vue"));

// 导出工具函数
export * from "./utils/components-dynamic";
export * from "./utils/register-components";
