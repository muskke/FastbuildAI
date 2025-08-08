import { existsSync, readdirSync } from "node:fs";
import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

// 控制台颜色
const colors = {
    red: "\x1B[31m",
    green: "\x1B[32m",
    yellow: "\x1B[33m",
    blue: "\x1B[34m",
    reset: "\x1B[0m",
};

// 检查 Node.js 版本
const requiredVersion = 16;
const currentVersion = process.version.match(/^v(\d+)/)[1];

if (Number(currentVersion) < requiredVersion) {
    console.log(`${colors.red}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✖ 需要 Node.js v${requiredVersion} 或更高版本`);
    console.log(`✖ 当前版本: ${process.version}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    process.exit(1);
}

// 路径配置
const cwd = process.cwd();
const releasePath = path.resolve(cwd, "../../public");
const outputPath = path.resolve(cwd, ".output");
const isSSR = process.env.NUXT_BUILD_SSR === "true";

// 构建发布映射表
function buildReleaseMap() {
    console.log(`${colors.blue}📋 构建模式: ${isSSR ? "SSR" : "静态生成"}${colors.reset}`);

    // SSR模式下的映射
    if (isSSR) {
        console.log(`${colors.blue}🔍 SSR 模式 - 复制服务端文件${colors.reset}`);
        return {
            ".output": ".output",
            static: "static",
            "package.json": "package.json",
            ".env": ".env",
            ".env.production": ".env.production",
        };
    }

    // 静态模式下的映射
    console.log(`${colors.blue}🔍 静态模式 - 复制客户端文件${colors.reset}`);
    const releaseMap = {};

    if (!existsSync(".output/public")) {
        console.log(`${colors.red}❌ 静态输出目录不存在: .output/public${colors.reset}`);
        process.exit(1);
    }

    const files = readdirSync(".output/public");
    console.log(`${colors.blue}📁 发现 ${files.length} 个文件/目录需要复制${colors.reset}`);

    files.forEach((file) => {
        releaseMap[`.output/public/${file}`] = file;
    });

    return releaseMap;
}

// 复制文件或目录
async function copyFile(src, dest) {
    if (!existsSync(src)) return;

    // 确保目标目录存在
    await mkdir(path.dirname(dest), { recursive: true });

    // 处理已存在的目标
    const isUpdate = existsSync(dest);
    if (isUpdate) {
        await rm(dest, { recursive: true, force: true });
    }

    // 执行复制
    await cp(src, dest, { recursive: true, force: true });

    // 输出日志
    const relativeSrc = path.relative(cwd, src);
    const relativeDest = path.relative(releasePath, dest);
    const logColor = isUpdate ? colors.yellow : colors.blue;
    const logIcon = isUpdate ? "🔄 更新:" : "📦 新增:";
    console.log(`${logColor}${logIcon} ${relativeSrc} → ${relativeDest}${colors.reset}`);
}

// 主构建流程
async function build() {
    try {
        console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🚀 启动发布流程`);
        console.log(`📂 工作目录: ${cwd}`);
        console.log(`📦 目标目录: ${releasePath}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

        // 检查源目录
        if (!existsSync(outputPath)) {
            console.log(`${colors.red}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`✖ 源目录不存在: .output`);
            console.log(`✖ 请先运行构建命令生成输出文件`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
            process.exit(1);
        }

        // 确保目标目录存在
        await mkdir(releasePath, { recursive: true });

        // 获取发布映射并执行复制
        const releaseMap = buildReleaseMap();
        const entries = Object.entries(releaseMap);

        console.log(`${colors.blue}📋 准备复制 ${entries.length} 个项目...${colors.reset}`);

        await Promise.all(
            entries.map(([src, dest]) =>
                copyFile(path.resolve(cwd, src), path.resolve(releasePath, dest)),
            ),
        );

        // 输出成功信息
        console.log(`${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`✨ 发布成功！`);
        console.log(`📋 构建模式: ${isSSR ? "SSR" : "静态生成"}`);
        console.log(`📦 目标目录: ${path.relative(process.cwd(), releasePath)}`);
        console.log(`🔗 访问路径:  "/"`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    } catch (error) {
        console.log(`${colors.red}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`❌ 发布失败`);
        console.log(`💥 错误信息: ${error.message}`);
        console.log(`📍 错误堆栈:`);
        console.log(error.stack);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
        process.exit(1);
    }
}

// 执行构建
build();
