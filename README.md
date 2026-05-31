<p align="center">
  <img src="src-tauri/icons/icon.png" width="128" height="128" alt="BurnRate icon" />
</p>

<h1 align="center">BurnRate</h1>

<p align="center">
  <strong>住在 macOS 菜单栏里的订阅管家 —— 让每一笔订阅支出无所遁形。</strong>
</p>

<p align="center">
  <a href="https://github.com/mtskyyy/burnrate/releases/latest">下载</a> ·
  <a href="https://burnrate.run">官网 &amp; 在线体验</a> ·
  <a href="./README.en.md">English</a>
</p>

---

ChatGPT、Netflix、iCloud、各种 SaaS…… 订阅在不知不觉中越积越多，账单却散落各处。**BurnRate 把它们全部收进菜单栏**：点一下火焰图标，月度总支出、今日消耗、累计花费、下次扣费一眼看清 —— 不用打开任何窗口，也不用翻浏览器。

> 💡 想先试试？[**burnrate.run**](https://burnrate.run) 首页内嵌了一个可直接操作的完整演示，无需安装即可把玩。

## ✨ 核心卖点

- 🔥 **实时消耗计数器** —— 把月度订阅换算成「每秒在燃烧的钱」，里程表式滚动数字逐秒跳动，让消费速度从抽象变得触目惊心。
- 📊 **真实累计花费** —— 为每个订阅设定开始日期，自动算出你到底为它花了多少钱，数值也可随时手动覆盖。
- 🧾 **一览式总览** —— 月度总额、日均消耗、累计已花费、订阅数量、分类占比，一个面板全部讲清。
- ⚡ **80+ 服务预设** —— ChatGPT、Claude、Cursor、Netflix、Figma、AWS…… 选中即自动填好图标与价格，模糊搜索秒速添加，也支持完全自定义。
- 💱 **多币种自动换算** —— 美元、人民币、欧元、日元等按实时汇率统一折算成你的主币种。
- 💳 **预付费 / 充值追踪** —— 云服务额度、API 充值等预付费服务，完整记录每一笔充值历史。
- 🔒 **本地优先，绝对私密** —— 所有数据仅存于本地 SQLite，无账号、不联网、不追踪，支持一键导出 / 导入 JSON 备份。
- 🌗 **中英双语** —— 跟随偏好一键切换界面语言。
- 🪶 **极致轻量** —— Rust + Tauri 原生构建，安装包仅约 7 MB，常驻菜单栏几乎不占资源。

## 安装

从 [**Releases**](https://github.com/mtskyyy/burnrate/releases/latest) 下载最新 `.dmg`，打开后把 BurnRate 拖入「应用程序」，启动即可 —— 火焰图标会出现在菜单栏。

应用未做 Apple 公证（注册开发者每年需 99 美元），所以首次打开前请在「终端」执行一次下面的命令以跳过验证：

```bash
xattr -dr com.apple.quarantine /Applications/BurnRate.app
```

**系统要求：** macOS 12 Monterey 或更高版本 · Apple 芯片（M1 及更新机型）

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

website/                # 产品落地页（内嵌可交互演示）
└── src/                # Next.js 15 + Framer Motion
```

## 开源协议

MIT
