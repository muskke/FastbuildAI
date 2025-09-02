import { BaseController } from "@common/base/controllers/base.controller";
import { BooleanNumberType } from "@common/constants";
import { ConsoleController } from "@common/decorators/controller.decorator";
import { BuildFileUrl } from "@common/decorators/file-url.decorator";
import { Permissions } from "@common/decorators/permissions.decorator";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { Body, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";

import {
    CreateKeyTemplateDto,
    ImportKeyTemplateJsonDto,
    QueryKeyTemplateDto,
    UpdateKeyTemplateDto,
} from "../dto/key-template.dto";
import { KeyTemplateService } from "../services/key-template.service";

/**
 * 密钥模板管理控制器（后台）
 */
@ConsoleController("key-templates", "密钥模板管理")
export class KeyTemplateController extends BaseController {
    constructor(private readonly keyTemplateService: KeyTemplateService) {
        super();
    }

    /**
     * 创建密钥模板
     */
    @Post()
    @BuildFileUrl(["**.icon"])
    @Permissions({
        code: "create",
        name: "创建密钥模板",
    })
    async create(@Body() dto: CreateKeyTemplateDto) {
        return await this.keyTemplateService.create(dto);
    }

    /**
     * 通过导入JSON创建密钥模板
     */
    @Post("import/json")
    @BuildFileUrl(["**.icon"])
    @Permissions({
        code: "import-json",
        name: "导入密钥模板",
    })
    async importFromJson(@Body() dto: ImportKeyTemplateJsonDto) {
        return await this.keyTemplateService.importFromJson(dto);
    }

    /**
     * 获取密钥模板列表（分页）
     */
    @Get()
    @BuildFileUrl(["**.icon"])
    @Permissions({
        code: "list",
        name: "查看密钥模板",
    })
    async list(@Query() query: QueryKeyTemplateDto) {
        return await this.keyTemplateService.paginate(query);
    }

    /**
     * 获取所有启用的模板（不分页）
     */
    @Get("enabled/all")
    @BuildFileUrl(["**.icon"])
    @Permissions({
        code: "enabled-all",
        name: "查看密钥模板",
    })
    async getEnabledTemplates() {
        return await this.keyTemplateService.getEnabledTemplates();
    }

    /**
     * 获取单个密钥模板详情
     */
    @Get(":id")
    @BuildFileUrl(["**.icon"])
    @Permissions({
        code: "detail",
        name: "查看密钥模板",
    })
    async findOne(@Param("id") id: string) {
        return await this.keyTemplateService.findOneById(id);
    }

    /**
     * 更新密钥模板
     */
    @Patch(":id")
    @BuildFileUrl(["**.icon"])
    @Permissions({
        code: "update",
        name: "更新密钥模板",
    })
    async update(@Param("id") id: string, @Body() dto: UpdateKeyTemplateDto) {
        return await this.keyTemplateService.updateById(id, dto);
    }

    /**
     * 设置模板启用状态
     */
    @Patch(":id/enabled")
    @Permissions({
        code: "toggle-enabled",
        name: "启用/禁用密钥模板",
    })
    async setEnabled(@Param("id") id: string, @Body("isEnabled") isEnabled: BooleanNumberType) {
        return await this.keyTemplateService.setEnabled(id, isEnabled);
    }

    /**
     * 删除密钥模板
     */
    @Delete(":id")
    @Permissions({
        code: "delete",
        name: "删除密钥模板",
    })
    async remove(@Param("id") id: string) {
        await this.keyTemplateService.delete(id);
        return { message: "密钥模板删除成功" };
    }

    /**
     * 批量删除密钥模板
     */
    @Delete()
    @Permissions({
        code: "batch-delete",
        name: "批量删除密钥模板",
    })
    async removeMany(@Body("ids") ids: string[]) {
        if (!Array.isArray(ids) || ids.length === 0) {
            throw HttpExceptionFactory.paramError("参数 ids 必须是非空数组");
        }

        const deleted = await this.keyTemplateService.batchDelete(ids);
        return {
            message: `成功删除 ${deleted} 个密钥模板`,
            deleted,
        };
    }
}
