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
import { PublicUserService } from "@buildingai/extension-sdk/services/user.service";
import { buildWhere } from "@buildingai/utils";
import { Injectable } from "@nestjs/common";
import { Article, ArticleStatus } from "../../../db/entities/article.entity";
import { CategoryService } from "../../category/services/category.service";
let ArticleService = class ArticleService extends BaseService {
    articleRepository;
    categoryService;
    userService;
    constructor(articleRepository, categoryService, userService) {
        super(articleRepository);
        this.articleRepository = articleRepository;
        this.categoryService = categoryService;
        this.userService = userService;
    }
    formatArticleAuthor(article) {
        if (!article.author) {
            return {
                ...article,
                author: {
                    id: null,
                    nickname: "佚名",
                    avatar: null,
                },
            };
        }
        return article;
    }
    formatArticleListAuthors(articles) {
        return articles.map((article) => this.formatArticleAuthor(article));
    }
    async createArticle(createArticleDto, authorId) {
        if (createArticleDto.categoryId) {
            const category = await this.categoryService.findOneById(createArticleDto.categoryId);
            if (!category) {
                throw HttpErrorFactory.badRequest("Category does not exist");
            }
        }
        const author = await this.userService.findUserById(authorId);
        if (!author) {
            throw HttpErrorFactory.notFound("Author not found");
        }
        const articleData = {
            ...createArticleDto,
            status: createArticleDto.status ?? ArticleStatus.DRAFT,
            sort: createArticleDto.sort ?? 0,
            viewCount: 0,
            author,
        };
        if (articleData.status === ArticleStatus.PUBLISHED) {
            articleData.publishedAt = new Date();
        }
        const article = await super.create(articleData, {
            includeFields: ["author.id", "author.avatar", "author.nickname"],
        });
        if (createArticleDto.categoryId) {
            await this.categoryService.incrementArticleCount(createArticleDto.categoryId);
        }
        return article;
    }
    async list(queryArticleDto) {
        const { title, status, categoryId } = queryArticleDto;
        const where = buildWhere({
            title: title ? Like(`%${title}%`) : undefined,
            status,
            categoryId,
        });
        const result = await this.paginate(queryArticleDto, {
            where,
            relations: ["category", "author"],
            order: { sort: "DESC", createdAt: "DESC" },
            select: {
                author: {
                    id: true,
                    avatar: true,
                    nickname: true,
                },
            },
        });
        result.items = this.formatArticleListAuthors(result.items);
        return result;
    }
    async findArticleById(id) {
        const article = await this.articleRepository.findOne({
            where: { id },
            relations: ["category", "author"],
            select: {
                author: {
                    id: true,
                    avatar: true,
                    nickname: true,
                },
            },
        });
        if (!article) {
            return null;
        }
        return this.formatArticleAuthor(article);
    }
    async updateArticleById(id, updateArticleDto) {
        const article = await this.articleRepository.findOne({
            where: { id },
        });
        if (!article) {
            throw HttpErrorFactory.notFound(`Article ${id} does not exist`);
        }
        const oldCategoryId = article.categoryId;
        const newCategoryId = updateArticleDto.categoryId;
        if (newCategoryId && newCategoryId !== oldCategoryId) {
            const category = await this.categoryService.findOneById(newCategoryId);
            if (!category) {
                throw HttpErrorFactory.badRequest("Category does not exist");
            }
        }
        const oldStatus = article.status;
        const newStatus = updateArticleDto.status;
        if (newStatus && newStatus !== oldStatus) {
            if (newStatus === ArticleStatus.PUBLISHED && !article.publishedAt) {
                updateArticleDto["publishedAt"] = new Date();
            }
        }
        const updatedArticle = await super.updateById(id, updateArticleDto);
        if (newCategoryId !== undefined && newCategoryId !== oldCategoryId) {
            if (oldCategoryId) {
                await this.categoryService.decrementArticleCount(oldCategoryId);
            }
            if (newCategoryId) {
                await this.categoryService.incrementArticleCount(newCategoryId);
            }
        }
        return updatedArticle;
    }
    async delete(id) {
        const article = await this.articleRepository.findOne({
            where: { id },
        });
        if (!article) {
            throw HttpErrorFactory.notFound(`Article ${id} does not exist`);
        }
        if (article.categoryId) {
            await this.categoryService.decrementArticleCount(article.categoryId);
        }
        await super.delete(id);
    }
    async batchDelete(ids) {
        const articles = await this.articleRepository.find({
            where: { id: In(ids) },
        });
        const categoryCountMap = new Map();
        for (const article of articles) {
            if (article.categoryId) {
                const count = categoryCountMap.get(article.categoryId) || 0;
                categoryCountMap.set(article.categoryId, count + 1);
            }
        }
        for (const [categoryId, count] of categoryCountMap.entries()) {
            await this.categoryService.decrementArticleCount(categoryId, count);
        }
        await this.deleteMany(ids);
    }
    async publish(id) {
        const article = await this.articleRepository.findOne({
            where: { id },
        });
        if (!article) {
            throw HttpErrorFactory.notFound(`Article ${id} does not exist`);
        }
        article.publish();
        await this.articleRepository.save(article);
        return article;
    }
    async unpublish(id) {
        const article = await this.articleRepository.findOne({
            where: { id },
        });
        if (!article) {
            throw HttpErrorFactory.notFound(`Article ${id} does not exist`);
        }
        article.unpublish();
        await this.articleRepository.save(article);
        return article;
    }
    async incrementViewCount(id) {
        const article = await this.articleRepository.findOne({
            where: { id },
        });
        if (!article) {
            throw HttpErrorFactory.notFound(`Article ${id} does not exist`);
        }
        article.incrementViewCount();
        await this.articleRepository.save(article);
    }
    async getPublishedArticles(categoryId) {
        const where = {
            status: ArticleStatus.PUBLISHED,
        };
        if (categoryId) {
            where.categoryId = categoryId;
        }
        const articles = await this.articleRepository.find({
            where,
            relations: ["category", "author"],
            order: { publishedAt: "DESC", sort: "DESC" },
            select: {
                author: {
                    id: true,
                    avatar: true,
                    nickname: true,
                },
            },
        });
        return this.formatArticleListAuthors(articles);
    }
};
ArticleService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Article)),
    __metadata("design:paramtypes", [Repository,
        CategoryService,
        PublicUserService])
], ArticleService);
export { ArticleService };
//# sourceMappingURL=article.service.js.map