import { useLockFn } from "@fastbuildai/ui/composables/useLockFn";
import { defineStore } from "pinia";

import type { MenuFormData } from "@/models/menu";
import { apiGetUserInfo } from "@/services/console/common";

export const usePermissionStore = defineStore("permission", () => {
    const userStore = useUserStore();
    const menus = ref<MenuFormData[]>([]);
    const permissions = ref<string[]>([]);

    const hasPermission = (permissionCode: string): boolean =>
        permissions.value.includes(permissionCode);

    const { lockFn: loadPermissions } = useLockFn(async () => {
        const result = await apiGetUserInfo();
        // menus.value =
        //     [
        //         {
        //             sort: 0,
        //             path: "custom",
        //             name: " article-plugin-1.0.0",
        //             isHidden: 0,
        //             id: "xxx",
        //             icon: "",
        //             type: 2,
        //             code: "dict:list",
        //             component: "article-plugin-1.0.0/app/console/index",
        //         },
        //         ...result.menus,
        //     ] || [];
        // console.log("result", menus.value);
        menus.value = result.menus || [];
        permissions.value = result.permissions || [];
        userStore.userInfo = result.user ? result.user : null;
    });

    return {
        menus,
        permissions,
        hasPermission,
        loadPermissions,
    };
});

export type PermissionStore = ReturnType<typeof usePermissionStore>;
