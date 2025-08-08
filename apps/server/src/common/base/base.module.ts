import { DictModule } from "@common/modules/dict/dict.module";
import { Global, Module } from "@nestjs/common";

import { FileService } from "./services/file.service";

/**
 * 全局基础服务模块
 *
 * 提供可在应用任何地方使用的全局服务
 */
@Global()
@Module({
    imports: [DictModule],
    providers: [FileService],
    exports: [FileService],
})
export class BaseModule {}
