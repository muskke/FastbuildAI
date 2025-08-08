1. 项目基于NestJS + TypeScript框架，使用PostgreSQL + TypeORM作为数据库，Redis作为缓存；
2. 使用SWC作为构建工具，pnpm作为包管理器，PM2作为进程管理器；
3. 项目采用Monorepo架构，环境变量配置在根目录（../../.env.development.local）；
4. 严格区分模块：`src/modules/console/`为后台管理接口，`src/modules/web/`为前台用户接口；
5. 核心功能模块放在`src/core/`，通用组件和工具放在`src/common/`，插件系统放在`src/plugins/`；
6. 使用路径别名：`@core/*`、`@common/*`、`@modules/*`、`@plugins/*`、`@assets/*`、`@/*`；
7. 后台控制器必须使用`@ConsoleController()`装饰器；
8. 前台控制器必须使用`@WebController()`装饰器；
9. 插件控制器必须使用`@PluginConsoleController()`或`@PluginWebController()`装饰器；
10. 根据需要继承`BaseController`获得通用控制器功能；
11. 基础服务必须继承`BaseService<T>`获得通用CRUD操作；
12. 实体类型必须包含`id: string`属性作为主键，pgsql将自动生成uuid；
13. 使用`@Permissions()`进行后台权限控制；
14. 使用`@Playground()`获取用户Playground信息；
15. 使用`@Public()`标记公共路由，跳过认证；
16. 使用`@ClientSourceAuth()`进行客户端来源验证；
17. 统一使用`HttpExceptionFactory`创建标准异常；
18. 严格遵循`BusinessCode`常量定义的错误码规则；
19. 错误码规则：成功20000，客户端错误4xxxx，服务端错误5xxxx；
20. 分页查询统一引用`PaginationDto`；
21. 支持`excludeFields`排除敏感字段；
22. 插件必须使用专用控制器装饰器，确保独立路由；
23. 插件不能使用主程序装饰器，确保模块隔离；
24. 插件配置信息必须包含在`package.json`中；
25. 统一响应格式：`{code, message, data, timestamp}`；
26. 分页响应格式：`{items, total, page, pageSize, totalPages}`；
27. 依赖全局拦截器处理响应格式，无需手动构建响应体；
28. 业务状态码使用`BusinessCode`常量定义；
29. 内存缓存使用`@core/cache`模块；
30. Redis缓存使用`@core/redis`模块；
31. 合理设计模块依赖关系，避免循环依赖；
32. 统一使用异常工厂函数处理异常；
33. 不使用Swagger，采用其他文档生成方案；
34. 所有系统模块的实体文件都统一使用@AppEntity装饰器，插件模块的实体文件都统一使用@PluginEntity装饰器；
35. ESLint错误由开发者自行修复；
36. 严格区分console和web模块，不能混用；
37. 根据数据库操作需求选择继承BaseService或注入相关服务；
38. 合理使用缓存和数据库索引进行性能优化；
39. 使用pnpm管理依赖，避免使用npm或yarn；
40. 在重构完某个模块之后，列出废弃的逻辑和代码和文件；
