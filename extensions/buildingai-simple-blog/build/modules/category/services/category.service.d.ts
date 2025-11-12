import { BaseService } from "@buildingai/base";
import { Repository } from "@buildingai/db/typeorm";
import { Category } from "../../../db/entities/category.entity";
import { CreateCategoryDto, QueryCategoryDto, UpdateCategoryDto } from "../dto";
export declare class CategoryService extends BaseService<Category> {
    private readonly categoryRepository;
    constructor(categoryRepository: Repository<Category>);
    createCategory(createCategoryDto: CreateCategoryDto): Promise<Partial<Category>>;
    list(queryCategoryDto: QueryCategoryDto): Promise<Category[]>;
    updateCategoryById(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Partial<Category>>;
    incrementArticleCount(id: string, count?: number): Promise<void>;
    decrementArticleCount(id: string, count?: number): Promise<void>;
    batchDelete(ids: string[]): Promise<void>;
}
