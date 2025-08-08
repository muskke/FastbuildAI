import { getPackageJsonSync } from "@common/utils/system.util";
import chalk from "chalk";
import * as fse from "fs-extra";
import * as path from "path";
import { Entity, EntityOptions } from "typeorm";

import { checkIfPathInStack, findStackTargetFile, kebabToSnake } from "../utils/helper.util";

/**
 * 插件实体装饰器
 *
 * 自动拼接插件包名和实体名称
 * 例如：@PluginEntity("test") => @Entity("plugin_key_test")
 *
 * @param name 实体名称
 * @returns 装饰器函数
 *
 * @example
 * ```typescript
 * // 假设插件包名为 article-plugin
 * // 在插件目录下的实体文件中
 *
 * // src/plugins/article-plugin/entities/article.entity.ts
 * @PluginEntity('article')
 * export class Article {
 *   @PrimaryColumn({
 *     type: "uuid",
 *     default: () => "gen_random_uuid()",
 *   })
 *   id: string;
 *
 *   @Column()
 *   title: string;
 *
 *   @Column('text')
 *   content: string;
 * }
 * // 生成的表名为: article_plugin_article
 *
 * // 注意：此装饰器只能在插件目录下使用
 * // 主程序实体应使用 @AppEntity 装饰器
 * ```
 */
export function PluginEntity(options?: string | EntityOptions): ClassDecorator {
    return function (target: any) {
        // 获取错误堆栈，用于检查调用位置
        const stackCallerFile = findStackTargetFile([".entity.js"]);

        // 检查是否在非插件目录下使用
        // 使用正斜杠格式的路径，在helper.util.ts中会进行跨平台转换
        if (!checkIfPathInStack([".entity.js"], ["/dist/plugins/"])) {
            console.error(
                chalk.bgRed("\nError"),
                chalk.red(
                    "@PluginEntity装饰器不能在非插件目录下使用\n" +
                        "请使用@AppEntity装饰器。主程序实体应该使用@AppEntity装饰器来确保表名前缀正确。\n" +
                        `错误文件: ${stackCallerFile}\n`,
                ),
            );

            // 直接退出程序，返回到终端
            console.error(chalk.bgRed("Error"), "程序已终止");
            // 使用退出码 1 表示错误退出
            return process.exit(1);
        }

        // 从文件路径中提取插件信息
        if (stackCallerFile.length === 1) {
            // 提取插件目录（统一使用正斜杠格式化路径）
            const normalizedPath = stackCallerFile[0];
            const pluginsStr = "/plugins/";
            const pluginsIndex = normalizedPath.indexOf(pluginsStr);
            if (pluginsIndex !== -1) {
                // 从路径中提取插件目录名
                const pluginPath = normalizedPath.substring(pluginsIndex + pluginsStr.length);
                const parts = pluginPath.split("/");
                const pluginDir = parts[0]; // 获取插件目录名

                // 从插件目录中读取package.json
                try {
                    const packageJsonPath = path.join(
                        process.cwd(),
                        "dist",
                        "plugins",
                        pluginDir,
                        "package.json",
                    );

                    if (fse.existsSync(packageJsonPath)) {
                        const packageJson = getPackageJsonSync(packageJsonPath);
                        if (packageJson.name === process.env.DB_TABLE_PREFIX) {
                            throw new Error(
                                `插件包名不能为${process.env.DB_TABLE_PREFIX}，请检查插件的package.json配置`,
                            );
                        }
                        if (packageJson.name) {
                            // 根据options类型确定表名
                            let tableName: string;
                            if (typeof options === "string") {
                                // 如果options是字符串，直接使用
                                tableName = `${kebabToSnake(packageJson.name)}_${options}`;
                            } else if (options && typeof options === "object" && options.name) {
                                // 如果options是对象且有name属性，使用name
                                tableName = `${kebabToSnake(packageJson.name)}_${options.name}`;
                            } else {
                                // 如果没有提供表名，使用类名（转换为snake_case）
                                const className = target.name
                                    .replace(/([A-Z])/g, "_$1")
                                    .toLowerCase()
                                    .slice(1);
                                tableName = `${kebabToSnake(packageJson.name)}_${className}`;
                            }

                            // 应用原生Entity装饰器
                            if (typeof options === "object" && options) {
                                // 如果是EntityOptions对象，保持其他选项并更新name
                                Entity({ ...options, name: tableName })(target);
                            } else {
                                // 如果是字符串或undefined，直接传递表名
                                Entity(tableName)(target);
                            }
                            return;
                        }
                    }
                } catch (error) {
                    console.error("获取插件包名失败:", error);
                }
            }
        }

        // 如果所有方法都失败，抛出异常
        console.error(
            chalk.bgRed("\nError"),
            chalk.red(
                `@PluginEntity装饰器被错误的调用，请检查调用位置\n` +
                    `实体文件: ${stackCallerFile}\n`,
            ),
        );
        return process.exit(1);
    };
}
