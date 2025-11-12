import { ExtensionsService } from "@buildingai/core/modules/extension/services/extension.service";
import { ExtensionConfigService } from "@buildingai/core/modules/extension/services/extension-config.service";
import { ExtensionSchemaService } from "@buildingai/core/modules/extension/services/extension-schema.service";
import {
    getCachedExtensionList,
    loadExtensionModule,
} from "@buildingai/core/modules/extension/utils/extension.utils";
import { TypeOrmModule } from "@buildingai/db/@nestjs/typeorm";
import { Extension } from "@buildingai/db/entities/extension.entity";
import { DataSource } from "@buildingai/db/typeorm";
import { TerminalLogger } from "@buildingai/logger";
import { DynamicModule, Module, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";

import { Pm2Module } from "../pm2/pm2.module";
import { ExtensionConsoleController } from "./controllers/console/extension.controller";
import { ExtensionMarketService } from "./services/extension-market.service";
import { ExtensionOperationService } from "./services/extension-operation.service";
import { ExtensionSeedService } from "./services/extension-seed.service";

@Module({
    imports: [],
    providers: [],
    exports: [],
})
export class ExtensionCoreModule implements OnModuleInit {
    static async register(): Promise<DynamicModule> {
        const loadedExtensions: DynamicModule[] = [];

        const extensionList = getCachedExtensionList();

        if (extensionList.length === 0) {
            TerminalLogger.info("Extensions", "No enabled extensions found");
        } else {
            TerminalLogger.info(
                "Extensions",
                `Found ${extensionList.length} enabled extension(s): ${extensionList.map((e) => e.name).join(", ")}`,
            );

            for (const extensionInfo of extensionList) {
                const extensionModule = await loadExtensionModule(extensionInfo);
                if (extensionModule) {
                    loadedExtensions.push(extensionModule);
                }
            }
        }

        return {
            module: ExtensionCoreModule,
            imports: [Pm2Module, TypeOrmModule.forFeature([Extension]), ...loadedExtensions],
            providers: [
                ExtensionConfigService,
                ExtensionSchemaService,
                ExtensionsService,
                ExtensionMarketService,
                ExtensionOperationService,
                ExtensionSeedService,
            ],
            controllers: [ExtensionConsoleController],
            exports: [],
        };
    }

    /**
     * Check if current instance is PM2 primary instance
     * In PM2 cluster mode, only instance 0 should run extension seeds
     */
    private isPm2PrimaryInstance(): boolean {
        const pm2InstanceId = process.env.NODE_APP_INSTANCE || process.env.pm_id;
        // If not in PM2 cluster mode, or is instance 0, return true
        return pm2InstanceId === undefined || pm2InstanceId === "0";
    }

    /**
     * Execute seeds for newly installed extensions
     *
     * Called after all modules are initialized
     */
    async onModuleInit() {
        try {
            // In PM2 cluster mode, only primary instance handles extension seeds
            if (!this.isPm2PrimaryInstance()) {
                TerminalLogger.log(
                    "Extension Seeds",
                    `Non-primary PM2 instance (${process.env.NODE_APP_INSTANCE || process.env.pm_id}), skipping extension seeds`,
                );
                return;
            }

            const extensionList = getCachedExtensionList();
            if (extensionList.length === 0) {
                return;
            }

            // Get DataSource from the module
            const dataSource = this.moduleRef.get(DataSource, { strict: false });
            const seedService = new ExtensionSeedService(dataSource);

            await seedService.executeNewExtensionSeeds(extensionList);
        } catch (error) {
            // Log error but don't throw - allow app to continue starting
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Failed to execute extension seeds: ${errorMessage}`);
        }
    }

    constructor(private readonly moduleRef: ModuleRef) {}
}
