import { PaginationDto } from "@common/dto/pagination.dto";
import { HttpExceptionFactory } from "@common/exceptions/http-exception.factory";
import { Inject, Logger, NotFoundException } from "@nestjs/common";
import { isArray } from "class-validator";
import {
    DataSource,
    DeepPartial,
    EntityManager,
    FindManyOptions,
    FindOptionsWhere,
    ILike,
    In,
    OptimisticLockVersionMismatchError,
    QueryRunner,
    Raw,
    Repository,
    SelectQueryBuilder,
    VersionColumn,
} from "typeorm";

/**
 * 锁类型枚举
 */
export enum LockType {
    /** 乐观锁 - 基于版本号控制 */
    OPTIMISTIC = "optimistic",
    /** 悲观锁 - 共享锁（读锁） */
    PESSIMISTIC_READ = "pessimistic_read",
    /** 悲观锁 - 排他锁（写锁） */
    PESSIMISTIC_WRITE = "pessimistic_write",
    /** 悲观锁 - 部分写锁 */
    PESSIMISTIC_PARTIAL_WRITE = "pessimistic_partial_write",
    /** 悲观锁 - 写锁且跳过锁定的行 */
    PESSIMISTIC_WRITE_OR_FAIL = "pessimistic_write_or_fail",
}

/**
 * 锁配置接口
 */
export interface LockOptions {
    /** 锁类型 */
    type: LockType;
    /** 锁超时时间（毫秒） */
    timeout?: number;
    /** 重试次数 */
    retryCount?: number;
    /** 重试间隔（毫秒） */
    retryDelay?: number;
    /** 版本号字段名（乐观锁使用） */
    versionField?: string;
}

/**
 * 分页结果接口
 *
 * 定义标准的分页返回数据结构
 */
export interface PaginationResult<T> {
    /** 数据列表 */
    items: T[];

    /** 总记录数 */
    total: number;

    /** 当前页码 */
    page: number;

    /** 每页条数 */
    pageSize: number;

    /** 总页数 */
    totalPages: number;
}

export interface FieldFilterOptions<T> extends Omit<FindManyOptions<T>, "lock"> {
    /** 要排除的字段 */
    excludeFields?: string[];
    /** 事务管理器 */
    entityManager?: EntityManager;
    /** 锁配置 */
    lock?: LockOptions;
}

/**
 * DRY基础服务类
 *
 * 提供通用的CRUD操作和分页查询功能，可被其他服务继承使用
 * 泛型参数T代表实体类型，需要包含id属性
 * 针对PostgreSQL数据库进行了优化
 */
export class BaseService<T extends { id: string }> {
    @Inject(DataSource)
    protected readonly dataSource: DataSource;

    /** 日志记录器 */
    protected readonly logger: Logger;

    /**
     * 构造函数
     *
     * @param repository 实体仓库，用于数据库操作
     * @param dataSource 数据源，用于创建事务
     */
    constructor(protected readonly repository: Repository<T>) {
        // 自动获取子类的类名作为日志上下文
        const serviceName = this.constructor.name;
        this.logger = new Logger(serviceName);
    }

    /**
     * 使用PostgreSQL的ILike操作符进行不区分大小写的模糊搜索
     * @param field 字段名
     * @param value 搜索值
     * @returns 查询条件
     */
    protected ilike(field: keyof T, value: string): FindOptionsWhere<T> {
        const condition: Record<string, any> = {};
        condition[field as string] = ILike(`%${value}%`);
        return condition as FindOptionsWhere<T>;
    }

    /**
     * 使用PostgreSQL的全文搜索功能
     * @param field 字段名
     * @param value 搜索值
     * @returns 查询条件
     */
    protected textSearch(field: keyof T, value: string): FindOptionsWhere<T> {
        const condition: Record<string, any> = {};
        condition[field as string] = Raw(
            (alias) => `to_tsvector('simple', ${alias}) @@ to_tsquery('simple', :query)`,
            { query: value.split(" ").join(" & ") },
        );
        return condition as FindOptionsWhere<T>;
    }

