import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginPrettier from "eslint-plugin-prettier";
import turboPlugin from "eslint-plugin-turbo";
import onlyWarn from "eslint-plugin-only-warn";
import simpleImportSort from "eslint-plugin-simple-import-sort";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
    js.configs.recommended,
    eslintConfigPrettier,
    {
        plugins: {
            turbo: turboPlugin,
        },
        rules: {
            "turbo/no-undeclared-env-vars": "warn",
        },
    },
    {
        plugins: {
            onlyWarn,
        },
    },
    {
        plugins: {
            "simple-import-sort": simpleImportSort,
        },
        rules: {
            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error",
        },
    },
    {
        ignores: ["dist/**"],
        rules: {
            "@typescript-eslint/no-unused-vars": "off",
            "no-unused-vars": "off",
            "no-undef": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/ban-types": "off",
        },
    },
    {
        plugins: {
            prettier: eslintPluginPrettier,
        },
        rules: {
            "prettier/prettier": "error",
        },
    },
];
