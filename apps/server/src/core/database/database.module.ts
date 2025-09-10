import { appConfig } from "@common/config/app.config";
import { User } from "@common/modules/auth/entities/user.entity";
import { DictModule } from "@common/modules/dict/dict.module";
import { Dict } from "@common/modules/dict/entities/dict.entity";
import { TerminalLogger } from "@common/utils/log.util";
import { table3BorderStyle } from "@fastbuildai/config/ui/table";
import { AiModel } from "@modules/console/ai/entities/ai-model.entity";
import { AiProvider } from "@modules/console/ai/entities/ai-provider.entity";
import { DecorateModule } from "@modules/console/decorate/decorate.module";
import { KeyTemplate } from "@modules/console/key-manager/entities/key-template.entity";
import { Payconfig } from "@modules/console/system/entities/payconfig.entity";
import { AiModule } from "@modules/web/ai/ai.module";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import chalk from "chalk";
import Table from "cli-table3";
import { DataSource, EntityMetadata, Logger as TypeOrmLogger } from "typeorm";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

import { Menu } from "@/modules/console/menu/entities/menu.entity";
import { MenuModule } from "@/modules/console/menu/menu.module";
import { PermissionModule } from "@/modules/console/permission/permission.module";

import { DatabaseInitService } from "./database-init.service";

/**
 * 自定义 TypeORM 日志记录器
 *
 * 用于记录数据库操作的详细信息，特别是表同步信息
 */
class CustomLogger implements TypeOrmLogger {
    log(level: "log" | "info" | "warn", message: any): void {
        if (message && typeof message === "string" && message.includes("synchronize schema")) {
            TerminalLogger.info("Database", "Starting database schema synchronization...");
        }
    }

    logQuery(query: string): void {
        // 检测创建表的查询
        if (query.includes("CREATE TABLE")) {
            const tableName = query.match(/CREATE TABLE "?([^\s"]+)"?/)?.[1];
            if (tableName) {
                TerminalLogger.log("Table", `${tableName} created or updated`);
            }
        }
        // 检测添加外键的查询
        else if (query.includes("ADD CONSTRAINT") && query.includes("FOREIGN KEY")) {
            const match = query.match(
                /ADD CONSTRAINT "?([^\s"]+)"? FOREIGN KEY.*REFERENCES "?([^\s"(]+)"?/s,
            );
            if (match && match.length >= 3) {
                const constraintName = match[1];
                const referencedTable = match[2];
                TerminalLogger.log(
                    "Foreign Key",
                    `${constraintName} added, references table ${referencedTable}`,
                );
            }
        }
        // 检测添加索引的查询
        else if (query.includes("CREATE INDEX")) {
            const indexMatch = query.match(/CREATE INDEX "?([^\s"]+)"? ON "?([^\s"]+)"?/i);
            if (indexMatch && indexMatch.length >= 3) {
                const indexName = indexMatch[1];
                const tableName = indexMatch[2];
                TerminalLogger.log("Index", `${indexName} added to table ${tableName}`);
            }
        }
    }

    logQueryError(error: string | Error, query: string): void {
        TerminalLogger.error("Query Error", error.toString());
        TerminalLogger.error("Failed Query", query);
    }

    logQuerySlow(time: number, query: string): void {
        TerminalLogger.warn("Slow Query", `(${time}ms): ${query}`);
    }

    logMigration(message: string): void {
        TerminalLogger.info("Migration", message);
    }

    logSchemaBuild(message: string): void {
        TerminalLogger.info("Schema Build", message);
    }

    logClear(): void {
        // 不做任何操作
    }
}

/**
 * 打印数据源中注册的实体信息
 * @param dataSource 数据源
 * @param name 数据源名称
 */
async function printEntityTable(dataSource: DataSource): Promise<void> {
    const entities = dataSource.entityMetadatas;

    if (entities.length === 0) {
        TerminalLogger.warn(`Entities`, "No entities registered");
        return;
    }

    // 创建表格
    const table = new Table({
        chars: table3BorderStyle,
        head: ["表名", "实体名", "注释", "模块", "列数", "关系数", "索引数"],
        style: {
            head: ["cyan"],
            border: ["gray"],
        },
    });

    // 对实体按模块分组排序
    const sortedEntities = [...entities].sort((a, b) => {
        const moduleA = getEntityModule(a);
        const moduleB = getEntityModule(b);
        return moduleA.localeCompare(moduleB);
    });

    // 添加实体信息到表格
    for (let i = 0; i < sortedEntities.length; i++) {
        const entity = sortedEntities[i];
        table.push([
            chalk.magenta(entity.tableName),
            entity.name,
            entity.comment || "-",
            getEntityModule(entity),
            entity.columns.length.toString(),
            entity.relations.length.toString(),
            entity.indices.length.toString(),
        ]);
    }

    // 打印表格
    TerminalLogger.log("", `DataSource(${entities.length}):`);
    console.log(table.toString());
}

/**
 * 获取实体所属的模块名称
 * @param entity 实体元数据
 * @returns 模块名称
 */
function getEntityModule(entity: EntityMetadata): string {
    return entity.tableName.startsWith(process.env.DB_TABLE_PREFIX) ? "系统" : "插件";
}

/**
 * 数据库模块
 *
 * 负责配置和管理与数据库的连接
 * 使用 TypeORM 作为 ORM 框架
 * 从环境变量中读取数据库配置
 */
@Module({
    imports: [
        // DatabaseSyncModule,
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [],
            useFactory: () => {
                return {
                    ...appConfig.database,
                    logger: new CustomLogger(),
                    entities: [
                        "dist/common/**/*.entity.js",
                        "dist/modules/**/*.entity.js",
                        "dist/core/**/*.entity.js",
                        // "dist/plugins/**/*.entity.js",
                    ],
                    synchronize: appConfig.database.synchronize,
                };
            },
            dataSourceFactory: async (options: PostgresConnectionOptions) => {
                const dataSource = await new DataSource({
                    ...options,
                    logging: false,
                }).initialize();

                // 查询并打印数据库类型和版本信息
                try {
                    const dbInfoResult = await dataSource.query("SELECT VERSION() as version");
                    const dbVersion = dbInfoResult[0]?.version;

                    TerminalLogger.info(
                        "PgSQL Version",
                        dbVersion
                            ? dbVersion.match(/PostgreSQL\s+(\d+(?:\.\d+)?)/)[1]
                            : "Unknown version",
                    );
                } catch (error) {
                    TerminalLogger.error("Database Error", `Get version failed: ${error.message}`);
                }

                TerminalLogger.success("PgSQL Status", "Connected");

                TerminalLogger.log("Db Sync", options.synchronize ? "ON" : "OFF", {
                    color: "magenta",
                });

                if (process.env.LOG_DATABASE_SCHEMA === "true") {
                    printEntityTable(dataSource);
                }

                return dataSource;
            },
        }),
        MenuModule,
        PermissionModule,
        DictModule,
        DecorateModule,
        TypeOrmModule.forFeature([User, Menu, Payconfig, Dict, AiProvider, AiModel, KeyTemplate]),
    ],
    controllers: [],
    providers: [DatabaseInitService],
    exports: [DatabaseInitService],
})
export class DatabaseModule {}
