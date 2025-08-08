import { BaseService } from "@common/base/services/base.service";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { DecoratePageEntity } from "../entities/decorate-page.entity";
/**
 * 装修页面服务
 */
@Injectable()
export class PageService extends BaseService<DecoratePageEntity> {
    constructor(
        @InjectRepository(DecoratePageEntity)
        private readonly pageRepository: Repository<DecoratePageEntity>,
    ) {
        super(pageRepository);
    }
}
