export default defineNuxtPlugin(async () => {
    // 仅客户端执行的预加载逻辑
    if (import.meta.env.SSR) return;

    const shikiUrl =
        (globalThis as any).NUXT_PUBLIC_SHIKI_CDN || "https://esm.sh/shiki@3.7.0?bundle";
    const mermaidUrl =
        (globalThis as any).NUXT_PUBLIC_MERMAID_CDN || "https://esm.sh/mermaid@9.1.7?bundle";
    const katexUrl =
        (globalThis as any).NUXT_PUBLIC_KATEX_CDN || "https://esm.sh/katex@0.16.21?bundle";

    try {
        await Promise.allSettled([
            import(/* @vite-ignore */ shikiUrl),
            import(/* @vite-ignore */ mermaidUrl),
            import(/* @vite-ignore */ katexUrl),
        ]);
    } catch (e) {
        // 忽略错误，渲染时各插件自带容错
    }
});
