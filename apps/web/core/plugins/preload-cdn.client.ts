export default defineNuxtPlugin(() => {
    // 仅客户端执行的预加载逻辑
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    if (import.meta.env.SSR) return;

    const shikiUrl =
        (globalThis as any).NUXT_PUBLIC_SHIKI_CDN || "https://esm.sh/shiki@3.7.0?bundle";
    const mermaidUrl =
        (globalThis as any).NUXT_PUBLIC_MERMAID_CDN || "https://esm.sh/mermaid@9.1.7?bundle";
    const katexUrl =
        (globalThis as any).NUXT_PUBLIC_KATEX_CDN || "https://esm.sh/katex@0.16.21?bundle";

    // 使用 Web Worker 来预加载模块，完全非阻塞
    if (typeof Worker !== "undefined") {
        try {
            // 创建 Worker 代码
            const workerCode = `
                // Web Worker 内部代码
                const urls = ${JSON.stringify([shikiUrl, mermaidUrl, katexUrl])};

                // 预加载所有模块
                const preloadPromises = urls.map(url => {
                    return import(url).catch(error => {
                        // 静默处理错误，不影响主线程
                        console.debug('[Preload Worker] Failed to preload:', url, error);
                    });
                });

                // 等待所有预加载完成
                Promise.allSettled(preloadPromises).then(() => {
                    // 预加载完成，通知主线程
                    self.postMessage({ type: 'preload_complete' });
                });
            `;

            // 创建 Blob URL
            const blob = new Blob([workerCode], { type: "application/javascript" });
            const workerUrl = URL.createObjectURL(blob);

            // 创建 Worker 实例
            const worker = new Worker(workerUrl);

            // 监听 Worker 消息
            worker.onmessage = (event) => {
                if (event.data.type === "preload_complete") {
                    console.debug("[Preload Plugin] CDN 资源预加载完成");
                    // 预加载完成后的清理工作
                    cleanupWorker();
                }
            };

            // 监听 Worker 错误
            worker.onerror = (error) => {
                console.warn("[Preload Plugin] Worker 执行错误:", error);
                cleanupWorker();
            };

            // 清理函数
            const cleanupWorker = () => {
                try {
                    worker.terminate();
                    URL.revokeObjectURL(workerUrl);
                } catch (e) {
                    console.warn("[Preload Plugin] Worker 清理失败:", e);
                }
            };

            // 设置超时清理，防止 Worker 长时间运行
            setTimeout(cleanupWorker, 30000); // 30秒后自动清理
        } catch (error) {
            console.warn("[Preload Plugin] 创建 Worker 失败，降级到 setTimeout:", error);
            // 降级方案：使用 setTimeout
            fallbackPreload();
        }
    } else {
        // 浏览器不支持 Worker，使用降级方案
        fallbackPreload();
    }

    // 降级预加载方案
    function fallbackPreload() {
        setTimeout(() => {
            Promise.allSettled([
                import(/* @vite-ignore */ shikiUrl),
                import(/* @vite-ignore */ mermaidUrl),
                import(/* @vite-ignore */ katexUrl),
            ]).catch(() => {
                // 忽略错误，渲染时各插件自带容错
            });
        }, 100);
    }
});
