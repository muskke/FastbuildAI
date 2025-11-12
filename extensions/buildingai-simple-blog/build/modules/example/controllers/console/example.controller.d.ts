import { ExampleService } from "../../services/example.service";
export declare class ExampleConsoleController {
    private readonly exampleService;
    constructor(exampleService: ExampleService);
    getHello(): Promise<{
        name: string;
    } & import("../../../../db/entities/example.entity").Example>;
}
