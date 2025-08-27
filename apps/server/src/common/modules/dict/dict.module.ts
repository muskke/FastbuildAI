import { TerminalLogger } from "@common/utils/log.util";
import { CacheModule } from "@core/cache/cache.module";
import { Logger, Module, OnModuleInit } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Dict } from "./entities/dict.entity";
import { DictService } from "./services/dict.service";
import { DictCacheService } from "./services/dict-cache.service";

/**
 * 字典配置模块
 */
@Module({
    imports: [TypeOrmModule.forFeature([Dict]), EventEmitterModule.forRoot(), CacheModule],
    providers: [DictService, DictCacheService],
    exports: [DictService, DictCacheService],
})
export class DictModule implements OnModuleInit {
    private readonly logger = new Logger(DictModule.name);

    constructor(private readonly dictCacheService: DictCacheService) {}

    /**
     * 模块初始化时加载所有字典配置到缓存
     */
    async onModuleInit() {
        try {
            // 等待数据库连接完成后，初始化字典缓存
            await this.dictCacheService.loadAllDictsToCache();
            TerminalLogger.success("Config Cache", "Dict Cache Init Successful");
            this.logger.log("✅ 字典缓存初始化完成");
        } catch (error) {
            // 如果初始化失败，记录警告但不阻断模块加载
            this.logger.warn(`字典缓存初始化失败: ${error.message}`);
        }
    }
}
