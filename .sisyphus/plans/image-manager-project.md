# 跨平台图片管理软件实施计划

## TL;DR

> **快速摘要**: 使用 Tauri + React + TypeScript 构建跨平台图片管理软件，支持万张级图片管理、中文搜索、密码保护和局域网移动访问
> 
> **交付物**: 桌面应用 + 本地API服务 + 移动端Web界面
> - 跨平台桌面应用（Windows/macOS）
> - 高性能图片处理和索引系统
> - 响应式Web界面支持移动访问
> - 安全的局域网访问控制
> 
> **预估工作量**: 大型项目（约3-4周开发周期）
> **并行执行**: 5个执行波次
> **关键路径**: 项目初始化 → 核心架构 → 数据层 → 图片处理 → UI实现

---

## 上下文

### 原始请求
创建一个图片管理软件，具有以下功能：
1) 可以添加图片并且给图片添加信息
2) 添加后可以输入信息进行搜索匹配到图片
3) 软件需要跨平台运行到windows或则macos
4) 最好在这个基础上能够启动一个本地服务,通过二维码可以让局域网的手机扫码访问管理

### 访谈摘要
**关键讨论**：
- 前端框架：用户确认使用 React + TypeScript
- UI框架：选择 Tailwind CSS + shadcn/ui
- 数据规模：万张级，需要强化索引和缓存
- 安全需求：密码保护 + JWT Token认证
- 部署方式：个人/小团队使用

**研究发现**：
- Tauri 2.0 已成熟，支持跨平台开发
- Simple Tokenizer 对中文搜索优化效果好
- Rust nom-exif 提供零拷贝高性能图片处理
- Fastify 与 Tauri 集成度高，适合API服务

### Metis评审
**已识别的差距（已解决）**：
- 缺少数据库迁移策略：已添加 Prisma 迁移任务
- 缺少性能优化细节：已添加虚拟滚动和缓存策略
- 缺少错误处理机制：已添加全局错误处理
- 缺少安全最佳实践：已添加JWT和密码哈希

---

## 工作目标

### 核心目标
构建一个功能完整的跨平台图片管理软件，支持万张级图片的高效管理、智能搜索和安全访问。

### 具体交付物
- Tauri桌面应用程序（Windows/macOS）
- 本地图片数据库和搜索系统
- Fastify API服务
- 响应式Web界面（桌面+移动端）
- QR码访问控制机制

### 完成标准
- [ ] 应用程序可以在Windows和macOS上运行
- [ ] 支持添加、搜索、浏览图片
- [ ] 局域网移动端可通过二维码安全访问
- [ ] 能够处理万张级图片而不影响性能
- [ ] 所有测试通过

### 必须具备
- 跨平台桌面应用（Tauri）
- 高性能图片处理和元数据提取
- SQLite数据库和FTS5全文搜索
- JWT认证的安全API服务
- 响应式Web界面
- QR码生成的移动访问

### 禁止事项（保护栏）
- 不使用Electron（性能要求选择Tauri）
- 不支持视频文件（专注于图片管理）
- 不支持云存储（仅本地管理）
- 不支持多用户系统（个人/小团队使用）
- 不进行实时同步（避免复杂性）

---

## 验证策略

### 测试决策
- **基础设施存在**: 否（需要搭建）
- **用户需要测试**: 是（TDD方法）
- **框架**: Vitest + Testing Library（前端）+ Rust内置测试（后端）

### 启用TDD

每个TODO遵循RED-GREEN-REFACTOR：

**任务结构**：
1. **RED**: 先编写失败的测试
   - 测试文件：`[path].test.ts` 或 `[path].test.rs`
   - 测试命令：`npm test` 或 `cargo test`
   - 预期：FAIL（测试存在，实现不存在）

2. **GREEN**: 实现最少代码使测试通过
   - 命令：`npm test` 或 `cargo test`
   - 预期：PASS

3. **REFACTOR**: 清理代码同时保持绿色
   - 命令：`npm test` 或 `cargo test`
   - 预期：PASS（仍然通过）

**测试设置任务（基础设施不存在时）**：
- [ ] 0. 搭建测试基础设施
  - 前端：配置 Vitest + Testing Library
  - 后端：配置 Rust 测试工具
  - 验证：`npm test` 和 `cargo test` 都可以运行

---

## 执行策略

### 并行执行波次

最大化吞吐量，将独立任务分组到并行波次中：

```
波次1（立即开始）：
├── 任务1：项目初始化和环境配置
├── 任务2：数据库设计和Prisma配置
└── 任务3：Tauri基础架构搭建

波次2（波次1完成后）：
├── 任务4：图片处理模块开发
├── 任务5：API服务器基础搭建
└── 任务6：前端基础组件开发

波次3（波次2完成后）：
├── 任务7：图片上传和元数据提取
├── 任务8：搜索功能实现
└── 任务9：图片浏览界面

波次4（波次3完成后）：
├── 任务10：JWT认证和安全管理
├── 任务11：移动端响应式界面
└── 任务12：QR码访问控制

波次5（波次4完成后）：
├── 任务13：性能优化和缓存
├── 任务14：错误处理和日志
└── 任务15：打包和分发配置

关键路径：任务1 → 任务4 → 任务7 → 任务10 → 任务13
并行加速：约60%比顺序执行更快
```

### 依赖关系矩阵

| 任务 | 依赖 | 阻塞 | 可并行执行 |
|------|------|------|-----------|
| 1 | 无 | 2, 3 | 无 |
| 2 | 1 | 5 | 3, 4 |
| 3 | 1 | 6 | 2, 4 |
| 4 | 1 | 7 | 2, 3 |
| 5 | 2 | 8 | 4, 6 |
| 6 | 3 | 9 | 4, 5 |
| 7 | 4 | 10 | 8, 9 |
| 8 | 5 | 11 | 7, 9 |
| 9 | 6 | 12 | 7, 8 |
| 10 | 7 | 13 | 11, 12 |
| 11 | 8 | 14 | 10, 12 |
| 12 | 9 | 15 | 10, 11 |
| 13 | 10 | 无 | 14, 15 |
| 14 | 11 | 无 | 13, 15 |
| 15 | 12 | 无 | 13, 14 |

