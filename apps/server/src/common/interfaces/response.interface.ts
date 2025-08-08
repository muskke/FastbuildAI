/**
 * 统一响应接口
 */
export interface Response<T> {
    /**
     * 状态码
     */
    code: number;

    /**
     * 响应消息
     */
    message: string;

    /**
     * 响应数据
     */
    data: T;

    /**
     * 响应时间戳
     */
    timestamp: number;
}
