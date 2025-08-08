import { BaseController } from "@common/base/controllers/base.controller";
import { PluginPermissions } from "@common/decorators/permissions.decorator";
import { PluginConsoleController } from "@common/decorators/plugin-controller.decorator";
import { UUIDValidationPipe } from "@common/pipe/param-validate.pipe";
import { Body, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";

import { ArticleService } from "./article.service";
import { CreateArticleDto } from "./dto/create-article.dto";
import { QueryArticleDto } from "./dto/query-article.dto";
import { UpdateArticleDto } from "./dto/update-article.dto";

/**
 * 文章控制器
 */
@PluginConsoleController("article", "文章管理")
export class ArticleController extends BaseController {
    /**
     * 构造函数
     * @param articleService 文章服务
     */
    constructor(private readonly articleService: ArticleService) {
        super();
    }

    /**
     * 创建文章
     * @param createArticleDto 创建文章DTO
     * @returns 创建的文章
     */
    @Post()
    @PluginPermissions({
        code: "create",
        name: "创建文章",
        description: "文章插件创建接口",
    })
    async create(@Body() createArticleDto: CreateArticleDto) {
        return this.articleService.createArticle(createArticleDto);
    }

    /**
     * 查询文章列表
     * @param queryArticleDto 查询参数
     * @returns 分页数据
     */
    @Get()
    @PluginPermissions({
        code: "list",
        name: "查询文章列表",
        description: "文章插件列表查询接口",
    })
    async list(@Query() queryArticleDto: QueryArticleDto) {
        return this.articleService.findArticles(queryArticleDto);
    }

    /**
     * 获取文章统计信息
     * @returns 统计信息
     */
    @Get("stats")
    @PluginPermissions({
        code: "list",
        name: "获取文章统计信息",
        description: "文章插件统计信息查询接口",
    })
    async getStats() {
        return this.articleService.getStats();
    }

    /**
     * 批量删除文章
     * @param body 批量删除参数
     * @returns 删除结果
     */
    @Post("batch-delete")
    @PluginPermissions({
        code: "delete",
        name: "批量删除文章",
        description: "文章插件批量删除接口",
    })
    async batchDelete(@Body() body: { ids: string[] }) {
        await this.articleService.batchDelete(body.ids);
        return { success: true };
    }

    /**
     * 根据ID查询文章
     * @param id 文章ID
     * @returns 文章信息
     */
    @Get(":id")
    @PluginPermissions({
        code: "detail",
        name: "查询文章详情",
        description: "文章插件详情查询接口",
    })
    async findOne(@Param("id", UUIDValidationPipe) id: string) {
        return this.articleService.findArticleById(id);
    }

    /**
     * 复制文章
     * @param id 文章ID
     * @returns 复制后的文章
     */
    @Post(":id/copy")
    @PluginPermissions({
        code: "create",
        name: "复制文章",
        description: "文章插件复制接口",
    })
    async copy(@Param("id", UUIDValidationPipe) id: string) {
        return this.articleService.copyArticle(id);
    }

    /**
     * 更新文章
     * @param id 文章ID
     * @param updateArticleDto 更新文章DTO
     * @returns 更新后的文章
     */
    @Patch(":id")
    @PluginPermissions({
        code: "update",
        name: "更新文章",
        description: "文章插件更新接口",
    })
    async update(
        @Param("id", UUIDValidationPipe) id: string,
        @Body() updateArticleDto: UpdateArticleDto,
    ) {
        return this.articleService.updateArticle(id, updateArticleDto);
    }

    /**
     * 删除文章
     * @param id 文章ID
     */
    @Delete(":id")
    @PluginPermissions({
        code: "delete",
        name: "删除文章",
        description: "文章插件删除接口",
    })
    async remove(@Param("id", UUIDValidationPipe) id: string) {
        await this.articleService.removeArticle(id);
        return { success: true };
    }

    /**
     * 设置文章置顶状态
     * @param id 文章ID
     * @param isTop 是否置顶：0-否，1-是
     * @returns 更新后的文章
     */
    @Patch(":id/top/:isTop")
    @PluginPermissions({
        code: "update",
        name: "更新文章置顶状态",
        description: "文章插件置顶状态更新接口",
    })
    async setTopStatus(@Param("id", UUIDValidationPipe) id: string, @Param("isTop") isTop: string) {
        return this.articleService.setTopStatus(id, parseInt(isTop, 10));
    }

    /**
     * 更新文章状态
     * @param id 文章ID
     * @param status 文章状态：0-草稿，1-已发布
     * @returns 更新后的文章
     */
    @Patch(":id/status/:status")
    @PluginPermissions({
        code: "update",
        name: "更新文章状态",
        description: "文章插件状态更新接口",
    })
    async updateStatus(
        @Param("id", UUIDValidationPipe) id: string,
        @Param("status") status: string,
    ) {
        return this.articleService.updateStatus(id, parseInt(status, 10));
    }
}
