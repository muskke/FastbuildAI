#!/usr/bin/env node

/**
 * FastbuildAI PM2 命令执行脚本
 *
 * 这个脚本用于执行 PM2 命令，自动从环境变量中获取应用名称
 * 支持：restart, reload, logs, show 等操作
 */

import { exec } from "child_process";
import dotenv from "dotenv";
import fse from "fse-extra";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取项目根目录（Monorepo 根目录）
const projectRoot = path.resolve(__dirname, "../../../..");

// 根据环境加载对应的环境变量文件
const NODE_ENV = process.env.NODE_ENV || "development";
const envFile = NODE_ENV === "production" ? ".env.production.local" : ".env.development.local";
const envPath = path.resolve(projectRoot, envFile);

// 加载环境变量
if (await fse.pathExists(envPath)) {
    console.log(`正在加载环境变量文件: ${envPath}`);
    dotenv.config({ path: envPath });
} else {
    console.log(`环境变量文件不存在: ${envPath}，尝试加载默认 .env 文件`);
    dotenv.config({ path: path.resolve(projectRoot, ".env") });
}

const execPromise = promisify(exec);

// 配置
const APP_NAME = process.env.APP_NAME || process.env.PM2_APP_NAME || "fastbuildai";
const ACTION = process.argv[2] || ""; // 操作类型
const ARGS = process.argv.slice(3).join(" "); // 额外参数

// 日志函数
function log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
}

// 检查PM2是否已安装
async function isPm2Installed() {
    try {
        await execPromise("pm2 --version");
        return true;
    } catch (error) {
        return false;
    }
}

// 检查应用是否已在PM2中运行
async function isAppRunningInPm2(appName) {
    try {
        const { stdout } = await execPromise("pm2 list");
        return stdout.includes(appName);
    } catch (error) {
        return false;
    }
}

// 执行PM2命令
async function executePm2Command(action, appName, args = "") {
    try {
        log(`正在执行 PM2 命令: ${action} ${appName} ${args}`);

        // 检查PM2是否已安装
        const pm2Installed = await isPm2Installed();
        if (!pm2Installed) {
            log("错误: PM2 未安装，请先安装 PM2");
            process.exit(1);
        }

        // 对于某些命令，检查应用是否在运行
        if (["restart", "reload", "stop", "delete"].includes(action)) {
            const isRunning = await isAppRunningInPm2(appName);
            if (!isRunning) {
                log(`警告: 应用 ${appName} 未在 PM2 中运行`);
                if (action !== "restart" && action !== "reload") {
                    return false;
                }
            }
        }

        // 执行命令
        const command = `pm2 ${action} ${appName} ${args}`.trim();
        const { stdout } = await execPromise(command);
        log(stdout);

        return true;
    } catch (error) {
        log(`执行 PM2 命令时出错: ${error.message}`);
        return false;
    }
}

// 主函数
async function main() {
    log(`应用名称: ${APP_NAME}`);
    log(`操作: ${ACTION}`);

    if (!ACTION) {
        log("错误: 未指定操作，支持的操作有: restart, reload, logs, show 等");
        process.exit(1);
    }

    await executePm2Command(ACTION, APP_NAME, ARGS);
}

// 执行主函数
main().catch((error) => {
    log(`执行出错: ${error.message}`);
    process.exit(1);
});
