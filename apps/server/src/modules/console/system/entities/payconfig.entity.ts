/**
 * 支付配置实体
 */
import { AppEntity } from "@common/decorators/app-entity.decorator";
import {
    BooleanNumber,
    BooleanNumberType,
    Merchant,
    MerchantType,
    PayConfigPayType,
    PayConfigType,
    PayVersion,
    PayVersionType,
} from "@modules/console/system/inerface/payconfig.constant";
import { Column, PrimaryGeneratedColumn } from "typeorm";

@AppEntity({ name: "payconfig", comment: "支付配置" })
export class Payconfig {
    /**
     * 主键ID
     */
    @PrimaryGeneratedColumn("uuid")
    id: string;

    /**
     * 支付配置图标
     */
    @Column()
    logo: string;

    /**
     * 是否启用
     */
    @Column({
        type: "enum",
        enum: BooleanNumber,
        comment: "是否启用",
    })
    isEnable: BooleanNumberType;

    /**
     * 是否默认
     */
    @Column({
        type: "enum",
        enum: BooleanNumber,
        comment: "是否默认",
    })
    isDefault: BooleanNumberType;

    /**
     * 支付配置名称
     */
    @Column()
    name: string;

    /**
     * 支付方式
     */
    @Column({
        type: "enum",
        enum: PayConfigPayType,
        comment: "支付方式",
    })
    payType: PayConfigType;

    /**
     * 排序
     */
    @Column({ default: 0 })
    sort: number;

    /**
     * 支付版本
     */
    @Column({
        type: "enum",
        enum: PayVersion,
        comment: "支付版本",
    })
    payVersion: PayVersionType;

    /**
     * 商户类型
     */
    @Column({
        type: "enum",
        enum: Merchant,
        comment: "商户类型",
    })
    merchantType: MerchantType;

    /**
     * 商户号
     */
    @Column({ nullable: true })
    mchId: string;

    /**
     * 商户api密钥
     */
    @Column({ nullable: true })
    apiKey: string;

    /**
     * 微信支付密钥
     */
    @Column({ nullable: true })
    paySignKey: string;

    /**
     * 微信支付证书
     */
    @Column({ nullable: true })
    cert: string;

    /**
     * 支付授权目录
     */
    @Column({ nullable: true })
    payAuthDir: string;

    /**
     * appid
     */
    @Column({ nullable: true })
    appId: string;
}
