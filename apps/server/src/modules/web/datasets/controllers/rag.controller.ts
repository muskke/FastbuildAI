// import { Playground } from "@common/decorators";
// import { ConsoleController } from "@common/decorators/controller.decorator";
// import { Permissions } from "@common/decorators/permissions.decorator";
// import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
// import { UserPlayground } from "@common/interfaces/context.interface";
// import {
//     Body,
//     Delete,
//     Get,
//     Param,
//     Post,
//     Query,
//     UploadedFile,
//     UseInterceptors,
// } from "@nestjs/common";
// import { FileInterceptor } from "@nestjs/platform-express";

// import { RAGChatDto } from "../dto/rag-chat.dto";
// import { UploadDocumentDto } from "../dto/upload-document.dto";
// import { FileParserService } from "../services/file-parser.service";
// import { RAGService } from "../services/rag.service";

// /**
//  * RAG 控制器
//  * 提供文档管理和智能问答功能
//  */
// @ConsoleController("rag", "RAG智能问答")
// export class RAGController {
//     constructor(
//         private readonly ragService: RAGService,
//         private readonly fileParserService: FileParserService,
//     ) {}

//     /**
//      * 上传文档文件
//      */
//     @Post("upload")
//     @UseInterceptors(FileInterceptor("file"))
//     @Permissions({
//         code: "upload",
//         name: "上传文档",
//         description: "上传文档文件进行向量化训练",
//     })
//     async uploadFile(
//         @UploadedFile() file: Express.Multer.File,
//         @Body() dto: UploadDocumentDto,
//         @Playground() user?: UserPlayground,
//     ) {
//         this.validateFileUpload(file);

//         // 解析文件内容
//         const content = await this.fileParserService.parseFile(file);
//         const title = dto.title || this.extractFileName(file.originalname);

//         // 创建文档
//         const document = await this.ragService.uploadDocument({
//             ...dto,
//             title,
//             content,
//             userId: user?.id,
//             fileSize: file.size,
//             fileType: file.mimetype,
//         });

//         return {
//             ...document,
//             message: "文档上传成功，正在后台处理中...",
//         };
//     }

//     /**
//      * RAG 智能问答
//      */
//     @Post("chat")
//     @Permissions({
//         code: "chat",
//         name: "RAG 问答",
//         description: "使用 RAG 进行智能问答",
//     })
//     async chat(@Body() dto: RAGChatDto, @Playground() user?: UserPlayground) {
//         return await this.ragService.chat(user?.id, dto);
//     }

//     /**
//      * 获取用户文档列表
//      */
//     @Get("documents")
//     @Permissions({
//         code: "read",
//         name: "查看文档",
//         description: "获取用户的文档列表",
//     })
//     async getUserDocuments(@Query() query: any, @Playground() user?: UserPlayground) {
//         return await this.ragService.getUserDocuments({
//             ...query,
//             userId: user?.id,
//         });
//     }

//     /**
//      * 删除文档
//      */
//     @Delete("documents/:documentId")
//     @Permissions({
//         code: "delete",
//         name: "删除文档",
//         description: "删除指定的文档",
//     })
//     async deleteDocument(
//         @Param("documentId") documentId: string,
//         @Playground() user?: UserPlayground,
//     ) {
//         await this.ragService.deleteDocument(documentId, user?.id);
//         return { message: "文档删除成功" };
//     }

//     /**
//      * 重新训练文档
//      */
//     @Post("retrain/:documentId")
//     @Permissions({
//         code: "retrain",
//         name: "重新训练文档",
//         description: "重新训练指定的文档",
//     })
//     async retrainDocument(
//         @Param("documentId") documentId: string,
//         @Body() body?: { embeddingModelId?: string },
//         @Playground() user?: UserPlayground,
//     ) {
//         await this.ragService.retrainDocument(documentId, user?.id, body?.embeddingModelId);
//         return { message: "文档重新训练已开始" };
//     }

//     /**
//      * 手动训练文档
//      */
//     @Post("train/:documentId")
//     @Permissions({
//         code: "train",
//         name: "训练文档",
//         description: "手动训练文档进行向量化",
//     })
//     async trainDocument(
//         @Param("documentId") documentId: string,
//         @Playground() user?: UserPlayground,
//     ) {
//         await this.ragService.trainDocument(documentId);
//         return { message: "文档训练已开始" };
//     }

//     // ========================= 私有方法 =========================

//     /**
//      * 验证文件上传
//      */
//     private validateFileUpload(file: Express.Multer.File): void {
//         if (!file) {
//             throw HttpExceptionFactory.badRequest("请选择要上传的文件");
//         }

//         if (!this.fileParserService.isSupportedFile(file)) {
//             throw HttpExceptionFactory.badRequest("不支持的文件类型，仅支持 .docx 和 .txt 文件");
//         }
//     }

//     /**
//      * 提取文件名（移除扩展名）
//      */
//     private extractFileName(originalName: string): string {
//         return originalName.replace(/\.[^/.]+$/, "");
//     }
// }
