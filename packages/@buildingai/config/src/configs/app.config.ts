/**
 * @fileoverview Application global configuration
 * @description This file contains the global configuration for the BuildingAI application,
 * including API endpoints, timeout settings, and environment-specific configurations.
 *
 * @author BuildingAI Teams
 */

export interface AppConfigType {
    name: string;
    version: string;
}

/**
 * Application global configuration object
 * @description Contains all global configuration settings for the application
 */
export const AppConfig: AppConfigType = {
    /** Application name */
    name: "BuildingAI",

    /** Application version */
    version: "25.0.0",
};
