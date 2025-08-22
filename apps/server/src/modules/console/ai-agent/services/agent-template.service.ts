import { Injectable, Logger } from "@nestjs/common";
import { readFileSync } from "fs";
import { join } from "path";

import {
    AgentTemplateDto,
    CreateAgentFromTemplateDto,
    QueryTemplateDto,
} from "../dto/agent-template.dto";

/**
 * 智能体模板服务
 * 提供模板列表查询和从模板创建智能体功能
 */
@Injectable()
export class AgentTemplateService {
    private readonly logger = new Logger(AgentTemplateService.name);
    private readonly templates: AgentTemplateDto[] = [];

    constructor() {
        this.loadTemplates();
    }

    /**
     * 从 JSON 文件加载模板数据
     */
    private loadTemplates(): void {
        try {
            // 尝试多个可能的路径
            const possiblePaths = [
                join(process.cwd(), "src/core/database/install/agent-templates.json"),
            ];

            let templateData: string | null = null;
            let usedPath: string | null = null;

            for (const path of possiblePaths) {
                templateData = readFileSync(path, "utf-8");
                usedPath = path;
            }

            if (templateData) {
                const parsedData = JSON.parse(templateData);
                this.templates.push(...parsedData.templates);
            } else {
                throw new Error("无法找到模板文件");
            }
        } catch (error) {
            this.logger.error(`[!] 加载模板数据失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 获取模板列表
     */
    async getTemplateList(query: QueryTemplateDto): Promise<AgentTemplateDto[]> {
        let filteredTemplates = [...this.templates];

        // 关键词搜索
        if (query.keyword) {
            const keyword = query.keyword.toLowerCase();
            filteredTemplates = filteredTemplates.filter(
                (template) =>
                    template.name.toLowerCase().includes(keyword) ||
                    template.description?.toLowerCase().includes(keyword) ||
                    template.tags?.some((tag) => tag.toLowerCase().includes(keyword)),
            );
        }

        // 分类筛选
        if (query.categories) {
            filteredTemplates = filteredTemplates.filter(
                (template) => template.categories === query.categories,
            );
        }

        // 标签筛选
        if (query.tags && query.tags.length > 0) {
            filteredTemplates = filteredTemplates.filter((template) =>
                template.tags?.some((tag) => query.tags!.includes(tag)),
            );
        }

        // 推荐筛选
        if (query.recommended) {
            filteredTemplates = filteredTemplates.filter((template) => template.isRecommended);
        }

        // 排序
        if (query.sortBy) {
            filteredTemplates.sort((a, b) => {
                let aValue: any = a[query.sortBy!];
                let bValue: any = b[query.sortBy!];

                if (typeof aValue === "string") {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

                if (query.sortOrder === "desc") {
                    return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
                } else {
                    return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
                }
            });
        }

        return filteredTemplates;
    }

    /**
     * 根据ID获取模板详情
     */
    async getTemplateById(templateId: string): Promise<AgentTemplateDto | null> {
        return this.templates.find((t) => t.id === templateId) || null;
    }

    /**
     * 从模板创建智能体
     * @param dto 创建参数，包含模板ID及可覆盖的字段
     * @returns 新的智能体配置对象（不会修改原始模板）
     */
    async createAgentFromTemplate(dto: CreateAgentFromTemplateDto) {
        const template = await this.getTemplateById(dto.templateId);
        if (!template) {
            throw new Error(`模板不存在: ${dto.templateId}`);
        }

        // 使用解构排除不需要从模板继承的字段，避免修改原始模板对象
        const { id: _omitId, datasetIds: _omitDatasetIds, ...templateForCreate } = template;

        return {
            ...templateForCreate,
            ...dto,
        };
    }

    /**
     * 获取模板分类列表
     */
    async getTemplateCategories(): Promise<string[]> {
        const categories = [...new Set(this.templates.map((t) => t.categories).filter(Boolean))];
        return categories.sort();
    }

    /**
     * 获取推荐模板
     */
    async getRecommendedTemplates(): Promise<AgentTemplateDto[]> {
        return this.templates.filter((template) => template.isRecommended);
    }
}
