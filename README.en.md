<p align="center">
  <img src="src-tauri/icons/icon.png" width="128" height="128" alt="BurnRate icon" />
</p>

<h1 align="center">BurnRate</h1>

<p align="center">
  <strong>The subscription tracker that lives in your macOS menu bar — so no recurring charge ever slips by.</strong>
</p>

<p align="center">
  <a href="https://github.com/mtskyyy/burnrate/releases/latest">Download</a> ·
  <a href="https://burnrate.run">Website &amp; live demo</a> ·
  <a href="./README.md">中文</a>
</p>

---

ChatGPT, Netflix, iCloud, a pile of SaaS… subscriptions creep up on you, and the bills are scattered everywhere. **BurnRate pulls them all into your menu bar:** one click on the flame icon shows your monthly total, today's burn, lifetime spend, and what's billing next — no windows to manage, no browser tabs to dig through.

> 💡 Want to try it first? [**burnrate.run**](https://burnrate.run) embeds a fully interactive demo right on the homepage — no install required.

## ✨ Highlights

- 🔥 **Real-time burn counter** — turns your monthly subscriptions into "money burning per second," with odometer-style rolling digits that make spending velocity impossible to ignore.
- 📊 **True lifetime spend** — give each subscription a start date and BurnRate works out exactly how much you've poured into it; override the number anytime.
- 🧾 **At-a-glance overview** — monthly total, daily average, lifetime spend, active count, and category breakdown, all in one panel.
- ⚡ **80+ service presets** — ChatGPT, Claude, Cursor, Netflix, Figma, AWS… pick one and the logo and pricing are filled in for you; fuzzy search makes adding instant, and custom services take seconds.
- 💱 **Automatic multi-currency** — USD, CNY, EUR, JPY and more, converted to your base currency at live exchange rates.
- 💳 **Prepaid & top-up tracking** — log every top-up for cloud credits, API balances, and other prepaid services.
- 🔒 **Local-first, truly private** — everything lives in a local SQLite database. No account, no cloud, no tracking. One-click JSON export / import for backups.
- 🌗 **Bilingual** — switch the interface between English and Simplified Chinese.
- 🪶 **Featherweight** — built with Rust + Tauri; the installer is ~7 MB and it sips resources sitting in your menu bar.

## Install

Grab the latest `.dmg` from [**Releases**](https://github.com/mtskyyy/burnrate/releases/latest), open it, drag BurnRate into Applications, and launch — the flame icon appears in your menu bar.

The app isn't notarized (a registered Apple Developer account costs $99/yr), so before the first launch run this once in Terminal to skip the verification block:

```bash
xattr -dr com.apple.quarantine /Applications/BurnRate.app
```

**Requirements:** macOS 12 Monterey or later · Apple Silicon (M1 and newer)

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

website/                # Product landing page (with embedded live demo)
└── src/                # Next.js 15 + Framer Motion
```

## License

MIT
