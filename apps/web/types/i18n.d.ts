import { Composer } from "vue-i18n";

/**
 * 扩展 Vue 类型，添加全局注入的 i18n 方法
 */
declare module "vue" {
    interface ComponentCustomProperties {
        /**
         * 全局翻译函数
         */
        $t: Composer["t"];
        /**
         * 全局语言选择器
         */
        $locale: Composer["locale"];
    }
}
