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
import { BaseService } from "@buildingai/base";
import { InjectRepository } from "@buildingai/db/@nestjs/typeorm";
import { In, Like, Repository } from "@buildingai/db/typeorm";
import { HttpErrorFactory } from "@buildingai/errors";
import { Injectable } from "@nestjs/common";
import { Category } from "../../../db/entities/category.entity";
let CategoryService = class CategoryService extends BaseService {
    categoryRepository;
    constructor(categoryRepository) {
        super(categoryRepository);
        this.categoryRepository = categoryRepository;
    }
    async createCategory(createCategoryDto) {
        const existingCategory = await this.categoryRepository.findOne({
            where: {
                name: createCategoryDto.name,
            },
        });
        if (existingCategory) {
            throw HttpErrorFactory.badRequest("A category with the same name already exists");
        }
        const categoryData = {
            ...createCategoryDto,
            sort: createCategoryDto.sort ?? 0,
        };
        return super.create(categoryData);
    }
    async list(queryCategoryDto) {
        const { name } = queryCategoryDto;
        const where = {};
        if (name) {
            where.name = Like(`%${name}%`);
        }
        return this.categoryRepository.find({
            where,
            order: { sort: "DESC", createdAt: "DESC" },
        });
    }
    async updateCategoryById(id, updateCategoryDto) {
        const category = await this.categoryRepository.findOne({
            where: { id },
        });
        if (!category) {
            throw HttpErrorFactory.notFound(`Category ${id} does not exist`);
        }
        if (updateCategoryDto.name) {
            const existingCategory = await this.categoryRepository.findOne({
                where: {
                    name: updateCategoryDto.name,
                },
            });
            if (existingCategory && existingCategory.id !== id) {
                throw HttpErrorFactory.badRequest("A category with the same name already exists");
            }
        }
        return super.updateById(id, updateCategoryDto);
    }
    async incrementArticleCount(id, count = 1) {
        const category = await this.categoryRepository.findOne({
            where: { id },
        });
        if (!category) {
            throw HttpErrorFactory.notFound(`Category ${id} does not exist`);
        }
        category.incrementArticleCount(count);
        await this.categoryRepository.save(category);
    }
    async decrementArticleCount(id, count = 1) {
        const category = await this.categoryRepository.findOne({
            where: { id },
        });
        if (!category) {
            throw HttpErrorFactory.notFound(`Category ${id} does not exist`);
        }
        category.decrementArticleCount(count);
        await this.categoryRepository.save(category);
    }
    async batchDelete(ids) {
        const categories = await this.categoryRepository.find({
            where: { id: In(ids) },
        });
        const usedCategories = categories.filter((category) => category.hasArticles());
        if (usedCategories.length > 0) {
            throw HttpErrorFactory.badRequest(`Cannot delete, the following categories are in use: ${usedCategories
                .map((c) => c.name)
                .join(", ")}`);
        }
        await this.deleteMany(ids);
    }
};
CategoryService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Category)),
    __metadata("design:paramtypes", [Repository])
], CategoryService);
export { CategoryService };
//# sourceMappingURL=category.service.js.map