### 代理调度摘要

| 波次 | 任务 | 推荐代理类型 |
|------|-------|-------------|
| 1 | 1, 2, 3 | delegate_task(category="quick", load_skills=["frontend-ui-ux"], run_in_background=true) |
| 2 | 4, 5, 6 | 并行执行，波次1完成后开始 |
| 3 | 7, 8, 9 | 并行执行，波次2完成后开始 |
| 4 | 10, 11, 12 | 并行执行，波次3完成后开始 |
| 5 | 13, 14, 15 | 并行执行，波次4完成后开始 |

---

## TODOs

> 实现 + 测试 = 一个任务。绝不分开。
> 每个任务必须包含：推荐的代理配置 + 并行信息。

### 波次1：项目基础（立即开始）

- [ ] 1. 项目初始化和环境配置

  **做什么**：
  - 使用 `create-tauri-app` 初始化 Tauri + React + TypeScript 项目
  - 配置 Tailwind CSS 和 shadcn/ui
  - 设置 ESLint、Prettier、husky
  - 初始化 Git 仓库和基础配置

  **禁止做什么**：
  - 不要在项目初始化时添加任何业务逻辑
  - 不要配置过多的开发工具，保持简洁

  **推荐的代理配置**：
  > 根据任务领域选择category + skills。说明每个选择的原因。
  - **Category**: `quick`
    - 原因：项目初始化是明确的标准流程，需要快速执行
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 包含Tauri项目初始化的最佳实践
  - **已评估但省略的技能**：
    - `playwright`: 此时不需要测试，只是初始化

  **并行化**：
  - **可以并行运行**: 否（这是基础任务）
  - **并行组**: 顺序执行
  - **阻塞**: 任务2（数据库设计）、任务3（Tauri架构）
  - **被阻塞**: 无（可以立即开始）

  **参考**（关键 - 全面覆盖）：

  > 执行代理没有访谈上下文。参考是他们唯一的指南。
  > 每个参考必须回答："看什么以及为什么"

  **模式参考**（遵循现有代码）：
  - 官方 create-tauri-app 文档 - 标准项目初始化流程
  - Tailwind CSS + Tauri 集成指南 - 样式配置模式
  - shadcn/ui 安装指南 - 组件库配置

  **API/类型参考**（实现的合约）：
  - Tauri 2.0 configuration schema - 必需的配置项
  - TypeScript 配置最佳实践 - 类型安全配置

  **测试参考**（测试模式）：
  - Tauri + Vitest 集成示例 - 测试环境配置

  **文档参考**（规格和需求）：
  - Tauri 官方快速开始指南 - 标准流程
  - 用户确认的技术栈决策文档

  **外部参考**（库和框架）：
  - 官方文档：`https://tauri.app/v1/guides/getting-started/setup` - 初始化步骤
  - 安装指南：`https://ui.shadcn.com/docs/installation` - shadcn/ui配置

  **为什么每个参考重要**（解释相关性）：
  - 不要只列出文件 - 解释代理应该提取什么模式/信息
  - 差：`src/utils.ts`（模糊，哪个工具？为什么？）
  - 好：`Tauri配置文档` - 了解最小必需配置和最佳实践

  **验收标准**：

  > **关键：代理可执行验证**
  >
  > - 验收 = 代理执行，不是"用户检查是否工作"
  > - 每个标准必须可通过运行命令或使用工具验证
  > - 没有"[占位符]" - 用实际值替换

  **启用TDD**：
  - [ ] 测试文件创建：tests/setup.test.ts
  - [ ] 测试覆盖：项目初始化成功，依赖安装正确
  - [ ] npm test → PASS（基础测试通过）

  **自动化验证（始终包含）**：

  **对于前端/配置更改**：
  ```bash
  # 代理执行：
  npm run tauri dev
  # 等待：开发服务器启动
  # 断言：应用程序窗口打开，控制台无错误
  # 截图：.sisyphus/evidence/task-1-dev-server.png
  ```

  **对于配置/环境更改**（使用Bash）：
  ```bash
  # 代理运行：
  git status
  # 断言：显示已初始化的Git仓库
  npm list --depth=0
  # 断言：包含tauri、react、typescript依赖
  ```

  **要捕获的证据**：
  - [ ] 验证命令的终端输出（实际输出，不是预期）
  - [ ] 开发服务器运行的截图
  - [ ] package.json 的依赖列表

  **提交**: YES（与1组）
  - 消息: `feat: initialize Tauri + React + TypeScript project`
  - 文件: `package.json`, `src/`, `src-tauri/`
  - 提交前: `npm run type-check`

