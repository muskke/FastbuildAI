import { InjectRepository } from "@buildingai/db/@nestjs/typeorm";
import { Repository } from "@buildingai/db/typeorm";
import { Injectable } from "@nestjs/common";

import { Example } from "../../../db/entities/example.entity";

/**
 * 密钥配置服务
 */
@Injectable()
export class ExampleService {
    constructor(
        @InjectRepository(Example)
        private readonly exampleRepository: Repository<Example>,
    ) {}

    /**
     * example service
     * @param ExampleDto example dto
     */
    async test() {
        return await this.exampleRepository.save({
            name: "test",
        });
    }
}
