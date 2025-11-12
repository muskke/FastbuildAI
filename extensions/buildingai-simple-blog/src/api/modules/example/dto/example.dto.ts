import { IsOptional, IsString } from "class-validator";

import { type message } from "../interfaces/example.interface";

export class CreateExampleDto {
    @IsString({ message: "message must be a string" })
    message: message;
}

export class UpdateExampleDto extends CreateExampleDto {}

export class QueryExampleDto {
    @IsOptional()
    @IsString({ message: "message must be a string" })
    message?: message;
}
