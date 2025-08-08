/**
 * 参数处理器
 * 负责请求参数的处理和转换
 */
export class ParamsProcessor {
    /** 自定义参数处理函数 */
    private processor: (params: Record<string, unknown>) => Record<string, unknown> = (params) => params;

    /**
     * 设置参数处理器
     * @param processor 参数处理函数
     */
    setProcessor(processor: (params: Record<string, unknown>) => Record<string, unknown>): void {
        this.processor = processor;
    }

    /**
     * 处理参数
     * @param params 原始参数
     * @returns 处理后的参数
     */
    process(params: Record<string, unknown>): Record<string, unknown> {
        return this.processor(params);
    }
} 