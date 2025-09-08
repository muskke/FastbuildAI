/**
 * 认证相关常量
 * @description 定义登录和认证相关的常量
 */
export const LOGIN_METHOD = {
    /** 微信登录 */
    WECHAT: 3,
    /** 手机号登录 */
    PHONE: 2,
    /** 账号登录 */
    ACCOUNT: 1,
    /** 绑定手机号 */
    BIND: "bind-login",
    /** 登录成功 */
    SUCCESS: "success-login",
} as const;
export type LoginMethod = (typeof LOGIN_METHOD)[keyof typeof LOGIN_METHOD];

export const WECHAT_LOGIN_STATUS = {
    /** 二维码错误 */
    CODE_ERROR: -1,
    /** 无效状态 */
    INVALID: 0,
    /** 正常状态 */
    NORMAL: 1,
    /** 已扫码 */
    SCANNED_CODE: 2,
    /** 登录失败 */
    LOGIN_FAIL: 3,
    /** 登录成功 */
    LOGIN_SUCCESS: 4,
} as const;
export type WechatLoginStatus = (typeof WECHAT_LOGIN_STATUS)[keyof typeof WECHAT_LOGIN_STATUS];

export const SMS_TYPE = {
    /** 登录验证码 */
    LOGIN: "YZMDL",
    /** 绑定手机号验证码 */
    BIND_MOBILE: "BDSJHM",
    /** 更换手机号验证码 */
    CHANGE_MOBILE: "BGSJHM",
    /** 找回密码验证码 */
    FIND_PASSWORD: "ZHDLMM",
    /** 注册验证码 */
    REGISTER: "YZMZC",
} as const;
export type SMS_TS_TYPE = (typeof SMS_TYPE)[keyof typeof SMS_TYPE];
