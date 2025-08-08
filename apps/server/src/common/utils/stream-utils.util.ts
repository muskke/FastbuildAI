import { Response } from "express";

/**
 * 流式输出工具类
 * 提供多种流式输出模式和配置选项
 */
export class StreamUtils {
    /**
     * 模拟流式输出文本
     * @param text 要输出的完整文本
     * @param res Express响应对象
     * @param options 输出选项
     */
    static async simulateStream(
        text: string,
        res: Response,
        options: {
            /** 输出模式 */
            mode?: "character" | "word" | "sentence" | "fast";
            /** 输出速度（毫秒） */
            speed?: number;
            /** 每个chunk的最大字符数 */
            chunkSize?: number;
            /** 是否在开始前发送开始信号 */
            sendStartSignal?: boolean;
            /** 是否在结束后发送结束信号 */
            sendEndSignal?: boolean;
            /** 自定义开始信号 */
            startSignal?: any;
            /** 自定义结束信号 */
            endSignal?: any;
        } = {},
    ): Promise<void> {
        const {
            mode = "word",
            speed = 80,
            chunkSize = 1,
            sendStartSignal = false,
            sendEndSignal = false,
            startSignal = { type: "start", data: "开始输出" },
            endSignal = "data: [DONE]\n\n",
        } = options;

        // 发送开始信号
        if (sendStartSignal) {
            res.write(`data: ${JSON.stringify(startSignal)}\n\n`);
        }

        let segments: string[] = [];

        // 根据模式分割文本
        switch (mode) {
            case "character":
                segments = text.split("");
                break;
            case "word":
                // 中文按字符分割，英文按空格分割
                segments = text.split(/(\s+|[^\s]+)/).filter((s) => s.trim());
                break;
            case "sentence":
                segments = text.split(/[。！？.!?]/).filter((s) => s.trim());
                break;
            case "fast":
                segments = text.split("");
                break;
            default:
                segments = text.split(/(\s+|[^\s]+)/).filter((s) => s.trim());
        }

        // 按chunkSize分组
        const chunks: string[] = [];
        for (let i = 0; i < segments.length; i += chunkSize) {
            const chunk = segments
                .slice(i, i + chunkSize)
                .join(mode === "word" ? " " : mode === "sentence" ? "。" : "");
            if (chunk.trim()) {
                chunks.push(chunk);
            }
        }

        // 逐块输出
        for (const chunk of chunks) {
            res.write(`data: ${JSON.stringify({ type: "chunk", data: chunk })}\n\n`);

            // 等待指定时间
            await new Promise((resolve) => setTimeout(resolve, speed));
        }

        // 发送结束信号
        if (sendEndSignal) {
            res.write(endSignal);
        }
    }

    /**
     * 快速流式输出（适合短文本）
     * @param text 要输出的完整文本
     * @param res Express响应对象
     */
    static async fastStream(text: string, res: Response): Promise<void> {
        return this.simulateStream(text, res, {
            mode: "fast",
            speed: 10,
            chunkSize: 3,
            sendStartSignal: false,
            sendEndSignal: false,
        });
    }

    /**
     * 按词流式输出（适合长文本）
     * @param text 要输出的完整文本
     * @param res Express响应对象
     * @param speed 输出速度（毫秒/词）
     */
    static async wordStream(text: string, res: Response, speed: number = 80): Promise<void> {
        // 直接按字符分割，确保每个字符都能单独输出
        const characters = text.split("");

        for (const char of characters) {
            if (char.trim()) {
                res.write(`data: ${JSON.stringify({ type: "chunk", data: char })}\n\n`);
                // 等待指定时间
                await new Promise((resolve) => setTimeout(resolve, speed));
            }
        }
    }

    /**
     * 按字符流式输出（适合短文本）
     * @param text 要输出的完整文本
     * @param res Express响应对象
     * @param speed 输出速度（毫秒/字符）
     */
    static async characterStream(text: string, res: Response, speed: number = 30): Promise<void> {
        // 直接按字符分割，确保每个字符都能单独输出
        const characters = text.split("");

        for (const char of characters) {
            res.write(`data: ${JSON.stringify({ type: "chunk", data: char })}\n\n`);
            // 等待指定时间
            await new Promise((resolve) => setTimeout(resolve, speed));
        }
    }

    /**
     * 按句子流式输出（适合长文本）
     * @param text 要输出的完整文本
     * @param res Express响应对象
     * @param speed 输出速度（毫秒/句子）
     */
    static async sentenceStream(text: string, res: Response, speed: number = 200): Promise<void> {
        return this.simulateStream(text, res, {
            mode: "sentence",
            speed,
            chunkSize: 1,
            sendStartSignal: false,
            sendEndSignal: false,
        });
    }

    /**
     * 智能流式输出（根据文本长度自动选择模式）
     * @param text 要输出的完整文本
     * @param res Express响应对象
     */
    static async smartStream(text: string, res: Response): Promise<void> {
        const length = text.length;

        if (length < 50) {
            // 短文本：快速字符输出
            return this.characterStream(text, res, 20);
        } else if (length < 200) {
            // 中等文本：按词输出
            return this.wordStream(text, res, 60);
        } else {
            // 长文本：按句子输出
            return this.sentenceStream(text, res, 150);
        }
    }

    /**
     * 发送流式数据
     * @param res Express响应对象
     * @param type 数据类型
     * @param data 数据内容
     */
    static sendStreamData(res: Response, type: string, data: any): void {
        res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
    }

    /**
     * 发送流式结束信号
     * @param res Express响应对象
     */
    static sendStreamEnd(res: Response): void {
        res.write("data: [DONE]\n\n");
    }

    /**
     * 设置流式响应头
     * @param res Express响应对象
     */
    static setStreamHeaders(res: Response): void {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Cache-Control");
    }
}
