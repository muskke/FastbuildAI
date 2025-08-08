-- 示例插件安装数据
-- 注意：SQL语句以分号结尾，每条语句之间可以有空行

-- 为Column实体插入示例栏目
INSERT INTO article_plugin_article_column (id, name, slug, description, icon, cover_image, status, sort, show_in_nav, seo_keywords, seo_description, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', '技术分享', 'tech', '分享技术相关的文章和经验', 'i-lucide-code', '', 1, 100, 1, '技术,编程,开发', '技术分享栏目，包含各种编程技术和开发经验', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', '生活随笔', 'life', '记录生活中的点点滴滴', 'i-lucide-heart', '', 1, 90, 1, '生活,随笔,日记', '生活随笔栏目，分享生活感悟和日常记录', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', '产品设计', 'design', '产品设计相关的文章', 'i-lucide-palette', '', 1, 80, 1, '设计,产品,UI,UX', '产品设计栏目，包含UI/UX设计和产品思考', NOW(), NOW());

-- 为Article实体插入示例文章
INSERT INTO article_plugin_article (id, title, content, summary, author, column_id, tags, cover_image, status, is_top, sort, seo_keywords, seo_description, published_at, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440011', 'Vue 3 组合式API详解', '# Vue 3 组合式API详解

Vue 3 引入了组合式API，这是一个全新的API风格，让我们能够更好地组织和复用代码逻辑。

## 什么是组合式API

组合式API是Vue 3中新增的一套API，它允许我们使用函数的方式来组织组件的逻辑...', 'Vue 3 组合式API是一个强大的新特性，本文详细介绍其使用方法和最佳实践。', '张三', '550e8400-e29b-41d4-a716-446655440001', '["Vue", "JavaScript", "前端"]', '', 1, 1, 100, 'Vue3,组合式API,Composition API', 'Vue 3 组合式API详细教程，包含setup函数、响应式API等核心概念', NOW(), NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440012', '我的编程之路', '# 我的编程之路

回想起刚开始学习编程的那段时光，充满了挑战和收获...

## 初学阶段

最开始接触编程是在大学时期，那时候学的是C语言...', '分享我从编程小白到开发者的成长历程，希望能给初学者一些启发。', '李四', '550e8400-e29b-41d4-a716-446655440002', '["编程", "成长", "经验分享"]', '', 1, 0, 90, '编程,成长,经验', '程序员成长经历分享，从入门到进阶的心路历程', NOW(), NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440013', '用户体验设计原则', '# 用户体验设计原则

好的用户体验设计需要遵循一些基本原则，本文将详细介绍这些原则...

## 可用性原则

产品应该易于使用，用户能够快速上手...', '介绍用户体验设计的核心原则，帮助设计师创造更好的产品体验。', '王五', '550e8400-e29b-41d4-a716-446655440003', '["UX", "设计", "用户体验"]', '', 1, 0, 80, 'UX设计,用户体验,设计原则', '用户体验设计核心原则详解，提升产品可用性和用户满意度', NOW(), NOW(), NOW());

-- 注意：这里的UUID是预设的，实际使用时可能需要生成随机UUID
-- 表名格式是：插件包名_实体名，例如 article_plugin_article, article_plugin_column
