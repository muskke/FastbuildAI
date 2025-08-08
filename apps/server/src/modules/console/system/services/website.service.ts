import { BaseService } from "@common/base/services/base.service";
import { Dict } from "@common/modules/dict/entities/dict.entity";
import { DictService } from "@common/modules/dict/services/dict.service";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { UpdateWebsiteDto } from "../dto/update-website.dto";

@Injectable()
export class WebsiteService extends BaseService<Dict> {
    constructor(
        private readonly dictService: DictService,
        @InjectRepository(Dict) repository: Repository<Dict>,
    ) {
        super(repository);
    }

    /**
     * 获取网站配置
     * @returns 网站配置信息
     */
    async getConfig() {
        // 获取各组配置
        const webinfo = await this.getGroupConfig("webinfo", {
            name: "FastbuildAI",
            description: "FastbuildAI",
            icon: "",
            logo: "",
        });
        const agreement = await this.getGroupConfig("agreement", {
            serviceTitle: "",
            serviceContent: "",
            privacyTitle: "",
            privacyContent: "",
            paymentTitle: "",
            paymentContent: "",
            updateAt: "",
        });
        const copyright = await this.getGroupConfig("copyright", [
            {
                displayName: "",
                iconUrl: "",
                url: "",
            },
        ]);
        const statistics = await this.getGroupConfig("statistics", {
            appid: "",
        });
        return {
            webinfo,
            agreement,
            copyright,
            statistics,
        };
    }

    /**
     * 获取指定分组的配置
     * @param group 配置分组
     * @param defaultConfig 默认配置对象
     * @returns 配置对象
     */
    private async getGroupConfig<T = any>(group: string, defaultConfig: T): Promise<T> {
        try {
            const configs = await this.dictService.findAll({
                where: { group },
                order: { sort: "ASC" },
            });

            if (configs.length === 0) {
                return defaultConfig;
            }

            // 将配置转换为对象格式
            const result = {};
            for (const config of configs) {
                result[config.key] = this.parseValue(config.value);
            }

            // 合并默认配置和实际配置，确保返回完整的配置对象
            return { ...defaultConfig, ...result } as T;
        } catch (error) {
            this.logger.error(`获取分组 ${group} 的配置失败: ${error.message}`);
            return defaultConfig;
        }
    }

    /**
     * 将存储的字符串解析为适当的类型
     * @param value 存储的字符串值
     * @returns 解析后的值
     */
    private parseValue<T = any>(value: string): T {
        if (!value) {
            return null as unknown as T;
        }

        // 尝试解析为JSON
        try {
            // 判断是否可能是JSON
            if (
                (value.startsWith("{") && value.endsWith("}")) ||
                (value.startsWith("[") && value.endsWith("]")) ||
                value === "true" ||
                value === "false" ||
                value === "null" ||
                !isNaN(Number(value))
            ) {
                return JSON.parse(value) as T;
            }
        } catch (e) {
            // 解析失败，忽略错误
        }

        // 如果不是JSON，返回原始字符串
        return value as unknown as T;
    }

    /**
     * 设置网站配置
     * @param updateWebsiteDto 更新网站配置DTO
     * @returns 更新结果
     */
    async setConfig(updateWebsiteDto: UpdateWebsiteDto) {
        const { webinfo, agreement, copyright, statistics } = updateWebsiteDto;

        // 只更新传递的配置组
        if (webinfo) {
            await this.updateGroupConfig("webinfo", webinfo);
        }
        if (agreement) {
            await this.updateGroupConfig("agreement", agreement);
        }
        if (copyright) {
            await this.updateGroupConfig("copyright", copyright);
        }
        if (statistics) {
            await this.updateGroupConfig("statistics", statistics);
        }

        return { success: true };
    }

    /**
     * 更新指定分组的配置
     * @param group 配置分组
     * @param data 配置数据对象
     */
    private async updateGroupConfig(group: string, data: Record<string, any>) {
        if (!data) return;

        try {
            // 如果是协议配置，添加更新时间
            if (group === "agreement") {
                data.updateAt = new Date().toISOString();
            }

            // 遍历对象的每个属性
            for (const [key, value] of Object.entries(data)) {
                // 使用 dictService 的 set 方法更新或创建配置
                await this.dictService.set(key, value, {
                    group,
                    description: `网站${group}配置 - ${key}`,
                    sort: 0,
                    isEnabled: true,
                });
            }
        } catch (error) {
            this.logger.error(`更新分组 ${group} 的配置失败: ${error.message}`);
            throw error; // 将错误向上抛出，便于控制器处理
        }
    }
}
