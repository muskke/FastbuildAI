import { TypeOrmModule } from "@buildingai/db/@nestjs/typeorm";
import { AiModel } from "@buildingai/db/entities/ai-model.entity";
import { AiProvider } from "@buildingai/db/entities/ai-provider.entity";
import { Module } from "@nestjs/common";

import { PublicAiModelService } from "./services/ai-model.service";

/**
 * AI Public Module
 */
@Module({
    imports: [TypeOrmModule.forFeature([AiModel, AiProvider])],
    providers: [PublicAiModelService],
    exports: [PublicAiModelService],
})
export class AiPublicModule {}
