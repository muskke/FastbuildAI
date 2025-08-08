import type { SiteConfig } from "@/models/global";
import { apiGetSiteConfig } from "@/services/common";

export const useAppStore = defineStore("app", () => {
    const siteConfig = ref<SiteConfig | null>(null);
    const loginWay = reactive({
        loginAgreement: true,
        coerceMobile: 0,
        defaultLoginWay: 1,
    });

    const getConfig = async () => {
        try {
            siteConfig.value = await apiGetSiteConfig();
            return siteConfig.value;
        } catch (error) {
            console.error("获取网站配置失败:", error);
            return null;
        }
    };

    /**
     * 获取图片URL
     * @description 处理图片URL的转换，支持相对路径转绝对路径等
     * @param imageUrl 原始图片URL
     * @returns 处理后的图片URL
     */
    const getImageUrl = (imageUrl: string): string => {
        if (!imageUrl) return "";

        // 如果是完整的URL，直接返回
        if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
            return imageUrl;
        }

        // 如果是base64，直接返回
        if (imageUrl.startsWith("data:")) {
            return imageUrl;
        }

        // 处理相对路径，添加基础URL（根据实际需求调整）
        // 这里可以根据实际配置或环境变量来设置基础URL
        const baseUrl = "";
        return baseUrl ? `${baseUrl}${imageUrl}` : imageUrl;
    };

    return {
        siteConfig,
        loginWay,

        getConfig,
        getImageUrl,
    };
});
