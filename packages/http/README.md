# @fastbuildai/http

一个现代化的 HTTP 客户端工具包，专为 BuildingAI 项目设计，提供完整的 HTTP 请求处理、拦截器管理、聊天流处理和文件上传功能。

## ✨ 特性

- 🚀 **现代化设计** - 基于 TypeScript 和 ES6+ 模块化设计
- 🔧 **拦截器系统** - 完整的请求/响应/错误拦截器支持
- 💬 **聊天流处理** - 原生支持 Server-Sent Events 和流式聊天
- 📁 **文件上传** - 支持进度监控和取消操作的文件上传
- 🎯 **类型安全** - 完整的 TypeScript 类型定义
- ⚡ **高性能** - 基于 ofetch 的高性能请求库
- 🔄 **请求去重** - 自动防止重复请求
- 🛡️ **错误处理** - 完善的错误处理和重试机制

## 🚀 快速开始
package.json 加入 dependencies -> "@fastbuildai/ui": "workspace:*",

### 基础使用

```typescript
import { createHttpClient } from '@fastbuildai/http';

// 创建 HTTP 客户端
const http = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 30000,
});

// 发送请求
const data = await http.get('/users');
const user = await http.post('/users', {
  data: { name: 'John', email: 'john@example.com' }
});
```

### 聊天流处理

```typescript
import { createHttpClient } from '@fastbuildai/http';

const http = createHttpClient({
  baseURL: 'https://api.example.com',
});

// 创建聊天流
const controller = await http.chatStream('/chat', {
  messages: [
    { role: 'user', content: 'Hello, how are you?' }
  ],
  onUpdate: (chunk) => {
    console.log('收到更新:', chunk.delta);
  },
  onFinish: (message) => {
    console.log('聊天完成:', message.content);
  },
  onError: (error) => {
    console.error('聊天错误:', error);
  }
});

// 取消聊天流
controller.abort();
```

### 文件上传

```typescript
import { createHttpClient } from '@fastbuildai/http';

const http = createHttpClient();

// 上传文件
const uploadController = http.upload('/upload', {
  file: fileInput.files[0],
  onProgress: (percent) => {
    console.log(`上传进度: ${percent}%`);
  }
});

// 监听上传结果
uploadController.promise.then(result => {
  console.log('上传成功:', result);
}).catch(error => {
  console.error('上传失败:', error);
});

// 取消上传
uploadController.abort();
```

## 📚 API 文档

### HttpClient

主要的 HTTP 客户端接口，提供完整的 HTTP 请求功能。

#### 方法

- `get<T>(url, options?)` - 发送 GET 请求
- `post<T>(url, options?)` - 发送 POST 请求
- `put<T>(url, options?)` - 发送 PUT 请求
- `delete<T>(url, options?)` - 发送 DELETE 请求
- `patch<T>(url, options?)` - 发送 PATCH 请求
- `request<T>(method, url, options?)` - 发送自定义请求
- `chatStream(url, config)` - 建立聊天流连接
- `upload<T>(url, options)` - 文件上传

#### 配置方法

- `setHeader(name, value)` - 设置全局请求头
- `setToken(token, type?)` - 设置认证令牌
- `setBaseURL(baseURL)` - 设置基础 URL
- `setTimeout(timeout)` - 设置超时时间
- `cancel(url, method?)` - 取消特定请求
- `cancelAll()` - 取消所有请求

### 拦截器系统

```typescript
// 请求拦截器
http.interceptors.request((config) => {
  // 在发送请求前修改配置
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 响应拦截器
http.interceptors.response((response) => {
  // 处理响应数据
  return response.data;
});

// 错误拦截器
http.interceptors.error((error) => {
  // 处理错误
  console.error('请求错误:', error);
});
```

### 请求选项

```typescript
interface RequestOptions {
  params?: Record<string, unknown>;        // URL 参数
  data?: Record<string, unknown>;          // 请求体数据
  headers?: Record<string, string>;        // 请求头
  timeout?: number;                        // 超时时间
  dedupe?: boolean;                        // 是否去重
  requireAuth?: boolean;                   // 是否需要认证
  returnFullResponse?: boolean;            // 是否返回完整响应
  skipBusinessCheck?: boolean;             // 是否跳过业务状态码检查
  onError?: (error: unknown) => void;      // 错误处理回调
}
```

### 聊天流配置

```typescript
interface ChatStreamConfig {
  messages: ChatMessage[];                 // 消息列表
  body?: Record<string, any>;              // 额外请求体数据
  onResponse?: (response: Response) => void; // 响应回调
  onUpdate?: (chunk: ChatStreamChunk) => void; // 更新回调
  onFinish?: (message: ChatMessage) => void;   // 完成回调
  onError?: (error: Error) => void;        // 错误回调
  generateId?: () => string;               // ID 生成器
  headers?: Record<string, string>;        // 请求头
}
```

### 文件上传选项

```typescript
interface UploadOptions {
  file: File | FormData;                   // 文件对象
  fieldName?: string;                      // 文件字段名
  formData?: Record<string, string>;       // 附加表单数据
  onProgress?: (percent: number) => void;  // 进度回调
  headers?: Record<string, string>;        // 请求头
  skipBusinessCheck?: boolean;             // 是否跳过业务状态码检查
  returnFullResponse?: boolean;            // 是否返回完整响应
}
```

## 🔧 高级用法

### 自定义拦截器

```typescript
import { InterceptorManager } from '@fastbuildai/http';

const interceptorManager = new InterceptorManager();

// 添加认证拦截器
interceptorManager.request(async (config) => {
  const token = await getAuthToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 添加响应处理拦截器
interceptorManager.response((response) => {
  if (response.code !== 0) {
    throw new Error(response.message);
  }
  return response.data;
});
```

### 请求缓存

```typescript
import { RequestCache } from '@fastbuildai/http';

const cache = new RequestCache();

// 缓存请求结果
const cachedData = await cache.get('users', () => 
  http.get('/users')
);
```

### 参数处理

```typescript
import { ParamsProcessor } from '@fastbuildai/http';

const processor = new ParamsProcessor();

// 自定义参数处理
processor.setProcessor((params) => {
  // 过滤空值
  return Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value != null)
  );
});
```

## 🏗️ 架构设计

```
packages/http/
├── src/
│   ├── index.ts              # 主入口文件
│   ├── types.ts              # 类型定义
│   ├── constants.ts          # 常量定义
│   ├── core/                 # 核心模块
│   │   ├── http-client-impl.ts    # HTTP 客户端实现
│   │   ├── interceptor-manager.ts # 拦截器管理器
│   │   └── request-executor.ts    # 请求执行器
│   ├── features/             # 功能模块
│   │   ├── chat-stream.ts    # 聊天流处理
│   │   └── file-upload.ts    # 文件上传
│   ├── handlers/             # 处理器
│   │   ├── error-handler.ts  # 错误处理
│   │   └── response-handler.ts # 响应处理
│   ├── utils/                # 工具类
│   │   ├── request-cache.ts  # 请求缓存
│   │   └── params-processor.ts # 参数处理器
│   └── builders/             # 建造者模式
│       └── http-client-builder.ts # HTTP 客户端建造者
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## �� 许可证

MIT License 