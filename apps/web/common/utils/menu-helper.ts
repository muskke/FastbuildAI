import type { BreadcrumbItem, NavigationMenuItem } from "@nuxt/ui";
import type { Component } from "vue";
import type { Composer } from "vue-i18n";
import type { RouteRecordRaw } from "vue-router";

import { MENU_TYPE, ROUTES } from "@/common/constants";
import type { MenuFormData } from "@/models/menu";

export interface SearchMenuItem {
    id: string;
    name: string;
    icon: string;
    iconClass: string;
    type: string;
    path: string;
    parentName: string;
}

export interface TransformedMenuItem extends NavigationMenuItem {
    matchPath: string;
    children?: TransformedMenuItem[];
}

interface TransformOptions {
    directoryToEmpty?: boolean;
    currentPath?: string;
}

// -------------------- 基础工具 --------------------

function normalizePath(parent: string, child?: string): string {
    return parent + (child?.startsWith("/") ? child : `/${child || ""}`);
}

function filterVisibleMenus(menus: MenuFormData[], visible: boolean): MenuFormData[] {
    return menus
        .filter((m) => m.type !== MENU_TYPE.BUTTON && (visible || !m.isHidden))
        .sort((a, b) => (a.sort || 0) - (b.sort || 0));
}

function getMatchPath(menu: MenuFormData, parentPath = ""): string {
    const currentPath = menu.path ? `/${menu.path}` : "";
    const basePath = `${parentPath}${currentPath}`;
    return `${ROUTES.CONSOLE}${basePath}`.replace(/\/+/g, "/").replace(/\/$/, "");
}

function getToPath(menu: MenuFormData, parentPath = ""): string {
    const currentPath = normalizePath(parentPath, menu.path);

    if (menu.type === MENU_TYPE.MENU && !menu.isHidden && menu.component) {
        return `${ROUTES.CONSOLE}${currentPath}`.replace(/\/+/g, "/");
    }

    if (menu.children?.length) {
        const validChild = menu.children.find(
            (child) => !child.isHidden && (child.component || child.children?.length),
        );
        if (validChild) {
            return getToPath(validChild, currentPath);
        }
    }
    return `${ROUTES.CONSOLE}${currentPath}`.replace(/\/+/g, "/");
}

export function transformMenus(
    menus: MenuFormData[],
    parentPath = "",
    options: TransformOptions = {},
): TransformedMenuItem[] {
    const { $i18n } = useNuxtApp();
    const { t, locale } = $i18n as Composer;
    return filterVisibleMenus(menus, false).map((menu) => {
        // 如果是插件菜单且有pluginPackName，使用pluginPackName作为路径前缀
        const isPluginMenu = menu.sourceType === 2 && menu.pluginPackName;
        let basePath: string;

        if (isPluginMenu) {
            // 插件菜单直接使用 pluginPackName 作为前缀
            basePath = `/${menu.pluginPackName}`;
        } else {
            // 系统菜单使用父级路径
            basePath = parentPath;
        }

        const matchPath = getMatchPath(menu, basePath);
        const fullPath = normalizePath(basePath, menu.path);
        const to =
            options.directoryToEmpty && menu.type === MENU_TYPE.DIRECTORY
                ? undefined
                : getToPath(menu, basePath);

        const defaultOpen = options.currentPath ? options.currentPath.startsWith(matchPath) : false;

        return {
            label: t(menu.name) || menu.name,
            icon: menu.icon || "",
            to,
            matchPath,
            active: !!to && defaultOpen,
            defaultOpen,
            children: menu.children?.length ? transformMenus(menu.children, fullPath, options) : [],
        };
    });
}

// -------------------- 功能模块 --------------------

