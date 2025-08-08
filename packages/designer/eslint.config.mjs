import { config as baseConfig } from "@fastbuildai/config/eslint/base";
import { config as httpConfig } from "@fastbuildai/config/eslint/http";
import vuePlugin from "eslint-plugin-vue";
import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";

/** @type {import("eslint").Linter.Config} */
export default [
    // 忽略规则 - 排除自动生成的代码和构建目录
    {
        ignores: [".nuxt/**", ".output/**", "dist/**", "node_modules/**"],
    },

    // TypeScript 推荐配置
    ...tseslint.configs.recommended,

    // Vue 相关配置
    {
        files: ["**/*.vue"],
        plugins: {
            vue: vuePlugin,
        },
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: tseslint.parser,
                extraFileExtensions: [".vue"],
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        rules: {
            "vue/multi-word-component-names": "off",
            "vue/no-unused-vars": "off",
            "vue/no-unused-components": "off",
            "vue/require-default-prop": "off",
            "vue/no-v-html": "off",
            "vue/eqeqeq": "off",
            "vue/block-order": [
                "error",
                {
                    order: ["script", "template", "style"],
                },
            ],
        },
    },

    // TypeScript 文件配置
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parser: tseslint.parser,
        },
    },

    // 全局规则 - 关闭常见的全局变量未定义警告
    {
        rules: {
            "no-undef": "off", // 关闭未定义变量的警告，因为有自动导入
            "@typescript-eslint/no-unused-expressions": "off", // 允许使用短路表达式作为语句
            "@typescript-eslint/no-explicit-any": "warn", // 将 any 类型改为警告
        },
    },

    // 全局 eslint 配置
    ...baseConfig,

    // HTTP规则配置
    ...httpConfig,
];
