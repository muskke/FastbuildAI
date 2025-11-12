import { BaseController } from "@buildingai/base";
import { Category } from "../../../../db/entities/category.entity";
import { CreateCategoryDto, QueryCategoryDto, UpdateCategoryDto } from "../../dto";
import { CategoryService } from "../../services/category.service";
export declare class CategoryController extends BaseController {
    private readonly categoryService;
    constructor(categoryService: CategoryService);
    create(createCategoryDto: CreateCategoryDto): Promise<Partial<Category>>;
    findAll(queryCategoryDto: QueryCategoryDto): Promise<Category[]>;
    findOne(id: string): Promise<Category | null>;
    update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Partial<Category>>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    batchRemove(ids: string[]): Promise<{
        success: boolean;
        message: any;
    }>;
}
