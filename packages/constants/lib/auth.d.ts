/**
 * 认证相关常量
 * @description 定义登录和认证相关的常量
 */
/**
 * 登录方式类型（数字枚举）
 */
export declare const LOGIN_TYPE: {
    /** 账号登录 */
    readonly ACCOUNT: 1;
    /** 手机号登录 */
    /** 微信登录 */
    readonly WECHAT: 3;
};
export type LoginType = (typeof LOGIN_TYPE)[keyof typeof LOGIN_TYPE];
//# sourceMappingURL=auth.d.ts.map