- [ ] 2. 数据库设计和Prisma配置

  **做什么**：
  - 设计支持万张级图片的SQLite数据库架构
  - 配置 Prisma ORM 和数据库迁移
  - 实现FTS5全文搜索表
  - 创建测试数据库种子数据

  **禁止做什么**：
  - 不要在主数据库中存储敏感信息明文
  - 不要忽略索引设计，这对万张级数据至关重要

  **推荐的代理配置**：
  - **Category**: `quick`
    - 原因：数据库设计是明确的架构任务
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 包含数据库设计和Prisma配置经验

  **并行化**：
  - **可以并行运行**: 是
  - **并行组**: 波次1（与任务1和任务3）
  - **阻塞**: 任务5（API服务器）
  - **被阻塞**: 任务1（项目初始化）

  **参考**：
  **模式参考**：
  - `数据库设计文档` - 需要查看的目标架构
  - `Prisma SQLite集成指南` - 配置模式

  **API/类型参考**：
  - `Prisma schema语法` - 数据库定义DSL
  - `SQLite FTS5文档` - 全文搜索配置

  **测试参考**：
  - `Prisma测试最佳实践` - 测试数据库设置

  **文档参考**：
  - `SQLite索引优化指南` - 万张级性能
  - `FTS5配置文档` - 搜索功能需求

  **外部参考**：
  - 官方文档：`https://www.prisma.io/docs/getting-started/setup-prisma/add-to-existing-project` - Prisma配置
  - 示例：`https://github.com/prisma/prisma-examples/tree/latest/sqlite/typescript-rest` - SQLite集成

  **验收标准**：
  **启用TDD**：
  - [ ] 测试文件创建：tests/database.test.ts
  - [ ] 测试覆盖：数据库迁移成功，索引创建正确
  - [ ] npm test tests/database.test.ts → PASS

  **自动化验证**：
  ```bash
  # 代理运行：
  npx prisma migrate dev --name init
  # 断言：迁移成功，数据库文件创建
  npx prisma db seed
  # 断言：种子数据插入成功
  ```

  **要捕获的证据**：
  - [ ] Prisma schema文件内容
  - [ ] 数据库迁移输出
  - [ ] 测试数据库的查询结果

  **提交**: YES（与2组）
  - 消息: `feat: configure Prisma ORM and database schema`
  - 文件: `prisma/schema.prisma`, `prisma/migrations/`
  - 提交前: `npx prisma validate`

- [ ] 3. Tauri基础架构搭建

  **做什么**：
  - 配置 Tauri 能力文件和权限系统
  - 设置 Rust 项目结构和模块划分
  - 实现前端与后端的通信桥梁
  - 配置开发环境的热重载

  **禁止做什么**：
  - 不要过早添加复杂的Tauri能力配置
  - 不要混淆前端和后端的职责边界

  **推荐的代理配置**：
  - **Category**: `quick`
    - 原因：Tauri架构配置有标准模式
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 了解Tauri架构最佳实践

  **并行化**：
  - **可以并行运行**: 是
  - **并行组**: 波次1（与任务1和任务2）
  - **阻塞**: 任务4（图片处理）、任务6（前端组件）
  - **被阻塞**: 任务1（项目初始化）

  **参考**：
  **模式参考**：
  - `Tauri 2.0能力文件示例` - 权限配置模式
  - `Rust模块结构指南` - 代码组织

  **API/类型参考**：
  - `Tauri命令API文档` - 前后端通信接口
  - `Rust-Cargo配置` - 依赖管理

  **测试参考**：
  - `Tauri单元测试示例` - Rust测试设置

  **文档参考**：
  - `Tauri架构指南` - 推荐的项目结构
  - `能力系统文档` - 安全配置

  **外部参考**：
  - 官方文档：`https://tauri.app/v1/guides/architecture/` - 架构概览
  - 示例：`https://github.com/tauri-apps/tauri/tree/dev/examples/api` - 完整示例

  **验收标准**：
  **启用TDD**：
  - [ ] 测试文件创建：src-tauri/src/lib.test.rs
  - [ ] 测试覆盖：Tauri命令注册成功，通信正常
  - [ ] cargo test → PASS

  **自动化验证**：
  ```bash
  # 代理运行：
  npm run tauri dev
  # 在前端控制台执行：
  # await invoke('ping_command')
  # 断言：返回"pong"
  ```

  **要捕获的证据**：
  - [ ] Tauri命令通信日志
  - [ ] 能力文件配置内容
  - [ ] 开发环境热重载效果

  **提交**: YES（与3组）
  - 消息: `feat: setup Tauri architecture and command system`
  - 文件: `src-tauri/src/main.rs`, `src-tauri/capabilities/`
  - 提交前: `cargo check`

### 波次2：核心模块（波次1完成后）

- [ ] 4. 图片处理模块开发

  **做什么**：
  - 实现 Rust 端图片元数据提取（nom-exif）
  - 配置 Sharp 进行前端图片处理
  - 实现缩略图生成和缓存策略
  - 添加图片格式支持和验证

  **禁止做什么**：
  - 不要处理所有图片格式，优先支持 JPEG/PNG/WebP
  - 不要在主线程进行大量图片处理

  **推荐的代理配置**：
  - **Category**: `visual-engineering`
    - 原因：图片处理涉及大量视觉数据和性能优化
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 了解图片处理和性能优化最佳实践
  - **已评估但省略的技能**：
    - `playwright`: 不需要浏览器自动化

  **并行化**：
  - **可以并行运行**: 是
  - **并行组**: 波次2（与任务5和任务6）
  - **阻塞**: 任务7（图片上传）
  - **被阻塞**: 任务3（Tauri架构）

  **参考**：
  **模式参考**：
  - `nom-exif使用示例` - 零拷贝元数据提取模式
  - `Sharp处理管道` - 图片处理最佳实践

  **API/类型参考**：
  - `Rust nom-exif API` - 元数据提取接口
  - `Sharp文档` - 图片处理API

  **测试参考**：
  - `Rust图片处理测试` - 错误处理和边界情况

  **文档参考**：
  - `图片格式规范` - 支持的格式标准
  - `缓存策略文档` - 性能优化指南

  **外部参考**：
  - 官方文档：`https://docs.rs/nom-exif/latest/nom_exif/` - nom-exif API
  - 示例：`https://sharp.pixelplumbing.com/` - Sharp使用示例

  **验收标准**：
  **启用TDD**：
  - [ ] 测试文件创建：src-tauri/src/image.test.rs
  - [ ] 测试覆盖：元数据提取准确，缩略图生成正确
  - [ ] cargo test image → PASS

  **自动化验证**：
  ```bash
  # 代理运行：
  # 创建测试图片
  echo "test" > test.jpg
  # 运行元数据提取
  cargo run --bin extract_metadata test.jpg
  # 断言：输出包含基本信息
  ```

  **要捕获的证据**：
  - [ ] 元数据提取输出示例
  - [ ] 缩略图生成结果
  - [ ] 性能测试数据

  **提交**: YES（与4组）
  - 消息: `feat: implement image processing with metadata extraction`
  - 文件: `src-tauri/src/image.rs`, `src/utils/imageUtils.ts`
  - 提交前: `cargo test image && npm test`

