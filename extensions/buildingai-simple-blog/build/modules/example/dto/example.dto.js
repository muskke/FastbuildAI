'use strict';

var classValidator = require('class-validator');

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
class CreateExampleDto {
  static {
    __name(this, "CreateExampleDto");
  }
  message;
}
_ts_decorate([
  classValidator.IsString({
    message: "message must be a string"
  }),
  _ts_metadata("design:type", typeof message === "undefined" ? Object : message)
], CreateExampleDto.prototype, "message", void 0);
class UpdateExampleDto extends CreateExampleDto {
  static {
    __name(this, "UpdateExampleDto");
  }
}
class QueryExampleDto {
  static {
    __name(this, "QueryExampleDto");
  }
  message;
}
_ts_decorate([
  classValidator.IsOptional(),
  classValidator.IsString({
    message: "message must be a string"
  }),
  _ts_metadata("design:type", typeof message === "undefined" ? Object : message)
], QueryExampleDto.prototype, "message", void 0);

exports.CreateExampleDto = CreateExampleDto;
exports.QueryExampleDto = QueryExampleDto;
exports.UpdateExampleDto = UpdateExampleDto;
