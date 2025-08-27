import { BaseService } from "@common/base/services/base.service";
import { User } from "@common/modules/auth/entities/user.entity";
import { generateNo } from "@common/utils/helper.util";
import { AccountLog } from "@modules/console/finance/entities/account-log.entity";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager } from "typeorm/entity-manager/EntityManager";
import { Repository } from "typeorm/repository/Repository";

import { ACCOUNT_LOG_TYPE_VALUE, ACTION_VALUE } from "../constants/account-log.constants";

@Injectable()
export class AccountLogService extends BaseService<AccountLog> {
    constructor(
        @InjectRepository(AccountLog)
        private readonly accountLogRepository: Repository<AccountLog>,
    ) {
        super(accountLogRepository);
    }

    /**
     * 记录账户变动
     * @param userId
     * @param accountType
     * @param action
     * @param changeAmount
     * @param associationSn
     * @param associationUserId
     * @param remark
     * @returns
     */
    async recordWithTransaction(
        manager: EntityManager,
        userId: string,
        accountType: ACCOUNT_LOG_TYPE_VALUE,
        action: ACTION_VALUE,
        changeAmount: number,
        associationNo: string = "",
        associationUserId: string = null,
        remark: string = "",
    ) {
        const user = await manager.findOne(User, {
            where: { id: userId },
        });

        if (!user) {
            return false;
        }
        await manager.insert(AccountLog, {
            userId,
            accountNo: await generateNo(this.accountLogRepository, "accountNo"),
            accountType,
            action,
            changeAmount,
            leftAmount: user.power,
            associationNo,
            associationUserId,
            remark,
        });
    }
}
