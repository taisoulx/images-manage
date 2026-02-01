# 图片管理软件

一个跨平台图片管理系统，支持万张级图片的高效管理和智能搜索。

## 功能特性

- ✅ 跨平台支持（Windows/macOS）
- ✅ 高性能图片处理和缩略图生成
- ✅ 智能搜索（支持中文）
- ✅ 局域网移动端访问
- ✅ 安全的密码保护
- ✅ 批量上传和进度显示
- ✅ 响应式设计，支持移动端
- ✅ 图片懒加载和虚拟滚动

## 技术栈

### 前端
- React 19.2.4
- React Router 7.13.0
- Zustand 5.0.11（状态管理）
- Tailwind CSS 4.1.18（样式）
- Vite 7.3.1（构建工具）

### 后端
- Tauri 2.9.5（桌面应用框架）
- Rust（后端逻辑）
- SQLite + Prisma（数据库）
- Fastify 5.7.2（API服务器）

### 图片处理
- Sharp 0.34.5（图片处理）

## 开发

### 环境要求

- Node.js 18+
- Rust 1.70+
- pnpm 8+（可选）

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run tauri:dev
```

### 构建生产版本

```bash
npm run tauri:build
```

构建后的应用将位于 `src-tauri/target/release/bundle/` 目录。

## 数据库

### 初始化数据库

```bash
npm run db:generate
npm run db:push
```

### 生成客户端

```bash
npm run db:generate
```

### 数据库迁移

```bash
npm run db:migrate
```

## API服务器

启动API服务器：

```bash
npm run server
```

服务器将在 `http://localhost:3000` 启动。

### API端点

- `GET /health` - 健康检查
- `GET /api/health` - API健康检查
- `GET /api/network` - 获取网络信息（IP地址）

## 默认配置

### 管理员密码

默认密码: `admin`

**注意**: 首次登录后，请修改默认密码。

### 端口

- 前端开发服务器: `http://localhost:1420`
- API服务器: `http://localhost:3000`

## 项目结构

```
images-manage/
├── src/                    # 前端源代码
│   ├── components/         # React组件
│   ├── pages/             # 页面组件
│   ├── stores/            # Zustand状态管理
│   ├── styles/            # 样式文件
│   └── utils/             # 工具函数
├── src-tauri/             # Rust后端
│   ├── src/               # Rust源代码
│   └── icons/             # 应用图标
├── prisma/                # 数据库配置
└── public/                # 静态资源
```

## 开发说明

### 添加新的Tauri命令

1. 在 `src-tauri/src/commands.rs` 中添加命令函数
2. 使用 `#[command]` 宏装饰函数
3. 在 `src-tauri/src/main.rs` 中注册命令
4. 在前端使用 `invoke()` 调用命令

### 添加新的页面

1. 在 `src/pages/` 中创建新组件
2. 在 `src/components/Router.tsx` 中添加路由
3. 在 `src/components/Layout.tsx` 中添加导航链接

## 性能优化

- 图片懒加载：使用 `react-intersection-observer`
- 虚拟滚动：每页加载20张图片
- 缩略图缓存：自动生成多尺寸缩略图
- 代码分割：使用React Router的懒加载

## 安全建议

1. 修改默认管理员密码
2. 定期更新依赖包
3. 不要在公网暴露API服务器
4. 使用HTTPS（生产环境）
5. 定期备份数据库

## 常见问题

### 构建失败

确保已安装所有依赖：
```bash
npm install
cargo build
```

### 数据库错误

重新生成Prisma客户端：
```bash
npm run db:generate
npm run db:push
```

### 图片上传失败

检查图片格式是否支持（JPEG、PNG、WebP）。

## 许可证

MIT License

## 联系方式

如有问题，请提交 Issue。
