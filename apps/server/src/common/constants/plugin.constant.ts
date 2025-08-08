/**
 * 权限前缀
 */
export const PermissionPrefix = {
    SYSTEM: "system@",
} as const;

export type PermissionPrefixType = (typeof PermissionPrefix)[keyof typeof PermissionPrefix];
export type PermissionPrefixKey = keyof typeof PermissionPrefix;
