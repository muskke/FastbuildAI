import { Logger } from "@nestjs/common";
export class Upgrade {
    dataSource;
    logger = new Logger(Upgrade.name);
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async execute() {
        this.logger.log("Starting upgrade to version 0.0.2");
        await this.queryUserData();
        this.logger.log("Upgrade to version 0.0.2 completed");
    }
    async queryUserData() {
        this.logger.log("Querying user table data...");
        const users = await this.dataSource.query(`
            SELECT id, username, nickname, email, created_at 
            FROM "user" 
            LIMIT 10
        `);
        console.log(`Found ${users.length} users`);
        users.forEach((user) => {
            console.log(`User: ${user.username} (${user.nickname})`);
        });
        console.log("User data query completed");
    }
}
//# sourceMappingURL=index.js.map