<p align="center">
  <img src="src-tauri/icons/icon.png" width="128" height="128" alt="BurnRate icon" />
</p>

<h1 align="center">BurnRate</h1>

<p align="center">
  <strong>驻留在 macOS 菜单栏的订阅支出追踪器。</strong>
</p>

<p align="center">
  <a href="https://github.com/mtskyyy/burnrate/releases/latest">下载</a> ·
  <a href="https://burnrate.run">官网</a> ·
  <a href="./README.md">English</a>
</p>

---

BurnRate 是一款轻量的 macOS 菜单栏应用，实时追踪你的订阅支出。点击菜单栏图标，一眼看清消耗速率——无需管理窗口，无需打开浏览器。

## 功能特性

- **菜单栏常驻** —— 一键即达，从不打扰
- **80+ 预设服务** —— ChatGPT、Netflix、Figma、AWS 等，价格自动填入
- **实时消耗计数** —— 里程表式滚动数字，逐秒展示今日支出
- **分类可视化** —— AI、开发、设计、影音、云服务等多维度支出分布
- **多币种支持** —— USD、CNY、EUR、JPY，实时汇率自动换算
- **预付费追踪** —— 记录云服务充值、预付费服务的充值历史
- **数据导出 / 导入** —— 完整 JSON 备份和恢复，通过系统原生文件对话框
- **中英双语** —— 支持简体中文和英文界面
- **隐私优先** —— 所有数据本地存储于 SQLite，无需账号，不上传云端，不追踪数据

## 安装

从 [**Releases**](https://github.com/mtskyyy/burnrate/releases/latest) 下载最新 `.dmg` 文件。

打开 `.dmg` → 将 BurnRate 拖入「应用程序」文件夹 → 启动。火焰图标出现在菜单栏。

**系统要求：** macOS 12 Monterey 或更高版本 · Apple Silicon (M1+)

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 · TypeScript · Tailwind CSS 4 |
| 后端 | Tauri 2 · Rust |
| 数据库 | SQLite |
| 国际化 | i18next |
| 官网 | Next.js 15 · Framer Motion · Vercel |

## 本地开发

```bash
# 安装依赖
pnpm install

# 开发模式运行
pnpm tauri dev

# 构建生产版本
pnpm tauri build
```

## 项目结构

```
src/                    # React 前端
├── components/         # UI 组件（Panel、BurnCounter、Settings 等）
├── hooks/              # useSubscriptions、useSettings
├── lib/                # 预设服务、分类、格式化、汇率、数据库
├── i18n/               # en.json、zh.json
└── types/              # TypeScript 类型定义

src-tauri/              # Rust 后端
├── src/
│   ├── lib.rs          # 应用初始化、插件注册、系统托盘
│   └── commands.rs     # Tauri IPC 命令
└── Cargo.toml

website/                # 产品落地页
└── src/                # Next.js 15 + Framer Motion
```

## 开源协议

MIT
