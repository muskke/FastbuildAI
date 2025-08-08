import { BaseService } from "@common/base/services/base.service";
import { Dict } from "@common/modules/dict/entities/dict.entity";
import { DictService } from "@common/modules/dict/services/dict.service";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { UpdateChatConfigDto } from "../dto/ai-chat-config.dto";

/**
 * 对话配置服务
 * 管理聊天页面的建议选项、欢迎信息等配置
 */
@Injectable()
export class ChatConfigService extends BaseService<Dict> {
    constructor(
        private readonly dictService: DictService,
        @InjectRepository(Dict) repository: Repository<Dict>,
    ) {
        super(repository);
    }

    /**
     * 获取对话配置
     * @returns 对话配置信息
     */
    async getChatConfig() {
        // 获取建议选项配置
        const suggestions = await this.dictService.get(
            "chat_suggestions",
            [
                { icon: "🎮", text: "写一个像宝可梦方式的小游戏" },
                { icon: "📅", text: "2025年节日安排出来了吗?" },
                { icon: "😊", text: "AI时代，什么能力不可被替代?" },
                { icon: "📝", text: "一篇生成爆款小红书笔记" },
                { icon: "🔍", text: "AI能成为全球人类产生威胁吗?" },
            ],
            "chat_config",
        );

        // 获取建议选项启用状态
        const suggestionsEnabled = await this.dictService.get(
            "chat_suggestions_enabled",
            true,
            "chat_config",
        );

        // 获取欢迎信息配置
        const welcomeInfo = await this.dictService.get(
            "chat_welcome",
            {
                title: "👋 Hi，我是你的智能助手",
                description:
                    "作为你的智能伙伴，我能帮你写文案、思考问题、文档整理和删减、答疑解惑。",
                footer: "内容由AI生成，无法确保真实准确，仅供参考。",
            },
            "chat_config",
        );

        return {
            suggestions,
            suggestionsEnabled,
            welcomeInfo,
        };
    }

    /**
     * 设置对话配置
     * @param updateChatConfigDto 更新对话配置DTO
     * @returns 更新结果
     */
    async setChatConfig(updateChatConfigDto: UpdateChatConfigDto) {
        const { suggestions, suggestionsEnabled, welcomeInfo } = updateChatConfigDto;

        try {
            // 更新建议选项配置
            if (suggestions !== undefined) {
                await this.dictService.set("chat_suggestions", suggestions, {
                    group: "chat_config",
                    description: "聊天建议选项配置",
                });
            }

            // 更新建议选项启用状态
            if (suggestionsEnabled !== undefined) {
                await this.dictService.set("chat_suggestions_enabled", suggestionsEnabled, {
                    group: "chat_config",
                    description: "聊天建议选项启用状态",
                });
            }

            // 更新欢迎信息配置
            if (welcomeInfo !== undefined) {
                await this.dictService.set("chat_welcome", welcomeInfo, {
                    group: "chat_config",
                    description: "聊天欢迎信息配置",
                });
            }

            return { success: true, message: "对话配置更新成功" };
        } catch (error) {
            this.logger.error(`更新对话配置失败: ${error.message}`);
            throw error;
        }
    }
}
