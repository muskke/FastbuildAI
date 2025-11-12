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
import { ExtensionWebController } from "@buildingai/core/decorators/extension-controller.decorator";
import { UUIDValidationPipe } from "@buildingai/pipe/param-validate.pipe";
import { Get, Param, Query } from "@nestjs/common";
import { QueryCategoryDto } from "../../dto";
import { CategoryService } from "../../services/category.service";
let CategoryWebController = class CategoryWebController extends BaseController {
    categoryService;
    constructor(categoryService) {
        super();
        this.categoryService = categoryService;
    }
    async findAll(queryCategoryDto) {
        return this.categoryService.list(queryCategoryDto);
    }
    async findOne(id) {
        return this.categoryService.findOneById(id);
    }
};
__decorate([
    Get(),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [QueryCategoryDto]),
    __metadata("design:returntype", Promise)
], CategoryWebController.prototype, "findAll", null);
__decorate([
    Get(":id"),
    __param(0, Param("id", UUIDValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CategoryWebController.prototype, "findOne", null);
CategoryWebController = __decorate([
    ExtensionWebController("category"),
    __metadata("design:paramtypes", [CategoryService])
], CategoryWebController);
export { CategoryWebController };
//# sourceMappingURL=category.web.controller.js.map