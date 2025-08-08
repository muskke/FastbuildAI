import { AppEntity } from "@common/decorators/app-entity.decorator";
import { Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@AppEntity({ name: "recharge", comment: "充值配置" })
export class Recharge {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({
        type: "integer",
        comment: "充值的数量",
    })
    power: number;

    @Column({
        type: "integer",
        comment: "赠送的数量",
    })
    givePower: number;

    @Column({
        type: "decimal",
        precision: 10,
        scale: 2,
        comment: "售价",
    })
    sellPrice: number;

    @Column({
        type: "varchar",
        length: 64,
        comment: "标签",
    })
    label: string;

    @CreateDateColumn({ type: "timestamp with time zone", comment: "创建时间" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp with time zone", comment: "更新时间" })
    updatedAt: Date;
}
