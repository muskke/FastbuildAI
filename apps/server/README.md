<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="./libs/assets/logo.png" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">
  <h1 align="center">FastbuildAI</h1>
</p>

<p align="center">
  A rapid development framework for AI applications based on <a href="https://github.com/nestjs/nest" target="_blank">NestJS</a>
</p>

## Description

[FastbuildAI](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Libraries

```
server/
├── src/                                # 主应用源代码
│   ├── main.ts                         # 应用入口点
│   ├── modules/                        # 业务模块
│   │   ├── app.module.ts               # 主应用模块
│   │   ├── console/                    # 后台管理模块
│   │   │   ├── decorate/               # 装饰模块
│   │   │   ├── dict/                   # 字典管理模块
│   │   │   ├── example/                # 示例模块
│   │   │   ├── health/                 # 健康检查模块
│   │   │   ├── menu/                   # 菜单管理模块
│   │   │   ├── permission/             # 权限管理模块
│   │   │   ├── plugin/                 # 插件管理模块
│   │   │   ├── role/                   # 角色管理模块
│   │   │   ├── system/                 # 系统管理模块
│   │   │   └── user/                   # 用户管理模块
│   │   └── web/                        # 前台接口模块
│   │       ├── auth/                   # 认证模块
│   │       ├── system/                 # 系统模块
│   │       ├── test/                   # 测试模块
│   │       ├── upload/                 # 上传模块
│   │       └── user/                   # 用户模块
│   ├── core/                           # 核心模块
│   │   ├── cache/                      # 缓存模块
│   │   ├── database/                   # 数据库模块
│   │   ├── logger/                     # 日志模块
│   │   ├── plugins/                    # 插件系统核心
│   │   ├── queue/                      # 队列模块
│   │   │   └── processors/             # 队列处理器
│   │   ├── redis/                      # Redis模块
│   │   └── schedule/                   # 定时任务模块
│   ├── common/                         # 通用模块
│   │   ├── base/                       # 基础类
│   │   │   ├── controllers/            # 基础控制器
│   │   │   └── services/               # 基础服务
│   │   ├── config/                     # 配置
│   │   ├── constants/                  # 常量定义
│   │   ├── decorators/                 # 装饰器
│   │   ├── dto/                        # 数据传输对象
│   │   ├── exceptions/                 # 异常处理
│   │   ├── filters/                    # 过滤器
│   │   ├── guards/                     # 守卫
│   │   ├── interceptors/               # 拦截器
│   │   ├── interfaces/                 # 接口定义
│   │   ├── modules/                    # 通用业务模块
│   │   ├── pipe/                       # 管道
│   │   └── utils/                      # 工具函数
│   ├── plugins/                        # 插件目录
│   └── assets/                         # 静态资源
├── storage/                            # 存储目录
│   ├── cache/                          # 缓存目录
│   ├── downloads/                      # 下载目录
│   ├── logs/                           # 日志目录
│   ├── plugins/                        # 插件存储目录
│   └── uploads/                        # 上传文件目录
├── test/                               # 测试目录
├── libs/                               # 库目录
├── .env                                # 环境变量
├── .env.development                    # 开发环境变量
├── .env.production                     # 生产环境变量
├── nest-cli.json                       # NestJS配置
├── package.json                        # 项目依赖
├── tsconfig.json                       # TypeScript配置
└── README.md                           # 项目说明
```

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can
take to ensure it runs as efficiently as possible. Check out the
[deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out
[Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau
makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building
features rather than managing infrastructure.
