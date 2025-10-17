#!/usr/bin/env node

/**
 * BuildingAI 应用启动脚本
 *
 * 这个脚本用于启动应用并确保它在 PM2 环境下运行
 * 支持自动重启功能和端口管理
 */

import { exec, spawn } from "child_process";
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
const PORT = process.env.SERVER_PORT || 4090;
const APP_NAME = process.env.APP_NAME || process.env.PM2_APP_NAME || "fastbuildai";
const SCRIPT = NODE_ENV === "development" ? "dev" : "start:prod";
const USE_PM2 = true; // 是否使用PM2启动

// 日志函数
function log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
}

// 检查端口是否被占用
async function isPortInUse(port) {
    try {
        const command =
            process.platform === "win32" ? `netstat -ano | findstr :${port}` : `lsof -i:${port} -t`;

        const { stdout } = await execPromise(command);
        return !!stdout.trim();
    } catch (error) {
        // 如果命令执行失败，通常意味着端口未被占用
        return false;
    }
}

// 释放端口
async function releasePort(port) {
    try {
        log(`尝试释放端口 ${port}...`);

        if (process.platform === "win32") {
            // Windows
            await execPromise(
                `for /f "tokens=5" %a in ('netstat -ano | findstr :${port}') do taskkill /F /PID %a`,
            ).catch(() => {});
        } else {
            // macOS/Linux
            await execPromise(`lsof -i:${port} -t | xargs kill -9`).catch(() => {});
        }

        log(`端口 ${port} 已释放`);
        return true;
    } catch (error) {
        log(`释放端口失败: ${error.message}`);
        return false;
    }
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

// 使用PM2启动应用
async function startWithPm2(appName, script, port) {
    try {
        log(`正在使用PM2启动应用 (${appName})...`);

        // 检查应用是否已在运行
        const isRunning = await isAppRunningInPm2(appName);

        if (isRunning) {
            // 如果应用已在运行，重启它
            log(`应用 ${appName} 已在PM2中运行，正在重启...`);
            await execPromise(`pm2 restart ${appName}`);
        } else {
            // 否则，启动新实例
            log(`正在PM2中创建新的应用实例...`);

            // 创建PM2配置
            const ecosystem = {
                name: appName,
                script: "pnpm",
                args: ["run", script],
                env: {
                    NODE_ENV,
                    SERVER_PORT: port,
                },
                max_memory_restart: "1G", // 内存超过1G时自动重启
                restart_delay: 3000, // 重启延迟3秒
                max_restarts: 10, // 最大重启次数
                min_uptime: "30s", // 最小运行时间，用于判断是否成功启动
            };

            // 将配置写入临时文件
            const configPath = path.join(__dirname, "pm2.config.json");
            fse.writeFileSync(configPath, JSON.stringify(ecosystem, null, 2));

            // 启动应用
            await execPromise(`pm2 start ${configPath} --update-env`);

            // 保存PM2配置，确保服务器重启后应用也会自动启动
            await execPromise("pm2 save").catch(() => {});

            // 删除临时配置文件
            fse.unlinkSync(configPath);
        }

        log(`应用已成功在PM2中启动，正在运行于端口 ${port}`);
        return true;
    } catch (error) {
        log(`使用PM2启动应用失败: ${error.message}`);
        return false;
    }
}

// 直接启动应用（不使用PM2）
function startDirectly(script, port) {
    log(`正在直接启动应用 (不使用PM2)...`);

    const child = spawn("pnpm", ["run", script], {
        env: {
            ...process.env,
            SERVER_PORT: port,
        },
        stdio: "inherit",
    });

    child.on("error", (error) => {
        log(`启动应用失败: ${error.message}`);
    });

    child.on("close", (code) => {
        if (code !== 0) {
            log(`应用异常退出，退出码: ${code}`);
        }
    });

    log(`应用已启动，正在运行于端口 ${port}`);
}

// 主函数
async function main() {
    try {
        log("===== BuildingAI 应用启动脚本 =====");
        log(`环境: ${NODE_ENV}`);
        log(`目标端口: ${PORT}`);

        // 检查端口是否被占用
        const portInUse = await isPortInUse(PORT);
        if (portInUse) {
            log(`警告: 端口 ${PORT} 已被占用，尝试释放...`);
            await releasePort(PORT);

            // 再次检查端口
            const stillInUse = await isPortInUse(PORT);
            if (stillInUse) {
                log(`无法释放端口 ${PORT}，请手动终止占用该端口的进程`);
                process.exit(1);
            }
        }

        if (USE_PM2) {
            // 检查PM2是否已安装
            const pm2Installed = await isPm2Installed();
            if (!pm2Installed) {
                log("PM2未安装，正在尝试安装...");
                try {
                    await execPromise("npm install -g pm2");
                    log("PM2安装成功");
                } catch (error) {
                    log(`PM2安装失败: ${error.message}`);
                    log("将使用直接启动方式");
                    startDirectly(SCRIPT, PORT);
                    return;
                }
            }

            // 使用PM2启动
            await startWithPm2(APP_NAME, SCRIPT, PORT);
        } else {
            // 直接启动
            startDirectly(SCRIPT, PORT);
        }
    } catch (error) {
        log(`启动脚本执行失败: ${error.message}`);
        process.exit(1);
    }
}

// 执行主函数
main();
