// In-memory replacement for the Tauri SQLite layer. Same public API as the real
// app's lib/db.ts, but everything lives in module-level state — so the website
// demo is fully interactive yet stores nothing (a reload resets to the seed).
import type { Subscription, Topup } from '../types'
import { SETTING_DEFAULTS } from './defaults'

let subscriptions: Subscription[] = []
let topups: Topup[] = []
let settings: Record<string, string> = { ...(SETTING_DEFAULTS as unknown as Record<string, string>) }
let favorites = new Set<string>()
const exchangeRates = new Map<string, number>()
let seeded = false

function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '')
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function shift(days: number, months: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  if (months) d.setMonth(d.getMonth() + months)
  if (days) d.setDate(d.getDate() + days)
  return ymd(d)
}

// ── Seed ─────────────────────────────────────────────────────────────────────
type Seed = Partial<Subscription> & Pick<Subscription, 'name' | 'amount' | 'currency' | 'cycle' | 'next_billing'>

function makeSub(seed: Seed, order: number): Subscription {
  const now = new Date().toISOString()
  return {
    id: uid(),
    icon_key: null,
    tier: null,
    payment_channel: null,
    account: null,
    password: null,
    notes: null,
    is_pinned: 0,
    auto_renew: 1,
    billing_type: 'recurring',
    total_spent_override: null,
    start_date: shift(0, -6),
    created_at: now,
    updated_at: now,
    ...seed,
    sort_order: order,
  } as Subscription
}

function seed() {
  const recurring: Seed[] = [
    { name: 'Claude', icon_key: 'Claude', tier: 'Max 5x', amount: 100, currency: 'USD', cycle: 'monthly', next_billing: shift(4, 0), start_date: shift(0, -4), payment_channel: 'Visa ····6880', account: 'me@hey.com', password: 'hunter2-demo', notes: '团队共享账号' },
    { name: 'ChatGPT', icon_key: 'OpenAI', tier: 'Plus', amount: 20, currency: 'USD', cycle: 'monthly', next_billing: shift(11, 0), start_date: shift(0, -8), payment_channel: 'PayPal' },
    { name: 'Cursor', icon_key: 'Cursor', tier: 'Pro', amount: 20, currency: 'USD', cycle: 'monthly', next_billing: shift(2, 0), start_date: shift(0, -3), payment_channel: 'Visa ····6880' },
    { name: 'GitHub Copilot', icon_key: 'Github', amount: 10, currency: 'USD', cycle: 'monthly', next_billing: shift(17, 0), start_date: shift(0, -11), payment_channel: 'App Store' },
    { name: 'Notion', icon_key: 'Notion', amount: 10, currency: 'USD', cycle: 'monthly', next_billing: shift(21, 0), start_date: shift(-2, -12) },
    { name: 'Netflix', icon_key: 'Netflix', tier: 'Premium', amount: 15.49, currency: 'USD', cycle: 'monthly', next_billing: shift(6, 0), start_date: shift(0, -9), payment_channel: 'WeChat Pay' },
    { name: 'Bilibili 大会员', icon_key: 'Bilibili', amount: 25, currency: 'CNY', cycle: 'monthly', next_billing: shift(9, 0), start_date: shift(0, -5), payment_channel: 'Alipay' },
    { name: 'iCloud+', icon_key: 'iCloud', amount: 6, currency: 'CNY', cycle: 'monthly', next_billing: shift(14, 0), start_date: shift(0, -14), payment_channel: 'App Store' },
    { name: 'Namecheap', icon_key: 'Namecheap', amount: 12.98, currency: 'USD', cycle: 'yearly', next_billing: shift(40, 0), start_date: shift(0, -10) },
    // Archived (canceled, expired) — appears under the archive tab
    { name: 'Midjourney', icon_key: 'Midjourney', tier: 'Standard', amount: 30, currency: 'USD', cycle: 'monthly', next_billing: shift(-9, 0), start_date: shift(0, -7), auto_renew: 0, payment_channel: 'PayPal' },
  ]
  const prepaid: Seed[] = [
    { name: 'OpenRouter', icon_key: 'OpenRouter', amount: 20, currency: 'USD', cycle: 'monthly', billing_type: 'prepaid', next_billing: shift(30, 0), start_date: shift(0, -3) },
    { name: 'Google AI Studio', icon_key: 'AiStudio', amount: 19.99, currency: 'USD', cycle: 'monthly', billing_type: 'prepaid', next_billing: shift(30, 0), start_date: shift(0, -2) },
  ]

  subscriptions = [...recurring, ...prepaid].map((s, i) => makeSub(s, i + 1))
  topups = []

  const openrouter = subscriptions.find((s) => s.name === 'OpenRouter')
  const aistudio = subscriptions.find((s) => s.name === 'Google AI Studio')
  const addSeedTopup = (subId: string, amount: number, currency: string, daysAgo: number, note: string | null) => {
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    topups.push({ id: uid(), subscription_id: subId, amount, currency, note, created_at: d.toISOString() })
  }
  if (openrouter) {
    addSeedTopup(openrouter.id, 20, 'USD', 40, null)
    addSeedTopup(openrouter.id, 10, 'USD', 12, 'Top-up')
  }
  if (aistudio) {
    addSeedTopup(aistudio.id, 25, 'USD', 30, null)
  }
}