- [ ] 5. API服务器基础搭建

  **做什么**：
  - 配置 Fastify 服务器和基础路由
  - 实现 RESTful API 结构
  - 添加中间件（CORS、日志、错误处理）
  - 配置 API 文档生成

  **禁止做什么**：
  - 不要在API中实现业务逻辑，只提供基础框架
  - 不要忽略安全头设置

  **推荐的代理配置**：
  - **Category**: `quick`
    - 原因：API服务器配置有标准模式
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 了解API设计和Fastify最佳实践

  **并行化**：
  - **可以并行运行**: 是
  - **并行组**: 波次2（与任务4和任务6）
  - **阻塞**: 任务8（搜索功能）
  - **被阻塞**: 任务2（数据库）

  **参考**：
  **模式参考**：
  - `Fastify最佳实践` - 服务器配置模式
  - `RESTful API设计指南` - 路由结构

  **API/类型参考**：
  - `Fastify路由API` - 路由定义接口
  - `HTTP状态码规范` - 响应标准

  **测试参考**：
  - `Fastify测试示例` - API测试模式

  **文档参考**：
  - `API设计原则` - 一致的接口设计
  - `安全头配置指南` - 基础安全措施

  **外部参考**：
  - 官方文档：`https://www.fastify.io/docs/latest/` - Fastify完整文档
  - 示例：`https://github.com/fastify/fastify-example` - 完整示例项目

  **验收标准**：
  **启用TDD**：
  - [ ] 测试文件创建：tests/api.test.ts
  - [ ] 测试覆盖：基础路由响应正确，中间件工作正常
  - [ ] npm test tests/api.test.ts → PASS

  **自动化验证**：
  ```bash
  # 代理运行：
  npm run dev:api
  # 测试基础端点
  curl -s http://localhost:3000/api/health | jq .
  # 断言：返回健康状态
  ```

  **要捕获的证据**：
  - [ ] API端点响应示例
  - [ ] 中间件日志输出
  - [ ] API文档页面截图

  **提交**: YES（与5组）
  - 消息: `feat: setup Fastify API server with basic routes`
  - 文件: `src-tauri/src/server.rs`, `src/routes/`
  - 提交前: `cargo test server && npm test`

- [ ] 6. 前端基础组件开发

  **做什么**：
  - 使用 shadcn/ui 创建基础UI组件
  - 实现应用布局和导航
  - 配置 React Router 和状态管理（Zustand）
  - 设置全局样式和主题

  **禁止做什么**：
  - 不要过度自定义 shadcn/ui 组件，先使用默认样式
  - 不要在没有布局的情况下直接开发具体功能

  **推荐的代理配置**：
  - **Category**: `visual-engineering`
    - 原因：UI组件开发需要设计和视觉考量
  - **Skills**: [`frontend-ui-ux`, `frontend-design`]
    - `frontend-ui-ux`: 了解shadcn/ui和React组件模式
    - `frontend-design`: 创建独特的、高质量的生产级界面
  - **已评估但省略的技能**：
    - `playwright`: 此时不需要浏览器测试

  **并行化**：
  - **可以并行运行**: 是
  - **并行组**: 波次2（与任务4和任务5）
  - **阻塞**: 任务9（图片浏览界面）
  - **被阻塞**: 任务3（Tauri架构）

  **参考**：
  **模式参考**：
  - `shadcn/ui组件示例` - 组件使用模式
  - `React Router配置` - 路由设置最佳实践

  **API/类型参考**：
  - `Zustand状态管理API` - 状态管理接口
  - `Tailwind CSS类参考` - 样式系统

  **测试参考**：
  - `React组件测试示例` - 组件测试模式

  **文档参考**：
  - `应用布局设计指南` - UI/UX最佳实践
  - `响应式设计原则` - 移动端适配

  **外部参考**：
  - 官方文档：`https://ui.shadcn.com/docs/components` - 组件库
  - 示例：`https://github.com/shadcn-ui/ui` - 完整组件示例

  **验收标准**：
  **启用TDD**：
  - [ ] 测试文件创建：src/components/__tests__/Layout.test.tsx
  - [ ] 测试覆盖：组件渲染正确，路由导航正常
  - [ ] npm test src/components/__tests__/Layout.test.tsx → PASS

  **自动化验证**：
  ```bash
  # 代理运行：
  npm run dev
  # 截图：应用主界面
  # 断言：布局正确，导航可用
  ```

  **要捕获的证据**：
  - [ ] 组件渲染截图
  - [ ] 路由导航日志
  - [ ] 样式检查输出

  **提交**: YES（与6组）
  - 消息: `feat: create frontend base components and layout`
  - 文件: `src/components/`, `src/pages/`, `src/App.tsx`
  - 提交前: `npm run type-check && npm test`

### 波次3：核心功能（波次2完成后）

