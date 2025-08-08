// import { BaseService } from "@common/base/services/base.service";
// import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
// import { AiModelService } from "@modules/console/ai/services/ai-model.service";
// import { Injectable, Logger } from "@nestjs/common";
// import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
// import { getProvider } from "@sdk/ai/utils/get-provider";
// import { DataSource, Repository } from "typeorm";

// import { QueryRAGDocumentDto } from "../dto/query-rag-document.dto";
// import { RAGChatDto } from "../dto/rag-chat.dto";
// import { UploadDocumentDto } from "../dto/upload-document.dto";
// import { Document } from "../entities/document.entity";
// import { VectorChunk } from "../entities/vector-chunk.entity";
// import { DocumentChunk, RAGChatResult } from "../interfaces/rag-engine.interface";
// import { createRAGEngine } from "../rag-engine";

// /**
//  * 上传文档扩展接口
//  */
// export interface UploadDocumentExtendedDto extends UploadDocumentDto {
//     content: string;
//     userId: string;
//     fileSize?: number;
//     fileType?: string;
//     metadata?: any;
// }

// /**
//  * RAG 服务常量配置
//  */
// const RAG_SERVICE_CONSTANTS = {
//     DEFAULT_CHUNK_SIZE: 1000,
//     DEFAULT_CHUNK_OVERLAP: 200,
//     DEFAULT_TOP_K: 10,
//     DEFAULT_TOP_N: 5,
//     BATCH_SIZE: 10,
//     STATUS: {
//         PENDING: "pending",
//         PROCESSING: "processing",
//         COMPLETED: "completed",
//         FAILED: "failed",
//     } as const,
// } as const;

// /**
//  * RAG 服务 - 优化重构版本
//  * 简洁优雅的 RAG 实现，支持三适配器架构
//  */
// @Injectable()
// export class RAGService extends BaseService<Document> {
//     protected readonly logger = new Logger(RAGService.name);

//     constructor(
//         @InjectRepository(Document)
//         private readonly documentRepository: Repository<Document>,
//         @InjectRepository(VectorChunk)
//         private readonly vectorChunkRepository: Repository<VectorChunk>,
//         @InjectDataSource()
//         protected readonly dataSource: DataSource,
//         private readonly aiModelService: AiModelService,
//     ) {
//         super(documentRepository);
//     }

//     /**
//      * 上传文档
//      */
//     async uploadDocument(uploadDto: UploadDocumentExtendedDto): Promise<Document> {
//         this.logger.log(`开始上传文档: ${uploadDto.title}`);

//         // 获取向量模型
//         const embeddingModel = await this.resolveModel(uploadDto.embeddingModelId);
//         if (!embeddingModel) {
//             throw HttpExceptionFactory.badRequest("未找到可用的向量模型");
//         }

//         // 创建文档记录
//         const document = this.documentRepository.create({
//             title: uploadDto.title,
//             content: uploadDto.content,
//             fileType: uploadDto.fileType || "text",
//             fileSize: uploadDto.fileSize || uploadDto.content.length,
//             userId: uploadDto.userId,
//             embeddingModel: embeddingModel.model,
//             chunkConfig: {
//                 chunkSize: uploadDto.chunkSize || RAG_SERVICE_CONSTANTS.DEFAULT_CHUNK_SIZE,
//                 chunkOverlap: uploadDto.chunkOverlap || RAG_SERVICE_CONSTANTS.DEFAULT_CHUNK_OVERLAP,
//             },
//             status: RAG_SERVICE_CONSTANTS.STATUS.PENDING,
//         });

//         const savedDocument = await this.documentRepository.save(document);

//         // 异步训练文档
//         this.trainDocumentAsync(savedDocument.id, embeddingModel);

//         this.logger.log(`文档上传成功: ${savedDocument.id}`);
//         return savedDocument;
//     }

//     /**
//      * 训练文档（异步）
//      */
//     private async trainDocumentAsync(documentId: string, embeddingModel: any): Promise<void> {
//         try {
//             await this.trainDocument(documentId, embeddingModel);
//         } catch (error) {
//             this.logger.error(`文档训练失败: ${documentId}`, error);
//             await this.documentRepository.update(documentId, {
//                 status: RAG_SERVICE_CONSTANTS.STATUS.FAILED,
//                 errorMessage: error.message,
//             });
//         }
//     }

//     /**
//      * 训练文档（向量化）
//      */
//     async trainDocument(documentId: string, embeddingModel?: any): Promise<void> {
//         this.logger.log(`开始训练文档: ${documentId}`);

//         const document = await this.documentRepository.findOne({
//             where: { id: documentId },
//         });

//         if (!document) {
//             throw HttpExceptionFactory.notFound(`文档不存在: ${documentId}`);
//         }

