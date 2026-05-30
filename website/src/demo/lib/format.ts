import type { BillingCycle, Subscription } from '../types'
import i18n from '../i18n'

const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  zh: 'zh-CN',
}

const CYCLE_MONTHS: Record<BillingCycle, number> = {
  weekly: 12 / 52,
  monthly: 1,
  quarterly: 3,
  biannual: 6,
  nine_monthly: 9,
  yearly: 12,
}

export function toMonthly(amount: number, cycle: BillingCycle): number {
  return amount / CYCLE_MONTHS[cycle]
}

export function toYearly(amount: number, cycle: BillingCycle): number {
  return amount * (12 / CYCLE_MONTHS[cycle])
}

export function formatAmount(amount: number, currency: string): string {
  const locale = LOCALE_MAP[i18n.language] || 'en-US'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).formatToParts(amount).map((part) => {
    if (part.type !== 'currency') return part.value
    return part.value.replace(/^[A-Z]{1,3}/, '')
  }).join('')
}

/** Parse a YYYY-MM-DD string as local midnight (not UTC). */
function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00')
}

export function relativeDate(dateStr: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = parseLocalDate(dateStr)
  const diffMs = target.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / 86400000)

  if (diffDays < 0) return t('time.overdue')
  if (diffDays === 0) return t('time.today')
  if (diffDays === 1) return t('time.tomorrow')
  if (diffDays < 14) return t('time.days', { count: diffDays })
  if (diffDays < 60) return t('time.weeks', { count: Math.floor(diffDays / 7) })
  return t('time.months', { count: Math.floor(diffDays / 30) })
}

