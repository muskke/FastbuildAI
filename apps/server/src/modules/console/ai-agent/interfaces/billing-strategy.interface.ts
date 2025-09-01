import { UserPlayground } from "@common/interfaces/context.interface";
import { User } from "@common/modules/auth/entities/user.entity";

import { Agent } from "../entities/agent.entity";

/**
 * 计费结果接口
 */
export interface BillingResult {
    /** 承担费用的用户，null表示不计费 */
    billToUser: User | null;
    /** 计费场景描述，用于错误提示 */
    billingContext: string;
}

/**
 * 计费策略接口
 * 定义不同场景下的计费行为
 */
export interface BillingStrategy {
    /**
     * 确定谁来承担费用
     * @param agent 智能体信息
     * @param user 当前用户
     * @param userRepository 用户仓库
     * @returns 计费结果
     */
    determineBillTo(
        agent: Agent,
        user: UserPlayground,
        userRepository: any,
    ): Promise<BillingResult>;
}

/**
 * 不计费策略 - 用于编排模式
 */
export class NoBillingStrategy implements BillingStrategy {
    async determineBillTo(): Promise<BillingResult> {
        return {
            billToUser: null,
            billingContext: "编排模式",
        };
    }
}

/**
 * 扣用户费用策略 - 根据用户类型智能决定
 * 匿名用户扣分享者钱，真实用户扣用户钱
 */
export class SmartUserBillingStrategy implements BillingStrategy {
    async determineBillTo(
        agent: Agent,
        user: UserPlayground,
        userRepository: any,
    ): Promise<BillingResult> {
        if (this.isAnonymousUser(user)) {
            // 匿名用户 -> 扣分享者（创建者）的钱
            const billToUser = await userRepository.findOne({
                where: { id: agent.createBy },
            });
            return {
                billToUser,
                billingContext: "分享者算力",
            };
        } else {
            // 真实用户 -> 扣用户的钱
            const billToUser = await userRepository.findOne({
                where: { id: user.id },
            });
            return {
                billToUser,
                billingContext: "您的算力",
            };
        }
    }

    private isAnonymousUser(user: UserPlayground): boolean {
        return (
            user.username?.startsWith("anonymous_") ||
            user.username?.startsWith("access_") ||
            user.id?.startsWith("anonymous_") ||
            user.id?.startsWith("api_")
        );
    }
}

/**
 * 只扣用户费用策略 - 无论什么情况都扣当前用户的钱
 */
export class UserBillingStrategy implements BillingStrategy {
    async determineBillTo(
        agent: Agent,
        user: UserPlayground,
        userRepository: any,
    ): Promise<BillingResult> {
        const billToUser = await userRepository.findOne({
            where: { id: user.id },
        });
        return {
            billToUser,
            billingContext: "您的算力",
        };
    }
}

/**
 * 扣创建者费用策略 - 无论什么情况都扣创建者的钱
 */
export class CreatorBillingStrategy implements BillingStrategy {
    async determineBillTo(
        agent: Agent,
        user: UserPlayground,
        userRepository: any,
    ): Promise<BillingResult> {
        const billToUser = await userRepository.findOne({
            where: { id: agent.createBy },
        });
        return {
            billToUser,
            billingContext: "创建者算力",
        };
    }
}