//         // 更新状态
//         await this.documentRepository.update(documentId, {
//             status: RAG_SERVICE_CONSTANTS.STATUS.PROCESSING,
//         });

//         try {
//             // 解析向量模型
//             const model = embeddingModel || (await this.resolveModel(document.embeddingModel));
//             if (!model) {
//                 throw new Error("未找到可用的向量模型");
//             }

//             // 创建向量适配器
//             const adapter = getProvider(model.provider.provider, {
//                 apiKey: model.provider.apiKey,
//                 baseURL: model.provider.baseUrl,
//             });

//             // 文档分块
//             const chunks = this.splitText(document.content, document.chunkConfig);

//             // 生成向量（分批处理）
//             const embeddings = await this.generateEmbeddings(adapter, chunks, model.model);

//             // 保存向量块
//             await this.saveVectorChunks(documentId, chunks, embeddings);

//             // 更新文档状态
//             await this.documentRepository.update(documentId, {
//                 status: RAG_SERVICE_CONSTANTS.STATUS.COMPLETED,
//             });

//             this.logger.log(`文档训练完成: ${documentId}`);
//         } catch (error) {
//             this.logger.error(`文档训练失败: ${error.message}`, error);
//             await this.documentRepository.update(documentId, {
//                 status: RAG_SERVICE_CONSTANTS.STATUS.FAILED,
//                 errorMessage: error.message,
//             });
//             throw error;
//         }
//     }

//     /**
//      * RAG 问答
//      */
//     async chat(userId: string, chatDto: RAGChatDto): Promise<RAGChatResult> {
//         this.logger.log(`开始 RAG 问答: ${chatDto.query}`);

//         // 获取用户的向量数据
//         const documentChunks = await this.getUserVectorChunks(userId);
//         if (documentChunks.length === 0) {
//             throw HttpExceptionFactory.badRequest("没有找到已训练的文档，请先上传并训练文档");
//         }

//         // 获取三个模型配置
//         const [embeddingModel, textModel, rerankModel] = await Promise.all([
//             this.resolveModel(chatDto.embeddingModelId),
//             this.resolveModel(chatDto.textModelId),
//             chatDto.rerankModelId ? this.resolveModel(chatDto.rerankModelId) : null,
//         ]);

//         if (!embeddingModel || !textModel) {
//             throw HttpExceptionFactory.badRequest("未找到可用的AI模型");
//         }

//         // 创建三个独立的适配器
//         const embeddingAdapter = getProvider(embeddingModel.provider.provider, {
//             apiKey: embeddingModel.provider.apiKey,
//             baseURL: embeddingModel.provider.baseUrl,
//         });

//         const textAdapter = getProvider(textModel.provider.provider, {
//             apiKey: textModel.provider.apiKey,
//             baseURL: textModel.provider.baseUrl,
//         });

//         const rerankAdapter = rerankModel
//             ? getProvider(rerankModel.provider.provider, {
//                   apiKey: rerankModel.provider.apiKey,
//                   baseURL: rerankModel.provider.baseUrl,
//               })
//             : undefined;

//         // 创建 RAG 引擎
//         const ragEngine = createRAGEngine(
//             embeddingAdapter,
//             textAdapter,
//             {
//                 embeddingModel: embeddingModel.model,
//                 textModel: textModel.model,
//                 rerankModel: rerankModel?.model,
//                 topK: chatDto.topK || RAG_SERVICE_CONSTANTS.DEFAULT_TOP_K,
//                 topN: chatDto.topN || RAG_SERVICE_CONSTANTS.DEFAULT_TOP_N,
//                 textModelConfig: this.getModelConfig(textModel),
//             },
//             rerankAdapter,
//         );

//         // 执行 RAG 问答
//         const result = await ragEngine.chat(chatDto.query, documentChunks);

//         this.logger.log(`RAG 问答完成，找到 ${result.sources.length} 个相关文档`);
//         return result;
//     }

//     /**
//      * 获取用户文档列表
//      */
//     async getUserDocuments(query: QueryRAGDocumentDto): Promise<any> {
//         const { userId, title, status, page = 1, pageSize = 10 } = query;

//         const queryBuilder = this.documentRepository.createQueryBuilder("document");

//         if (userId) {
//             queryBuilder.where("document.userId = :userId", { userId });
//         }

//         if (title) {
//             queryBuilder.andWhere("document.title ILIKE :title", { title: `%${title}%` });
//         }

//         if (status) {
//             queryBuilder.andWhere("document.status = :status", { status });
//         }

//         queryBuilder.orderBy("document.createdAt", "DESC");

//         const [documents, total] = await queryBuilder
//             .skip((page - 1) * pageSize)
//             .take(pageSize)
//             .getManyAndCount();

//         return {
//             data: documents,
//             pagination: {
//                 page,
//                 pageSize,
//                 total,
//                 totalPages: Math.ceil(total / pageSize),
//             },
//         };
//     }

