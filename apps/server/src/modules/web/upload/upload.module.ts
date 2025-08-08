import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { TypeOrmModule } from "@nestjs/typeorm";
import { memoryStorage } from "multer";

import { UploadController } from "./controllers/upload.controller";
import { File } from "./entities/file.entity";
import { UploadService } from "./services/upload.service";

/**
 * 文件上传模块
 *
 * 提供文件上传、存储和管理功能
 */
@Module({
    imports: [
        // 使用内存存储，文件将由服务处理并保存到指定位置
        MulterModule.register({
            storage: memoryStorage(),
        }),
        TypeOrmModule.forFeature([File]),
    ],
    controllers: [UploadController],
    providers: [UploadService],
    exports: [UploadService],
})
export class UploadModule {}
