import { TypeOrmModule } from "@buildingai/db/@nestjs/typeorm";
import { AiModel } from "@buildingai/db/entities/ai-model.entity";
import { AiProvider } from "@buildingai/db/entities/ai-provider.entity";
import { Dict } from "@buildingai/db/entities/dict.entity";
import { Module } from "@nestjs/common";

import { AiProviderConsoleController } from "./controllers/console/ai-provider.controller";
import { AiProviderWebController } from "./controllers/web/ai-provider.controller";
import { AiProviderService } from "./services/ai-provider.service";

/**
 * AI供应商模块
 */
@Module({
    imports: [TypeOrmModule.forFeature([Dict, AiProvider, AiModel])],
    controllers: [AiProviderConsoleController, AiProviderWebController],
    providers: [AiProviderService],
    exports: [AiProviderService],
})
export class AiProviderModule {}
