import { useState, useMemo, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { Subscription, BillingCycle, BillingType, ServicePreset, Topup } from '../types'
import { formatAmount, billedTotal } from '../lib/format'
import { getFavoritePresets, toggleFavoritePreset, getTopups, addTopup, deleteTopup } from '../lib/db'
import { SERVICE_PRESETS } from '../lib/presets'
import FuzzySearch from './FuzzySearch'
import ServiceIcon from './ServiceIcon'
import EmojiPicker from './EmojiPicker'
import SegmentedControl from './SegmentedControl'
import FormRow from './FormRow'
import DatePicker from './DatePicker'

interface Props {
  editing?: Subscription | null
  onSave: (data: {
    name: string
    icon_key: string | null
    amount: number
    currency: string
    cycle: BillingCycle
    billing_type: BillingType
    tier: string | null
    next_billing: string
    payment_channel: string | null
    account: string | null
    password: string | null
    notes: string | null
    auto_renew: number
    start_date: string
    total_spent_override: number | null
  }, initialTopup?: number) => void
  onDelete?: () => void
  onCancel: () => void
  onTopupsChanged?: () => void
  saveError?: boolean
  initialStep?: 'search' | 'form' | 'topups'
}

const CURRENCIES = [
  { code: 'CNY', flag: '🇨🇳', en: 'CNY', zh: '人民币' },
  { code: 'USD', flag: '🇺🇸', en: 'USD', zh: '美元' },
  { code: 'EUR', flag: '🇪🇺', en: 'EUR', zh: '欧元' },
  { code: 'GBP', flag: '🇬🇧', en: 'GBP', zh: '英镑' },
  { code: 'JPY', flag: '🇯🇵', en: 'JPY', zh: '日元' },
  { code: 'CAD', flag: '🇨🇦', en: 'CAD', zh: '加元' },
  { code: 'AUD', flag: '🇦🇺', en: 'AUD', zh: '澳元' },
  { code: 'KRW', flag: '🇰🇷', en: 'KRW', zh: '韩元' },
  { code: 'HKD', flag: '🇭🇰', en: 'HKD', zh: '港币' },
]
const CYCLES: BillingCycle[] = ['weekly', 'monthly', 'quarterly', 'biannual', 'nine_monthly', 'yearly']

const PAYMENT_METHODS = [
  { value: '', i18nKey: 'form.paymentNone', hasCard: false },
  { value: 'Alipay', i18nKey: 'payment.alipay', hasCard: false },
  { value: 'WeChat Pay', i18nKey: 'payment.wechat', hasCard: false },
  { value: 'Visa', hasCard: true },
  { value: 'Mastercard', hasCard: true },
  { value: 'PayPal', hasCard: false },
  { value: 'Apple Pay', hasCard: false },
  { value: 'Google Pay', hasCard: false },
  { value: 'Amex', hasCard: true },
  { value: 'UnionPay', i18nKey: 'payment.unionpay', hasCard: true },
] as const

function todayStr() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function fullDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

const sectionClass = 'text-[11px] text-text-quaternary mb-1.5 block font-medium tracking-wider uppercase'

export default function AddSubscription({ editing, onSave, onDelete, onCancel, onTopupsChanged, saveError, initialStep }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'zh' ? 'zh' : 'en'
  const [step, setStep] = useState<'search' | 'form' | 'topups'>(initialStep || (editing ? 'form' : 'search'))

  const [name, setName] = useState(editing?.name || '')
  const [iconKey, setIconKey] = useState<string | null>(editing?.icon_key || null)
  const [billingType, setBillingType] = useState<BillingType>(editing?.billing_type || 'recurring')
  const [amount, setAmount] = useState(editing?.amount?.toString() || '')
  const [currency, setCurrency] = useState(editing?.currency || 'USD')
  const [cycle, setCycle] = useState<BillingCycle>(editing?.cycle || 'monthly')
  const [tier, setTier] = useState<string | null>(editing?.tier || null)
  const [autoRenew, setAutoRenew] = useState(editing ? editing.auto_renew !== 0 : true)
  const [nextBilling, setNextBilling] = useState(editing?.next_billing || todayStr())
  const [startDate, setStartDate] = useState(editing?.start_date || todayStr())
  // Cumulative spend is a stored running total: seeded from the saved value (or the auto
  // default), edited directly, and never re-linked to the amount field.
  const [spentInput, setSpentInput] = useState(
    editing
      ? String(editing.total_spent_override ?? Math.round(billedTotal(editing.amount, editing.cycle, editing.start_date || todayStr(), editing.next_billing) * 100) / 100)
      : ''
  )
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [account, setAccount] = useState(editing?.account || '')
  const [password, setPassword] = useState(editing?.password || '')
  const [notes, setNotes] = useState(editing?.notes || '')
  const [showPassword, setShowPassword] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set())
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Topup state
  const [topups, setTopups] = useState<Topup[]>([])
  const [topupAmount, setTopupAmount] = useState('')
  const [initialTopupAmt, setInitialTopupAmt] = useState('')
  const [confirmDeleteTopupId, setConfirmDeleteTopupId] = useState<string | null>(null)

  useEffect(() => {
    getFavoritePresets().then(names => setFavorites(new Set(names))).catch(() => {})
  }, [])

  // Load topups when editing and billing type is prepaid (local state)
  useEffect(() => {
    if (editing && billingType === 'prepaid') {
      getTopups(editing.id).then(setTopups).catch(() => {})
    }
  }, [editing, billingType])

  const topupTotal = useMemo(() => topups.reduce((sum, t) => sum + t.amount, 0), [topups])

  const topupMonthly = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    return topups
      .filter((tp) => { const d = new Date(tp.created_at); return d.getFullYear() === y && d.getMonth() === m })
      .reduce((sum, tp) => sum + tp.amount, 0)
  }, [topups])

  const topupYearly = useMemo(() => {
    const y = new Date().getFullYear()
    return topups
      .filter((tp) => new Date(tp.created_at).getFullYear() === y)
      .reduce((sum, tp) => sum + tp.amount, 0)
  }, [topups])

  const handleToggleFavorite = useCallback(async (name: string) => {
    await toggleFavoritePreset(name)
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }, [])

  async function handleAddTopup() {
    if (!editing) return
    const parsed = parseFloat(topupAmount)
    if (isNaN(parsed) || parsed <= 0) return
    await addTopup(editing.id, parsed, currency, null)
    const updated = await getTopups(editing.id)
    setTopups(updated)
    setTopupAmount('')
    onTopupsChanged?.()
  }

  async function handleDeleteTopup(id: string) {
    if (!editing) return
    await deleteTopup(id)
    const updated = await getTopups(editing.id)
    setTopups(updated)
    onTopupsChanged?.()
  }

  // Parse existing payment_channel into method + last4
  const parsePaymentChannel = (raw: string | null) => {
    if (!raw) return { method: '', last4: '' }
    const match = raw.match(/^(.+?)\s*····(\d{4})$/)
    if (match) return { method: match[1], last4: match[2] }
    return { method: raw, last4: '' }
  }
  const parsed = parsePaymentChannel(editing?.payment_channel ?? null)
  const [paymentMethod, setPaymentMethod] = useState(parsed.method)
  const [cardLast4, setCardLast4] = useState(parsed.last4)

  const showCardInput = PAYMENT_METHODS.find(m => m.value === paymentMethod && 'hasCard' in m && m.hasCard) !== undefined

  // Look up available tiers for the current service (by name or iconKey)
  const availableTiers = useMemo(() => {
    const preset = SERVICE_PRESETS.find(
      (p) => p.name === name || (iconKey && p.iconKey === iconKey)
    )
    return preset?.tiers ?? null
  }, [name, iconKey])

  function handlePresetSelect(preset: ServicePreset | null) {
    if (!preset) {
      setStep('form')
      return
    }

    setName(preset.name)
    setIconKey(preset.iconKey)

    if (preset.defaultBillingType) {
      setBillingType(preset.defaultBillingType)
    }

    if (preset.tiers && preset.tiers.length > 0) {
      const defaultTier = preset.tiers[0]
      setTier(defaultTier.name)
      setAmount(defaultTier.amount.toString())
      setCurrency(defaultTier.currency)
      setCycle(defaultTier.cycle)
    } else {
      setAmount(preset.defaultAmount.toString())
      setCurrency(preset.defaultCurrency)
      setCycle(preset.defaultCycle)
      setTier(null)
    }

    setStep('form')
  }

  function handleTierChange(tierName: string) {
    if (!availableTiers) return
    const selected = availableTiers.find((t) => t.name === tierName)
    if (selected) {
      setTier(selected.name)
      setAmount(selected.amount.toString())
      setCurrency(selected.currency)
      setCycle(selected.cycle)
    }
  }

  function handleCustom(customName: string) {
    setName(customName)
    setIconKey(null)
    setTier(null)
    setStep('form')
  }

  const selectedTierDetails = useMemo(() => {
    if (!tier || !availableTiers) return null
    return availableTiers.find((item) => item.name === tier) ?? null
  }, [tier, availableTiers])

  function handleSave() {
    const errors = new Set<string>()
    if (!name.trim()) errors.add('name')
    if (billingType === 'recurring') {
      const parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) errors.add('amount')
    }
    if (errors.size > 0) {
      setValidationErrors(errors)
      return
    }
    setValidationErrors(new Set())

    // Format payment channel
    let channel: string | null = null
    if (paymentMethod) {
      channel = paymentMethod
      if (cardLast4.length === 4) {
        channel += ` ····${cardLast4}`
      }
    }

    const initialTopup = !editing && billingType === 'prepaid' ? (parseFloat(initialTopupAmt) || 0) : undefined

    onSave({
      name: name.trim(),
      icon_key: iconKey,
      amount: billingType === 'prepaid' ? 0 : parseFloat(amount) || 0,
      currency,
      cycle,
      billing_type: billingType,
      tier: billingType === 'prepaid' ? null : (tier || null),
      next_billing: billingType === 'prepaid' ? todayStr() : nextBilling,
      payment_channel: channel,
      account: account.trim() || null,
      password: password || null,
      notes: notes.trim() || null,
      auto_renew: billingType === 'prepaid' ? 0 : (autoRenew ? 1 : 0),
      start_date: billingType === 'prepaid' ? todayStr() : startDate,
      // Store the cumulative as an absolute value (the billed-so-far default if untouched);
      // it then grows one charge per cycle and is no longer tied to the amount field
      total_spent_override: billingType === 'prepaid'
        ? null
        : (spentInput === ''
            ? Math.round(billedTotal(parseFloat(amount) || 0, cycle, startDate, nextBilling) * 100) / 100
            : (parseFloat(spentInput) || 0)),
    }, initialTopup)
  }

  const currencyInfo = CURRENCIES.find((c) => c.code === currency)
  const paymentInfo = PAYMENT_METHODS.find(m => m.value === paymentMethod)

  // Step: search
  if (step === 'search') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
          <h2 className="text-[14px] font-semibold text-text-primary">{t('form.add')}</h2>
          <button
            onClick={onCancel}
            className="w-7 h-7 rounded-[10px] flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-white/[0.06] transition-colors cursor-default"
            aria-label={t('form.cancel')}
          >
            <svg viewBox="0 0 24 24" className="w-[15px] h-[15px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>
        <FuzzySearch onSelect={handlePresetSelect} onCustom={handleCustom} favorites={favorites} onToggleFavorite={handleToggleFavorite} />
      </div>
    )
  }

  // Step: topup history
  if (step === 'topups' && editing) {
    return (
      <div className="flex flex-col h-full">
        {/* Header with back button */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
          <h2 className="text-[14px] font-semibold text-text-primary">{t('form.topupSection')}</h2>
          <button
            onClick={() => initialStep === 'topups' ? onCancel() : setStep('form')}
            className="w-7 h-7 rounded-[10px] flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-white/[0.06] transition-colors cursor-default"
            aria-label={t('settings.back')}
          >
            <svg viewBox="0 0 24 24" className="w-[15px] h-[15px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>

        {/* Service identity */}
        <div className="flex items-center gap-2.5 px-3 pb-2.5">
          <ServiceIcon iconKey={iconKey} name={name || '?'} size="lg" />
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-text-primary truncate">{name}</div>
            <div className="text-[11px] text-text-quaternary font-numeric">
              {topups.length > 0
                ? `${topups.length} ${t('form.topupRecords')} · ${t('form.topupMonthlyShort')} ${formatAmount(topupMonthly, currency)} · ${t('form.topupYearlyShort')} ${formatAmount(topupYearly, currency)}`
                : t('form.topupEmpty')}
            </div>
          </div>
        </div>

        <div className="mx-3 border-t border-border mb-2" />

        <div className="flex-1 overflow-y-auto px-3 pb-2">
          {/* Add topup: amount input + accent button */}
          <div className="flex items-center gap-2 mb-3">
            <input
              type="number"
              value={topupAmount}
              onChange={(e) => {
                const v = e.target.value
                if (v === '' || /^\d*\.?\d{0,2}$/.test(v)) setTopupAmount(v)
              }}
              placeholder="0.00"
              step="1"
              min="0"
              className="mac-field flex-1 text-[15px] font-numeric text-text-primary px-3 py-[7px] outline-none min-w-0 placeholder:text-text-tertiary"
            />
            <button
              onClick={handleAddTopup}
              className="mac-button mac-button-primary text-[12px] py-[7px] px-3.5 cursor-default font-semibold shrink-0"
            >
              {t('form.addTopup')}
            </button>
          </div>

          {/* Topup ledger */}
          {topups.length > 0 ? (
            <div className="mac-field overflow-hidden">
              {topups.map((tp, idx) => (
                <div key={tp.id}>
                  {idx > 0 && <div className="border-t border-white/[0.05] mx-3" />}
                  <div
                    className="flex items-center justify-between px-3 py-2 group"
                    onMouseLeave={() => setConfirmDeleteTopupId(null)}
                  >
                    <div className="flex flex-col">
                      <span className="font-numeric text-[13px] text-text-primary font-medium leading-tight">
                        +{formatAmount(tp.amount, tp.currency)}
                      </span>
                      <span className="font-numeric text-[10px] text-text-quaternary leading-tight mt-0.5">
                        {fullDate(tp.created_at.split(/[T ]/)[0])}
                      </span>
                    </div>
                    {confirmDeleteTopupId === tp.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => { handleDeleteTopup(tp.id); setConfirmDeleteTopupId(null) }}
                          className="text-[11px] text-red-400 hover:text-red-300 cursor-default font-medium"
                        >
                          {t('form.delete')}
                        </button>
                        <span className="text-text-quaternary/50 text-[11px]">|</span>
                        <button
                          onClick={() => setConfirmDeleteTopupId(null)}
                          className="text-[11px] text-text-tertiary hover:text-text-secondary cursor-default"
                        >
                          {t('form.cancel')}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteTopupId(tp.id)}
                        className="w-5 h-5 flex items-center justify-center rounded-full text-text-quaternary invisible group-hover:visible hover:text-red-400 hover:bg-red-500/[0.08] cursor-default"
                      >
                        <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                          <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center pt-8 pb-4">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-text-quaternary/40 mb-2" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
              </svg>
              <div className="text-text-quaternary text-[12px]">{t('form.topupEmpty')}</div>
            </div>
          )}
        </div>

        {/* Total footer */}
        {topups.length > 0 && (
          <>
            <div className="mx-3 border-t border-border" />
            <div className="flex items-center justify-between px-3 py-2.5 text-[12px]">
              <span className="text-text-tertiary">{t('form.topupTotal')}</span>
              <span className="font-numeric text-text-primary font-semibold">
                {formatAmount(topupTotal, currency)}
              </span>
            </div>
          </>
        )}
      </div>
    )
  }

  // Step: form
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
        <h2 className="text-[14px] font-semibold text-text-primary">
          {editing
            ? (billingType === 'prepaid' ? t('form.editPrepaid') : t('form.edit'))
            : t('form.add')}
        </h2>
        <button
          onClick={onCancel}
          className="w-7 h-7 rounded-[10px] flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-white/[0.06] transition-colors cursor-default"
          aria-label={t('form.cancel')}
        >
          <svg viewBox="0 0 24 24" className="w-[15px] h-[15px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-3 space-y-2.5">
        {/* Hero: icon + name + tier */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="group relative block rounded-[11px] cursor-default"
              title={t('form.emojiIconTitle')}
            >
              <ServiceIcon iconKey={iconKey} name={name || '?'} size="lg" />
              <span className="absolute inset-0 flex items-center justify-center rounded-[11px] bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-150" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
                </svg>
              </span>
            </button>
            {showEmojiPicker && (
              <EmojiPicker
                lang={lang}
                onSelect={(emoji) => {
                  setIconKey(`emoji:${emoji}`)
                  setShowEmojiPicker(false)
                }}
                onClose={() => setShowEmojiPicker(false)}
                onResetDefault={iconKey?.startsWith('emoji:') ? () => {
                  setIconKey(SERVICE_PRESETS.find((p) => p.name === name)?.iconKey ?? null)
                  setShowEmojiPicker(false)
                } : undefined}
                resetLabel={t('form.restoreDefaultIcon')}
              />
            )}
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setValidationErrors((prev) => { const n = new Set(prev); n.delete('name'); return n }) }}
            placeholder={t('form.name')}
            className={`flex-1 min-w-0 mac-field text-text-primary text-[13px] px-3 py-[7px] outline-none ${validationErrors.has('name') ? '!border-red-500/50' : ''}`}
          />
          {billingType === 'recurring' && tier && (
            <span className="text-[11px] px-1.5 py-[2px] rounded-full bg-accent-dim text-accent font-medium shrink-0 tracking-wide uppercase">
              {tier}
            </span>
          )}
        </div>

        {/* Tier selector */}
        {billingType === 'recurring' && tier && availableTiers && availableTiers.length > 0 && (
          <div>
            <SegmentedControl
              options={availableTiers.map((item) => ({ value: item.name, label: item.name }))}
              value={tier}
              onChange={handleTierChange}
            />
            {selectedTierDetails && (
              <div className="flex items-center justify-between px-1 pt-1.5">
                <span className="text-[11px] text-text-tertiary">{t('form.selectTier')}</span>
                <span className="text-[11px] font-numeric text-text-secondary">
                  {formatAmount(selectedTierDetails.amount, selectedTierDetails.currency)}
                  <span className="text-text-tertiary ml-0.5">
                    /{selectedTierDetails.cycle === 'monthly' ? 'mo' : selectedTierDetails.cycle === 'yearly' ? 'yr' : 'wk'}
                  </span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Pricing / Topup card — billing type is the first row */}
        <div>
          <label className={sectionClass}>{billingType === 'recurring' ? t('form.pricingSection') : t('form.topupSection')}</label>
          <div className="mac-field overflow-hidden">
            <FormRow label={t('form.billingType')}>
              <SegmentedControl
                options={[
                  { value: 'recurring' as BillingType, label: t('form.billingRecurring') },
                  { value: 'prepaid' as BillingType, label: t('form.billingPrepaid') },
                ]}
                value={billingType}
                onChange={setBillingType}
              />
            </FormRow>

            {billingType === 'recurring' ? (
              <>
                <FormRow label={t('form.amount')} error={validationErrors.has('amount')}>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === '' || /^\d*\.?\d{0,2}$/.test(v)) {
                        setAmount(v)
                        setValidationErrors((prev) => { const n = new Set(prev); n.delete('amount'); return n })
                      }
                    }}
                    placeholder="0.00"
                    step="1"
                    min="0"
                    className="bg-transparent text-[15px] font-numeric text-text-primary text-right outline-none min-w-0 w-full placeholder:text-text-tertiary"
                  />
                </FormRow>
                <FormRow label={t('form.currency')}>
                  <div className="relative flex items-center">
                    <span className="text-text-secondary text-[13px] pointer-events-none">
                      {currencyInfo?.flag}{' '}
                      {currencyInfo?.[lang] ?? currency}
                    </span>
                    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-text-quaternary ml-1 shrink-0 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 4.5 6 7.5 9 4.5" />
                    </svg>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-default text-[13px]"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.flag} {c[lang]}</option>
                      ))}
                    </select>
                  </div>
                </FormRow>
                <FormRow label={t('form.cycle')} last>
                  <div className="relative flex items-center">
                    <span className="text-text-secondary text-[13px] pointer-events-none">
                      {t(`cycle.${cycle}`)}
                    </span>
                    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-text-quaternary ml-1 shrink-0 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 4.5 6 7.5 9 4.5" />
                    </svg>
                    <select
                      value={cycle}
                      onChange={(e) => setCycle(e.target.value as BillingCycle)}
                      className="absolute inset-0 opacity-0 cursor-default text-[13px]"
                    >
                      {CYCLES.map((c) => (
                        <option key={c} value={c}>{t(`cycle.${c}`)}</option>
                      ))}
                    </select>
                  </div>
                </FormRow>
              </>
            ) : (
              <>
                <FormRow label={t('form.currency')}>
                  <div className="relative flex items-center">
                    <span className="text-text-secondary text-[13px] pointer-events-none">
                      {currencyInfo?.flag}{' '}
                      {currencyInfo?.[lang] ?? currency}
                    </span>
                    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-text-quaternary ml-1 shrink-0 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 4.5 6 7.5 9 4.5" />
                    </svg>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-default text-[13px]"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.flag} {c[lang]}</option>
                      ))}
                    </select>
                  </div>
                </FormRow>
                {editing ? (
                  <>
                    <FormRow label={t('form.topupTotal')}>
                      <span className="font-numeric text-[13px] text-text-primary">
                        {formatAmount(topupTotal, currency)}
                      </span>
                    </FormRow>
                    <FormRow label={`${topups.length} ${t('form.topupRecords')}`} last>
                      <button
                        onClick={() => setStep('topups')}
                        className="flex items-center gap-0.5 text-[12px] text-accent cursor-default hover:text-accent/80 transition-colors"
                      >
                        {t('form.viewHistory')}
                        <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M4.5 2.5l4 3.5-4 3.5" />
                        </svg>
                      </button>
                    </FormRow>
                  </>
                ) : (
                  <FormRow label={t('form.amount')} last>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={initialTopupAmt}
                      onChange={(e) => setInitialTopupAmt(e.target.value)}
                      step="1"
                      min="0"
                      placeholder="0"
                      className="bg-transparent text-[13px] font-numeric text-text-primary text-right outline-none w-20 min-w-0 placeholder:text-text-tertiary"
                    />
                  </FormRow>
                )}
              </>
            )}
          </div>
        </div>

        {billingType === 'recurring' && (
          <div>
            <label className={sectionClass}>{t('form.billingSection')}</label>
            <div className="mac-field overflow-hidden">
                <FormRow label={t('form.autoRenew')}>
                  <button
                    type="button"
                    onClick={() => setAutoRenew(!autoRenew)}
                    className={`relative w-[34px] h-[20px] rounded-full transition-colors duration-200 cursor-default ${autoRenew ? 'bg-accent' : 'bg-white/[0.15]'}`}
                  >
                    <div
                      className="absolute top-[2px] left-[2px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                      style={{ transform: autoRenew ? 'translateX(14px)' : 'translateX(0)' }}
                    />
                  </button>
                </FormRow>
                <FormRow label={autoRenew ? t('form.nextBilling') : t('form.expiryDate')}>
                  <DatePicker
                    value={nextBilling}
                    onChange={(v) => {
                      setNextBilling(v)
                      const amt = parseFloat(amount) || 0
                      setSpentInput(amt > 0 ? String(Math.round(billedTotal(amt, cycle, startDate, v) * 100) / 100) : '')
                    }}
                  />
                </FormRow>
                <FormRow label={t('form.startDate')}>
                  <DatePicker
                    value={startDate}
                    onChange={(v) => {
                      setStartDate(v)
                      const amt = parseFloat(amount) || 0
                      setSpentInput(amt > 0 ? String(Math.round(billedTotal(amt, cycle, v, nextBilling) * 100) / 100) : '')
                    }}
                  />
                </FormRow>
                <FormRow label={t('form.totalSpent')} last>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={spentInput}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === '' || /^\d*\.?\d{0,2}$/.test(v)) setSpentInput(v)
                    }}
                    step="1"
                    min="0"
                    placeholder="0"
                    className="bg-transparent text-[13px] font-numeric text-text-primary text-right outline-none w-20 min-w-0 placeholder:text-text-tertiary"
                  />
                </FormRow>
              </div>
            </div>
        )}

        {/* Payment card (shared) */}
        <div>
          <label className={sectionClass}>{t('form.paymentChannel')}</label>
          <div className="mac-field overflow-hidden">
            <FormRow label={t('form.paymentChannel')} last={!showCardInput}>
              <div className="relative flex items-center">
                <span className="text-text-secondary text-[13px] pointer-events-none">
                  {paymentInfo && 'i18nKey' in paymentInfo && paymentInfo.i18nKey
                    ? t(paymentInfo.i18nKey)
                    : (paymentMethod || t('form.paymentNone'))}
                </span>
                <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-text-quaternary ml-1 shrink-0 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 4.5 6 7.5 9 4.5" />
                </svg>
                <select
                  value={paymentMethod}
                  onChange={(e) => { setPaymentMethod(e.target.value); if (!PAYMENT_METHODS.find(m => m.value === e.target.value && 'hasCard' in m && m.hasCard)) setCardLast4('') }}
                  className="absolute inset-0 opacity-0 cursor-default text-[13px]"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {'i18nKey' in m && m.i18nKey ? t(m.i18nKey) : (m.value || t('form.paymentNone'))}
                    </option>
                  ))}
                </select>
              </div>
            </FormRow>
            {showCardInput && (
              <FormRow label={t('form.cardLast4')} last>
                <input
                  type="text"
                  value={cardLast4}
                  onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="0000"
                  maxLength={4}
                  className="bg-transparent text-[13px] font-numeric text-text-primary text-right outline-none w-16 placeholder:text-text-tertiary tracking-widest"
                />
              </FormRow>
            )}
          </div>
        </div>

        {/* Account card */}
        <div>
          <label className={sectionClass}>{t('form.accountSection')}</label>
          <div className="mac-field overflow-hidden">
            <div className="flex items-center px-3 py-[7px]">
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder={t('form.account')}
                className="flex-1 bg-transparent text-[13px] text-text-primary outline-none min-w-0 placeholder:text-text-tertiary"
              />
            </div>
            <div className="border-t border-white/[0.05] mx-3" />
            <div className="flex items-center px-3 py-[7px]">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('form.password')}
                className="flex-1 bg-transparent text-[13px] text-text-primary outline-none min-w-0 placeholder:text-text-tertiary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="shrink-0 w-6 h-6 flex items-center justify-center text-text-quaternary hover:text-text-secondary transition-colors cursor-default"
              >
                {showPassword ? (
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
                    <circle cx="8" cy="8" r="2" />
                    <path d="M2.5 2.5l11 11" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
                    <circle cx="8" cy="8" r="2" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className={sectionClass}>{t('form.notes')}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('form.notesPlaceholder')}
            rows={3}
            className="mac-field w-full text-text-primary text-[13px] px-3 py-2 outline-none resize-none placeholder:text-text-tertiary"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="px-3 py-2.5 space-y-2">
        {saveError && (
          <div className="text-[12px] text-red-400 text-center">{t('form.saveError')}</div>
        )}
        {showDeleteConfirm ? (
          <div className="flex gap-2">
            <button
              onClick={onDelete}
              className="mac-button mac-button-danger flex-1 text-[13px] py-[7px] cursor-default"
            >
              {t('form.deleteConfirm')}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="mac-button mac-button-secondary flex-1 text-[13px] py-[7px] text-text-secondary cursor-default"
            >
              {t('form.cancel')}
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            {editing && onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="mac-button mac-button-secondary text-[13px] py-[7px] px-3 text-text-tertiary hover:text-red-400 hover:border-red-500/20 cursor-default"
              >
                {t('form.delete')}
              </button>
            )}
            <button
              onClick={handleSave}
              className="mac-button mac-button-primary flex-1 text-[13px] py-[7px] cursor-default font-semibold"
            >
              {t('form.save')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
