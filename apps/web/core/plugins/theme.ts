import { STORAGE_KEYS } from "@/common/constants/storage.constant";

export default defineNuxtPlugin({
    enforce: "post",
    setup() {
        const appConfig = useAppConfig();
        const blackAsPrimary = useCookie(STORAGE_KEYS.NUXT_UI_BLACK_AS_PRIMARY);
        const radius = useCookie(STORAGE_KEYS.NUXT_UI_RADIUS);
        const primary = useCookie(STORAGE_KEYS.NUXT_UI_PRIMARY);
        const neutral = useCookie(STORAGE_KEYS.NUXT_UI_NEUTRAL);

        if (blackAsPrimary.value) {
            appConfig.theme.blackAsPrimary = Boolean(blackAsPrimary.value);
        }

        if (primary.value) {
            appConfig.ui.colors.primary = primary.value;
        }

        if (neutral.value) {
            appConfig.ui.colors.neutral = neutral.value;
        }

        if (radius.value) {
            appConfig.theme.radius = Number.parseFloat(radius.value);
        }
    },
});
