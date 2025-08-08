import { createResolver, defineNuxtModule } from "@nuxt/kit";

import { languageOptions } from "../i18n/language";

export default defineNuxtModule({
    async setup(options, nuxt) {
        const { resolve } = createResolver(import.meta.url);

        nuxt.hook("i18n:registerModule", (register) => {
            register({
                langDir: resolve("../i18n"),
                locales: languageOptions.map((locale) => ({
                    code: locale.code,
                    file: "index.ts",
                })),
            });
        });
    },
});
