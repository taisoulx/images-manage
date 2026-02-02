# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个跨平台图片管理桌面应用，基于 Tauri 2 + React 19 架构。应用支持万张级图片的高效管理、智能搜索和局域网移动端访问。

## 开发命令

### 主要命令
```bash
npm run tauri:dev      # 启动完整的 Tauri 开发模式（推荐）
npm run tauri:build    # 构建生产版本的桌面应用
npm run dev            # 仅启动 Vite 前端开发服务器（localhost:1420）
npm run server         # 启动独立的 API 服务器（localhost:3000）
```

### 代码质量
```bash
npm run lint           # ESLint 检查
npm run format         # Prettier 格式化
npm run type-check     # TypeScript 类型检查
```

### 数据库操作
```bash
npm run db:generate    # 生成 Prisma 客户端
npm run db:push        # 推送数据库 schema
npm run db:migrate     # 运行数据库迁移
npm run db:seed        # 运行数据库种子数据
```

## 架构概述

### 双后端架构

项目采用独特的双后端设计：

1. **Tauri 后端（Rust）**：`src-tauri/src/`
   - 负责桌面应用的核心功能
   - 通过 Tauri Commands 与前端通信
   - 主要模块：`commands.rs`、`database.rs`、`image.rs`

2. **API 服务器（Node.js + Fastify）**：`src/server/`
   - 独立的 HTTP 服务器，支持局域网访问
   - 提供网络信息、健康检查等 API
   - 移动端通过此服务器访问应用

### 前端架构

- **入口**：`src/main.tsx` → `src/components/Router.tsx`
- **路由系统**：使用 React Router 7，路由配置在 `Router.tsx`
- **状态管理**：Zustand，store 位于 `src/stores/`
- **性能优化**：
  - 图片懒加载：`react-intersection-observer`
  - 虚拟滚动：`react-window`，每页 20 张图片
  - 代码分割：React Router 懒加载

### 数据库架构

- **ORM**：Prisma，配置文件 `prisma/schema.prisma`
- **主要模型**：
  - `Image`：图片基本信息
  - `ImageMetadata`：EXIF 元数据
  - `ImageTag`：图片标签
- **全文搜索**：计划使用 FTS5 虚拟表（需通过自定义 SQL 迁移创建）

## 添加新功能的指南

### 添加新的 Tauri 命令

1. 在 `src-tauri/src/commands.rs` 中添加命令函数，使用 `#[command]` 宏装饰
2. 在 `src-tauri/src/main.rs` 的 `invoke_handler!` 宏中注册命令
3. 在前端使用 `invoke()` 调用命令

### 添加新页面

1. 在 `src/pages/` 中创建页面组件
2. 在 `src/components/Router.tsx` 中添加路由
3. 在 `src/components/Layout.tsx` 中添加导航链接（如需要）

### 数据库变更

1. 修改 `prisma/schema.prisma`
2. 运行 `npm run db:generate` 生成客户端
3. 运行 `npm run db:push` 或 `npm run db:migrate` 应用变更

## 默认配置

- **管理员密码**：`admin`（首次登录后需修改）
- **前端端口**：1420
- **API 端口**：3000
- **构建输出**：`src-tauri/target/release/bundle/`

## 技术栈参考

- **前端**：React 19.2.4 + React Router 7.13.0 + Zustand 5.0.11 + Tailwind CSS 4.1.18 + Vite 7.3.1
- **后端**：Tauri 2.9.5 + Rust + SQLite + Prisma + Fastify 5.7.2
- **图片处理**：Sharp 0.34.5
- **QR码**：qrcode.react 4.2.0