function ensureSeed() {
  if (!seeded) {
    seed()
    seeded = true
  }
}

function sortForList(list: Subscription[]): Subscription[] {
  return [...list].sort((a, b) => {
    const ao = a.sort_order ?? Number.MAX_SAFE_INTEGER
    const bo = b.sort_order ?? Number.MAX_SAFE_INTEGER
    if (ao !== bo) return ao - bo
    return a.created_at.localeCompare(b.created_at)
  })
}

// ── Subscriptions CRUD ───────────────────────────────────────────────────────
export async function getAllSubscriptions(): Promise<Subscription[]> {
  ensureSeed()
  return sortForList(subscriptions).map((s) => ({ ...s }))
}

export async function addSubscription(
  sub: Omit<Subscription, 'id' | 'sort_order' | 'is_pinned' | 'created_at' | 'updated_at'>
): Promise<string> {
  ensureSeed()
  const id = uid()
  const now = new Date().toISOString()
  const maxOrder = subscriptions.reduce((m, s) => Math.max(m, s.sort_order ?? 0), 0)
  subscriptions.push({ ...(sub as Subscription), id, sort_order: maxOrder + 1, is_pinned: 0, created_at: now, updated_at: now })
  return id
}

export async function updateSubscription(id: string, patch: Partial<Subscription>): Promise<void> {
  ensureSeed()
  const i = subscriptions.findIndex((s) => s.id === id)
  if (i === -1) return
  const { id: _id, created_at: _c, ...rest } = patch
  void _id
  void _c
  subscriptions[i] = { ...subscriptions[i], ...rest, updated_at: new Date().toISOString() }
}

export async function deleteSubscription(id: string): Promise<void> {
  ensureSeed()
  subscriptions = subscriptions.filter((s) => s.id !== id)
  topups = topups.filter((t) => t.subscription_id !== id)
}

export async function reorderSubscriptions(ids: string[]): Promise<void> {
  ensureSeed()
  const order = new Map(ids.map((id, idx) => [id, idx + 1]))
  subscriptions = subscriptions.map((s) => (order.has(s.id) ? { ...s, sort_order: order.get(s.id)! } : s))
}

// ── Settings ──────────────────────────────────────────────────────────────────
// Seed the initial UI language so the demo matches the marketing site's locale
// from the first render (useSettings reads this synchronously on mount).
export function setInitialLanguage(lang: string): void {
  ensureSeed()
  settings.language = lang
}

export async function getSetting(key: string): Promise<string | null> {
  ensureSeed()
  return key in settings ? settings[key] : null
}
export async function setSetting(key: string, value: string): Promise<void> {
  ensureSeed()
  settings[key] = value
}

