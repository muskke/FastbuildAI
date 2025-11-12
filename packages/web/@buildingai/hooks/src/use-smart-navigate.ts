import type { RouteLocationRaw } from "vue-router";

/**
 * Smart navigation composable
 *
 * Automatically determines whether to use Vue Router or location.href based on the app context:
 * - Main app (baseURL === "/"): Uses Vue Router for SPA navigation
 * - Plugin app (baseURL !== "/"): Uses location.href for full page reload
 *
 * @returns Navigation functions
 *
 * @example
 * ```ts
 * const { smartNavigate } = useSmartNavigate();
 *
 * // Navigate to a path
 * smartNavigate('/about');
 *
 * // Navigate with route object
 * smartNavigate({ path: '/users', query: { id: 1 } });
 * ```
 */
export function useSmartNavigate() {
    const config = useRuntimeConfig();
    const router = useRouter();

    // Check if current app is a plugin
    const isPlugin = config.public.isPlugin as boolean;
    const baseURL = (config.public.appBaseURL as string) || "/";

    /**
     * Smart navigate function
     *
     * @param to - Route location (string path or RouteLocationRaw object)
     * @param options - Navigation options
     * @returns void
     */
    const smartNavigate = (
        to: string | RouteLocationRaw,
        options?: {
            /** Open in new tab */
            newTab?: boolean;
            /** Force use location.href even in main app */
            forceLocation?: boolean;
        },
    ) => {
        const { newTab = false, forceLocation = false } = options || {};

        // Convert RouteLocationRaw to string path
        let targetPath: string;

        if (typeof to === "string") {
            targetPath = to;
        } else {
            // Use router.resolve to convert route object to URL
            const resolved = router.resolve(to);
            targetPath = resolved.href;
        }

        // Handle external URLs
        if (targetPath.startsWith("http://") || targetPath.startsWith("https://")) {
            if (newTab) {
                window.open(targetPath, "_blank", "noopener,noreferrer");
            } else {
                window.location.href = targetPath;
            }
            return;
        }

        // Open in new tab
        if (newTab) {
            const fullPath = isPlugin ? `${baseURL}${targetPath}`.replace(/\/+/g, "/") : targetPath;
            window.open(fullPath, "_blank", "noopener,noreferrer");
            return;
        }

        // Plugin mode: Use location.href for cross-app navigation
        if (isPlugin || forceLocation) {
            // Remove baseURL prefix if it exists in the target path
            const cleanPath = targetPath.startsWith(baseURL)
                ? targetPath
                : targetPath.replace(new RegExp(`^${baseURL}`), "");

            window.location.href = cleanPath;
        } else {
            // Main app: Use Vue Router
            navigateTo(to);
        }
    };

    /**
     * Smart replace function (similar to router.replace)
     *
     * @param to - Route location
     * @returns void
     */
    const smartReplace = (to: string | RouteLocationRaw) => {
        const config = useRuntimeConfig();
        const isPlugin = config.public.isPlugin as boolean;

        if (isPlugin) {
            let targetPath: string;

            if (typeof to === "string") {
                targetPath = to;
            } else {
                const resolved = router.resolve(to);
                targetPath = resolved.href;
            }

            window.location.replace(targetPath);
        } else {
            navigateTo(to, { replace: true });
        }
    };

    return {
        smartNavigate,
        smartReplace,
        isPlugin,
        baseURL,
    };
}
