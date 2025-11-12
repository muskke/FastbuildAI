import { Repository } from "@buildingai/db/typeorm";
import { Example } from "../../../db/entities/example.entity";
export declare class ExampleService {
    private readonly exampleRepository;
    constructor(exampleRepository: Repository<Example>);
    test(): Promise<{
        name: string;
    } & Example>;
}
