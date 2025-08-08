import { Playground } from "@common/decorators";
import { WebController } from "@common/decorators/controller.decorator";
import { UserPlayground } from "@common/interfaces/context.interface";
import { UUIDValidationPipe } from "@common/pipe/param-validate.pipe";
import { Body, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";

import {
    BatchDeleteSegmentDto,
    CreateSegmentDto,
    DeleteSegmentDto,
    QuerySegmentDto,
    UpdateSegmentDto,
} from "../dto/segments.dto";
import { DatasetsSegments } from "../entities/datasets-segments.entity";
import { DatasetPermission, ResourceType } from "../guards/datasets-permission.guard";
import { SegmentsService } from "../services/segments.service";

/**
 * 分段控制器
 * 提供分段管理功能
 */
@WebController("datasets-segments")
export class SegmentsController {
    constructor(private readonly segmentsService: SegmentsService) {}

    /**
     * 创建分段
     *
     * @param dto 创建分段参数
     * @param user 当前用户信息
     * @returns 创建的分段
     */
    @Post("")
    @DatasetPermission({ permission: "canManageSegments", datasetIdParam: "datasetId" })
    async create(
        @Body() dto: CreateSegmentDto,
        @Playground() user: UserPlayground,
    ): Promise<DatasetsSegments> {
        return this.segmentsService.createSegment(dto, user.id);
    }

    /**
     * 获取分段列表
     *
     * 支持关键词搜索、状态筛选、内容长度筛选、日期范围筛选等
     *
     * @param dto 查询参数
     * @param user 当前用户信息
     * @returns 分段列表和分页信息
     */
    @Get()
    async list(@Query() dto: QuerySegmentDto) {
        return this.segmentsService.list(dto);
    }

    /**
     * 获取分段详情
     *
     * @param id 分段ID
     * @param user 当前用户信息
     * @returns 分段详情
     */
    @Get(":id")
    async getById(@Param("id", UUIDValidationPipe) id: string): Promise<DatasetsSegments> {
        return this.segmentsService.getSegmentById(id);
    }

    /**
     * 编辑分段
     *
     * @param id 分段ID
     * @param dto 编辑参数
     * @param user 当前用户信息
     * @returns 更新后的分段
     */
    @Patch(":id")
    @DatasetPermission({
        permission: "canManageSegments",
        datasetIdParam: "datasetId",
        checkOwnership: true,
        resourceType: ResourceType.SEGMENT,
    })
    async update(@Param("id", UUIDValidationPipe) id: string, @Body() dto: UpdateSegmentDto) {
        return this.segmentsService.updateSegment(id, dto);
    }

    /**
     * 删除分段
     *
     * @param dto 删除参数
     * @param user 当前用户信息
     * @returns 删除结果
     */
    @Delete(":id")
    @DatasetPermission({
        permission: "canManageSegments",
        datasetIdParam: "datasetId",
        checkOwnership: true,
        resourceType: ResourceType.SEGMENT,
    })
    async remove(@Param() dto: DeleteSegmentDto, @Playground() user: UserPlayground) {
        const success = await this.segmentsService.deleteSegment(dto.id);
        return { success };
    }

    /**
     * 批量删除分段
     *
     * 批量删除多个分段
     *
     * @param dto 批量删除参数
     * @param user 当前用户信息
     * @returns 删除结果
     */
    @Post("batch-delete")
    @DatasetPermission({ permission: "canManageSegments", datasetIdParam: "datasetId" })
    async batchRemove(@Body() dto: BatchDeleteSegmentDto) {
        const success = await this.segmentsService.batchDeleteSegments(dto.ids);
        return { success };
    }

    /**
     * 设置单个分段的启用/禁用状态
     * @param id 分段ID
     * @param body { enabled: 1/0 }
     * @returns 操作结果
     */
    @Patch(":id/enabled")
    async setEnabled(@Param("id") id: string, @Body() body: { enabled: number }) {
        await this.segmentsService.setSegmentEnabled(id, body.enabled);
        return { success: true };
    }

    /**
     * 批量设置分段的启用/禁用状态
     * @param body { ids: string[], enabled: 1/0 }
     * @returns 操作结果
     */
    @Post("batch-enabled")
    async batchSetEnabled(@Body() body: { ids: string[]; enabled: number }) {
        await this.segmentsService.batchSetSegmentEnabled(body.ids, body.enabled);
        return { success: true };
    }
}
