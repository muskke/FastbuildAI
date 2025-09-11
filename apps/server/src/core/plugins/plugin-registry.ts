import { getGlobalContainer } from "@common/utils/global-container.util";
import { Injectable, Logger } from "@nestjs/common";

import {
    ContributionContext,
    NormalizedEntry,
    Plugin,
    PluginContribution,
    PluginSlot,
    PluginView,
    SlotManager,
} from "./interfaces/plugin-slot.interface";

/**
 * A performant, type-safe, and elegant runtime plugin system for NestJS
 * - Dynamic slots (no hard-coded enums)
 * - Strong types for plugins & contributions
 * - Stable ordering with O(log n) insertion per slot (binary search)
 * - Service instance caching for performance
 * - Safe de-duplication and replacement by (pluginId:contributionId)
 * - Optional enable predicate for contextual filtering (without re-indexing)
 * - Unregister support for HMR / runtime toggling
 */
@Injectable()
export class PluginRegistry implements SlotManager {
    private readonly logger = new Logger(PluginRegistry.name);

    /** All plugins by id. */
    private plugins = new Map<string, Plugin>();

    /** Per-slot ordered entries. */
    private slotIndex = new Map<string, NormalizedEntry[]>();

    /** Service instance cache for performance. */
    private serviceInstances = new Map<string, any>();

    /** Quick lookup by global key to allow replace & unregister. */
    private keyToSlot = new Map<string, string>();

    constructor() {
        // 使用全局容器，避免循环依赖
    }

    /** Register an entire plugin (idempotent). */
    register(plugin: Plugin): void {
        if (this.plugins.has(plugin.id)) {
            this.logger.warn(`Plugin ${plugin.id} already registered, skipping`);
            return; // prevent duplicate plugin install
        }

        this.plugins.set(plugin.id, plugin);
        this.logger.log(`Registered plugin: ${plugin.id} v${plugin.meta?.version || "1.0.0"}`);

        // Register all contributions
        for (const contribution of plugin.contributions) {
            this.registerContribution(plugin.id, contribution);
        }
    }

    /** Register or replace a single contribution (used by plugins or direct). */
    registerContribution(pluginId: string, contribution: PluginContribution): void {
        const key = `${pluginId}:${contribution.id}`;
        const entry: NormalizedEntry = {
            key,
            pluginId,
            id: contribution.id,
            slot: contribution.slot,
            order: contribution.order ?? 0,
            service: contribution.service,
            serviceFactory: contribution.serviceFactory,
            meta: contribution.meta,
            props: contribution.props,
            enabled: contribution.enabled,
        };

        // If already exists, remove first (replacement)
        const existingSlotName = this.keyToSlot.get(key);
        if (existingSlotName) {
            this.removeFromSlot(existingSlotName, key);
        }

        this.keyToSlot.set(key, entry.slot);
        const arr = this.slotIndex.get(entry.slot) ?? [];
        const idx = this.binarySearchByOrder(arr, entry.order);
        arr.splice(idx, 0, entry);
        this.slotIndex.set(entry.slot, arr);

        this.logger.log(`Registered contribution ${key} to slot ${entry.slot}`);
    }

    /** Get readonly snapshot of slot contributions. */
    getSlot(slot: string): readonly NormalizedEntry[] {
        return this.slotIndex.get(slot) ?? [];
    }

    /** Get service instances for a slot with context filtering. */
    getSlotServices(slot: string, ctx?: ContributionContext): any[] {
        const entries = this.getSlot(slot);
        const services: any[] = [];

        for (const entry of entries) {
            // Check if contribution is enabled for current context
            if (entry.enabled && !entry.enabled(ctx)) {
                continue;
            }

            try {
                const serviceKey = entry.key;

                // Check cache first
                if (this.serviceInstances.has(serviceKey)) {
                    services.push(this.serviceInstances.get(serviceKey));
                    continue;
                }

                let serviceInstance: any;

                if (entry.serviceFactory) {
                    // Use factory function to create service
                    serviceInstance = entry.serviceFactory(entry.props);
                } else if (entry.service) {
                    // Try to get from global container first
                    try {
                        const container = getGlobalContainer();
                        serviceInstance = container.get(entry.service, { strict: false });
                    } catch (error) {
                        // If not in container, try direct instantiation
                        serviceInstance = new entry.service(entry.props);
                    }
                }

                if (serviceInstance) {
                    this.serviceInstances.set(serviceKey, serviceInstance);
                    services.push(serviceInstance);
                }
            } catch (error) {
                this.logger.error(`Failed to get service for contribution ${entry.key}:`, error);
            }
        }

        return services;
    }

