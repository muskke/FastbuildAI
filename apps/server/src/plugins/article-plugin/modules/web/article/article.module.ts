import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Article } from "../../../entities/article.entity";
import { ArticleController } from "./article.controller";
import { ArticleService } from "./article.service";

/**
 * 前台文章模块
 */
@Module({
    imports: [TypeOrmModule.forFeature([Article])],
    controllers: [ArticleController],
    providers: [ArticleService],
    exports: [ArticleService],
})
export class ArticleModule {}
