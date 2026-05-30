import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSubscriptions } from '../useSubscriptions'
import type { ExchangeRates } from '../../lib/currency'
import type { Subscription } from '../../types'

// Mock db module
const mockSubs: Subscription[] = []
const mockDbAdd = vi.fn()
const mockDbUpdate = vi.fn()
const mockDbDelete = vi.fn()
const mockDbReorder = vi.fn()

vi.mock('../../lib/db', () => ({
  getAllSubscriptions: vi.fn(() => Promise.resolve([...mockSubs])),
  addSubscription: (...args: unknown[]) => mockDbAdd(...args),
  updateSubscription: (...args: unknown[]) => mockDbUpdate(...args),
  deleteSubscription: (...args: unknown[]) => mockDbDelete(...args),
  reorderSubscriptions: (...args: unknown[]) => mockDbReorder(...args),
  getTopupTotals: vi.fn(() => Promise.resolve(new Map())),
}))

// Mock invoke for tray title
const mockInvoke = vi.fn().mockResolvedValue(undefined)
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}))

function makeSub(id: string, overrides: Partial<Subscription> = {}): Subscription {
  return {
    id,
    name: `Service ${id}`,
    icon_key: null,
    sort_order: Number(id),
    amount: 10,
    currency: 'USD',
    cycle: 'monthly',
    tier: null,
    next_billing: '2026-04-01',
    payment_channel: null,
    account: null,
    password: null,
    notes: null,
    is_pinned: 0,
    auto_renew: 1,
    billing_type: 'recurring',
    start_date: '2026-01-01',
    total_spent_override: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  }
}

describe('useSubscriptions', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date('2026-03-23T12:00:00'))
    mockSubs.length = 0
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads subscriptions on mount', async () => {
    mockSubs.push(makeSub('1', { name: 'GitHub' }))

    const { result } = renderHook(() => useSubscriptions('USD', null, 'monthly'))

    await waitFor(() => {
      expect(result.current.subscriptions).toHaveLength(1)
      expect(result.current.subscriptions[0].name).toBe('GitHub')
    })
  })

  it('computes monthlyTotal correctly', async () => {
    mockSubs.push(
      makeSub('1', { amount: 10, cycle: 'monthly' }),
      makeSub('2', { amount: 120, cycle: 'yearly' }),
    )

    const { result } = renderHook(() => useSubscriptions('USD', null, 'monthly'))

    await waitFor(() => {
      // 10 + 120/12 = 20
      expect(result.current.monthlyTotal).toBe(20)
    })
  })

  it('computes activeCount', async () => {
    mockSubs.push(makeSub('1'), makeSub('2'), makeSub('3'))

    const { result } = renderHook(() => useSubscriptions('USD', null, 'monthly'))

    await waitFor(() => {
      expect(result.current.activeCount).toBe(3)
    })
  })

  it('converts amounts to display currency using exchange rates', async () => {
    mockSubs.push(makeSub('1', { amount: 100, currency: 'EUR', cycle: 'monthly' }))
    const rates: ExchangeRates = { USD: 1, EUR: 0.92 }

    const { result } = renderHook(() => useSubscriptions('USD', rates, 'monthly'))

    await waitFor(() => {
      // 100 EUR → USD: 100 / 0.92 ≈ 108.70
      expect(result.current.monthlyTotal).toBeCloseTo(108.70, 0)
    })
  })

  it('syncs tray title on total change', async () => {
    mockSubs.push(makeSub('1', { amount: 42, cycle: 'monthly' }))

    renderHook(() => useSubscriptions('USD', null, 'monthly'))

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('update_tray_title', {
        title: '$42/m',
      })
    })
  })

  it('auto-advances past billing dates', async () => {
    // next_billing is in the past
    mockSubs.push(makeSub('1', { next_billing: '2026-03-01', cycle: 'monthly' }))

    const { result } = renderHook(() => useSubscriptions('USD', null, 'monthly'))

    await waitFor(() => {
      // Should be advanced to 2026-04-01
      expect(result.current.subscriptions[0].next_billing).toBe('2026-04-01')
      expect(mockDbUpdate).toHaveBeenCalled()
    })
  })

  it('calls addSubscription and reloads', async () => {
    const { result } = renderHook(() => useSubscriptions('USD', null, 'monthly'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.addSubscription({
        name: 'Test',
        icon_key: null,
        amount: 5,
        currency: 'USD',
        cycle: 'monthly',
        tier: null,
        next_billing: '2026-04-01',
        payment_channel: null,
        account: null,
        password: null,
        notes: null,
        billing_type: 'recurring',
        auto_renew: 1,
        start_date: '2026-01-01',
        total_spent_override: null,
      })
    })

    expect(mockDbAdd).toHaveBeenCalledTimes(1)
  })

  it('calls deleteSubscription and reloads', async () => {
    mockSubs.push(makeSub('1'))
    const { result } = renderHook(() => useSubscriptions('USD', null, 'monthly'))

    await waitFor(() => expect(result.current.subscriptions).toHaveLength(1))

    await act(async () => {
      await result.current.deleteSubscription('1')
    })

    expect(mockDbDelete).toHaveBeenCalledWith('1')
  })

  it('reorders subscriptions and persists manual order', async () => {
    mockSubs.push(makeSub('1'), makeSub('2'))
    const { result } = renderHook(() => useSubscriptions('USD', null, 'monthly'))

    await waitFor(() => expect(result.current.subscriptions).toHaveLength(2))

    await act(async () => {
      await result.current.reorderSubscriptions(['2', '1'])
    })

    expect(mockDbReorder).toHaveBeenCalledWith(['2', '1'])
    expect(result.current.subscriptions.map((sub) => sub.id)).toEqual(['2', '1'])
  })
})
