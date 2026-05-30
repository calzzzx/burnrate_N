<p align="center">
  <img src="src-tauri/icons/icon.png" width="128" height="128" alt="BurnRate icon" />
</p>

<h1 align="center">BurnRate</h1>

<p align="center">
  <strong>Subscription tracker that lives in your macOS menu bar.</strong>
</p>

<p align="center">
  <a href="https://github.com/mtskyyy/burnrate/releases/latest">Download</a> ·
  <a href="https://burnrate.run">Website</a> ·
  <a href="./README.zh-CN.md">中文</a>
</p>

---

BurnRate is a lightweight macOS menu bar app that tracks your subscription spending in real-time. Click the menu bar icon, see your burn rate — no windows to manage, no browser tabs to keep open.

## Features

- **Menu bar native** — always one click away, never in the way
- **80+ service presets** — ChatGPT, Netflix, Figma, AWS, and more with auto-filled pricing
- **Real-time burn counter** — odometer-style rolling digits showing today's spending as it ticks
- **Category breakdown** — visualize spending across AI, Dev, Design, Media, Cloud, and more
- **Multi-currency** — USD, CNY, EUR, JPY with live exchange rate conversion
- **Prepaid tracking** — track top-up history for cloud credits and prepaid services
- **Data export / import** — full JSON backup and restore via native file dialog
- **Bilingual** — English and Simplified Chinese (中文)
- **Private by design** — all data stored locally in SQLite. No accounts, no cloud, no tracking

## Install

Grab the latest `.dmg` from [**Releases**](https://github.com/mtskyyy/burnrate/releases/latest).

Open the `.dmg` → drag BurnRate into Applications → launch. The flame icon appears in your menu bar.

**Requirements:** macOS 12 Monterey or later · Apple Silicon (M1+)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 · TypeScript · Tailwind CSS 4 |
| Backend | Tauri 2 · Rust |
| Database | SQLite |
| i18n | i18next |
| Website | Next.js 15 · Framer Motion · Vercel |

## Development

```bash
# Install dependencies
pnpm install

# Run in development
pnpm tauri dev

# Build for production
pnpm tauri build
```

## Project Structure

```
src/                    # React frontend
├── components/         # UI components (Panel, BurnCounter, Settings, ...)
├── hooks/              # useSubscriptions, useSettings
├── lib/                # presets, categories, format, currency, db
├── i18n/               # en.json, zh.json
└── types/              # TypeScript interfaces

src-tauri/              # Rust backend
├── src/
│   ├── lib.rs          # App setup, plugins, system tray
│   └── commands.rs     # Tauri IPC commands
└── Cargo.toml

website/                # Product landing page
└── src/                # Next.js 15 + Framer Motion
```

## License

MIT
