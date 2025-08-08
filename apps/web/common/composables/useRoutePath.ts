export const useRoutePath = (perms: string) => {
    const router = useRouter();
    // console.log(
    //     router.getRoutes(),
    //     router.getRoutes().find((item) => item.meta?.permissionCode == perms)?.path || "",
    // );
    return router.getRoutes().find((item) => item.meta?.permissionCode == perms)?.path || "";
};
