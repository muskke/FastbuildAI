import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { UploadService } from "@modules/web/upload/services/upload.service";
import { Injectable, Logger } from "@nestjs/common";
import { pathExists, readFile } from "fs-extra";

import {
    IndexingSegmentsDto,
    IndexingSegmentsResponseDto,
    ParentSegmentDto,
    SegmentResultDto,
    TextPreprocessingRulesDto,
} from "../dto/indexing-segments.dto";
import { FileParserService } from "./file-parser.service";

/** 句尾分隔正则（预编译） */
const SPLIT_REGEX = /[。！？.!?]\s*/g;
/** 多空格正则 */
const COLLAPSE_WS = /[ \t]{2,}/g;
/** 重复换行正则 */
const COLLAPSE_NL = /\n{2,}/g;

/**
 * 索引服务类
 * 提供知识库分段和清洗功能
 */
@Injectable()
export class IndexingService {
    private readonly logger = new Logger(IndexingService.name);

    constructor(
        private readonly uploadService: UploadService,
        private readonly fileParserService: FileParserService,
    ) {}

    /**
     * 处理分隔符转义
     * 将前端传来的转义字符串转换为实际的分隔符
     * @param segmentIdentifier 分隔符字符串
     * @returns 处理后的分隔符
     */
    private processSegmentIdentifier(segmentIdentifier: string): string {
        return segmentIdentifier
            .replace(/\\n/g, "\n") // 将 \\n 转换为 \n
            .replace(/\\t/g, "\t") // 将 \\t 转换为 \t
            .replace(/\\r/g, "\r"); // 将 \\r 转换为 \r
    }

