# 构建和分发指南

## 构建应用

### 开发构建

```bash
npm run tauri:dev
```

### 生产构建

```bash
npm run tauri:build
```

构建完成后，应用将位于：

- **macOS**: `src-tauri/target/release/bundle/macos/`
- **Windows**: `src-tauri/target/release/bundle/nsis/` 或 `src-tauri/target/release/bundle/msi/`

## 分发

### macOS

1. **DMG包**: `.dmg` 文件，直接拖拽到 Applications 文件夹
2. **App包**: `.app` 文件，可直接运行

签名和公证（推荐用于分发）：

```bash
# 签名
codesign --force --deep --sign "Developer ID Application: Your Name" path/to/app

# 公证
xcrun notarytool submit path/to/app --apple-id "your@email.com" --password "app-specific-password" --team-id "TEAMID"
```

### Windows

1. **NSIS安装程序**: `.exe` 文件，包含安装向导
2. **MSI安装程序**: `.msi` 文件，适用于企业部署

### Linux（可选）

目前配置为 macOS 和 Windows，如需支持 Linux，请修改 `tauri.conf.json`：

```json
{
  "bundle": {
    "targets": ["dmg", "nsis", "appimage"]
  }
}
```

## 版本管理

### 更新版本号

1. 更新 `package.json` 中的 `version`
2. 更新 `src-tauri/tauri.conf.json` 中的 `version`
3. 更新 `src-tauri/Cargo.toml` 中的 `version`

### 创建发布标签

```bash
git tag -a v0.1.0 -m "Release version 0.1.0"
git push origin v0.1.0
```

## CI/CD

### GitHub Actions（推荐）

创建 `.github/workflows/build.yml`：

```yaml
name: Build

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        os: [macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - uses: dtolnay/rust-toolchain@stable
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run tauri:build
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.os }}-build
          path: src-tauri/target/release/bundle/
```

## 自动更新

### 配置Tauri Updater

在 `src-tauri/tauri.conf.json` 中添加：

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://releases.your-domain.com/{{target}}/{{current_version}}"
      ],
      "dialog": true,
      "pubkey": "YOUR_PUBLIC_KEY"
    }
  }
}

生成公钥：

```bash
npx tauri signer generate
```

## 打包最佳实践

### 1. 优化应用大小

- 移除未使用的依赖
- 压缩图片资源
- 启用代码分割

### 2. 改善启动速度

- 延迟加载非关键组件
- 使用 Web Workers 处理繁重任务
- 缓存常用数据

### 3. 增强安全性

- 代码签名（所有平台）
- 启用 ASLR（地址空间布局随机化）
- 使用最新的依赖版本

## 分发渠道

### 直接下载

- GitHub Releases
- 官网下载页面

### 应用商店（可选）

- macOS App Store
- Microsoft Store

注意：上架应用商店需要开发者账号和额外的审核流程。

## 常见问题

### 构建超时

增加超时时间：

```bash
# .github/workflows/build.yml
- name: Build
  run: npm run tauri:build
  timeout-minutes: 60
```

### 签名错误

确保证书配置正确：

```bash
# macOS
security find-identity -v -p codesigning

# Windows
certutil -store MY
```

### 安装程序过大

检查是否有不必要的资源文件：

```bash
du -sh src-tauri/target/release/bundle/*/*
```

## 许可证和合规

确保包含所有必要的许可证文件：

- MIT License（项目）
- 第三方库许可证
- 开源声明

## 技术支持

如有问题，请：
1. 查看文档
2. 搜索 GitHub Issues
3. 提交新的 Issue
