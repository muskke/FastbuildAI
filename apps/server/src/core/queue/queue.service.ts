import { InjectQueue } from "@nestjs/bull";
import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bull";

/**
 * 队列服务
 *
 * 提供任务队列的管理和操作功能
 */
@Injectable()
export class QueueService {
    private readonly logger = new Logger(QueueService.name);

    constructor(
        @InjectQueue("default") private defaultQueue: Queue,
        @InjectQueue("email") private emailQueue: Queue,
        @InjectQueue("vectorization") private vectorizationQueue: Queue,
    ) {}

    /**
     * 添加任务到默认队列
     * @param name 任务名称
     * @param data 任务数据
     * @param options 任务选项
     */
    async addToDefaultQueue(name: string, data: any, options?: any) {
        try {
            const job = await this.defaultQueue.add(name, data, options);
            this.logger.log(`任务已添加到默认队列: ${job.id}`);
            return job;
        } catch (error) {
            this.logger.error(`添加任务到默认队列失败: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 添加任务到邮件队列
     * @param name 任务名称
     * @param data 任务数据
     * @param options 任务选项
     */
    async addToEmailQueue(name: string, data: any, options?: any) {
        try {
            const job = await this.emailQueue.add(name, data, options);
            this.logger.log(`任务已添加到邮件队列: ${job.id}`);
            return job;
        } catch (error) {
            this.logger.error(`添加任务到邮件队列失败: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 统一添加向量化任务
     * @param type 任务类型: 'dataset' | 'document'
     * @param params 任务参数
     * @param options 任务选项
     */
    async addVectorizationJob(
        type: "dataset" | "document",
        params: { datasetId: string; documentId?: string },
        options?: any,
    ) {
        try {
            const job = await this.vectorizationQueue.add(
                "vectorization",
                { type, params },
                {
                    attempts: 3,
                    backoff: {
                        type: "exponential",
                        delay: 2000,
                    },
                    removeOnComplete: true,
                    removeOnFail: false,
                    ...options,
                },
            );

            const taskType = type === "dataset" ? "知识库" : "文档";
            const taskId = params.documentId || params.datasetId;
            this.logger.log(`${taskType}向量化任务已添加到队列: ${job.id} - ${taskId}`);
            return job;
        } catch (error) {
            this.logger.error(`添加向量化任务失败: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 添加知识库向量化任务
     */
    async addDatasetVectorizationJob(datasetId: string, options?: any) {
        return this.addVectorizationJob("dataset", { datasetId }, options);
    }

    /**
     * 添加文档向量化任务
     */
    async addDocumentVectorizationJob(datasetId: string, documentId: string, options?: any) {
        return this.addVectorizationJob("document", { datasetId, documentId }, options);
    }

    /**
     * 获取默认队列的所有任务
     */
    async getDefaultQueueJobs() {
        try {
            const [waiting, active, completed, failed] = await Promise.all([
                this.defaultQueue.getWaiting(),
                this.defaultQueue.getActive(),
                this.defaultQueue.getCompleted(),
                this.defaultQueue.getFailed(),
            ]);

            return {
                waiting: waiting.map((job) => this.formatJob(job)),
                active: active.map((job) => this.formatJob(job)),
                completed: completed.map((job) => this.formatJob(job)),
                failed: failed.map((job) => this.formatJob(job)),
            };
        } catch (error) {
            this.logger.error(`获取默认队列任务失败: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 获取邮件队列的所有任务
     */
    async getEmailQueueJobs() {
        try {
            const [waiting, active, completed, failed] = await Promise.all([
                this.emailQueue.getWaiting(),
                this.emailQueue.getActive(),
                this.emailQueue.getCompleted(),
                this.emailQueue.getFailed(),
            ]);

            return {
                waiting: waiting.map((job) => this.formatJob(job)),
                active: active.map((job) => this.formatJob(job)),
                completed: completed.map((job) => this.formatJob(job)),
                failed: failed.map((job) => this.formatJob(job)),
            };
        } catch (error) {
            this.logger.error(`获取邮件队列任务失败: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 获取向量化队列的所有任务
     */
    async getVectorizationQueueJobs() {
        try {
            const [waiting, active, completed, failed] = await Promise.all([
                this.vectorizationQueue.getWaiting(),
                this.vectorizationQueue.getActive(),
                this.vectorizationQueue.getCompleted(),
                this.vectorizationQueue.getFailed(),
            ]);

            return {
                waiting: waiting.map((job) => this.formatJob(job)),
                active: active.map((job) => this.formatJob(job)),
                completed: completed.map((job) => this.formatJob(job)),
                failed: failed.map((job) => this.formatJob(job)),
            };
        } catch (error) {
            this.logger.error(`获取向量化队列任务失败: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 获取指定队列的任务详情
     * @param queueName 队列名称
     * @param jobId 任务ID
     */
    async getJobById(queueName: string, jobId: string) {
        try {
            const queue = this.getQueueByName(queueName);
            const job = await queue.getJob(jobId);
            return job ? this.formatJob(job) : null;
        } catch (error) {
            this.logger.error(`获取任务详情失败: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 删除指定队列的任务
     * @param queueName 队列名称
     * @param jobId 任务ID
     */
    async removeJob(queueName: string, jobId: string) {
        try {
            const queue = this.getQueueByName(queueName);
            const job = await queue.getJob(jobId);
            if (!job) return false;

            await job.remove();
            this.logger.log(`任务已删除: ${queueName}/${jobId}`);
            return true;
        } catch (error) {
            this.logger.error(`删除任务失败: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 重试指定队列的失败任务
     * @param queueName 队列名称
     * @param jobId 任务ID
     */
    async retryJob(queueName: string, jobId: string) {
        try {
            const queue = this.getQueueByName(queueName);
            const job = await queue.getJob(jobId);
            if (!job) return false;

            await job.retry();
            this.logger.log(`任务已重试: ${queueName}/${jobId}`);
            return true;
        } catch (error) {
            this.logger.error(`重试任务失败: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 根据队列名称获取队列实例
     * @param queueName 队列名称
     */
    private getQueueByName(queueName: string): Queue {
        switch (queueName) {
            case "default":
                return this.defaultQueue;
            case "email":
                return this.emailQueue;
            case "vectorization":
                return this.vectorizationQueue;
            default:
                throw new Error(`未知的队列名称: ${queueName}`);
        }
    }

    /**
     * 格式化任务信息
     * @param job 任务对象
     */
    private formatJob(job: any) {
        return {
            id: job.id,
            name: job.name,
            data: job.data,
            opts: job.opts,
            progress: job.progress(),
            attemptsMade: job.attemptsMade,
            finishedOn: job.finishedOn,
            processedOn: job.processedOn,
            timestamp: job.timestamp,
            stacktrace: job.stacktrace,
            returnvalue: job.returnvalue,
            failedReason: job.failedReason,
        };
    }
}
