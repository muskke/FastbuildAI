import { ExtensionConsoleController } from "@buildingai/core/decorators";
import { Get } from "@nestjs/common";

import { ExampleService } from "../../services/example.service";

/**
 * Example Console Controller
 */
@ExtensionConsoleController("hello", "Example")
export class ExampleConsoleController {
    constructor(private readonly exampleService: ExampleService) {}

    /**
     * Test Console API
     */
    @Get()
    async getHello() {
        const result = await this.exampleService.test();
        return result;
    }
}
