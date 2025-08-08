// ==================== 类型定义 ====================

import type { MenuFormData } from "@/models/menu";
import type { UserInfo } from "@/models/user";

/**
 * 后台用户信息响应接口
 */
interface ConsoleUserInfo {
    /** 用户菜单权限 */
    menus?: MenuFormData[];
    /** 用户权限列表 */
    permissions?: string[];
    /** 用户基本信息 */
    user?: UserInfo;
}

// ==================== 用户信息相关 API ====================

/**
 * 获取所有用户信息
 * @description 获取当前登录用户的完整信息，包括基本信息、菜单权限和权限列表
 * @returns {Promise<ConsoleUserInfo>} 用户信息数据
 */
export function apiGetUserInfo(): Promise<ConsoleUserInfo> {
    return useConsoleGet<ConsoleUserInfo>("/users/info");
}
