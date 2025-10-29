# 🐝 Tab Hive - 快速开始

## 构建并发布 Electron 桌面应用

### 步骤 1: 准备环境

```bash
# 克隆仓库
git clone git@github.com:MaskerPRC/tab-hive.git
cd tab-hive

# 安装依赖
npm install
```

### 步骤 2: 本地测试

```bash
# 启动 Electron 开发模式
npm run electron:dev
```

这将同时启动 Web 开发服务器和 Electron 窗口，你可以实时看到更改。

### 步骤 3: 构建桌面应用

```bash
# 构建当前平台的应用
npm run electron:build

# 或构建特定平台
npm run electron:build:win    # Windows
npm run electron:build:mac    # macOS  
npm run electron:build:linux  # Linux
```

构建完成后，安装包会在 `release/` 目录中：

**Windows:**
- `Tab Hive Setup x.x.x.exe` - 安装程序

**macOS:**
- `Tab Hive-x.x.x.dmg` - 磁盘镜像
- `Tab Hive-x.x.x-arm64.dmg` - Apple Silicon 版本

**Linux:**
- `Tab Hive-x.x.x.AppImage` - 可执行文件

### 步骤 4: 上传到 GitHub Releases

#### 方法 1: 手动上传

1. 在 GitHub 仓库页面点击 "Releases"
2. 点击 "Create a new release"
3. 填写版本号（如 `v0.0.1`）
4. 添加更新日志
5. 将 `release/` 目录下的安装包拖拽上传
6. 发布 Release

#### 方法 2: 自动发布（推荐）

项目已配置 GitHub Actions 自动构建：

```bash
# 创建并推送标签
git tag v0.0.1
git push origin v0.0.1
```

GitHub Actions 会自动：
1. 在 Windows、macOS、Linux 上构建应用
2. 创建 Release
3. 上传所有平台的安装包

### 步骤 5: 用户下载

用户访问 https://github.com/MaskerPRC/tab-hive/releases 即可下载对应平台的安装包。

## 常见问题

### Q: 构建时提示缺少图标？

A: 在 `public/` 目录添加图标文件（可选）：
- `icon.png` (512x512)
- `icon.ico` (Windows)
- `icon.icns` (macOS)

或者忽略警告，使用默认图标。

### Q: macOS 显示 "无法打开，因为它来自身份不明的开发者"？

A: 右键点击应用 → 选择"打开" → 确认打开

### Q: 如何配置应用签名？

A: 编辑 `package.json` 的 `build` 部分，添加证书配置。详见 [electron-builder 文档](https://www.electron.build/code-signing)。

### Q: Windows Defender 报警？

A: 未签名的应用可能被标记。可以申请代码签名证书，或提示用户添加信任。

## 更新版本号

编辑 `package.json`:

```json
{
  "version": "0.0.2"
}
```

然后重新构建即可。

## 下一步

- 查看 [ELECTRON.md](ELECTRON.md) 了解详细配置
- 查看 [README.md](README.md) 了解项目功能
- 提交 Issue 报告问题或建议功能

