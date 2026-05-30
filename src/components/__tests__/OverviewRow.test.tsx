import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import OverviewRow from '../OverviewRow'
import '../../i18n'

describe('OverviewRow', () => {
  const defaults = {
    monthlyTotal: 117,
    cumulativeTotal: 1404,
    dailyAverage: 3.84,
    activeCount: 12,
    prepaidCount: 0,
    prepaidTotal: 0,
    currency: 'USD',
  }

  it('renders monthly total after animation completes', () => {
    vi.useFakeTimers()
    render(<OverviewRow {...defaults} />)
    // Advance past animation duration (600ms)
    act(() => { vi.advanceTimersByTime(700) })
    expect(screen.getByText('$117')).toBeInTheDocument()
    expect(screen.getByText('/mo')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('renders cumulative total', () => {
    render(<OverviewRow {...defaults} />)
    expect(screen.getByText('$1,404')).toBeInTheDocument()
    expect(screen.getByText('spent')).toBeInTheDocument()
  })

  it('renders daily average', () => {
    render(<OverviewRow {...defaults} />)
    expect(screen.getByText('$3.84')).toBeInTheDocument()
    expect(screen.getByText('/day')).toBeInTheDocument()
  })

  it('renders active count', () => {
    render(<OverviewRow {...defaults} />)
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('subs')).toBeInTheDocument()
  })

  it('handles zero values', () => {
    render(<OverviewRow monthlyTotal={0} cumulativeTotal={0} dailyAverage={0} activeCount={0} prepaidCount={0} prepaidTotal={0} currency="USD" />)
    const zeros = screen.getAllByText('$0')
    expect(zeros).toHaveLength(3) // monthly, cumulative, daily
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
