/**
 * 获取带前缀的表名
 *
 * 自动拼接环境变量中定义的表前缀和表名
 * 例如：getTableName("user") => "prefix_user"
 *
 * @param name 表名
 * @returns 带前缀的表名
 */
export function getTablePrefix(name: string): string {
    // 从环境变量中获取表前缀
    let tablePrefix = process.env.DB_TABLE_PREFIX;

    // 处理表前缀格式
    if (tablePrefix) {
        // 检查前缀格式是否符合要求（xxx_xxx_，可以有多段xxx，至少是xxx_）
        const prefixRegex = /^([a-zA-Z0-9]+_)+$/;

        if (!prefixRegex.test(tablePrefix)) {
            // 如果不符合要求，进行处理

            // 1. 移除非法字符，只保留字母、数字和下划线
            tablePrefix = tablePrefix.replace(/[^a-zA-Z0-9_]/g, "");

            // 2. 确保至少有一个段落（xxx_）
            if (!tablePrefix.includes("_")) {
                tablePrefix = tablePrefix + "_";
            }

            // 3. 确保以下划线结尾
            if (!tablePrefix.endsWith("_")) {
                tablePrefix = tablePrefix + "_";
            }
        }
    }

    // 拼接表名
    return tablePrefix + name;
}
