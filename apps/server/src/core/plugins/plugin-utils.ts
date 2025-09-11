// A performant, type-safe, and elegant runtime plugin system for NestJS
// - Dynamic slots (no hard-coded enums)
// - Strong types for plugins & contributions
// - Service instance caching for performance
// - Stable ordering with O(log n) insertion per slot (binary search)
// - Safe de-duplication and replacement by (pluginId:contributionId)
// - Optional enable predicate for contextual filtering (without re-indexing)
// - Unregister support for HMR / runtime toggling

import { getGlobalContainer } from "@common/utils/global-container.util";

import {
    ContributionContext,
    NormalizedEntry,
    Plugin,
    PluginContribution,
    PluginSlot,
    PluginView,
} from "./interfaces/plugin-slot.interface";
import { PluginRegistry } from "./plugin-registry";

// ---- Private Registry Access Helpers ----------------------------------------

function getRegistry(): PluginRegistry | null {
    try {
        const container = getGlobalContainer();
        return container.get(PluginRegistry, { strict: false });
    } catch (error) {
        console.warn("Failed to get PluginRegistry from container:", error);
        return null;
    }
}

// ---- Public API (semantic & ergonomic) -------------------------------------

/** Define and register a plugin. Return the same plugin for chaining/tests. */
export function definePlugin(plugin: Plugin): Plugin {
    const registry = getRegistry();

    if (registry) {
        registry.register(plugin);
    } else {
        console.warn(`PluginRegistry not found, plugin ${plugin.id} not registered`);
    }

    return plugin;
}

/** Register a single contribution without declaring a full plugin object. */
export function registerPluginContribution(
    pluginId: string,
    contribution: PluginContribution,
): void {
    const registry = getRegistry();

    if (registry) {
        registry.registerContribution(pluginId, contribution);
    } else {
        console.warn(
            `PluginRegistry not found, contribution ${pluginId}:${contribution.id} not registered`,
        );
    }
}

/** Unregister a plugin at runtime (useful for HMR or toggling features). */
export function unregisterPlugin(pluginId: string): void {
    const registry = getRegistry();

    if (registry) {
        registry.unregister(pluginId);
    } else {
        console.warn(`PluginRegistry not found, cannot unregister plugin ${pluginId}`);
    }
}

/**
 * Get service instances for a slot with optional context filtering.
 * Returns array of instantiated service objects ordered by contribution order.
 */
export function getSlotServices(slot: string, ctx?: ContributionContext): any[] {
    const registry = getRegistry();

    if (registry) {
        return registry.getSlotServices(slot, ctx);
    }

    return [];
}

/**
 * Get first service instance for a slot with optional context filtering.
 * Useful when you only need one service from a slot.
 */
export function getSlotService(slot: string, ctx?: ContributionContext): any | null {
    const registry = getRegistry();

    if (registry) {
        return registry.getSlotService(slot, ctx);
    }

    return null;
}

/**
 * Get service by platform for a slot with optional context filtering.
 * Looks for contributions where meta.platform matches the specified platform.
 */
export function getServiceByPlatform(
    platform: string,
    slot: string,
    ctx?: ContributionContext,
): any | null {
    const registry = getRegistry();

    if (registry) {
        return registry.getServiceByPlatform(platform, slot, ctx);
    }

    return null;
}

/**
 * Get readonly view objects for a slot with optional context filtering.
 * Useful for debugging, introspection, or when you need metadata without instantiating services.
 */
export function getSlotViews<TMeta = Record<string, unknown>>(
    slot: string,
    ctx?: ContributionContext,
): readonly PluginView<TMeta>[] {
    const registry = getRegistry();

    if (registry) {
        return registry.getSlotViews<TMeta>(slot, ctx);
    }

    return [];
}

/**
 * Get readonly snapshot of slot entries without context filtering.
 * Low-level API for advanced use cases.
 */
export function getSlot(slot: string): readonly NormalizedEntry[] {
    const registry = getRegistry();

    if (registry) {
        return registry.getSlot(slot);
    }

    return [];
}

/**
 * Check if a plugin is currently registered.
 */
export function isPluginRegistered(pluginId: string): boolean {
    const registry = getRegistry();

    if (registry) {
        return registry.isPluginRegistered(pluginId);
    }

    return false;
}

/**
 * Get all registered plugins.
 * Useful for debugging and management interfaces.
 */
export function getAllPlugins(): Plugin[] {
    const registry = getRegistry();

    if (registry) {
        return registry.getAllPlugins();
    }

    return [];
}

// ---- Plugin Contribution Helpers ---------------------------------------------------

/**
 * Create a service contribution
 * @param config Configuration object
 */
export function createServiceContribution(config: {
    id: string;
    slot: string;
    service: new (...args: any[]) => any;
    order?: number;
    metadata?: Record<string, unknown>;
    enabled?: (ctx?: ContributionContext) => boolean;
}): PluginContribution {
    const { id, slot, service, order = 0, metadata, enabled } = config;
    return {
        id,
        slot,
        service,
        order,
        meta: metadata,
        enabled,
    };
}

/**
 * Create a platform-specific service contribution (convenience function)
 * @param config Configuration object
 */
export function createPlatformServiceContribution(config: {
    id: string;
    slot: string;
    service: new (...args: any[]) => any;
    platform: string;
    order?: number;
    metadata?: Record<string, unknown>;
}): PluginContribution {
    const { id, slot, service, platform, order = 0, metadata = {} } = config;
    return createServiceContribution({
        id,
        slot,
        service,
        order,
        metadata: { platform, ...metadata },
    });
}

// ---- NestJS Module Integration Helper --------------------------------------

/**
 * Create a NestJS module configurator for plugin registration.
 * Use in your plugin module's onModuleInit method.
 */
export function createPluginInstaller(plugin: Plugin) {
    return () => {
        try {
            definePlugin(plugin);
            console.log(`Plugin ${plugin.id} registered successfully`);
        } catch (error) {
            console.error(`Failed to register plugin ${plugin.id}:`, error);
        }
    };
}

// ---- Exports ----------------------------------------------------------------

/** Export types for external use */
export type {
    ContributionContext,
    NormalizedEntry,
    Plugin,
    PluginContribution,
    PluginSlot,
    PluginView,
};
