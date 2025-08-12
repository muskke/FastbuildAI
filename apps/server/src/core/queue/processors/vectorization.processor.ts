import { Process, Processor } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { Job } from "bull";

import { VectorizationQueueService } from "@/modules/console/ai-datasets/services/vectorization-queue.service";

/**
 * 向量化队列处理器
 * 统一处理所有向量化任务
 */
@Processor("vectorization")
export class VectorizationProcessor {
    private readonly logger = new Logger(VectorizationProcessor.name);

    constructor(private readonly vectorizationQueueService: VectorizationQueueService) {}

    /**
     * 统一处理向量化任务
     * @param job 任务对象
     */
    @Process("vectorization")
    async handleVectorizationJob(job: Job<any>) {
        const { type, params } = job.data;
        const taskType = type === "dataset" ? "知识库" : "文档";
        const taskId = params.documentId || params.datasetId;

        this.logger.log(`开始处理${taskType}向量化任务: ${job.id} - ${taskId}`);
        this.logger.debug(`任务数据: ${JSON.stringify(job.data)}`);

        try {
            // 使用向量化队列服务统一处理
            await this.vectorizationQueueService.processVectorization(type, params, job);

            this.logger.log(`${taskType}向量化任务处理完成: ${job.id} - ${taskId}`);
            return {
                success: true,
                type,
                taskId,
                processedAt: new Date(),
            };
        } catch (error) {
            this.logger.error(`处理${taskType}向量化任务失败: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 处理知识库向量化任务
     * @param job 任务对象
     */
    @Process("dataset")
    async handleDatasetVectorization(job: Job<any>) {
        this.logger.log(`开始处理知识库向量化任务（兼容模式）: ${job.id}`);
        this.logger.debug(`任务数据: ${JSON.stringify(job.data)}`);

        try {
            const { datasetId } = job.data;

            // 使用向量化队列服务处理
            await this.vectorizationQueueService.processVectorization(
                "dataset",
                { datasetId },
                job,
            );

            this.logger.log(`知识库向量化任务处理完成: ${job.id}`);
            return {
                success: true,
                datasetId,
                processedAt: new Date(),
            };
        } catch (error) {
            this.logger.error(`处理知识库向量化任务失败: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 处理文档向量化任务
     * @param job 任务对象
     */
    @Process("document")
    async handleDocumentVectorization(job: Job<any>) {
        this.logger.log(`开始处理文档向量化任务（兼容模式）: ${job.id}`);
        this.logger.debug(`任务数据: ${JSON.stringify(job.data)}`);

        try {
            const { datasetId, documentId } = job.data;

            // 使用向量化队列服务处理
            await this.vectorizationQueueService.processVectorization(
                "document",
                { datasetId, documentId },
                job,
            );

            this.logger.log(`文档向量化任务处理完成: ${job.id}`);
            return {
                success: true,
                documentId,
                processedAt: new Date(),
            };
        } catch (error) {
            this.logger.error(`处理文档向量化任务失败: ${error.message}`, error.stack);
            throw error;
        }
    }
}
