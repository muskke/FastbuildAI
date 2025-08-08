/**
 * AI SDK 基础错误类
 * 所有 AI SDK 相关的错误都应该继承自这个类
 */
export class AIError extends Error {
    /**
     * 错误代码
     */
    code: string;

    /**
     * 原始错误
     */
    cause?: Error;

    /**
     * 构造函数
     * @param message 错误信息
     * @param code 错误代码
     * @param cause 原始错误
     */
    constructor(message: string, code: string = "AI_ERROR", cause?: Error) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.cause = cause;

        // 捕获堆栈跟踪
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    /**
     * 获取完整的错误信息，包括原始错误
     */
    get fullMessage(): string {
        if (this.cause) {
            return `${this.message}\nCaused by: ${this.cause.message}`;
        }
        return this.message;
    }
}
