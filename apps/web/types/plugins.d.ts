import type { Component } from "vue";
import type { RouteRecordRaw } from "vue-router";

/**
 * 插件配置
 * @description 定义插件的基本信息和功能
 */
declare global {
    interface PluginConfig {
        /** 插件名称 */
        name: string;
        /** 插件版本 */
        version?: string;
        /** 插件描述 */
        description?: string;
        /** 插件组件列表 */
        components?: PluginComponent[];
        /** 插件权限 */
        permissions?: string[];
        /** 路由配置 */
        routes?: PluginRoutes;
        /** 插件初始化函数 */
        setup?: (context: PluginContext) => Promise<void> | void;
    }

    /**
     * 插件组件
     * @description 定义插件提供的组件
     */
    interface PluginComponent {
        /** 组件名称 */
        name: string;
        /** 组件类型，用于分组 */
        type: string;
        /** 组件实例 */
        component: Component;
        /** 组件配置 */
        props?: Record<string, any>;
        /** 组件元数据 */
        meta?: Record<string, any>;
        /** 组件配置 */
        config?: Record<string, any>;
    }

    /**
     * 插件路由配置
     * @description 定义插件的路由规则
     */
    interface PluginRoutes {
        /** 路由前缀 */
        prefix?: string;
        /** 是否自动注册页面路由 */
        autoRegister?: boolean;
        /** 自定义路由配置 */
        routes?: RouteRecordRaw[];
    }

    /**
     * 插件上下文
     * @description 提供给插件的运行环境和工具
     */
    interface PluginContext {
        /** Vue 应用实例 */
        app: any;
        /** Vue 路由实例 */
        router: any;
        /** Nuxt 应用实例（可选） */
        nuxt?: any;
        /** 插件 API */
        api: PluginApi;
    }

    /**
     * 插件 API
     * @description 提供给插件使用的核心功能
     */
    interface PluginApi {
        /** 注册路由 */
        registerRoute: (route: RouteRecordRaw) => void;
        /** 注册组件 */
        registerComponent: (name: string, component: Component) => void;
        /** 获取其他插件 */
        getPlugin: (name: string) => PluginConfig | undefined;
    }
}
