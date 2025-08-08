import { BaseController } from "@common/base/controllers/base.controller";
import { PluginPermissions } from "@common/decorators/permissions.decorator";
import { PluginConsoleController } from "@common/decorators/plugin-controller.decorator";
import { Body, Get, Post } from "@nestjs/common";

import { ExampleCreateDto } from "./dto/example-create.dto";
import { ExampleService } from "./example.service";

/**
 * 示例控制器
 */
@PluginConsoleController("example-template", "示例管理")
export class ExampleController extends BaseController {
    /**
     * 构造函数
     * @param exampleService 示例服务
     */
    constructor(private readonly exampleService: ExampleService) {
        super();
    }

    /**
     * 创建示例
     * @param createExampleDto 创建示例DTO
     * @returns 创建的示例
     */
    @Post()
    @PluginPermissions({
        code: "create",
        name: "创建示例",
        description: "示例插件创建接口",
    })
    async create(@Body() exampleCreateDto: ExampleCreateDto) {
        return this.exampleService.createExample(exampleCreateDto);
    }
}
