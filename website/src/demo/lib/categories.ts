import { SERVICE_PRESETS } from './presets'
import type { Subscription } from '../types'
import { toMonthly } from './format'
import { type ExchangeRates, convertAmount } from './currency'

export const CATEGORY_META: Record<string, { label: string; color: string }> = {
  ai:            { label: 'AI',      color: '#E8A838' },
  dev:           { label: 'Dev',     color: '#5B8DEF' },
  cloud:         { label: 'Cloud',   color: '#4DD4AC' },
  domain:        { label: 'Domain',  color: '#F59E0B' },
  productivity:  { label: 'Tool',    color: '#8B7CF6' },
  design:        { label: 'Design',  color: '#EC6C9C' },
  entertainment: { label: 'Media',   color: '#4ADE80' },
  storage:       { label: 'Storage', color: '#22D3EE' },
  communication: { label: 'Comm',    color: '#A78BFA' },
  other:         { label: 'Other',   color: '#6B7280' },
}

export function getCategory(sub: Subscription): string {
  const preset = SERVICE_PRESETS.find(
    (p) => p.name === sub.name || (sub.icon_key && p.iconKey === sub.icon_key)
  )
  return preset?.category ?? 'other'
}

export interface CategoryTotal {
  key: string
  label: string
  color: string
  amount: number
}

export function getCategoryTotals(
  subscriptions: Subscription[],
  displayCurrency: string,
  exchangeRates: ExchangeRates | null
): CategoryTotal[] {
  const map = new Map<string, number>()

  for (const sub of subscriptions) {
    const cat = getCategory(sub)
    let monthly = toMonthly(sub.amount, sub.cycle)
    if (sub.currency !== displayCurrency && exchangeRates) {
      monthly = convertAmount(monthly, sub.currency, exchangeRates)
    }
    map.set(cat, (map.get(cat) ?? 0) + monthly)
  }

  return Array.from(map.entries())
    .map(([key, amount]) => ({
      key,
      label: CATEGORY_META[key]?.label ?? key,
      color: CATEGORY_META[key]?.color ?? '#6B7280',
      amount: Math.round(amount),
    }))
    .sort((a, b) => b.amount - a.amount)
}
