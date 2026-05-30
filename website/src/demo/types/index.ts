export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'biannual' | 'nine_monthly' | 'yearly'
export type BillingType = 'recurring' | 'prepaid'

export interface Subscription {
  id: string
  name: string
  icon_key: string | null
  sort_order: number
  amount: number
  currency: string
  cycle: BillingCycle
  billing_type: BillingType
  tier: string | null
  next_billing: string // YYYY-MM-DD
  payment_channel: string | null
  account: string | null
  password: string | null
  notes: string | null
  is_pinned: number // 0 | 1
  auto_renew: number // 0 | 1
  start_date: string // YYYY-MM-DD — when the subscription actually began
  total_spent_override: number | null // stored cumulative spend; grows one charge per cycle, user-editable; null = not yet materialized (falls back to auto-computed)
  created_at: string
  updated_at: string
}

export interface Topup {
  id: string
  subscription_id: string
  amount: number
  currency: string
  note: string | null
  created_at: string
}

export interface Settings {
  display_currency: string
  language: 'en' | 'zh'
  sort_by: 'manual' | 'next_billing' | 'amount'
  tray_display: 'monthly' | 'daily'
}

export interface ExchangeRate {
  from_currency: string
  to_currency: string
  rate: number
  updated_at: string
}

export interface PriceTier {
  name: string
  amount: number
  currency: string
  cycle: BillingCycle
}

export interface ServicePreset {
  name: string
  iconKey: string | null
  defaultAmount: number
  defaultCurrency: string
  defaultCycle: BillingCycle
  defaultBillingType?: BillingType
  tiers?: PriceTier[]
  category: string
}