    /**
     * 根据模式对多个文件进行分段
     */
    async indexingSegments(dto: IndexingSegmentsDto): Promise<IndexingSegmentsResponseDto> {
        const startTime = Date.now();
        this.logger.log(
            `开始处理知识库分段，文件数量: ${dto.fileIds.length}，模式: ${dto.documentMode}`,
        );

        try {
            // 并行处理每个文件，保持文件信息
            const fileResults = await Promise.all(
                dto.fileIds.map(async (fileId) => {
                    const file = await this.uploadService.getFileById(fileId);
                    if (!file) throw new Error(`文件不存在: ${fileId}`);

                    const segments = await this.processFileByMode(fileId, dto);
                    return {
                        fileId,
                        fileName: file.originalName,
                        segments,
                        segmentCount: segments.length,
                    };
                }),
            );

            // 计算总分段数
            const totalSegments = fileResults.reduce((total, file) => total + file.segmentCount, 0);

            const processingTime = Date.now() - startTime;

            return {
                fileResults,
                totalSegments,
                processedFiles: dto.fileIds.length,
                processingTime,
            };
        } catch (error) {
            this.logger.error(`知识库分段处理失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.internal(`分段处理失败: ${error.message}`);
        }
    }

    /**
     * 根据 normal / hierarchical 模式处理单个文件
     */
    private async processFileByMode(
        fileId: string,
        dto: IndexingSegmentsDto,
    ): Promise<ParentSegmentDto[] | SegmentResultDto[]> {
        const file = await this.uploadService.getFileById(fileId);
        if (!file) throw new Error(`文件不存在: ${fileId}`);

        this.logger.log(`处理文件: ${file.originalName}`);
        const raw = await this.readFileContent(fileId, file);
        const preprocess = (txt: string) => this.preprocessText(txt, dto.preprocessingRules);

        // 父子分段
        if (dto.documentMode === "hierarchical") {
            if (!dto.parentContextMode || !dto.subSegmentation) {
                throw new Error("父子分段模式下必须提供父块上下文模式和子分段配置");
            }
            // 父块列表：全文 or 按最大长度分割
            const parents =
                dto.parentContextMode === "fullText"
                    ? [raw]
                    : this.splitLongSegment(
                          raw,
                          this.processSegmentIdentifier(dto.segmentation!.segmentIdentifier),
                          dto.segmentation!.maxSegmentLength,
                          0,
                          false,
                      );

            return parents.flatMap((p, pi) => {
                const cleanParent = preprocess(p);
                if (!cleanParent) return [];

                const children = this.splitLongSegment(
                    cleanParent,
                    this.processSegmentIdentifier(dto.subSegmentation!.segmentIdentifier),
                    dto.subSegmentation!.maxSegmentLength,
                    0,
                    true,
                )
                    .map((c, ci) => ({
                        content: preprocess(c),
                        index: ci,
                        length: c.length,
                    }))
                    .filter((c) => c.content);

                return children.length
                    ? [{ content: cleanParent, index: pi, length: cleanParent.length, children }]
                    : [];
            });
        }

        // 普通分段
        return this.splitLongSegment(
            raw,
            this.processSegmentIdentifier(dto.segmentation!.segmentIdentifier),
            dto.segmentation!.maxSegmentLength,
            dto.segmentation!.segmentOverlap!,
            false,
        )
            .map((seg, i) => ({
                content: preprocess(seg),
                index: i,
                length: seg.length,
            }))
            .filter((s) => s.content);
    }

    /**
     * 按最大长度和重叠度拆分长文本
     */
    private splitLongSegment(
        text: string,
        segmentIdentifier: string,
        maxLength: number,
        overlap: number,
        hasChild: boolean,
    ): string[] {
        // 非子模式：先按用户分隔符粗切
        let initialBlocks: string[] | string | any;
        initialBlocks =
            text.split(segmentIdentifier).join(",").indexOf(",,") !== -1
                ? text.split(segmentIdentifier).join(",").split(",,")
                : text.split(segmentIdentifier);

        if (hasChild) {
            initialBlocks = initialBlocks.join(",").split(",");
        }

        const segments: string[] = [];
        const minAdvance = Math.max(1, Math.floor(maxLength / 4));

        for (const blkRaw of initialBlocks) {
            const blk = blkRaw.trim();
            if (!blk) continue;

            let start = 0;
            while (start < blk.length) {
                let end = Math.min(start + maxLength, blk.length);

                if (end < blk.length) {
                    let lastValid = -1;
                    const slice = blk.substring(start, end);
                    let match: RegExpExecArray | null;
                    while ((match = SPLIT_REGEX.exec(slice))) {
                        lastValid = start + match.index + match[0].length;
                    }
                    if (lastValid > start) {
                        end = lastValid;
                    }
                }

                const part = blk.slice(start, end).trim();
                if (part) {
                    segments.push(part);
                }

                start = end < blk.length ? Math.max(start + minAdvance, end - overlap) : end;
            }
        }

        return segments;
    }

    /**
     * 文本预处理：合并空行/空格、去除 URL 和邮箱
     */
    private preprocessText(text: string, rules?: TextPreprocessingRulesDto): string {
        let result = text.replace(/\n{3,}/g, "\n\n");

        if (rules?.replaceConsecutiveWhitespace) {
            result = result.replace(COLLAPSE_WS, " ").replace(COLLAPSE_NL, "\n").trim();
        }

        if (rules?.removeUrlsAndEmails) {
            result = result
                .replace(/https?:\/\/[\w./:%#\$&\?\(\)~\-+=]+/gi, "")
                .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "")
                .replace(COLLAPSE_WS, " ")
                .replace(COLLAPSE_NL, "\n")
                .trim();
        }

        return result;
    }

    /**
     * 读取文件内容并交给解析服务
     */
    private async readFileContent(fileId: string, file: any): Promise<string> {
        const filePath = await this.uploadService.getFilePath(fileId);
        if (!(await pathExists(filePath))) {
            throw new Error(`文件不存在或已被删除: ${file.originalName}`);
        }

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

        return this.fileParserService.parseFile(mockFile);
    }
}
