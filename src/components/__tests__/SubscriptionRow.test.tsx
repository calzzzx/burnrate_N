import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SubscriptionRow from '../SubscriptionRow'
import type { Subscription } from '../../types'
import '../../i18n'

function makeSub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 'test-1',
    name: 'GitHub',
    icon_key: null,
    sort_order: 1,
    amount: 4,
    currency: 'USD',
    cycle: 'monthly',
    tier: null,
    next_billing: '2026-04-01',
    payment_channel: 'Visa',
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

describe('SubscriptionRow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-23T12:00:00'))

    if (!HTMLElement.prototype.setPointerCapture) {
      HTMLElement.prototype.setPointerCapture = vi.fn()
    }
    if (!HTMLElement.prototype.releasePointerCapture) {
      HTMLElement.prototype.releasePointerCapture = vi.fn()
    }
    if (!HTMLElement.prototype.hasPointerCapture) {
      HTMLElement.prototype.hasPointerCapture = vi.fn().mockReturnValue(false)
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders subscription name', () => {
    render(
      <SubscriptionRow
        subscription={makeSub()}
        onClick={vi.fn()}
        onDelete={vi.fn()}
        isDeleteOpen={false}
        onDeleteOpenChange={vi.fn()}
        onReorderStart={vi.fn()}
        onReorderMove={vi.fn()}
        onReorderEnd={vi.fn()}
        isDragging={false}
      />
    )
    expect(screen.getByText('GitHub')).toBeInTheDocument()
  })

  it('renders payment channel', () => {
    render(
      <SubscriptionRow
        subscription={makeSub({ payment_channel: 'Visa' })}
        onClick={vi.fn()}
        onDelete={vi.fn()}
        isDeleteOpen={false}
        onDeleteOpenChange={vi.fn()}
        onReorderStart={vi.fn()}
        onReorderMove={vi.fn()}
        onReorderEnd={vi.fn()}
        isDragging={false}
      />
    )
    expect(screen.getByText('Visa')).toBeInTheDocument()
  })

  it('does not render payment channel when null', () => {
    render(
      <SubscriptionRow
        subscription={makeSub({ payment_channel: null })}
        onClick={vi.fn()}
        onDelete={vi.fn()}
        isDeleteOpen={false}
        onDeleteOpenChange={vi.fn()}
        onReorderStart={vi.fn()}
        onReorderMove={vi.fn()}
        onReorderEnd={vi.fn()}
        isDragging={false}
      />
    )
    expect(screen.queryByText('Visa')).not.toBeInTheDocument()
  })

  it('renders amount', () => {
    render(
      <SubscriptionRow
        subscription={makeSub({ amount: 10, cycle: 'monthly' })}
        onClick={vi.fn()}
        onDelete={vi.fn()}
        isDeleteOpen={false}
        onDeleteOpenChange={vi.fn()}
        onReorderStart={vi.fn()}
        onReorderMove={vi.fn()}
        onReorderEnd={vi.fn()}
        isDragging={false}
      />
    )
    expect(screen.getByText('$10')).toBeInTheDocument()
  })

  it('renders yearly subscription amount directly', () => {
    render(
      <SubscriptionRow
        subscription={makeSub({ amount: 120, cycle: 'yearly' })}
        onClick={vi.fn()}
        onDelete={vi.fn()}
        isDeleteOpen={false}
        onDeleteOpenChange={vi.fn()}
        onReorderStart={vi.fn()}
        onReorderMove={vi.fn()}
        onReorderEnd={vi.fn()}
        isDragging={false}
      />
    )
    expect(screen.getByText('$120')).toBeInTheDocument()
  })

  it('renders weekly subscription amount', () => {
    render(
      <SubscriptionRow
        subscription={makeSub({ amount: 5, cycle: 'weekly' })}
        onClick={vi.fn()}
        onDelete={vi.fn()}
        isDeleteOpen={false}
        onDeleteOpenChange={vi.fn()}
        onReorderStart={vi.fn()}
        onReorderMove={vi.fn()}
        onReorderEnd={vi.fn()}
        isDragging={false}
      />
    )
    expect(screen.getByText('$5')).toBeInTheDocument()
  })

  it('renders countdown and medium date', () => {
    render(
      <SubscriptionRow
        subscription={makeSub({ next_billing: '2026-03-29' })}
        onClick={vi.fn()}
        onDelete={vi.fn()}
        isDeleteOpen={false}
        onDeleteOpenChange={vi.fn()}
        onReorderStart={vi.fn()}
        onReorderMove={vi.fn()}
        onReorderEnd={vi.fn()}
        isDragging={false}
      />
    )
    // New format: "6d · Mar 29"
    expect(screen.getByText(/6d/)).toBeInTheDocument()
    expect(screen.getByText(/Mar 29/)).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(
      <SubscriptionRow
        subscription={makeSub()}
        onClick={onClick}
        onDelete={vi.fn()}
        isDeleteOpen={false}
        onDeleteOpenChange={vi.fn()}
        onReorderStart={vi.fn()}
        onReorderMove={vi.fn()}
        onReorderEnd={vi.fn()}
        isDragging={false}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'GitHub' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not translate to the right when swiping right from the closed state', () => {
    const onDeleteOpenChange = vi.fn()
    render(
      <SubscriptionRow
        subscription={makeSub()}
        onClick={vi.fn()}
        onDelete={vi.fn()}
        isDeleteOpen={false}
        onDeleteOpenChange={onDeleteOpenChange}
        onReorderStart={vi.fn()}
        onReorderMove={vi.fn()}
        onReorderEnd={vi.fn()}
        isDragging={false}
      />
    )

    const row = screen.getByRole('button', { name: 'GitHub' })
    fireEvent.pointerDown(row, { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(row, { pointerId: 1, clientX: 144, clientY: 100 })
    fireEvent.pointerUp(row, { pointerId: 1, clientX: 144, clientY: 100 })

    expect(row).toHaveStyle({ transform: 'translate3d(0px, 0px, 0) scale(1)' })
    expect(onDeleteOpenChange).toHaveBeenCalledWith(false)
  })

  it('opens delete action when swiping left past the threshold', () => {
    const onDeleteOpenChange = vi.fn()
    render(
      <SubscriptionRow
        subscription={makeSub()}
        onClick={vi.fn()}
        onDelete={vi.fn()}
        isDeleteOpen={false}
        onDeleteOpenChange={onDeleteOpenChange}
        onReorderStart={vi.fn()}
        onReorderMove={vi.fn()}
        onReorderEnd={vi.fn()}
        isDragging={false}
      />
    )

    const row = screen.getByRole('button', { name: 'GitHub' })
    fireEvent.pointerDown(row, { button: 0, pointerId: 2, clientX: 160, clientY: 100 })
    fireEvent.pointerMove(row, { pointerId: 2, clientX: 108, clientY: 100 })
    fireEvent.pointerUp(row, { pointerId: 2, clientX: 108, clientY: 100 })

    expect(onDeleteOpenChange).toHaveBeenCalledWith(true)
  })

  it('keeps dragged rows visually opaque', () => {
    render(
      <SubscriptionRow
        subscription={makeSub()}
        onClick={vi.fn()}
        onDelete={vi.fn()}
        isDeleteOpen={false}
        onDeleteOpenChange={vi.fn()}
        onReorderStart={vi.fn()}
        onReorderMove={vi.fn()}
        onReorderEnd={vi.fn()}
        isDragging
        dragTranslateY={24}
      />
    )

    expect(screen.getByRole('button', { name: 'GitHub' })).toHaveStyle({
      opacity: '0.92',
      transform: 'translate3d(0px, 24px, 0) scale(0.985)',
    })
    expect(screen.getByRole('button', { name: 'GitHub' })).toHaveClass('z-30')
  })

})
