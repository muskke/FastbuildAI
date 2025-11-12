'use strict';

var typeorm = require('@buildingai/db/@nestjs/typeorm');
var extensionBilling_module = require('@buildingai/extension-sdk/modules/billing/extension-billing.module');
var common = require('@nestjs/common');
var example_entity = require('../../db/entities/example.entity');
var example_controller$1 = require('./controllers/console/example.controller');
var example_controller = require('./controllers/web/example.controller');
var example_service = require('./services/example.service');

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function _ts_decorate(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}
__name(_ts_decorate, "_ts_decorate");
class ExampleModule {
  static {
    __name(this, "ExampleModule");
  }
}
ExampleModule = _ts_decorate([
  common.Module({
    imports: [
      typeorm.TypeOrmModule.forFeature([
        example_entity.Example
      ]),
      extensionBilling_module.ExtensionBillingModule
    ],
    controllers: [
      example_controller.ExampleWebController,
      example_controller$1.ExampleConsoleController
    ],
    providers: [
      example_service.ExampleService
    ],
    exports: [
      ExampleModule
    ]
  })
], ExampleModule);

exports.ExampleModule = ExampleModule;
