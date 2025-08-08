import { BaseService } from "@common/base/services/base.service";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { TERMINAL_TYPES } from "../constants/terminal.constants";
import { CreateMicropageDto } from "../dto/create-micropage.dto";
import { QueryMicropageDto } from "../dto/query-micropage.dto";
import { UpdateMicropageDto } from "../dto/update-micropage.dto";
import { DecorateMicropageEntity } from "../entities/decorate-micropage.entity";

@Injectable()
export class MicropageService extends BaseService<DecorateMicropageEntity> {
    constructor(
        @InjectRepository(DecorateMicropageEntity)
        private readonly DecorateMicropageRepository: Repository<DecorateMicropageEntity>,
    ) {
        super(DecorateMicropageRepository);
    }

    /**
     * 微页面列表
     * @param queryMicropageDto 微页面查询参数
     * @returns
     */
    async lists(queryMicropageDto: QueryMicropageDto) {
        const { name, terminal } = queryMicropageDto;
        //SQL 查询、别名
        const queryBuilder = this.DecorateMicropageRepository.createQueryBuilder("micropage");

        // 名称搜索
        if (name) {
            queryBuilder.andWhere("micropage.name ILIKE :name", { name: `%${name}%` });
        }

        // 终端类型筛选
        if (terminal) {
            queryBuilder.andWhere("micropage.terminal = :terminal", { terminal });
        }

        // 设置排序
        queryBuilder.orderBy("micropage.createdAt", "DESC");

        return queryBuilder.getMany();
    }

    /**
     * 创建微页面
     * @param createMicropageDto 创建微页面数据
     * @returns 创建的微页面信息
     */
    async create(createMicropageDto: CreateMicropageDto): Promise<DecorateMicropageEntity> {
        const micropageData = {
            ...createMicropageDto,
            terminal: createMicropageDto.terminal || TERMINAL_TYPES.WEB, // 默认为 web 终端
        };

        return await this.DecorateMicropageRepository.save(micropageData);
    }

    /**
     * 更新微页面
     * @param id 微页面ID
     * @param updateMicropageDto 更新数据
     * @returns 更新结果
     */
    async updateById(id: string, updateMicropageDto: UpdateMicropageDto) {
        const updateData = {
            ...updateMicropageDto,
        };

        await this.DecorateMicropageRepository.update(id, updateData);
        return await this.findOneById(id);
    }

    /**
     * 设置首页
     * @param id 微页面ID
     * @returns 更新结果
     */
    async home(id: string) {
        const micropage = await this.findOneById(id);
        if (!micropage) {
            throw HttpExceptionFactory.notFound("微页面不存在");
        }

        // 这里可以根据具体业务需求实现设置首页的逻辑
        // 比如更新某个字段标记为首页，或者其他业务逻辑

        return micropage;
    }

    /**
     * 删除微页面
     * @param id
     */
    async delete(id: string): Promise<void> {
        // 查找要删除的数据
        const result = await this.findOneById(id);

        if (!result) {
            throw HttpExceptionFactory.notFound("数据不存在");
        }

        await this.DecorateMicropageRepository.delete(result.id);
    }

    /**
     * 批量删除微页面
     * @param ids 微页面ID数组
     * @returns 删除结果
     */
    async batchDelete(ids: string[]): Promise<void> {
        // 检查是否有首页
        for (const id of ids) {
            const micropage = await this.DecorateMicropageRepository.findOne({
                where: { id },
            });

            if (!micropage) {
                throw HttpExceptionFactory.notFound(`微页面"${id}"不存在`);
            }
        }

        // 批量删除
        await this.deleteMany(ids);
    }
}
