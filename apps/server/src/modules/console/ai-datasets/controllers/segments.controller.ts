import { Playground } from "@common/decorators";
import { ConsoleController } from "@common/decorators/controller.decorator";
import { Permissions } from "@common/decorators/permissions.decorator";
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
@ConsoleController("ai-datasets-segments", "数据集分段")
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
    @Permissions({
        code: "create",
        name: "创建分段",
    })
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
    @Permissions({
        code: "list",
        name: "查询分段列表",
    })
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
    @Permissions({
        code: "detail",
        name: "查看分段详情",
    })
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
    @Permissions({
        code: "update",
        name: "更新分段",
    })
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
    @Permissions({
        code: "delete",
        name: "删除分段",
    })
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
    @Permissions({
        code: "batch-delete",
        name: "批量删除分段",
    })
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
    @Permissions({
        code: "set-enabled",
        name: "设置分段状态",
    })
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
    @Permissions({
        code: "batch-set-enabled",
        name: "批量设置分段状态",
    })
    async batchSetEnabled(@Body() body: { ids: string[]; enabled: number }) {
        await this.segmentsService.batchSetSegmentEnabled(body.ids, body.enabled);
        return { success: true };
    }
}
