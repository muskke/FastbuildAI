import type {
    LoginResponse,
    SystemLoginAccountParams,
    SystemRegisrerAccountParams,
    UpdateUserFieldRequest,
    UpdateUserFieldResponse,
    UserInfo,
    WechatLoginCode,
    WechatLoginTicket,
} from "@/models/user.d.ts";

// ==================== 用户信息相关 API ====================

/**
 * 获取当前用户信息
 * @returns 用户信息
 */
export function apiGetCurrentUserInfo(): Promise<UserInfo> {
    return useWebGet("/user/info", {}, { requireAuth: true });
}

/**
 * 搜索用户列表
 * @param params 搜索参数
 * @returns 用户列表
 */
export function apiSearchUsers(params?: {
    /** 搜索关键词 */
    keyword?: string;
    /** 返回数量限制 */
    limit?: number;
}): Promise<UserInfo[]> {
    return useWebGet("/user/search", params, { requireAuth: true });
}

/**
 * 更新用户信息字段
 * @param params 更新参数
 * @returns 更新结果
 */
export function apiUpdateUserField(
    params: UpdateUserFieldRequest,
): Promise<UpdateUserFieldResponse> {
    return useWebPatch("/user/update-field", params);
}

/**
 * 修改用户信息字段（向后兼容）
 * @param params 字段参数
 * @returns 更新结果
 * @deprecated 请使用 apiUpdateUserField 替代
 */
export function apiPostUserInfoField(params: {
    field: string;
    value: string;
}): Promise<UpdateUserFieldResponse> {
    return apiUpdateUserField({
        field: params.field as UpdateUserFieldRequest["field"],
        value: params.value,
    });
}

// ==================== 微信登录相关 API ====================

/**
 * 获取微信登录二维码
 * @returns 二维码信息
 */
export function apiGetWxCode(): Promise<WechatLoginCode> {
    return useWebGet("/auth/wechat-qrcode");
}

/**
 * 检测微信登录票据是否有效
 * @param params 票据参数
 * @returns 票据状态
 */
export function apiCheckTicket(params?: { key: string }): Promise<WechatLoginTicket> {
    return useWebGet(`/auth/wechat-qrcode-status/${params?.key}`);
}

// ==================== 短信验证相关 API ====================

/**
 * 发送短信验证码
 * @param params 发送参数
 * @returns 发送结果
 */
export function apiSmsSend(params?: {
    /** 场景类型 */
    scene: string;
    /** 手机号 */
    mobile: string;
}): Promise<{ data: string }> {
    return useWebPost("/sms/sendCode", params);
}

// ==================== 账号认证相关 API ====================

/**
 * 账号/手机号登录
 * @param params 登录参数
 * @returns 登录结果
 */
export function apiAuthLogin(params?: SystemLoginAccountParams): Promise<LoginResponse> {
    return useWebPost("/auth/login", params);
}

/**
 * 账号注册
 * @param params 注册参数
 * @returns 注册结果
 */
export function apiAuthRegister(params?: SystemRegisrerAccountParams): Promise<{
    token: string;
    user: LoginResponse;
}> {
    return useWebPost("/auth/register", params);
}

// ==================== 用户操作相关 API ====================

/**
 * 绑定手机号
 * @param params 绑定参数
 * @returns 绑定结果
 */
export function apiUserMobileBind(params?: {
    /** 绑定类型 */
    type: string;
    /** 手机号 */
    mobile: string;
    /** 验证码 */
    code: string;
}): Promise<{ data: [] }> {
    return useWebPost("/user/bindMobile", params);
}

/**
 * 重置密码
 * @param params 重置参数
 * @returns 重置结果
 */
export function apiPostResetPassword(params: {
    /** 手机号 */
    mobile: string;
    /** 验证码 */
    code: string;
    /** 新密码 */
    password: string;
    /** 确认密码 */
    password_confirm: string;
}): Promise<{ data: string }> {
    return useWebPost("/user/resetPassword", params);
}

/**
 * 修改用户密码
 * @param params 修改密码参数
 * @returns 修改结果
 */
export function apiChangePassword(params: {
    /** 旧密码 */
    oldPassword: string;
    /** 新密码 */
    newPassword: string;
    /** 确认密码 */
    confirmPassword: string;
}): Promise<{ message?: string } | null> {
    return useWebPost("/auth/change-password", params);
}
