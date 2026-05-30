import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddSubscription from '../AddSubscription'
import type { Subscription } from '../../types'
import '../../i18n'

vi.mock('../../lib/db', () => ({
  getFavoritePresets: vi.fn(() => Promise.resolve([])),
  toggleFavoritePreset: vi.fn(() => Promise.resolve()),
}))

const mockEditing: Subscription = {
  id: 'edit-1',
  name: 'GitHub',
  icon_key: 'Github',
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
  total_spent_override: 48,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
}

const mockEditingWithTier: Subscription = {
  ...mockEditing,
  id: 'edit-2',
  name: 'Claude',
  icon_key: 'Claude',
  amount: 100,
  tier: 'Max 5x',
}

describe('AddSubscription', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('add mode (no editing)', () => {
    it('starts in search step', () => {
      render(<AddSubscription onSave={vi.fn()} onCancel={vi.fn()} />)
      expect(screen.getByPlaceholderText('Search services...')).toBeInTheDocument()
      expect(screen.getByText('Add Subscription')).toBeInTheDocument()
    })

    it('shows preset results on empty search', () => {
      render(<AddSubscription onSave={vi.fn()} onCancel={vi.fn()} />)
      expect(screen.getByText('ChatGPT')).toBeInTheDocument()
    })

    it('filters presets by search query', async () => {
      render(<AddSubscription onSave={vi.fn()} onCancel={vi.fn()} />)

      fireEvent.change(screen.getByPlaceholderText('Search services...'), { target: { value: 'github' } })
      expect(screen.getByText('GitHub')).toBeInTheDocument()
    })

    it('shows custom service option when typing', async () => {
      render(<AddSubscription onSave={vi.fn()} onCancel={vi.fn()} />)

      fireEvent.change(screen.getByPlaceholderText('Search services...'), { target: { value: 'MyService' } })
      expect(screen.getByText(/Add custom service/)).toBeInTheDocument()
      expect(screen.getByText(/MyService/)).toBeInTheDocument()
    })

    it('shows tier segmented control for tiered preset (ChatGPT)', async () => {
      render(<AddSubscription onSave={vi.fn()} onCancel={vi.fn()} />)

      fireEvent.click(screen.getByText('ChatGPT'))
      expect(screen.getByDisplayValue('ChatGPT')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Plus' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Pro 20x' })).toBeInTheDocument()
      expect(screen.getByText('Select a plan')).toBeInTheDocument()
    })

    it('updates the form when switching tiers', async () => {
      const user = userEvent.setup()
      render(<AddSubscription onSave={vi.fn()} onCancel={vi.fn()} />)

      await user.click(screen.getByText('ChatGPT'))
      await user.click(screen.getByRole('button', { name: 'Pro 20x' }))
      expect(screen.getByDisplayValue('ChatGPT')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('0.00')).toHaveValue(200)
    })

    it('goes directly to form for non-tiered preset', async () => {
      const user = userEvent.setup()
      render(<AddSubscription onSave={vi.fn()} onCancel={vi.fn()} />)

      fireEvent.change(screen.getByPlaceholderText('Search services...'), { target: { value: 'perplexity' } })
      await user.click(screen.getByText('Perplexity'))
      expect(screen.getByDisplayValue('Perplexity')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('0.00')).toHaveValue(20)
    })

    it('calls onCancel when back button is clicked in search step', async () => {
      const user = userEvent.setup()
      const onCancel = vi.fn()
      render(<AddSubscription onSave={vi.fn()} onCancel={onCancel} />)

      await user.click(screen.getByLabelText('Cancel'))
      expect(onCancel).toHaveBeenCalledOnce()
    })

    it('uses the local calendar date for default next billing', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-23T00:30:00+08:00'))

      try {
        render(<AddSubscription onSave={vi.fn()} onCancel={vi.fn()} />)

        fireEvent.click(screen.getByText('ChatGPT'))
        // Both next-billing and start-date default to today's local date
        expect(screen.getAllByText('2026/03/23').length).toBeGreaterThan(0)
      } finally {
        vi.useRealTimers()
      }
    })
  })

  describe('edit mode', () => {
    it('starts directly in form step', () => {
      render(<AddSubscription editing={mockEditing} onSave={vi.fn()} onDelete={vi.fn()} onCancel={vi.fn()} />)
      expect(screen.getByText('Edit Subscription')).toBeInTheDocument()
      expect(screen.getByDisplayValue('GitHub')).toBeInTheDocument()
    })

    it('pre-fills all fields from editing subscription', () => {
      render(<AddSubscription editing={mockEditing} onSave={vi.fn()} onDelete={vi.fn()} onCancel={vi.fn()} />)
      expect(screen.getByDisplayValue('GitHub')).toBeInTheDocument()
      expect(screen.getByDisplayValue('4')).toBeInTheDocument()
      expect(screen.getByText('2026/04/01')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Visa')).toBeInTheDocument()
    })

    it('shows tier pill in edit mode for tiered subscription', () => {
      render(<AddSubscription editing={mockEditingWithTier} onSave={vi.fn()} onDelete={vi.fn()} onCancel={vi.fn()} />)
      expect(screen.getByText('Max 5x', { selector: 'span' })).toBeInTheDocument()
    })

    it('shows Delete button in edit mode', () => {
      render(<AddSubscription editing={mockEditing} onSave={vi.fn()} onDelete={vi.fn()} onCancel={vi.fn()} />)
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    it('shows delete confirmation on first Delete click', async () => {
      const user = userEvent.setup()
      render(<AddSubscription editing={mockEditing} onSave={vi.fn()} onDelete={vi.fn()} onCancel={vi.fn()} />)

      await user.click(screen.getByText('Delete'))
      expect(screen.getByText('Confirm Delete')).toBeInTheDocument()
    })

    it('calls onDelete on confirmation click', async () => {
      const user = userEvent.setup()
      const onDelete = vi.fn()
      render(<AddSubscription editing={mockEditing} onSave={vi.fn()} onDelete={onDelete} onCancel={vi.fn()} />)

      await user.click(screen.getByText('Delete'))
      await user.click(screen.getByText('Confirm Delete'))
      expect(onDelete).toHaveBeenCalledOnce()
    })
  })

  describe('form validation', () => {
    it('does not call onSave with empty name', async () => {
      const user = userEvent.setup()
      const onSave = vi.fn()
      render(<AddSubscription editing={mockEditing} onSave={onSave} onCancel={vi.fn()} />)

      const nameInput = screen.getByDisplayValue('GitHub')
      await user.clear(nameInput)
      await user.click(screen.getByText('Save'))
      expect(onSave).not.toHaveBeenCalled()
    })

    it('does not call onSave with zero amount', async () => {
      const user = userEvent.setup()
      const onSave = vi.fn()
      render(<AddSubscription editing={mockEditing} onSave={onSave} onCancel={vi.fn()} />)

      const amountInput = screen.getByDisplayValue('4')
      await user.clear(amountInput)
      await user.type(amountInput, '0')
      await user.click(screen.getByText('Save'))
      expect(onSave).not.toHaveBeenCalled()
    })

    it('does not call onSave with invalid amount', async () => {
      const user = userEvent.setup()
      const onSave = vi.fn()
      render(<AddSubscription editing={mockEditing} onSave={onSave} onCancel={vi.fn()} />)

      const amountInput = screen.getByDisplayValue('4')
      await user.clear(amountInput)
      await user.click(screen.getByText('Save'))
      expect(onSave).not.toHaveBeenCalled()
    })

    it('calls onSave with correct data including tier', async () => {
      const user = userEvent.setup()
      const onSave = vi.fn()
      render(<AddSubscription editing={mockEditing} onSave={onSave} onCancel={vi.fn()} />)

      await user.click(screen.getByText('Save'))
      expect(onSave).toHaveBeenCalledWith({
        name: 'GitHub',
        icon_key: 'Github',
        amount: 4,
        currency: 'USD',
        cycle: 'monthly',
        tier: null,
        next_billing: '2026-04-01',
        payment_channel: 'Visa',
        account: null,
        password: null,
        notes: null,
        auto_renew: 1,
        start_date: '2026-01-01',
        total_spent_override: 48,
        billing_type: 'recurring',
      }, undefined)
    })
  })

  describe('cycle selector', () => {
    it('renders cycle dropdown with all options', () => {
      render(<AddSubscription editing={mockEditing} onSave={vi.fn()} onCancel={vi.fn()} />)
      const select = screen.getByDisplayValue('Mo')
      const options = Array.from((select as HTMLSelectElement).options).map(o => o.value)
      expect(options).toEqual(['weekly', 'monthly', 'quarterly', 'biannual', 'nine_monthly', 'yearly'])
    })

    it('allows changing cycle', async () => {
      const user = userEvent.setup()
      const onSave = vi.fn()
      render(<AddSubscription editing={mockEditing} onSave={onSave} onCancel={vi.fn()} />)

      await user.selectOptions(screen.getByDisplayValue('Mo'), 'yearly')
      await user.click(screen.getByText('Save'))
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ cycle: 'yearly' }), undefined)
    })
  })
})
