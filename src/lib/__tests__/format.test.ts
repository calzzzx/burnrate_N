import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import i18n from '../../i18n'
import { toMonthly, toYearly, formatAmount, relativeDate, advanceBillingDate, advanceBilling, getCurrencyParts, chargeCount, computeTotalSpent, subscriptionTotalSpent } from '../format'
import type { Subscription } from '../../types'

const makeSub = (o: Partial<Subscription>): Subscription => ({
  id: 'x', name: 'X', icon_key: null, sort_order: 1, amount: 20, currency: 'USD',
  cycle: 'monthly', billing_type: 'recurring', tier: null, next_billing: '2026-03-23',
  payment_channel: null, account: null, password: null, notes: null,
  is_pinned: 0, auto_renew: 1, start_date: '2026-01-23', total_spent_override: null,
  created_at: '2026-01-23', updated_at: '2026-01-23', ...o,
})

const t = (key: string, opts?: Record<string, unknown>) => {
  if (opts?.count !== undefined) return `${key}:${opts.count}`
  return key
}

describe('toMonthly', () => {
  it('returns amount unchanged for monthly cycle', () => {
    expect(toMonthly(10, 'monthly')).toBe(10)
  })

  it('divides yearly amount by 12', () => {
    expect(toMonthly(120, 'yearly')).toBe(10)
    expect(toMonthly(144, 'yearly')).toBe(12)
  })

  it('converts weekly to monthly (×52/12)', () => {
    expect(toMonthly(10, 'weekly')).toBeCloseTo(43.33, 1)
  })

  it('handles zero amount', () => {
    expect(toMonthly(0, 'monthly')).toBe(0)
    expect(toMonthly(0, 'yearly')).toBe(0)
    expect(toMonthly(0, 'weekly')).toBe(0)
  })

  it('handles fractional amounts', () => {
    expect(toMonthly(9.99, 'monthly')).toBe(9.99)
    expect(toMonthly(99.99, 'yearly')).toBeCloseTo(8.33, 1)
  })
})

describe('toYearly', () => {
  it('multiplies monthly by 12', () => {
    expect(toYearly(10, 'monthly')).toBe(120)
  })

  it('returns amount unchanged for yearly cycle', () => {
    expect(toYearly(120, 'yearly')).toBe(120)
  })

  it('multiplies weekly by 52', () => {
    expect(toYearly(10, 'weekly')).toBe(520)
  })
})

describe('formatAmount', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('formats USD with dollar sign', () => {
    expect(formatAmount(10, 'USD')).toBe('$10')
  })

  it('shows decimals for fractional amounts', () => {
    expect(formatAmount(10.99, 'USD')).toBe('$10.99')
  })

  it('omits decimals for whole numbers', () => {
    expect(formatAmount(100, 'USD')).toBe('$100')
  })

  it('formats EUR with euro sign', () => {
    const result = formatAmount(25.50, 'EUR')
    expect(result).toContain('25.50')
    expect(result).toContain('€')
  })

  it('formats CNY with yuan sign', () => {
    const result = formatAmount(100, 'CNY')
    expect(result).toContain('100')
    expect(result).toContain('¥')
  })

  it('strips locale-added country prefixes from foreign currencies', async () => {
    await i18n.changeLanguage('zh')

    expect(formatAmount(10, 'USD')).toBe('$10')
    expect(formatAmount(10, 'JPY')).toBe('¥10')
    expect(formatAmount(10, 'TWD')).toBe('$10')
  })

  it('formats large amounts with comma grouping', () => {
    expect(formatAmount(1234, 'USD')).toBe('$1,234')
  })

  it('handles very small amounts', () => {
    expect(formatAmount(0.01, 'USD')).toBe('$0.01')
  })

  it('handles zero', () => {
    expect(formatAmount(0, 'USD')).toBe('$0')
  })
})

describe('relativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-23T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "today" for current date', () => {
    expect(relativeDate('2026-03-23', t)).toBe('time.today')
  })

  it('returns "tomorrow" for next day', () => {
    expect(relativeDate('2026-03-24', t)).toBe('time.tomorrow')
  })

  it('returns days for 2-13 days', () => {
    expect(relativeDate('2026-03-29', t)).toBe('time.days:6')
    expect(relativeDate('2026-03-25', t)).toBe('time.days:2')
  })

  it('returns weeks for 14-59 days', () => {
    expect(relativeDate('2026-04-06', t)).toBe('time.weeks:2')
    expect(relativeDate('2026-04-20', t)).toBe('time.weeks:4')
  })

  it('returns months for 60+ days', () => {
    expect(relativeDate('2026-06-23', t)).toBe('time.months:3')
  })

  it('returns overdue for past dates', () => {
    expect(relativeDate('2026-03-22', t)).toBe('time.overdue')
    expect(relativeDate('2026-01-01', t)).toBe('time.overdue')
  })
})

