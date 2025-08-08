import { BaseController } from "@common/base/controllers/base.controller";
import { PluginWebController } from "@common/decorators/plugin-controller.decorator";
import { Public } from "@common/decorators/public.decorator";
import { UUIDValidationPipe } from "@common/pipe/param-validate.pipe";
import { Get, Param, Query } from "@nestjs/common";

import { ColumnService } from "./column.service";
import { QueryColumnDto } from "./dto/query-column.dto";

/**
 * 前台栏目控制器
 */
@PluginWebController("column")
@Public()
export class ColumnController extends BaseController {
    /**
     * 构造函数
     * @param columnService 栏目服务
     */
    constructor(private readonly columnService: ColumnService) {
        super();
    }

    /**
     * 获取启用的栏目列表
     * @param queryColumnDto 查询参数
     * @returns 栏目列表
     */
    @Get()
    async findAll(@Query() queryColumnDto: QueryColumnDto) {
        return this.columnService.findEnabledColumns(queryColumnDto);
    }

    /**
     * 获取导航栏目
     * @returns 导航栏目列表
     */
    @Get("nav")
    async findNavColumns() {
        return this.columnService.findNavColumns();
    }

    /**
     * 根据slug查询栏目详情
     * @param slug 栏目slug
     * @returns 栏目详情
     */
    @Get("slug/:slug")
    async findBySlug(@Param("slug") slug: string) {
        return this.columnService.findColumnBySlug(slug);
    }

    /**
     * 根据ID查询栏目详情
     * @param id 栏目ID
     * @returns 栏目详情
     */
    @Get(":id")
    async findOne(@Param("id", UUIDValidationPipe) id: string) {
        return this.columnService.findColumnById(id);
    }

    /**
     * 获取栏目的文章列表
     * @param columnId 栏目ID
     * @param page 页码
     * @param pageSize 每页数量
     * @param keyword 关键词
     * @returns 文章列表
     */
    @Get(":columnId/articles")
    async findColumnArticles(
        @Param("columnId") columnId: string,
        @Query("page") page?: string,
        @Query("pageSize") pageSize?: string,
        @Query("keyword") keyword?: string,
    ) {
        return this.columnService.findColumnArticles(columnId, {
            page: parseInt(page || "1", 10),
            pageSize: parseInt(pageSize || "10", 10),
            keyword,
        });
    }
}
