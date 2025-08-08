/**
 * 自定义 HTTP 安全规则插件：禁止使用 fetch / XMLHttpRequest / EventSource
 * @type {import("eslint").Linter.FlatConfig}
 */

const EXCLUDED_FILES = ["auto-update-version.ts"];

const noNativeHttpRule = {
    meta: {
        type: "problem",
        docs: {
            description: "禁止使用原生HTTP API，请使用封装的HTTP客户端",
            recommended: true,
        },
        messages: {
            noFetch: "禁止直接使用 fetch API，请使用 http 客户端",
            noXhr: "禁止直接使用 XMLHttpRequest，请使用 http 客户端",
            noEventSource: "禁止直接使用 EventSource，请使用 http.sse 方法",
            noGlobalThis: "禁止通过 globalThis/self/window 访问 HTTP API",
        },
        schema: [],
    },

    create(context) {
        const filename = context.getFilename();
        const isExcluded = EXCLUDED_FILES.some((f) => filename.endsWith(f));
        if (isExcluded) return {};

        const reportIfMatch = (node, name, messageId) => {
            if (node.callee?.type === "Identifier" && node.callee.name === name) {
                context.report({ node, messageId });
            }
        };

        return {
            CallExpression(node) {
                reportIfMatch(node, "fetch", "noFetch");
            },
            NewExpression(node) {
                reportIfMatch(node, "XMLHttpRequest", "noXhr");
                reportIfMatch(node, "EventSource", "noEventSource");
            },
            MemberExpression(node) {
                const objName = node.object?.name;
                const propName = node.property?.name;
                if (
                    ["window", "globalThis", "self"].includes(objName) &&
                    ["fetch", "XMLHttpRequest", "EventSource"].includes(propName)
                ) {
                    context.report({ node, messageId: "noGlobalThis" });
                }
            },
        };
    },
};

export const config = [
    {
        plugins: {
            http: {
                rules: {
                    "no-native-http": noNativeHttpRule,
                },
            },
        },
        rules: {
            // ✅ 严格设为 error
            "http/no-native-http": "error",
        },
    },
];
