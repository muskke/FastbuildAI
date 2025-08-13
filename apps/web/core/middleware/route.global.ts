import { ROUTES } from "@/common/constants/routes.constant";
import { usePermissionStore } from "@/common/stores/permission";
import { useUserStore } from "@/common/stores/user";
import { buildRoutes } from "@/common/utils/menu-helper";

const modules = import.meta.glob(["@/app/console/**/*.vue", "@plugins/**/app/console/**/*.vue"]);

export default defineNuxtRouteMiddleware(async (to, from) => {
    const router = useRouter();
    const userStore = useUserStore();
    const permissionStore = usePermissionStore();

    /**
     * 判断路径是否匹配控制台菜单路由
     */
    const isConsoleMenuMatched = (path: string) =>
        router.resolve(path).matched.some((r) => r.path.startsWith(ROUTES.CONSOLE));

    /**
     * 基础鉴权与跳转逻辑
     * - 设置页面布局
     * - 获取用户信息
     * - 登录/未登录跳转处理
     * - 登录状态刷新 token
     * @returns string | undefined
     */
    const handleAuth = async () => {
        // 所有 console 页面强制使用 console 布局并需要权限
        if (to.fullPath.startsWith(ROUTES.CONSOLE)) {
            setPageLayout(to.meta.layout || "console");
            to.meta.auth = true;
        }

        // 已登录但没有用户信息 → 获取用户信息
        if (userStore.isLogin && !userStore.userInfo) {
            await userStore.getUser();
        }
        // 未登录且目标页需要权限 → 跳转登录
        else if (!userStore.isLogin && to.meta.auth !== false && to.path !== ROUTES.LOGIN) {
            setPageLayout("full-screen");
            return `${ROUTES.LOGIN}?redirect=${to.fullPath}`;
        }
        // 已登录但访问登录页 → 跳转回来源页或首页
        else if (userStore.isLogin && to.path === ROUTES.LOGIN) {
            return from.path !== ROUTES.LOGIN ? from.fullPath : ROUTES.HOME;
        }
        // 已登录访问其他页面 → 刷新 token 时长
        else if (userStore.isLogin) {
            userStore.refreshToken();
        }
    };

    // =============================================
    // 1. 登录与跳转控制
    // =============================================
    const authRedirect = await handleAuth();
    if (authRedirect) return authRedirect;

    // =============================================
    // 2. 控制台菜单匹配前置判断
    //    已加载菜单并且匹配到控制台路由 → 直接放行
    //    或者目标不是控制台路由 → 放行
    // =============================================
    if (
        (permissionStore.menus?.length && isConsoleMenuMatched(to.fullPath)) ||
        !to.fullPath.startsWith(ROUTES.CONSOLE)
    ) {
        return;
    }

    try {
        // =============================================
        // 3. 加载权限并注册控制台路由
        // =============================================
        await permissionStore.loadPermissions();

        // 非超级管理员且无任何权限 → 403
        if (userStore.userInfo?.isRoot === 0 && permissionStore.permissions.length === 0) {
            return "/403";
        }

        // 构建并注册后台路由
        const routes = buildRoutes(userStore.userInfo?.isRoot === 1, modules);
        routes.forEach((route) => {
            try {
                router.addRoute(route);
            } catch (error) {
                console.error(`添加路由 ${route.path} 失败:`, error);
            }
        });

        // 权限校验：无对应权限 → 403
        if (
            userStore.userInfo?.isRoot === 0 &&
            to.meta.permissionCode &&
            !permissionStore.hasPermission(to.meta.permissionCode as string)
        ) {
            return "/403";
        }

        // 控制台首页 → 跳转到第一个可访问路由
        if (to.fullPath === ROUTES.CONSOLE || to.fullPath === `${ROUTES.CONSOLE}/`) {
            return routes[0]?.path || ROUTES.HOME;
        }

        // =============================================
        // 4. 注册完成后再次匹配
        // =============================================
        if (!isConsoleMenuMatched(to.fullPath)) {
            console.warn(`路由未找到: ${to.path}`);
            setPageLayout("full-screen");
            return "/not-found";
        }

        // 匹配成功 → 放行
        return to.fullPath;
    } catch (error) {
        console.log("注册路由失败:", error);
        // 接口请求错误 → 404
        if (error instanceof Error && error.name === "FetchError") {
            return "/not-found";
        }
        return to.fullPath;
    }
});
