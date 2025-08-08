import { BooleanNumber, UserCreateSource } from "@common/constants/status-codes.constant";
import { User } from "@common/modules/auth/entities/user.entity";
import { DictService } from "@common/modules/dict/services/dict.service";
import { generateNo } from "@common/utils/helper.util";
import { isEnabled } from "@common/utils/is.util";
import { TerminalLogger } from "@common/utils/log.util";
import { PageService } from "@modules/console/decorate/services/page.service";
import { Payconfig } from "@modules/console/system/entities/payconfig.entity";
import {
    Merchant,
    PayConfigPayType,
    PayVersion,
} from "@modules/console/system/inerface/payconfig.constant";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcryptjs from "bcryptjs";
import fse from "fs-extra";
import * as path from "path";
import { DataSource, Repository } from "typeorm";

import { AiModel } from "@/modules/console/ai/entities/ai-model.entity";
import { AiProvider } from "@/modules/console/ai/entities/ai-provider.entity";
import { Menu } from "@/modules/console/menu/entities/menu.entity";
import { PermissionService } from "@/modules/console/permission/permission.service";

/**
 * 数据库初始化服务
 *
 * 在应用启动时自动检查并初始化必要的数据
 */
@Injectable()
export class DatabaseInitService implements OnModuleInit {
    private readonly logger = new Logger(DatabaseInitService.name);