    /**
     * 使用PostgreSQL的JSON查询功能
     * @param jsonField JSON字段名
     * @param path JSON路径
     * @param value 查询值
     * @returns 查询条件
     */
    protected jsonQuery(jsonField: keyof T, path: string, value: any): FindOptionsWhere<T> {
        const condition: Record<string, any> = {};
        condition[jsonField as string] = Raw((alias) => `${alias}->>'${path}' = :value`, {
            value: typeof value === "string" ? value : JSON.stringify(value),
        });
        return condition as FindOptionsWhere<T>;
    }

    /**
     * 使用PostgreSQL的数组包含查询
     * @param field 数组字段名
     * @param value 查询值
     * @returns 查询条件
     */
    protected arrayContains(field: keyof T, value: any): FindOptionsWhere<T> {
        const condition: Record<string, any> = {};
        condition[field as string] = Raw((alias) => `${alias} @> ARRAY[:...values]`, {
            values: Array.isArray(value) ? value : [value],
        });
        return condition as FindOptionsWhere<T>;
    }

    /**
     * 构建分页返回结果
     *
     * @param data 列表数据
     * @param total 总记录数
     * @param paginationDto 分页参数
     * @returns 标准分页结果对象
     */
    protected paginationResult(
        data: T[],
        total: number,
        paginationDto: PaginationDto,
    ): PaginationResult<T> {
        const totalPages = Math.ceil(total / paginationDto.pageSize);
        return {
            items: data,
            total,
            page: paginationDto.page,
            pageSize: paginationDto.pageSize,
            totalPages,
        };
    }

    /**
     * 分页查询（支持锁）
     *
     * @param paginationDto 分页参数，包含页码和每页条数
     * @param options 查询选项，可包含条件、排序、关联等
     * @returns 分页结果，包含数据列表和分页信息
     */
    async paginate(
        paginationDto: PaginationDto,
        options?: FieldFilterOptions<T>,
    ): Promise<PaginationResult<Partial<T>>> {
        const { page, pageSize } = paginationDto;
        const { excludeFields = [], entityManager, lock, ...findOptions } = options || {};

        // 使用事务管理器或仓库查询实体
        const repo = entityManager
            ? entityManager.getRepository(this.repository.target)
            : this.repository;

        // 构建查询选项并应用锁配置
        const paginationOptions: FindManyOptions<T> = {
            ...findOptions,
            skip: (page - 1) * pageSize,
            take: pageSize,
        };

        const lockedPaginationOptions = this.applyLockToFindOptions(paginationOptions, lock);
        const [data, total] = await repo.findAndCount(lockedPaginationOptions);

        const processedData = this.excludeField(data, excludeFields) as T[];

        return this.paginationResult(processedData, total, paginationDto);
    }

    /**
     * 高级分页查询，适用于高级&复杂的查询方法（支持锁）
     *
     * @param queryBuilder 查询构造器
     * @param paginationDto 分页参数，包含页码和每页条数
     * @param excludeFields 要排除的字段数组
     * @param lockOptions 锁配置
     * @returns 分页结果，包含数据列表和分页信息
     */
    async paginateQueryBuilder(
        queryBuilder: SelectQueryBuilder<T>,
        paginationDto: PaginationDto,
        excludeFields: string[] = [],
        lockOptions?: LockOptions,
    ): Promise<PaginationResult<T>> {
        const { page, pageSize } = paginationDto;

        // 应用锁配置到查询构造器
        if (lockOptions && lockOptions.type !== LockType.OPTIMISTIC) {
            const lockMode = this.getLockMode(lockOptions.type) as any;
            queryBuilder.setLock(lockMode, lockOptions.timeout);
        }

        const [data, total] = await queryBuilder
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();

        // 处理字段排除
        const processedData = this.excludeField(data, excludeFields) as T[];
        return this.paginationResult(processedData, total, paginationDto);
    }

