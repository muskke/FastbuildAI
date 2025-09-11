/** Optional context passed when evaluating whether a contribution should be enabled. */
export interface ContributionContext {
    /** Current user context */
    user?: { id: string; role: string; permissions?: string[] };
    /** Request context */
    request?: { platform?: string; version?: string; [key: string]: unknown };
    /** Feature flags */
    features?: Record<string, boolean>;
    /** Any additional context */
    [key: string]: unknown;
}

/**
 * A single contribution to a slot.
 * Meta is generic so each slot can define its own shape.
 */
export interface PluginContribution<Meta = Record<string, unknown>> {
    /** Unique within a plugin. Combined with pluginId to form a global key. */
    id: string;
    /** The slot name this contribution goes to. */
    slot: string;
    /** Service class constructor */
    service?: new (...args: any[]) => any;
    /** Service factory function for complex dependency injection */
    serviceFactory?: (...args: any[]) => any;
    /** Arbitrary metadata; define your own per-slot contract via generics. */
    meta?: Meta;
    /** Optional props to pass when creating service instance. */
    props?: Record<string, unknown>;
    /** Sort order within the slot. Smaller first. Defaults to 0. */
    order?: number;
    /**
     * Optional predicate to decide if this contribution is currently enabled.
     * Use this for feature flags, permissions, platform checks, etc.
     * Returning false keeps the item indexed but filtered at read time — cheap and reactive.
     */
    enabled?: (ctx?: ContributionContext) => boolean;
}

/** A plugin groups multiple contributions. */
export interface Plugin<Meta = Record<string, unknown>> {
    /** Globally unique plugin identifier */
    id: string;
    /** List of contributions this plugin provides */
    contributions: Array<PluginContribution<Meta>>;
    /** Plugin metadata */
    meta?: {
        name: string;
        description: string;
        version: string;
        author?: string;
        /** Supported platforms */
        platforms?: string[];
        /** Plugin dependencies */
        dependencies?: string[];
        /** Minimum system requirements */
        requirements?: Record<string, string>;
    };
}

/** Internal normalized entry stored in the registry. */
export interface NormalizedEntry {
    key: string; // `${pluginId}:${contribution.id}`
    pluginId: string;
    id: string;
    slot: string;
    order: number;
    service?: new (...args: any[]) => any;
    serviceFactory?: (...args: any[]) => any;
    meta?: Record<string, unknown>;
    props?: Record<string, unknown>;
    enabled?: (ctx?: ContributionContext) => boolean;
}

/** Public read-only shape exposed to consumers. */
export interface PluginView<TMeta = Record<string, unknown>> {
    readonly key: string;
    readonly pluginId: string;
    readonly id: string;
    readonly slot: string;
    readonly order: number;
    readonly serviceInstance?: any;
    readonly meta?: TMeta;
    readonly props?: Record<string, unknown>;
}

/**
 * Plugin registry interface for managing plugin lifecycle.
 */
export interface SlotManager {
    /** Register an entire plugin (idempotent) */
    register(plugin: Plugin): void;
    /** Register or replace a single contribution */
    registerContribution(pluginId: string, contribution: PluginContribution): void;
    /** Get readonly snapshot of slot contributions */
    getSlot(slot: string): readonly NormalizedEntry[];
    /** Get service instances for a slot with context filtering */
    getSlotServices(slot: string, ctx?: ContributionContext): any[];
    /** Get first service instance for a slot */
    getSlotService(slot: string, ctx?: ContributionContext): any | null;
    /** Get service by platform for a slot */
    getServiceByPlatform(platform: string, slot: string, ctx?: ContributionContext): any | null;
    /** Unregister a plugin and all of its contributions */
    unregister(pluginId: string): void;
    /** Check if plugin is registered */
    isPluginRegistered(pluginId: string): boolean;
    /** Get all registered plugins */
    getAllPlugins(): Plugin[];
}

/** 插槽名称类型 - 支持任意字符串 */
export type PluginSlot = string;