- [ ] 7. 图片上传和元数据提取

  **做什么**：
  - 实现文件选择和拖拽上传功能
  - 集成图片元数据提取（EXIF、GPS等）
  - 实现批量上传和进度显示
  - 添加图片信息编辑界面

  **禁止做什么**：
  - 不要支持所有文件格式，限制为常见图片格式
  - 不要在上传时阻塞主线程

  **推荐的代理配置**：
  - **Category**: `visual-engineering`
    - 原因：上传界面和元数据显示需要良好的UI设计
  - **Skills**: [`frontend-ui-ux`, `frontend-design`]
    - `frontend-ui-ux`: 了解文件上传和元数据处理
    - `frontend-design`: 创建直观的上传体验

  **并行化**：
  - **可以并行运行**: 是
  - **并行组**: 波次3（与任务8和任务9）
  - **阻塞**: 任务10（安全认证）
  - **被阻塞**: 任务4（图片处理）、任务6（前端组件）

  **参考**：
  **模式参考**：
  - `文件上传最佳实践` - 上传流程设计
  - `元数据显示界面` - 信息展示模式

  **API/类型参考**：
  - `File API文档` - 文件处理接口
  - `Tauri文件系统API` - 本地文件操作

  **测试参考**：
  - `上传功能测试示例` - 错误处理和边界情况

  **文档参考**：
  - `EXIF标准文档` - 元数据格式
  - `批量处理指南` - 性能优化策略

  **外部参考**：
  - 官方文档：`https://developer.mozilla.org/en-US/docs/Web/API/File` - File API
  - 示例：`https://github.com/tauri-apps/tauri/tree/dev/examples/file-system` - Tauri文件操作

  **验收标准**：
  **启用TDD**：
  - [ ] 测试文件创建：src/pages/Upload.test.tsx
  - [ ] 测试覆盖：上传功能正常，元数据提取准确
  - [ ] npm test src/pages/Upload.test.tsx → PASS

  **自动化验证**：
  ```bash
  # 代理运行：
  npm run dev
  # 模拟文件上传
  # 断言：图片成功上传，元数据显示正确
  ```

  **要捕获的证据**：
  - [ ] 上传过程截图
  - [ ] 元数据提取输出
  - [ ] 批量上传性能数据

  **提交**: YES（与7组）
  - 消息: `feat: implement image upload with metadata extraction`
  - 文件: `src/pages/Upload.tsx`, `src-tauri/src/upload.rs`
  - 提交前: `npm test && cargo test`

- [ ] 8. 搜索功能实现

  **做什么**：
  - 实现 SQLite FTS5 全文搜索
  - 配置 Simple Tokenizer 支持中文搜索
  - 创建搜索界面和筛选器
  - 实现搜索结果高亮和分页

  **禁止做什么**：
  - 不要忽略搜索性能优化，万张级数据需要考虑
  - 不要使用简单的LIKE查询，必须使用FTS5

  **推荐的代理配置**：
  - **Category**: `quick`
    - 原因：搜索功能实现有明确的技术方案
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 了解搜索UI和FTS5配置

  **并行化**：
  - **可以并行运行**: 是
  - **并行组**: 波次3（与任务7和任务9）
  - **阻塞**: 任务11（移动端界面）
  - **被阻塞**: 任务5（API服务器）、任务2（数据库）

  **参考**：
  **模式参考**：
  - `SQLite FTS5使用示例` - 全文搜索配置
  - `搜索UI最佳实践` - 用户界面设计

  **API/类型参考**：
  - `FTS5查询语法` - 搜索语句格式
  - `Simple Tokenizer API` - 中文分词接口

  **测试参考**：
  - `搜索功能测试` - 查询准确性验证

  **文档参考**：
  - `全文搜索优化指南` - 性能调优
  - `中文搜索最佳实践` - 多语言支持

  **外部参考**：
  - 官方文档：`https://www.sqlite.org/fts5.html` - SQLite FTS5
  - 示例：`https://github.com/wangfenjin/simple` - Simple Tokenizer

  **验收标准**：
  **启用TDD**：
  - [ ] 测试文件创建：src/pages/Search.test.tsx
  - [ ] 测试覆盖：搜索结果准确，中文支持正常
  - [ ] npm test src/pages/Search.test.tsx → PASS

  **自动化验证**：
  ```bash
  # 代理运行：
  # 插入测试数据
  # 执行搜索查询
  # 断言：返回正确结果，包含中文测试
  ```

  **要捕获的证据**：
  - [ ] 搜索结果示例
  - [ ] 性能测试数据
  - [ ] 中文搜索验证

  **提交**: YES（与8组）
  - 消息: `feat: implement FTS5 full-text search with Chinese support`
  - 文件: `src/pages/Search.tsx`, `src-tauri/src/search.rs`
  - 提交前: `npm test && cargo test`

- [ ] 9. 图片浏览界面

  **做什么**：
  - 实现网格和列表视图切换
  - 创建瀑布流布局支持大量图片
  - 实现虚拟滚动优化性能
  - 添加图片预览和详细信息查看

  **禁止做什么**：
  - 不要忽略移动端适配
  - 不要在网格中一次性加载所有图片

  **推荐的代理配置**：
  - **Category**: `visual-engineering`
    - 原因：图片浏览界面需要优秀的视觉设计和用户体验
  - **Skills**: [`frontend-ui-ux`, `frontend-design`]
    - `frontend-ui-ux`: 了解虚拟滚动和响应式设计
    - `frontend-design`: 创建生产级的高质量界面

  **并行化**：
  - **可以并行运行**: 是
  - **并行组**: 波次3（与任务7和任务8）
  - **阻塞**: 任务12（QR码访问）
  - **被阻塞**: 任务6（前端组件）、任务2（数据库）

  **参考**：
  **模式参考**：
  - `瀑布流布局实现` - CSS Grid最佳实践
  - `虚拟滚动组件示例` - 性能优化技术

  **API/类型参考**：
  - `React Intersection Observer` - 懒加载实现
  - `CSS Grid布局API` - 网格系统

  **测试参考**：
  - `虚拟滚动性能测试` - 大量数据处理

  **文档参考**：
  - `图片浏览设计指南` - 用户界面模式
  - `性能优化最佳实践` - 大数据渲染

  **外部参考**：
  - 官方文档：`https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API` - Intersection Observer
  - 示例：`https://github.com/bvaughn/react-window` - 虚拟滚动库

  **验收标准**：
  **启用TDD**：
  - [ ] 测试文件创建：src/components/Gallery.test.tsx
  - [ ] 测试覆盖：渲染性能正常，视图切换正确
  - [ ] npm test src/components/Gallery.test.tsx → PASS

  **自动化验证**：
  ```bash
  # 代理运行：
  npm run dev
  # 加载1000+测试图片
  # 测试滚动性能
  # 断言：界面流畅，无卡顿
  ```

  **要捕获的证据**：
  - [ ] 图片浏览界面截图
  - [ ] 虚拟滚动性能数据
  - [ ] 视图切换动画效果

  **提交**: YES（与9组）
  - 消息: `feat: create image gallery with virtual scrolling`
  - 文件: `src/components/Gallery.tsx`, `src/components/ImageCard.tsx`
  - 提交前: `npm run type-check && npm test`

