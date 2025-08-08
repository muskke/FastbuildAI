import { BaseService } from "@common/base/services/base.service";
import { UserTerminalType } from "@common/constants/status-codes.constant";
import { PaginationDto } from "@common/dto/pagination.dto";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { User } from "@common/modules/auth/entities/user.entity";
import { Dict } from "@common/modules/dict/entities/dict.entity";
import { DictService } from "@common/modules/dict/services/dict.service";
import { generateNo } from "@common/utils/helper.util";
import { Recharge } from "@modules/console/recharge/entities/recharge.entity";
import { RechargeOrder } from "@modules/console/recharge/entities/recharge-order.entity";
import { Payconfig } from "@modules/console/system/entities/payconfig.entity";
import {
    BooleanNumber,
    PayConfigPayType,
    PayConfigType,
} from "@modules/console/system/inerface/payconfig.constant";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class RechargeService extends BaseService<Dict> {
    private readonly rechargeOrderService: BaseService<RechargeOrder>;

    constructor(
        private readonly dictService: DictService,
        @InjectRepository(Dict) repository: Repository<Dict>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Recharge)
        private readonly rechargeRepository: Repository<Recharge>,
        @InjectRepository(RechargeOrder)
        private readonly rechargeOrderRepository: Repository<RechargeOrder>,
        @InjectRepository(Payconfig)
        private readonly payconfigRepository: Repository<Payconfig>,
    ) {
        super(repository);
        this.rechargeOrderService = new BaseService(rechargeOrderRepository);
    }

    /**
     * 充值记录
     * @param paginationDto
     * @param userId
     * @returns
     */
    async lists(paginationDto: PaginationDto, userId: string) {
        const orderLists = await this.rechargeOrderService.paginate(paginationDto, {
            where: [
                {
                    userId: userId,
                    payStatus: 1,
                },
            ],
            excludeFields: [
                "rechargeSnap",
                "payStatus",
                "payTime",
                "rechargeId",
                "userId",
                "refundTime",
            ],
            order: { createdAt: "DESC" },
        });
        const payWayList = await this.payconfigRepository.find({
            select: ["name", "payType"],
        });
        orderLists.items = orderLists.items.map((order) => {
            const totalPower = order.power + order.givePower;
            let payTypeDesc = payWayList.find((item) => item.payType == order.payType)?.name;
            if (1 === order.refundStatus) {
                payTypeDesc = "已退款";
            }

            return { ...order, totalPower, payTypeDesc };
        });
        return orderLists;
    }
    /**
     * 充值中心
     * @param userId
     * @returns
     */
    async center(userId: string) {
        const user = await this.userRepository.findOne({
            where: {
                id: userId,
            },
            select: ["id", "userNo", "username", "avatar", "power"],
        });
        //充值状态
        const rechargeStatus = await this.dictService.get(
            "recharge_status",
            false,
            "recharge_config",
        );
        //充值说明
        const rechargeExplain = await this.dictService.get(
            "recharge_explain",
            "",
            "recharge_config",
        );
        const rechargeRule = await this.rechargeRepository.find({
            select: ["id", "power", "givePower", "sellPrice", "label"],
        });
        const payWayList = await this.payconfigRepository.find({
            where: {
                isEnable: BooleanNumber.YES,
            },
            select: ["name", "payType", "logo"],
        });
        return {
            user,
            rechargeStatus,
            rechargeExplain,
            rechargeRule,
            payWayList,
        };
    }

    /**
     * 充值订单提交
     * @param id
     * @param payType
     * @param userId
     * @param terminal
     * @returns
     */
    async submitRecharge(
        id: string,
        payType: PayConfigType,
        userId: string,
        terminal: UserTerminalType,
    ) {
        //充值状态
        const rechargeStatus = await this.dictService.get(
            "recharge_status",
            false,
            "recharge_config",
        );
        if (false == rechargeStatus) {
            throw HttpExceptionFactory.badRequest("充值已关闭");
        }
        if (PayConfigPayType.WECHAT != payType) {
            throw HttpExceptionFactory.badRequest("支付方式错误");
        }
        const recharge = await this.rechargeRepository.findOne({
            where: {
                id,
            },
        });
        if (!recharge) {
            throw HttpExceptionFactory.badRequest("充值套餐不存在");
        }
        const orderNo = await generateNo(this.rechargeOrderRepository, "orderNo");
        //下单
        const rechargeOrder = await this.rechargeOrderRepository.save({
            userId,
            terminal,
            orderNo,
            rechargeId: id,
            power: recharge.power,
            givePower: recharge.givePower,
            totalAmount: recharge.sellPrice,
            orderAmount: recharge.sellPrice,
            rechargeSnap: { ...recharge },
            payType: payType,
        });

        return {
            orderId: rechargeOrder.id,
            orderNo,
            orderAmount: rechargeOrder.orderAmount,
        };
    }
}
