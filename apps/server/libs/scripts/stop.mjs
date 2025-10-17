#!/usr/bin/env node

/**
 * BuildingAI 应用停止脚本
 *
 * 这个脚本用于停止或删除 PM2 中运行的应用
 * 会自动读取环境变量中的应用名称
 */

import { exec } from "child_process";
import dotenv from "dotenv";
import fse from "f'se-extra";
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
const ACTION = process.argv[2] || "stop"; // 默认操作为停止

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

// 停止应用
async function stopApp(appName) {
    try {
        log(`正在停止应用 ${appName}...`);

        // 检查PM2是否已安装
        const pm2Installed = await isPm2Installed();
        if (!pm2Installed) {
            log("错误: PM2 未安装，请先安装 PM2");
            process.exit(1);
        }

        // 检查应用是否在运行
        const isRunning = await isAppRunningInPm2(appName);
        if (!isRunning) {
            log(`应用 ${appName} 未在 PM2 中运行`);
            return false;
        }

        // 停止应用
        const result = await execPromise(`pm2 stop ${appName}`);
        console.log(result.stdout);
        log(`应用 ${appName} 已停止`);
        return true;
    } catch (error) {
        log(`停止应用时出错: ${error.message}`);
        return false;
    }
}

// 删除应用
async function deleteApp(appName) {
    try {
        log(`正在删除应用 ${appName}...`);

        // 检查PM2是否已安装
        const pm2Installed = await isPm2Installed();
        if (!pm2Installed) {
            log("错误: PM2 未安装，请先安装 PM2");
            process.exit(1);
        }

        // 检查应用是否在PM2列表中
        const isRunning = await isAppRunningInPm2(appName);
        if (!isRunning) {
            log(`应用 ${appName} 未在 PM2 中运行`);
            return false;
        }

        // 删除应用
        await execPromise(`pm2 delete ${appName}`);
        log(`应用 ${appName} 已从 PM2 中删除`);
        return true;
    } catch (error) {
        log(`删除应用时出错: ${error.message}`);
        return false;
    }
}

// 主函数
async function main() {
    log(`应用名称: ${APP_NAME}`);
    log(`操作: ${ACTION}`);

    if (ACTION === "stop") {
        await stopApp(APP_NAME);
    } else if (ACTION === "delete") {
        await deleteApp(APP_NAME);
    } else {
        log(`未知操作: ${ACTION}，支持的操作有: stop, delete`);
        process.exit(1);
    }
}

// 执行主函数
main().catch((error) => {
    log(`执行出错: ${error.message}`);
    process.exit(1);
});
