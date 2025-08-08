import { BaseController } from "@common/base/controllers/base.controller";
import { ConsoleController } from "@common/decorators/controller.decorator";
import { Public } from "@common/decorators/public.decorator";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { PayOrder } from "@common/interfaces/pay.interface";
import { PayFrom } from "@common/interfaces/pay.interface";
import { WxPayService } from "@common/modules/pay/services/wxpay.service";
import { PayConfigType } from "@modules/console/system/inerface/payconfig.constant";
import { Body, Controller, Get, Headers, Param, Post, Res } from "@nestjs/common";
import { WechatPayNotifyParams } from "@sdk/wechat/interfaces/pay";
import { Request, Response } from "express";

/**
 * 支付控制器
 *
 * 提供支付相关的API接口
 */
@ConsoleController("pay", "支付相关接口")
export class PayController extends BaseController {
    constructor(private readonly wxPayService: WxPayService) {
        super();
    }
    // @Public()
    // @Post("notifyWxPay")
    // async notifyWxPay(
    //     @Headers() headers: Headers,
    //     @Body() body: Record<string, any>,
    //     @Res() res: Response,
    // ) {
    //     const playload: WechatPayNotifyParams = {
    //         timestamp: headers["wechatpay-timestamp"],
    //         nonce: headers["wechatpay-nonce"],
    //         body,
    //         serial: headers["wechatpay-serial"],
    //         signature: headers["wechatpay-signature"],
    //     };

    //     await this.wxPayService.decryptPayNotify(playload, body);

    //     //商户需告知微信支付接收回调成功，HTTP应答状态码需返回200或204，无需返回应答报文
    //     res.status(200).send("");
    // }

    /**
     * 测试-创建支付订单
     *
     * @param payType 支付类型
     * @returns 支付配置信息
     */
    // @Public()
    // @Post()
    // async testPayConfig(@Body() body: { payType: PayConfigType }) {
    //     const testOrder: PayOrder = {
    //         orderSn: "20250724252244451234",
    //         amount: 1,
    //         payType: body.payType,
    //         from: PayFrom.RECHARGE,
    //     };
    //     const result = await this.wxPayService.createwxPayOrder(testOrder);
    //     console.log("二维码拉取成功:");
    //     console.log(testOrder);
    //     return result;
    // }
    // @Get("queryPayStatus/:orderSn")
    // async queryPayStatus(@Param("orderSn") orderSn: string) {
    //     const result = await this.wxPayService.queryPayOrder(orderSn);
    //     return result;
    // }
    // async recharge() {}
}
