import { BaseService } from "@common/base/services/base.service";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { ACCOUNT_LOG_TYPE, ACTION } from "@common/modules/account/constants/account-log.constants";
import { AccountLogService } from "@common/modules/account/services/account-log.service";
import { User } from "@common/modules/auth/entities/user.entity";
import { PayfactoryService } from "@common/modules/pay/services/payfactory.service";
import { WxPayService } from "@common/modules/pay/services/wxpay.service";
import { RechargeOrder } from "@modules/console/recharge/entities/recharge-order.entity";
import { Payconfig } from "@modules/console/system/entities/payconfig.entity";
import { PayConfigPayType } from "@modules/console/system/inerface/payconfig.constant";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { WechatPayNotifyAnalysisParams, WechatPayNotifyParams } from "@sdk/wechat/interfaces/pay";
import { Repository } from "typeorm/repository/Repository";

import { PrepayDto } from "../dto/prepay.dto";
@Injectable()
export class PayService extends BaseService<Payconfig> {
    constructor(
        @InjectRepository(Payconfig)
        private readonly payconfigRepository: Repository<Payconfig>,
        @InjectRepository(RechargeOrder)
        private readonly rechargeOrderRepository: Repository<RechargeOrder>,
        private readonly wxpayService: WxPayService, // 注入wxpay服务
        private readonly payfactoryService: PayfactoryService,
        private readonly accountLogService: AccountLogService,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {
        super(payconfigRepository);
    }

    /**
     * 预支付接口
     * @param prepayDto
     * @returns
     */
    async prepay(prepayDto: PrepayDto, userId: string) {
        const { orderId, payType, from } = prepayDto;
        let order: RechargeOrder | null = null;
        switch (from) {
            case "recharge":
                order = await this.rechargeOrderRepository.findOne({
                    where: {
                        id: orderId,
                        userId: userId,
                    },
                });
                if (!order) {
                    throw HttpExceptionFactory.badRequest("充值订单不存在");
                }
                if (order.payStatus) {
                    throw HttpExceptionFactory.badRequest("该订单已支付");
                }
                break;
            default:
                throw HttpExceptionFactory.badRequest("无效的订单来源");
        }
        const orderAmount = Number(order?.orderAmount || 0);
        // 统一支付订单
        const PayOrder = {
            orderSn: order.orderNo,
            payType,
            from,
            amount: orderAmount,
        };
        const qrCode = await this.wxpayService.createwxPayOrder(PayOrder);

        return {
            qrCode,
            payType,
        };
    }

    /**
     * 获取支付状态
     * @param orderId
     * @param from
     * @returns
     */
    async getPayResult(orderId: string, from: string, userId: string) {
        let order: RechargeOrder | null = null;
        if ("recharge" == from) {
            order = await this.rechargeOrderRepository.findOne({
                where: {
                    id: orderId,
                    userId: userId,
                },
                select: ["id", "orderNo", "payStatus"],
            });
        }
        return order;
    }

    /**
     * 微信回调解析参数
     * @param playload
     * @param body
     */
    async notifyWxPay(params: WechatPayNotifyParams, body: Record<string, any>) {
        try {
            const wechatPayService = await this.payfactoryService.getPayService(
                PayConfigPayType.WECHAT,
            );
            const result = await wechatPayService.notifyPay(params);
            if (!result) {
                throw new Error("验证签名失败");
            }
            const decryptBody = await this.wxpayService.decryptPayNotifyBody(body);
            const method = decryptBody.attach;
            const analysisParams: WechatPayNotifyAnalysisParams = {
                outTradeNo: decryptBody.out_trade_no,
                transactionId: decryptBody.transaction_id,
                attach: decryptBody.attach,
                payer: decryptBody.payer,
                amount: decryptBody.amount,
            };
            // 检查方法是否存在
            if ("function" === typeof this[method]) {
                await this[method](analysisParams); // 动态调用
            } else {
                throw new Error(`方法 ${method} 未定义`);
            }
        } catch (error) {
            this.logger.error(`微信支付回调处理失败: ${error.message}`);
            console.log(`微信支付回调处理失败: ${error.message}`);
        }
    }

    /**
     * 充值回调
     * @param analysisParams
     * @returns
     */
    async recharge(analysisParams: WechatPayNotifyAnalysisParams) {
        const order = await this.rechargeOrderRepository.findOne({
            where: {
                orderNo: analysisParams.outTradeNo,
            },
        });
        if (!order) {
            return;
        }
        //应该要走退款逻辑
        if (1 == order.payStatus) {
            return;
        }
        const power = order.power;
        const givePower = order.givePower;
        await this.userRepository.manager.transaction(async (entityManager) => {
            if (power > 0) {
                await entityManager.increment(User, { id: order.userId }, "power", power);
                await this.accountLogService.recordWithTransaction(
                    entityManager,
                    order.userId,
                    ACCOUNT_LOG_TYPE.RECHARGEORDER_INC,
                    ACTION.INC,
                    power,
                );
            }
            if (givePower > 0) {
                await entityManager.increment(User, { id: order.userId }, "power", givePower);
                //记录用户余额变动
                await this.accountLogService.recordWithTransaction(
                    entityManager,
                    order.userId,
                    ACCOUNT_LOG_TYPE.RECHARGEORDER_GIVE_INC,
                    ACTION.INC,
                    givePower,
                );
            }
            //更新订单表，标记已支付
            await entityManager.update(RechargeOrder, order.id, {
                payStatus: 1,
                payTime: new Date(),
                transactionId: analysisParams.transactionId,
            });
            //更新用户累计充值余额;
            await entityManager.increment(
                User,
                { id: order.userId },
                "totalRechargeAmount",
                power + givePower,
            );
        });
    }
}
