import { useRouter } from "vue-router";

import { ROUTES } from "@/common/constants/routes.constant";
import { buildRoutes } from "@/common/utils/menu-helper";
import { usePermissionStore } from "@/common/stores/permission";
import { useUserStore } from "@/common/stores/user";

const modules = import.meta.glob(["@/app/console/**/*.vue", "@plugins/**/app/console/**/*.vue"]);

export default defineNuxtRouteMiddleware(async (to, from) => {
    const router = useRouter();
    const userStore = useUserStore();
    const permissionStore = usePermissionStore();

    // 后台无论任何菜单都需要权限。
    if (to.fullPath.startsWith(ROUTES.CONSOLE)) {
        if (to.meta.layout) {
            setPageLayout(to.meta.layout);
        } else {
            setPageLayout("console");
        }
        to.meta.auth = true;
    }

    if (!userStore.isLogin && to.meta.auth !== false) {
        setPageLayout("full-screen");
        return `${ROUTES.LOGIN}?redirect=${to.fullPath}`;
    }
    // 不允许登录后再次进入登录界面
    else if (userStore.isLogin && to.path === ROUTES.LOGIN) {
        return from.path !== ROUTES.LOGIN ? from.fullPath : ROUTES.HOME;
    }
    // 已登录跳转页面/进入页面刷新 token 时长
    else if (userStore.isLogin) {
        userStore.refreshToken();
    }

    // =============================================
    // 后台管理 注册路由 Start
    // =============================================

    const currentRoute = router.getRoutes().find((route) => route.path === to.path);
    if (
        (permissionStore?.menus?.length && currentRoute) ||
        !to.fullPath.startsWith(ROUTES.CONSOLE)
    ) {
        return;
    }

    try {
        await permissionStore.loadPermissions();

        if (userStore.userInfo?.isRoot === 0 && permissionStore.permissions.length === 0) {
            return "/403";
        }

        const routes = buildRoutes(userStore.userInfo?.isRoot === 1, modules);

        for (const route of routes) {
            try {
                router.addRoute(route);
            } catch (error) {
                console.error(`添加路由 ${route.path} 失败:`, error);
            }
        }

        if (process.env.NODE_ENV === "development") {
            console.log("当前所有路由:", router.getRoutes());
        }

        if (
            userStore.userInfo?.isRoot === 0 &&
            to.meta.code &&
            !permissionStore.hasPermission(to.meta.code as string)
        ) {
            return "/403";
        }

        if (to.fullPath === ROUTES.CONSOLE || to.fullPath === ROUTES.CONSOLE + "/") {
            return routes[0]?.path || ROUTES.HOME;
        }

        const matched = router.getRoutes().some((route) => route.path === to.path);
        if (!matched) {
            console.warn(`路由未找到: ${to.path}`);
            setPageLayout("full-screen");
            return "/not-found";
        }

        return to.fullPath;
    } catch (error) {
        console.log("注册路由失败:", error);
        // 如果错误是 FetchError(请求接口错误)，则返回 404 页面
        if (error instanceof Error && error.name === "FetchError") {
            return "/not-found";
        }
        return to.fullPath;
    }
    // =============================================
    // 后台管理 注册路由 End
    // =============================================
});
