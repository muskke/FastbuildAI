import { Module } from "@nestjs/common";

import { ExampleModule } from "./example/example.module";

@Module({
    imports: [ExampleModule],
    exports: [ExampleModule],
})
export class PluginsWebModule {}
