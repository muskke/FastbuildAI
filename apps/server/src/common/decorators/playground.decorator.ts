import { BusinessCode } from "@common/constants/business-code.constant";
import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";

import { DECORATOR_KEYS } from "../constants/decorators-key.constant";
import { HttpExceptionFactory } from "../exceptions/http-exception.factory";
import { UserPlayground } from "../interfaces/context.interface";
import { checkForbiddenDecorators, getContextPlayground } from "../utils/helper.util";

/**
 * 获取用户Playground数据的装饰器
 *
 * 用于从请求中获取当前登录用户的playground数据
 *
 * 该装饰器用于从请求中提取当前登录用户的playground数据
 * 可以获取完整的playground对象或者指定的属性
 *
 * @param property 可选参数，指定要获取的playground属性
 * @returns 装饰器
 *
 * @example
 * ```typescript
 * // 获取完整的playground对象
 * @ConsoleController('user')
 * export class UserController {
 *   @Get('profile')
 *   getProfile(@Playground() playground) {
 *     // playground 包含当前登录用户的所有playground数据
 *     return {
 *       userId: playground.userId,
 *       username: playground.username,
 *       role: playground.role
 *     };
 *   }
 *   return playground;
 * }
 *
 * // 获取playground中的特定属性
 * @Get('my-playground-config')
 * getPlaygroundConfig(@Playground('config') config: any) {
 *   return config;
 * }
 * ```
 */
export const Playground = createParamDecorator(
    (property: string | undefined, context: ExecutionContext): UserPlayground | object => {
        checkForbiddenDecorators(context, ["decorator:is-public-controller"]);

        const { request, user } = getContextPlayground(context);

        if (!user) {
            throw HttpExceptionFactory.unauthorized(
                "用户未登录或会话已过期",
                BusinessCode.UNAUTHORIZED,
            );
        }

        // 如果指定了属性，则返回该属性的值
        if (property) {
            return request[property];
        }

        return user;
    },
);
