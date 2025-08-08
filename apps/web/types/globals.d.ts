declare module "@fastbuildai/ui/components/*" {
    import { DefineComponent } from "vue";
    const component: DefineComponent<any, any, any>;
    export default component;
}

declare module "@fastbuildai/ui/composables/*" {
    const composable: any;
    export * from "@fastbuildai/ui/composables/*";
}

/** 装修终端创建 网页 / 手机端 */
type DecorateScene = "web" | "mobile";

interface LanguageOption {
    /** 语言标识 */
    code: LanguageCode;
    /** 语言名称 */
    name: string;
    /** 语言图标 */
    icon?: string;
    /** 翻译API使用的语言代码 */
    translationCode: string;
}
