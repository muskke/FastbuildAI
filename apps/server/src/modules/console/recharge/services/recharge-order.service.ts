import { BaseService } from "@common/base/services/base.service";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import {
    ACCOUNT_LOG_SOURCE,
    ACCOUNT_LOG_TYPE,
    ACTION,
} from "@common/modules/account/constants/account-log.constants";
import { AccountLogService } from "@common/modules/account/services/account-log.service";
import { User } from "@common/modules/auth/entities/user.entity";
import { REFUND_ORDER_FROM } from "@common/modules/refund/constants/refund.constants";
import { RefundLog } from "@common/modules/refund/entities/refund-log.entity";
import { RefundService } from "@common/modules/refund/services/refund.service";
import { Payconfig } from "@modules/console/system/entities/payconfig.entity";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { QueryRechargeOrderDto } from "../dto/query-recharge-order.dto";
import { RechargeOrder } from "../entities/recharge-order.entity";

@Injectable()
export class RechargeOrderService extends BaseService<RechargeOrder> {
    constructor(
        @InjectRepository(RechargeOrder)
        private readonly RechargeOrderRepository: Repository<RechargeOrder>,
        @InjectRepository(Payconfig)
        private readonly payconfigRepository: Repository<Payconfig>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(RefundLog)
        private readonly refundLogRepository: Repository<RefundLog>,
        private readonly accountLogService: AccountLogService,
        private readonly refundService: RefundService,
    ) {
        super(RechargeOrderRepository);
    }
    /**
     * 充值记录列表
     * @param queryRechargeOrderDto
     * @returns
     */
    async lists(queryRechargeOrderDto: QueryRechargeOrderDto) {
        const { orderNo, keyword, payType, payStatus, refundStatus } = queryRechargeOrderDto;
        const queryBuilder = this.RechargeOrderRepository.createQueryBuilder("recharge-order");
        queryBuilder.leftJoin("recharge-order.user", "user");
        if (orderNo) {
            queryBuilder.andWhere("recharge-order.orderNo ILIKE :orderNo", {
                orderNo: `%${orderNo}%`,
            });
        }
        if (keyword) {
            queryBuilder.andWhere("(user.username ILIKE :keyword OR user.phone ILIKE :keyword)", {
                keyword: `%${keyword}%`,
            });
        }
        if (payType) {
            queryBuilder.andWhere("recharge-order.payType = :payType", {
                payType: payType,
            });
        }
        if (payStatus) {
            queryBuilder.andWhere("recharge-order.payStatus = :payStatus", {
                payStatus: payStatus,
            });
        }
        if (refundStatus) {
            queryBuilder.andWhere("recharge-order.refundStatus = :refundStatus", {
                refundStatus: refundStatus,
            });
        }
        queryBuilder.select([
            "recharge-order.id",
            "recharge-order.orderNo",
            "recharge-order.payType",
            "recharge-order.payStatus",
            "recharge-order.refundStatus",
            "recharge-order.power",
            "recharge-order.givePower",
            "recharge-order.payTime",
            "recharge-order.createdAt",
            "recharge-order.orderAmount",
            "user.username",
            "user.avatar",
        ]);
        const payWayList = await this.payconfigRepository.find({
            select: ["name", "payType"],
        });
        queryBuilder.orderBy("recharge-order.createdAt", "DESC");
        const orderLists = await this.paginateQueryBuilder(queryBuilder, queryRechargeOrderDto);
        orderLists.items = orderLists.items.map((order) => {
            const totalPower = order.power + order.givePower;
            const payTypeDesc = payWayList.find((item) => item.payType == order.payType)?.name;
            const payStatusDesc = order.payStatus == 1 ? "已支付" : "未支付";
            return { ...order, totalPower, payTypeDesc, payStatusDesc };
        });
        const totalOrder = await this.RechargeOrderRepository.count({ where: { payStatus: 1 } });
        const totalAmount =
            (await this.RechargeOrderRepository.sum("orderAmount", { payStatus: 1 })) || 0;
        const totalRefundOrder = await this.RechargeOrderRepository.count({
            where: { refundStatus: 1 },
        });
        const totalRefundAmount =
            (await this.RechargeOrderRepository.sum("orderAmount", {
                refundStatus: 1,
            })) || 0;
        const totalIncome = totalAmount - totalRefundAmount;
        const statistics = {
            totalOrder,
            totalAmount,
            totalRefundOrder,
            totalRefundAmount,
            totalIncome,
        };
        return { ...orderLists, statistics, payTypeLists: payWayList };
    }

