import type { UserPlayground } from "@buildingai/db/interfaces/context.interface";
import { Repository } from "@buildingai/db/typeorm";
import { ExtensionBillingService } from "@buildingai/extension-sdk/modules/billing/extension-billing.service";
import { Example } from "../../../../db/entities/example.entity";
export declare class ExampleWebController {
    private readonly extensionBillingService;
    private readonly exampleRepository;
    constructor(extensionBillingService: ExtensionBillingService, exampleRepository: Repository<Example>);
    getHello(user: UserPlayground): Promise<void>;
}
