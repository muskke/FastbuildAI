'use strict';

var decorators = require('@buildingai/core/decorators');
var typeorm = require('@buildingai/db/@nestjs/typeorm');
var typeorm$1 = require('@buildingai/db/typeorm');
var playground_decorator = require('@buildingai/decorators/playground.decorator');
var errors = require('@buildingai/errors');
var extensionBilling_service = require('@buildingai/extension-sdk/modules/billing/extension-billing.service');
var common = require('@nestjs/common');
var example_entity = require('../../../../db/entities/example.entity');

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function _ts_decorate(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}
__name(_ts_decorate, "_ts_decorate");
function _ts_metadata(k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
__name(_ts_metadata, "_ts_metadata");
function _ts_param(paramIndex, decorator) {
  return function(target, key) {
    decorator(target, key, paramIndex);
  };
}
__name(_ts_param, "_ts_param");
class ExampleWebController {
  static {
    __name(this, "ExampleWebController");
  }
  extensionBillingService;
  exampleRepository;
  constructor(extensionBillingService, exampleRepository) {
    this.extensionBillingService = extensionBillingService;
    this.exampleRepository = exampleRepository;
  }
  /**
   * Test Web API with billing
   */
  async getHello(user) {
    try {
      await this.exampleRepository.manager.transaction(async (entityManager) => {
        const result = await this.extensionBillingService.deductUserPower({
          userId: user.id,
          amount: 1,
          remark: "\u6D4B\u8BD5\u4E00\u4E0B\u5B50\u8C03\u7528\u6263\u8D39"
        }, entityManager);
        return result;
      });
    } catch (error) {
      throw errors.HttpErrorFactory.badRequest(`\u6263\u8D39\u5931\u8D25\uFF0C\u56DE\u6EDA\u64CD\u4F5C: ${error.message}`);
    }
  }
}
_ts_decorate([
  common.Get(),
  _ts_param(0, playground_decorator.Playground()),
  _ts_metadata("design:type", Function),
  _ts_metadata("design:paramtypes", [
    typeof UserPlayground === "undefined" ? Object : UserPlayground
  ]),
  _ts_metadata("design:returntype", Promise)
], ExampleWebController.prototype, "getHello", null);
ExampleWebController = _ts_decorate([
  decorators.ExtensionWebController("hello"),
  _ts_param(1, typeorm.InjectRepository(example_entity.Example)),
  _ts_metadata("design:type", Function),
  _ts_metadata("design:paramtypes", [
    typeof extensionBilling_service.ExtensionBillingService === "undefined" ? Object : extensionBilling_service.ExtensionBillingService,
    typeof typeorm$1.Repository === "undefined" ? Object : typeorm$1.Repository
  ])
], ExampleWebController);

exports.ExampleWebController = ExampleWebController;
