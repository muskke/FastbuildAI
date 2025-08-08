import { Playground } from "@common/decorators";
import { WebController } from "@common/decorators/controller.decorator";
import { UserPlayground } from "@common/interfaces/context.interface";
import { Body, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";

import {
    CreateDatasetDto,
    DeleteDatasetDto,
    QueryDatasetDto,
    QueryKnowledgeDto,
    RetrievalTestDto,
    UpdateDatasetDto,
} from "../dto/datasets.dto";
import { IndexingSegmentsDto, IndexingSegmentsResponseDto } from "../dto/indexing-segments.dto";
import { Datasets } from "../entities/datasets.entity";
import { DatasetPermission } from "../guards/datasets-permission.guard";
import { DatasetsService } from "../services/datasets.service";
import { DatasetsRetrievalService } from "../services/datasets-retrieval.service";
import { IndexingService } from "../services/indexing.service";

/**
 * 数据集控制器
 * 提供知识库创建、管理和文档处理功能
 */
@WebController("datasets")
export class DatasetsController {
    constructor(
        private readonly datasetsService: DatasetsService,
        private readonly datasetsRetrievalService: DatasetsRetrievalService,
        private readonly indexingService: IndexingService,
    ) {}

    /**
     * 创建知识库
     *
     * 创建一个新的知识库，包含分段设置、embedding模型和检索配置
     *
     * @param dto 知识库创建参数
     * @param user 当前用户信息
     * @returns 创建结果
     */
    @Post("create")
    async create(
        @Body() dto: CreateDatasetDto,
        @Playground() user: UserPlayground,
    ): Promise<Datasets> {
        return this.datasetsService.createDatasets(dto, user);
    }

    /**
     * 创建空知识库
     * 创建一个空知识库，只包含名称和描述
     *
     * @param dto 知识库创建参数
     * @param user 当前用户信息
     * @returns 创建结果
     */
    @Post("create-empty")
    async createEmpty(
        @Body() dto: { name: string; description?: string },
        @Playground() user: UserPlayground,
    ): Promise<Datasets> {
        return this.datasetsService.createEmptyDataset(dto, user);
    }

    /**
     * 数据集分段和清洗
     *
     * 根据提供的文件ID列表，读取文件内容并进行分段清洗处理
     * 不存储到数据库，直接返回分段结果
     *
     * @param dto 分段参数，包含分段配置和文件ID列表
     * @param user 当前用户信息
     * @returns 分段处理结果
     */
    @Post("indexing-segments")
    async indexingSegments(
        @Body() dto: IndexingSegmentsDto,
        @Playground() user?: UserPlayground,
    ): Promise<IndexingSegmentsResponseDto> {
        const result = await this.indexingService.indexingSegments(dto);
        // 限制分段数量为20--防止前端渲染太多可能导致卡死状况
        if (Array.isArray(result.fileResults)) {
            result.fileResults = result.fileResults.map((fileResult) => ({
                ...fileResult,
                segments: Array.isArray(fileResult.segments)
                    ? fileResult.segments.slice(0, 20)
                    : fileResult.segments,
            }));
        }
        return result;
    }

    /**
     * 获取知识库列表
     *
     * 支持关键词搜索知识库名称和描述
     *
     * @param dto 查询参数
     * @param user 当前用户信息
     * @returns 知识库列表和分页信息
     */
    @Get()
    async list(@Query() dto: QueryDatasetDto, @Playground() user: UserPlayground) {
        return this.datasetsService.list(dto, user.id);
    }

    /**
     * 获取知识库详情
     *
     * @param id 知识库ID
     * @param user 当前用户信息
     * @returns 知识库详情
     */
    @Get(":id")
    async getById(@Param("id") id: string, @Playground() user: UserPlayground): Promise<Datasets> {
        return this.datasetsService.getDatasetById(id, user.id);
    }

    /**
     * 知识库编辑
     *
     * 对知识库已有的内容来源进行编辑
     *
     * @param id 知识库ID
     * @param dto 查询参数
     * @param user 当前用户信息
     * @returns 检索结果
     */
    @Patch(":id/update")
    @DatasetPermission({ permission: "canManageDataset", datasetIdParam: "id" })
    async updadteDataset(
        @Param("id") id: string,
        @Body() dto: UpdateDatasetDto,
        @Playground() user: UserPlayground,
    ) {
        return this.datasetsService.updateDataset(id, user.id, dto);
    }

    /**
     * 删除知识库
     *
     * 删除知识库及其相关的文档和分段数据
     *
     * @param dto 删除参数
     * @param user 当前用户信息
     * @returns 删除结果
     */
    @Delete(":id")
    @DatasetPermission({ permission: "canDelete", datasetIdParam: "id" })
    async remove(@Param() dto: DeleteDatasetDto, @Playground() user: UserPlayground) {
        const success = await this.datasetsService.deleteDataset(dto.id);
        return { success };
    }

    /**
     * 召回测试接口
     *
     * 允许传递自定义的 retrievalConfig 来测试不同的召回配置
     *
     * @param id 知识库ID
     * @param dto 召回测试参数
     * @param user 当前用户信息
     * @returns 召回测试结果
     */
    @Post(":id/retrieval-test")
    async retrievalTest(
        @Param("id") id: string,
        @Body() dto: RetrievalTestDto,
        @Playground() user: UserPlayground,
    ) {
        // 验证知识库权限
        await this.datasetsService.getDatasetById(id, user.id);

        // 执行召回测试
        return this.datasetsRetrievalService.queryDatasetWithConfig(
            id,
            dto.query,
            dto.retrievalConfig,
        );
    }

    /**
     * 重试知识库下所有失败文档的向量化
     */
    @Post(":id/retry")
    async retryDataset(@Param("id") id: string, @Playground() user: UserPlayground) {
        return this.datasetsService.retryDataset(id);
    }
}
