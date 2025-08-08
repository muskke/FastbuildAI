import { BaseService } from "@common/base/services/base.service";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { Dict } from "@common/modules/dict/entities/dict.entity";
import { DictService } from "@common/modules/dict/services/dict.service";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { UpdateRechargeConfigDto } from "../dto/update-recharge-config.dto";
import { Recharge } from "../entities/recharge.entity";

@Injectable()
export class RechargeConfigService extends BaseService<Dict> {
    private readonly rechargeService: BaseService<Recharge>;

    constructor(
        private readonly dictService: DictService,
        @InjectRepository(Dict) repository: Repository<Dict>,
        @InjectRepository(Recharge)
        private readonly rechargeRepository: Repository<Recharge>,
    ) {
        super(repository);
        this.rechargeService = new BaseService(rechargeRepository);
    }

    async getConfig() {
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
        return {
            rechargeStatus,
            rechargeExplain,
            rechargeRule,
        };
    }

    async setConfig(updateRechargeConfigDto: UpdateRechargeConfigDto) {
        try {
            const { rechargeStatus, rechargeExplain, rechargeRule } = updateRechargeConfigDto;
            await this.dictService.set("recharge_status", rechargeStatus, {
                group: "recharge_config",
                description: "充值功能状态",
            });
            await this.dictService.set("recharge_explain", rechargeExplain, {
                group: "recharge_config",
                description: "充值说明",
            });
            const rechargeIdLists = await this.rechargeRepository.find({
                select: ["id"],
            });
            rechargeRule.forEach((item, index) => {
                const num = index + 1;
                const power = Number(item.power);
                const givePower = Number(item.givePower);
                const sellPrice = Number(item.sellPrice);
                if (Number.isNaN(power)) {
                    throw new Error("第" + num + "行的充值数量参数错误");
                }
                if (0 == power || power < 0) {
                    throw new Error("请填写第" + num + "行的充值数量错误");
                }
                if (Number.isNaN(givePower)) {
                    throw new Error("第" + num + "行的赠送数量参数错误");
                }
                if (givePower < 0) {
                    throw new Error("请填写第" + num + "行的赠送充值数量错误");
                }
                if (null === sellPrice || undefined === sellPrice) {
                    throw new Error("第" + num + "行的销售价格参数错误");
                }
                if (sellPrice <= 0) {
                    throw new Error("请填写第" + num + "行的销售价格错误");
                }
            });
            const filteredRechargeIdLists = rechargeIdLists.filter((rechargeItem) => {
                return !rechargeRule.some((ruleItem) => ruleItem.id === rechargeItem.id);
            });
            await this.rechargeRepository.manager.transaction(async (entityManager) => {
                await entityManager.save(Recharge, rechargeRule);
                if (filteredRechargeIdLists.length > 0) {
                    await entityManager.delete(Recharge, {
                        id: In(filteredRechargeIdLists.map((recharge) => recharge.id)),
                    });
                }
            });
        } catch (error) {
            throw HttpExceptionFactory.badRequest(error.message);
        }
    }
}
