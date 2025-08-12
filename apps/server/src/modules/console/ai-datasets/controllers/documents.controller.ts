import { Playground } from "@common/decorators";
import { ConsoleController } from "@common/decorators/controller.decorator";
import { Permissions } from "@common/decorators/permissions.decorator";
import { UserPlayground } from "@common/interfaces/context.interface";
import { Body, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";

import {
    CreateDocumentDto,
    CreateDocumentResponseDto,
    QueryDocumentDto,
    RenameDocumentDto,
} from "../dto/documents.dto";
import { DatasetPermission, ResourceType } from "../guards/datasets-permission.guard";
import { DocumentsService } from "../services/documents.service";

/**
 * 文档控制器
 * 提供文档管理功能
 */
@ConsoleController("ai-datasets-documents", "数据集文档")
export class DocumentsController {
    constructor(private readonly documentsService: DocumentsService) {}

    /**
     * 创建文档（支持多文件）
     *
     * 上传文档到指定知识库并进行分段处理
     *
     * @param dto 文档创建参数
     * @param user 当前用户信息
     * @returns 创建的文档信息
     */
    @Post("create")
    @Permissions({
        code: "create",
        name: "创建文档",
    })
    @DatasetPermission({ permission: "canManageDocuments", datasetIdParam: "datasetId" })
    async create(
        @Body() dto: CreateDocumentDto,
        @Playground() user: UserPlayground,
    ): Promise<CreateDocumentResponseDto> {
        return this.documentsService.createDocument(dto, user);
    }

    /**
     * 获取文档列表
     *
     * 支持关键词搜索、状态筛选、文件类型筛选、日期范围筛选等
     *
     * @param dto 查询参数
     * @param user 当前用户信息
     * @returns 文档列表和分页信息
     */
    @Get()
    @Permissions({
        code: "list",
        name: "查询文档列表",
    })
    async list(@Query() dto: QueryDocumentDto) {
        return this.documentsService.list(dto);
    }

    /**
     * 获取全部文档列表
     *
     * 返回用户的所有文档，不分页，支持按知识库筛选
     *
     * @param datasetId 知识库ID（可选）
     * @param user 当前用户信息
     * @returns 全部文档列表
     */
    @Get("all")
    @Permissions({
        code: "get-all",
        name: "获取全部文档",
    })
    async getAllDocuments(
        @Playground() user: UserPlayground,
        @Query("datasetsId") datasetsId?: string,
    ) {
        return this.documentsService.getAllDocuments(datasetsId);
    }

    /**
     * 获取文档详情
     *
     * @param id 文档ID
     * @param user 当前用户信息
     * @returns 文档详情
     */
    @Get(":id")
    @Permissions({
        code: "detail",
        name: "查看文档详情",
    })
    async getById(@Param("id") id: string): Promise<any> {
        // Assuming DatasetsDocument is replaced by 'any' or needs a type import
        return this.documentsService.getDocumentById(id);
    }

    /**
     * 重命名文档
     *
     * @param id 文档ID
     * @param dto 重命名参数
     * @param user 当前用户信息
     * @returns 更新后的文档
     */
    @Patch(":id/rename")
    @Permissions({
        code: "rename",
        name: "重命名文档",
    })
    @DatasetPermission({
        permission: "canManageDocuments",
        datasetIdParam: "datasetId",
        checkOwnership: true,
        resourceType: ResourceType.DOCUMENT,
    })
    async rename(@Param("id") id: string, @Body() dto: RenameDocumentDto): Promise<any> {
        return this.documentsService.renameDocument(id, dto);
    }

    /**
     * 删除文档
     *
     * 删除文档及其相关的分段数据
     *
     * @param dto 删除参数
     * @param user 当前用户信息
     * @returns 删除结果
     */
    @Delete(":id")
    @Permissions({
        code: "delete",
        name: "删除文档",
    })
    @DatasetPermission({
        permission: "canManageDocuments",
        datasetIdParam: "datasetId",
        checkOwnership: true,
        resourceType: ResourceType.DOCUMENT,
    })
    async remove(@Param() dto: { id: string }) {
        const success = await this.documentsService.deleteDocument(dto.id);
        return { success };
    }

    /**
     * 重试文档下所有失败分段的向量化
     */
    @Post(":id/retry")
    @Permissions({
        code: "retry",
        name: "重试文档向量化",
    })
    async retryDocument(@Param("id") id: string) {
        return this.documentsService.retryDocument(id);
    }

    /**
     * 设置文档启用/禁用状态
     */
    @Patch(":id/enabled")
    @Permissions({
        code: "set-enabled",
        name: "设置文档状态",
    })
    @DatasetPermission({
        permission: "canManageDocuments",
        datasetIdParam: "datasetId",
        checkOwnership: true,
        resourceType: ResourceType.DOCUMENT,
    })
    async setEnabled(@Param("id") id: string, @Body() body: { enabled: boolean }) {
        return this.documentsService.setDocumentEnabled(id, body.enabled);
    }
}