### 波次4：安全和移动端（波次3完成后）

- [ ] 10. JWT认证和安全管理

  **做什么**：
  - 实现 JWT Token 生成和验证
  - 添加密码哈希存储（bcrypt）
  - 配置 API 访问控制中间件
  - 实现会话管理和超时机制

  **禁止做什么**：
  - 不要在Token中存储敏感信息
  - 不要使用弱密码策略

  **推荐的代理配置**：
  - **Category**: `quick`
    - 原因：安全认证有成熟的标准实现
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 了解JWT和安全最佳实践

  **并行化**：
  - **可以并行运行**: 是
  - **并行组**: 波次4（与任务11和任务12）
  - **阻塞**: 任务13（性能优化）
  - **被阻塞**: 任务7（图片上传）、任务5（API服务器）

  **参考**：
  **模式参考**：
  - `JWT最佳实践` - Token管理标准
  - `密码安全指南` - 存储和验证流程

  **API/类型参考**：
  - `JWT规范文档` - Token格式标准
  - `bcrypt API` - 密码哈希接口

  **测试参考**：
  - `认证测试套件** - 安全性验证

  **文档参考**：
  - `OWASP安全指南` - 安全最佳实践
  - `会话管理策略` - 用户体验平衡

  **外部参考**：
  - 官方文档：`https://jwt.io/` - JWT标准和工具
  - 示例：`https://github.com/kelektiv/node.bcrypt.js` - bcrypt使用示例

  **验收标准**：
  **启用TDD**：
  - [ ] 测试文件创建：tests/auth.test.ts
  - [ ] 测试覆盖：认证流程正确，密码存储安全
  - [ ] npm test tests/auth.test.ts → PASS

  **自动化验证**：
  ```bash
  # 代理运行：
  # 测试登录流程
  # 验证Token生成和解析
  # 断言：认证正常，无安全漏洞
  ```

  **要捕获的证据**：
  - [ ] 认证流程日志
  - [ ] Token验证测试结果
  - [ ] 安全检查报告

  **提交**: YES（与10组）
  - 消息: `feat: implement JWT authentication and security`
  - 文件: `src-tauri/src/auth.rs`, `src/middleware/auth.js`
  - 提交前: `npm test && cargo test`

- [ ] 11. 移动端响应式界面

  **做什么**：
  - 优化所有界面支持移动设备
  - 实现触摸手势和操作
  - 调整布局和交互为小屏幕优化
  - 添加移动端专属功能（拍照上传等）

  **禁止做什么**：
  - 不要忽略触摸目标的44px最小尺寸
  - 不要在移动端使用桌面交互模式

  **推荐的代理配置**：
  - **Category**: `visual-engineering`
    - 原因：移动端UI需要专门的视觉和交互设计
  - **Skills**: [`frontend-ui-ux`, `frontend-design`]
    - `frontend-ui-ux`: 了解移动端响应式设计和触摸交互
    - `frontend-design`: 创建高质量的移动端体验

  **并行化**：
  - **可以并行运行**: 是
  - **并行组**: 波次4（与任务10和任务12）
  - **阻塞**: 任务14（错误处理）
  - **被阻塞**: 任务8（搜索功能）、任务9（图片浏览）

  **参考**：
  **模式参考**：
  - `移动端响应式设计` - 媒体查询和布局
  - `触摸交互最佳实践` - 手势和反馈

  **API/类型参考**：
  - `Touch Events API` - 触摸事件处理
  - `Viewport Meta Tag` - 移动端配置

  **测试参考**：
  - `移动端兼容性测试` - 多设备验证

  **文档参考**：
  - `移动端UI指南` - 设计原则
  - `触摸交互设计` - 用户体验优化

  **外部参考**：
  - 官方文档：`https://developer.mozilla.org/en-US/docs/Web/API/Touch_events` - Touch Events
  - 示例：`https://github.com/developit/preact-移动端示例` - 移动端最佳实践

  **验收标准**：
  **启用TDD**：
  - [ ] 测试文件创建：src/components/__tests__/MobileView.test.tsx
  - [ ] 测试覆盖：触摸响应正常，布局适配正确
  - [ ] npm test src/components/__tests__/MobileView.test.tsx → PASS

  **自动化验证**：
  ```bash
  # 代理使用playwright测试：
  # 在移动端viewport下测试所有功能
  # 断言：触摸操作正常，无布局问题
  ```

  **要捕获的证据**：
  - [ ] 移动端界面截图
  - [ ] 触摸交互测试视频
  - [ ] 响应式布局检查报告

  **提交**: YES（与11组）
  - 消息: `feat: optimize UI for mobile devices with touch support`
  - 文件: `src/styles/mobile.css`, `src/components/MobileView.tsx`
  - 提交前: `npm run type-check && npm test`

