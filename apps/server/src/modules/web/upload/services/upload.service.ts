import { BaseService } from "@common/base/services/base.service";
import { FileService } from "@common/base/services/file.service";
import { BusinessCode } from "@common/constants/business-code.constant";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { REQUEST } from "@nestjs/core";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import * as fse from "fs-extra";
import * as mime from "mime-types";
import * as path from "path";
import { Repository } from "typeorm";
import { v4 as uuidv4 } from "uuid";

import { File, FileType } from "../entities/file.entity";

/**
 * 文件上传服务
 *
 * 处理文件上传、存储和查询等功能
 */
@Injectable({ scope: Scope.REQUEST })
export class UploadService extends BaseService<File> {
    /**
     * 存储根目录
     */
    private readonly storageRoot = path.join(process.cwd(), "storage", "uploads");

    /**
     * 构造函数
     *
     * @param fileRepository 文件仓库
     * @param configService 配置服务
     * @param request 请求对象
     * @param fileService 文件服务
     */
    constructor(
        @InjectRepository(File)
        private readonly fileRepository: Repository<File>,
        private readonly configService: ConfigService,
        @Inject(REQUEST) private readonly request: Request,
        private readonly fileService: FileService,
    ) {
        super(fileRepository);
        fse.ensureDir(this.storageRoot);
    }

    /**
     * 获取文件类型
     *
     * @param mimeType 文件MIME类型
     * @returns 文件类型枚举值
     */
    private getFileType(mimeType: string): FileType {
        if (mimeType.startsWith("image/")) {
            return FileType.IMAGE;
        } else if (mimeType.startsWith("video/")) {
            return FileType.VIDEO;
        } else if (mimeType.startsWith("audio/")) {
            return FileType.AUDIO;
        } else if (
            mimeType === "application/pdf" ||
            mimeType === "application/msword" ||
            mimeType.includes("officedocument") ||
            mimeType === "text/plain"
        ) {
            return FileType.DOCUMENT;
        } else if (
            mimeType === "application/zip" ||
            mimeType === "application/x-rar-compressed" ||
            mimeType === "application/x-7z-compressed" ||
            mimeType === "application/x-tar" ||
            mimeType === "application/gzip"
        ) {
            return FileType.ARCHIVE;
        }
        return FileType.OTHER;
    }

    /**
     * 生成存储路径
     *
     * @param fileType 文件类型
     * @param extension 文件扩展名
     * @returns 存储路径和文件名
     */
    private async generateStoragePath(
        fileType: FileType,
        extension: string,
    ): Promise<{ path: string; fileName: string }> {
        // 获取当前日期
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");

        // 生成目录路径: 类型/年份/月份
        const dirPath = path.join(fileType, String(year), month);
        const fullDirPath = path.join(this.storageRoot, dirPath);

        // 确保目录存在
        await fse.ensureDir(fullDirPath);

        // 生成唯一文件名
        const fileName = `${uuidv4()}${extension ? `.${extension}` : ""}`;

        return {
            path: dirPath,
            fileName,
        };
    }

    /**
     * 保存上传文件
     *
     * @param file 上传的文件
     * @param uploaderId 上传者ID
     * @param description 文件描述
     * @returns 保存的文件实体
     */
    async saveUploadedFile(
        file: Express.Multer.File,
        uploaderId?: string,
        description?: string,
    ): Promise<File> {
        if (!file) {
            throw HttpExceptionFactory.badRequest("未找到上传文件", BusinessCode.PARAM_INVALID);
        }

        // 文件名处理
        const originalName = Buffer.from(file.originalname, "latin1").toString("utf8");

        // 获取文件扩展名
        const extension = path.extname(originalName).replace(".", "").toLowerCase();

        // 确定 MIME 类型
        const mimeType = file.mimetype || mime.lookup(originalName) || "application/octet-stream";
        const fileType = this.getFileType(mimeType);

        // 生成存储路径
        const { path: storagePath, fileName } = await this.generateStoragePath(fileType, extension);
        const fullPath = path.join(this.storageRoot, storagePath, fileName);

        try {
            // 将临时文件移动到目标位置
            await fse.writeFile(fullPath, file.buffer);

            // 创建文件记录
            const fileEntity = new File();
            fileEntity.originalName = originalName;
            fileEntity.storageName = fileName;
            fileEntity.type = fileType;
            fileEntity.mimeType = mimeType;
            fileEntity.size = file.size;
            fileEntity.extension = extension;
            fileEntity.path = path.join(storagePath, fileName).replace(/\\/g, "/");
            fileEntity.description = description;

            const relativePath = `/uploads/${fileEntity.path}`;
            fileEntity.url = await this.fileService.get(relativePath);

            if (uploaderId) {
                fileEntity.uploaderId = uploaderId;
            }

            // 保存到数据库
            return (await this.create(fileEntity)) as File;
        } catch (error) {
            // 如果出错，尝试删除已上传的文件
            if (await fse.pathExists(fullPath)) {
                await fse.unlink(fullPath);
            }
            throw HttpExceptionFactory.internal("文件上传失败", BusinessCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 批量保存上传文件
     *
     * @param files 上传的文件数组
     * @param uploaderId 上传者ID
     * @param description 文件描述
     * @returns 保存的文件实体数组
     */
    async saveUploadedFiles(
        files: Express.Multer.File[],
        uploaderId?: string,
        description?: string,
    ): Promise<File[]> {
        if (!files || files.length === 0) {
            throw HttpExceptionFactory.badRequest("未找到上传文件", BusinessCode.PARAM_INVALID);
        }

        const savedFiles: File[] = [];
        for (const file of files) {
            const savedFile = await this.saveUploadedFile(file, uploaderId, description);
            savedFiles.push(savedFile);
        }

        return savedFiles;
    }

    /**
     * 根据ID获取文件
     *
     * @param id 文件ID
     * @returns 文件实体
     */
    async getFileById(id: string): Promise<Partial<File>> {
        return this.findOneById(id);
    }

    /**
     * 删除文件
     *
     * @param id 文件ID
     * @returns 是否成功删除
     */
    async deleteFile(id: string): Promise<boolean> {
        const file = await this.findOneById(id);

        // 删除物理文件
        const filePath = path.join(this.storageRoot, file.path);
        await fse.remove(filePath);

        // 删除数据库记录
        await this.delete(id);
        return true;
    }

    /**
     * 获取文件物理路径
     *
     * @param id 文件ID
     * @returns 文件物理路径
     */
    async getFilePath(id: string): Promise<string> {
        const file = await this.findOneById(id);
        return path.join(this.storageRoot, file.path);
    }
}
