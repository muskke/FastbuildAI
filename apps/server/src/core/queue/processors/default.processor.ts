import { Process, Processor } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { Job } from "bull";

/**
 * 默认队列处理器
 *
 * 处理默认队列中的任务
 */
@Processor("default")
export class DefaultProcessor {
    private readonly logger = new Logger(DefaultProcessor.name);

    /**
     * 处理通用任务
     * @param job 任务对象
     */
    @Process("generic")
    async handleGenericJob(job: Job<any>) {
        this.logger.log(`开始处理通用任务: ${job.id}`);
        this.logger.debug(`任务数据: ${JSON.stringify(job.data)}`);

        try {
            // 模拟任务处理
            await this.simulateProcessing(job.data.duration || 1000);

            // 更新任务进度
            await job.progress(100);

            this.logger.log(`通用任务处理完成: ${job.id}`);
            return { success: true, processedAt: new Date() };
        } catch (error) {
            this.logger.error(`处理通用任务失败: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 处理数据导入任务
     * @param job 任务对象
     */
    @Process("import")
    async handleImportJob(job: Job<any>) {
        this.logger.log(`开始处理数据导入任务: ${job.id}`);
        this.logger.debug(`任务数据: ${JSON.stringify(job.data)}`);

        try {
            const { items, options } = job.data;
            const totalItems = items?.length || 10;

            // 模拟分批处理数据
            for (let i = 0; i < totalItems; i++) {
                // 更新任务进度
                await job.progress(Math.floor((i / totalItems) * 100));

                // 模拟处理每个项目
                await this.simulateProcessing(100);

                this.logger.debug(`已处理项目 ${i + 1}/${totalItems}`);
            }

            // 完成任务
            await job.progress(100);

            this.logger.log(`数据导入任务处理完成: ${job.id}`);
            return {
                success: true,
                processedItems: totalItems,
                processedAt: new Date(),
                options,
            };
        } catch (error) {
            this.logger.error(`处理数据导入任务失败: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 模拟任务处理
     * @param ms 处理时间（毫秒）
     */
    private async simulateProcessing(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
