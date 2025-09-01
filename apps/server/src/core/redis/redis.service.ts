import { TerminalLogger } from "@common/utils/log.util";
import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, RedisClientType } from "redis";

/**
 * Redis服务
 *
 * 提供Redis操作的封装，包括Redis客户端实例和高级Redis命令
 * 专注于提供原生Redis功能，不包含缓存管理功能
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
    private redisClient: RedisClientType;
    private isConnected = false;

    constructor(private configService: ConfigService) {
        this.initRedisClient();
    }

    /**
     * 初始化Redis客户端
     */
    private async initRedisClient() {
        this.redisClient = createClient({
            socket: {
                host: process.env.REDIS_HOST || "localhost",
                port: Number(process.env.REDIS_PORT) || 6379,
            },
            username: process.env.REDIS_USERNAME || "",
            password: process.env.REDIS_PASSWORD || "",
            database: Number(process.env.REDIS_DB) || 0,
        });

        this.redisClient.on("error", (err) => {
            TerminalLogger.error("Redis客户端", `错误: ${err}`);
        });

        this.redisClient.on("connect", () => {
            TerminalLogger.success("Redis Status", "Connected");
            this.isConnected = true;
        });

        await this.redisClient.connect();
    }

    /**
     * 获取值
     * @param key 键
     * @returns 值
     */
    async get<T>(key: string): Promise<T | null> {
        return this.redisClient.get(key) as Promise<T | null>;
    }

    /**
     * 设置值
     * @param key 键
     * @param value 值
     * @param ttl 过期时间（秒），可选
     */
    async set(key: string, value: string, ttl?: number): Promise<void> {
        if (ttl) {
            await this.redisClient.setEx(key, ttl, value);
        } else {
            await this.redisClient.set(key, value);
        }
    }

    /**
     * 删除键
     * @param key 键
     */
    async del(key: string): Promise<void> {
        await this.redisClient.del(key);
    }

    /**
     * 重置所有缓存
     */
    async reset(): Promise<void> {
        // 使用Redis客户端的flushDb命令清空当前数据库
        await this.redisClient.flushDb();
    }

    /**
     * 获取Redis客户端实例
     * 用于执行一些cache-manager不支持的高级Redis命令
     * @returns Redis客户端实例
     */
    getClient(): RedisClientType {
        return this.redisClient;
    }

    /**
     * 执行Redis命令
     * @param command Redis命令
     * @param args 命令参数
     * @returns 命令执行结果
     */
    async executeCommand(command: string, ...args: any[]): Promise<any> {
        return this.redisClient.sendCommand([command, ...args]);
    }

    /**
     * 发布消息到指定频道
     * @param channel 频道名称
     * @param message 消息内容
     */
    async publish(channel: string, message: string): Promise<number> {
        return this.redisClient.publish(channel, message);
    }

    /**
     * 订阅指定频道
     * @param channel 频道名称
     * @param callback 消息回调函数
     */
    async subscribe(
        channel: string,
        callback: (message: string, channel: string) => void,
    ): Promise<void> {
        const subscriber = this.redisClient.duplicate();
        await subscriber.connect();
        await subscriber.subscribe(channel, (message, channel) => {
            callback(message, channel);
        });
    }

    /**
     * 关闭Redis连接
     */
    async onModuleDestroy() {
        if (this.redisClient && this.isConnected) {
            await this.redisClient.quit();
            this.isConnected = false;
            TerminalLogger.info("Redis", "连接已关闭");
        }
    }
}
