#!/usr/bin/env node

/**
 * 自动翻译工具入口脚本
 *
 * 使用方法：
 * 1. 手动安装依赖: `pnpm add bing-translate-api ts-node --save-dev -w`
 * 2. 运行脚本: `node libs/translate-i18n.mjs`
 *
 * 本脚本会自动读取中文翻译文件，并生成或更新其他语言的对应文件
 * 支持翻译核心模块和插件模块的国际化文件
 */

import { translate } from "bing-translate-api";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 定义常量
const CORE_I18N_DIR = path.resolve(__dirname, "../core/i18n");
const PLUGINS_DIR = path.resolve(__dirname, "../plugins");
const SOURCE_LANG = "zh";

/**
 * 从language.ts中获取语言定义
 */
function getLanguageDefinitions() {
    try {
        // 使用ts-node执行一个临时脚本来获取语言定义
        const tempFile = path.join(__dirname, "_temp_get_languages.cjs");

        // 创建临时脚本
        fs.writeFileSync(
            tempFile,
            `
const fs = require('fs');
const path = require('path');

// 读取language.ts文件
const languagePath = path.resolve('${CORE_I18N_DIR}', 'language.ts');
const content = fs.readFileSync(languagePath, 'utf8');

// 提取Language常量定义
const languageMatch = content.match(/export const Language = ({[\\s\\S]*?}) as const;/);
if (!languageMatch) process.exit(1);

// 提取languageOptions数组
const optionsMatch = content.match(/export const languageOptions: LanguageOption\\[\\] = (\\[[\\s\\S]*?\\]);/);
if (!optionsMatch) process.exit(1);

// 先定义Language常量，然后输出JSON格式
const Language = eval('(' + languageMatch[1] + ')');
console.log(JSON.stringify({
    language: Language,
    options: eval('(' + optionsMatch[1].replace(/\\b(code|name|icon|translationCode):/g, '"$1":') + ')')
}));
        `,
            "utf8",
        );

        // 执行临时脚本获取语言定义
        const output = execSync(`node ${tempFile}`, { encoding: "utf8" });

        // 删除临时脚本
        fs.unlinkSync(tempFile);

        // 解析输出
        const languages = JSON.parse(output);

        return languages;
    } catch (error) {
        console.error("❌ 无法获取语言定义:", error);
        return {
            language: { ZH_HANS: "zh", EN_US: "en" },
            options: [
                { code: "zh", name: "简体中文", translationCode: "zh" },
                { code: "en", name: "English", translationCode: "en" },
            ],
        };
    }
}

// 获取语言定义
const languages = getLanguageDefinitions();
console.log(`📋 从language.ts中读取到的语言定义:`);
console.log(languages.options.map((opt) => `  - ${opt.name} (${opt.code})`).join("\n"));

// 设置目标语言
const SOURCE_LANG_OBJ = languages.language.ZH_HANS;
const TARGET_LANGS = languages.options
    .map((opt) => opt.code)
    .filter((code) => code !== SOURCE_LANG_OBJ);

// 语言代码映射 - 从languageOptions中提取
const LANG_CODE_MAP = languages.options.reduce((map, option) => {
    map[option.code] = option.translationCode || option.code;
    return map;
}, {});

/**
 * 按照源对象的键顺序重新排序目标对象
 */
function reorderObjectBySource(sourceObj, targetObj) {
    const result = {};

    // 按照源对象的键顺序遍历
    for (const key of Object.keys(sourceObj)) {
        if (Object.prototype.hasOwnProperty.call(targetObj, key)) {
            if (
                typeof sourceObj[key] === "object" &&
                sourceObj[key] !== null &&
                !Array.isArray(sourceObj[key])
            ) {
                // 递归处理嵌套对象
                result[key] = reorderObjectBySource(sourceObj[key], targetObj[key]);
            } else {
                // 直接赋值
                result[key] = targetObj[key];
            }
        }
    }

    return result;
}

/**
 * 深度翻译对象中缺失的键
 */
async function translateMissingKeyDeeply(sourceObj, targetObj, toLanguage) {
    await Promise.all(
        Object.keys(sourceObj).map(async (key) => {
            if (targetObj[key] === undefined) {
                if (typeof sourceObj[key] === "object" && sourceObj[key] !== null) {
                    targetObj[key] = {};
                    await translateMissingKeyDeeply(sourceObj[key], targetObj[key], toLanguage);
                } else {
                    try {
                        const source = sourceObj[key];
                        if (!source) {
                            targetObj[key] = "";
                            return;
                        }

                        // 不支持翻译含括号的内容
                        if (
                            typeof source === "string" &&
                            (source.includes("(") || source.includes(")"))
                        ) {
                            targetObj[key] = source;
                            return;
                        }

                        // 执行翻译
                        console.log(
                            `翻译: "${String(source).substring(0, 30)}${String(source).length > 30 ? "..." : ""}" 到 ${toLanguage}`,
                        );
                        const result = await translate(
                            source,
                            null,
                            LANG_CODE_MAP[toLanguage] || toLanguage,
                        );
                        targetObj[key] = result?.translation || source;
                    } catch (error) {
                        console.error(
                            `翻译错误 "${sourceObj[key]}"(${key}) 到 ${toLanguage}`,
                            error,
                        );
                        targetObj[key] = sourceObj[key];
                    }
                }
            } else if (typeof sourceObj[key] === "object" && sourceObj[key] !== null) {
                targetObj[key] = targetObj[key] || {};
                await translateMissingKeyDeeply(sourceObj[key], targetObj[key], toLanguage);
            }
        }),
    );
}

