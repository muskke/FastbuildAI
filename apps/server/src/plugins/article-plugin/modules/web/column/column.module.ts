import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Article } from "../../../entities/article.entity";
import { ArticleColumn } from "../../../entities/column.entity";
import { ColumnController } from "./column.controller";
import { ColumnService } from "./column.service";

/**
 * 前台栏目模块
 */
@Module({
    imports: [TypeOrmModule.forFeature([ArticleColumn, Article])],
    controllers: [ColumnController],
    providers: [ColumnService],
    exports: [ColumnService],
})
export class ColumnModule {}