describe('chargeCount', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-23T12:00:00'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('counts the start-date charge (start today = 1)', () => {
    expect(chargeCount('2026-03-23', 'monthly')).toBe(1)
  })

  it('counts monthly charges through today', () => {
    expect(chargeCount('2026-01-23', 'monthly')).toBe(3)
    expect(chargeCount('2026-01-01', 'monthly')).toBe(3)
  })

  it('counts yearly charges through today', () => {
    expect(chargeCount('2024-03-23', 'yearly')).toBe(3)
    expect(chargeCount('2026-03-23', 'yearly')).toBe(1)
  })

  it('counts weekly charges through today', () => {
    expect(chargeCount('2026-03-09', 'weekly')).toBe(3)
  })

  it('returns 0 for a future start date', () => {
    expect(chargeCount('2026-04-01', 'monthly')).toBe(0)
  })
})

describe('computeTotalSpent', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-23T12:00:00'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('multiplies per-cycle amount by charge count', () => {
    expect(computeTotalSpent(20, 'monthly', '2026-01-23')).toBe(60)
    expect(computeTotalSpent(99, 'yearly', '2024-03-23')).toBe(297)
  })

  it('is zero before the first charge', () => {
    expect(computeTotalSpent(20, 'monthly', '2026-04-01')).toBe(0)
  })
})

describe('subscriptionTotalSpent', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-23T12:00:00'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('auto-computes when not yet materialized', () => {
    // monthly 20, start 2026-01-23 → 3 charges = 60
    expect(subscriptionTotalSpent(makeSub({}))).toBe(60)
  })

  it('returns the stored value once materialized, ignoring the amount', () => {
    expect(subscriptionTotalSpent(makeSub({ total_spent_override: 500 }))).toBe(500)
    // changing the amount must not affect the stored cumulative
    expect(subscriptionTotalSpent(makeSub({ amount: 999, total_spent_override: 500 }))).toBe(500)
  })
})

describe('getCurrencyParts', () => {
  it('returns correct parts for USD', () => {
    const parts = getCurrencyParts('USD')
    expect(parts.symbol).toBe('$')
    expect(parts.symbolPosition).toBe('prefix')
    expect(parts.decimalPlaces).toBe(2)
    expect(parts.decimalSeparator).toBe('.')
  })

  it('returns 0 decimal places for JPY', () => {
    const parts = getCurrencyParts('JPY')
    expect(parts.symbol).toBe('¥')
    expect(parts.decimalPlaces).toBe(0)
  })

  it('returns correct parts for EUR', () => {
    const parts = getCurrencyParts('EUR')
    expect(parts.symbol).toBe('€')
    expect(parts.decimalPlaces).toBe(2)
  })

  it('returns 0 decimal places for KRW', () => {
    const parts = getCurrencyParts('KRW')
    expect(parts.decimalPlaces).toBe(0)
  })
})

describe('advanceBillingDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-23T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not advance future dates', () => {
    expect(advanceBillingDate('2026-04-01', 'monthly')).toBe('2026-04-01')
    expect(advanceBillingDate('2026-12-25', 'yearly')).toBe('2026-12-25')
  })

  it('does not advance today', () => {
    expect(advanceBillingDate('2026-03-23', 'monthly')).toBe('2026-03-23')
  })

  it('advances monthly past dates by one month at a time', () => {
    expect(advanceBillingDate('2026-03-01', 'monthly')).toBe('2026-04-01')
    expect(advanceBillingDate('2026-01-15', 'monthly')).toBe('2026-04-15')
  })

  it('advances yearly past dates by one year at a time', () => {
    expect(advanceBillingDate('2025-06-15', 'yearly')).toBe('2026-06-15')
    expect(advanceBillingDate('2024-01-01', 'yearly')).toBe('2027-01-01')
  })

  it('advances weekly past dates by 7 days at a time', () => {
    expect(advanceBillingDate('2026-03-16', 'weekly')).toBe('2026-03-23')
  })

  it('handles dates far in the past', () => {
    expect(advanceBillingDate('2020-01-01', 'yearly')).toBe('2027-01-01')
  })

  it('keeps month-end dates at month-end instead of overflowing', () => {
    // Jan 31 would overflow to Mar 3 with naive setMonth; clamps through Feb to Mar 31
    expect(advanceBillingDate('2026-01-31', 'monthly', '2026-01-31')).toBe('2026-03-31')
  })

  it('snaps back to the anchor day in longer months', () => {
    // Stored date already clamped to Feb 28, but the start-date anchor (31) restores Mar 31
    expect(advanceBillingDate('2026-02-28', 'monthly', '2024-08-31')).toBe('2026-03-31')
  })

  it('clamps the anchor day to a shorter target month', () => {
    // Day 30 anchor: Feb clamps to 28, then restores 30 in March
    expect(advanceBillingDate('2026-01-30', 'monthly', '2026-01-30')).toBe('2026-03-30')
  })
})

describe('advanceBilling (cycle count)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-23T12:00:00'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('reports how many cycles elapsed', () => {
    // Jan 23 → Feb 23 → Mar 23: two charges elapsed, next due 2026-03-23
    expect(advanceBilling('2026-01-23', 'monthly', '2026-01-23')).toEqual({ date: '2026-03-23', cycles: 2 })
  })

  it('reports zero cycles for a future date', () => {
    expect(advanceBilling('2026-04-01', 'monthly', '2026-04-01')).toEqual({ date: '2026-04-01', cycles: 0 })
  })
})
