import type { ServicePreset } from '../types'

export const SERVICE_PRESETS: ServicePreset[] = [
  // AI — tiered
  {
    name: 'ChatGPT', iconKey: 'OpenAI', defaultAmount: 8, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'ai',
    tiers: [
      { name: 'Go', amount: 8, currency: 'USD', cycle: 'monthly' },
      { name: 'Plus', amount: 20, currency: 'USD', cycle: 'monthly' },
      { name: 'Pro 5x', amount: 100, currency: 'USD', cycle: 'monthly' },
      { name: 'Pro 20x', amount: 200, currency: 'USD', cycle: 'monthly' },
    ],
  },
  {
    name: 'Claude', iconKey: 'Claude', defaultAmount: 20, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'ai',
    tiers: [
      { name: 'Pro', amount: 20, currency: 'USD', cycle: 'monthly' },
      { name: 'Max 5x', amount: 100, currency: 'USD', cycle: 'monthly' },
      { name: 'Max 20x', amount: 200, currency: 'USD', cycle: 'monthly' },
    ],
  },
  {
    name: 'Google AI', iconKey: 'Gemini', defaultAmount: 8, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'ai',
    tiers: [
      { name: 'Plus', amount: 8, currency: 'USD', cycle: 'monthly' },
      { name: 'Pro', amount: 20, currency: 'USD', cycle: 'monthly' },
      { name: 'Ultra', amount: 100, currency: 'USD', cycle: 'monthly' },
    ],
  },
  {
    name: 'Grok', iconKey: 'Grok', defaultAmount: 30, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'ai',
    tiers: [
      { name: 'Premium', amount: 8, currency: 'USD', cycle: 'monthly' },
      { name: 'Premium+', amount: 22, currency: 'USD', cycle: 'monthly' },
      { name: 'SuperGrok', amount: 30, currency: 'USD', cycle: 'monthly' },
    ],
  },
  {
    name: 'Cursor', iconKey: 'Cursor', defaultAmount: 20, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'ai',
    tiers: [
      { name: 'Pro', amount: 20, currency: 'USD', cycle: 'monthly' },
      { name: 'Ultra', amount: 200, currency: 'USD', cycle: 'monthly' },
    ],
  },
  {
    name: 'Midjourney', iconKey: 'Midjourney', defaultAmount: 10, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'ai',
    tiers: [
      { name: 'Basic', amount: 10, currency: 'USD', cycle: 'monthly' },
      { name: 'Standard', amount: 30, currency: 'USD', cycle: 'monthly' },
      { name: 'Pro', amount: 60, currency: 'USD', cycle: 'monthly' },
    ],
  },

  // AI — single tier
  { name: 'Perplexity', iconKey: 'Perplexity', defaultAmount: 20, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'ai' },
  { name: 'GitHub Copilot', iconKey: 'GithubCopilot', defaultAmount: 10, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'ai' },
  { name: 'OpenRouter', iconKey: 'OpenRouter', defaultAmount: 10, defaultCurrency: 'USD', defaultCycle: 'monthly', defaultBillingType: 'prepaid', category: 'ai' },
  { name: 'Z.ai', iconKey: 'ZAI', defaultAmount: 20, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'ai' },
  { name: 'Jimeng', iconKey: 'Jimeng', defaultAmount: 69, defaultCurrency: 'CNY', defaultCycle: 'monthly', category: 'ai' },
  { name: 'Codex', iconKey: 'Codex', defaultAmount: 20, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'ai' },
  { name: 'Antigravity', iconKey: 'Antigravity', defaultAmount: 20, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'ai' },
  { name: 'Claude Code', iconKey: 'ClaudeCode', defaultAmount: 20, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'ai' },
  { name: 'Google AI Studio', iconKey: 'AiStudio', defaultAmount: 19.99, defaultCurrency: 'USD', defaultCycle: 'monthly', defaultBillingType: 'prepaid', category: 'ai' },
  { name: 'Manus', iconKey: 'Manus', defaultAmount: 39, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'ai' },
  { name: 'OpenClaw', iconKey: 'OpenClaw', defaultAmount: 20, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'ai' },
  { name: 'Qoder', iconKey: 'Qoder', defaultAmount: 19, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'ai' },
  { name: 'Lovable', iconKey: 'Lovable', defaultAmount: 20, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'ai' },
  { name: 'BaiLian', iconKey: 'Bailian', defaultAmount: 30, defaultCurrency: 'CNY', defaultCycle: 'monthly', defaultBillingType: 'prepaid', category: 'ai' },
  { name: 'Stability', iconKey: 'Stability', defaultAmount: 20, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'ai' },
  { name: 'DALL-E', iconKey: 'Dalle', defaultAmount: 20, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'ai' },
  { name: 'Coze', iconKey: 'Coze', defaultAmount: 39, defaultCurrency: 'CNY', defaultCycle: 'monthly', category: 'ai' },
  { name: 'Typeless', iconKey: 'Typeless', defaultAmount: 20, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'ai' },
  { name: 'NanoBanana', iconKey: 'NanoBanana', defaultAmount: 20, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'ai' },

  // Dev Tools
  { name: 'GitHub', iconKey: 'Github', defaultAmount: 4, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'dev' },
  { name: 'Vercel', iconKey: 'Vercel', defaultAmount: 20, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'dev' },
  { name: 'Railway', iconKey: 'Railway', defaultAmount: 5, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'dev' },
  { name: 'Supabase', iconKey: 'Supabase', defaultAmount: 25, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'dev' },
  { name: 'PlanetScale', iconKey: 'PlanetScale', defaultAmount: 29, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'dev' },
  { name: 'Cloudflare', iconKey: 'Cloudflare', defaultAmount: 20, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'dev' },
  { name: 'DigitalOcean', iconKey: 'DigitalOcean', defaultAmount: 12, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'dev' },
  { name: 'Heroku', iconKey: 'Heroku', defaultAmount: 5, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'dev' },
  { name: 'Docker', iconKey: 'Docker', defaultAmount: 5, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'dev' },
  { name: 'Sentry', iconKey: 'Sentry', defaultAmount: 26, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'dev' },

  // Cloud
  { name: 'AWS', iconKey: 'Aws', defaultAmount: 50, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'cloud' },
  { name: 'Google Cloud', iconKey: 'GoogleCloud', defaultAmount: 50, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'cloud' },
  { name: 'Azure', iconKey: 'Azure', defaultAmount: 50, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'cloud' },
  { name: 'Huawei Cloud', iconKey: 'HuaweiCloud', defaultAmount: 100, defaultCurrency: 'CNY', defaultCycle: 'monthly', category: 'cloud' },

  // Productivity
  { name: 'Notion', iconKey: 'Notion', defaultAmount: 10, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'productivity' },
  { name: 'Linear', iconKey: 'Linear', defaultAmount: 8, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'productivity' },
  { name: 'Slack', iconKey: 'Slack', defaultAmount: 8.75, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'productivity' },
  { name: '1Password', iconKey: 'OnePassword', defaultAmount: 2.99, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'productivity' },
  { name: 'Raycast Pro', iconKey: 'Raycast', defaultAmount: 8, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'productivity' },
  { name: 'DeepL', iconKey: 'DeepL', defaultAmount: 8.74, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'productivity' },
  { name: 'Hugging Face', iconKey: 'HuggingFace', defaultAmount: 9, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'productivity' },

  // Design
  { name: 'Figma', iconKey: 'Figma', defaultAmount: 15, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'design' },
  { name: 'Framer', iconKey: 'Framer', defaultAmount: 20, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'design' },
  { name: 'Obsidian Sync', iconKey: 'Obsidian', defaultAmount: 8, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'productivity' },
  { name: 'Zotero', iconKey: 'Zotero', defaultAmount: 120, defaultCurrency: 'USD', defaultCycle: 'yearly', category: 'productivity' },
  {
    name: 'Overleaf', iconKey: 'Overleaf', defaultAmount: 21, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'productivity',
    tiers: [
      { name: 'Standard', amount: 21, currency: 'USD', cycle: 'monthly' },
      { name: 'Pro', amount: 42, currency: 'USD', cycle: 'monthly' },
      { name: 'Student', amount: 10, currency: 'USD', cycle: 'monthly' },
    ],
  },
  { name: 'Adobe', iconKey: 'Adobe', defaultAmount: 22.99, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'design' },

  // Model Providers
  { name: 'ZenMux', iconKey: 'ZenMux', defaultAmount: 20, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'dev' },
  { name: 'Copilot', iconKey: 'Copilot', defaultAmount: 20, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'dev' },

  // Entertainment & Media
  { name: 'Spotify', iconKey: 'Spotify', defaultAmount: 10.99, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'entertainment' },
  { name: 'Netflix', iconKey: 'Netflix', defaultAmount: 15.49, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'entertainment' },
  { name: 'YouTube Premium', iconKey: 'YouTube', defaultAmount: 13.99, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'entertainment' },
  { name: 'Apple Music', iconKey: 'AppleMusic', defaultAmount: 10.99, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'entertainment' },
  { name: 'Apple One', iconKey: 'Apple', defaultAmount: 19.95, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'entertainment' },
  { name: 'Disney+', iconKey: 'Disney', defaultAmount: 13.99, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'entertainment' },

  // Storage & Domains
  { name: 'iCloud+', iconKey: 'iCloud', defaultAmount: 2.99, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'storage' },
  { name: 'Google One', iconKey: 'Google', defaultAmount: 2.99, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'storage' },
  { name: 'Dropbox', iconKey: 'Dropbox', defaultAmount: 11.99, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'storage' },
  { name: 'Namecheap', iconKey: 'Namecheap', defaultAmount: 12.98, defaultCurrency: 'USD', defaultCycle: 'yearly', category: 'domain' },

  // Communication
  { name: 'Zoom', iconKey: 'Zoom', defaultAmount: 13.33, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'communication' },
  { name: 'Discord Nitro', iconKey: 'Discord', defaultAmount: 9.99, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'communication' },
  { name: 'Telegram Premium', iconKey: 'Telegram', defaultAmount: 4.99, defaultCurrency: 'USD', defaultCycle: 'monthly', category: 'communication' },

  // China — AI
  { name: 'Qwen (通义千问)', iconKey: 'Qwen', defaultAmount: 30, defaultCurrency: 'CNY', defaultCycle: 'monthly', category: 'ai' },
  { name: 'Doubao (豆包)', iconKey: 'Doubao', defaultAmount: 20, defaultCurrency: 'CNY', defaultCycle: 'monthly', category: 'ai' },
  { name: 'Kimi', iconKey: 'Kimi', defaultAmount: 30, defaultCurrency: 'CNY', defaultCycle: 'monthly', category: 'ai' },
  { name: 'Minimax', iconKey: 'Minimax', defaultAmount: 30, defaultCurrency: 'CNY', defaultCycle: 'monthly', category: 'ai' },
  { name: 'Kling (可灵)', iconKey: 'Kling', defaultAmount: 66, defaultCurrency: 'CNY', defaultCycle: 'monthly', category: 'ai' },

  // China — Cloud & Media
  { name: '腾讯云', iconKey: 'TencentCloud', defaultAmount: 100, defaultCurrency: 'CNY', defaultCycle: 'monthly', category: 'cloud' },
  { name: '阿里云', iconKey: 'AlibabaCloud', defaultAmount: 100, defaultCurrency: 'CNY', defaultCycle: 'monthly', category: 'cloud' },
  { name: 'Bilibili 大会员', iconKey: 'Bilibili', defaultAmount: 25, defaultCurrency: 'CNY', defaultCycle: 'monthly', category: 'entertainment' },
  { name: '网易云音乐', iconKey: 'NetEaseMusic', defaultAmount: 15, defaultCurrency: 'CNY', defaultCycle: 'monthly', category: 'entertainment' },
  { name: '爱奇艺', iconKey: 'iQIYI', defaultAmount: 25, defaultCurrency: 'CNY', defaultCycle: 'monthly', category: 'entertainment' },
  { name: '腾讯视频', iconKey: 'TencentVideo', defaultAmount: 25, defaultCurrency: 'CNY', defaultCycle: 'monthly', category: 'entertainment' },
  { name: '汽水音乐', iconKey: 'QishuiMusic', defaultAmount: 15, defaultCurrency: 'CNY', defaultCycle: 'monthly', category: 'entertainment' },
  { name: '微信读书', iconKey: 'WeChat', defaultAmount: 19, defaultCurrency: 'CNY', defaultCycle: 'monthly', category: 'entertainment' },
  { name: '百度网盘', iconKey: 'BaiduNetdisk', defaultAmount: 25, defaultCurrency: 'CNY', defaultCycle: 'monthly', category: 'storage' },
  { name: '腾讯会议', iconKey: 'TencentMeeting', defaultAmount: 25, defaultCurrency: 'CNY', defaultCycle: 'monthly', category: 'productivity' },
  { name: '迅雷', iconKey: 'Thunder', defaultAmount: 25, defaultCurrency: 'CNY', defaultCycle: 'monthly', category: 'productivity' },
]
