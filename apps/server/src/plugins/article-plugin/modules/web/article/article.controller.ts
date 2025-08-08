import { BaseController } from "@common/base/controllers/base.controller";
import { PluginWebController } from "@common/decorators/plugin-controller.decorator";
import { Public } from "@common/decorators/public.decorator";
import { UUIDValidationPipe } from "@common/pipe/param-validate.pipe";
import { Get, Param, Post, Query } from "@nestjs/common";

import { ArticleService } from "./article.service";
import { QueryArticleDto } from "./dto/query-article.dto";

/**
 * 前台文章控制器
 */
@PluginWebController("article")
@Public()
export class ArticleController extends BaseController {
    /**
     * 构造函数
     * @param articleService 文章服务
     */
    constructor(private readonly articleService: ArticleService) {
        super();
    }

    /**
     * 查询文章列表
     * @param queryArticleDto 查询参数
     * @returns 分页数据
     */
    @Get()
    async findAll(@Query() queryArticleDto: QueryArticleDto) {
        return this.articleService.findArticles(queryArticleDto);
    }

    /**
     * 获取热门文章列表
     * @param limit 限制数量
     * @returns 热门文章列表
     */
    @Get("hot")
    async findHotArticles(@Query("limit") limit?: string) {
        return this.articleService.findHotArticles(parseInt(limit || "5", 10));
    }

    /**
     * 获取最新文章列表
     * @param limit 限制数量
     * @returns 最新文章列表
     */
    @Get("latest")
    async findLatestArticles(@Query("limit") limit?: string) {
        return this.articleService.findLatestArticles(parseInt(limit || "5", 10));
    }

    /**
     * 获取所有文章栏目
     * @returns 栏目列表
     */
    @Get("columns")
    async findAllColumns() {
        return this.articleService.findAllColumns();
    }

    /**
     * 获取所有文章标签
     * @returns 标签列表
     */
    @Get("tags")
    async findAllTags() {
        return this.articleService.findAllTags();
    }

    /**
     * 搜索文章
     * @param q 搜索关键词
     * @param page 页码
     * @param pageSize 每页数量
     * @returns 搜索结果
     */
    @Get("search")
    async searchArticles(
        @Query("q") q: string,
        @Query("page") page?: string,
        @Query("pageSize") pageSize?: string,
    ) {
        return this.articleService.searchArticles({
            q,
            page: parseInt(page || "1", 10),
            pageSize: parseInt(pageSize || "10", 10),
        });
    }

    /**
     * 获取文章归档
     * @returns 归档数据
     */
    @Get("archive")
    async getArchive() {
        return this.articleService.getArchive();
    }

    /**
     * 根据ID查询文章
     * @param id 文章ID
     * @returns 文章信息
     */
    @Get(":id")
    async findOne(@Param("id", UUIDValidationPipe) id: string) {
        return this.articleService.findArticleById(id);
    }

    /**
     * 获取相关文章列表
     * @param id 文章ID
     * @param limit 限制数量
     * @returns 相关文章列表
     */
    @Get(":id/related")
    async findRelatedArticles(
        @Param("id", UUIDValidationPipe) id: string,
        @Query("limit") limit?: string,
    ) {
        return this.articleService.findRelatedArticles(id, parseInt(limit || "5", 10));
    }

    /**
     * 增加文章阅读量
     * @param id 文章ID
     * @returns 更新后的文章
     */
    @Post(":id/view")
    async incrementViews(@Param("id", UUIDValidationPipe) id: string) {
        await this.articleService.incrementViews(id);
        return { success: true };
    }

    /**
     * 点赞文章
     * @param id 文章ID
     * @returns 更新后的点赞数
     */
    @Post(":id/like")
    async likeArticle(@Param("id", UUIDValidationPipe) id: string) {
        return this.articleService.likeArticle(id);
    }
}
