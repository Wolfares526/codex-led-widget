# Codex LED Widget

<p align="center">
  <img src="assets/icon/app-icon.png" width="128" alt="Codex LED Widget icon" />
</p>

<p align="center">
  <strong>在 Windows 桌面上随时查看本机 Codex 剩余额度。</strong><br />
  A compact Windows desktop widget for monitoring your local Codex quota.
</p>

<p align="center">
  <a href="https://github.com/Wolfares526/codex-led-widget/releases/latest">下载最新版</a>
  ·
  <a href="#功能">功能</a>
  ·
  <a href="#本地开发">本地开发</a>
  ·
  <a href="#english">English</a>
</p>

---

## 项目简介

Codex LED Widget 是一个轻量的 Windows 桌面悬浮组件。它通过本机 Codex CLI
读取额度状态，以液态玻璃仪表、剩余百分比和红黄绿状态灯展示 5 小时与 7 天窗口。

应用使用本机已有的 Codex 登录状态，不要求手动填写 API Key 或 Token。

## 功能

- 实时显示 5 小时和 7 天额度窗口
- 液位仪展示主要窗口的剩余百分比
- 绿色、黄色、红色 LED 状态提示
- 每 60 秒自动刷新，也可手动刷新
- 显示额度重置倒计时
- 支持窗口置顶、隐藏和系统托盘
- 支持中文与 English 切换
- Windows 任务栏、窗口和托盘图标
- 兼容 Microsoft Store 版 Codex CLI
- 透明液态玻璃风格界面

## 截图

<p align="center">
  <img src="assets/4.png" width="48%" alt="Green quota state" />
  <img src="assets/5.png" width="48%" alt="Red quota state" />
</p>

## 下载

前往 [GitHub Releases](https://github.com/Wolfares526/codex-led-widget/releases/latest)
下载 Windows x64 安装包：

`Codex Quota Widget_0.1.0_x64-setup.exe`

当前版本：`v0.1.0`

> 应用暂未进行代码签名。Windows 首次运行时可能显示“未知发布者”，请确认文件来自本仓库后选择“更多信息” → “仍要运行”。

## 运行要求

- Windows 10 或 Windows 11（x64）
- 已安装 Codex 桌面应用或 Codex CLI
- 已在本机登录 Codex

## 使用方法

1. 从 [Releases](https://github.com/Wolfares526/codex-led-widget/releases/latest) 下载 Windows 安装包。
2. 双击安装包并按提示安装。
3. 启动应用后，小组件默认显示在主屏幕右上角并保持置顶。
4. 使用顶部按钮切换语言、置顶状态、刷新、隐藏或退出。
5. 隐藏后可通过系统托盘重新打开。

## 状态说明

| 状态 | 剩余额度 |
| --- | --- |
| 绿色 | 大于等于 10% |
| 黄色 | 大于 0% 且小于 10% |
| 红色 | 0% |

## 隐私

- 额度通过本机 Codex CLI 读取
- 使用本机现有的 Codex 登录状态
- 不要求用户输入 API Key 或认证 Token
- 不向本项目维护者上传额度或认证数据
- Microsoft Store 版 CLI 如位于受保护目录，会复制到当前用户的本地应用缓存后运行

CLI 兼容缓存位于：

```text
%LOCALAPPDATA%\codex-led-widget\bin
```

诊断日志位于：

```text
%LOCALAPPDATA%\codex-led-widget\quota-service.log
```

日志仅记录 CLI 路径、读取成功状态和错误信息，不记录额度响应或认证信息。

## 本地开发

需要 Node.js 和 pnpm。

```powershell
git clone https://github.com/Wolfares526/codex-led-widget.git
cd codex-led-widget
pnpm install
pnpm run dev
```

构建 Windows 安装包：

```powershell
pnpm run build
```

前端构建产物生成在 `dist/`，Tauri 应用和安装包生成在
`src-tauri/target/release/`，这些目录不会提交到 Git。

## 项目结构

```text
codex-led-widget/
├── assets/                 # 项目截图和打包图标
├── src-tauri/              # Tauri 2 Rust 后端、窗口、托盘和打包配置
├── src/
│   ├── components/         # Vue 3 界面组件
│   ├── composables/        # 额度、语言和窗口状态逻辑
│   ├── styles/             # 界面样式
│   └── types/              # 前后端共享类型
├── package.json
└── pnpm-lock.yaml
```

## 常见问题

### 显示“连接异常”怎么办？

确认 Codex 已安装并登录，然后点击刷新。仍然失败时，请查看：

```text
%LOCALAPPDATA%\codex-led-widget\quota-service.log
```

也可通过 `CODEX_CLI_PATH` 环境变量指定一个可执行的 `codex.exe` 路径。

### 支持 macOS 或 Linux 吗？

当前版本仅构建和测试 Windows x64。

### 为什么安装包没有代码签名？

项目当前未配置 Windows 代码签名证书，因此系统可能显示未知发布者提示。

## 技术栈

- Tauri 2
- Rust
- Vue 3
- TypeScript
- Vite
- pnpm

## 贡献

欢迎提交 [Issue](https://github.com/Wolfares526/codex-led-widget/issues)
或 Pull Request。

## License

MIT

---

## English

Codex LED Widget is a compact Windows desktop widget that reads quota information
from your local Codex CLI and displays the remaining 5-hour and 7-day windows.

### Highlights

- Liquid-glass quota meter
- Green, yellow, and red quota states
- Automatic and manual refresh
- Reset countdowns
- Always-on-top and system tray support
- Chinese and English UI
- Microsoft Store Codex CLI compatibility
- No API key or token entry required

### Download

Download the Windows x64 installer from
[GitHub Releases](https://github.com/Wolfares526/codex-led-widget/releases/latest).

### Requirements

- Windows 10 or Windows 11 x64
- Codex desktop app or Codex CLI installed
- An active local Codex sign-in

### Development

```powershell
git clone https://github.com/Wolfares526/codex-led-widget.git
cd codex-led-widget
pnpm install
pnpm run dev
```

Build:

```powershell
pnpm run build
```

The generated files are written to `dist/`, which is excluded from Git.
Tauri bundles are written to `src-tauri/target/release/bundle/`.
