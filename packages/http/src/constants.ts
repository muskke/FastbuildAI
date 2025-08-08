/**
 * @fileoverview HTTP 模块的业务错误码常量定义
 */

/**
 * 业务错误码常量
 *
 * 错误码设计规则：
 * 1. 成功码：20000
 * 2. 客户端错误：4xxxx（前缀4，后续4位为具体错误码）
 * 3. 服务端错误：5xxxx（前缀5，后续4位为具体错误码）
 * 4. 第二位表示错误类型：
 *    - 0: 通用错误
 *    - 1: 参数错误
 *    - 2: 权限错误
 *    - 3: 用户相关错误
 *    - 4: 数据错误
 *    - 5: 第三方服务错误
 *    - 6: 业务逻辑错误
 *    - 7: 资源错误
 *    - 8: 配置错误
 *    - 9: 系统错误
 */

/** 业务错误码常量  */
export const BusinessCode = {
    // ====================      成功状态      ====================
    /** 操作成功 */
    SUCCESS: { code: 20000, message: "操作成功" },

    // ==================== 客户端错误 (4xxxx) ====================
    // 通用客户端错误 (40xxx)
    /** 客户端通用错误 */
    CLIENT_ERROR: { code: 40000, message: "客户端错误" },
    /** 请求格式错误 */
    INVALID_REQUEST: { code: 40001, message: "请求格式错误" },
    /** 请求超时 */
    REQUEST_TIMEOUT: { code: 40002, message: "请求超时" },
    /** 请求过于频繁 */
    REQUEST_RATE_LIMIT: { code: 40003, message: "请求过于频繁，请稍后再试" },

    // 参数错误 (41xxx)
    /** 参数验证失败 */
    PARAM_ERROR: { code: 41000, message: "参数验证失败" },
    /** 参数缺失 */
    PARAM_MISSING: { code: 41001, message: "缺少必要参数" },
    /** 参数类型错误 */
    PARAM_TYPE_ERROR: { code: 41002, message: "参数类型错误" },
    /** 参数值无效 */
    PARAM_INVALID: { code: 41003, message: "参数值无效" },

    // 权限错误 (42xxx)
    /** 未授权 */
    UNAUTHORIZED: { code: 42000, message: "未授权，请先登录" },
    /** 访问被拒绝 */
    FORBIDDEN: { code: 42001, message: "没有操作权限" },
    /** 令牌过期 */
    TOKEN_EXPIRED: { code: 42002, message: "登录已过期，请重新登录" },
    /** 令牌无效 */
    TOKEN_INVALID: { code: 42003, message: "无效的身份凭证" },

    // 用户相关错误 (43xxx)
    /** 用户不存在 */
    USER_NOT_FOUND: { code: 43000, message: "用户不存在" },
    /** 用户已存在 */
    USER_ALREADY_EXISTS: { code: 43001, message: "用户已存在" },
    /** 用户已禁用 */
    USER_DISABLED: { code: 43002, message: "账号已被禁用" },
    /** 用户名或密码错误 */
    USER_AUTH_FAILED: { code: 43003, message: "用户名或密码错误" },

    // 数据错误 (44xxx)
    /** 数据不存在 */
    DATA_NOT_FOUND: { code: 44000, message: "数据不存在" },
    /** 数据已存在 */
    DATA_ALREADY_EXISTS: { code: 44001, message: "数据已存在" },
    /** 数据验证失败 */
    DATA_VALIDATE_FAILED: { code: 44002, message: "数据验证失败" },

    // 业务逻辑错误 (46xxx)
    /** 业务处理失败 */
    BUSINESS_ERROR: { code: 46000, message: "业务处理失败" },
    /** 操作不支持 */
    OPERATION_NOT_SUPPORTED: { code: 46001, message: "当前操作不支持" },
    /** 操作已取消 */
    OPERATION_CANCELED: { code: 46002, message: "操作已取消" },
    /** 操作冲突 */
    OPERATION_CONFLICT: { code: 46004, message: "操作冲突，请刷新后重试" },

    // 系统错误 (49xxx)
    /** 系统内部错误 */
    SYSTEM_ERROR: { code: 49000, message: "系统内部错误" },
    /** 服务不可用 */
    SERVICE_UNAVAILABLE: { code: 49001, message: "服务暂时不可用" },
    /** 系统维护中 */
    SYSTEM_MAINTENANCE: { code: 49002, message: "系统维护中，请稍后再试" },
    /** 系统过载 */
    SYSTEM_OVERLOAD: { code: 49003, message: "系统繁忙，请稍后再试" },
    /** 功能未实现 */
    NOT_IMPLEMENTED: { code: 49004, message: "功能尚未实现" },

    // ==================== 服务端错误 (5xxxx) ====================
    // 通用服务端错误 (50xxx)
    /** 服务端通用错误 */
    SERVER_ERROR: { code: 50000, message: "服务器错误" },
    /** 服务端处理超时 */
    SERVER_TIMEOUT: { code: 50002, message: "服务器处理超时" },
} as const;

/**
 * 业务错误码对象类型
 */
export type BusinessCodeObject = {
    /** 状态码数值 */
    code: number;
    /** 状态码描述 */
    message: string;
};

/**
 * 业务错误码值类型
 * 用于类型提示和代码补全
 */
export type BusinessCodeValue = (typeof BusinessCode)[keyof typeof BusinessCode];

/**
 * 业务错误码键类型
 * 用于类型提示和代码补全
 */
export type BusinessCodeKey = keyof typeof BusinessCode;
