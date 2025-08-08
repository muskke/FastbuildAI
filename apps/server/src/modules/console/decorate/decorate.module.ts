import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { MicropageController } from "./controllers/micropage.controller";
import { PageController } from "./controllers/page.controller";
import { DecorateMicropageEntity } from "./entities/decorate-micropage.entity";
import { DecoratePageEntity } from "./entities/decorate-page.entity";
import { MicropageService } from "./services/micropage.service";
import { PageService } from "./services/page.service";

@Module({
    imports: [TypeOrmModule.forFeature([DecoratePageEntity, DecorateMicropageEntity])],
    controllers: [PageController, MicropageController],
    providers: [PageService, MicropageService],
    exports: [PageService, MicropageService],
})
export class DecorateModule {}
