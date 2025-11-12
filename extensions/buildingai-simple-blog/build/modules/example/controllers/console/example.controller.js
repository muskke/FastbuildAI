'use strict';

var decorators = require('@buildingai/core/decorators');
var common = require('@nestjs/common');
var example_service = require('../../services/example.service');

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
class ExampleConsoleController {
  static {
    __name(this, "ExampleConsoleController");
  }
  exampleService;
  constructor(exampleService) {
    this.exampleService = exampleService;
  }
  /**
   * Test Console API
   */
  async getHello() {
    const result = await this.exampleService.test();
    return result;
  }
}
_ts_decorate([
  common.Get(),
  _ts_metadata("design:type", Function),
  _ts_metadata("design:paramtypes", []),
  _ts_metadata("design:returntype", Promise)
], ExampleConsoleController.prototype, "getHello", null);
ExampleConsoleController = _ts_decorate([
  decorators.ExtensionConsoleController("hello", "Example"),
  _ts_metadata("design:type", Function),
  _ts_metadata("design:paramtypes", [
    typeof example_service.ExampleService === "undefined" ? Object : example_service.ExampleService
  ])
], ExampleConsoleController);

exports.ExampleConsoleController = ExampleConsoleController;
