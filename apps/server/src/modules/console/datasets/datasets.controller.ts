import { ConsoleController } from "@common/decorators/controller.decorator";
import { Permissions } from "@common/decorators/permissions.decorator";
import { QueryDocumentDto } from "@modules/web/datasets/dto/documents.dto";
import { BatchDeleteSegmentDto, QuerySegmentDto } from "@modules/web/datasets/dto/segments.dto";
import { TransferOwnershipDto } from "@modules/web/datasets/dto/team-members.dto";
import { Body, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";

import { QueryDatasetDto } from "../../web/datasets/dto/datasets.dto";
import { DatasetsService } from "../../web/datasets/services/datasets.service";
import { DocumentsService } from "../../web/datasets/services/documents.service";
import { SegmentsService } from "../../web/datasets/services/segments.service";

/**
 * 后台知识库管理控制器
 */
@ConsoleController("datasets", "知识库管理")
export class DatasetsController {
    constructor(
        private readonly datasetsService: DatasetsService,
        private readonly documentsService: DocumentsService,
        private readonly segmentsService: SegmentsService,
    ) {}

    /**
     * 获取知识库列表
     *
     * @param query 查询参数
     * @returns 分页的知识库列表
     */
    @Get()
    @Permissions({
        code: "list",
        name: "查看知识库列表",
        description: "分页查询知识库列表",
    })
    async getDatasetsList(@Query() query: QueryDatasetDto) {
        return this.datasetsService.list(query);
    }

    /**
     * 获取知识库详情
     *
     * @param id 知识库ID
     * @returns 知识库详细信息
     */
    @Get(":id")
    @Permissions({
        code: "detail",
        name: "查看知识库详情",
        description: "根据ID查询知识库详情",
    })
    async getDatasetDetail(@Param("id") id: string) {
        return this.datasetsService.findOneById(id);
    }

    /**
     * 转移知识库所有权
     *
     * @param dto 转移所有权数据
     * @returns 操作结果
     */
    @Patch("transfer-ownership")
    @Permissions({
        code: "transfer",
        name: "转移知识库所有权",
        description: "转移知识库所有权给其他用户",
    })
    async transferOwnership(@Body() dto: TransferOwnershipDto) {
        return this.datasetsService.updateById(dto.datasetId, {
            createdBy: dto.newOwnerId,
        });
    }

    /**
     * 删除知识库
     *
     * @param id 知识库ID
     * @returns 删除结果
     */
    @Delete(":id")
    @Permissions({
        code: "delete",
        name: "删除知识库",
        description: "删除指定的知识库及其所有数据",
    })
    async deleteDataset(@Param("id") id: string) {
        return this.datasetsService.deleteDataset(id);
    }

    /**
     * 获取知识库文档列表
     *
     * @param datasetId 知识库ID
     * @param query 查询参数
     * @returns 分页的文档列表
     */
    @Get(":datasetId/documents")
    @Permissions({
        code: "documents",
        name: "查看知识库文档",
        description: "查看指定知识库的文档列表",
    })
    async getDocumentsList(
        @Param("datasetId") datasetId: string,
        @Query() query: QueryDocumentDto,
    ) {
        query.datasetId = datasetId;
        return this.documentsService.list(query);
    }

    /**
     * 删除知识库文档
     *
     * @param documentId 文档ID
     * @returns 删除结果
     */
    @Delete("documents/:documentId")
    @Permissions({
        code: "document-delete",
        name: "删除知识库文档",
        description: "删除指定的知识库文档",
    })
    async deleteDocument(@Param("documentId") documentId: string) {
        return this.documentsService.deleteDocument(documentId);
    }

    /**
     * 获取文档分段列表
     *
     * @param documentId 文档ID
     * @param query 查询参数
     * @returns 分页的分段列表
     */
    @Get("documents/:documentId/segments")
    @Permissions({
        code: "segments",
        name: "查看文档分段",
        description: "查看指定文档的分段列表",
    })
    async getDocumentSegments(
        @Param("documentId") documentId: string,
        @Query() query: QuerySegmentDto,
    ) {
        query.documentId = documentId;
        return this.segmentsService.list(query);
    }

    /**
     * 获取分段详情
     *
     * @param segmentId 分段ID
     * @returns 分段详细信息
     */
    @Get("documents/segments/:segmentId")
    @Permissions({
        code: "segment-detail",
        name: "查看分段详情",
        description: "根据ID查询分段详情",
    })
    async getSegmentDetail(@Param("segmentId") segmentId: string) {
        return this.segmentsService.findOneById(segmentId);
    }

    /**
     * 批量删除分段
     *
     * @param segmentIds 分段ID列表
     * @returns 删除结果
     */
    @Delete("documents/segments")
    @Permissions({
        code: "segments-delete",
        name: "批量删除分段",
        description: "批量删除指定的分段",
    })
    async batchDeleteSegments(@Body() dto: BatchDeleteSegmentDto) {
        return this.segmentsService.batchDeleteSegments(dto.ids);
    }

    /**
     * 删除知识库分段
     *
     * @param segmentId 分段ID
     * @returns 删除结果
     */
    @Delete("documents/segments/:segmentId")
    @Permissions({
        code: "segment-delete",
        name: "删除知识库分段",
        description: "删除指定的知识库分段",
    })
    async deleteSegment(@Param("segmentId") segmentId: string) {
        return this.segmentsService.deleteSegment(segmentId);
    }

    /**
     * 获取全部数据记录列表
     *
     * @param query 查询参数
     * @returns 分页的数据记录列表
     */
    @Get("data-records/all")
    @Permissions({
        code: "all-data",
        name: "查看全部数据记录",
        description: "查看系统中所有知识库的数据记录",
    })
    async getAllDataRecords(@Query() query: QuerySegmentDto) {
        return this.segmentsService.list(query);
    }

    /**
     * 设置单个分段的启用/禁用状态
     * @param segmentId 分段ID
     * @param body { enabled: 1/0 }
     * @returns 操作结果
     */
    @Patch("documents/segments/:segmentId/enabled")
    @Permissions({
        code: "segment-enabled",
        name: "设置分段启用/禁用状态",
        description: "设置单个分段的启用/禁用状态",
    })
    async setSegmentEnabled(
        @Param("segmentId") segmentId: string,
        @Body() body: { enabled: number },
    ) {
        await this.segmentsService.setSegmentEnabled(segmentId, body.enabled);
        return { success: true };
    }

    /**
     * 批量设置分段的启用/禁用状态
     * @param body { ids: string[], enabled: 1/0 }
     * @returns 操作结果
     */
    @Post("documents/segments/batch-enabled")
    @Permissions({
        code: "segmengt-batch-enabled",
        name: "批量设置分段启用/禁用状态",
        description: "批量设置分段的启用/禁用状态",
    })
    async batchSetSegmentEnabled(@Body() body: { ids: string[]; enabled: number }) {
        await this.segmentsService.batchSetSegmentEnabled(body.ids, body.enabled);
        return { success: true };
    }
}