/** Format date as compact M/D, e.g. "3/28" */
export function shortDate(dateStr: string): string {
  const d = parseLocalDate(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/** Format date as "Mon DD", e.g. "Mar 28" — locale-aware. Includes the year when it differs from the current year. */
export function mediumDate(dateStr: string): string {
  const d = parseLocalDate(dateStr)
  const locale = LOCALE_MAP[i18n.language] || 'en-US'
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric'
  return d.toLocaleDateString(locale, opts)
}

/** Whether a subscription is expired (auto-renew off + past expiry) */
export function isExpired(autoRenew: number, nextBilling: string): boolean {
  if (autoRenew) return false
  return daysUntil(nextBilling) < 0
}

/** Count days from today to given date (negative = overdue) */
export function daysUntil(dateStr: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = parseLocalDate(dateStr)
  return Math.round((target.getTime() - now.getTime()) / 86400000)
}

/** Daily average from monthly total */
export function toDaily(monthlyTotal: number): number {
  return monthlyTotal * 12 / 365.25
}

/**
 * Count billing charges from a start date, stepping by cycle. Month-based cycles clamp to
 * each target month's length so a month-end date stays at month-end (no overflow into the
 * next month). `inclusive` controls whether a charge landing exactly on the boundary counts.
 */
function countCharges(startDate: string, cycle: BillingCycle, boundary: Date, inclusive: boolean): number {
  const start = parseLocalDate(startDate)
  const within = (d: Date) => (inclusive ? d <= boundary : d < boundary)
  if (!within(start)) return 0

  if (cycle === 'weekly') {
    const cursor = new Date(start)
    let count = 0
    while (within(cursor)) { count++; cursor.setDate(cursor.getDate() + 7) }
    return count
  }

  const step = CYCLE_MONTHS[cycle]
  const anchorDay = start.getDate()
  let months = start.getFullYear() * 12 + start.getMonth()
  let count = 0
  for (;;) {
    const y = Math.floor(months / 12)
    const m = months % 12
    const dim = new Date(y, m + 1, 0).getDate()
    const d = new Date(y, m, Math.min(anchorDay, dim))
    if (!within(d)) break
    count++
    months += step
  }
  return count
}

/**
 * How many times a recurring subscription has been charged from its start date through
 * today, counting the charge on the start date itself (start today = 1).
 */
export function chargeCount(startDate: string, cycle: BillingCycle, asOf: Date = new Date()): number {
  const today = new Date(asOf)
  today.setHours(0, 0, 0, 0)
  return countCharges(startDate, cycle, today, true)
}

/** How many charges fall strictly before a boundary date (e.g. the next billing date). */
export function chargesBeforeDate(startDate: string, cycle: BillingCycle, beforeDate: string): number {
  return countCharges(startDate, cycle, parseLocalDate(beforeDate), false)
}

/** Auto-computed cumulative spend through today: per-cycle amount × charges so far. */
export function computeTotalSpent(amount: number, cycle: BillingCycle, startDate: string, asOf?: Date): number {
  return amount * chargeCount(startDate, cycle, asOf)
}

/**
 * Cumulative spend already billed: per-cycle amount × charges strictly before the next
 * billing date. Using "before next billing" keeps this in lockstep with the per-cycle
 * increment applied when the billing date advances, so nothing is counted twice.
 */
export function billedTotal(amount: number, cycle: BillingCycle, startDate: string, nextBilling: string): number {
  return amount * chargesBeforeDate(startDate, cycle, nextBilling)
}

/**
 * A subscription's cumulative spend. Once materialized (total_spent_override set) it is a
 * stored running total — it does NOT recompute from the current amount, it only grows by
 * one charge per billing cycle (handled where billing dates advance). Until materialized it
 * falls back to the amount billed so far (charges strictly before the next billing date),
 * which advances automatically as the billing date rolls forward.
 */
export function subscriptionTotalSpent(sub: Subscription): number {
  if (sub.total_spent_override != null) return sub.total_spent_override
  const start = sub.start_date || sub.created_at.slice(0, 10)
  return billedTotal(sub.amount, sub.cycle, start, sub.next_billing)
}

/**
 * Advance a past-due billing date to the next future one, returning the new date and the
 * number of cycles (charges) that elapsed. Month-based cycles anchor on the billing
 * day-of-month (the start date's day when available) and clamp to each target month's
 * length, so a month-end day stays at month-end (Jan 31 → Feb 28 → Mar 31) instead of
 * overflowing into the next month.
 */
export function advanceBilling(nextBilling: string, cycle: BillingCycle, startDate?: string): { date: string; cycles: number } {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const from = parseLocalDate(nextBilling)
  // Not due yet — leave the date exactly as set
  if (from >= now) return { date: formatLocalDate(from), cycles: 0 }

  if (cycle === 'weekly') {
    const next = from
    let cycles = 0
    while (next < now) { next.setDate(next.getDate() + 7); cycles++ }
    return { date: formatLocalDate(next), cycles }
  }

  const step = CYCLE_MONTHS[cycle]
  const anchorDay = parseLocalDate(startDate || nextBilling).getDate()
  const dateFor = (y: number, m: number) =>
    new Date(y, m, Math.min(anchorDay, new Date(y, m + 1, 0).getDate()))

  let year = from.getFullYear()
  let month = from.getMonth()
  let next = from
  let cycles = 0
  while (next < now) {
    month += step
    year += Math.floor(month / 12)
    month = ((month % 12) + 12) % 12
    next = dateFor(year, month)
    cycles++
  }

  return { date: formatLocalDate(next), cycles }
}

export function advanceBillingDate(nextBilling: string, cycle: BillingCycle, startDate?: string): string {
  return advanceBilling(nextBilling, cycle, startDate).date
}

/** Format a Date as YYYY-MM-DD using local timezone components. */
function formatLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Decompose currency formatting into symbol, position, decimal places, and separators. */
export function getCurrencyParts(currency: string): {
  symbol: string
  symbolPosition: 'prefix' | 'suffix'
  decimalPlaces: number
  decimalSeparator: string
  groupSeparator: string
} {
  const locale = LOCALE_MAP[i18n.language] || 'en-US'
  const fmt = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  })

  const parts = fmt.formatToParts(1234.56)
  const currencyPart = parts.find(p => p.type === 'currency')
  const decimalPart = parts.find(p => p.type === 'decimal')
  const groupPart = parts.find(p => p.type === 'group')
  const currencyIndex = parts.findIndex(p => p.type === 'currency')
  const integerIndex = parts.findIndex(p => p.type === 'integer')

  let symbol = currencyPart?.value ?? '$'
  symbol = symbol.replace(/^[A-Z]{1,3}/, '')

  const resolved = fmt.resolvedOptions()

  return {
    symbol,
    symbolPosition: currencyIndex < integerIndex ? 'prefix' : 'suffix',
    decimalPlaces: resolved.maximumFractionDigits ?? 2,
    decimalSeparator: decimalPart?.value ?? '.',
    groupSeparator: groupPart?.value ?? ',',
  }
}
