/**
 * 路由路径常量
 * @description 定义应用中使用的路由路径常量
 */

export const ROUTES = {
    /** 首页路径 */
    HOME: "/",
    /** 登录路径 */
    LOGIN: "/login",
    /** 后台路径 */
    CONSOLE: "/console",
} as const;

/**
 * 菜单权限类型
 * @description 用于标识权限类型：目录、菜单、按钮
 */
export const MENU_TYPE = {
    /** 目录 */
    DIRECTORY: 1,
    /** 菜单 */
    MENU: 2,
    /** 按钮 */
    BUTTON: 3,
} as const;

export type MenuType = (typeof MENU_TYPE)[keyof typeof MENU_TYPE];
