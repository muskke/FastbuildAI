import { UserPlayground } from "@common/interfaces/context.interface";
import {
    ACCOUNT_LOG_SOURCE,
    ACCOUNT_LOG_TYPE,
    ACTION,
} from "@common/modules/account/constants/account-log.constants";
import { AccountLogService } from "@common/modules/account/services/account-log.service";
import { User } from "@common/modules/auth/entities/user.entity";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Agent } from "../entities/agent.entity";
import { AgentChatRecord } from "../entities/agent-chat-record.entity";
import { IBillingHandler } from "../interfaces/chat-handlers.interface";
import { AgentChatRecordService } from "../services/agent-chat-record.service";

/**
 * 计费处理器
 * 负责处理智能体聊天的算力扣费逻辑
 */
@Injectable()
export class BillingHandler implements IBillingHandler {
    private readonly logger = new Logger(BillingHandler.name);

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly accountLogService: AccountLogService,
        private readonly agentChatRecordService: AgentChatRecordService,
    ) {}

    /**
     * 扣除智能体聊天算力
     */
    async deductAgentChatPower(
        agentInfo: Partial<Agent>,
        billToUser: User | null,
        user: UserPlayground,
        conversationRecord?: AgentChatRecord | null,
    ): Promise<void> {
        if (!billToUser || !agentInfo.billingConfig?.price) {
            return;
        }

        try {
            await this.userRepository.manager.transaction(async (entityManager) => {
                // 计算扣费金额
                const deductAmount = agentInfo.billingConfig.price;
                const newPower = Math.max(0, billToUser.power - deductAmount);
                const actualDeducted = billToUser.power - newPower;

                // 更新用户算力
                await entityManager.update(User, billToUser.id, { power: newPower });

                // 记录账户日志
                await this.accountLogService.recordWithTransaction(
                    entityManager,
                    billToUser.id,
                    this.isAnonymousUser(user)
                        ? ACCOUNT_LOG_TYPE.AGENT_GUEST_CHAT_DEC
                        : ACCOUNT_LOG_TYPE.AGENT_CHAT_DEC,
                    ACTION.DEC,
                    actualDeducted,
                    "",
                    null,
                    `${this.isAnonymousUser(user) ? "匿名用户" : "用户"}：${user.username} 调用${agentInfo.name}智能体对话`,
                    { type: ACCOUNT_LOG_SOURCE.AGENT_CHAT, source: agentInfo.id },
                );

                // 更新对话记录的消费算力
                if (conversationRecord && actualDeducted > 0) {
                    await this.agentChatRecordService.incrementConsumedPower(
                        conversationRecord.id,
                        actualDeducted,
                    );
                }
            });
        } catch (error) {
            this.logger.error(`扣除用户算力失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 检查是否为匿名用户
     */
    private isAnonymousUser(user: UserPlayground): boolean {
        return user.username.startsWith("anonymous_") || user.username.startsWith("access_");
    }
}
