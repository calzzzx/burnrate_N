import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Settings from '../Settings'
import type { Settings as SettingsType } from '../../types'
import '../../i18n'

vi.mock('../../lib/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/db')>()
  return {
    ...actual,
    exportData: vi.fn().mockResolvedValue(true),
    importData: vi.fn().mockResolvedValue(true),
  }
})

const defaultSettings: SettingsType = {
  display_currency: 'CNY',
  language: 'en',
  sort_by: 'next_billing',
  tray_display: 'monthly',
  bg_opacity: 42,
  bg_color: 'neutral',
}

const defaultProps = {
  settings: defaultSettings,
  onUpdate: vi.fn(),
  onBack: vi.fn(),
  onClearData: vi.fn(),
  onDataImported: vi.fn(),
}

describe('Settings', () => {
  it('renders title and back button', () => {
    render(<Settings {...defaultProps} />)
    expect(screen.getAllByText('Settings')[0]).toBeInTheDocument()
    expect(screen.getByLabelText('Back')).toBeInTheDocument()
  })

  it('calls onBack when Back is clicked', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<Settings {...defaultProps} onBack={onBack} />)

    await user.click(screen.getByLabelText('Back'))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('shows current currency selection', () => {
    render(<Settings {...defaultProps} />)
    const select = screen.getByDisplayValue(/CNY|人民币/)
    expect(select).toBeInTheDocument()
  })

  it('calls onUpdate when currency is changed', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    render(<Settings {...defaultProps} onUpdate={onUpdate} />)

    await user.selectOptions(screen.getByDisplayValue(/CNY|人民币/), 'EUR')
    expect(onUpdate).toHaveBeenCalledWith('display_currency', 'EUR')
  })

  it('renders language toggle with English and Chinese', () => {
    render(<Settings {...defaultProps} />)
    expect(screen.getByText('English')).toBeInTheDocument()
    expect(screen.getByText('中文')).toBeInTheDocument()
  })

  it('calls onUpdate when language is changed', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    render(<Settings {...defaultProps} onUpdate={onUpdate} />)

    await user.click(screen.getByText('中文'))
    expect(onUpdate).toHaveBeenCalledWith('language', 'zh')
  })

  it('renders tray display options', () => {
    render(<Settings {...defaultProps} />)
    expect(screen.getByText('Monthly')).toBeInTheDocument()
    expect(screen.getByText('Daily')).toBeInTheDocument()
  })

  it('calls onUpdate when tray display is changed', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    render(<Settings {...defaultProps} onUpdate={onUpdate} />)

    await user.click(screen.getByText('Daily'))
    expect(onUpdate).toHaveBeenCalledWith('tray_display', 'daily')
  })

  it('has all expected currency options', () => {
    render(<Settings {...defaultProps} />)
    const currencies = ['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'CAD', 'AUD', 'KRW', 'HKD']
    const select = screen.getByDisplayValue(/CNY|人民币/)
    const options = Array.from((select as HTMLSelectElement).options).map((o) => o.value)
    for (const c of currencies) {
      expect(options).toContain(c)
    }
  })

  it('renders export and import buttons', () => {
    render(<Settings {...defaultProps} />)
    expect(screen.getByText('Export')).toBeInTheDocument()
    expect(screen.getByText('Import')).toBeInTheDocument()
  })

  it('calls exportData when Export is clicked', async () => {
    const user = userEvent.setup()
    const { exportData } = await import('../../lib/db')
    render(<Settings {...defaultProps} />)

    await user.click(screen.getByText('Export'))
    expect(exportData).toHaveBeenCalled()
  })

  it('calls importData and onDataImported when Import succeeds', async () => {
    const user = userEvent.setup()
    const { importData } = await import('../../lib/db')
    const onDataImported = vi.fn()
    render(<Settings {...defaultProps} onDataImported={onDataImported} />)

    await user.click(screen.getByText('Import'))
    expect(importData).toHaveBeenCalled()
    // Wait for async handler
    await vi.waitFor(() => expect(onDataImported).toHaveBeenCalled())
  })
})
