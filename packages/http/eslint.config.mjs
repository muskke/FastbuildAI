import { config } from "@fastbuildai/config/eslint/base";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import { defineConfig } from "eslint/config";

/** @type {import("eslint").Linter.Config} */
export default defineConfig([
    ...config,
    {
        plugins: {
            "@typescript-eslint": typescriptPlugin,
        },
    },
]);
