# 插件系统使用指南

## 快速开始

### 1. 创建插件定义 (main.plugin.ts)

```typescript
import { createServiceContribution, definePlugin } from "@core/plugins/plugin-utils";
import { MyService } from "./my.service";

export const myPlugin = definePlugin({
    id: "my-plugin",
    contributions: [
        createServiceContribution({
            id: "my-handler",
            slot: "chat.handlers",
            service: MyService,
            order: 10,
            metadata: {
                platform: "my-platform",
                version: "1.0.0",
            },
        }),
    ],
    meta: {
        name: "我的插件",
        description: "插件描述",
        version: "1.0.0",
    },
});

export default myPlugin;
```

### 2. 在模块中注册

```typescript
import { Module, OnModuleInit } from "@nestjs/common";
import { createPluginInstaller } from "@core/plugins/plugin-utils";
import myPlugin from "./main.plugin";

@Module({...})
export class MyModule implements OnModuleInit {
    private readonly installPlugin = createPluginInstaller(myPlugin);
    
    onModuleInit() {
        this.installPlugin();
    }
}
```

### 3. 使用插件服务

```typescript
import { getSlotServices, getSlotService } from "@core/plugins/plugin-utils";

// 获取插槽中的所有服务
const services = getSlotServices("chat.handlers");

// 获取插槽中的第一个服务
const service = getSlotService("chat.handlers");
```

## 插槽名称约定

插槽名称完全自由定义，建议使用点分割的命名约定：

```typescript
// 推荐的命名风格
"agent.chat.handlers"          // 智能体聊天处理器
"agent.chat.stream-handlers"   // 智能体流式聊天处理器
"agent.message.processors"     // 智能体消息处理器
"payment.processors"           // 支付处理器
"auth.providers"               // 认证提供商
"storage.providers"            // 存储提供商
"notification.channels"        // 通知渠道

// 或者使用自己的命名风格
"chatHandlers"
"paymentGateways" 
"fileStorage"
```

## 高级用法

### 条件启用插件

```typescript
createServiceContribution({
    id: "admin-handler",
    slot: "admin.handlers",
    service: AdminService,
    order: 5,
    metadata: { platform: "admin" },
    enabled: (ctx) => ctx?.user?.role === "admin"
})
```

### 丰富的元数据

```typescript
createServiceContribution({
    id: "advanced-handler",
    slot: "chat.handlers", 
    service: AdvancedService,
    order: 10,
    metadata: { 
        platform: "dify", 
        version: "1.0.0",
        features: ["streaming", "vision"],
        maxTokens: 4096,
    },
})
```

## 设计原则

1. **简单优先** - 大多数场景只需要 `createServiceContribution`
2. **灵活插槽** - 支持任意字符串作为插槽名称
3. **类型安全** - TypeScript 全程类型检查
4. **性能优化** - 内置缓存和二分搜索排序
