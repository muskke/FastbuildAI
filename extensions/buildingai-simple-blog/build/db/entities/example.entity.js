'use strict';

var extensionEntity_decorator = require('@buildingai/core/decorators/extension-entity.decorator');
var typeorm = require('typeorm');

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
class Example {
  static {
    __name(this, "Example");
  }
  id;
  name;
}
_ts_decorate([
  typeorm.PrimaryGeneratedColumn("uuid"),
  _ts_metadata("design:type", String)
], Example.prototype, "id", void 0);
_ts_decorate([
  typeorm.Column(),
  _ts_metadata("design:type", String)
], Example.prototype, "name", void 0);
Example = _ts_decorate([
  extensionEntity_decorator.ExtensionEntity()
], Example);

exports.Example = Example;
