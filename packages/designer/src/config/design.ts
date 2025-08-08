import { ref } from "vue";

import { importComponentConfigs } from "../utils/components-dynamic";

/**
 * 设计画布配置接口
 */
export interface DesignConfigInterface {
    /** 默认画布宽度（像素） */
    DEFAULT_WIDTH: number;
    /** 默认画布高度（像素） */
    DEFAULT_HEIGHT: number;
    /** 最大画布高度（像素） */
    MAX_HEIGHT: number;
    /** 画布内边距（像素） */
    PADDING: number;
    /** 辅助线吸附阈值（像素） */
    SNAP_THRESHOLD: number;
    /** 安全区域宽度（像素） */
    SAFE_AREA_WIDTH: number;
}

/**
 * PC端设计画布配置常量
 */
export const PC_DESIGN_CONFIG: DesignConfigInterface = {
    /** 默认画布宽度（像素） */
    DEFAULT_WIDTH: 1920,
    /** 默认画布高度（像素） */
    DEFAULT_HEIGHT: 1080,
    /** 最大画布高度（像素） */
    MAX_HEIGHT: 30000,
    /** 画布内边距（像素） */
    PADDING: 40,
    /** 辅助线吸附阈值（像素） */
    SNAP_THRESHOLD: 5,
    /** 安全区域宽度（像素） */
    SAFE_AREA_WIDTH: 1200,
} as const;

/**
 * 移动端设计画布配置常量
 */
export const MOBILE_DESIGN_CONFIG: DesignConfigInterface = {
    /** 默认画布宽度（像素） */
    DEFAULT_WIDTH: 375,
    /** 默认画布高度（像素） */
    DEFAULT_HEIGHT: 667,
    /** 最大画布高度（像素） */
    MAX_HEIGHT: 10000,
    /** 画布内边距（像素） */
    PADDING: 16,
    /** 辅助线吸附阈值（像素） */
    SNAP_THRESHOLD: 3,
    /** 安全区域宽度（像素） */
    SAFE_AREA_WIDTH: 343,
} as const;

/** 设计画布配置 */
export const DESIGN_CONFIG = ref<DesignConfigInterface>(PC_DESIGN_CONFIG);
/** 当前选择设备类型 */
export const DEFAULT_DEVICE_TYPE = ref<DecorateScene>("web");

/**
 * 获取设计配置
 * @param deviceType 设备类型
 * @param scene 场景类型，用于加载特定组件
 */
export function setDesignConfig(deviceType: DecorateScene) {
    importComponentConfigs(deviceType as DecorateScene);
    DEFAULT_DEVICE_TYPE.value = deviceType;
    DESIGN_CONFIG.value = deviceType === "web" ? PC_DESIGN_CONFIG : MOBILE_DESIGN_CONFIG;
}
