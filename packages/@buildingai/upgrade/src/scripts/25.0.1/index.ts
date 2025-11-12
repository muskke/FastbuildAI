import * as fs from "fs-extra";
import * as path from "path";

import { BaseUpgradeScript, UpgradeContext } from "../../index";

/**
 * Upgrade script for version 25.0.1
 *
 * This version uses directory structure to organize upgrade files:
 * - index.ts: Main upgrade script (required)
 * - menu.json: Menu configuration
 * - data/: Additional data files
 */
export class Upgrade extends BaseUpgradeScript {
    readonly version = "25.0.1";

    /**
     * Get the directory path of current upgrade script
     */
    private get scriptDir(): string {
        return __dirname;
    }

    async execute(context: UpgradeContext): Promise<void> {
        this.log("Starting upgrade to version 25.0.1");

        try {
            const { dataSource } = context;

            // Example 1: Rename tables
            await this.renameTables(dataSource);

            // Example 2: Update menus from local JSON file
            await this.updateMenus(dataSource);

            // Example 3: Update admin user nickname
            await this.updateAdminNickname(dataSource);

            this.success("Upgrade completed 25.0.1 successfully");
        } catch (error) {
            this.error("Upgrade failed", error);
            throw error;
        }
    }

    /**
     * Rename tables
     */
    private async renameTables(dataSource: UpgradeContext["dataSource"]): Promise<void> {
        this.log("Renaming tables...");

        try {
            this.success("Tables renamed successfully");
        } catch (error) {
            this.error("Failed to rename tables", error);
            throw error;
        }
    }

    /**
     * Update menus from local JSON configuration file
     */
    private async updateMenus(dataSource: UpgradeContext["dataSource"]): Promise<void> {
        this.log("Updating menus...");

        try {
            // Read menu configuration from the same directory
            const menuConfigPath = path.join(this.scriptDir, "menu.json");

            if (!(await fs.pathExists(menuConfigPath))) {
                this.log("No menu configuration file found, skipping");
                return;
            }

            const menuConfig = await fs.readJson(menuConfigPath);
            this.log(`Found ${menuConfig.length} menu items to process`);

            for (const menu of menuConfig) {
                this.log(`Updated menu: ${menu}`);
            }

            this.success("Menu update completed");
        } catch (error) {
            this.error("Failed to update menus", error);
            throw error;
        }
    }

    /**
     * Update admin user nickname
     */
    private async updateAdminNickname(dataSource: UpgradeContext["dataSource"]): Promise<void> {
        this.log("Updating admin user nickname...");

        try {
            const userRepository = dataSource.getRepository("User");

            // Find user with username 'admin'
            const adminUser = await userRepository.findOne({
                where: { username: "admin" },
            });

            if (!adminUser) {
                this.log("Admin user not found, skipping");
                return;
            }

            // Update nickname
            await userRepository.update(adminUser.id, {
                nickname: "野鸡admin",
            });

            this.success(`Admin user nickname updated: ${adminUser.username} -> 野鸡admin`);
        } catch (error) {
            this.error("Failed to update admin nickname", error);
            throw error;
        }
    }
}

// Export as default for dynamic import
export default Upgrade;
