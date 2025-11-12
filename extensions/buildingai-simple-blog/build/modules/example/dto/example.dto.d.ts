import { type message } from "../interfaces/example.interface";
export declare class CreateExampleDto {
    message: message;
}
export declare class UpdateExampleDto extends CreateExampleDto {
}
export declare class QueryExampleDto {
    message?: message;
}
