import { Playground } from "@common/decorators";
import { ConsoleController } from "@common/decorators/controller.decorator";
import { Permissions } from "@common/decorators/permissions.decorator";
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
@ConsoleController("ai-datasets", "数据集")
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
    @Permissions({
        code: "create",
        name: "创建数据集",
    })
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
    @Permissions({
        code: "create-empty",
        name: "创建空数据集",
    })
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
    @Permissions({
        code: "indexing-segments",
        name: "数据集分段处理",
    })
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
     * 超级管理员可以看到所有知识库，普通用户只能看到自己创建的和作为成员的知识库
     *
     * @param dto 查询参数
     * @param user 当前用户信息
     * @returns 知识库列表和分页信息
     */
    @Get()
    @Permissions({
        code: "list",
        name: "查询数据集列表",
    })
    async list(@Query() dto: QueryDatasetDto, @Playground() user: UserPlayground) {
        return this.datasetsService.list(dto, user);
    }

    /**
     * 获取知识库详情
     *
     * @param id 知识库ID
     * @param user 当前用户信息
     * @returns 知识库详情
     */
    @Get(":id")
    @Permissions({
        code: "detail",
        name: "查看数据集详情",
    })
    async getById(@Param("id") id: string, @Playground() user: UserPlayground): Promise<Datasets> {
        return this.datasetsService.getDatasetById(id, user.id, user);
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
    @Permissions({
        code: "update",
        name: "更新数据集",
    })
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
    @Permissions({
        code: "delete",
        name: "删除数据集",
    })
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
    @Permissions({
        code: "retrieval-test",
        name: "数据集召回测试",
    })
    async retrievalTest(
        @Param("id") id: string,
        @Body() dto: RetrievalTestDto,
        @Playground() user: UserPlayground,
    ) {
        // 验证知识库权限
        await this.datasetsService.getDatasetById(id, user.id, user);

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
    @Permissions({
        code: "retry",
        name: "重试数据集向量化",
    })
    async retryDataset(@Param("id") id: string, @Playground() user: UserPlayground) {
        return this.datasetsService.retryDataset(id);
    }
}
