import { BaseController } from "@common/base/controllers/base.controller";
import { PluginPermissions } from "@common/decorators/permissions.decorator";
import { PluginConsoleController } from "@common/decorators/plugin-controller.decorator";
import { UUIDValidationPipe } from "@common/pipe/param-validate.pipe";
import { Body, Delete, Get, Param, Patch, Post, Put, Query } from "@nestjs/common";

import { ColumnService } from "./column.service";
import { CreateColumnDto } from "./dto/create-column.dto";
import { QueryColumnDto } from "./dto/query-column.dto";
import { UpdateColumnDto } from "./dto/update-column.dto";

/**
 * 栏目控制器
 */
@PluginConsoleController("column", "栏目管理")
export class ColumnController extends BaseController {
    constructor(private readonly columnService: ColumnService) {
        super();
    }

    /**
     * 创建栏目
     */
    @Post()
    @PluginPermissions({
        code: "create",
        name: "创建栏目",
        description: "栏目插件创建接口",
    })
    async create(@Body() createColumnDto: CreateColumnDto) {
        return this.columnService.createColumn(createColumnDto);
    }

    /**
     * 获取栏目列表
     */
    @Get()
    @PluginPermissions({
        code: "list",
        name: "查询栏目列表",
        description: "栏目插件列表查询接口",
    })
    async list(@Query() queryDto: QueryColumnDto) {
        return this.columnService.list(queryDto);
    }

    /**
     * 获取栏目统计
     */
    @Get("stats")
    @PluginPermissions({
        code: "list",
        name: "获取栏目统计信息",
        description: "栏目插件统计信息查询接口",
    })
    async getStats() {
        return this.columnService.getStats();
    }

    /**
     * 批量删除栏目
     */
    @Post("batch-delete")
    @PluginPermissions({
        code: "delete",
        name: "批量删除栏目",
        description: "栏目插件批量删除接口",
    })
    async batchDelete(@Body() body: { ids: string[] }) {
        await this.columnService.batchDelete(body.ids);
        return { success: true };
    }

    /**
     * 获取栏目详情
     */
    @Get(":id")
    @PluginPermissions({
        code: "detail",
        name: "查询栏目详情",
        description: "栏目插件详情查询接口",
    })
    async findOne(@Param("id", UUIDValidationPipe) id: string) {
        return this.columnService.findOneById(id);
    }

    /**
     * 更新栏目
     */
    @Patch(":id")
    @PluginPermissions({
        code: "update",
        name: "更新栏目",
        description: "栏目插件更新接口",
    })
    async update(
        @Param("id", UUIDValidationPipe) id: string,
        @Body() updateColumnDto: UpdateColumnDto,
    ) {
        return this.columnService.updateById(id, updateColumnDto);
    }

    /**
     * 删除栏目
     */
    @Delete(":id")
    @PluginPermissions({
        code: "delete",
        name: "删除栏目",
        description: "栏目插件删除接口",
    })
    async remove(@Param("id", UUIDValidationPipe) id: string) {
        await this.columnService.delete(id);
        return { success: true };
    }

    /**
     * 更新栏目状态
     */
    @Patch(":id/status/:status")
    @PluginPermissions({
        code: "update",
        name: "更新栏目状态",
        description: "栏目插件状态更新接口",
    })
    async updateStatus(
        @Param("id", UUIDValidationPipe) id: string,
        @Param("status") status: string,
    ) {
        return this.columnService.updateStatus(id, parseInt(status, 10));
    }
}
