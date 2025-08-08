import js from "@eslint/js";
import { config as baseConfig } from "@fastbuildai/config/eslint/base";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";
import { fileURLToPath } from "url";
import path from "path";

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig([
    // 排除 .d.ts 文件
    { files: ["**/*.{js,mjs,cjs,ts,d.ts}"], plugins: { js }, extends: ["js/recommended"] },
    {
        files: ["**/*.{js,mjs,cjs,ts,d.ts}"],
        languageOptions: {
            globals: { ...globals.node, ...globals.jest },
            parserOptions: {
                project: "./tsconfig.json",
                tsconfigRootDir: __dirname,
                sourceType: "module",
            },
        },
    },
    tseslint.configs.recommended,
    {
        files: ["**/*.{js,mjs,cjs,ts,d.ts}"],
        rules: {
            // 从旧配置迁移的规则
            "@typescript-eslint/interface-name-prefix": "off",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": "warn",
            "prefer-const": "off",
        },
    },
    ...baseConfig,
]);
