import { DatasetsModule as WebDatasetsModule } from "@modules/web/datasets/datasets.module";
import { Datasets } from "@modules/web/datasets/entities/datasets.entity";
import { DatasetsDocument } from "@modules/web/datasets/entities/datasets-document.entity";
import { DatasetsSegments } from "@modules/web/datasets/entities/datasets-segments.entity";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { DatasetsController } from "./datasets.controller";
/**
 * 后台知识库管理模块
 * 通过导入前台模块来复用实体注册，避免重复注册导致的外键约束冲突
 */
@Module({
    imports: [
        WebDatasetsModule,
        TypeOrmModule.forFeature([Datasets, DatasetsDocument, DatasetsSegments]),
    ],
    controllers: [DatasetsController],
})
export class DatasetsConsoleModule {}