// ── Preset favorites ───────────────────────────────────────────────────────────
export async function getFavoritePresets(): Promise<string[]> {
  ensureSeed()
  return [...favorites]
}
export async function toggleFavoritePreset(name: string): Promise<void> {
  ensureSeed()
  if (favorites.has(name)) favorites.delete(name)
  else favorites.add(name)
}

// ── Exchange rates (kept for API parity; demo uses fallback rates) ───────────────
export async function getExchangeRate(from: string, to: string): Promise<number | null> {
  const r = exchangeRates.get(`${from}:${to}`)
  return r ?? null
}
export async function setExchangeRate(from: string, to: string, rate: number): Promise<void> {
  exchangeRates.set(`${from}:${to}`, rate)
}

// ── Topups ──────────────────────────────────────────────────────────────────────
export async function getTopups(subscriptionId: string): Promise<Topup[]> {
  ensureSeed()
  return topups
    .filter((t) => t.subscription_id === subscriptionId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((t) => ({ ...t }))
}
export async function addTopup(subscriptionId: string, amount: number, currency: string, note: string | null): Promise<void> {
  ensureSeed()
  topups.push({ id: uid(), subscription_id: subscriptionId, amount, currency, note, created_at: new Date().toISOString() })
}
export async function deleteTopup(id: string): Promise<void> {
  ensureSeed()
  topups = topups.filter((t) => t.id !== id)
}
export async function getTopupTotals(): Promise<Map<string, number>> {
  ensureSeed()
  const map = new Map<string, number>()
  for (const t of topups) map.set(t.subscription_id, (map.get(t.subscription_id) ?? 0) + t.amount)
  return map
}

export async function clearAllData(): Promise<void> {
  subscriptions = []
  topups = []
  favorites = new Set()
  seeded = true // don't re-seed after an explicit clear
}

// ── Export / Import (browser file APIs — no persistence) ─────────────────────────
interface BackupData {
  version: 1
  exported_at: string
  subscriptions: Subscription[]
  topups: Topup[]
  settings: { key: string; value: string }[]
  preset_favorites: string[]
}

export async function exportData(): Promise<boolean> {
  ensureSeed()
  const backup: BackupData = {
    version: 1,
    exported_at: new Date().toISOString(),
    subscriptions: sortForList(subscriptions),
    topups,
    settings: Object.entries(settings).map(([key, value]) => ({ key, value })),
    preset_favorites: [...favorites],
  }
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `burnrate-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  return true
}

export async function importData(): Promise<boolean> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.oncancel = () => resolve(false)
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return resolve(false)
      try {
        const backup = JSON.parse(await file.text()) as BackupData
        const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
        const validSub = (s: unknown) => isObj(s) && typeof s.id === 'string' && typeof s.name === 'string' && typeof s.amount === 'number'
        const validTopup = (t: unknown) => isObj(t) && typeof t.id === 'string' && typeof t.subscription_id === 'string' && typeof t.amount === 'number'
        if (backup.version !== 1 || !Array.isArray(backup.subscriptions) || !Array.isArray(backup.topups)) throw new Error('Invalid backup file')
        if (!backup.subscriptions.every(validSub) || !backup.topups.every(validTopup)) throw new Error('Invalid backup file')

        subscriptions = backup.subscriptions.map((s) => ({
          ...s,
          start_date: s.start_date ?? ((s.created_at ?? '').slice(0, 10) || ymd(new Date())),
          total_spent_override: s.total_spent_override ?? null,
        }))
        topups = backup.topups
        favorites = new Set(backup.preset_favorites ?? [])
        if (Array.isArray(backup.settings)) {
          settings = { ...(SETTING_DEFAULTS as unknown as Record<string, string>) }
          for (const { key, value } of backup.settings) settings[key] = value
        }
        seeded = true
        resolve(true)
      } catch {
        resolve(false)
      }
    }
    input.click()
  })
}
