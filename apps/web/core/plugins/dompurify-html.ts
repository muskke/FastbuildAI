import VueDOMPurifyHTML from "vue-dompurify-html";

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.use(VueDOMPurifyHTML, {
        namedConfigurations: {
            plaintext: {
                USE_PROFILES: { html: false },
            },
            // Markdown 渲染配置：允许 style 属性以保留 Shiki 内联样式
            markdown: {
                ADD_ATTR: ["style"],
            },
        },
    });
});