export function buildRoutes(
    isRoot = false,
    componentLoader: Record<string, any>,
): RouteRecordRaw[] {
    const { $i18n } = useNuxtApp();
    const { t } = $i18n as Composer;
    return walkFlat(usePermissionStore().menus, (menu, path) => {
        const allowed =
            isRoot ||
            !menu.permissionCode ||
            usePermissionStore().hasPermission(menu.permissionCode);

        if (menu.type === MENU_TYPE.MENU && menu.component && allowed) {
            const layout = (useNuxtApp() as any).$getConsoleLayout(menu.component);

            return {
                name: `menu-${menu.id}`,
                path,
                component: loadComponent(menu.component, componentLoader),
                meta: {
                    title: t(menu.name),
                    permissionCode: menu.permissionCode,
                    isPlugin: menu.component.startsWith("@plugins/"),
                    pluginId: menu.component.startsWith("@plugins/")
                        ? menu.component.split("/")[1]
                        : undefined,
                    layout,
                },
            };
        }

        return [];
    });
}

export function buildTopNavItems(): TransformedMenuItem[] {
    const menus = usePermissionStore().menus;
    return transformMenus(menus, "", { directoryToEmpty: false });
}

export function buildSidebarItems(path: string): TransformedMenuItem[] {
    const menus = usePermissionStore().menus;
    return transformMenus(menus, "", { directoryToEmpty: true, currentPath: path });
}

export function buildSearchItems(): SearchMenuItem[] {
    return walkFlat(usePermissionStore().menus, (menu, path, parent) => {
        if (menu.type === MENU_TYPE.MENU) {
            return {
                id: String(menu.id),
                name: menu.name,
                icon: menu.icon || "i-heroicons-squares-2x2-20-solid",
                iconClass: "bg-blue-100",
                type: "menu",
                path,
                parentName: parent,
            };
        }
        return [];
    });
}

export function buildBreadcrumbs(
    currentPath = useRoute().path,
    homePath = "/",
    homeLabel = "后台管理",
): BreadcrumbItem[] {
    if (!currentPath || currentPath === homePath) {
        return [{ label: homeLabel, to: homePath, active: true }];
    }

    const { $i18n } = useNuxtApp();
    const { t } = $i18n as Composer;

    const trail: { name: string; path: string }[] = [];

    walkFlat(usePermissionStore().menus, (menu, path) => {
        if (currentPath === path || currentPath.startsWith(path + "/")) {
            trail.push({ name: menu.name, path });
        }
        return [];
    });

    trail.sort((a, b) => a.path.length - b.path.length);

    return [
        { label: homeLabel, to: homePath },
        ...trail.map((item, i, arr) => ({
            label: t(item.name),
            to: item.path,
            active: i === arr.length - 1,
        })),
    ];
}

// -------------------- 辅助函数 --------------------

function walkFlat<T>(
    menus: MenuFormData[],
    visitor: (menu: MenuFormData, path: string, parent: string) => T | T[],
    parent: string = ROUTES.CONSOLE,
): T[] {
    return filterVisibleMenus(menus, true).flatMap((menu) => {
        let path: typeof ROUTES.CONSOLE | string;

        // 如果是插件菜单且有pluginPackName
        if (menu.sourceType === 2 && menu.pluginPackName) {
            path = normalizePath(`${ROUTES.CONSOLE}/${menu.pluginPackName}`, menu.path);
        } else {
            path = normalizePath(parent, menu.path) as typeof ROUTES.CONSOLE;
        }

        const result = visitor(menu, path, parent);
        const children = menu.children?.length ? walkFlat(menu.children, visitor, path) : [];
        return ([] as T[]).concat(result, children);
    });
}

function loadComponent(component: string, loader: Record<string, any>): Component {
    try {
        // 处理常规组件路径
        let key = Object.keys(loader).find((k) => k.includes(`${component}.vue`));

        // 插件组件路径 (格式: @plugins/plugin-name/app/console/path)
        if (!key && component.startsWith("@plugins/")) {
            const pluginPath = component.replace("@plugins/", "/plugins/");
            key = Object.keys(loader).find((k) => k.includes(pluginPath));
        }

        if (!key) {
            throw new Error(`未找到组件：${component}`);
        }
        return loader[key];
    } catch (error) {
        console.error(`组件加载失败 ${component}:`, error);
        return () => Promise.resolve({ render: () => null });
    }
}
