import { AppEntity } from "@common/decorators/app-entity.decorator";
import { ACCOUNT_LOG_SOURCE_VALUE } from "@common/modules/account/constants/account-log.constants";
import { User } from "@common/modules/auth/entities/user.entity";
import {
    Column,
    CreateDateColumn,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

export type AccountLogSourceInfo = {
    type: ACCOUNT_LOG_SOURCE_VALUE;
    source: string;
};
@AppEntity({ name: "account_log", comment: "用户账户记录" })
export class AccountLog {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({
        type: "varchar",
        length: 64,
        comment: "编号",
    })
    accountNo: string;

    /**
     * 用户ID
     */
    @Column({
        type: "uuid",
        comment: "用户ID",
    })
    @Index()
    userId: string;

    @Column({
        type: "integer",
        comment: "变动类型",
    })
    accountType: number;

    /**
     * 动作
     */
    @Column({
        default: 1,
        comment: "动作:1-增加;false-0",
    })
    action: number;

    @Column({
        type: "integer",
        comment: "变动数量",
    })
    changeAmount: number;

    @Column({
        type: "integer",
        comment: "剩余数量",
    })
    leftAmount: number;

    @Column({
        type: "varchar",
        length: 64,
        nullable: true,
        comment: "关联单号",
    })
    associationNo: string;

    /**
     * 用户ID
     */
    @Column({
        type: "uuid",
        nullable: true,
        comment: "用户ID",
    })
    @Index()
    associationUserId: string;

    @Column({
        type: "jsonb",
        nullable: true,
        comment: "来源",
    })
    sourceInfo: AccountLogSourceInfo;

    @Column({
        type: "varchar",
        nullable: true,
        length: 64,
        comment: "备注",
    })
    remark: string;

    @CreateDateColumn({ type: "timestamp with time zone", comment: "创建时间" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp with time zone", comment: "更新时间" })
    updatedAt: Date;

    /**
     * 关联的用户
     */
    @ManyToOne(() => User, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "user_id" })
    user: User;
}
