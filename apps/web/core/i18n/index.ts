import { generateMessagesForLocale } from "./generate-locales";

export default defineI18nLocale(async (locale) => {
    return await generateMessagesForLocale(locale);
});