- [ ] 12. QR码访问控制

  **做什么**：
  - 实现 QR 码生成功能
  - 添加局域网IP自动获取
  - 配置一次性访问Token机制
  - 创建移动端访问界面

  **禁止做什么**：
  - 不要忽略端口冲突检测
  - 不要暴露过多的网络信息

  **推荐的代理配置**：
  - **Category**: `quick`
    - 原因：QR码生成有标准库支持
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 了解QR码生成和网络配置

  **并行化**：
  - **可以并行运行**: 是
  - **并行组**: 波次4（与任务10和任务11）
  - **阻塞**: 任务15（打包分发）
  - **被阻塞**: 任务9（图片浏览）、任务10（JWT认证）

  **参考**：
  **模式参考**：
  - `QR码生成最佳实践` - 安全编码方式
  - `网络服务发现` - 自动IP获取

  **API/类型参考**：
  - `Node.js网络接口API` - 本地IP获取
  - `QR码库API` - 生成和解析

  **测试参考**：
  - **网络环境测试** - 不同网络配置验证

  **文档参考**：
  - `局域网安全指南` - 访问控制策略
  - **移动端访问流程** - 用户体验设计

  **外部参考**：
  - 官方文档：`https://nodejs.org/api/os.html#os_os_networkinterfaces` - 网络接口API
  - 示例：`https://github.com/soldair/node-qrcode` - QR码生成库

  **验收标准**：
  **启用TDD**：
  - [ ] 测试文件创建：src/components/QRCode.test.tsx
  - [ ] 测试覆盖：QR码生成正确，网络访问正常
  - [ ] npm test src/components/QRCode.test.tsx → PASS

  **自动化验证**：
  ```bash
  # 代理运行：
  npm run dev
  # 生成QR码
  # 扫码测试访问
  # 断言：移动端可正常访问
  ```

  **要捕获的证据**：
  - [ ] QR码生成截图
  - [ ] 移动端访问测试视频
  - [ ] 网络配置日志

  **提交**: YES（与12组）
  - 消息: `feat: implement QR code access for mobile devices`
  - 文件: `src/components/QRCode.tsx`, `src-tauri/src/network.rs`
  - 提交前: `npm test && cargo test`

### 波次5：优化和发布（波次4完成后）

- [ ] 13. 性能优化和缓存

  **做什么**：
  - 实现图片缓存策略（多尺寸缩略图）
  - 优化搜索索引和查询性能
  - 添加懒加载和预加载机制
  - 实现数据库连接池和查询优化

  **禁止做什么**：
  - 不要过度优化，优先优化关键路径
  - 不要忽略内存使用监控

  **推荐的代理配置**：
  - **Category**: `quick`
    - 原因：性能优化有明确的指标和工具
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 了解性能分析和优化技术

  **并行化**：
  - **可以并行运行**: 是
  - **并行组**: 波次5（与任务14和任务15）
  - **阻塞**: 无（最终优化）
  - **被阻塞**: 任务10（JWT认证）

  **参考**：
  **模式参考**：
  - `缓存策略最佳实践` - 多层缓存设计
  - `性能监控指南` - 指标收集和分析

  **API/类型参考**：
  - `SQLite性能调优API` - 查询优化
  - **缓存接口** - 缓存存储策略

  **测试参考**：
  - `性能基准测试` - 优化前后对比

  **文档参考**：
  - `Web性能优化指南` - 前端性能最佳实践
  - `数据库性能调优` - 后端优化策略

  **外部参考**：
  - 官方文档：`https://web.dev/performance/` - Web性能指南
  - 示例：`https://github.com/axios/axios` - 缓存实现示例

  **验收标准**：
  **启用TDD**：
  - [ ] 测试文件创建：tests/performance.test.ts
  - [ ] 测试覆盖：缓存命中率高，查询响应快
  - [ ] npm test tests/performance.test.ts → PASS

  **自动化验证**：
  ```bash
  # 代理运行：
  # 性能基准测试
  # 内存使用监控
  # 断言：性能指标达标
  ```

  **要捕获的证据**：
  - [ ] 性能测试报告
  - [ ] 内存使用图表
  - [ ] 缓存命中率数据

  **提交**: YES（与13组）
  - 消息: `perf: optimize caching and query performance`
  - 文件: `src/utils/cache.ts`, `src-tauri/src/performance.rs`
  - 提交前: `npm test && cargo test`

- [ ] 14. 错误处理和日志

  **做什么**：
  - 实现全局错误处理机制
  - 添加结构化日志系统
  - 创建用户友好的错误消息
  - 配置错误监控和报告

  **禁止做什么**：
  - 不要在日志中记录敏感信息
  - 不要向用户暴露技术错误详情

  **推荐的代理配置**：
  - **Category**: `quick`
    - 原因：错误处理有标准的模式和实践
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 了解错误处理和日志最佳实践

  **并行化**：
  - **可以并行运行**: 是
  - **并行组**: 波次5（与任务13和任务15）
  - **阻塞**: 无（最终完善）
  - **被阻塞**: 任务11（移动端界面）

  **参考**：
  **模式参考**：
  - `错误边界模式` - React错误处理
  - `结构化日志标准` - 日志格式规范

  **API/类型参考**：
  - `Error对象API` - 错误处理接口
  - `日志库API` - 日志记录功能

  **测试参考**：
  - `错误处理测试套件` - 边界情况覆盖

  **文档参考**：
  - **用户体验指南** - 错误消息设计
  - **日志安全实践** - 数据保护

  **外部参考**：
  - 官方文档：`https://reactjs.org/docs/error-boundaries.html` - React错误边界
  - 示例：`https://github.com/winstonjs/winston` - 日志库示例

  **验收标准**：
  **启用TDD**：
  - [ ] 测试文件创建：src/components/__tests__/ErrorBoundary.test.tsx
  - [ ] 测试覆盖：错误捕获正常，日志记录完整
  - [ ] npm test src/components/__tests__/ErrorBoundary.test.tsx → PASS

  **自动化验证**：
  ```bash
  # 代理运行：
  # 触发各种错误情况
  # 检查日志输出
  # 断言：错误处理正确，无信息泄露
  ```

  **要捕获的证据**：
  - [ ] 错误界面截图
  - [ ] 日志输出示例
  - [ ] 错误处理测试报告

  **提交**: YES（与14组）
  - 消息: `feat: implement global error handling and logging`
  - 文件: `src/components/ErrorBoundary.tsx`, `src/utils/logger.ts`
  - 提交前: `npm test && cargo test`

