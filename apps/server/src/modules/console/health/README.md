# 健康检查模块

## 模块概述

健康检查模块提供了一组端点，用于监控应用程序和依赖服务的健康状态。这些端点可以被监控系统、负载均衡器或容器编排系统（如 Kubernetes）使用，以确定应用程序是否正常运行。

健康检查模块基于 NestJS 的 `@nestjs/terminus` 包实现，支持多种健康检查指标，包括：

- 应用程序状态
- HTTP 服务状态
- 数据库连接状态
- Redis 连接状态
- 内存使用情况
- 磁盘存储状态

## 接口说明

所有健康检查接口都以 `/console/health`
为前缀，**仅限后台管理员访问**。这些接口受到 NestJS 认证守卫和权限守卫的保护，需要有效的管理员身份验证才能访问。

### 基础健康检查

- **路径**：`/console/health`
- **方法**：`GET`
- **描述**：提供应用程序的基本健康状态，只检查应用程序本身是否正常运行
- **响应示例**：
    ```json
    {
        "status": "ok",
        "info": {
            "app": {
                "status": "up",
                "message": "应用程序运行正常"
            }
        },
        "details": {
            "app": {
                "status": "up",
                "message": "应用程序运行正常"
            }
        }
    }
    ```

### HTTP 健康检查

- **路径**：`/console/health/http`
- **方法**：`GET`
- **描述**：检查应用程序是否能正常响应 HTTP 请求
- **响应示例**：
    ```json
    {
        "status": "ok",
        "info": {
            "nestjs-app": {
                "status": "up"
            }
        },
        "details": {
            "nestjs-app": {
                "status": "up"
            }
        }
    }
    ```

### 详细健康检查

- **路径**：`/console/health/detail`
- **方法**：`GET`
- **描述**：提供应用程序、数据库、Redis、内存和磁盘的详细健康状态
- **响应示例**：
    ```json
    {
        "status": "ok",
        "info": {
            "nestjs-app": {
                "status": "up"
            },
            "memory_heap": {
                "status": "up"
            },
            "memory_rss": {
                "status": "up"
            },
            "disk": {
                "status": "up"
            },
            "database": {
                "status": "up",
                "message": "数据库连接正常"
            },
            "redis": {
                "status": "up",
                "message": "Redis连接正常"
            }
        },
        "details": {
            "nestjs-app": {
                "status": "up"
            },
            "memory_heap": {
                "status": "up",
                "message": "内存使用正常"
            },
            "memory_rss": {
                "status": "up",
                "message": "RSS内存使用正常"
            },
            "disk": {
                "status": "up",
                "message": "磁盘存储正常"
            },
            "database": {
                "status": "up",
                "message": "数据库连接正常"
            },
            "redis": {
                "status": "up",
                "message": "Redis连接正常"
            }
        }
    }
    ```

### 数据库健康检查

- **路径**：`/console/health/db`
- **方法**：`GET`
- **描述**：专门检查数据库和 Redis 连接状态
- **响应示例**：
    ```json
    {
        "status": "ok",
        "info": {
            "database": {
                "status": "up",
                "message": "数据库连接正常"
            },
            "redis": {
                "status": "up",
                "message": "Redis连接正常"
            }
        },
        "details": {
            "database": {
                "status": "up",
                "message": "数据库连接正常"
            },
            "redis": {
                "status": "up",
                "message": "Redis连接正常"
            }
        }
    }
    ```

## 健康检查状态说明

健康检查响应中的 `status` 字段有两种可能的值：

- `ok`：所有检查项都正常
- `error`：至少有一个检查项异常

每个检查项的 `status` 字段有两种可能的值：

- `up`：检查项正常
- `down`：检查项异常

## 使用方法

### 在监控系统中使用

可以配置监控系统（如 Prometheus、Grafana 等）定期请求健康检查端点，并根据响应状态触发告警。由于健康检查端点需要认证，您需要在请求中包含有效的认证信息。

```bash
# 使用 curl 检查应用健康状态（需要包含身份令牌）
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" http://your-app-domain/console/health

# 使用 curl 检查详细健康状态（需要包含身份令牌）
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" http://your-app-domain/console/health/detail
```

### 在 Kubernetes 中使用

可以在 Kubernetes 的 Deployment 或 Pod 配置中添加存活探针（Liveness Probe）和就绪探针（Readiness
Probe）：

```yaml
livenessProbe:
    httpGet:
        path: /console/health
        port: 4090
        httpHeaders:
            - name: Authorization
              value: Bearer YOUR_ADMIN_TOKEN
    initialDelaySeconds: 30
    periodSeconds: 10

readinessProbe:
    httpGet:
        path: /console/health/detail
        port: 4090
        httpHeaders:
            - name: Authorization
              value: Bearer YOUR_ADMIN_TOKEN
    initialDelaySeconds: 5
    periodSeconds: 10
```

> **注意**：在实际部署中，您需要创建一个专用的管理员令牌用于健康检查，并确保该令牌具有适当的权限。

## 自定义健康检查

如果需要添加新的健康检查指标，可以创建自定义的健康检查指示器：

1. 在 `src/modules/health/indicators` 目录下创建新的指示器类
2. 继承 `HealthIndicator` 类并实现 `isHealthy` 方法
3. 在 `HealthModule` 中注册新的指示器
4. 在 `HealthController` 中使用新的指示器

示例：

```typescript
// 创建自定义健康检查指示器
@Injectable()
export class CustomHealthIndicator extends HealthIndicator {
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    // 实现健康检查逻辑
    const isHealthy = true;
    return this.getStatus(key, isHealthy, { message: '自定义检查正常' });
  }
}

// 在控制器中使用
@Get('custom')
@Public()
@HealthCheck()
async checkCustom() {
  return this.health.check([
    () => this.customIndicator.isHealthy('custom'),
  ]);
}
```

## 注意事项

1. 健康检查端点**仅限后台管理员访问**，需要有效的认证和授权
2. 健康检查应该是轻量级的，不应该执行耗时的操作
3. 如果应用程序使用了负载均衡，确保健康检查能够正确识别每个实例的状态
4. 如果需要在外部监控系统中使用这些健康检查端点，请确保配置适当的认证机制