    /**
     * 充值订单详情
     * @param id
     * @returns
     */
    async detail(id: string) {
        const queryBuilder = this.RechargeOrderRepository.createQueryBuilder("recharge-order");
        queryBuilder.leftJoin("recharge-order.user", "user");
        queryBuilder.andWhere("recharge-order.id = :id", { id });
        queryBuilder.select([
            "recharge-order.id",
            "recharge-order.orderNo",
            "recharge-order.payType",
            "recharge-order.payStatus",
            "recharge-order.refundStatus",
            "recharge-order.power",
            "recharge-order.givePower",
            "recharge-order.orderAmount",
            "recharge-order.payTime",
            "recharge-order.createdAt",
            "recharge-order.terminal",
            "user.username",
            "user.avatar",
        ]);
        const detail = await queryBuilder.getOne();
        if (!detail) {
            throw HttpExceptionFactory.badRequest("充值订单不存在");
        }
        let refundStatusDesc = "-";
        if (detail.refundStatus) {
            refundStatusDesc = "已退款";
        }
        const orderType = "充值订单";
        const totalPower = detail.power + detail.givePower;
        const payTypeDesc = await this.payconfigRepository.findOne({
            select: ["name"],
            where: {
                payType: detail.payType,
            },
        });
        let refundNo = "";
        if (detail.refundStatus) {
            refundNo = (
                await this.refundLogRepository.findOne({
                    where: { orderId: detail.id },
                })
            )?.refundNo;
        }
        const terminalDesc = "电脑PC";
        return {
            ...detail,
            orderType,
            totalPower,
            refundStatusDesc,
            terminalDesc,
            refundNo,
            payTypeDesc: payTypeDesc.name,
        };
    }

    /**
     * 退款
     * @param id
     */
    async refund(id: string) {
        try {
            const order = await this.RechargeOrderRepository.findOne({ where: { id } });
            if (!order) {
                throw new Error("充值订单不存在");
            }
            if (0 == order.payStatus) {
                throw new Error("订单未支付,不能发起退款");
            }
            if (order.refundStatus) {
                throw new Error("订单已退款");
            }
            const userInfo = await this.userRepository.findOne({ where: { id: order.userId } });
            const totalPower = order.power + order.givePower;
            await this.userRepository.manager.transaction(async (entityManager) => {
                //发起退款
                await this.refundService.initiateRefund({
                    entityManager,
                    orderId: order.id,
                    userId: order.userId,
                    orderNo: order.orderNo,
                    from: REFUND_ORDER_FROM.FROM_RECHARGE,
                    payType: order.payType,
                    transactionId: order.transactionId,
                    orderAmount: order.orderAmount,
                    refundAmount: order.orderAmount,
                });
                //更新已退款
                await entityManager.update(RechargeOrder, id, {
                    refundStatus: 1,
                });
                let userLetPower = totalPower;
                if (userInfo.power < totalPower) {
                    userLetPower = 0;
                } else {
                    userLetPower = userInfo.power - totalPower;
                }
                //扣回用户余额
                await entityManager.update(User, userInfo.id, {
                    power: userLetPower,
                });
                //退用户余额
                await this.accountLogService.recordWithTransaction(
                    entityManager,
                    order.userId,
                    ACCOUNT_LOG_TYPE.RECHARGE_DEC,
                    ACTION.INC,
                    userLetPower,
                    "", // 关联单号
                    null, // 关联用户ID
                    `充值订单退款，退款金额：${order.orderAmount}`,
                    {
                        type: ACCOUNT_LOG_SOURCE.RECHARGE,
                        source: "充值订单",
                    },
                );
            });
        } catch (error) {
            throw HttpExceptionFactory.badRequest(error.message);
        }
    }
}
