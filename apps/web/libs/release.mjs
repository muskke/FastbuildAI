import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { cp, mkdir, rm, chmod, lstat } from "node:fs/promises";
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
const releasePath = path.resolve(cwd, "../../public/web");
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

/**
 * 处理 SPA 加载图标路径替换
 * 如果存在 PNG 文件，则替换为 PNG 路径，否则保持 SVG 路径
 */
function processSpaLoadingIcon() {
    if (isSSR) return; // SSR 模式不需要处理

    console.log(`${colors.blue}🔄 处理 SPA 加载图标路径替换...${colors.reset}`);

    const templatePath = path.resolve(releasePath, "spa-loading-template.html");
    const pngPath = path.resolve(cwd, "public/spa-loading.png");

    if (!existsSync(templatePath)) {
        console.log(`${colors.yellow}⚠️ 模板文件不存在: spa-loading-template.html${colors.reset}`);
        return;
    }

    try {
        let templateContent = readFileSync(templatePath, "utf-8");

        // 检查 PNG 文件是否存在
        const iconPath = existsSync(pngPath) ? "/spa-loading.png" : "/spa-loading.svg";

        // 替换图片路径
        templateContent = templateContent.replace(
            /src="\/spa-loading\.(png|svg)"/g,
            `src="${iconPath}"`,
        );

        // 写回文件
        writeFileSync(templatePath, templateContent, { encoding: "utf-8", mode: 0o777 });
        console.log(`${colors.green}✅ SPA 加载图标已更新为: ${iconPath}${colors.reset}`);
    } catch (error) {
        console.log(`${colors.red}❌ SPA 加载图标处理失败: ${error.message}${colors.reset}`);
    }
}

// 复制文件或目录
async function copyFile(src, dest) {
    if (!existsSync(src)) return;

    // 确保目标目录存在
    await mkdir(path.dirname(dest), { recursive: true, mode: 0o777 });

    // 处理已存在的目标
    const isUpdate = existsSync(dest);
    if (isUpdate) {
        await rm(dest, { recursive: true, force: true });
    }

    // 执行复制
    try {
        await cp(src, dest, { recursive: true, force: true });

        // 设置文件权限
        if (process.platform !== "win32") {
            // 非Windows系统才设置权限
            // 如果是目录，设置为777，如果是文件，设置为777
            const stat = await lstat(dest);
            const isDir = stat.isDirectory();
            await chmod(dest, isDir ? 0o777 : 0o777);
        }
    } catch (error) {
        console.log(`${colors.red}复制文件失败: ${src} -> ${dest}${colors.reset}`);
        console.log(`${colors.red}错误信息: ${error.message}${colors.reset}`);
        throw error;
    }

    // 输出日志
    const relativeSrc = path.relative(cwd, src);
    const relativeDest = path.relative(releasePath, dest);
    const logColor = isUpdate ? colors.yellow : colors.blue;
    const logIcon = isUpdate ? "🔄 更新:" : "📦 新增:";
    console.log(`${logColor}${logIcon} ${relativeSrc} → ${relativeDest}${colors.reset}`);
}

/**
 * 递归设置目录和文件的权限
 * @param {string} dirPath 目录路径
 */
async function setPermissionsRecursively(dirPath) {
    if (process.platform === "win32") return; // Windows不设置权限

    try {
        console.log(`${colors.blue}设置目录权限: ${dirPath}${colors.reset}`);

        // 设置当前目录的权限
        await chmod(dirPath, 0o777);

        // 读取目录内容
        const entries = readdirSync(dirPath, { withFileTypes: true });

        // 遍历目录内容
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                // 如果是目录，递归设置
                await setPermissionsRecursively(fullPath);
            } else {
                // 如果是文件，设置文件权限
                await chmod(fullPath, 0o777);
            }
        }
    } catch (error) {
        console.log(
            `${colors.yellow}警告: 设置权限失败: ${dirPath}, 错误: ${error.message}${colors.reset}`,
        );
    }
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
        await mkdir(releasePath, { recursive: true, mode: 0o777 });

        // 获取发布映射并执行复制
        const releaseMap = buildReleaseMap();
        const entries = Object.entries(releaseMap);

        console.log(`${colors.blue}📋 准备复制 ${entries.length} 个项目...${colors.reset}`);

        await Promise.all(
            entries.map(([src, dest]) =>
                copyFile(path.resolve(cwd, src), path.resolve(releasePath, dest)),
            ),
        );

        // 处理 SPA 加载图标路径替换
        processSpaLoadingIcon();

        // 递归设置所有文件和目录的权限
        console.log(`${colors.blue}开始设置文件和目录权限...${colors.reset}`);
        await setPermissionsRecursively(releasePath);
        console.log(`${colors.green}权限设置完成${colors.reset}`);

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
