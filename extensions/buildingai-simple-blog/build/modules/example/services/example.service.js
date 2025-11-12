'use strict';

var typeorm = require('@buildingai/db/@nestjs/typeorm');
var typeorm$1 = require('@buildingai/db/typeorm');
var common = require('@nestjs/common');
var example_entity = require('../../../db/entities/example.entity');

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
class ExampleService {
  static {
    __name(this, "ExampleService");
  }
  exampleRepository;
  constructor(exampleRepository) {
    this.exampleRepository = exampleRepository;
  }
  /**
   * example service
   * @param ExampleDto example dto
   */
  async test() {
    return await this.exampleRepository.save({
      name: "test"
    });
  }
}
ExampleService = _ts_decorate([
  common.Injectable(),
  _ts_param(0, typeorm.InjectRepository(example_entity.Example)),
  _ts_metadata("design:type", Function),
  _ts_metadata("design:paramtypes", [
    typeof typeorm$1.Repository === "undefined" ? Object : typeorm$1.Repository
  ])
], ExampleService);

exports.ExampleService = ExampleService;
