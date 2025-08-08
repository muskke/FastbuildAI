import { BaseService } from "@common/base/services/base.service";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Example } from "../../../entities/example.entity";
import { ExampleCreateDto } from "./dto/example-create.dto";

/**
 * 文章服务
 */
@Injectable()
export class ExampleService extends BaseService<Example> {
    /**
     * 构造函数
     * @param exampleRepository 文章仓库
     */
    constructor(
        @InjectRepository(Example)
        private readonly exampleRepository: Repository<Example>,
    ) {
        super(exampleRepository);
    }

    /**
     * 创建示例
     * @param exampleCreateDto 创建示例DTO
     * @returns 创建的示例
     */
    async createExample(exampleCreateDto: ExampleCreateDto): Promise<string> {
        return "You entered: " + exampleCreateDto.name;
    }
}
