import { isDevelopment, isProduction } from "@common/utils/is.util";
import { Injectable, LoggerService, LogLevel, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import chalk from "chalk";
import { format } from "date-fns";
import * as fse from "fs-extra";
import * as path from "path";

/**
 * 自定义应用日志服务
 *
 * 扩展 NestJS 的 LoggerService 接口，提供更丰富的日志功能
 * 支持控制台输出和文件日志
 * 支持不同日志级别的彩色输出
 * 支持按日期分割日志文件
 */
@Injectable()
export class AppLoggerService implements LoggerService {
    private context?: string;
    private logLevels: LogLevel[] = ["log", "error", "warn", "debug", "verbose", "fatal"];
    private logDir: string;
    private logFile: string;
    private isFileLogEnabled: boolean;

    /**
     * 构造函数
     *
     * @param context 日志上下文，通常是类名
     * @param configService 配置服务，用于读取日志配置
     */
    constructor(
        @Optional() context?: string,
        @Optional() private configService?: ConfigService,
    ) {
        this.context = context;
        // 初始化日志上下文

        // 初始化日志配置
        this.initLogConfig();
    }

    /**
     * 初始化日志配置
     *
     * 从配置服务读取日志配置，如果没有配置服务，则使用默认配置
     */
    private initLogConfig(): void {
        // 默认保存到 storage/logs 目录
        this.logDir = "storage/logs";

        // 从配置服务读取日志级别和文件配置，如果没有配置服务，则使用默认值
        if (this.configService) {
            // 读取日志级别
            const configLevels = process.env.LOG_LEVELS;
            if (configLevels) {
                this.logLevels = configLevels.split(",") as LogLevel[];
            }

            // 读取是否启用文件日志
            this.isFileLogEnabled = process.env.LOG_TO_FILE === "true";
        } else {
            // 默认不启用文件日志
            this.isFileLogEnabled = false;
        }

        // 创建日志目录（如果不存在）
        if (this.isFileLogEnabled) {
            fse.ensureDirSync(this.logDir);
            // 初始化日志文件
            const { filePath } = this.getLogFileInfo();
            this.logFile = filePath;
        }
    }

    /**
     * 清理上个月的日志
     *
     * 删除上个月的所有日志文件和目录
     */
    private cleanupLastMonthLogs(): void {
        try {
            const date = new Date();
            // 获取上个月的年和月
            date.setMonth(date.getMonth() - 1);
            const lastYear = String(date.getFullYear());
            const lastMonth = String(date.getMonth() + 1).padStart(2, "0");

            // 上个月的日志目录
            const lastMonthDir = path.join(this.logDir, `${lastYear}-${lastMonth}`);

            // 如果目录存在，则删除
            if (fse.pathExists(lastMonthDir)) {
                console.log(`清理上个月日志: ${lastMonthDir}`);
                fse.remove(lastMonthDir);
            }
        } catch (error) {
            console.error(`清理上个月日志失败: ${error.message}`);
        }
    }

    /**
     * 获取当前日期信息
     *
     * @returns 日期信息对象，包含年、月、日
     */
    private getCurrentDate(): { year: string; month: string; day: string } {
        const date = new Date();
        const year = String(date.getFullYear());
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return { year, month, day };
    }

    /**
     * 获取日志文件名和目录
     *
     * 根据当前日期生成日志文件名和目录
     * @returns 日志文件名和目录信息
     */
    private getLogFileInfo(): { filePath: string; monthDir: string; fileExists: boolean } {
        const { year, month, day } = this.getCurrentDate();

        // 按月份分目录存放日志
        const monthDir = path.join(this.logDir, `${year}-${month}`);

        fse.ensureDirSync(monthDir);

        // 日志文件路径
        const filePath = path.join(monthDir, `${day}.log`);

        // 检查文件是否已存在
        const fileExists = fse.pathExistsSync(filePath);

        return { filePath, monthDir, fileExists };
    }

    /**
     * 获取格式化的时间戳
     *
     * @returns 格式化的时间戳字符串，格式为 YYYY-MM-DD HH:mm:ss.SSS
     */
    private getTimestamp(): string {
        // 使用 date-fns 库格式化时间，格式为 YYYY-MM-DD HH:mm:ss.SSS
        return format(new Date(), "yyyy-MM-dd HH:mm:ss.SSS");
    }

    /**
     * 格式化日志消息
     *
     * @param level 日志级别
     * @param message 日志消息
     * @param context 日志上下文
     * @param isColored 是否使用彩色输出
     * @returns 格式化后的日志消息
     */
    private formatMessage(level: string, message: any, context?: string, isColored = true): string {
        const timestamp = this.getTimestamp();
        const contextStr = context || this.context || "";
        const contextInfo = contextStr ? `[${contextStr}]` : "";

        // 根据日志级别设置不同的颜色
        let levelStr = `[${level.toUpperCase()}]`;
        let contextDisplay = this.context ? `[${this.context}]` : "";

        if (isColored) {
            // 使用chalk库为日志级别添加颜色
            switch (level) {
                case "error":
                    levelStr = chalk.red(levelStr); // 红色
                    break;
                case "warn":
                    levelStr = chalk.yellow(levelStr); // 黄色
                    break;
                case "debug":
                    levelStr = chalk.cyan(levelStr); // 青色
                    break;
                case "verbose":
                    levelStr = chalk.magenta(levelStr); // 紫色
                    break;
                default:
                    levelStr = chalk.green(levelStr); // 绿色
            }

            // 使用蓝色背景显示上下文
            contextDisplay = this.context
                ? this.context === "HTTP"
                    ? chalk.bgRgb(55, 78, 227).white(` ${this.context} `)
                    : chalk.rgb(55, 78, 227)(` ${this.context} `)
                : "";
        }

        return `${contextDisplay} ${timestamp} ${levelStr} ${contextInfo} ${message}`;
    }

    /**
     * 将日志写入文件
     *
     * @param message 日志消息
     */
    private writeToFile(message: string): void {
        if (!this.isFileLogEnabled) return;

        // 获取日志文件信息
        const { filePath, fileExists } = this.getLogFileInfo();

        // 如果是新的一天（文件不存在），则清理上个月的日志
        if (!fileExists) {
            this.cleanupLastMonthLogs();
        }

        // 更新当前日志文件路径
        this.logFile = filePath;

        // 移除颜色代码 - 使用简化的方法
        // 定义一个辅助函数来移除ANSI颜色代码
        const removeAnsiCodes = (str: string) => {
            // 使用字符串分割和过滤的方式处理
            let result = "";
            let inEscSeq = false;

            for (let i = 0; i < str.length; i++) {
                const char = str[i];

                if (char === "\u001B" || char === "\u009B") {
                    inEscSeq = true;
                    continue;
                }

                if (inEscSeq) {
                    if ((char >= "a" && char <= "z") || (char >= "A" && char <= "Z")) {
                        inEscSeq = false;
                    }
                    continue;
                }

                result += char;
            }

            return result;
        };

        const cleanMessage = removeAnsiCodes(message);

        // 将日志追加到文件
        fse.appendFile(this.logFile, cleanMessage + "\n");
    }

    /**
     * 记录普通日志
     *
     * @param message 日志消息
     * @param context 日志上下文
     */
    log(message: any, context?: string): void {
        if (!this.logLevels.includes("log")) return;

        const formattedMessage = this.formatMessage("log", message, context);
        console.log(">", formattedMessage);
        this.writeToFile(this.formatMessage("log", message, context, false));
    }

    /**
     * 记录错误日志
     *
     * @param message 日志消息
     * @param trace 错误堆栈
     * @param context 日志上下文
     */
    error(message: any, trace?: string, context?: string): void {
        if (!this.logLevels.includes("error")) return;

        const formattedMessage = this.formatMessage("error", message, context);
        console.error(">", formattedMessage);

        if (trace) {
            console.error(">", trace);
            this.writeToFile(this.formatMessage("error", message, context, false) + "\n" + trace);
        } else {
            this.writeToFile(this.formatMessage("error", message, context, false));
        }
    }

    /**
     * 记录警告日志
     *
     * @param message 日志消息
     * @param context 日志上下文
     */
    warn(message: any, context?: string): void {
        if (!this.logLevels.includes("warn")) return;

        const formattedMessage = this.formatMessage("warn", message, context);
        console.warn(">", formattedMessage);
        this.writeToFile(this.formatMessage("warn", message, context, false));
    }

    /**
     * 记录调试日志
     *
     * @param message 日志消息
     * @param context 日志上下文
     */
    debug(message: any, context?: string): void {
        if (!this.logLevels.includes("debug")) return;

        const formattedMessage = this.formatMessage("debug", message, context);
        console.debug(">", formattedMessage);
        this.writeToFile(this.formatMessage("debug", message, context, false));
    }

    /**
     * 记录详细日志
     *
     * @param message 日志消息
     * @param context 日志上下文
     */
    verbose(message: any, context?: string): void {
        if (!this.logLevels.includes("verbose")) return;

        const formattedMessage = this.formatMessage("verbose", message, context);
        console.log(">", formattedMessage);
        this.writeToFile(this.formatMessage("verbose", message, context, false));
    }

    /**
     * 设置日志上下文
     *
     * @param context 日志上下文
     * @returns 当前日志服务实例
     */
    setContext(context: string): this {
        this.context = context;
        return this;
    }

    /**
     * 设置日志级别
     *
     * @param levels 日志级别数组
     * @returns 当前日志服务实例
     */
    setLogLevels(levels: LogLevel[]): this {
        this.logLevels = levels;
        return this;
    }
}
