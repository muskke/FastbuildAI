import { BaseController } from "@common/base/controllers/base.controller";
import { WebController } from "@common/decorators/controller.decorator";
import { BuildFileUrl } from "@common/decorators/file-url.decorator";
import { Playground } from "@common/decorators/playground.decorator";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { UserPlayground } from "@common/interfaces/context.interface";
import { UUIDValidationPipe } from "@common/pipe/param-validate.pipe";
import {
    Body,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Query,
    Res,
    UploadedFile,
    UploadedFiles,
    UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import * as fse from "fs-extra";

import { QueryFileDto } from "../dto/query-file.dto";
import { UploadFileDto } from "../dto/upload-file.dto";
import { UploadService } from "../services/upload.service";

/**
 * 文件上传控制器
 *
 * 处理文件上传、查询和下载等请求
 */
@WebController("upload")
export class UploadController extends BaseController {
    /**
     * 构造函数
     *
     * @param uploadService 文件上传服务
     */
    constructor(private readonly uploadService: UploadService) {
        super();
    }

    /**
     * 上传单个文件
     *
     * @param file 上传的文件
     * @param dto 上传参数
     * @param req 请求对象
     * @returns 上传的文件信息
     */
    @Post("file")
    @UseInterceptors(FileInterceptor("file"))
    @BuildFileUrl(["**.url"])
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UploadFileDto,
        @Playground() user: UserPlayground,
    ) {
        // 获取当前用户ID
        const uploaderId = user.id;

        // 保存文件
        return this.uploadService.saveUploadedFile(file, uploaderId, dto.description);
    }

    /**
     * 上传多个文件
     *
     * @param files 上传的文件数组
     * @param dto 上传参数
     * @returns 上传的文件信息数组
     */
    @Post("files")
    @UseInterceptors(FilesInterceptor("files", 10)) // 最多10个文件
    @BuildFileUrl(["**.url"])
    async uploadFiles(
        @UploadedFiles() files: Express.Multer.File[],
        @Body() dto: UploadFileDto,
        @Playground() user: UserPlayground,
    ) {
        // 获取当前用户ID
        const uploaderId = user.id;

        // 保存文件
        return this.uploadService.saveUploadedFiles(files, uploaderId, dto.description);
    }

    /**
     * 获取文件列表
     *
     * @param query 查询参数
     * @returns 分页的文件列表
     */
    @Get()
    @BuildFileUrl(["**.url"])
    async getFiles(@Query() query: QueryFileDto) {
        // 构建查询条件
        const where: any = {};

        if (query.type) {
            where.type = query.type;
        }

        if (query.uploaderId) {
            where.uploaderId = query.uploaderId;
        }

        if (query.keyword) {
            where.originalName = { like: `%${query.keyword}%` };
        }

        // 查询文件
        return this.uploadService.paginate(query, {
            where,
            order: { createdAt: "DESC" },
        });
    }

    /**
     * 获取文件详情
     *
     * @param id 文件ID
     * @returns 文件详情
     */
    @Get(":id")
    @BuildFileUrl(["**.url"])
    async getFile(@Param("id", UUIDValidationPipe) id: string) {
        return this.uploadService.getFileById(id);
    }

    /**
     * 下载文件
     *
     * @param id 文件ID
     * @param res 响应对象
     */
    @Get("download/:id")
    async downloadFile(@Param("id", UUIDValidationPipe) id: string, @Res() res: Response) {
        // 获取文件信息
        const file = await this.uploadService.getFileById(id);

        // 获取文件物理路径
        const filePath = await this.uploadService.getFilePath(id);

        // 检查文件是否存在
        if (!(await fse.pathExists(filePath))) {
            throw HttpExceptionFactory.notFound("文件不存在或已被删除");
        }

        // 设置响应头
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${encodeURIComponent(file.originalName)}`,
        );
        res.setHeader("Content-Type", file.mimeType);

        // 发送文件
        const fileStream = fse.createReadStream(filePath);
        fileStream.pipe(res);
    }

    /**
     * 删除文件
     *
     * @param id 文件ID
     * @returns 删除结果
     */
    @Delete(":id")
    async deleteFile(@Param("id", UUIDValidationPipe) id: string) {
        return this.uploadService.deleteFile(id);
    }
}
