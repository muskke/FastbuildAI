import { NamingStrategyInterface } from "typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

/**
 * 应用配置接口
 */
export interface AppConfig {
    /** 应用名称 */
    name: string;

    /** 应用版本 */
    version: string;

    /**
     * 数据库配置
     */
    database: {
        /** 数据库类型 */
        type: "postgres";
        /** 数据库主机地址 */
        host: string;
        /** 数据库端口 */
        port: number;
        /** 数据库用户名 */
        username: string;
        /** 数据库密码 */
        password: string;
        /** 数据库名称 */
        database: string;
        /** 是否自动同步实体到数据库 */
        synchronize: boolean;
        /** 是否启用日志 */
        logging: boolean;
        /** 数据库命名策略 */
        namingStrategy: NamingStrategyInterface;
    };
}

export const appConfig: AppConfig = {
    name: process.env.APP_NAME || "FastbuildAI",
    version: process.env.APP_VERSION || "1.0.0-beta.1",
    database: {
        type: process.env.DB_TYPE as "postgres",
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        synchronize: process.env.DB_SYNCHRONIZE === "true",
        logging: process.env.DB_LOGGING === "true",
        namingStrategy: new SnakeNamingStrategy(),
    },
};

// 导出表格样式配置以保持向后兼容
