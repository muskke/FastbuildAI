import { Module } from "@nestjs/common";

import { DecorateModule as ConsoleDecorateModule } from "../../console/decorate/decorate.module";
import { PageController } from "./controllers/page.controller";

@Module({
    imports: [ConsoleDecorateModule],
    controllers: [PageController],
})
export class DecorateModule {}
