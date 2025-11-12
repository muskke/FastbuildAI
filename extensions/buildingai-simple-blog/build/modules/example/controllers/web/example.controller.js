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
import { ExtensionWebController } from "@buildingai/core/decorators";
import { InjectRepository } from "@buildingai/db/@nestjs/typeorm";
import { Repository } from "@buildingai/db/typeorm";
import { Playground } from "@buildingai/decorators/playground.decorator";
import { HttpErrorFactory } from "@buildingai/errors";
import { ExtensionBillingService } from "@buildingai/extension-sdk/modules/billing/extension-billing.service";
import { Get } from "@nestjs/common";
import { Example } from "../../../../db/entities/example.entity";
let ExampleWebController = class ExampleWebController {
    extensionBillingService;
    exampleRepository;
    constructor(extensionBillingService, exampleRepository) {
        this.extensionBillingService = extensionBillingService;
        this.exampleRepository = exampleRepository;
    }
    async getHello(user) {
        try {
            await this.exampleRepository.manager.transaction(async (entityManager) => {
                const result = await this.extensionBillingService.deductUserPower({
                    userId: user.id,
                    amount: 1,
                    remark: "测试一下子调用扣费",
                }, entityManager);
                return result;
            });
        }
        catch (error) {
            throw HttpErrorFactory.badRequest(`扣费失败，回滚操作: ${error.message}`);
        }
    }
};
__decorate([
    Get(),
    __param(0, Playground()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExampleWebController.prototype, "getHello", null);
ExampleWebController = __decorate([
    ExtensionWebController("hello"),
    __param(1, InjectRepository(Example)),
    __metadata("design:paramtypes", [ExtensionBillingService,
        Repository])
], ExampleWebController);
export { ExampleWebController };
//# sourceMappingURL=example.controller.js.map