- [ ] 15. 打包和分发配置

  **做什么**：
  - 配置 Tauri 构建和打包
  - 设置应用签名和公证
  - 创建安装程序和更新机制
  - 配置不同平台的构建流程

  **禁止做什么**：
  - 不要忽略平台的特定要求
  - 不要分发未测试的构建版本

  **推荐的代理配置**：
  - **Category**: `quick`
    - 原因：打包配置有明确的流程和工具
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: 了解Tauri打包和分发流程

  **并行化**：
  - **可以并行运行**: 是
  - **并行组**: 波次5（与任务13和任务14）
  - **阻塞**: 无（最终交付）
  - **被阻塞**: 任务12（QR码访问）

  **参考**：
  **模式参考**：
  - `Tauri构建指南` - 打包流程最佳实践
  - **应用分发策略** - 多平台部署

  **API/类型参考**：
  - `Tauri配置API` - 构建选项
  - **CI/CD配置** - 自动化部署

  **测试参考**：
  - **构建验证测试** - 安装和运行验证

  **文档参考**：
  - **应用签名指南** - 安全分发
  - **更新机制设计** - 用户体验优化

  **外部参考**：
  - 官方文档：`https://tauri.app/v1/guides/building/` - Tauri构建
  - 示例：`https://github.com/tauri-apps/tauri/tree/dev/examples/api` - 完整构建示例

  **验收标准**：
  **启用TDD**：
  - [ ] 测试文件创建：tests/build.test.ts
  - [ ] 测试覆盖：构建成功，安装正常，应用启动
  - [ ] npm test tests/build.test.ts → PASS

  **自动化验证**：
  ```bash
  # 代理运行：
  npm run tauri build
  # 测试安装包
  # 断言：应用正常运行
  ```

  **要捕获的证据**：
  - [ ] 构建输出截图
  - [ ] 安装包文件列表
  - [ ] 应用运行测试视频

  **提交**: YES（与15组）
  - 消息: `build: configure packaging and distribution`
  - 文件: `src-tauri/tauri.conf.json`, `.github/workflows/`
  - 提交前: `npm run build && cargo test`

---

## 提交策略

| 任务后 | 消息 | 文件 | 验证 |
|-------|------|------|------|
| 1 | `feat: initialize Tauri + React + TypeScript project` | package.json, src/, src-tauri/ | npm run type-check |
| 2 | `feat: configure Prisma ORM and database schema` | prisma/schema.prisma, prisma/migrations/ | npx prisma validate |
| 3 | `feat: setup Tauri architecture and command system` | src-tauri/src/main.rs, src-tauri/capabilities/ | cargo check |
| 4 | `feat: implement image processing with metadata extraction` | src-tauri/src/image.rs, src/utils/imageUtils.ts | cargo test image && npm test |
| 5 | `feat: setup Fastify API server with basic routes` | src-tauri/src/server.rs, src/routes/ | cargo test server && npm test |
| 6 | `feat: create frontend base components and layout` | src/components/, src/pages/, src/App.tsx | npm run type-check && npm test |
| 7 | `feat: implement image upload with metadata extraction` | src/pages/Upload.tsx, src-tauri/src/upload.rs | npm test && cargo test |
| 8 | `feat: implement FTS5 full-text search with Chinese support` | src/pages/Search.tsx, src-tauri/src/search.rs | npm test && cargo test |
| 9 | `feat: create image gallery with virtual scrolling` | src/components/Gallery.tsx, src/components/ImageCard.tsx | npm run type-check && npm test |
| 10 | `feat: implement JWT authentication and security` | src-tauri/src/auth.rs, src/middleware/auth.js | npm test && cargo test |
| 11 | `feat: optimize UI for mobile devices with touch support` | src/styles/mobile.css, src/components/MobileView.tsx | npm run type-check && npm test |
| 12 | `feat: implement QR code access for mobile devices` | src/components/QRCode.tsx, src-tauri/src/network.rs | npm test && cargo test |
| 13 | `perf: optimize caching and query performance` | src/utils/cache.ts, src-tauri/src/performance.rs | npm test && cargo test |
| 14 | `feat: implement global error handling and logging` | src/components/ErrorBoundary.tsx, src/utils/logger.ts | npm test && cargo test |
| 15 | `build: configure packaging and distribution` | src-tauri/tauri.conf.json, .github/workflows/ | npm run build && cargo test |

---

## 成功标准

### 验证命令
```bash
# 项目初始化验证
npm run tauri dev  # 应用启动，无错误

# 数据库验证
npx prisma db seed  # 种子数据成功插入

# 图片处理验证
cargo test image -- --nocapture  # 所有图片测试通过

# API验证
npm run dev:api && curl -s http://localhost:3000/api/health  # 健康检查正常

# 前端验证
npm run build  # 构建成功，无警告

# 搜索验证
# 插入1000+测试图片，搜索响应<500ms

# 移动端验证
# 在移动设备上扫描QR码，功能正常

# 性能验证
# 处理1000+图片，内存使用<200MB

# 安全验证
# JWT认证正常，无安全漏洞

# 打包验证
npm run tauri build  # 生成安装包
```

### 最终检查清单
- [ ] 所有"Must Have"功能已实现
- [ ] 所有"Must NOT Have"已避免
- [ ] 万张级图片性能达标
- [ ] 中文搜索功能正常
- [ ] 移动端访问体验良好
- [ ] 安全认证机制有效
- [ ] 跨平台打包成功
- [ ] 所有测试通过
- [ ] 代码质量达标
- [ ] 文档完整