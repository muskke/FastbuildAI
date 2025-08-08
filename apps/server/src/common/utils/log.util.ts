import chalk from "chalk";

type LogLevel = "success" | "error" | "warn" | "info" | "log";

interface LoggerOptions {
    icon?: string;
    iconColor?: keyof typeof chalk;
    color?: keyof typeof chalk;
    label?: string;
    labelWidth?: number;
}

const defaultIcons: Record<LogLevel, string> = {
    success: "✔",
    error: "✖",
    warn: "⚠",
    info: "ℹ",
    log: "➜",
};

const defaultColors: Record<LogLevel, keyof typeof chalk> = {
    success: "green",
    error: "red",
    warn: "yellow",
    info: "cyan",
    log: "blue",
};

/**
 * 通用日志输出函数
 *
 * @param message 消息内容
 * @param opts 日志选项
 */
const TerminalLogger = (message: string, opts: LoggerOptions = {}) => {
    const { icon = "➜", iconColor = "magenta", color = "", label = "", labelWidth = 21 } = opts;

    const chalkInstance = chalk as any;
    const coloredIcon = iconColor ? chalkInstance[iconColor](icon) : icon;
    const coloredMessage = color ? chalkInstance[color](message) : message;
    const space = "  ";

    let labelText = label;
    if (!labelText.includes(":") && labelText) {
        labelText += ":";
    }
    const paddedLabel = `${labelText.padEnd(labelWidth)}`;

    if (!label) {
        console.log(`${coloredIcon}${space}${coloredMessage}`);
        return;
    }
    console.log(`${coloredIcon}${space}${paddedLabel}${space}${coloredMessage}`);
};

TerminalLogger.success = (label: string, message: string, opts?: LoggerOptions) =>
    TerminalLogger(message, {
        icon: defaultIcons.success,
        iconColor: defaultColors.success,
        color: defaultColors.success,
        label,
        ...opts,
    });

TerminalLogger.error = (label: string, message: string, opts?: LoggerOptions) =>
    TerminalLogger(message, {
        icon: defaultIcons.error,
        iconColor: defaultColors.error,
        color: defaultColors.error,
        label,
        ...opts,
    });

TerminalLogger.warn = (label: string, message: string, opts?: LoggerOptions) =>
    TerminalLogger(message, {
        icon: defaultIcons.warn,
        iconColor: defaultColors.warn,
        color: defaultColors.warn,
        label,
    });

TerminalLogger.info = (label: string, message: string, opts?: LoggerOptions) =>
    TerminalLogger(message, {
        icon: defaultIcons.info,
        iconColor: defaultColors.info,
        color: defaultColors.info,
        label,
        ...opts,
    });

TerminalLogger.log = (label: string, message: string, opts?: LoggerOptions) =>
    TerminalLogger(message, {
        icon: defaultIcons.log,
        iconColor: defaultColors.log,
        label,
        ...opts,
    });

// 导出命名函数和类型
export { TerminalLogger };
