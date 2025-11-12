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
import { InjectRepository } from "@buildingai/db/@nestjs/typeorm";
import { Repository } from "@buildingai/db/typeorm";
import { Injectable } from "@nestjs/common";
import { Example } from "../../../db/entities/example.entity";
let ExampleService = class ExampleService {
    exampleRepository;
    constructor(exampleRepository) {
        this.exampleRepository = exampleRepository;
    }
    async test() {
        return await this.exampleRepository.save({
            name: "test",
        });
    }
};
ExampleService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Example)),
    __metadata("design:paramtypes", [Repository])
], ExampleService);
export { ExampleService };
//# sourceMappingURL=example.service.js.map