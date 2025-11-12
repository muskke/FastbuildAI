var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { BaseController } from "@buildingai/base";
import { ExtensionConsoleController } from "@buildingai/core/decorators/extension-controller.decorator";
import { UUIDValidationPipe } from "@buildingai/pipe/param-validate.pipe";
import { Body, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { CreateCategoryDto, QueryCategoryDto, UpdateCategoryDto } from "../../dto";
import { CategoryService } from "../../services/category.service";
let CategoryController = class CategoryController extends BaseController {
    categoryService;
    constructor(categoryService) {
        super();
        this.categoryService = categoryService;
    }
    async create(createCategoryDto) {
        return this.categoryService.createCategory(createCategoryDto);
    }
    async findAll(queryCategoryDto) {
        return this.categoryService.list(queryCategoryDto);
    }
    async findOne(id) {
        return this.categoryService.findOneById(id);
    }
    async update(id, updateCategoryDto) {
        return this.categoryService.updateCategoryById(id, updateCategoryDto);
    }
    async remove(id) {
        const category = await this.categoryService.findOneById(id);
        if (!category) {
            return {
                success: false,
                message: "Category does not exist",
            };
        }
        if (category.articleCount > 0) {
            return {
                success: false,
                message: "This category is in use and cannot be deleted",
            };
        }
        await this.categoryService.delete(id);
        return {
            success: true,
            message: "Deleted successfully",
        };
    }
    async batchRemove(ids) {
        try {
            await this.categoryService.batchDelete(ids);
            return {
                success: true,
                message: "Batch deletion succeeded",
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }
};
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateCategoryDto]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "create", null);
__decorate([
    Get(),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [QueryCategoryDto]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "findAll", null);
__decorate([
    Get(":id"),
    __param(0, Param("id", UUIDValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "findOne", null);
__decorate([
    Put(":id"),
    __param(0, Param("id", UUIDValidationPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateCategoryDto]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "update", null);
__decorate([
    Delete(":id"),
    __param(0, Param("id", UUIDValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "remove", null);
__decorate([
    Post("batch-delete"),
    __param(0, Body("ids")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "batchRemove", null);
CategoryController = __decorate([
    ExtensionConsoleController("category", "Blog Category Management"),
    __metadata("design:paramtypes", [CategoryService])
], CategoryController);
export { CategoryController };
//# sourceMappingURL=category.controller.js.map