import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FuzzySearch from '../FuzzySearch'
import '../../i18n'

describe('FuzzySearch', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders search input', () => {
    render(<FuzzySearch onSelect={vi.fn()} onCustom={vi.fn()} favorites={new Set()} onToggleFavorite={vi.fn()} />)
    expect(screen.getByPlaceholderText('Search services...')).toBeInTheDocument()
  })

  it('shows default presets when query is empty', () => {
    render(<FuzzySearch onSelect={vi.fn()} onCustom={vi.fn()} favorites={new Set()} onToggleFavorite={vi.fn()} />)
    expect(screen.getByText('ChatGPT')).toBeInTheDocument()
  })

  it('filters results by typing', async () => {
    render(<FuzzySearch onSelect={vi.fn()} onCustom={vi.fn()} favorites={new Set()} onToggleFavorite={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('Search services...'), { target: { value: 'figma' } })
    expect(screen.getByText('Figma')).toBeInTheDocument()
  })

  it('shows custom service option when typing', async () => {
    render(<FuzzySearch onSelect={vi.fn()} onCustom={vi.fn()} favorites={new Set()} onToggleFavorite={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('Search services...'), { target: { value: 'custom' } })
    expect(screen.getByText(/Add custom service/)).toBeInTheDocument()
  })

  it('shows custom option even when query is empty', () => {
    render(<FuzzySearch onSelect={vi.fn()} onCustom={vi.fn()} favorites={new Set()} onToggleFavorite={vi.fn()} />)
    expect(screen.getByText(/Add custom service/)).toBeInTheDocument()
  })

  it('calls onSelect when a preset is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<FuzzySearch onSelect={onSelect} onCustom={vi.fn()} favorites={new Set()} onToggleFavorite={vi.fn()} />)

    await user.click(screen.getByText('ChatGPT'))
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'ChatGPT', defaultAmount: 8 })
    )
  })

  it('calls onCustom when custom service is clicked', async () => {
    const user = userEvent.setup()
    const onCustom = vi.fn()
    render(<FuzzySearch onSelect={vi.fn()} onCustom={onCustom} favorites={new Set()} onToggleFavorite={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('Search services...'), { target: { value: 'MyTool' } })
    await user.click(screen.getByText(/Add custom service/))
    expect(onCustom).toHaveBeenCalledWith('MyTool')
  })

  it('shows prices for presets', () => {
    render(<FuzzySearch onSelect={vi.fn()} onCustom={vi.fn()} favorites={new Set()} onToggleFavorite={vi.fn()} />)
    // Multiple presets may share the same price
    const priceElements = screen.getAllByText('$20')
    expect(priceElements.length).toBeGreaterThan(0)
  })

  it('shows formatted currency for CNY presets', async () => {
    render(<FuzzySearch onSelect={vi.fn()} onCustom={vi.fn()} favorites={new Set()} onToggleFavorite={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('Search services...'), { target: { value: '腾讯' } })
    // Intl.NumberFormat formats CNY with the locale-appropriate symbol
    expect(screen.getByText(/¥100/)).toBeInTheDocument()
  })

  it('auto-focuses the search input', () => {
    render(<FuzzySearch onSelect={vi.fn()} onCustom={vi.fn()} favorites={new Set()} onToggleFavorite={vi.fn()} />)
    expect(screen.getByPlaceholderText('Search services...')).toHaveFocus()
  })

  it('shows all presets when query is empty', () => {
    const { container } = render(<FuzzySearch onSelect={vi.fn()} onCustom={vi.fn()} favorites={new Set()} onToggleFavorite={vi.fn()} />)
    const items = container.querySelectorAll('[data-item]')
    expect(items.length).toBeGreaterThan(10)
  })

  it('shows favorite presets only in the ★ section when not searching', () => {
    const { container } = render(
      <FuzzySearch
        onSelect={vi.fn()}
        onCustom={vi.fn()}
        favorites={new Set(['ChatGPT'])}
        onToggleFavorite={vi.fn()}
      />
    )

    const starSection = container.querySelector('[data-section="★"]')
    const cSection = container.querySelector('[data-section="C"]')

    expect(starSection?.textContent).toContain('ChatGPT')
    expect(cSection?.textContent).not.toContain('ChatGPT')
  })
})
