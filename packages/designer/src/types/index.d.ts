/**
 * 设计组件类型定义
 */

/** 辅助线类型 */
type GuideLineType = "vertical" | "horizontal";

/** 调整大小的方向 */
type ResizeDirection = "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se";

/** 位置信息 */
interface Position {
    /** X坐标（像素） */
    x: number;
    /** Y坐标（像素） */
    y: number;
}

/** 尺寸信息 */
interface Size {
    /** 宽度（像素） */
    width: number;
    /** 高度（像素） */
    height: number;
    /** 宽度适配模式: percent（百分比）或 fixed（固定像素） */
    widthMode?: "percent" | "fixed";
    /** 高度适配模式: percent（百分比）或 fixed（固定像素） */
    heightMode?: "percent" | "fixed";
}

/** 高亮区域 */
interface HighlightArea extends Position, Size {}

/** 辅助线信息 */
interface GuideLine {
    /** 辅助线类型 */
    type: GuideLineType;
    /** 位置（像素） */
    position: number;
    /** 长度（像素） */
    length?: number;
}

/** 组件基础配置 */
interface ComponentConfig {
    /** 组件唯一标识 */
    id: string;
    /** 组件类型 */
    type: string;
    /** 组件名称 */
    title: string;
    /** 组件位置 */
    position: Position;
    /** 组件尺寸 */
    size: Size;
    /** 组件属性 */
    props: Record<string, unknown>;
    /** 组件是否隐藏 */
    isHidden?: boolean;
    /** 图层层级（z-index） */
    zIndex?: number;
}

/** 装修终端创建 网页 / 手机端 */
type DecorateScene = "web" | "mobile";

/** 设计画布配置 */
interface DesignConfig {
    /** 画布宽度（像素） */
    width: number;
    /** 画布高度（像素） */
    height: number;
    /** 设备类型 */
    deviceType?: DecorateScene;
}

/** 页面配置 */
interface PageMateConfig {
    /** 背景颜色 */
    backgroundColor: string;
    /** 暗色模式背景颜色 */
    backgroundDarkColor: string;
    /** 背景图片 */
    backgroundImage: string;
    /** 背景类型 */
    backgroundType: "solid" | "image";
    /** 页面高度 */
    pageHeight: number;
}

/**
 * 组件分类信息
 */
interface ComponentCategory {
    id: string;
    title: string;
}

/** 组件菜单项 */
interface ComponentMenuItem<T = Record<string, unknown>> {
    /** 组件唯一标识 */
    id: string;
    /** 组件类型 */
    type: string;
    /** 组件标题 */
    title: string;
    /** 组件图标 */
    icon: string;
    /** 组件是否隐藏 */
    isHidden?: boolean;
    /** 组件分类 */
    category: ComponentCategory;
    /** 默认尺寸 */
    size: Size;
    /** 默认属性 */
    props: T;
    /** 排序权重，数字越小排序越靠前 */
    order?: number;
}

/** 拖拽数据 */
interface DragData {
    /** 组件类型 */
    type: string;
    /** 其他数据 */
    [key: string]: unknown;
}

// 组件拖拽状态
interface DragState {
    isDragging: boolean;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
}

// 调整大小状态
interface ResizeState {
    isResizing: boolean;
    direction: string;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startLeft: number;
    startTop: number;
}

// 碰撞检测结果
interface CollisionResult {
    hasCollision: boolean;
    collidingIds: string[];
}