    /** Get first service instance for a slot. */
    getSlotService(slot: string, ctx?: ContributionContext): any | null {
        const services = this.getSlotServices(slot, ctx);
        return services.length > 0 ? services[0] : null;
    }

    /** Get service by platform for a slot. */
    getServiceByPlatform(platform: string, slot: string, ctx?: ContributionContext): any | null {
        const entries = this.getSlot(slot);
        const entry = entries.find(
            (e) =>
                (!e.enabled || e.enabled(ctx)) &&
                e.meta &&
                "platform" in e.meta &&
                e.meta.platform === platform,
        );

        if (!entry) return null;

        try {
            const serviceKey = entry.key;

            if (this.serviceInstances.has(serviceKey)) {
                return this.serviceInstances.get(serviceKey);
            }

            let serviceInstance: any;

            if (entry.serviceFactory) {
                serviceInstance = entry.serviceFactory(entry.props);
            } else if (entry.service) {
                try {
                    const container = getGlobalContainer();
                    serviceInstance = container.get(entry.service, { strict: false });
                } catch (error) {
                    serviceInstance = new entry.service(entry.props);
                }
            }

            if (serviceInstance) {
                this.serviceInstances.set(serviceKey, serviceInstance);
                return serviceInstance;
            }
        } catch (error) {
            this.logger.error(`Failed to get service for platform ${platform}:`, error);
        }

        return null;
    }

    /** Unregister a plugin and all of its contributions. */
    unregister(pluginId: string): void {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) return;

        // Remove all contributions
        for (const contribution of plugin.contributions) {
            const key = `${pluginId}:${contribution.id}`;
            const slot = this.keyToSlot.get(key);
            if (slot) {
                this.removeFromSlot(slot, key);
            }
            this.keyToSlot.delete(key);
        }

        // Clean up service instance cache
        for (const [key] of this.serviceInstances.entries()) {
            if (key.startsWith(`${pluginId}:`)) {
                this.serviceInstances.delete(key);
            }
        }

        this.plugins.delete(pluginId);
        this.logger.log(`Unregistered plugin: ${pluginId}`);
    }

    /** Get all registered plugins. */
    getAllPlugins(): Plugin[] {
        return Array.from(this.plugins.values());
    }

    /** Check if plugin is registered. */
    isPluginRegistered(pluginId: string): boolean {
        return this.plugins.has(pluginId);
    }

    /** Get plugin view objects for a slot with context filtering. */
    getSlotViews<TMeta = Record<string, unknown>>(
        slot: string,
        ctx?: ContributionContext,
    ): PluginView<TMeta>[] {
        const entries = this.getSlot(slot);
        const views: PluginView<TMeta>[] = [];

        for (const entry of entries) {
            // Check if contribution is enabled for current context
            if (entry.enabled && !entry.enabled(ctx)) {
                continue;
            }

            try {
                const serviceKey = entry.key;
                let serviceInstance: any = undefined;

                // Get cached service instance if exists
                if (this.serviceInstances.has(serviceKey)) {
                    serviceInstance = this.serviceInstances.get(serviceKey);
                }

                const view: PluginView<TMeta> = {
                    key: entry.key,
                    pluginId: entry.pluginId,
                    id: entry.id,
                    slot: entry.slot,
                    order: entry.order,
                    serviceInstance,
                    meta: entry.meta as TMeta,
                    props: entry.props,
                };

                views.push(view);
            } catch (error) {
                this.logger.error(`Failed to create view for contribution ${entry.key}:`, error);
            }
        }

        return views;
    }

    // -- Private helpers --

    /** Binary search insertion point for ordered array. */
    private binarySearchByOrder(arr: NormalizedEntry[], order: number): number {
        let lo = 0;
        let hi = arr.length;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if ((arr[mid]?.order ?? 0) <= (order ?? 0)) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    /** Remove entry from slot by key. */
    private removeFromSlot(slot: string, key: string): void {
        const arr = this.slotIndex.get(slot);
        if (!arr) return;
        const idx = arr.findIndex((e) => e.key === key);
        if (idx !== -1) {
            arr.splice(idx, 1);
            this.slotIndex.set(slot, arr);
        }
    }
}