/**
 * 翻译单个文件
 */
async function translateFile(fileName, sourceLang, targetLang, i18nDir) {
    try {
        // 构建文件路径
        const sourceFile = path.join(i18nDir, sourceLang, `${fileName}.json`);
        const targetFile = path.join(i18nDir, targetLang, `${fileName}.json`);

        // 检查源文件是否存在
        if (!fs.existsSync(sourceFile)) {
            throw new Error(`源文件不存在: ${sourceFile}`);
        }

        // 读取源文件
        const sourceContent = fs.readFileSync(sourceFile, "utf8");
        const sourceObj = JSON.parse(sourceContent);

        // 读取或创建目标文件
        let targetObj = {};
        if (fs.existsSync(targetFile)) {
            const targetContent = fs.readFileSync(targetFile, "utf8");
            targetObj = JSON.parse(targetContent);
        }

        // 翻译缺失的键
        await translateMissingKeyDeeply(sourceObj, targetObj, targetLang);

        // 按照源文件的字段顺序重新排序目标对象
        const reorderedTargetObj = reorderObjectBySource(sourceObj, targetObj);

        // 确保目标目录存在
        const targetDir = path.dirname(targetFile);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // 写入更新后的目标文件
        fs.writeFileSync(targetFile, JSON.stringify(reorderedTargetObj, null, 4), "utf8");

        console.log(`✅ 成功翻译 ${fileName}.json 从 ${sourceLang} 到 ${targetLang}`);
        return true;
    } catch (error) {
        console.error(`❌ 处理文件失败: ${fileName}`, error);
        return false;
    }
}

/**
 * 获取指定语言目录下的所有文件
 */
function getLanguageFiles(langDir) {
    if (!fs.existsSync(langDir)) {
        return [];
    }

    return fs
        .readdirSync(langDir)
        .filter((file) => file.endsWith(".json"))
        .map((file) => file.replace(/\.json$/, ""));
}

/**
 * 获取所有插件目录
 */
function getPluginDirectories() {
    if (!fs.existsSync(PLUGINS_DIR)) {
        return [];
    }

    return fs
        .readdirSync(PLUGINS_DIR)
        .filter((item) => {
            const pluginPath = path.join(PLUGINS_DIR, item);
            const i18nPath = path.join(pluginPath, "i18n");
            return fs.statSync(pluginPath).isDirectory() && fs.existsSync(i18nPath);
        })
        .map((pluginName) => ({
            name: pluginName,
            path: path.join(PLUGINS_DIR, pluginName),
            i18nPath: path.join(PLUGINS_DIR, pluginName, "i18n"),
        }));
}

/**
 * 翻译指定目录的国际化文件
 */
async function translateI18nDirectory(i18nDir, dirName) {
    // 获取源语言目录下的所有文件
    const sourceDir = path.join(i18nDir, SOURCE_LANG);
    const files = getLanguageFiles(sourceDir);

    if (files.length === 0) {
        console.log(`⚠️ 在 ${sourceDir} 中未找到JSON文件`);
        return;
    }

    console.log(`\n📁 处理目录: ${dirName}`);
    console.log(`📝 找到 ${files.length} 个源语言文件: ${files.join(", ")}`);

    // 逐个文件翻译
    for (const file of files) {
        console.log(`\n🔄 处理文件: ${file}.json`);
        for (const targetLang of TARGET_LANGS) {
            if (targetLang !== SOURCE_LANG) {
                await translateFile(file, SOURCE_LANG, targetLang, i18nDir);
            }
        }
    }
}

/**
 * 主函数
 */
async function main() {
    try {
        console.log(`🔄 开始执行自动翻译...`);
        console.log(`📚 源语言: ${SOURCE_LANG}`);
        console.log(`🌐 目标语言: ${TARGET_LANGS.join(", ")}`);

        // 1. 翻译核心模块的国际化文件
        if (fs.existsSync(CORE_I18N_DIR)) {
            await translateI18nDirectory(CORE_I18N_DIR, "核心模块");
        } else {
            console.log(`⚠️ 核心i18n目录不存在: ${CORE_I18N_DIR}`);
        }

        // 2. 翻译所有插件的国际化文件
        const plugins = getPluginDirectories();
        if (plugins.length > 0) {
            console.log(`\n🔌 发现 ${plugins.length} 个插件:`);
            plugins.forEach((plugin) => {
                console.log(`  - ${plugin.name}`);
            });

            for (const plugin of plugins) {
                await translateI18nDirectory(plugin.i18nPath, `插件: ${plugin.name}`);
            }
        } else {
            console.log(`\n⚠️ 未发现任何包含i18n目录的插件`);
        }

        console.log(`\n✅ 批量翻译完成!`);
    } catch (error) {
        console.error(`❌ 脚本执行错误:`, error);
        process.exit(1);
    }
}

// 执行主函数
main().catch((error) => {
    console.error(`❌ 未捕获错误:`, error);
    process.exit(1);
});
