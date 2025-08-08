import { INestApplicationContext } from "@nestjs/common";

/**
 * 全局应用容器
 */
let globalContainer: INestApplicationContext;

/**
 * 设置全局容器
 *
 * @param container 应用容器
 */
export function setGlobalContainer(container: INestApplicationContext): void {
    globalContainer = container;
}

/**
 * 获取全局容器
 *
 * @returns 应用容器
 */
export function getGlobalContainer(): INestApplicationContext {
    if (!globalContainer) {
        throw new Error("Global container not initialized. Call setGlobalContainer first.");
    }
    return globalContainer;
}

/**
 * 从全局容器获取服务实例
 *
 * @param serviceClass 服务类
 * @returns 服务实例
 */
export function getService<T>(serviceClass: new (...args: any[]) => T): T {
    return getGlobalContainer().get(serviceClass);
}
