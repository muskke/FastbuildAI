import { BaseController } from "@buildingai/base";
import { Category } from "../../../../db/entities/category.entity";
import { QueryCategoryDto } from "../../dto";
import { CategoryService } from "../../services/category.service";
export declare class CategoryWebController extends BaseController {
    private readonly categoryService;
    constructor(categoryService: CategoryService);
    findAll(queryCategoryDto: QueryCategoryDto): Promise<Category[]>;
    findOne(id: string): Promise<Category | null>;
}
