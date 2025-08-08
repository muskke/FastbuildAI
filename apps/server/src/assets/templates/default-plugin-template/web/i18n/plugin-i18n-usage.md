# 插件国际化使用指南

## 概述

本系统提供了专门为插件设计的国际化解决方案，包括：

- `getPluginKey()` - 获取插件命名空间前缀
- `usePluginI18n()` - 插件国际化组合函数
- `$pt()` - 全局插件翻译方法

## 1. getPluginKey 方法

### 功能

获取插件的命名空间前缀，支持自动检测和手动指定。

### 使用方法

```typescript
import { getPluginKey } from "~/common/utils/helper";

// 自动从路由获取插件名
const pluginKey = getPluginKey(); // => 'article-plugin'

// 手动指定插件名
const pluginKey = getPluginKey("my-plugin"); // => 'my-plugin'
```

### 路由映射规则

- `/article-plugin/*` → `article-plugin`
- 可以根据需要添加更多映射规则

## 2. usePluginI18n 组合函数

### 功能

为插件提供专用的国际化方法，自动添加插件命名空间前缀。

### 基本使用

```vue
<script setup>
import { usePluginI18n } from "~/common/composables/usePluginI18n";

// 自动获取插件名
const { pt, pluginKey } = usePluginI18n();

// 手动指定插件名
const { pt } = usePluginI18n("article-plugin");

// 使用 pt 方法
const title = pt("index.title"); // 等同于 $t('article-plugin.index.title')
const message = pt("search.results.found", { count: 10, keyword: "Vue" });
</script>

<template>
    <div>
        <h1>{{ pt("index.title") }}</h1>
        <p>{{ pt("index.subtitle") }}</p>
    </div>
</template>
```

### 在组件中的完整示例

```vue
<script setup lang="ts">
import { usePluginI18n } from "~/common/composables/usePluginI18n";

// 获取插件国际化方法
const { pt } = usePluginI18n();

// 其他逻辑...
const handleSearch = () => {
    console.log(pt("search.placeholder"));
};
</script>

<template>
    <div>
        <!-- 直接在模板中使用 -->
        <h1>{{ pt("index.title") }}</h1>

        <!-- 带参数的翻译 -->
        <p>{{ pt("search.results.found", { count: articles.length }) }}</p>

        <!-- 在属性中使用 -->
        <UInput :placeholder="pt('search.placeholder')" />

        <!-- 在事件处理中使用 -->
        <UButton @click="handleSearch">{{ pt("search.button") }}</UButton>
    </div>
</template>
```

## 3. 全局 $pt 方法

### 功能

全局可用的插件翻译方法，可以在任何地方使用。

### 使用方法

```vue
<template>
    <div>
        <!-- 在模板中直接使用 -->
        <h1>{{ $pt("index.title") }}</h1>

        <!-- 带参数 -->
        <p>{{ $pt("search.results.found", { count: 10, keyword: "Vue" }) }}</p>

        <!-- 指定插件名 -->
        <span>{{ $pt("other.key", {}, "other-plugin") }}</span>
    </div>
</template>

<script setup>
// 在脚本中使用（需要通过 $pt 访问）
const { $pt } = useNuxtApp();
const message = $pt("index.welcome");
</script>
```

## 4. 翻译文件结构

### 目录结构

```
plugins/article-plugin/i18n/
├── zh-Hans/
│   ├── index.json      # 首页翻译
│   ├── detail.json     # 详情页翻译
│   └── search.json     # 搜索页翻译
└── en-US/
    ├── index.json
    ├── detail.json
    └── search.json
```

### 翻译文件示例

**index.json**

```json
{
    "title": "文章中心",
    "subtitle": "探索知识，分享思想",
    "navigation": {
        "all": "全部",
        "search": "搜索"
    },
    "sidebar": {
        "hotArticles": "热门文章",
        "latestArticles": "最新文章"
    }
}
```

## 5. 对比传统方式

### 传统方式

```vue
<template>
    <h1>{{ $t("article-plugin.index.title") }}</h1>
    <p>{{ $t("article-plugin.search.results.found", { count: 10 }) }}</p>
</template>
```

### 使用 pt 方法

```vue
<template>
    <h1>{{ pt("index.title") }}</h1>
    <p>{{ pt("search.results.found", { count: 10 }) }}</p>
</template>

<script setup>
const { pt } = usePluginI18n();
</script>
```

## 6. 优势

1. **简化调用**：无需重复写插件前缀
2. **自动检测**：可以自动从路由获取插件名
3. **类型安全**：提供完整的 TypeScript 支持
4. **命名空间隔离**：避免不同插件间的翻译键冲突
5. **向后兼容**：不影响现有的 `$t` 方法使用

## 7. 注意事项

1. **路由映射**：确保在 `getPluginKey` 中正确配置路由到插件的映射
2. **翻译文件**：保持翻译文件的结构和命名一致
3. **命名空间**：避免在翻译键中使用插件前缀，系统会自动添加
4. **性能**：`pt` 方法内部调用 `$t`，性能与原生方法相同

## 8. 迁移指南

### 从传统方式迁移

1. 导入 `usePluginI18n`
2. 获取 `pt` 方法
3. 替换模板中的翻译调用

```diff
<script setup>
+ import { usePluginI18n } from '~/common/composables/usePluginI18n';
+ const { pt } = usePluginI18n();
</script>

<template>
- <h1>{{ $t('article-plugin.index.title') }}</h1>
+ <h1>{{ pt('index.title') }}</h1>
</template>
```

这样就完成了插件国际化系统的使用配置！
