# Docker 环境配置说明

本项目使用 Docker 和 Docker Compose 进行环境配置，可以快速搭建开发环境。

## 环境要求

- Docker
- Docker Compose

## 目录结构

```
docker/
├── mysql/
│   └── init/          # MySQL 初始化脚本
└── README.md          # 说明文档
```

## 服务组件

- MySQL 8.0：数据库服务
- Redis 7：缓存服务
- Node.js 22.14.0：开发环境

## 快速开始

### 启动所有服务

```bash
# 在项目根目录执行
docker-compose up -d
```

### 仅启动数据库和缓存服务

```bash
# 在项目根目录执行
docker-compose up -d mysql redis
```

### 进入 Node.js 容器

```bash
# 进入 Node.js 容器的交互式终端
docker-compose exec nodejs sh
```

### 查看服务日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f mysql
docker-compose logs -f redis
docker-compose logs -f nodejs
```

### 停止所有服务

```bash
docker-compose down
```

### 重建服务

```bash
# 重建并启动所有服务
docker-compose up -d --build
```

## 服务访问

- MySQL: localhost:3307
  - 用户名: root
  - 密码: root
  - 数据库: fastbuildai_dev
- Redis: localhost:6380
- Node.js: 通过 `docker-compose exec nodejs sh` 进入容器

## 数据持久化

数据库和缓存数据通过 Docker 卷进行持久化存储：

- mysql_data: MySQL 数据
- redis_data: Redis 数据

## 常见问题

### 端口冲突

如果出现端口冲突，可以在 docker-compose.yml 中修改端口映射：

```yaml
ports:
  - "新端口:原端口"
```

### 数据库连接问题

确保在应用配置中使用正确的数据库连接信息：

- 主机: mysql (在容器内部) 或 localhost (在宿主机)
- 端口: 3307
- 用户名: root
- 密码: root
- 数据库: fastbuildai_dev