//     /**
//      * 删除文档
//      */
//     async deleteDocument(documentId: string, userId?: string): Promise<void> {
//         const where: any = { id: documentId };
//         if (userId) {
//             where.userId = userId;
//         }

//         const document = await this.documentRepository.findOne({ where });
//         if (!document) {
//             throw HttpExceptionFactory.notFound(`文档不存在或无权限删除: ${documentId}`);
//         }

//         // 删除关联的向量块
//         await this.vectorChunkRepository.delete({ documentId });

//         // 删除文档
//         await this.documentRepository.delete(documentId);
//         this.logger.log(`文档删除成功: ${documentId}`);
//     }

//     /**
//      * 重新训练文档
//      */
//     async retrainDocument(
//         documentId: string,
//         userId?: string,
//         embeddingModelId?: string,
//     ): Promise<void> {
//         const where: any = { id: documentId };
//         if (userId) {
//             where.userId = userId;
//         }

//         const document = await this.documentRepository.findOne({ where });
//         if (!document) {
//             throw HttpExceptionFactory.notFound(`文档不存在或无权限: ${documentId}`);
//         }

//         // 删除现有向量块
//         await this.vectorChunkRepository.delete({ documentId });

//         // 重新训练
//         const embeddingModel = await this.resolveModel(embeddingModelId);
//         await this.trainDocument(documentId, embeddingModel);
//     }

//     // =========================== 私有方法 ===========================

//     /**
//      * 解析模型配置
//      */
//     private async resolveModel(modelId?: string): Promise<any> {
//         return await this.aiModelService.findOne({
//             where: { id: modelId, isActive: true },
//             relations: ["provider"],
//         });
//     }

//     /**
//      * 获取用户的向量块
//      */
//     private async getUserVectorChunks(userId: string): Promise<DocumentChunk[]> {
//         const vectorChunks = await this.vectorChunkRepository
//             .createQueryBuilder("chunk")
//             .innerJoin("chunk.document", "document")
//             .where("document.userId = :userId", { userId })
//             .andWhere("document.status = :status", {
//                 status: RAG_SERVICE_CONSTANTS.STATUS.COMPLETED,
//             })
//             .select(["chunk.id", "chunk.content", "chunk.embedding", "chunk.metadata"])
//             .getMany();

//         return vectorChunks.map((chunk) => ({
//             id: chunk.id,
//             content: chunk.content,
//             embedding: chunk.embedding,
//             metadata: chunk.metadata,
//         }));
//     }

//     /**
//      * 文本分块
//      */
//     private splitText(text: string, config: any): string[] {
//         const {
//             chunkSize = RAG_SERVICE_CONSTANTS.DEFAULT_CHUNK_SIZE,
//             chunkOverlap = RAG_SERVICE_CONSTANTS.DEFAULT_CHUNK_OVERLAP,
//         } = config;
//         const chunks: string[] = [];

//         for (let i = 0; i < text.length; i += chunkSize - chunkOverlap) {
//             const chunk = text.slice(i, i + chunkSize);
//             if (chunk.trim()) {
//                 chunks.push(chunk.trim());
//             }
//         }

//         return chunks;
//     }

//     /**
//      * 生成向量嵌入（分批处理）
//      */
//     private async generateEmbeddings(
//         adapter: any,
//         texts: string[],
//         model: string,
//     ): Promise<number[][]> {
//         const allEmbeddings: number[][] = [];
//         const batchSize = RAG_SERVICE_CONSTANTS.BATCH_SIZE; // 批处理大小

//         for (let i = 0; i < texts.length; i += batchSize) {
//             const batch = texts.slice(i, i + batchSize);
//             const response = await adapter.generateEmbedding({
//                 input: batch,
//                 model: model,
//             });
//             const batchEmbeddings = response.data.map((item: any) => item.embedding);
//             allEmbeddings.push(...batchEmbeddings);
//         }

//         return allEmbeddings;
//     }

//     /**
//      * 保存向量块
//      */
//     private async saveVectorChunks(
//         documentId: string,
//         chunks: string[],
//         embeddings: number[][],
//     ): Promise<void> {
//         const vectorChunks = chunks.map((content, index) => ({
//             documentId,
//             content,
//             embedding: embeddings[index],
//             chunkIndex: index,
//             metadata: {},
//         }));

//         await this.vectorChunkRepository.save(vectorChunks);
//     }

//     /**
//      * 获取模型配置
//      */
//     private getModelConfig(model: any): Record<string, any> {
//         if (!model.provider?.globalConfig) {
//             return {};
//         }

//         return model.provider.globalConfig
//             .filter((item: any) => item.enable)
//             .reduce((config: any, item: any) => {
//                 config[item.alias || item.field] = item.value;
//                 return config;
//             }, {});
//     }
// }