    /**
     * 构造函数
     *
     * @param userRepository 用户仓库
     * @param menuRepository 菜单仓库
     * @param permissionService 权限服务
     */
    constructor(
        private readonly dataSource: DataSource,
        private readonly permissionService: PermissionService,
        private readonly dictService: DictService,
        private readonly pageService: PageService,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Menu)
        private readonly menuRepository: Repository<Menu>,
        @InjectRepository(Payconfig)
        private readonly payConfigRepository: Repository<Payconfig>,
        @InjectRepository(AiProvider)
        private readonly aiProviderRepository: Repository<AiProvider>,
        @InjectRepository(AiModel)
        private readonly aiModelRepository: Repository<AiModel>,
    ) {}

    /**
     * 模块初始化时自动执行
     */
    async onModuleInit() {
        this.logger.log("开始检查数据库初始化状态...");

        try {
            // 扫描所有控制器
            this.permissionService.scanControllers();

            // 检查系统是否已安装
            const isInstalled = await this.checkSystemInstalled();

            if (isInstalled) {
                this.logger.log("✅ 系统已安装，跳过初始化步骤");
                return;
            }

            this.logger.log("🚀 开始执行系统初始化...");
            TerminalLogger.log("Database Init", "🚀 开始执行系统初始化...");

            await this.initPgvectorExtension();
            await this.initUsers();
            await this.syncPermissions();
            await this.initMenus();
            await this.initHomeMenus();
            await this.initPayConfig();

            // 初始化 AI 提供商和模型
            await this.initAiProviders();

            // 新增：自动执行自定义 SQL
            await this.initZhparserAndIndex();

            // 标记系统为已安装
            await this.markSystemAsInstalled();

            this.logger.log("✅ 数据库初始化完成");
            TerminalLogger.success("Database Init", "数据库初始化完成");
        } catch (error) {
            this.logger.error(`❌ 数据库初始化失败: ${error.message}`);
        }
    }

    private async initHomeMenus() {
        try {
            const menus = {
                menus: [
                    {
                        id: `menu_${Date.now()}`,
                        icon: "i-lucide-message-square-quote",
                        link: { name: "首页", path: "/", type: "system", query: {} },
                        title: "对话",
                    },
                ],
                layout: "layout-5",
            };

            await this.pageService.create({
                name: "web",
                data: menus,
            });
        } catch (e) {
            this.logger.error("❌ 前台菜单初始化失败: " + e.message);
        }
    }

    /**
     * 自动初始化 pgvector 扩展
     *
     * 确保当前数据库已安装 vector 类型，避免因缺失导致相关 SQL 报错
     */
    private async initPgvectorExtension() {
        if (this.dataSource.options.type !== "postgres") return;
        try {
            // 安装 pgvector 扩展，若已存在则跳过
            await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
            this.logger.log("✅ pgvector 扩展已初始化");
        } catch (e) {
            this.logger.error("❌ pgvector 扩展初始化失败: " + e.message);
        }
    }

    /**
     * 初始化用户数据
     */
    private async initUsers(): Promise<void> {
        this.logger.log("开始创建超级管理员账号...");
        TerminalLogger.info("", "正在创建超级管理员初始账号...");

        // 创建超级管理员账号
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash("FastbuildAI&123456", salt);

        const users: Partial<User>[] = [
            {
                username: "admin",
                password: hashedPassword,
                nickname: "超级管理员",
                email: "admin@example.com",
                status: 1,
                userNo: await generateNo(this.userRepository, "userNo"),
                avatar: `/static/avatars/${Math.floor(Math.random() * 36) + 1}.png`,
                isRoot: BooleanNumber.YES,
                source: UserCreateSource.CONSOLE,
                power: 0,
            },
        ];

        // 使用 upsert 逻辑避免重复插入
        for (const userData of users) {
            try {
                const existingUser = await this.userRepository.findOne({
                    where: { username: userData.username },
                });

                if (!existingUser) {
                    await this.userRepository.save(userData);
                    this.logger.log(`✅ 创建用户: ${userData.username}`);
                } else {
                    this.logger.log(`ℹ️ 用户已存在: ${userData.username}`);
                }
            } catch (error) {
                this.logger.warn(`⚠️ 创建用户 ${userData.username} 失败: ${error.message}`);
            }
        }

        TerminalLogger.success(
            "",
            "超级管理员账号已创建: admin/FastbuildAI&123456，请及时修改密码",
        );
        this.logger.log("✅ 用户初始化完成");
    }

    /**
     * 同步权限数据
     */
    private async syncPermissions(): Promise<void> {
        // this.permissionService.scanControllers();
        this.logger.log("开始同步权限数据...");
        TerminalLogger.log("", "开始同步权限数据...");

        try {
            const result = await this.permissionService.syncApiPermissions();
            TerminalLogger.success(
                "权限数据同步完成",
                `新增 ${result.added} 个, 更新 ${result.updated} 个, 废弃 ${result.deprecated} 个`,
            );
            this.logger.log("✅ 权限数据同步完成");
        } catch (error) {
            TerminalLogger.error("权限数据同步失败", error.message);
            this.logger.error(`权限数据同步失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 初始化菜单数据
     */
    private async initMenus(): Promise<void> {
        this.logger.log("开始创建初始菜单...");
        TerminalLogger.log("", "开始创建初始菜单...");

        try {
            // 从 JSON 文件读取菜单数据
            // 检查多个可能的路径
            let menuFilePath: string;
            const possiblePaths = [
                path.join(process.cwd(), "src/core/database/install/menu.json"), // 在 apps/server 目录下运行
                path.join(process.cwd(), "apps/server/src/core/database/install/menu.json"), // 在项目根目录下运行
                path.join(__dirname, "install/menu.json"), // 编译后的路径
            ];

            for (const possiblePath of possiblePaths) {
                if (await fse.pathExists(possiblePath)) {
                    menuFilePath = possiblePath;
                    break;
                }
            }

            if (!menuFilePath) {
                throw new Error("无法找到 menu.json 文件");
            }

            const initialMenus = await fse.readJson(menuFilePath);

            // 使用递归方式保存树形菜单数据
            await this.saveMenuTree(initialMenus);

            TerminalLogger.success("", "初始菜单数据已创建");
            this.logger.log("✅ 初始菜单数据已创建");
        } catch (error) {
            TerminalLogger.error("", `菜单数据初始化失败: ${error.message}`);
            this.logger.error(`菜单数据初始化失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 初始化支付配置数据
     */
    private async initPayConfig(): Promise<void> {
        this.logger.log("开始创建初始支付配置...");
        TerminalLogger.log("", "开始创建初始支付配置...");

        try {
            await this.payConfigRepository.save([
                {
                    name: "微信支付",
                    payType: PayConfigPayType.WECHAT,
                    isEnable: BooleanNumber.YES,
                    isDefault: BooleanNumber.YES,
                    logo: "/static/images/wxpay.png",
                    sort: 0,
                    payVersion: PayVersion.V3,
                    merchantType: Merchant.ORDINARY,
                },
            ]);
            TerminalLogger.success("", "初始支付配置数据已创建");
            this.logger.log("✅ 初始支付配置数据已创建");
        } catch (error) {
            TerminalLogger.error("", `支付配置数据初始化失败: ${error.message}`);
        }
    }

    /**
     * 递归保存菜单树
     *
     * @param menuItems 菜单项数组
     * @param parentId 父级菜单ID
     */
    private async saveMenuTree(menuItems: any[], parentId: string | null = null): Promise<void> {
        for (const menuItem of menuItems) {
            // 提取子菜单
            const { children, ...menuData } = menuItem;

            // 设置父级ID
            menuData.parentId = parentId;

            // 处理权限编码：空字符串转换为null
            if (menuData.permissionCode === "" || menuData.permissionCode === undefined) {
                menuData.permissionCode = null;
            }

            // 检查权限编码是否存在
            if (menuData.permissionCode) {
                try {
                    // 尝试查询权限编码是否存在
                    const permissionExists = await this.permissionService.findByCodeSafe(
                        menuData.permissionCode,
                    );

                    if (!permissionExists) {
                        // 如果权限编码不存在，则设置为 null
                        TerminalLogger.warn(
                            "",
                            `权限编码 ${menuData.permissionCode} 不存在，已设置为 null`,
                        );
                        menuData.permissionCode = null;
                    }
                } catch (error) {
                    // 查询失败时，安全起见设置为 null
                    TerminalLogger.error("", `检查权限编码失败: ${error.message}`);
                    menuData.permissionCode = null;
                }
            }

            // 处理插件标识：空字符串转换为null
            if (menuData.pluginPackName === "" || menuData.pluginPackName === undefined) {
                menuData.pluginPackName = null;
            }

            // 保存当前菜单项
            const savedMenu = await this.menuRepository.save(menuData);

            // 如果有子菜单，递归保存
            if (children && children.length > 0) {
                await this.saveMenuTree(children, savedMenu.id);
            }
        }
    }

    // 新增方法：自动初始化 zhparser 分词配置和全文索引
    private async initZhparserAndIndex() {
        if (this.dataSource.options.type !== "postgres") return;

        try {
            // 自动初始化 zhparser 扩展
            await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS zhparser;`);
            await this.dataSource.query(`
                DO $$
                BEGIN
                  IF NOT EXISTS (
                    SELECT 1 FROM pg_ts_config WHERE cfgname = 'chinese_zh'
                  ) THEN
                    CREATE TEXT SEARCH CONFIGURATION chinese_zh (PARSER = zhparser);
                    ALTER TEXT SEARCH CONFIGURATION chinese_zh ADD MAPPING FOR n,v,a,i,e,l,j,o,u WITH simple;
                  END IF;
                END $$;
            `);
            await this.dataSource.query(`
                DO $$
                BEGIN
                  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'datasets_segments') THEN
                    IF NOT EXISTS (
                      SELECT 1 FROM pg_indexes WHERE indexname = 'idx_segments_content_zh'
                    ) THEN
                      CREATE INDEX idx_segments_content_zh ON datasets_segments USING GIN (to_tsvector('chinese_zh', content));
                    END IF;
                  END IF;
                END $$;
            `);
            this.logger.log("✅ zhparser 分词配置和全文索引已初始化");
        } catch (e) {
            this.logger.error("❌ zhparser 分词配置/索引初始化失败: " + e.message);
        }
    }

    /**
     * 初始化 AI 提供商和模型数据
     *
     * 从本地配置文件中读取供应商和模型信息，并同步到数据库
     */
    private async initAiProviders(): Promise<void> {
        this.logger.log("开始初始化 AI 提供商和模型数据...");

        try {
            // 从本地配置文件获取模型配置
            const modelConfigPath = this.getConfigFilePath("model-config.json");
            if (!modelConfigPath) {
                throw new Error("无法找到 model-config.json 文件");
            }

            // 读取配置文件
            const modelConfigData = await fse.readJson(modelConfigPath);
            if (!modelConfigData || !Array.isArray(modelConfigData.configs)) {
                throw new Error("model-config.json 格式不正确，缺少 configs 数组");
            }

            const providerConfigs = modelConfigData.configs;
            const results = [];

            this.logger.log(`从配置文件中读取到 ${providerConfigs.length} 个提供商配置`);

            // 遍历每个供应商配置
            for (const config of providerConfigs) {
                // 查找是否已存在该供应商
                let provider = await this.aiProviderRepository.findOne({
                    where: { provider: config.provider },
                });

                // 准备供应商数据
                const providerData = {
                    provider: config.provider,
                    name: config.label,
                    iconUrl: config.icon_url,
                    isBuiltIn: true,
                    isActive: false,
                    supportedModelTypes: config.supported_model_types,
                    sortOrder: 0,
                };

                // 如果不存在，则创建新供应商
                if (!provider) {
                    provider = await this.aiProviderRepository.save(providerData);
                    this.logger.log(`创建 AI 提供商: ${provider.name}`);
                }
                // 如果存在，则更新供应商信息
                else {
                    await this.aiProviderRepository.update(provider.id, providerData);
                    provider = await this.aiProviderRepository.findOne({
                        where: { id: provider.id },
                    });
                    this.logger.log(`更新 AI 提供商: ${provider.name}`);
                }

                const providerResult = {
                    provider: provider.provider,
                    id: provider.id,
                    models: [],
                };

                // 处理该供应商的所有模型
                for (const modelConfig of config.models) {
                    // 查找是否已存在该模型
                    let model = await this.aiModelRepository.findOne({
                        where: {
                            providerId: provider.id,
                            model: modelConfig.model,
                        },
                    });

                    // 准备模型数据
                    const modelData = {
                        providerId: provider.id,
                        name: modelConfig.label,
                        model: modelConfig.model,
                        modelType: modelConfig.model_type,
                        features: Array.isArray(modelConfig.features) ? modelConfig.features : [],
                        isActive: true,
                        isBuiltIn: true,
                        sortOrder: 0,
                        modelConfig: {
                            ...modelConfig.model_properties,
                        },
                    };

                    // 如果存在上下文大小信息，设置到maxContext字段
                    if (modelConfig.model_properties?.context_size) {
                        modelData.modelConfig.maxContext =
                            modelConfig.model_properties.context_size;
                    }

                    // 如果不存在，则创建新模型
                    if (!model) {
                        model = await this.aiModelRepository.save(modelData);
                        this.logger.log(`创建 AI 模型: ${model.name}`);
                    }
                    // 如果存在，则更新模型信息
                    else {
                        await this.aiModelRepository.update(model.id, modelData);
                        model = await this.aiModelRepository.findOne({
                            where: { id: model.id },
                        });
                        this.logger.log(`更新 AI 模型: ${model.name}`);
                    }

                    providerResult.models.push({
                        id: model.id,
                        name: model.name,
                        model: model.model,
                    });
                }

                results.push(providerResult);
            }

            this.logger.log(`✅ AI 提供商和模型数据初始化完成，共 ${results.length} 个提供商`);
        } catch (error) {
            this.logger.error(`❌ AI 提供商和模型数据初始化失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 获取配置文件路径
     *
     * 检查多个可能的路径，返回第一个存在的文件路径
     *
     * @param fileName 配置文件名
     * @returns 文件路径，如果找不到则返回 null
     */
    private getConfigFilePath(fileName: string): string | null {
        const possiblePaths = [
            path.join(process.cwd(), `src/core/database/install/${fileName}`), // 在 apps/server 目录下运行
            path.join(process.cwd(), `apps/server/src/core/database/install/${fileName}`), // 在项目根目录下运行
            path.join(__dirname, `install/${fileName}`), // 编译后的路径
        ];

        for (const possiblePath of possiblePaths) {
            if (fse.pathExistsSync(possiblePath)) {
                return possiblePath;
            }
        }

        return null;
    }

    /**
     * 检查系统是否已安装
     *
     * 通过检查 .installed 文件和数据库中的安装标记来判断
     *
     * @returns 系统是否已安装
     */
    private async checkSystemInstalled(): Promise<boolean> {
        try {
            // 检查 .installed 文件是否存在
            const installFilePath = path.join(process.cwd(), "data", ".installed");
            const fileExists = await fse.pathExists(installFilePath);

            // 检查数据库中的安装标记
            let dbInstalled = false;
            try {
                // 尝试从字典表中获取安装状态
                const installStatus = await this.dictService.get("is_installed", "false", "system");
                dbInstalled = isEnabled(installStatus);
            } catch (e) {
                // 如果查询失败，可能是表不存在，视为未安装
                console.error("e", e);
                dbInstalled = false;
            }

            // 两者都为 true 时才认为系统已安装
            return fileExists && dbInstalled;
        } catch (e) {
            // 出错时默认为未安装，确保安全
            console.error("e", e);
            return false;
        }
    }

    /**
     * 标记系统为已安装
     *
     * 创建 .installed 文件并在数据库中设置安装标记
     */
    private async markSystemAsInstalled(): Promise<void> {
        try {
            // 创建 data 目录（如果不存在）
            const dataDir = path.join(process.cwd(), "data");
            await fse.ensureDir(dataDir);

            // 创建 .installed 文件
            const installFilePath = path.join(dataDir, ".installed");
            await fse.writeFile(
                installFilePath,
                JSON.stringify(
                    {
                        installed_at: new Date().toISOString(),
                        version: "1.0.0", // 可以记录当前系统版本
                    },
                    null,
                    2,
                ),
            );

            // 在字典表中设置安装标记
            await this.dictService.set("is_installed", "true", {
                group: "system",
                description: "系统是否已完成初始化安装",
            });

            this.logger.log("✅ 系统已标记为已安装状态");
        } catch (e) {
            this.logger.error(`❌ 标记系统安装状态失败: ${e.message}`);
        }
    }
}
