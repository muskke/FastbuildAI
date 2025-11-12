var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { TypeOrmModule } from "@buildingai/db/@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { Category } from "../../db/entities/category.entity";
import { CategoryController } from "./controllers/console/category.controller";
import { CategoryWebController } from "./controllers/web/category.web.controller";
import { CategoryService } from "./services/category.service";
let CategoryModule = class CategoryModule {
};
CategoryModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([Category])],
        controllers: [CategoryController, CategoryWebController],
        providers: [CategoryService],
        exports: [CategoryService],
    })
], CategoryModule);
export { CategoryModule };
//# sourceMappingURL=category.module.js.map