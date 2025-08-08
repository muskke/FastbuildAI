import { PartialType } from "@nestjs/mapped-types";

import { CreateColumnDto } from "./create-column.dto";

/**
 * 更新栏目DTO
 */
export class UpdateColumnDto extends PartialType(CreateColumnDto) {}
