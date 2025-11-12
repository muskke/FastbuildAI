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
import { Playground } from "@buildingai/decorators/playground.decorator";
import { UUIDValidationPipe } from "@buildingai/pipe/param-validate.pipe";
import { Body, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { CreateArticleDto, QueryArticleDto, UpdateArticleDto } from "../../dto";
import { ArticleService } from "../../services/article.service";
let ArticleController = class ArticleController extends BaseController {
    articleService;
    constructor(articleService) {
        super();
        this.articleService = articleService;
    }
    async create(createArticleDto, user) {
        return this.articleService.createArticle(createArticleDto, user.id);
    }
    async findAll(queryArticleDto) {
        return this.articleService.list(queryArticleDto);
    }
    async findOne(id) {
        return this.articleService.findOneById(id);
    }
    async update(id, updateArticleDto) {
        return this.articleService.updateArticleById(id, updateArticleDto);
    }
    async remove(id) {
        const article = await this.articleService.findOneById(id);
        if (!article) {
            return {
                success: false,
                message: "Article does not exist",
            };
        }
        await this.articleService.delete(id);
        return {
            success: true,
            message: "Deleted successfully",
        };
    }
    async batchRemove(ids) {
        try {
            await this.articleService.batchDelete(ids);
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
    async publish(id) {
        try {
            await this.articleService.publish(id);
            return {
                success: true,
                message: "Published successfully",
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }
    async unpublish(id) {
        try {
            await this.articleService.unpublish(id);
            return {
                success: true,
                message: "Unpublished successfully",
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
    __param(1, Playground()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateArticleDto, Object]),
    __metadata("design:returntype", Promise)
], ArticleController.prototype, "create", null);
__decorate([
    Get(),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [QueryArticleDto]),
    __metadata("design:returntype", Promise)
], ArticleController.prototype, "findAll", null);
__decorate([
    Get(":id"),
    __param(0, Param("id", UUIDValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ArticleController.prototype, "findOne", null);
__decorate([
    Put(":id"),
    __param(0, Param("id", UUIDValidationPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateArticleDto]),
    __metadata("design:returntype", Promise)
], ArticleController.prototype, "update", null);
__decorate([
    Delete(":id"),
    __param(0, Param("id", UUIDValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ArticleController.prototype, "remove", null);
__decorate([
    Post("batch-delete"),
    __param(0, Body("ids")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], ArticleController.prototype, "batchRemove", null);
__decorate([
    Post(":id/publish"),
    __param(0, Param("id", UUIDValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ArticleController.prototype, "publish", null);
__decorate([
    Post(":id/unpublish"),
    __param(0, Param("id", UUIDValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ArticleController.prototype, "unpublish", null);
ArticleController = __decorate([
    ExtensionConsoleController("article", "Blog Article Management"),
    __metadata("design:paramtypes", [ArticleService])
], ArticleController);
export { ArticleController };
//# sourceMappingURL=article.controller.js.map