    /**
     * 创建事务
     * @param isolationLevel 事务隔离级别（PostgreSQL特有）
     * @returns 查询运行器
     */
    protected async createTransaction(
        isolationLevel?: "READ UNCOMMITTED" | "READ COMMITTED" | "REPEATABLE READ" | "SERIALIZABLE",
    ): Promise<QueryRunner> {
        if (!this.dataSource) {
            throw new Error(
                "DataSource is not available. Make sure to inject it in the service constructor.",
            );
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();

        if (isolationLevel) {
            await queryRunner.startTransaction(isolationLevel);
        } else {
            // 默认使用 READ COMMITTED 隔离级别，这是PostgreSQL的默认级别
            await queryRunner.startTransaction("READ COMMITTED");
        }

        return queryRunner;
    }

    /**
     * 在事务中执行操作
     * @param callback 事务回调函数
     * @param isolationLevel 事务隔离级别（PostgreSQL特有）
     * @returns 回调函数的返回值
     */
    protected async withTransaction<R>(
        callback: (entityManager: EntityManager) => Promise<R>,
        isolationLevel?: "READ UNCOMMITTED" | "READ COMMITTED" | "REPEATABLE READ" | "SERIALIZABLE",
    ): Promise<R> {
        const queryRunner = await this.createTransaction(isolationLevel);

        try {
            const result = await callback(queryRunner.manager);
            await queryRunner.commitTransaction();
            return result;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * 带重试机制的操作执行
     * @param operation 要执行的操作
     * @param lockOptions 锁配置
     * @returns 操作结果
     */
    protected async withRetry<R>(
        operation: () => Promise<R>,
        lockOptions?: LockOptions,
    ): Promise<R> {
        const maxRetries = lockOptions?.retryCount ?? 3;
        const retryDelay = lockOptions?.retryDelay ?? 100;
        let lastError: Error;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;

                // 检查是否是可重试的错误
                if (this.isRetryableError(error) && attempt < maxRetries) {
                    this.logger.warn(`操作失败，第 ${attempt + 1} 次重试，错误: ${error.message}`);
                    await this.sleep(retryDelay * Math.pow(2, attempt)); // 指数退避
                    continue;
                }

                throw error;
            }
        }

        throw lastError;
    }

    /**
     * 检查错误是否可重试
     * @param error 错误对象
     * @returns 是否可重试
     */
    private isRetryableError(error: any): boolean {
        // 乐观锁版本冲突
        if (error instanceof OptimisticLockVersionMismatchError) {
            return true;
        }

        // PostgreSQL 锁超时或死锁
        if (error.code === "40001" || error.code === "40P01") {
            return true;
        }

        // 连接错误
        if (error.code === "ECONNRESET" || error.code === "ENOTFOUND") {
            return true;
        }

        return false;
    }

    /**
     * 延迟执行
     * @param ms 延迟毫秒数
     */
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * 应用锁配置到查询选项
     * @param options 查询选项
     * @param lockOptions 锁配置
     * @returns 应用锁后的查询选项
     */
    protected applyLockToFindOptions<T>(
        options: FindManyOptions<T>,
        lockOptions?: LockOptions,
    ): FindManyOptions<T> {
        if (!lockOptions || lockOptions.type === LockType.OPTIMISTIC) {
            return options;
        }

        const lockConfig: any = {
            mode: this.getLockMode(lockOptions.type),
        };

        if (lockOptions.timeout) {
            lockConfig.timeout = lockOptions.timeout;
        }

        return {
            ...options,
            lock: lockConfig,
        };
    }

    /**
     * 获取 TypeORM 锁模式
     * @param lockType 锁类型
     * @returns TypeORM 锁模式
     */
    private getLockMode(lockType: LockType): string {
        switch (lockType) {
            case LockType.PESSIMISTIC_READ:
                return "pessimistic_read";
            case LockType.PESSIMISTIC_WRITE:
                return "pessimistic_write";
            case LockType.PESSIMISTIC_PARTIAL_WRITE:
                return "pessimistic_partial_write";
            case LockType.PESSIMISTIC_WRITE_OR_FAIL:
                return "pessimistic_write_or_fail";
            default:
                return "pessimistic_write";
        }
    }

    /**
     * 检查实体是否支持乐观锁
     * @param entity 实体对象
     * @param versionField 版本字段名
     * @returns 是否支持乐观锁
     */
    protected hasOptimisticLock(entity: any, versionField: string = "version"): boolean {
        return entity && typeof entity[versionField] !== "undefined";
    }

    /**
     * 创建记录
     * @param dto 创建数据
     * @param options 选项配置
     * @returns 创建的实体
     */
    async create(dto: DeepPartial<T>, options?: FieldFilterOptions<T>): Promise<Partial<T>> {
        const { entityManager, excludeFields = [], lock } = options || {};

        const operation = async () => {
            const entity = this.repository.create(dto);

            // 使用事务管理器或仓库保存实体
            const repo = entityManager
                ? entityManager.getRepository(this.repository.target)
                : this.repository;
            const saved = await repo.save(entity);

            return this.excludeField(saved, excludeFields) as T;
        };

        try {
            return await this.withRetry(operation, lock);
        } catch (error) {
            this.logger.error(`创建记录失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.badRequest("Create failed.");
        }
    }

    /**
     * 批量创建记录
     *
     * 使用事务来提高PostgreSQL的批量插入性能
     *
     * @param dtos 创建实体的数据传输对象数组
     * @returns 创建成功的实体对象数组
     */
    async createMany(
        dtos: DeepPartial<T>[],
        options?: FieldFilterOptions<T>,
    ): Promise<Partial<T>[]> {
        if (!dtos.length) return [];

        const { excludeFields = [] } = options || {};

        // 使用事务来提高PostgreSQL的批量插入性能
        try {
            return await this.withTransaction(async (manager) => {
                const repo = manager.getRepository(this.repository.target);
                const entities = this.repository.create(dtos);

                // 使用单个查询批量插入，PostgreSQL会自动优化
                const saved = await repo.save(entities);

                return this.excludeField(saved, excludeFields) as T[];
            });
        } catch (error) {
            this.logger.error(`批量创建记录失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.badRequest("Batch create failed.");
        }
    }

    /**
     * 根据ID更新记录（支持乐观锁和悲观锁）
     *
     * @param id 记录ID
     * @param dto 更新的数据传输对象
     * @param options 选项配置
     * @returns 更新后的实体对象
     * @throws NotFoundException 当记录不存在时抛出
     */
    async updateById(
        id: string,
        dto: DeepPartial<T>,
        options?: FieldFilterOptions<T>,
    ): Promise<Partial<T>> {
        const { entityManager, excludeFields = [], lock } = options || {};

        const operation = async () => {
            return await this.withTransaction(async (manager) => {
                const repo = manager.getRepository(this.repository.target);

                // 构建查询选项，应用锁配置
                const findOptions: FindManyOptions<T> = {
                    where: { id } as FindOptionsWhere<T>,
                };

                const lockedFindOptions = this.applyLockToFindOptions(findOptions, lock);
                const entity = await repo.findOne(lockedFindOptions);

                if (!entity) {
                    throw HttpExceptionFactory.notFound(`No such record.`);
                }

                // 乐观锁版本检查
                if (lock?.type === LockType.OPTIMISTIC) {
                    const versionField = lock.versionField || "version";
                    if (
                        this.hasOptimisticLock(entity, versionField) &&
                        this.hasOptimisticLock(dto, versionField)
                    ) {
                        if ((entity as any)[versionField] !== (dto as any)[versionField]) {
                            throw new OptimisticLockVersionMismatchError(
                                this.repository.target as any,
                                (entity as any)[versionField],
                                (dto as any)[versionField],
                            );
                        }
                    }
                }

                // 合并并保存实体
                const merged = repo.merge(entity as T, dto);
                const saved = await repo.save(merged);

                return this.excludeField(saved, excludeFields) as T;
            });
        };

        try {
            return await this.withRetry(operation, lock);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            if (error instanceof OptimisticLockVersionMismatchError) {
                this.logger.warn(`乐观锁版本冲突: ${error.message}`);
                throw HttpExceptionFactory.badRequest(
                    "Record has been modified by another user. Please refresh and try again.",
                );
            }
            this.logger.error(`更新记录失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.badRequest("Update failed.");
        }
    }

    /**
     * 更新记录
     *
     * @param dto 更新的数据传输对象
     * @param options 更新选项
     * @returns 更新后的实体对象数组
     * @throws NotFoundException 当记录不存在时抛出
     */
    async update(
        dto: DeepPartial<T>,
        options?: FieldFilterOptions<T>,
    ): Promise<Partial<T> | Partial<T>[]> {
        // 使用事务管理器或仓库查询实体
        const { entityManager, excludeFields = [] } = options || {};
        const repo = entityManager
            ? entityManager.getRepository(this.repository.target)
            : this.repository;

        // 查询实体
        const findOptions = { ...options };
        delete findOptions.entityManager;

        try {
            // 查询所有符合条件的实体
            const entities = await this.findAll(findOptions);

            if (entities.length === 0) {
                throw HttpExceptionFactory.notFound("No records found with given criteria.");
            }

            // 合并并保存所有实体
            const mergedEntities = entities.map((entity) => repo.merge(entity as T, dto));
            const savedEntities = await repo.save(mergedEntities);

            // 排除指定字段
            const result = savedEntities.map((entity) =>
                this.excludeField(entity, excludeFields),
            ) as T[];

            if (result.length === 1) {
                return result[0];
            }
            return result;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`更新记录失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.badRequest("Update failed.");
        }
    }

    /**
     * 根据ID获取单条记录详情（支持锁）
     *
     * @param id 记录ID
     * @param options 选项配置
     * @returns 查询到的实体对象，如不存在则返回null
     */
    async findOneById(id: string, options?: FieldFilterOptions<T>): Promise<Partial<T>> {
        if (!id) {
            return null;
        }
        const {
            excludeFields = [],
            where = {},
            entityManager,
            lock,
            ...restOptions
        } = options || {};

        // 使用事务管理器或仓库查询实体
        const repo = entityManager
            ? entityManager.getRepository(this.repository.target)
            : this.repository;

        // 构建查询条件
        const whereCondition = { ...where } as FindOptionsWhere<T>;
        whereCondition.id = id as any;

        // 构建查询选项并应用锁配置
        const findOptions: FindManyOptions<T> = {
            ...restOptions,
            where: whereCondition,
        };

        const lockedFindOptions = this.applyLockToFindOptions(findOptions, lock);
        const entity = await repo.findOne(lockedFindOptions);

        return this.excludeField(entity, excludeFields) as T;
    }

    /**
     * 根据条件查询单条记录（支持锁）
     *
     * @param options 查询选项
     * @returns 查询到的实体对象，如不存在则返回null
     */
    async findOne(options?: FieldFilterOptions<T>): Promise<Partial<T> | null> {
        const {
            excludeFields = [],
            where = {},
            entityManager,
            lock,
            ...restOptions
        } = options || {};

        // 使用事务管理器或仓库查询实体
        const repo = entityManager
            ? entityManager.getRepository(this.repository.target)
            : this.repository;

        // 构建查询选项并应用锁配置
        const findOptions: FindManyOptions<T> = {
            ...restOptions,
            where: { ...where },
        };

        const lockedFindOptions = this.applyLockToFindOptions(findOptions, lock);
        const entity = await repo.findOne(lockedFindOptions);

        return this.excludeField(entity, excludeFields) as T;
    }

    /**
     * 删除记录
     *
     * 如果实体配置了软删除(@DeleteDateColumn)，则执行软删除
     * 否则执行物理删除
     *
     * @param id 记录ID
     * @throws NotFoundException 当记录不存在时抛出
     */
    async delete(id: string, options?: FieldFilterOptions<T>): Promise<void> {
        const { entityManager } = options || {};

        // 使用事务管理器或仓库查询实体
        const findOptions = { ...options };
        const entity = (await this.findOneById(id, findOptions)) as T;

        if (!entity) {
            throw HttpExceptionFactory.notFound("Record with given criteria not found.");
        }

        // 使用事务管理器或仓库删除实体
        const repo = entityManager
            ? entityManager.getRepository(this.repository.target)
            : this.repository;
        const metadata = repo.metadata;

        try {
            if (metadata.deleteDateColumn) {
                await repo.softRemove(entity);
            } else {
                await repo.remove(entity);
            }
        } catch (error) {
            this.logger.error(`删除记录失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.badRequest("Delete failed.");
        }
    }

    /**
     * 批量删除记录
     *
     * 如果实体配置了软删除(@DeleteDateColumn)，则执行软删除
     * 否则执行物理删除
     *
     * @param ids 记录ID数组（UUID格式）
     * @returns 删除的记录数量
     */
    async deleteMany(
        ids: string[],
        options?: FieldFilterOptions<T> & { strict?: boolean },
    ): Promise<number> {
        if (!Array.isArray(ids) || ids.length === 0) {
            return 0;
        }

        const { entityManager, strict = false } = options || {};

        const repo = entityManager
            ? entityManager.getRepository(this.repository.target)
            : this.repository;

        const metadata = repo.metadata;

        let entities: T[];
        try {
            entities = await repo.findBy({ id: In(ids) } as FindOptionsWhere<T>);
        } catch (error) {
            this.logger.error(`查询待删除记录失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.badRequest("Failed to query records for deletion.");
        }

        if (entities.length === 0) {
            if (strict) {
                throw HttpExceptionFactory.badRequest("All records not found.");
            }
            return 0;
        }

        if (strict && entities.length < ids.length) {
            const foundIds = entities.map((e: any) => e.id);
            const missingIds = ids.filter((id) => !foundIds.includes(id));
            this.logger.warn(`部分 ID 未找到: ${missingIds.join(", ")}`);
            throw HttpExceptionFactory.badRequest(
                `Some records not found: ${missingIds.join(", ")}`,
            );
        }

        try {
            const result = metadata.deleteDateColumn
                ? await repo.softRemove(entities)
                : await repo.remove(entities);
            return result.length;
        } catch (error) {
            this.logger.error(`批量删除记录失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.badRequest("Batch delete failed.");
        }
    }

    /**
     * 恢复软删除的数据
     *
     * @param id 记录ID
     * @throws BadRequestException 当实体不支持软删除时抛出
     */
    async restore(id: string, options?: FieldFilterOptions<T>): Promise<void> {
        const { entityManager } = options || {};

        // 使用事务管理器或仓库
        const repo = entityManager
            ? entityManager.getRepository(this.repository.target)
            : this.repository;
        const metadata = repo.metadata;

        if (!metadata.deleteDateColumn) {
            throw HttpExceptionFactory.badRequest("This entity does not support soft delete.");
        }

        try {
            await repo.restore(id);
        } catch (error) {
            this.logger.error(`恢复记录失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.badRequest("Restore failed.");
        }
    }

    /**
     * 查询所有记录（支持锁）
     *
     * @param options 查询选项，可包含条件、排序、关联等
     * @returns 查询到的实体对象数组
     */
    async findAll(options?: FieldFilterOptions<T>): Promise<T[]> {
        const { excludeFields = [], entityManager, lock, ...restOptions } = options || {};

        // 使用事务管理器或仓库查询实体
        const repo = entityManager
            ? entityManager.getRepository(this.repository.target)
            : this.repository;

        // 构建查询选项并应用锁配置
        const findOptions: FindManyOptions<T> = restOptions;
        const lockedFindOptions = this.applyLockToFindOptions(findOptions, lock);
        const entities = await repo.find(lockedFindOptions);

        // 类型断言确保返回类型是数组
        return this.excludeField(entities, excludeFields) as T[];
    }

    /**
     * 查询记录总数量
     *
     * @param options 查询选项，可包含条件等（不包含排序、分页等）
     * @returns 符合条件的记录总数
     */
    async count(options?: FieldFilterOptions<T>): Promise<number> {
        const { entityManager, lock, ...restOptions } = options || {};

        // 使用事务管理器或仓库查询实体
        const repo = entityManager
            ? entityManager.getRepository(this.repository.target)
            : this.repository;

        try {
            // count 操作通常不需要锁，但为了一致性保留接口
            return await repo.count(restOptions);
        } catch (error) {
            this.logger.error(`查询记录数量失败: ${error.message}`, error.stack);
            throw HttpExceptionFactory.badRequest("Count query failed.");
        }
    }

    /**
     * 排除字段
     *
     * @param data 数据
     * @param excludeFields 要排除的字段数组
     * @returns 排除字段后的数据
     */
    private excludeField = (data: T[] | T, excludeFields: string[]): T | T[] => {
        if (excludeFields.length === 0 || !data) return data;

        const deepDelete = (obj: any, path: string) => {
            const keys = path.split(".");
            const lastKey = keys.pop();

            let current = obj;
            for (const key of keys) {
                if (!current || typeof current !== "object") return;
                current = current[key];
            }

            if (current && typeof current === "object" && lastKey) {
                delete current[lastKey];
            }
        };

        const removeFields = (item: T): T => {
            const clone = { ...item };

            for (const field of excludeFields) {
                if (field.includes(".")) {
                    deepDelete(clone, field);
                } else {
                    delete clone[field as keyof T];
                }
            }

            return clone;
        };

        if (isArray(data)) {
            return data.map((item) => removeFields(item));
        } else {
            return removeFields(data);
        }
    };
}
