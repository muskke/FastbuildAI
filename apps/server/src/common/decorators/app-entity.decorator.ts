import chalk from "chalk";
import { Entity, EntityOptions } from "typeorm";

import { checkIfPathInStack, findStackTargetFile } from "../utils/helper.util";
import { getTablePrefix } from "../utils/table-name.util";

/**
 * 应用实体装饰器
 *
 * @param name 实体名称
 * @returns 装饰器函数
 *
 * @example
 * ```typescript
 * // 假设环境变量 DB_TABLE_PREFIX=fastbuild_
 *
 * // 基本用法
 * @AppEntity('user')
 * export class User {
 *   @PrimaryColumn({
 *     type: "uuid",
 *     default: () => "gen_random_uuid()",
 *   })
 *   id: string;
 *
 *   @Column()
 *   username: string;
 * }
 * // 生成的表名为: fastbuild_user
 *
 * // 注意：此装饰器不能在插件目录下使用
 * // 插件实体应使用 @PluginEntity 装饰器
 * ```
 */
export function AppEntity(options?: string | EntityOptions): ClassDecorator {
    return function (target: any) {
        // 获取错误堆栈，用于检查调用位置
        const stackCallerFile = findStackTargetFile([".entity.js"]);

        if (checkIfPathInStack([".entity.js"], ["/dist/plugins/"])) {
            console.error(
                chalk.bgRed("\nError"),
                chalk.red(
                    "@AppEntity装饰器不能在插件目录下使用\n" +
                        "请使用@PluginEntity装饰器。插件实体应该使用@PluginEntity装饰器来确保表名前缀正确。\n" +
                        `错误文件: ${stackCallerFile}\n`,
                ),
            );

            // 直接退出程序，返回到终端
            console.error(chalk.bgRed("Error"), "程序已终止");
            // 使用退出码 1 表示错误退出
            process.exit(1);
        }

        // 根据options类型确定表名
        let tableName: string;
        if (typeof options === "string") {
            // 如果options是字符串，直接使用
            tableName = getTablePrefix(options);
        } else if (options && typeof options === "object" && options.name) {
            // 如果options是对象且有name属性，使用name
            tableName = getTablePrefix(options.name);
        } else {
            // 如果没有提供表名，使用类名（转换为snake_case）
            const className = target.name
                .replace(/([A-Z])/g, "_$1")
                .toLowerCase()
                .slice(1);
            tableName = getTablePrefix(className);
        }

        // 应用原生Entity装饰器
        if (typeof options === "object" && options) {
            // 如果是EntityOptions对象，保持其他选项并更新name
            Entity({ ...options, name: tableName })(target);
        } else {
            // 如果是字符串或undefined，直接传递表名
            Entity(tableName)(target);
        }
    };
}
