import { Module } from "@nestjs/common";

import { PluginsConsoleModule } from "./modules/console/console.module";
import { PluginsWebModule } from "./modules/web/web.module";

@Module({
    imports: [PluginsConsoleModule, PluginsWebModule],
    exports: [PluginsConsoleModule, PluginsWebModule],
    controllers: [],
    providers: [],
})
export class PluginMainModule {}
