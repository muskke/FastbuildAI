import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { UploadService } from "@modules/web/upload/services/upload.service";
import { Injectable, Logger } from "@nestjs/common";
import * as mammoth from "mammoth";

/**
 * 文件解析服务
 * 支持多种格式的文件解析
 */
@Injectable()
export class FileParserService {
    private readonly logger = new Logger(FileParserService.name);

    constructor(private readonly uploadService: UploadService) {}

    /**
     * 获取文件信息
     * @param fileId 文件ID
     * @returns 文件信息
     */
    async getFileInfo(fileId: string) {
        try {
            const fileInfo = await this.uploadService.getFileById(fileId);
            if (!fileInfo) {
                throw new Error(`文件不存在: ${fileId}`);
            }
            return {
                id: fileId,
                name: fileInfo.originalName,
                type: fileInfo.type,
                size: fileInfo.size,
                path: fileInfo.path,
            };
        } catch (error) {
            this.logger.error(`获取文件信息失败: ${error.message}`, error);
            throw HttpExceptionFactory.badRequest(`获取文件信息失败: ${error.message}`);
        }
    }

    /**
     * 根据文件ID解析文件内容
     * @param fileId 文件ID
     * @returns 解析后的文本内容
     */
    async parseFileById(fileId: string): Promise<string> {
        try {
            const file = await this.uploadService.getFileById(fileId);
            if (!file) {
                throw new Error(`文件不存在: ${fileId}`);
            }

            const filePath = await this.uploadService.getFilePath(fileId);
            const { readFile } = await import("fs-extra");
            const buffer = await readFile(filePath);

            const mockFile: Express.Multer.File = {
                buffer,
                originalname: file.originalName,
                mimetype: file.mimeType,
                size: file.size,
                fieldname: "file",
                encoding: "utf-8",
                filename: file.storageName,
                destination: "",
                path: filePath,
                stream: null,
            };

            return this.parseFile(mockFile);
        } catch (error) {
            this.logger.error(`根据文件ID解析文件失败: ${error.message}`, error);
            throw HttpExceptionFactory.badRequest(`解析文件失败: ${error.message}`);
        }
    }

    /**
     * 解析文件内容
     */
    async parseFile(file: Express.Multer.File): Promise<string> {
        if (!file || !file.buffer) {
            throw HttpExceptionFactory.badRequest("文件不能为空");
        }

        const mimeType = file.mimetype.toLowerCase();
        const originalName = file.originalname.toLowerCase();

        // 解析 docx 文件
        if (
            mimeType ===
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            originalName.endsWith(".docx")
        ) {
            return this.parseDocx(file.buffer);
        }

        // 解析纯文本文件
        if (mimeType === "text/plain" || originalName.endsWith(".txt")) {
            return this.parseText(file.buffer);
        }

        // 解析 Markdown 文件
        if (mimeType === "text/markdown" || originalName.endsWith(".md")) {
            return this.parseMarkdown(file.buffer);
        }

        // 解析 doc 文件（暂不支持）
        if (mimeType === "application/msword" || originalName.endsWith(".doc")) {
            throw HttpExceptionFactory.badRequest("暂不支持 .doc 格式，请使用 .docx 格式");
        }

        throw HttpExceptionFactory.badRequest(
            `不支持的文件类型: ${mimeType}，目前仅支持 .docx、.txt 和 .md 文件`,
        );
    }

    /**
     * 解析 docx 文件
     */
    private async parseDocx(buffer: Buffer): Promise<string> {
        try {
            // 🔥 使用不同的mammoth选项来更好地保留文本格式
            const options = {
                includeEmbeddedStyleMap: true,
                ignoreEmptyParagraphs: false,
            };

            const result = await mammoth.extractRawText({ buffer, ...options });
            let text = result.value;

            console.log("🔍 原始mammoth输出 (前500字符):", JSON.stringify(text.substring(0, 500)));

            if (!text || !text.trim()) {
                throw HttpExceptionFactory.badRequest("文档内容为空");
            }

            // 🔥 最小化处理，重点保留标点符号和段落结构
            const processedText = text
                .replace(/\r\n/g, "\n") // 统一换行符
                .replace(/\r/g, "\n") // 统一换行符
                .replace(/\t/g, " ") // 制表符转空格
                .replace(/[ ]{2,}/g, " ") // 合并多个空格
                .replace(/[ ]+\n/g, "\n") // 去除行尾空格
                .replace(/\n[ ]+/g, "\n") // 去除行首空格
                .trim();

            console.log(
                "🔍 处理后文本 (前500字符):",
                JSON.stringify(processedText.substring(0, 500)),
            );

            return processedText;
        } catch (error) {
            throw HttpExceptionFactory.badRequest(`解析 docx 文件失败: ${error.message}`);
        }
    }

    /**
     * 解析纯文本文件
     */
    private parseText(buffer: Buffer): string {
        try {
            const text = buffer.toString("utf-8").trim();

            if (!text) {
                throw HttpExceptionFactory.badRequest("文档内容为空");
            }

            return text;
        } catch (error) {
            throw HttpExceptionFactory.badRequest(`解析文本文件失败: ${error.message}`);
        }
    }

    /**
     * 解析 Markdown 文件
     * 将 Markdown 格式转换为纯文本，保留基本结构
     */
    private parseMarkdown(buffer: Buffer): string {
        try {
            const markdown = buffer.toString("utf-8").trim();

            if (!markdown) {
                throw HttpExceptionFactory.badRequest("文档内容为空");
            }

            // 将 Markdown 转换为纯文本，保留基本结构
            let text = markdown
                .replace(/_([^_]+)_/g, "$1")
                // 统一换行符
                .replace(/\r\n/g, "\n")
                .replace(/\r/g, "\n")
                // 合并多个空行
                .replace(/\n{3,}/g, "\n\n")
                // 去除行首行尾空格
                .replace(/[ ]+\n/g, "\n")
                .replace(/\n[ ]+/g, "\n")
                .trim();

            this.logger.log(
                `Markdown 文件解析成功，原始长度: ${markdown.length}，处理后长度: ${text.length}`,
            );

            return text;
        } catch (error) {
            throw HttpExceptionFactory.badRequest(`解析 Markdown 文件失败: ${error.message}`);
        }
    }

    /**
     * 验证文件类型
     */
    isSupportedFile(file: Express.Multer.File): boolean {
        const mimeType = file.mimetype.toLowerCase();
        const originalName = file.originalname.toLowerCase();

        const supportedMimeTypes = [
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "text/markdown",
        ];

        const supportedExtensions = [".docx", ".txt", ".md"];

        return (
            supportedMimeTypes.includes(mimeType) ||
            supportedExtensions.some((ext) => originalName.endsWith(ext))
        );
    }
}
