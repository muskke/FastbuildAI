import { BaseService } from "@common/base/services/base.service";
import { UserCreateSource } from "@common/constants";
import { ACCOUNT_LOG_TYPE_DESCRIPTION } from "@common/modules/account/constants/account-log.constants";
import { User } from "@common/modules/auth/entities/user.entity";
import { AiChatMessage } from "@modules/console/ai/entities/ai-chat-message.entity";
import { RechargeOrder } from "@modules/console/recharge/entities/recharge-order.entity";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm/repository/Repository";

import { QueryAccountLogDto } from "../dto/query-account-log.dto";
import { AccountLog } from "../entities/account-log.entity";

@Injectable()
export class FinanceService extends BaseService<AccountLog> {
    constructor(
        @InjectRepository(AccountLog)
        private readonly accountLogRepository: Repository<AccountLog>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(RechargeOrder)
        private readonly rechargeOrderRepository: Repository<RechargeOrder>,
        @InjectRepository(AiChatMessage)
        private readonly aiChatRMessageRepository: Repository<AiChatMessage>,
    ) {
        super(accountLogRepository);
    }

    async center() {
        //经营概括
        //累计收入金额
        const totalIncomeAmount = await this.rechargeOrderRepository.sum("orderAmount", {
            payStatus: 1,
        });
        //累计订单数量
        const totalIncomeNum = await this.rechargeOrderRepository.count({
            where: { payStatus: 1 },
        });
        //累计退款金额
        const totalRefundAmount = await this.rechargeOrderRepository.sum("orderAmount", {
            refundStatus: 1,
        });
        //累计退款数量
        const totalRefundNum = await this.rechargeOrderRepository.count({
            where: { refundStatus: 1 },
        });
        //净收入
        const totalNetIncome = totalIncomeAmount - totalRefundAmount;
        //充值概括
        //充值金额
        const rechargeAmount = totalIncomeAmount;
        //充值订单数量
        const rechargeNum = totalIncomeNum;
        //充值退款
        const rechargeRefundAmount = totalRefundAmount;
        //充值退款数量
        const rechargeRefundNum = totalRefundNum;
        //充值净收入
        const rechargeNetIncome = totalNetIncome;
        //用户概况
        //用户总人数
        const totalUserNum = await this.userRepository.count({
            select: ["id"],
            where: { isRoot: 0 },
        });
        //累计充值人数
        const totalRecharge = await this.rechargeOrderRepository
            .createQueryBuilder("recharge-order")
            .where("recharge-order.payStatus = :payStatus", { payStatus: 1 })
            .select("COUNT(recharge-order.id)", "count")
            .getRawOne();
        const totalRechargeNum = Number(totalRecharge.count || 0);
        //累计充值金额
        const userAccount = await this.userRepository
            .createQueryBuilder("user")
            .select("SUM(user.totalRechargeAmount)", "totalRechargeSum")
            .addSelect("SUM(user.power)", "totalPowerSum")
            // .where("user.source = :source", { source: UserCreateSource.CONSOLE })
            .getRawOne();
        const totalRechargeAmount = Number(userAccount.totalRechargeSum || 0);
        const totalPowerSum = Number(userAccount.totalPowerSum || 0);
        //累计对话次数
        const totalChatNum = await this.aiChatRMessageRepository.count({
            where: {
                status: "completed",
            },
        });
        return {
            finance: {
                totalIncomeAmount,
                totalIncomeNum,
                totalRefundAmount,
                totalRefundNum,
                totalNetIncome,
            },
            recharge: {
                rechargeAmount,
                rechargeNum,
                rechargeRefundAmount,
                rechargeRefundNum,
                rechargeNetIncome,
            },
            user: {
                totalUserNum,
                totalRechargeNum,
                totalChatNum,
                totalRechargeAmount,
                totalPowerSum,
            },
        };
    }
    /**
     * 用户账户变动记录
     * @param queryAccountLogDto
     * @returns
     */
    async accountLogLists(queryAccountLogDto: QueryAccountLogDto) {
        const { keyword, accountType } = queryAccountLogDto;
        const queryBuilder = this.accountLogRepository.createQueryBuilder("account-log");
        queryBuilder.leftJoin("account-log.user", "user");
        if (keyword) {
            queryBuilder.andWhere("(user.username ILIKE :keyword OR user.phone ILIKE :keyword)", {
                keyword: `%${keyword}%`,
            });
        }
        //
        if (accountType) {
            queryBuilder.andWhere("account-log.accountType = :accountType", {
                accountType: accountType,
            });
        }
        queryBuilder.select([
            "account-log.id",
            "account-log.accountNo",
            "account-log.accountType",
            "account-log.action",
            "account-log.changeAmount",
            "account-log.associationUserId",
            "account-log.leftAmount",
            "account-log.createdAt",
            "user.username",
            "user.userNo",
            "user.avatar",
        ]);
        queryBuilder
            .orderBy("account-log.createdAt", "DESC")
            .addOrderBy("account-log.accountType", "DESC");

        const lists = await this.paginateQueryBuilder(queryBuilder, queryAccountLogDto);
        const userLists = await this.userRepository.find({
            where: { source: UserCreateSource.CONSOLE },
            select: ["id", "nickname"],
        });
        lists.items = lists.items.map((accountLog) => {
            const accountTypeDesc = ACCOUNT_LOG_TYPE_DESCRIPTION[accountLog.accountType];
            // const totalPower = order.power + order.givePower;
            const associationUser =
                userLists.find((item) => item.id == accountLog.associationUserId)?.nickname || "";
            //const payStatusDesc = order.payStatus == 1 ? "已支付" : "未支付";
            return { ...accountLog, accountTypeDesc, associationUser };
        });
        const accountTypeLists = ACCOUNT_LOG_TYPE_DESCRIPTION;
        return { ...lists, accountTypeLists };
    }
}
